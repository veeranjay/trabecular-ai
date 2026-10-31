"""Bounded, conforming tetrahedral meshes for the prepared solid components.

Separate segment meshes preserve the osteotomy gap. There is no fictitious
void stiffness or automatic welding of opposing bone surfaces.
"""
from __future__ import annotations
import hashlib
import json
import time
from pathlib import Path
import numpy as np
import tetgen
import trimesh
from geometry import Assembly, clean_solid

CACHE=Path(__file__).resolve().parent/'data'/'meshes'
MESH_VERSION=2


def tetrahedralize(mesh, *, max_volume, surface_faces=None):
    original_volume=mesh.volume
    working=mesh.copy()
    if surface_faces and len(working.faces)>surface_faces:
        working=working.simplify_quadric_decimation(face_count=surface_faces)
        working.fix_normals()
        if not working.is_volume:
            # Surface decimation is optional. Never close a newly created hole
            # by inventing a patch; retain the checked input surface instead.
            working=mesh.copy()
    if not working.is_volume:
        raise ValueError('The analysis surface must be a watertight positive volume.')
    reduction_error=abs(working.volume-original_volume)/original_volume
    if reduction_error>.03:
        raise ValueError('Analysis surface reduction changed volume by more than 3%.')
    start=time.perf_counter()
    generator=tetgen.TetGen(np.asarray(working.vertices,dtype=np.float64),np.asarray(working.faces,dtype=np.int32))
    result=generator.tetrahedralize(order=1,quality=True,minratio=1.5,mindihedral=5,
        fixedvolume=True,maxvolume=max_volume,steinerleft=150000,quiet=True)
    points,tets=np.asarray(result[0]),np.asarray(result[1],dtype=np.int32)
    jac=np.transpose(points[tets[:,1:]]-points[tets[:,0,None]],(0,2,1))
    determinant=np.linalg.det(jac)
    negative=determinant<0
    tets[negative,1],tets[negative,2]=tets[negative,2].copy(),tets[negative,1].copy()
    volume=np.abs(determinant)/6
    keep=volume>1e-8
    removed_volume=float(volume[~keep].sum())
    if removed_volume/max(working.volume,1e-12)>1e-8:
        raise ValueError('Degenerate-element cleanup would remove a measurable part of the volume.')
    removed=int((~keep).sum())
    tets=tets[keep];volume=volume[keep]
    used,inverse=np.unique(tets,return_inverse=True)
    points=points[used];tets=inverse.reshape(-1,4).astype(np.int32)
    if len(points)>200000 or len(tets)>1000000:
        raise ValueError('The local mesh limit was exceeded. Select a coarser quality.')
    if volume.min()<1e-12 or not np.isfinite(points).all():
        raise ValueError('Meshing produced a degenerate tetrahedron.')
    return points,tets,{'nodes':len(points),'tetrahedra':len(tets),'surface_faces':len(working.faces),
        'surface_volume_relative_error':float(reduction_error),'mesh_volume_relative_error':float(abs(volume.sum()-working.volume)/working.volume),
        'minimum_tet_volume_mm3':float(volume.min()),'maximum_tet_volume_mm3':float(volume.max()),
        'degenerate_tets_removed':removed,'removed_volume_mm3':removed_volume,
        'elapsed_seconds':time.perf_counter()-start}


def prepare(assembly:Assembly,quality='preview',progress=None,cancelled=None):
    settings={'preview':(40.,.12,4500),'standard':(15.,.04,8500),'refined':(6.,.015,14000)}
    if quality not in settings:raise ValueError('Unknown mesh quality.')
    bone_volume,metal_volume,faces=settings[quality]
    from engine_fingerprint import mesh_signature
    key=hashlib.sha256(f'{assembly.shape_hash}:{quality}:{MESH_VERSION}:{mesh_signature()}'.encode()).hexdigest()
    CACHE.mkdir(parents=True,exist_ok=True)
    path=CACHE/f'{key}.npz'
    if path.exists():
        with np.load(path,allow_pickle=False) as stored:
            return {k:stored[k] for k in stored.files if k!='metadata'},{**json.loads(str(stored['metadata'])),'geometry_hash':assembly.geometry_hash}
    components=list(assembly.meshes[:3])
    if assembly.cad_version==5:components.extend(assembly.meshes[3:])
    else:
        for side in ('left','right'):
            joined=clean_solid(trimesh.boolean.union([entry['mesh'] for entry in assembly.meshes
                if entry['material']=='titanium' and side in entry['id']],engine='manifold'))
            if len(joined.split())!=1:raise ValueError(f'The {side} locking assembly is disconnected.')
            components.append({'id':f'hardware_{side}','material':'titanium','mesh':joined})
    arrays={};information=[];canonical_screw=None
    for index,entry in enumerate(components):
        if cancelled and cancelled():raise InterruptedError('Analysis cancelled before the next mesh component.')
        if progress:progress(f"Meshing {entry['id'].replace('_',' ')}",index/len(components)*.35)
        if assembly.cad_version==5 and entry['id'].startswith('screw_'):
            # A rigid transform must not change the screw discretization.
            # Mesh its exact canonical CAD once, then rotate/translate nodes.
            if canonical_screw is None:
                from contoured_cad_v5 import clean,screw
                canonical_screw=tetrahedralize(clean(screw(np.zeros(3),np.array([0.,0.,1.]),assembly.params['screw_length'])),max_volume=metal_volume)
            p,t,stats=canonical_screw;spec=next(s for s in assembly.screws if s['id']==entry['id'])
            axis=np.asarray(spec['start'])-spec['end'];axis/=np.linalg.norm(axis)
            transform=trimesh.geometry.align_vectors([0,0,1],axis)
            points=p@transform[:3,:3].T+spec['start'];tets=t.copy();stats={**stats,'coordinate_basis':'Canonical screw, rigidly transformed'}
        else:
            points,tets,stats=tetrahedralize(entry['mesh'],max_volume=bone_volume if entry['material']=='bone' else metal_volume,
                                           surface_faces=faces if entry['material']=='bone' else None)
        arrays[f'p{index}']=points;arrays[f't{index}']=tets
        information.append({'id':entry['id'],'material':entry['material'],**stats})
    meta={'version':MESH_VERSION,'quality':quality,'geometry_hash':assembly.geometry_hash,'cache_key':key,'components':information,
          'method':'Conforming linear tetrahedra; no void stiffness; disjoint osteotomy segments.'}
    from uuid import uuid4
    temp=path.with_suffix(f'.{uuid4().hex}.tmp.npz')
    np.savez_compressed(temp,**arrays,metadata=json.dumps(meta))
    temp.replace(path)
    return arrays,meta


if __name__=='__main__':
    from geometry import build
    assembly=build('male',{})
    arrays,meta=prepare(assembly,progress=lambda stage,value:print(stage,flush=True))
    print(json.dumps(meta,indent=2))
