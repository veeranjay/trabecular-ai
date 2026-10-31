"""Persistent workspace API. Bind to loopback; Next supplies a private bridge key.

Local mode is explicit. Hosted mode requires Supabase auth and storage together;
it never quietly falls back to a shared anonymous workspace on a provider error.
"""
from __future__ import annotations
import asyncio
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
import hashlib
import json
import os
import re
from pathlib import Path
import secrets
import subprocess
import sys
import threading
import time
import zipfile
from io import BytesIO
import httpx
from fastapi import FastAPI,Depends,Header,HTTPException,Request,UploadFile,File,Form
from fastapi.responses import JSONResponse,Response
from fastapi.middleware.gzip import GZipMiddleware
from settings import configuration,ROOT
from models import CaseCreate,RevisionCreate,PreparationUpdate,JobCreate,PlateParameters,VoiceToolRequest,GeometryPreview
from storage import Repository,DATA,uid,timestamp
from geometry import build,metadata
from reference_assets import freeze_reference,PREPARED,read_snapshot
from imported_anatomy import ingest,build_import,read_import,IMPORTS,MAX_BYTES
from engine_fingerprint import numerical_signature
from process_control import stop_process_tree

DATA.mkdir(parents=True,exist_ok=True)
KEY_PATH=DATA/'.service_key'
if not KEY_PATH.exists():
    try:
        with KEY_PATH.open('x') as stream:stream.write(secrets.token_urlsafe(48))
    except FileExistsError:pass
BRIDGE_KEY=KEY_PATH.read_text().strip()
CONFIG=configuration()
if (CONFIG['storage_mode']=='supabase')!=(CONFIG['auth_mode']=='supabase'):
    raise RuntimeError('Hosted storage and authentication must be enabled together.')
if CONFIG['storage_mode']=='supabase':
    if not CONFIG['supabase']:raise RuntimeError('Supabase credentials are missing; local fallback is disabled.')
    from hosted_storage import HostedRepository
    repo=HostedRepository()
else:repo=Repository()
pool=ThreadPoolExecutor(max_workers=1,thread_name_prefix='trab-local')
lock=threading.RLock();processes={};recovered=set()

@asynccontextmanager
async def lifespan(app):
    repo.recover()
    if CONFIG['storage_mode']=='local':ensure_snapshots('local')
    yield
    with lock:
        for process in processes.values():
            if process.poll() is None:stop_process_tree(process)
    pool.shutdown(wait=False,cancel_futures=True)

app=FastAPI(title='Trabecular workspace',version='0.3.0',lifespan=lifespan)
app.add_middleware(GZipMiddleware,minimum_size=1000)

@app.exception_handler(KeyError)
async def missing(request,error):return JSONResponse({'detail':str(error).strip("'")},status_code=404)

@app.exception_handler(ValueError)
async def invalid_input(request,error):return JSONResponse({'detail':str(error)},status_code=422)

def workspace(x_trab_bridge:str=Header(default=''),authorization:str=Header(default=''),x_trab_public_host:str=Header(default='localhost')):
    if not secrets.compare_digest(x_trab_bridge,BRIDGE_KEY):raise HTTPException(403,'Workspace bridge authentication failed.')
    if CONFIG['auth_mode']=='local':
        if x_trab_public_host not in ('localhost','127.0.0.1','[::1]','::1','testserver'):
            raise HTTPException(403,'Local workspace mode is only available through localhost. Configure Supabase sign-in for hosting.')
        return 'local'
    if not authorization.startswith('Bearer '):raise HTTPException(401,'Sign in to your workspace.')
    try:
        user=repo.client.auth.get_user(authorization[7:]).user
        if not user:raise ValueError('Missing user')
    except Exception:raise HTTPException(401,'Your sign-in expired. Sign in again.')
    with lock:
        if user.id not in recovered:
            repo.recover_workspace(user.id);recovered.add(user.id)
    return user.id

def save_event(ws,kind,body,case_id=None):
    saved=repo.put(ws,kind,body,case_id=case_id)
    repo.event(ws,{'type':f'{kind}.updated','id':saved['id'],'case_id':case_id})
    return saved

def ensure_snapshots(ws):
    for case in repo.list(ws,'case',limit=1000):
        if case['anatomy_id'] not in ('male','female'):continue
        snapshot=case.get('anatomy_snapshot') or freeze_reference(case['anatomy_id'])
        if not case.get('anatomy_snapshot') or 'cad_version' not in case:
            repo.put(ws,'case',{**case,'anatomy_snapshot':snapshot,'cad_version':case.get('cad_version',3)})
        for revision in repo.list(ws,'revision',case['id'],limit=1000):
            if not revision.get('anatomy_snapshot') or 'cad_version' not in revision:
                repo.put(ws,'revision',{**revision,'anatomy_snapshot':revision.get('anatomy_snapshot') or snapshot,
                    'cad_version':revision.get('cad_version',3)},case_id=case['id'])

