"""Bounded dimensional/placement search with refinement and a nine-case envelope.

Unqualified calculations may inform screening, but cannot produce a verified
winner. Every stage retains the exact parameters, quality and computed evidence.
"""
import hashlib,json
from itertools import product
from pathlib import Path
from models import PlateParameters
from studies import atomic_json

SCOPE='Bounded section/placement search; preview screening, stronger-mesh checks and a nine-scenario load/material envelope. All completed stages and failures are retained.'

def candidates(params):
    values=[params]
    values.extend({**params,'thickness':t,'width':w} for t,w in product((1.5,2.5,3.5),(3.,4.5,6.)))
    values.extend({**params,'thickness':3.5,'width':6.,'offset':offset,'screw_angle':angle}
        for offset,angle in product((0.,4.,8.),(-10.,10.)))
    unique={}
    for raw in values:
        validated=PlateParameters(**raw).model_dump();key=hashlib.sha256(json.dumps(validated,sort_keys=True).encode()).hexdigest()[:16]
        unique.setdefault(key,validated)
    return list(unique.items())

def mechanics(result,params):
    return bool(result.get('numerically_resolved') and result.get('safety_factor',0)>=params['min_sf'] and
        result.get('bond_slip_check_pass') and result.get('linear_strain_check_pass') and result.get('max_locking_slip_mm',0)<.01)

def refinement_change(coarse,fine):
    return {key:abs(fine[key]-coarse[key])/max(abs(fine[key]),1e-12)
        for key in ('peak_titanium_stress_mpa','max_displacement_mm')}

def run(payload,execute,progress):
    from geometry import build
    rows=[];fine=[];envelope=[]
    report={'schema':'trab-remediation-v2','candidates':rows,'refinement':fine,'envelope':envelope,
        'winner':None,'screening_proposal':None,'scope':SCOPE,'state':'partial',
        'reason':'Search running. No verified design is available yet.',
        'geometry_screen_scope':'Keep-out clearance, hole spacing and sampled bone engagement. Anatomical fit/edge-distance/contact qualification remains required.',
        'limits':{'maximum_coarse_candidates':16,'maximum_refined_candidates':2,'envelope_scenarios':9,'calculation_timeout_seconds':360}}
    def checkpoint():atomic_json(payload['partial_path'],report)
    def assembly(params):return build(payload['anatomy_id'],params,payload['regions'],payload.get('anatomy_snapshot'),payload.get('cad_version',3))
    def calculate(candidate,identifier,quality,start,span,label):
        return execute(candidate,{'anatomy_id':payload['anatomy_id'],'params':candidate.params,'regions':payload['regions'],
            'anatomy_snapshot':payload.get('anatomy_snapshot'),'cad_version':payload.get('cad_version',3),'quality':quality},identifier,
            lambda stage,fraction:progress(f'{label} · {stage}',start+span*fraction))
    choices=candidates(payload['params']);checkpoint()
    for index,(identifier,params) in enumerate(choices):
        row={'id':identifier,'params':params,'state':'checking_geometry','quality':'preview'};rows.append(row);checkpoint()
        progress(f'Candidate {index+1}/{len(choices)} · geometry',index/len(choices)*.55)
        try:
            candidate=assembly(params);row.update(geometry_hash=candidate.geometry_hash,checks=candidate.checks)
            row['volume_mm3']=sum(float(part['mesh'].volume) for part in candidate.meshes if part['material']=='titanium')
            if not all(candidate.checks[key] for key in ('clearance_pass','hole_spacing_pass','engagement_pass')):
                row['state']='rejected_geometry';checkpoint();continue
            row['state']='running';checkpoint()
            result=calculate(candidate,identifier,'preview',index/len(choices)*.55,.55/len(choices),f'Candidate {index+1}/{len(choices)}')
            result.pop('fields',None);passed=mechanics(result,params)
            row.update(state='screened' if result.get('numerically_resolved') else 'unresolved',result=result,mechanical_screen_pass=passed)
        except Exception as error:row.update(state='failed',error=str(error))
        checkpoint()
    shortlist=sorted([row for row in rows if row.get('mechanical_screen_pass')],key=lambda row:row['volume_mm3'])[:2]
    quality=payload['quality'] if payload['quality'] in ('standard','refined') else 'standard'
    for index,coarse in enumerate(shortlist):
        row={'id':coarse['id']+'-fine','coarse_id':coarse['id'],'params':coarse['params'],'quality':quality,'state':'running'};fine.append(row);checkpoint()
        try:
            candidate=assembly(row['params']);result=calculate(candidate,row['id'],quality,.55+index*.1,.1,f'Refine candidate {index+1}/{len(shortlist)}')
            result.pop('fields',None);change=refinement_change(coarse['result'],result)
            row.update(result=result,refinement_change=change,state='completed',mechanical_screen_pass=mechanics(result,row['params']),
                refinement_pass=all(value<.05 for value in change.values()),volume_mm3=coarse['volume_mm3'])
        except Exception as error:row.update(state='failed',error=str(error))
        checkpoint()
    eligible=sorted([row for row in fine if row.get('mechanical_screen_pass') and row.get('refinement_pass')],key=lambda row:row['volume_mm3'])
    if eligible:
        selected=eligible[0];report['screening_proposal']={'id':selected['id'],'params':selected['params'],'qualified':False,'label':'Provisional screening candidate; full verification required'}
        for index,(loading,modulus) in enumerate(product(('bilateral','left','right'),(500.,1200.,1800.))):
            params={**selected['params'],'load_case':loading,'modulus':modulus}
            row={'id':f"{selected['id']}-{loading}-{int(modulus)}",'params':params,'quality':quality,'state':'running'};envelope.append(row);checkpoint()
            try:
                candidate=assembly(params);result=calculate(candidate,row['id'],quality,.75+index/9*.25,.25/9,f'Envelope {index+1}/9 · {loading} / {modulus:g} MPa')
                result.pop('fields',None);row.update(state='completed',result=result,mechanical_screen_pass=mechanics(result,params))
            except Exception as error:row.update(state='failed',error=str(error))
            checkpoint()
        geometry_qualified=all(selected['result'].get('geometry_checks',{}).get(key) is True for key in ('stand_off_pass','edge_distance_pass','collision_pass'))
        if geometry_qualified and len(envelope)==9 and all(row.get('mechanical_screen_pass') and row.get('result',{}).get('qualified') for row in envelope) and selected['result'].get('qualified'):
            report['winner']={**selected,'verification_scope':'Nine load/material scenarios on the selected anatomy',
                'envelope_ids':[row['id'] for row in envelope]}
    report.update(state='completed',computed_candidates=sum('result' in row for row in rows),
        reason='A verified winner passed the declared refinement and full envelope.' if report['winner'] else
            'No verified winner. Review retained geometry, mechanical screening, numerical qualification and refinement failures.')
    checkpoint();return report
