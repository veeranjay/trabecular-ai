"""Checkpoint/result integrity, including failure retention and source isolation."""
import csv,json,tempfile,unittest
from io import StringIO
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from studies import run,scenario_csv

class StudyTests(unittest.TestCase):
    def test_scenarios_capture_sources_and_preserve_failed_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'partial.json'
            refs={name:{'case_id':f'case-{name}','revision_id':f'rev-{name}','params':{'thickness':thickness},
                'regions':[{'id':name}],'anatomy_snapshot':name,'cad_version':4} for name,thickness in [('male',1.5),('female',2.7)]}
            payload={'job_id':'isolated-unit-check','study_references':refs,'partial_path':str(path),
                'quality':'preview','device':'cpu','numerical_signature':{'test':True}}
            seen=[]
            def assembly(name,params,regions,snapshot,version):
                self.assertEqual(regions[0]['id'],name);self.assertEqual(params['thickness'],refs[name]['params']['thickness'])
                return SimpleNamespace(geometry_hash=f'{name}-{params}',params=params)
            def solver(candidate,*args,**kwargs):
                checkpoint=json.loads(path.read_text());self.assertEqual(sum(s['state']=='running' for s in checkpoint['scenarios']),1)
                seen.append(candidate)
                if len(seen)==3:raise ValueError('Fixture failure retained')
                return {'peak_titanium_stress_mpa':len(seen),'relative_residual':1e-8,'qualified':False,'numerically_resolved':True}
            with patch('geometry.build',side_effect=assembly):report=run(payload,solver,lambda *_:None)
            self.assertEqual(len(seen),18);self.assertEqual(len({r['id'] for r in report['scenarios']}),18)
            self.assertEqual(report['completed'],17);self.assertEqual(report['failed'],1);self.assertEqual(report['qualified'],0)
            self.assertEqual(len(list((Path(directory)/'scenarios').glob('*.json'))),18)
            self.assertEqual(json.loads(path.read_text()),report)
            self.assertEqual(report['governing']['peak_titanium_stress_mpa']['value'],18)
            rows=list(csv.DictReader(StringIO(scenario_csv(report))))
            self.assertEqual(len(rows),18);self.assertEqual(rows[2]['error'],'Fixture failure retained')
            self.assertEqual(rows[-1]['relative_residual'],'1e-08')

if __name__=='__main__':unittest.main()