def persist_assets(ws,kind,identity,folder,names):
    if CONFIG['storage_mode']!='supabase':return
    try:repo.get(ws,f'{kind}_assets',identity);return
    except KeyError:pass
    for name in names:
        repo.client.storage.from_('trab-artifacts').upload(f'{ws}/{kind}/{identity}/{name}',(folder/name).read_bytes(),
            file_options={'content-type':'application/octet-stream','upsert':'true'})
    repo.put(ws,f'{kind}_assets',{'id':identity,'files':list(names)})

def ensure_assets(ws,case,snapshot=None):
    if case.get('import_id'):
        identity=case['import_id'];folder=IMPORTS/identity;names=('source.stl','surface.stl','metadata.json');kind='imports'
    else:
        identity=snapshot or case.get('anatomy_snapshot')
        if not identity:return
        folder=PREPARED/identity;names=('proximal_left.stl','proximal_right.stl','distal.stl','snapshot.json');kind='prepared'
    if not all((folder/name).exists() for name in names) and CONFIG['storage_mode']=='supabase':
        folder.mkdir(parents=True,exist_ok=True)
        for name in names:
            temporary=folder/f'{name}.{uid()}.tmp'
            temporary.write_bytes(repo.client.storage.from_('trab-artifacts').download(f'{ws}/{kind}/{identity}/{name}'))
            temporary.replace(folder/name)
    persist_assets(ws,kind,identity,folder,names)

def assemble_case(ws,case,params,regions,snapshot=None,orientation=None,cad_version=3):
    ensure_assets(ws,case,snapshot)
    if case.get('import_id'):return build_import(case['import_id'],params,regions,orientation or case.get('import_orientation'))
    return build(case['anatomy_id'],params,regions,snapshot or case.get('anatomy_snapshot'),cad_version)

@app.get('/health')
def health():return {'service':'trab-workspace','version':'0.3.0','status':'ready'}

@app.get('/capabilities')
def capabilities(ws=Depends(workspace)):
    return {**CONFIG,'cloud_execution_available':False,'local_gpu':'RTX 3050 Laptop / 4 GB',
        'model':'jaw-exact-tet-v4','model_qualified':False,
        'note':'Local 3D model is experimental. Fitted plate mesh, attachment and anatomy qualification remain outstanding.'}

def create_case(ws,payload):
    anatomy=metadata(payload.anatomy_id)
    case=save_event(ws,'case',{'id':uid(),'name':payload.name,'anatomy_id':payload.anatomy_id,
        'regions':anatomy['regions'],'units':'mm','reviewed':False,'source_sha256':anatomy['source_sha256'],
        'anatomy_snapshot':freeze_reference(payload.anatomy_id),'cad_version':5})
    ensure_assets(ws,case)
    revision=create_revision(ws,case['id'],RevisionCreate(params=PlateParameters(),label='Baseline'))
    case=save_event(ws,'case',{**case,'latest_revision_id':revision['id']})
    return case

def create_revision(ws,case_id,payload):
    case=repo.get(ws,'case',case_id)
    parent=None
    if payload.parent_id:
        parent=repo.get(ws,'revision',payload.parent_id)
        if parent['case_id']!=case_id:raise HTTPException(409,'The parent revision belongs to another case.')
    if payload.preparation_from_parent:
        if not parent:raise HTTPException(422,'Choose the source revision for inherited preparation.')
        case={**case,'regions':parent['regions'],'reviewed':parent['preparation_reviewed'],
            'import_orientation':parent.get('import_orientation'),'anatomy_snapshot':parent.get('anatomy_snapshot')}
    cad_version=payload.cad_version or (parent or case).get('cad_version',3)
    assembly=assemble_case(ws,case,payload.params.model_dump(),case['regions'],case.get('anatomy_snapshot'),case.get('import_orientation'),cad_version)
    revision=save_event(ws,'revision',{'id':uid(),'case_id':case_id,'label':payload.label,'parent_id':payload.parent_id,
        'params':assembly.params,'regions':case['regions'],'preparation_reviewed':case['reviewed'],
        'geometry_hash':assembly.geometry_hash,'geometry_checks':assembly.checks,'anatomy_snapshot':case.get('anatomy_snapshot'),
        'import_orientation':case.get('import_orientation'),'cad_version':cad_version},case_id)
    save_event(ws,'case',{**case,'latest_revision_id':revision['id'],'cad_version':cad_version})
    return revision

@app.post('/bootstrap')
def bootstrap(ws=Depends(workspace)):
    with lock:
        if not repo.list(ws,'case'):create_case(ws,CaseCreate(name='Mandibular advancement',anatomy_id='male'))
    return state(ws)

@app.get('/state')
def state(ws=Depends(workspace)):
    ensure_snapshots(ws)
    return {'cases':repo.list(ws,'case'),'revisions':repo.list(ws,'revision',limit=1000),
            'jobs':repo.list(ws,'job',limit=200),'capabilities':capabilities(ws)}

