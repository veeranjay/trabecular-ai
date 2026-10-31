import unittest
import numpy as np
from scipy.sparse import bsr_matrix,diags
from block_scaling import free_blocks,symmetric_scale_inplace

class BlockScalingTests(unittest.TestCase):
    def test_block_extraction_and_scaling_match_scalar_reference(self):
        rng=np.random.default_rng(123);a=rng.normal(size=(30,30));original=bsr_matrix(a.T@a+np.eye(30),blocksize=(3,3))
        keep=np.array([True,False,True,False,True,True,False,True,True,False]);dofs=np.repeat(keep,3)
        expected=original.tocsr()[dofs][:,dofs]
        actual=free_blocks(original,keep)
        np.testing.assert_allclose(actual.toarray(),expected.toarray(),rtol=1e-15)
        scale=1/np.sqrt(actual.diagonal());reference=diags(scale)@expected@diags(scale)
        np.testing.assert_allclose(symmetric_scale_inplace(actual,scale).toarray(),reference.toarray(),rtol=1e-15,atol=1e-15)
        np.testing.assert_allclose(original.toarray(),a.T@a+np.eye(30))

if __name__=='__main__':unittest.main()
