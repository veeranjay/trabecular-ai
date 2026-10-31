import unittest
from reliability_report import summarize

class ReliabilityGateTests(unittest.TestCase):
    def test_missing_or_failed_mesh_levels_cannot_pass(self):
        summary=summarize({'runs':[]},{'runs':[]},{'runs':[],'state':'running'})
        self.assertFalse(summary['numerical_screen_passed']);self.assertFalse(summary['qualified'])
        for row in summary['anatomies'].values():self.assertFalse(row['mesh_screen']['passed'])
    def test_oscillating_peak_cannot_pass_from_a_small_last_difference(self):
        pilots=[];levels=[]
        for anatomy in ('male','female'):
            pilots.append({'anatomy':anatomy,'state':'completed','directory':'fixture',
                'audit':{'passed':True,'model':'jaw-exact-tet-v4','metrics':{'exact_attachment_slip_mm':0.}}})
            for quality,peak in zip(('preview','standard','refined'),(100.,110.,109.)):
                levels.append({'anatomy':anatomy,'quality':quality,'state':'completed','directory':'fixture',
                    'audit':{'passed':True,'compliance_n_mm':100.},'result':{'max_displacement_mm':1.,'peak_titanium_stress_mpa':peak}})
        report=summarize({'runs':[]},{'runs':pilots},{'runs':levels,'state':'completed'})
        self.assertFalse(report['numerical_screen_passed'])
        self.assertFalse(report['anatomies']['male']['mesh_screen']['monotone_decreasing_increments']['peak_titanium_stress_mpa'])

if __name__=='__main__':unittest.main()