@app.post('/cases',status_code=201)
def cases_create(payload:CaseCreate,ws=Depends(workspace)):
    if payload.anatomy_id not in ('male','female'):raise HTTPException(422,'Choose one of the prepared reference anatomies.')
    return create_case(ws,payload)

@app.post('/imports',status_code=201)
async def imports_create(file:UploadFile=File(...),units:str=Form(...),ws=Depends(workspace)):
    content=await file.read(MAX_BYTES+1)
    try:meta=await asyncio.to_thread(ingest,content,file.filename or '',units)
    except ValueError as error:raise HTTPException(422,str(error))
    case=save_event(ws,'case',{'id':uid(),'name':meta['name'],'anatomy_id':meta['id'],'import_id':meta['import_id'],
        'import_orientation':[0,0,0],'import_metadata':meta,'regions':[],'reviewed':False,'units':'mm',
        'source_sha256':meta['source_sha256'],'analysis_ready':False})
    ensure_assets(ws,case)
    revision=create_revision(ws,case['id'],RevisionCreate(params=PlateParameters(),label='Imported surface'))
    return repo.get(ws,'case',case['id'])

@app.put('/cases/{case_id}/preparation')
def preparation(case_id:str,payload:PreparationUpdate,ws=Depends(workspace)):
    case=repo.get(ws,'case',case_id)
    ids=[r.id for r in payload.regions]
    if len(set(ids))!=len(ids):raise HTTPException(422,'Region names must be unique.')
    if not case.get('import_id') and (sum(r.kind=='support' for r in payload.regions)<2 or not any(r.kind=='load' for r in payload.regions) or not any(r.kind=='keep_out' for r in payload.regions)):
        raise HTTPException(422,'Retain two supports, at least one load and a keep-out annotation.')
    return save_event(ws,'case',{**case,**payload.model_dump()})

@app.post('/cases/{case_id}/revisions',status_code=201)
def revisions_create(case_id:str,payload:RevisionCreate,ws=Depends(workspace)):
    return create_revision(ws,case_id,payload)

def revision_assembly(ws,case_id,revision_id):
    case=repo.get(ws,'case',case_id);revision=repo.get(ws,'revision',revision_id)
    if revision['case_id']!=case_id:raise HTTPException(409,'Revision belongs to a different case.')
    assembly=assemble_case(ws,case,revision['params'],revision['regions'],revision.get('anatomy_snapshot'),revision.get('import_orientation'),revision.get('cad_version',3))
    if assembly.geometry_hash!=revision['geometry_hash']:raise HTTPException(409,'Prepared geometry changed. Save a new revision.')
    return case,revision,assembly

@app.get('/cases/{case_id}/revisions/{revision_id}/geometry')
def geometry(case_id:str,revision_id:str,ws=Depends(workspace)):
    return revision_assembly(ws,case_id,revision_id)[2].packet()

@app.post('/cases/{case_id}/preview')
def preview(case_id:str,payload:GeometryPreview,ws=Depends(workspace)):
    case=repo.get(ws,'case',case_id)
    try:return assemble_case(ws,case,payload.params.model_dump(),[r.model_dump() for r in payload.regions],case.get('anatomy_snapshot'),payload.import_orientation,payload.cad_version).packet()
    except ValueError as error:raise HTTPException(422,str(error))

def job_directory(identifier,ws='local'):
    if not re.fullmatch(r'[A-Za-z0-9_-]{1,180}',identifier) or not re.fullmatch(r'[A-Za-z0-9_-]{1,180}',ws):
        raise HTTPException(422,'Invalid artifact identity.')
    if CONFIG['storage_mode']=='supabase' and ws=='local':raise HTTPException(403,'A private artifact requires its owner workspace.')
    return DATA/'artifacts'/identifier if ws=='local' else DATA/'artifacts'/ws/identifier

def update_job(ws,identifier,**changes):
    with lock:
        job=repo.get(ws,'job',identifier)
        job.update(changes)
        return save_event(ws,'job',job,job['case_id'])

