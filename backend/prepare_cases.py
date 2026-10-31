"""Prepare licensed anatomy and reproducible stepped sagittal-split references.

The cuts are developer-defined anatomical references, not clinically validated
surgical plans. The original surface and all Boolean operations are retained.
"""
from __future__ import annotations
import hashlib,json
from pathlib import Path
import numpy as np
import trimesh

ROOT=Path(__file__).resolve().parent
ASSETS=ROOT/'assets'
PUBLIC=ROOT.parent/'frontend/public/assets/cases'


def box(lo,hi):
    lo,hi=np.array(lo),np.array(hi)
    mesh=trimesh.creation.box(hi-lo);mesh.apply_translation((hi+lo)/2)
    return mesh


def cut_parameters(mesh):
    lo,hi=mesh.bounds
    return {'lateral_x':float(max(abs(lo[0]),abs(hi[0]))*.70),
            'medial_x':float(max(abs(lo[0]),abs(hi[0]))*.60),
            'posterior_z':float(lo[2]*.5),'anterior_z':float(hi[2]*.14),
            'ramus_y':float(hi[1]*.23),'ramus_z':float(lo[2]*.23)}


def proximal_mask(points,p):
    v=np.asarray(points);x=np.abs(v[:,0]);y=v[:,1];z=v[:,2]
    return ((x>p['medial_x'])&(z<p['posterior_z']))|((x>p['lateral_x'])&(y<p['ramus_y'])&(z<p['anterior_z']))|((x>20)&(y>p['ramus_y'])&(z<p['ramus_z']))


def reference_load_regions(distal):
    """Put editable developer load proxies on each anatomy's distal surface.

    Shared world coordinates can miss an asymmetric mandible entirely. These
    nearest-surface proxies establish mesh coverage, not clinical bite landmarks.
    """
    vertices=np.asarray(distal.vertices)
    regions=[]
    for side,key in ((-1,'left'),(1,'right')):
        subset=vertices[vertices[:,0]*side>5]
        if not len(subset):raise ValueError(f'Missing {key} distal surface for load registration.')
        query=np.array([side*25.,-8.,18.])
        center=subset[np.argmin(np.linalg.norm(subset-query,axis=1))]
        regions.append({'id':f'bite_{key}','kind':'load','center':center.round(4).tolist(),
            'radius':10.,'vector':[0.,-1.,0.],'source':'developer_reference'})
    return regions


