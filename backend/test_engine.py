import json
import unittest
import numpy as np
from engine import DEFAULTS, beam_fem, benchmark, cohort, optimize, screw_clearance, solve, validate

class EngineTests(unittest.TestCase):
    def test_load_scaling(self):
        first=solve(DEFAULTS)
        second=solve({**DEFAULTS,'load':DEFAULTS['load']/2})
        self.assertAlmostEqual(second['peak_stress'],first['peak_stress']/2,places=4)
        self.assertAlmostEqual(second['max_displacement'],first['max_displacement']/2,places=6)

    def test_thickness_reduces_stress_and_deflection(self):
        first=solve(DEFAULTS)
        second=solve({**DEFAULTS,'thickness':2.5})
        self.assertLess(second['peak_stress'],first['peak_stress'])
        self.assertLess(second['max_displacement'],first['max_displacement'])
        self.assertLess(second['residual'],1e-6)

    def test_bone_stiffness_affects_system(self):
        low=solve({**DEFAULTS,'modulus':450})
        high=solve({**DEFAULTS,'modulus':1900})
        self.assertLess(high['max_displacement'],low['max_displacement'])
        self.assertNotAlmostEqual(high['peak_stress'],low['peak_stress'],places=2)

    def test_clearance_uses_geometry(self):
        self.assertLess(screw_clearance(DEFAULTS),4)
        self.assertGreater(screw_clearance({**DEFAULTS,'offset':5}),4)

    def test_optimizer_returns_real_reproducible_winner(self):
        result=optimize(DEFAULTS)
        self.assertIsNotNone(result['winner'])
        winner=result['winner']
        replay=solve(winner['params'])
        self.assertTrue(replay['passed'])
        self.assertAlmostEqual(replay['peak_stress'],winner['peak_stress'],places=5)
        self.assertEqual(result['evaluated'],len(result['candidates']))
        minimum=min(c['params']['thickness']*c['params']['width'] for c in result['candidates'] if c['passed'])
        self.assertAlmostEqual(winner['params']['thickness']*winner['params']['width'],minimum)

    def test_infeasible_search_never_fakes_success(self):
        result=optimize({**DEFAULTS,'thickness':3.5,'width':2,'load':1000,'min_sf':4})
        self.assertIsNone(result['winner'])
        self.assertTrue(result['reason'])

    def test_sweep_is_ten_computed_scenarios(self):
        study=cohort(DEFAULTS)
        self.assertEqual(study['total'],10)
        self.assertEqual(len({s['id'] for s in study['samples']}),10)
        self.assertEqual(study['passed'],sum(s['passed'] for s in study['samples']))
        self.assertEqual(study['max_stress'],max(s['peak_stress'] for s in study['samples']))

    def test_analytical_benchmark(self):
        report=benchmark()
        for row in report['rows']:
            self.assertLess(row['error_pct'],1e-5)
            self.assertLess(row['residual'],1e-6)
        self.assertAlmostEqual(report['analytical_deflection'],.22727272727272727)

    def test_support_reactions_balance_load(self):
        result=beam_fem(36,3,1.5,260,bone_modulus=1200)
        displacement=np.array(result['displacement'])
        support_k=1200*np.pi*1.1**2/8
        reaction=-sum(displacement[i]*support_k for i in [0,10,26,36])
        self.assertAlmostEqual(reaction,260,places=4)

    def test_reject_invalid_inputs(self):
        for bad in [0,-1,10,float('nan'),float('inf'),'1.5',True]:
            with self.assertRaises(ValueError):validate({'thickness':bad})

if __name__=='__main__':unittest.main(verbosity=2)