def execute_job(ws,identifier):
    process=None;timer=None;memory_guard=None
    try:
        with lock:
            job=repo.get(ws,'job',identifier)
            if job['state']=='cancelled':return
            cached=None if job.get('force_recompute') else next((item for item in repo.list(ws,'job',limit=1000) if item['id']!=identifier and item['state']=='completed' and item.get('fingerprint')==job.get('fingerprint')),None)
            if cached:
                update_job(ws,identifier,state='completed',stage='Reused matching computed result',progress=1,
                    cache_source_job_id=cached['id'],summary=cached.get('summary'),reused=True,provider='local-cache',finished_at=timestamp())
                return
            update_job(ws,identifier,state='running',started_at=timestamp(),stage='Starting local analysis')
            directory=job_directory(identifier,ws);directory.mkdir(parents=True,exist_ok=True)
            payload={**job['input'],'job_id':identifier,'result_path':str(directory/'result.json'),'partial_path':str(directory/'partial.json'),
                     'fields_path':str(directory/'fields.npz')}
            (directory/'input.json').write_text(json.dumps(payload,allow_nan=False))
            from source_snapshot import create as snapshot_source
            snapshot_source(directory,job['input']['numerical_signature'])
            update_job(ws,identifier,source_snapshot=True)
            process=subprocess.Popen([sys.executable,str(ROOT/'worker.py'),str(directory/'input.json')],cwd=ROOT,
                stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,encoding='utf-8',errors='replace',
                start_new_session=os.name!='nt',
                creationflags=subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0)
            processes[identifier]=process
        timed_out=threading.Event()
        def timeout():
            if process.poll() is None:timed_out.set();stop_process_tree(process)
        duration=7200 if job['action']=='study' else 10800 if job['action']=='optimize' else 300
        timer=threading.Timer(duration,timeout);timer.daemon=True;timer.start()
        from process_control import MemoryGuard
        memory_guard=MemoryGuard(process)
        with (directory/'worker.log').open('w',encoding='utf-8') as log:
            for line in process.stdout:
                log.write(line);log.flush()
                if line.startswith('TRAB_EVENT '):
                    event=json.loads(line[11:]);update_job(ws,identifier,stage=event['stage'],progress=event['progress'])
        code=process.wait()
        with lock:
            current=repo.get(ws,'job',identifier)
            if current['state'] in ('cancelled','cancelling'):
                update_job(ws,identifier,state='cancelled',stage='Cancelled',finished_at=timestamp());return
        if timed_out.is_set():raise RuntimeError(f'The local job exceeded its {duration} second limit. Partial evidence is retained.')
        if memory_guard.exhausted.is_set():raise RuntimeError('The calculation was stopped to preserve available system memory. Inputs and logs are retained. Use a smaller mesh or a compute host with more RAM; no cloud fallback was started.')
        if not (directory/'result.json').exists():raise RuntimeError('The worker exited without a result. Inputs and logs are retained.')
        result=json.loads((directory/'result.json').read_text())
        if code!=0 or 'error' in result:raise RuntimeError(result.get('error','Local analysis failed.'))
        if CONFIG['storage_mode']=='supabase':
            repo.client.storage.from_('trab-artifacts').upload(f'{ws}/{identifier}/result.json',(directory/'result.json').read_bytes(),
                file_options={'content-type':'application/json','upsert':'true'})
            if (directory/'fields.npz').exists():
                repo.client.storage.from_('trab-artifacts').upload(f'{ws}/{identifier}/fields.npz',(directory/'fields.npz').read_bytes(),
                    file_options={'content-type':'application/octet-stream','upsert':'true'})
            repo.client.storage.from_('trab-artifacts').upload(f'{ws}/{identifier}/numerical-source.zip',(directory/'numerical-source.zip').read_bytes(),
                file_options={'content-type':'application/zip','upsert':'true'})
        summary={key:value for key,value in result.items() if key not in ('fields','mesh','scenarios','candidates')}
        update_job(ws,identifier,state='completed',stage='Complete',progress=1,finished_at=timestamp(),summary=summary)
    except Exception as error:
        update_job(ws,identifier,state='failed',stage='Analysis failed',error=str(error),finished_at=timestamp())
    finally:
        if timer:timer.cancel()
        if memory_guard:memory_guard.close()
        with lock:processes.pop(identifier,None)

