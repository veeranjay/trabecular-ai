import tempfile,unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from models import PlateParameters
from remediation import run,candidates

class SearchTests(unittest.TestCase):
    def payload(self,directory):return {'anatomy_id':'male','params':PlateParameters().model_dump(),'regions':[],
        'cad_version':5,'quality':'preview','device':'cpu','partial_path':str(Path(directory)/'partial.json')}
    def geometry(self,admissible=True):
        def build(name,params,*args):
            return SimpleNamespace(params=params,geometry_hash=str(params),checks={'clearance_pass':admissible,'hole_spacing_pass':True,'engagement_pass':True},
                meshes=[{'material':'titanium','mesh':SimpleNamespace(volume=params['thickness']*params['width'])}])
        return build
    def test_grid_changes_dimensions_and_preserves_bounds(self):
        choices=candidates(PlateParameters().model_dump())
        self.assertLessEqual(len(choices),16);self.assertEqual(len({row[0] for row in choices}),len(choices))
        self.assertEqual({p['thickness'] for _,p in choices},{1.5,2.5,3.5})
        self.assertEqual({p['width'] for _,p in choices},{3.,4.5,6.})
        for _,params in choices:PlateParameters(**params)
    def test_rejected_geometry_never_spends_a_solver_calculation(self):
        with tempfile.TemporaryDirectory() as directory,patch('geometry.build',side_effect=self.geometry(False)):
            result=run(self.payload(directory),lambda *_:self.fail('Inadmissible geometry reached solver'),lambda *_:None)
            self.assertTrue(all(row['state']=='rejected_geometry' for row in result['candidates']));self.assertIsNone(result['winner'])
    def protocol(self,qualified,full_geometry=True):
        calls=[]
        def execute(assembly,source,identifier,callback):
            calls.append(source)
            return {'numerically_resolved':True,'qualified':qualified,'safety_factor':4.,'bond_slip_check_pass':True,
                'linear_strain_check_pass':True,'max_locking_slip_mm':.001,'peak_titanium_stress_mpa':100.,'max_displacement_mm':.1,
                'geometry_checks':{k:full_geometry for k in ('stand_off_pass','edge_distance_pass','collision_pass')}}
        with tempfile.TemporaryDirectory() as directory,patch('geometry.build',side_effect=self.geometry()):
            result=run(self.payload(directory),execute,lambda *_:None)
        return result,calls
    def test_unqualified_results_cannot_win_even_when_mechanical_thresholds_pass(self):
        result,calls=self.protocol(False)
        self.assertIsNone(result['winner']);self.assertEqual(len(result['refinement']),2);self.assertEqual(len(result['envelope']),9)
        self.assertEqual({(r['params']['load_case'],r['params']['modulus']) for r in result['envelope']},
            {(loading,modulus) for loading in ('bilateral','left','right') for modulus in (500.,1200.,1800.)})
        self.assertTrue(all(r['quality']=='standard' for r in calls[-11:]))
    def test_winner_requires_full_geometry_and_all_envelope_checks(self):
        rejected,_=self.protocol(True,False);self.assertIsNone(rejected['winner'])
        verified,_=self.protocol(True,True);self.assertIsNotNone(verified['winner']);self.assertEqual(len(verified['winner']['envelope_ids']),9)

if __name__=='__main__':unittest.main()
