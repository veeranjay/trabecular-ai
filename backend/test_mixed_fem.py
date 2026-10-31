"""Polynomial recovery checks independent of Warp's field derivative operator."""
import unittest
import numpy as np
from mixed_fem import recover,EDGES,GAUSS

class RecoveryTests(unittest.TestCase):
    def setUp(self):
        self.vertices=np.array([[1.,2.,-1.],[2.,2.,-1.],[1.2,3.,-.8],[1.,2.,1.]])
        self.points=np.vstack((self.vertices,[(self.vertices[i]+self.vertices[j])/2 for i,j in EDGES]))
        self.cells=np.array([[0,1,2,3]]);self.connections=np.arange(10)[None,:]
    def test_quadratic_field_gradient(self):
        u=np.zeros_like(self.points);u[:,0]=self.points[:,0]**2
        stress,principal=recover(self.points,self.cells,self.connections,np.array([2]),u,np.array([1000.]),np.array([.3]))
        x=GAUSS@self.vertices[:,0]
        np.testing.assert_allclose(stress[0],4*(1000/2.6)*x,rtol=1e-12)
        np.testing.assert_allclose(principal[0,:,2],2*x,rtol=1e-12)
    def test_affine_patch_matches_linear_and_quadratic(self):
        affine=np.array([[.001,.0002,0],[.0002,-.0003,.0001],[0,.0001,.0002]])
        u=self.points@affine.T+np.array([.02,-.03,.01])
        linear=recover(self.points,self.cells,self.connections,np.array([1]),u,np.array([1000.]),np.array([.3]))
        quadratic=recover(self.points,self.cells,self.connections,np.array([2]),u,np.array([1000.]),np.array([.3]))
        np.testing.assert_allclose(linear[0],quadratic[0],rtol=1e-12)
        np.testing.assert_allclose(linear[1],quadratic[1],rtol=1e-12)
    def test_locking_interpolation_reproduces_quadratic_displacements(self):
        from jaw_solver import quadratic_weights
        weights=quadratic_weights(GAUSS)
        np.testing.assert_allclose(weights.sum(axis=1),1,atol=1e-15)
        probes=GAUSS@self.vertices
        for values,expected in [(self.points[:,0]**2,probes[:,0]**2),
                (self.points[:,0]*self.points[:,2],probes[:,0]*probes[:,2])]:
            np.testing.assert_allclose(weights@values,expected,rtol=1e-13,atol=1e-13)

if __name__=='__main__':unittest.main()