@app.post('/jobs',status_code=202)
def jobs_create(payload:JobCreate,ws=Depends(workspace)):
    case,revision,assembly=revision_assembly(ws,payload.case_id,payload.revision_id)
    if case.get('import_id') and payload.action not in ('benchmark3d','benchmark_beam'):
        raise HTTPException(409,'This STL is inspection-only. Supply segmentation, fixation and boundary/keep-out registrations before analysis.')
    if payload.model!='gpu3d' and payload.action!='benchmark_beam':raise HTTPException(422,'Use the separate reduced-model workspace for beam estimates.')
    if payload.action not in ('benchmark3d','benchmark_beam') and not revision['preparation_reviewed']:
        raise HTTPException(409,'Review the load, support and keep-out annotations in Prepare, then save a revision.')
    input_data={'action':payload.action,'anatomy_id':case['anatomy_id'],'params':revision['params'],'regions':revision['regions'],
        'quality':payload.quality,'geometry_hash':assembly.geometry_hash,'device':CONFIG['compute_device'],
        'solver_version':'jaw-exact-tet-v4' if revision.get('cad_version')==5 else 'jaw-mixed-tet-v2',
        'anatomy_snapshot':revision.get('anatomy_snapshot'),'cad_version':revision.get('cad_version',3),'numerical_signature':numerical_signature()}
    if payload.action=='study':
        references={}
        for identifier in ('male','female'):
            if identifier==case['anatomy_id']:source_case,source_revision=case,revision
            else:
                candidates=[r for r in repo.list(ws,'revision',limit=1000) if r.get('preparation_reviewed') and
                    any(c['id']==r['case_id'] and c['anatomy_id']==identifier for c in repo.list(ws,'case',limit=1000))]
                if not candidates:raise HTTPException(409,f'Review and save a {identifier} reference case before queuing this study.')
                source_revision=candidates[0];source_case=repo.get(ws,'case',source_revision['case_id'])
            ensure_assets(ws,source_case,source_revision.get('anatomy_snapshot'))
            if source_revision.get('cad_version',3)!=revision.get('cad_version',3):
                raise HTTPException(409,'Use the same fixation version on both reviewed reference cases before comparing them in a study.')
            family={key:revision['params'][key] for key in ('thickness','width','load','min_sf','min_clearance')}
            references[identifier]={'case_id':source_case['id'],'revision_id':source_revision['id'],
                'source_params':source_revision['params'],'params':{**source_revision['params'],**family},'regions':source_revision['regions'],
                'anatomy_snapshot':source_revision.get('anatomy_snapshot'),'cad_version':source_revision.get('cad_version',3)}
        input_data['study_references']=references
    fingerprint=hashlib.sha256(json.dumps(input_data,sort_keys=True).encode()).hexdigest()
    with lock:
        previous=repo.list(ws,'job',limit=1000)
        if not payload.force:
            match=next((j for j in previous if j.get('fingerprint')==fingerprint and
                (j['state']=='completed' or (j['case_id']==case['id'] and j['revision_id']==revision['id'] and j['state'] in ('queued','running')))),None)
            if match:
                if match['case_id']==case['id'] and match['revision_id']==revision['id']:return {**match,'reused':True}
                return save_event(ws,'job',{'id':uid(),'case_id':case['id'],'revision_id':revision['id'],'action':payload.action,
                    'state':'completed','stage':'Reused matching computed result','progress':1,'input':input_data,'fingerprint':fingerprint,
                    'provider':'local-cache','cache_source_job_id':match['id'],'summary':match.get('summary'),'reused':True,'finished_at':timestamp()},case['id'])
        from verification_lease import active as verification_active
        if verification_active(DATA):raise HTTPException(409,'Local calculation verification is using the GPU. Saved results and editing remain available; start a new calculation after verification finishes.')
        if sum(j['state'] in ('queued','running') for j in previous)>=20:raise HTTPException(429,'Twenty jobs are already queued. Cancel or wait before adding more.')
        job=save_event(ws,'job',{'id':uid(),'case_id':case['id'],'revision_id':revision['id'],'action':payload.action,
            'state':'queued','stage':'Queued for local GPU','progress':0,'input':input_data,'fingerprint':fingerprint,'provider':'local',
            'force_recompute':payload.force},case['id'])
        pool.submit(execute_job,ws,job['id'])
    return job

@app.post('/jobs/{identifier}/cancel')
def cancel(identifier:str,ws=Depends(workspace)):
    with lock:
        job=repo.get(ws,'job',identifier)
        if job['state'] not in ('queued','running','cancelling'):return job
        process=processes.get(identifier)
        if process and process.poll() is None:stop_process_tree(process)
        return update_job(ws,identifier,state='cancelled',stage='Cancelled',finished_at=timestamp())

@app.post('/jobs/{identifier}/apply-winner')
def apply_winner(identifier:str,ws=Depends(workspace)):
    with lock:
        job=repo.get(ws,'job',identifier)
        if job['action']!='optimize' or job['state']!='completed':raise HTTPException(409,'Choose a completed design search.')
        if job.get('applied_revision_id'):return repo.get(ws,'revision',job['applied_revision_id'])
        report=read_result(ws,identifier);winner=report.get('winner')
        if not winner or not winner.get('result',{}).get('qualified'):raise HTTPException(409,'No verified design is available. Review the search evidence and unresolved gates.')
        numerical_signature.cache_clear()
        if job['input']['numerical_signature']!=numerical_signature():raise HTTPException(409,'The numerical source changed. Re-verify this design before applying it.')
        revision=create_revision(ws,job['case_id'],RevisionCreate(params=PlateParameters(**winner['params']),parent_id=job['revision_id'],preparation_from_parent=True,label='Verified search design'))
        update_job(ws,identifier,applied_revision_id=revision['id']);return revision

