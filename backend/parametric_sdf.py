"""Geometry preparation entry point; procedural fake jaw generation was removed.

Use prepare_cases.py for the two prepared reference segmentations. Parametric
hardware is defined once in geometry.py for rendering, exports and analysis.
The 3D model uses conforming tetrahedra rather than a voxel/SDF void floor.
"""
try:
    from .prepare_anatomy import prepare
except ImportError:
    from prepare_anatomy import prepare

if __name__ == '__main__':
    prepare()
