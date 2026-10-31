import unittest
import numpy as np
from verification_jaw import element_action,attachment_action,EDGE_ORDER

class IndependentActionTests(unittest.TestCase):
    def test_affine_tet4_and_tet10_have_analytical_stress_and_energy(self):
        vertices=np.array([[0.,0.,0.],[2.,0.,0.],[.2,3.,0.],[.1,.3,4.]])
        affine=np.diag([.001,-.0003,.0002]);young=1000.;poisson=.3
        mu=young/(2*(1+poisson));lam=young*poisson/((1+poisson)*(1-2*poisson))
        sigma=2*mu*affine+lam*np.trace(affine)*np.eye(3)
        dev=sigma-np.trace(sigma)/3*np.eye(3);expected_vm=np.sqrt(1.5*np.sum(dev**2))
        expected_energy=.5*np.sum(sigma*affine)*4
        for degree in (1,2):
            points=vertices if degree==1 else np.vstack((vertices,[(vertices[a]+vertices[b])/2 for a,b in EDGE_ORDER]))
            u=points@affine.T+np.array([.03,-.02,.01])
            force,stress,energy,volume=element_action(vertices[None],u[None],np.array([young]),np.array([poisson]),degree)
            np.testing.assert_allclose(stress,expected_vm,rtol=1e-12)
            np.testing.assert_allclose(energy,expected_energy,rtol=1e-12)
            np.testing.assert_allclose(force.sum(axis=1),0,atol=1e-13)
            self.assertAlmostEqual(float(np.sum(force[0]*u)),2*expected_energy,places=12)
            self.assertAlmostEqual(volume[0],4.)
    def test_point_attachment_preserves_rigid_motion_and_moment(self):
        positions=np.array([[0.,0.,0.],[2.,0.,0.],[0.,2.,0.],[.5,.5,0.]])
        weights=np.array([[.5,.25,.25]])
        u=np.cross(np.array([.001,.002,-.003]),positions)+[.01,-.03,.02]
        force,evidence=attachment_action(positions,u,np.array([3]),np.array([[0,1,2]]),weights,np.array([1000.]))
        np.testing.assert_allclose(force,0,atol=1e-13)
        self.assertLess(evidence['position_error_mm'],1e-14)
        u[3,2]+=.01
        force,evidence=attachment_action(positions,u,np.array([3]),np.array([[0,1,2]]),weights,np.array([1000.]))
        np.testing.assert_allclose(force.sum(0),0,atol=1e-13)
        np.testing.assert_allclose(np.cross(positions,force).sum(0),0,atol=1e-13)
        self.assertAlmostEqual(evidence['energy_n_mm'],.05)

if __name__=='__main__':unittest.main()