def read_result(ws,identifier,partial=False):
    job=repo.get(ws,'job',identifier)
    if not partial and job.get('cache_source_job_id'):return read_result(ws,job['cache_source_job_id'])
    filename='partial.json' if partial else 'result.json'
    path=job_directory(identifier,ws)/filename
    if not path.exists() and not partial and CONFIG['storage_mode']=='supabase' and job['state']=='completed':
        return json.loads(repo.client.storage.from_('trab-artifacts').download(f'{ws}/{identifier}/result.json'))
    if not path.exists():raise HTTPException(409,'This job does not have a saved result yet.')
    body=json.loads(path.read_text())
    if not partial and job['action']=='solve' and str(body.get('model','')).startswith('jaw-'):
        if body.get('geometry_hash')!=job['input']['geometry_hash'] or body.get('params')!=job['input']['params']:
            raise HTTPException(409,'This result does not match its recorded geometry and inputs. Replay the saved revision before using its fields.')
    if partial and job['state'] in ('cancelled','failed') and 'scenarios' in body:
        body={**body,'state':job['state'],'job_state':job['state'],'scenarios':[
            {**row,'checkpoint_state':row['state'],'state':{'pending':'not_run','running':'interrupted'}.get(row['state'],row['state'])}
            for row in body['scenarios']]}
    if partial and job['state'] in ('cancelled','failed') and 'candidates' in body:
        body={**body,'state':job['state'],'job_state':job['state'],'reason':f"Search {job['state']}. Retained calculations are partial evidence, not a verified design."}
        for phase in ('candidates','refinement','envelope'):
            if phase in body:body[phase]=[{**row,'checkpoint_state':row['state'],'state':'interrupted' if row['state'] in ('running','checking_geometry') else row['state']} for row in body[phase]]
    return body

@app.get('/jobs/{identifier}/result')
def result(identifier:str,partial:bool=False,ws=Depends(workspace)):return read_result(ws,identifier,partial)

@app.get('/jobs/{identifier}/study.csv')
def study_csv(identifier:str,ws=Depends(workspace)):
    from studies import scenario_csv
    job=repo.get(ws,'job',identifier)
    if job['action']!='study':raise HTTPException(409,'Select a cross-anatomy study.')
    report=read_result(ws,identifier,partial=job['state']!='completed')
    return Response(scenario_csv(report),media_type='text/csv',headers={'Content-Disposition':'attachment; filename="trabecular-study.csv"'})

def volume_fields(ws,identifier):
    job=repo.get(ws,'job',identifier)
    if job.get('cache_source_job_id'):return volume_fields(ws,job['cache_source_job_id'])
    if job['state']!='completed' or job['action']!='solve':raise HTTPException(409,'No completed volume-field artifact is available for this job.')
    path=job_directory(identifier,ws)/'fields.npz'
    if path.exists():return path.read_bytes()
    if CONFIG['storage_mode']=='supabase':
        try:return repo.client.storage.from_('trab-artifacts').download(f'{ws}/{identifier}/fields.npz')
        except Exception:pass
    raise HTTPException(409,'This earlier result has no retained volume-field artifact. Replay its saved inputs to generate one.')

@app.get('/jobs/{identifier}/fields')
def fields(identifier:str,ws=Depends(workspace)):
    return Response(volume_fields(ws,identifier),media_type='application/octet-stream',headers={'Content-Disposition':'attachment; filename="trabecular-fields.npz"'})

@app.post('/jobs/{identifier}/verification')
def verify_saved_calculation(identifier:str,ws=Depends(workspace)):
    import hashlib,numpy as np
    from verification_jaw import audit,VERIFIER_SOURCE_SHA256
    from studies import atomic_json
    job=repo.get(ws,'job',identifier)
    if job['state']!='completed' or job['action']!='solve':raise HTTPException(409,'Choose a completed jaw calculation.')
    result=read_result(ws,identifier)
    if not str(result.get('model','')).startswith('jaw-'):raise HTTPException(409,'This checker supports saved tetrahedral jaw calculations.')
    source=job
    while source.get('cache_source_job_id'):source=repo.get(ws,'job',source['cache_source_job_id'])
    folder=job_directory(source['id'],ws);path=folder/'fields.npz'
    content=None
    if not path.exists():content=volume_fields(ws,identifier)
    with np.load(BytesIO(content) if content is not None else path,allow_pickle=False) as data:
        required={'metadata','positions_mm','displacement_mm','tetrahedra','element_connectivity','element_degree',
            'young_modulus_mpa','poisson_ratio','fixed_nodes','applied_nodal_force_n','quadrature_stress_mpa',
            'material_id','bond_slave_nodes','bond_master_nodes','bond_barycentric_weights','bond_stiffness_n_per_mm'}
        if not required.issubset(data.files):raise HTTPException(409,'This earlier field artifact lacks the data required for an independent check. Replay its saved inputs to generate a complete artifact.')
        metadata=json.loads(str(data['metadata']))
    if metadata.get('geometry_hash')!=job['input']['geometry_hash'] or metadata.get('params')!=job['input']['params']:
        raise HTTPException(409,'These saved fields do not match the recorded geometry and inputs.')
    if content is not None:
        folder.mkdir(parents=True,exist_ok=True)
        temporary=folder/f'{uid()}.fields.tmp';temporary.write_bytes(content);temporary.replace(path)
    current_verifier=hashlib.sha256((ROOT/'verification_jaw.py').read_bytes()).hexdigest()
    if current_verifier!=VERIFIER_SOURCE_SHA256:raise HTTPException(409,'The calculation checker was updated. Restart the local analysis service before checking this run.')
    report=audit(path)
    if hashlib.sha256((ROOT/'verification_jaw.py').read_bytes()).hexdigest()!=current_verifier:
        raise HTTPException(409,'The checker changed during verification. Restart and check the saved run again.')
    report.update(source_job_id=source['id'],requested_job_id=identifier,verifier_source_sha256=current_verifier)
    atomic_json(folder/'independent-audit.json',report)
    return report

