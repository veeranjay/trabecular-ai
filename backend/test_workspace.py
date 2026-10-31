"""Workspace invariants: ownership, immutable inputs, honest job and tool state."""
import tempfile
import unittest
from pathlib import Path
from fastapi.testclient import TestClient
import service
from storage import Repository

class DeferredQueue:
    def __init__(self):self.tasks=[]
    def submit(self,*args):self.tasks.append(args)
    def shutdown(self,**kwargs):pass

class WorkspaceTests(unittest.TestCase):
    def setUp(self):
        self.directory=tempfile.TemporaryDirectory()
        self.old_data=service.DATA;service.DATA=Path(self.directory.name)/'artifacts-root'
        import imported_anatomy
        self.old_import_path=imported_anatomy.IMPORTS
        imported_anatomy.IMPORTS=Path(self.directory.name)/'imports'
        service.repo=Repository(Path(self.directory.name)/'workspace.sqlite3')
        service.pool=DeferredQueue()
        self.client=TestClient(service.app)
        self.headers={'X-Trab-Bridge':service.BRIDGE_KEY}
        self.state=self.request('post','/bootstrap').json()
        self.case=self.state['cases'][0];self.revision=self.state['revisions'][0]
    def tearDown(self):
        import imported_anatomy
        imported_anatomy.IMPORTS=self.old_import_path
        service.DATA=self.old_data
        self.client.close();self.directory.cleanup()
    def request(self,method,url,**kwargs):return getattr(self.client,method)(url,headers=self.headers,**kwargs)
    def prepare(self):
        self.request('put',f"/cases/{self.case['id']}/preparation",json={'regions':self.case['regions'],'units':'mm','reviewed':True})
        return self.request('post',f"/cases/{self.case['id']}/revisions",json={'params':self.revision['params'],'parent_id':self.revision['id']}).json()
    def job_payload(self,revision=None):
        return {'action':'solve','case_id':self.case['id'],'revision_id':(revision or self.revision)['id'],'model':'gpu3d','quality':'preview'}
    def test_bridge_and_remote_host_are_rejected(self):
        self.assertEqual(self.client.get('/state').status_code,403)
        self.assertEqual(self.client.get('/state',headers={**self.headers,'X-Trab-Public-Host':'public.example'}).status_code,403)
    def test_review_is_a_versioned_requirement(self):
        self.assertEqual(self.request('post','/jobs',json=self.job_payload()).status_code,409)
        updated=self.prepare()
        self.assertFalse(service.repo.get('local','revision',self.revision['id'])['preparation_reviewed'])
        self.assertTrue(updated['preparation_reviewed'])
        self.assertEqual(self.request('post','/jobs',json=self.job_payload(updated)).status_code,202)
    def test_matching_jobs_are_deduplicated_and_cancellable(self):
        revision=self.prepare();payload=self.job_payload(revision)
        one=self.request('post','/jobs',json=payload).json()
        two=self.request('post','/jobs',json=payload).json()
        self.assertEqual(one['id'],two['id']);self.assertTrue(two['reused'])
        self.assertEqual(len(service.pool.tasks),1)
        cancelled=self.request('post',f"/jobs/{one['id']}/cancel").json()
        self.assertEqual(cancelled['state'],'cancelled')
        # A cancelled task is not incorrectly reused as completed evidence.
        three=self.request('post','/jobs',json=payload).json()
        self.assertNotEqual(one['id'],three['id'])
    def test_cross_case_revision_is_rejected(self):
        other=self.request('post','/cases',json={'name':'Second anatomy','anatomy_id':'female'}).json()
        response=self.request('get',f"/cases/{other['id']}/revisions/{self.revision['id']}/geometry")
        self.assertEqual(response.status_code,409)
    def test_verification_reserves_gpu_without_queuing_a_competing_job(self):
        from verification_lease import lease
        revision=self.prepare()
        with lease(service.DATA):
            response=self.request('post','/jobs',json=self.job_payload(revision))
        self.assertEqual(response.status_code,409)
        self.assertEqual(len(service.pool.tasks),0)
    def test_region_edit_does_not_change_old_revision(self):
        before=self.request('get',f"/cases/{self.case['id']}/revisions/{self.revision['id']}/geometry").json()
        regions=[{**r} for r in self.case['regions']];regions[-1]['radius']=6.
        self.request('put',f"/cases/{self.case['id']}/preparation",json={'regions':regions,'reviewed':True})
        after=self.request('get',f"/cases/{self.case['id']}/revisions/{self.revision['id']}/geometry").json()
        self.assertEqual(before['geometry_hash'],after['geometry_hash'])
        changed=self.request('post',f"/cases/{self.case['id']}/revisions",json={'params':self.revision['params'],'parent_id':self.revision['id']}).json()
        self.assertNotEqual(before['geometry_hash'],changed['geometry_hash'])
    def test_voice_calls_are_validated_and_idempotent(self):
        call={'call_id':'test-voice-call','name':'propose_parameters','case_id':self.case['id'],'revision_id':self.revision['id'],'arguments':{'changes':{'thickness':2.}}}
        first=self.request('post','/voice/tools',json=call).json()
        second=self.request('post','/voice/tools',json=call).json()
        self.assertEqual(first['proposal']['id'],second['proposal']['id'])
        call['arguments']['changes']['thickness']=9.
        self.assertEqual(self.request('post','/voice/tools',json=call).status_code,409)
        call['call_id']='new-invalid-call'
        self.assertEqual(self.request('post','/voice/tools',json=call).status_code,422)
    def test_voice_apply_keeps_the_preparation_that_was_proposed(self):
        call={'call_id':'frozen-proposal','name':'propose_parameters','case_id':self.case['id'],'revision_id':self.revision['id'],'arguments':{'changes':{'thickness':2.}}}
        proposed=self.request('post','/voice/tools',json=call).json()['proposal']
        changed=[{**r,'radius':r['radius']+1} for r in self.case['regions']]
        self.request('put',f"/cases/{self.case['id']}/preparation",json={'regions':changed,'reviewed':True})
        response=self.request('post','/voice/tools',json={**call,'call_id':'apply-frozen-proposal','name':'apply_parameters','arguments':{'proposal_id':proposed['id']}})
        self.assertEqual(response.status_code,200)
        revision=response.json()['revision']
        self.assertEqual(revision['regions'],self.revision['regions'])
        self.assertEqual(revision['preparation_reviewed'],self.revision['preparation_reviewed'])
        self.assertEqual(service.repo.get('local','case',self.case['id'])['regions'],self.revision['regions'])
    def test_results_are_workspace_scoped(self):
        service.repo.put('someone-else','job',{'id':'private-job','state':'completed','case_id':'other'})
        self.assertEqual(self.request('get','/jobs/private-job/result').status_code,404)
    def test_private_artifact_paths_are_owner_scoped_and_bounded(self):
        self.assertNotEqual(service.job_directory('same-id','owner-a'),service.job_directory('same-id','owner-b'))
        with self.assertRaises(service.HTTPException):service.job_directory('../escape','owner-a')
        with self.assertRaises(service.HTTPException):service.job_directory('safe','../escape')
    def test_cancelled_study_reports_interrupted_and_unrun_scenarios(self):
        import json
        identifier='partial-study-check'
        service.repo.put('local','job',{'id':identifier,'state':'cancelled','action':'study','case_id':self.case['id']})
        directory=service.job_directory(identifier);directory.mkdir(parents=True)
        checkpoint={'scenarios':[{'id':'done','state':'completed'},{'id':'active','state':'running'},{'id':'later','state':'pending'}],'completed':1}
        (directory/'partial.json').write_text(json.dumps(checkpoint))
        evidence=self.request('get',f'/jobs/{identifier}/result?partial=true').json()
        self.assertEqual(evidence['state'],'cancelled')
        self.assertEqual([s['state'] for s in evidence['scenarios']],['completed','interrupted','not_run'])
        self.assertEqual(json.loads((directory/'partial.json').read_text()),checkpoint)
    def test_unqualified_search_cannot_be_applied(self):
        import json
        identifier='unqualified-search-check'
        service.repo.put('local','job',{'id':identifier,'state':'completed','action':'optimize','case_id':self.case['id'],'revision_id':self.revision['id']})
        directory=service.job_directory(identifier);directory.mkdir(parents=True)
        (directory/'result.json').write_text(json.dumps({'winner':None,'reason':'Qualification outstanding'}))
        before=len(service.repo.list('local','revision'))
        self.assertEqual(self.request('post',f'/jobs/{identifier}/apply-winner').status_code,409)
        self.assertEqual(len(service.repo.list('local','revision')),before)
    def test_cancelled_search_export_keeps_partial_evidence(self):
        import json,zipfile
        from io import BytesIO
        from unittest.mock import patch
        identifier='cancelled-search-export'
        service.repo.put('local','job',{'id':identifier,'state':'cancelled','action':'optimize',
            'case_id':self.case['id'],'revision_id':self.revision['id']},case_id=self.case['id'])
        directory=service.job_directory(identifier);directory.mkdir(parents=True)
        checkpoint={'candidates':[{'id':'active','state':'running','params':self.revision['params']}],
            'refinement':[],'envelope':[],'winner':None}
        (directory/'partial.json').write_text(json.dumps(checkpoint))
        with patch.object(service,'pdf_evidence',return_value=b'PDF checked separately'):
            response=self.request('get',f"/cases/{self.case['id']}/revisions/{self.revision['id']}/export")
        self.assertEqual(response.status_code,200)
        with zipfile.ZipFile(BytesIO(response.content)) as archive:
            evidence=json.loads(archive.read(f'evidence/{identifier}.json'))['result']
        self.assertEqual(evidence['state'],'cancelled')
        self.assertEqual(evidence['candidates'][0]['state'],'interrupted')
        self.assertIsNone(evidence['winner'])
        self.assertEqual(json.loads((directory/'partial.json').read_text()),checkpoint)
    def test_mismatched_field_artifact_is_rejected(self):
        import json
        identifier='mismatched-result-check'
        service.repo.put('local','job',{'id':identifier,'state':'completed','action':'solve','case_id':self.case['id'],
            'input':{'params':self.revision['params'],'geometry_hash':self.revision['geometry_hash']}})
        directory=service.job_directory(identifier);directory.mkdir(parents=True)
        (directory/'result.json').write_text(json.dumps({'model':'jaw-locking-tet-v3','params':self.revision['params'],'geometry_hash':'different-geometry'}))
        self.assertEqual(self.request('get',f'/jobs/{identifier}/result').status_code,409)
    def test_independent_check_is_scoped_and_does_not_promote_qualification(self):
        import json,numpy as np
        from unittest.mock import patch
        identifier='independent-check-api'
        service.repo.put('local','job',{'id':identifier,'state':'completed','action':'solve','case_id':self.case['id'],
            'summary':{'qualified':False},'input':{'params':self.revision['params'],'geometry_hash':self.revision['geometry_hash']}})
        directory=service.job_directory(identifier);directory.mkdir(parents=True)
        (directory/'result.json').write_text(json.dumps({'model':'jaw-locking-tet-v3','params':self.revision['params'],'geometry_hash':self.revision['geometry_hash']}))
        fixture={name:np.zeros(1) for name in ('positions_mm','displacement_mm','tetrahedra','element_connectivity','element_degree',
            'young_modulus_mpa','poisson_ratio','fixed_nodes','applied_nodal_force_n','quadrature_stress_mpa',
            'material_id','bond_slave_nodes','bond_master_nodes','bond_barycentric_weights','bond_stiffness_n_per_mm')}
        np.savez(directory/'fields.npz',metadata=json.dumps({'params':self.revision['params'],'geometry_hash':self.revision['geometry_hash']}),**fixture)
        with patch('verification_jaw.audit',return_value={'passed':True,'checks':{},'metrics':{}}):
            report=self.request('post',f'/jobs/{identifier}/verification')
        self.assertEqual(report.status_code,200);self.assertTrue(report.json()['passed'])
        self.assertTrue((directory/'independent-audit.json').exists())
        self.assertFalse(service.repo.get('local','job',identifier)['summary']['qualified'])
        self.assertEqual(self.request('post','/jobs/other-owner/verification').status_code,404)
    def test_independent_check_rejects_fields_from_another_geometry(self):
        import json,numpy as np
        identifier='independent-check-wrong-fields'
        service.repo.put('local','job',{'id':identifier,'state':'completed','action':'solve','case_id':self.case['id'],
            'input':{'params':self.revision['params'],'geometry_hash':self.revision['geometry_hash']}})
        directory=service.job_directory(identifier);directory.mkdir(parents=True)
        (directory/'result.json').write_text(json.dumps({'model':'jaw-locking-tet-v3','params':self.revision['params'],'geometry_hash':self.revision['geometry_hash']}))
        np.savez(directory/'fields.npz',metadata=json.dumps({'params':self.revision['params'],'geometry_hash':'another-geometry'}))
        self.assertEqual(self.request('post',f'/jobs/{identifier}/verification').status_code,409)
    def test_restart_marks_running_job_failed(self):
        service.repo.put('local','job',{'id':'interrupted','state':'running','case_id':self.case['id'],'input':{'preserved':True}})
        service.repo.recover();job=service.repo.get('local','job','interrupted')
        self.assertEqual(job['state'],'failed');self.assertTrue(job['input']['preserved'])
    def test_boolean_is_not_a_plate_dimension(self):
        params={**self.revision['params'],'thickness':True}
        self.assertEqual(self.request('post',f"/cases/{self.case['id']}/revisions",json={'params':params}).status_code,422)
    def test_load_changes_reuse_shape_but_not_results(self):
        from geometry import build
        first=build('male',self.revision['params'])
        second=build('male',{**self.revision['params'],'modulus':500.,'load_case':'left'})
        self.assertEqual(first.shape_hash,second.shape_hash)
        self.assertNotEqual(first.geometry_hash,second.geometry_hash)
    def test_import_units_orientation_and_analysis_gate(self):
        import trimesh
        surface=trimesh.creation.box([20,12,8]).export(file_type='stl')
        response=self.request('post','/imports',files={'file':('inspection.stl',surface,'application/octet-stream')},data={'units':'mm'})
        self.assertEqual(response.status_code,201)
        case=response.json();revision=service.repo.get('local','revision',case['latest_revision_id'])
        original=self.request('get',f"/cases/{case['id']}/revisions/{revision['id']}/geometry").json()
        self.assertFalse(original['checks']['available']);self.assertIsNone(original['checks']['min_clearance_mm'])
        self.request('put',f"/cases/{case['id']}/preparation",json={'regions':[],'reviewed':True,'import_orientation':[90,0,0]})
        rotated=self.request('post',f"/cases/{case['id']}/revisions",json={'params':revision['params'],'parent_id':revision['id']}).json()
        self.assertNotEqual(original['geometry_hash'],rotated['geometry_hash'])
        old=self.request('get',f"/cases/{case['id']}/revisions/{revision['id']}/geometry").json()
        self.assertEqual(original['geometry_hash'],old['geometry_hash'])
        job={'action':'solve','case_id':case['id'],'revision_id':rotated['id'],'model':'gpu3d','quality':'preview'}
        self.assertEqual(self.request('post','/jobs',json=job).status_code,409)
        pdf=self.request('get',f"/cases/{case['id']}/revisions/{rotated['id']}/report")
        self.assertEqual(pdf.status_code,200);self.assertTrue(pdf.content.startswith(b'%PDF-'))
    def test_ambiguous_import_scale_is_rejected(self):
        import trimesh
        surface=trimesh.creation.box([20,12,8]).export(file_type='stl')
        response=self.request('post','/imports',files={'file':('inspection.stl',surface)},data={'units':'m'})
        self.assertEqual(response.status_code,422)
    def test_reference_revision_uses_frozen_registration(self):
        from unittest.mock import patch
        with patch('geometry.metadata',side_effect=RuntimeError('Current library changed')):
            response=self.request('get',f"/cases/{self.case['id']}/revisions/{self.revision['id']}/geometry")
        self.assertEqual(response.status_code,200)
        self.assertEqual(response.json()['geometry_hash'],self.revision['geometry_hash'])
    def test_fixation_version_is_immutable_across_branches(self):
        url=f"/cases/{self.case['id']}/revisions"
        legacy=self.request('post',url,json={'params':self.revision['params'],'parent_id':self.revision['id'],'cad_version':3}).json()
        upgraded=self.request('post',url,json={'params':legacy['params'],'parent_id':legacy['id'],'cad_version':4}).json()
        self.assertEqual(upgraded['cad_version'],4)
        self.assertNotEqual(upgraded['geometry_hash'],legacy['geometry_hash'])
        branch=self.request('post',url,json={'params':legacy['params'],'parent_id':legacy['id']}).json()
        self.assertEqual(branch['cad_version'],3)
        self.assertEqual(branch['geometry_hash'],legacy['geometry_hash'])
        for rev in (legacy,upgraded):
            packet=self.request('get',f"{url}/{rev['id']}/geometry")
            self.assertEqual(packet.status_code,200)
            self.assertEqual(packet.json()['geometry_hash'],rev['geometry_hash'])
    def test_study_requires_two_reviewed_sources_and_captures_each(self):
        reviewed=self.prepare();payload={**self.job_payload(reviewed),'action':'study'}
        self.assertEqual(self.request('post','/jobs',json=payload).status_code,409)
        female=self.request('post','/cases',json={'name':'Reviewed other reference','anatomy_id':'female'}).json()
        self.request('put',f"/cases/{female['id']}/preparation",json={'regions':female['regions'],'reviewed':True})
        reference=service.repo.get('local','revision',female['latest_revision_id'])
        female_revision=self.request('post',f"/cases/{female['id']}/revisions",json={'params':{**reference['params'],'thickness':2.7},'parent_id':reference['id']}).json()
        job=self.request('post','/jobs',json=payload)
        self.assertEqual(job.status_code,202)
        sources=job.json()['input']['study_references']
        self.assertEqual(sources['male']['revision_id'],reviewed['id'])
        self.assertEqual(sources['female']['revision_id'],female_revision['id'])
        self.assertEqual(sources['female']['source_params']['thickness'],2.7)
        self.assertEqual(sources['female']['params']['thickness'],reviewed['params']['thickness'])
    def test_cached_result_is_rebound_to_the_new_revision(self):
        import json
        first_revision=self.prepare();payload=self.job_payload(first_revision)
        first=self.request('post','/jobs',json=payload).json()
        first.update(state='completed',summary={'model':'cache-fixture'})
        service.repo.put('local','job',first,case_id=self.case['id'])
        directory=service.job_directory(first['id']);directory.mkdir(parents=True)
        (directory/'result.json').write_text(json.dumps({'model':'cache-fixture','measured':42.}))
        newer=self.request('post',f"/cases/{self.case['id']}/revisions",json={'params':first_revision['params'],'parent_id':first_revision['id']}).json()
        reused=self.request('post','/jobs',json=self.job_payload(newer)).json()
        self.assertNotEqual(first['id'],reused['id']);self.assertEqual(reused['revision_id'],newer['id'])
        self.assertEqual(reused['cache_source_job_id'],first['id'])
        self.assertEqual(self.request('get',f"/jobs/{reused['id']}/result").json()['measured'],42.)
        forced=self.request('post','/jobs',json={**self.job_payload(newer),'force':True}).json()
        self.assertEqual(forced['state'],'queued');self.assertTrue(forced['force_recompute'])

if __name__=='__main__':unittest.main()