def prepare(identifier,source):
    source_path=ASSETS/source
    mesh=max(trimesh.load_mesh(source_path).split(only_watertight=False),key=lambda m:len(m.faces))
    center=mesh.bounds.mean(axis=0);v=mesh.vertices-center
    mesh.vertices=np.column_stack([v[:,0],v[:,2],-v[:,1]])
    mesh.fix_normals()
    if not mesh.is_volume:raise ValueError(f'{identifier}: the principal surface is not a closed positive volume.')
    p=cut_parameters(mesh)
    left_mask=trimesh.boolean.union([
        box([-100,-100,-100],[-p['medial_x'],100,p['posterior_z']]),
        box([-100,-100,-100],[-p['lateral_x'],p['ramus_y'],p['anterior_z']]),
        box([-100,p['ramus_y'],-100],[-20,100,p['ramus_z']])],engine='manifold')
    right_mask=left_mask.copy();right_mask.apply_scale([-1,1,1]);right_mask.fix_normals()
    left=trimesh.boolean.intersection([mesh,left_mask],engine='manifold')
    right=trimesh.boolean.intersection([mesh,right_mask],engine='manifold')
    distal=trimesh.boolean.difference([mesh,left_mask,right_mask],engine='manifold')
    segments={'proximal_left':left,'proximal_right':right,'distal':distal}
    partition_error=abs(sum(m.volume for m in segments.values())-mesh.volume)/mesh.volume
    if partition_error>1e-5 or any(not m.is_volume or m.volume<100 for m in segments.values()):
        raise ValueError(f'{identifier}: invalid segment partition.')
    target=PUBLIC/identifier;target.mkdir(parents=True,exist_ok=True)
    mesh.export(target/'reference.stl')
    for name,segment in segments.items():segment.export(target/f'{name}.stl')
    width=mesh.extents[0]/121.6
    anchors={}
    for side in [-1,1]:
        queries=np.array([[side*48,-20,-24],[side*46,-22,-6],[side*35,-28,15],[side*24,-29,29]])*width
        neighborhoods=[mesh.vertices+delta for delta in (np.eye(3)*2).tolist()+(-np.eye(3)*2).tolist()]
        proximal_interior=np.logical_and.reduce([proximal_mask(v,p) for v in neighborhoods])
        distal_interior=np.logical_and.reduce([~proximal_mask(v,p) for v in neighborhoods])
        chosen=[]
        for index,query in enumerate(queries):
            allowed=(mesh.vertices[:,0]*side>0)&(mesh.vertex_normals[:,0]*side>.35)&(proximal_interior if index<2 else distal_interior)
            for previous in chosen:
                allowed &= np.linalg.norm(mesh.vertices-previous,axis=1)>=10.
            subset=mesh.vertices[allowed]
            chosen.append(subset[np.argmin(np.linalg.norm(subset-query,axis=1))])
        points=np.asarray(chosen)
        anchors['left' if side<0 else 'right']=points.round(5).tolist()
    v=mesh.vertices
    supports=[]
    for side in [-1,1]:
        region=v[(v[:,0]*side>25)&(v[:,1]>np.percentile(v[:,1],90))]
        point=region[np.argmax(region[:,1])]
        supports.append({'id':f'condyle_{"left" if side<0 else "right"}','kind':'support','center':point.round(4).tolist(),'radius':7.,'source':'developer_reference'})
    regions=supports+reference_load_regions(distal)
    for side,key in [(-1,'left'),(1,'right')]:
        a=np.array(anchors[key][2]);point=a+np.array([side*2.,-5.,6.])
        regions.append({'id':f'nerve_{key}','kind':'keep_out','center':point.round(4).tolist(),'radius':4.,'source':'developer_reference'})
    metadata={'id':identifier,'name':f'Visible Human · {identifier.title()} mandible',
      'source_url':'https://huggingface.co/datasets/BoneHub/visible-human-3d-models',
      'source_paper':'https://doi.org/10.1038/s41597-022-01905-2',
      'dataset_doi':'https://doi.org/10.57967/hf/10464','authors':'S. H. Alavi & M. Asseln (2026)',
      'license':'CC BY 4.0','source_sha256':hashlib.sha256(source_path.read_bytes()).hexdigest(),
      'triangles':len(mesh.faces),'units':'mm','bounds':mesh.bounds.tolist(),
      'transform':{'source_center':center.tolist(),'axes':['x','z','-y']},
      'segments':{name:{'url':f'/assets/cases/{identifier}/{name}.stl','volume_mm3':float(m.volume),'triangles':len(m.faces)} for name,m in segments.items()},
      'reference_url':f'/assets/cases/{identifier}/reference.stl',
      'plate_anchors':anchors,'regions':regions,'cut_parameters':p,
      'geometry_quality':{'watertight':True,'positive_volume':True,'partition_volume_relative_error':float(partition_error)},
      'osteotomy':'Developer-prepared stepped bilateral sagittal-split reference; anatomical/domain review outstanding.',
      'contact_model':'Mechanically distinct segments; no frictional/contact model. No clinical validation.',
      'registration':'Developer reference load/support/nerve annotations; editable and not inferred patient landmarks.'}
    (target/'anatomy.json').write_text(json.dumps(metadata,indent=2))
    return metadata

if __name__=='__main__':
    library=[prepare('male','mandible_source.stl'),prepare('female','mandible_female_source.stl')]
    (PUBLIC/'index.json').write_text(json.dumps(library,indent=2))
    print(json.dumps([{'id':m['id'],'quality':m['geometry_quality'],'anchors':m['plate_anchors']} for m in library],indent=2))