@app.get('/events')
def events(after:int=0,ws=Depends(workspace)):return repo.events(ws,max(0,after))

def pdf_evidence(ws,case,revision,assembly):
    from report import generate
    job=next((job for job in repo.list(ws,'job',case['id']) if job['revision_id']==revision['id'] and job['action']=='solve' and job['state']=='completed'),None)
    return generate(case,revision,assembly,job,read_result(ws,job['id']) if job else None)

@app.get('/cases/{case_id}/revisions/{revision_id}/report')
def pdf_report(case_id:str,revision_id:str,ws=Depends(workspace)):
    case,revision,assembly=revision_assembly(ws,case_id,revision_id)
    return Response(pdf_evidence(ws,case,revision,assembly),media_type='application/pdf',
                    headers={'Content-Disposition':'attachment; filename="trabecular-case.pdf"'})

@app.get('/cases/{case_id}/revisions/{revision_id}/export')
def export(case_id:str,revision_id:str,ws=Depends(workspace)):
    case,revision,assembly=revision_assembly(ws,case_id,revision_id)
    stream=BytesIO()
    with zipfile.ZipFile(stream,'w',zipfile.ZIP_DEFLATED) as archive:
        archive.writestr('manifest.json',json.dumps({'case':case,'revision':revision,'anatomy':assembly.anatomy,
            'geometry_hash':assembly.geometry_hash,'checks':assembly.checks,
            'export_type':'Named assembly components; not a single fabrication solid.'},indent=2))
        archive.writestr('report.pdf',pdf_evidence(ws,case,revision,assembly))
        for entry in assembly.meshes:
            archive.writestr(f"assembly/{entry['id']}.stl",entry['mesh'].export(file_type='stl'))
        if case.get('import_id'):
            _,source_folder=read_import(case['import_id'])
            archive.write(source_folder/'source.stl','source/original.stl')
        elif revision.get('anatomy_snapshot'):
            _,source_folder=read_snapshot(revision['anatomy_snapshot'])
            for name in ('snapshot.json','proximal_left.stl','proximal_right.stl','distal.stl'):
                archive.write(source_folder/name,f'preparation/{name}')
        archive.write(ROOT/'requirements.txt','environment/requirements.txt')
        checks=ROOT.parent/'docs'/'verification'/'local-3d-checks.json'
        if checks.exists():archive.write(checks,'verification/calculation-checks.json')
        for job in repo.list(ws,'job',case_id):
            if job['revision_id']!=revision_id:continue
            data=None
            try:data=read_result(ws,job['id'],partial=job['action'] in ('study','optimize') and job['state']!='completed')
            except HTTPException as error:
                if error.status_code!=409:raise
            if data:data.pop('fields',None)
            archive.writestr(f"evidence/{job['id']}.json",json.dumps({'job':job,'result':data},indent=2))
            if job['action']=='study' and data and 'scenarios' in data:
                from studies import scenario_csv
                archive.writestr(f"studies/{job['id']}.csv",scenario_csv(data))
                for row in data['scenarios']:
                    if row.get('id'):archive.writestr(f"studies/{job['id']}/{row['id']}.json",json.dumps(row,indent=2))
            source_id=job.get('cache_source_job_id',job['id']);repo.get(ws,'job',source_id)
            log=job_directory(source_id,ws)/'worker.log'
            if log.exists():archive.write(log,f"logs/{job['id']}.log")
            source=job_directory(source_id,ws)/'numerical-source.zip'
            if source.exists():archive.write(source,f"source/{job['id']}.zip")
            audit=job_directory(source_id,ws)/'independent-audit.json'
            if audit.exists():archive.write(audit,f"verification/{job['id']}-independent-audit.json")
            if job['state']=='completed' and job['action']=='solve' and (job.get('summary') or {}).get('field_artifact'):
                archive.writestr(f"fields/{job['id']}.npz",volume_fields(ws,job['id']))
    return Response(stream.getvalue(),media_type='application/zip',headers={'Content-Disposition':'attachment; filename="trabecular-case.zip"'})

@app.post('/voice/token')
async def voice_token(ws=Depends(workspace)):
    key=os.getenv('DEEPGRAM_API_KEY')
    if not key:raise HTTPException(503,'Add DEEPGRAM_API_KEY to backend/.env to connect voice.')
    async with httpx.AsyncClient(timeout=15) as client:
        response=await client.post('https://api.deepgram.com/v1/auth/grant',headers={'Authorization':f'Token {key}'},json={'ttl_seconds':30})
    if response.status_code>=400:raise HTTPException(502,'Deepgram could not issue a temporary token. Check the backend key permissions.')
    body=response.json()
    return {'access_token':body['access_token'],'expires_in':body.get('expires_in',30)}

