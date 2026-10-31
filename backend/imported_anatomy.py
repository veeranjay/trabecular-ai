"""STL inspection import. An intact unregistered surface cannot enter a solve."""
import hashlib
import json
from io import BytesIO
import re
import numpy as np
import trimesh
from geometry import Assembly
from models import PlateParameters
from storage import DATA,uid

IMPORTS=DATA/'imports'
MAX_BYTES=20*1024*1024

def ingest(content,filename,units):
    if not content or len(content)>MAX_BYTES:raise ValueError('Choose a nonempty STL up to 20 MB.')
    if not filename.lower().endswith('.stl'):raise ValueError('Only STL surfaces are supported in this MVP.')
    if units not in ('mm','cm','m'):raise ValueError('Select the source units explicitly.')
    try:mesh=trimesh.load_mesh(BytesIO(content),file_type='stl',process=True)
    except Exception:raise ValueError('The file could not be read as an STL triangle surface.')
    if not len(mesh.faces) or len(mesh.faces)>500000 or not np.isfinite(mesh.vertices).all():
        raise ValueError('Use a finite triangle surface with at most 500,000 faces.')
    scale={'mm':1.,'cm':10.,'m':1000.}[units];mesh.apply_scale(scale)
    if mesh.extents.max()>500 or mesh.extents.max()<1:
        raise ValueError('The converted surface is outside the 1–500 mm inspection range. Check the source units.')
    center=mesh.bounds.mean(axis=0);mesh.apply_translation(-center)
    identifier=uid();folder=IMPORTS/identifier;folder.mkdir(parents=True)
    (folder/'source.stl').write_bytes(content);mesh.export(folder/'surface.stl')
    meta={'id':f'import:{identifier}','import_id':identifier,'name':filename.replace('\\','/').split('/')[-1][:100],
        'source_units':units,'scale_to_mm':scale,'source_center_mm':center.tolist(),'dimensions_mm':mesh.extents.tolist(),
        'source_sha256':hashlib.sha256(content).hexdigest(),'prepared_sha256':hashlib.sha256((folder/'surface.stl').read_bytes()).hexdigest(),
        'triangles':len(mesh.faces),'units':'mm','bounds':mesh.bounds.tolist(),'license':'User supplied',
        'source_url':'','source_paper':'','osteotomy':'Unsegmented STL; inspection only.',
        'registration':'No fixation or boundary-condition registrations supplied.',
        'geometry_quality':{'watertight':bool(mesh.is_watertight),'positive_volume':bool(mesh.is_volume),
                            'winding_consistent':bool(mesh.is_winding_consistent)},
        'analysis_ready':False,'missing_preparation':['Bone segmentation','Hardware registration','Support and loading regions','Keep-out registration']}
    (folder/'metadata.json').write_text(json.dumps(meta,allow_nan=False))
    return meta

def read_import(identifier):
    if not re.fullmatch('[a-f0-9-]{36}',identifier):raise ValueError('Invalid imported anatomy identifier.')
    folder=IMPORTS/identifier
    meta=json.loads((folder/'metadata.json').read_text())
    if hashlib.sha256((folder/'surface.stl').read_bytes()).hexdigest()!=meta['prepared_sha256']:
        raise ValueError('The imported inspection surface changed on disk.')
    return meta,folder

def build_import(identifier,parameters,regions=None,orientation=None):
    meta,folder=read_import(identifier)
    angles=np.asarray(orientation or [0,0,0],dtype=float)
    if angles.shape!=(3,) or not np.isfinite(angles).all() or np.abs(angles).max()>180:raise ValueError('Invalid import orientation.')
    mesh=trimesh.load_mesh(folder/'surface.stl')
    mesh.apply_transform(trimesh.transformations.euler_matrix(*np.deg2rad(angles)))
    params=PlateParameters.model_validate(parameters).model_dump()
    digest=hashlib.sha256(json.dumps({'surface':meta['prepared_sha256'],'orientation':angles.tolist(),'params':params},sort_keys=True).encode()).hexdigest()
    checks={'available':False,'min_clearance_mm':None,'clearance_pass':False,'min_hole_spacing_mm':None,'hole_spacing_pass':False,
            'min_bone_engagement_proxy_mm':None,'engagement_pass':False,'plate_volume_mm3':None,
            'note':'Unprepared import. No hardware or mechanical checks are available.'}
    return Assembly({**meta,'import_orientation':angles.tolist()},params,[{'id':'import_surface','material':'bone','mesh':mesh}],[],regions or [],checks,digest,digest)
