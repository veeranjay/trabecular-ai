import unittest
import numpy as np
from scipy.sparse import bmat,csr_matrix,kron,eye
from scipy.sparse.linalg import spsolve
from exact_ties import interpolation,condense

class ExactTieTests(unittest.TestCase):
    def setUp(self):
        self.positions=np.array([[0.,0.,0.],[2.,0.,0.],[0.,2.,0.],[.5,.5,0.]])
        self.slaves=np.array([3]);self.masters=np.array([[0,1,2]]);self.weights=np.array([[.5,.25,.25]])
    def test_elimination_matches_independent_lagrange_multiplier_solution(self):
        rng=np.random.default_rng(42);a=rng.normal(size=(12,12));matrix=csr_matrix(a.T@a+np.eye(12))
        load=rng.normal(size=(4,3));fixed=np.zeros(4,dtype=bool)
        reduced=condense(matrix,self.positions,fixed,load,self.slaves,self.masters,self.weights)
        solution=reduced['transform']@spsolve(reduced['matrix'].tocsr(),reduced['loads'].ravel()).reshape(-1,3)
        c=np.zeros((1,4));c[0,3]=1;c[0,:3]=-self.weights[0]
        constraint=kron(csr_matrix(c),eye(3,format='csr'),format='csr')
        saddle=bmat([[matrix,constraint.T],[constraint,None]],format='csr')
        expected=spsolve(saddle,np.r_[load.ravel(),np.zeros(3)])[:12].reshape(-1,3)
        np.testing.assert_allclose(solution,expected,rtol=1e-12,atol=1e-12)
    def test_interpolation_preserves_translations_and_infinitesimal_rotations(self):
        transform,independent=interpolation(self.positions,np.zeros(4,dtype=bool),self.slaves,self.masters,self.weights)
        rigid=np.cross([.02,-.03,.01],self.positions)+[.1,-.2,.3]
        np.testing.assert_allclose(transform@rigid[independent],rigid,atol=1e-15)
    def test_rejects_duplicate_and_dependent_slaves(self):
        with self.assertRaisesRegex(ValueError,'multiple'):
            interpolation(self.positions,np.zeros(4,dtype=bool),np.array([3,3]),np.tile(self.masters,(2,1)),np.tile(self.weights,(2,1)))
        with self.assertRaisesRegex(ValueError,'Dependent'):
            interpolation(self.positions,np.zeros(4,dtype=bool),self.slaves,np.array([[0,1,3]]),self.weights)

if __name__=='__main__':unittest.main()
