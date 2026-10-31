"""Developer defaults must touch the anatomy they are assigned to."""
import unittest
import numpy as np
import trimesh
from prepare_cases import PUBLIC,reference_load_regions

class RegistrationTests(unittest.TestCase):
    def test_each_reference_load_proxy_covers_its_own_distal_surface(self):
        for anatomy in ('male','female'):
            mesh=trimesh.load_mesh(PUBLIC/anatomy/'distal.stl')
            for region in reference_load_regions(mesh):
                with self.subTest(anatomy=anatomy,region=region['id']):
                    distances=np.linalg.norm(mesh.vertices-region['center'],axis=1)
                    self.assertLess(distances.min(),.001)
                    self.assertGreater(np.count_nonzero(distances<region['radius']),20)
                    self.assertEqual(region['source'],'developer_reference')

if __name__=='__main__':unittest.main()
