"""Bounded verification child; uses frozen case inputs without editing a case."""
import argparse,hashlib,json
from pathlib import Path
import numpy as np

def discrete_hash(path):
    identity=hashlib.sha256()
    with np.load(path,allow_pickle=False) as data:
        for name in ('positions_mm','tetrahedra','element_connectivity','element_degree','material_id','young_modulus_mpa',
            'poisson_ratio','fixed_nodes','applied_nodal_force_n','bond_slave_nodes','bond_master_nodes','bond_barycentric_weights'):
            value=data[name];identity.update(name.encode());identity.update(str(value.shape).encode());identity.update(value.dtype.str.encode());identity.update(value.tobytes())
    return identity.hexdigest()

def run(source,destination,quality,bond_scale,attachment):
    from engine_fingerprint import numerical_signature
    from source_snapshot import create
    from geometry import build
    from jaw_solver import solve
    from verification_jaw import audit
    signature=numerical_signature();create(destination,signature)
    import zipfile
    with zipfile.ZipFile(destination/'numerical-source.zip','a',zipfile.ZIP_DEFLATED) as archive:
        for name in ('verification_case.py','verification_study.py','verification_lease.py'):
            archive.write(Path(__file__).parent/name,'backend/'+name)
    payload=json.loads(source.read_text())
    assembly=build(payload['anatomy_id'],payload['params'],payload['regions'],payload.get('anatomy_snapshot'),payload.get('cad_version',3))
    if assembly.geometry_hash!=payload['geometry_hash']:raise ValueError('Frozen input geometry no longer reproduces.')
    (destination/'input.json').write_text(json.dumps({**payload,'quality':quality,'bond_penalty_scale':bond_scale,
        'attachment_formulation':attachment,'solver_version':'jaw-exact-tet-v4' if attachment=='exact' else payload['solver_version'],
        'numerical_signature':signature,'verification_source_job_id':payload.get('job_id')},indent=2))
    result=solve(assembly,quality,'cuda:0',lambda stage,fraction:print(f'{fraction:.3f} {stage}',flush=True),
        bond_scale=bond_scale,include_surface_fields=False,field_destination=destination/'fields.npz',attachment=attachment)
    numerical_signature.cache_clear()
    if signature!=numerical_signature():raise ValueError('Numerical sources changed during verification.')
    (destination/'result.json').write_text(json.dumps(result,allow_nan=False))
    evidence=audit(destination/'fields.npz');evidence['discrete_hash_excluding_penalty']=discrete_hash(destination/'fields.npz')
    (destination/'independent-audit.json').write_text(json.dumps(evidence,indent=2))
    if not evidence['passed']:raise ValueError('Independent discrete-model audit failed.')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('input',type=Path);parser.add_argument('destination',type=Path)
    parser.add_argument('--quality',choices=('preview','standard','refined'),default='preview')
    parser.add_argument('--bond-scale',type=float,default=100.)
    parser.add_argument('--attachment',choices=('penalty','exact'),default='penalty')
    args=parser.parse_args();args.destination.mkdir(parents=True,exist_ok=True)
    try:run(args.input,args.destination,args.quality,args.bond_scale,args.attachment)
    except Exception as error:
        (args.destination/'error.json').write_text(json.dumps({'error':str(error)}))
        raise