@app.post('/voice/tools')
def voice_tools(payload:VoiceToolRequest,ws=Depends(workspace)):
    with lock:
        fingerprint=hashlib.sha256(json.dumps(payload.model_dump(),sort_keys=True).encode()).hexdigest()
        try:
            cached=repo.get(ws,'voice_call',payload.call_id)
            if cached['fingerprint']!=fingerprint:raise HTTPException(409,'A function ID was reused with different arguments.')
            return cached['response']
        except KeyError:pass
        case,revision,assembly=revision_assembly(ws,payload.case_id,payload.revision_id)
        args=payload.arguments
        if args.get('geometry_hash') and args['geometry_hash']!=revision['geometry_hash']:
            raise HTTPException(409,'Voice context is stale. Save the current design before this action.')
        if payload.name=='inspect_results':
            response={'case':case['name'],'revision':revision['label'],'model':'jaw-exact-tet-v4' if revision.get('cad_version')==5 else 'jaw-mixed-tet-v2','qualified':False,
                'geometry_checks':assembly.checks,'jobs':[j for j in repo.list(ws,'job',case['id']) if j['revision_id']==revision['id']][:10]}
        elif payload.name=='focus_region':
            region=next((r for r in assembly.regions if r['id']==args.get('region_id')),None)
            if not region:raise HTTPException(422,'Choose a registered region from this case.')
            response={'focus_region':region}
        elif payload.name=='propose_parameters':
            if case.get('import_id'):raise HTTPException(409,'This imported surface has no fixation registration. It is inspection-only.')
            changes=args.get('changes')
            if not isinstance(changes,dict):raise HTTPException(422,'Provide parameter changes as an object.')
            try:params=PlateParameters.model_validate({**revision['params'],**changes}).model_dump()
            except ValueError:raise HTTPException(422,'The parameter proposal contains an unknown or out-of-range value.')
            proposed=assemble_case(ws,case,params,revision['regions'],revision.get('anatomy_snapshot'),revision.get('import_orientation'),revision.get('cad_version',3))
            proposal=save_event(ws,'proposal',{'id':uid(),'case_id':case['id'],'revision_id':revision['id'],
                'params':params,'changes':changes,'checks':proposed.checks,'state':'pending'},case['id'])
            response={'proposal':proposal,'message':'Proposal only. An explicit apply instruction is required to create a revision.'}
        elif payload.name=='apply_parameters':
            proposal=repo.get(ws,'proposal',str(args.get('proposal_id','')))
            if proposal['case_id']!=case['id'] or proposal['revision_id']!=revision['id']:raise HTTPException(409,'The proposal belongs to another case or revision.')
            if proposal['state']=='applied':response={'revision':repo.get(ws,'revision',proposal['applied_revision_id'])}
            else:
                created=create_revision(ws,case['id'],RevisionCreate(params=PlateParameters(**proposal['params']),parent_id=revision['id'],preparation_from_parent=True,label='Voice-applied design'))
                save_event(ws,'proposal',{**proposal,'state':'applied','applied_revision_id':created['id']},case['id'])
                response={'revision':created}
        elif payload.name in ('run_analysis','optimize_plate','run_study'):
            action={'run_analysis':'solve','optimize_plate':'optimize','run_study':'study'}[payload.name]
            response={'job':jobs_create(JobCreate(case_id=case['id'],revision_id=revision['id'],action=action,quality='preview'),ws)}
            response['message']='Local job accepted. This is an acknowledgement, not completed analysis.'
        elif payload.name=='cancel_job':
            job=repo.get(ws,'job',str(args.get('job_id','')))
            if job['case_id']!=case['id'] or job['revision_id']!=revision['id']:raise HTTPException(409,'The job belongs to another case or revision.')
            response={'job':cancel(job['id'],ws)}
        else:raise HTTPException(422,'Unsupported voice tool.')
        repo.put(ws,'voice_call',{'id':payload.call_id,'fingerprint':fingerprint,'response':response},case_id=case['id'])
        return response

if __name__=='__main__':
    import uvicorn,socket
    port=int(os.getenv('TRAB_API_PORT','8100'))
    # Claim the port before recovery runs: a duplicate launcher must not mark
    # another live service's active jobs as interrupted.
    with socket.socket(socket.AF_INET,socket.SOCK_STREAM) as listener:
        listener.bind(('127.0.0.1',port));listener.listen(2048)
        (DATA/'service.pid.json').write_text(json.dumps({'pid':os.getpid(),'root':str(ROOT)}))
        server=uvicorn.Server(uvicorn.Config(app,host='127.0.0.1',port=port))
        server.run(sockets=[listener])
