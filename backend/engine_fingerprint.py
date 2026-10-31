"""Code and dependency identities. No environment values or credentials included."""
from functools import lru_cache
import hashlib
from importlib.metadata import version
from pathlib import Path
import platform

ROOT=Path(__file__).resolve().parent
@lru_cache(maxsize=1)
def numerical_signature():
    files=('jaw_solver.py','mixed_fem.py','fem_solver.py','gpu_amg.py','geometry.py','contoured_cad.py','contoured_cad_v5.py','volume_mesh.py','models.py','worker.py','studies.py','process_control.py','isolated_solver.py','remediation.py','source_snapshot.py','prepare_cases.py','reference_assets.py','engine_fingerprint.py','verification3d.py','verification_tet.py','verification_plate.py','engine.py')
    files=(*files,'exact_ties.py','verification_jaw.py','block_scaling.py')
    return {'sources':{name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in files},
            'packages':{name:version(name) for name in ('warp-lang','numpy','scipy','trimesh','tetgen','manifold3d','pyamg','shapely','triangle')},
            'runtime':{'python':platform.python_version(),'platform':platform.system()}}

def mesh_signature():
    return hashlib.sha256(('|'.join(hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in ('geometry.py','contoured_cad.py','contoured_cad_v5.py','volume_mesh.py','prepare_cases.py','reference_assets.py'))+
        '|'.join(version(name) for name in ('trimesh','tetgen','manifold3d'))).encode()).hexdigest()
