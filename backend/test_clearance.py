import unittest
import numpy as np
from geometry import segment_segment_distance,keep_out_clearance
from models import Region
from pydantic import ValidationError

class ClearanceTests(unittest.TestCase):
    def test_interior_crossing_is_not_missed_by_endpoints(self):
        self.assertAlmostEqual(segment_segment_distance([-5,0,0],[5,0,0],[0,-5,2],[0,5,2]),2.)
        self.assertAlmostEqual(segment_segment_distance([-5,0,0],[5,0,0],[0,-5,0],[0,5,0]),0.)
    def test_parallel_degenerate_and_disjoint_segments(self):
        self.assertAlmostEqual(segment_segment_distance([0,0,0],[10,0,0],[2,3,0],[5,3,0]),3.)
        self.assertAlmostEqual(segment_segment_distance([0,0,0],[0,0,0],[2,0,0],[4,0,0]),2.)
        self.assertAlmostEqual(segment_segment_distance([0,0,0],[1,0,0],[4,0,0],[5,0,0]),3.)
    def test_polyline_buffer_and_full_shaft_radius(self):
        region={'kind':'keep_out','center':[100,100,100],'points':[[0,-5,3],[0,5,3],[10,5,3]],'radius':1.}
        self.assertAlmostEqual(keep_out_clearance(region,[-5,0,0],[5,0,0]),.9)
        # A single picked point has exactly the original spherical semantics.
        region['points']=[[0,0,3]]
        self.assertAlmostEqual(keep_out_clearance(region,[-5,0,0],[5,0,0]),.9)
    def test_loads_cannot_silently_become_polyline_supports(self):
        with self.assertRaises(ValidationError):Region(id='load',kind='load',center=[0,0,0],radius=2,points=[[0,0,0],[1,0,0]])

if __name__=='__main__':unittest.main()
