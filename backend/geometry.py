"""One geometry definition for CAD rendering, clearance, exports and FEM domains."""
from __future__ import annotations
from dataclasses import dataclass
from functools import lru_cache
import hashlib,json,math
from pathlib import Path
import numpy as np
import trimesh
import manifold3d
from models import PlateParameters
from prepare_cases import PUBLIC,proximal_mask

@lru_cache(maxsize=8)
def metadata(anatomy_id):
    if anatomy_id not in ('male','female'):raise ValueError('Unknown reference anatomy.')
    return json.loads((PUBLIC/anatomy_id/'anatomy.json').read_text())

@lru_cache(maxsize=12)
def segment(anatomy_id,name,snapshot=None):
    if name not in ('proximal_left','proximal_right','distal','reference'):raise ValueError('Unknown anatomy segment.')
    if snapshot:
        from reference_assets import read_snapshot
        _,folder=read_snapshot(snapshot)
        return trimesh.load_mesh(folder/f'{name}.stl')
    return trimesh.load_mesh(PUBLIC/anatomy_id/f'{name}.stl')


def cylinder_between(a,b,radius,sections=24):
    a,b=np.asarray(a),np.asarray(b);d=b-a
    mesh=trimesh.creation.cylinder(radius=radius,height=np.linalg.norm(d),sections=sections)
    matrix=trimesh.geometry.align_vectors([0,0,1],d/np.linalg.norm(d));mesh.apply_transform(matrix)
    mesh.apply_translation((a+b)/2)
    return mesh


def bridge_between(a,b,width,thickness,normal):
    a,b=np.asarray(a),np.asarray(b);x=b-a;length=np.linalg.norm(x);x/=length
    z=normal-x*np.dot(normal,x);z/=np.linalg.norm(z);y=np.cross(z,x)
    matrix=np.eye(4);matrix[:3,:3]=np.column_stack((x,y,z));matrix[:3,3]=(a+b)/2
    mesh=trimesh.creation.box([length,width,thickness]);mesh.apply_transform(matrix)
    return mesh


def segment_distance(center,a,b):
    a,b,c=np.asarray(a),np.asarray(b),np.asarray(center);d=b-a
    t=np.clip(np.dot(c-a,d)/np.dot(d,d),0,1) if np.dot(d,d)>1e-20 else 0.
    return float(np.linalg.norm(c-a-t*d))

def segment_segment_distance(a,b,c,d):
    a,b,c,d=map(lambda p:np.asarray(p,dtype=float),(a,b,c,d))
    values=[segment_distance(a,c,d),segment_distance(b,c,d),segment_distance(c,a,b),segment_distance(d,a,b)]
    u,v,w=b-a,d-c,a-c
    aa,bb,cc,dd,ee=np.dot(u,u),np.dot(u,v),np.dot(v,v),np.dot(u,w),np.dot(v,w)
    denominator=aa*cc-bb*bb
    if denominator>1e-12*max(aa*cc,1e-20):
        s,t=(bb*ee-cc*dd)/denominator,(aa*ee-bb*dd)/denominator
        if 0<=s<=1 and 0<=t<=1:values.append(float(np.linalg.norm(w+s*u-t*v)))
    return min(values)

def keep_out_clearance(region,start,end,shaft_radius=1.1):
    points=region.get('points')
    if points and len(points)>1:
        distance=min(segment_segment_distance(start,end,a,b) for a,b in zip(points[:-1],points[1:]))
    else:distance=segment_distance(points[0] if points else region['center'],start,end)
    return distance-region['radius']-shaft_radius

def clean_solid(mesh):
    """Collapse Boolean slivers within 1 micron for both display and analysis."""
    solid=manifold3d.Manifold(manifold3d.Mesh(np.asarray(mesh.vertices,dtype=np.float32),
                                            np.asarray(mesh.faces,dtype=np.uint32))).simplify(.001)
    output=solid.to_mesh()
    result=trimesh.Trimesh(np.array(output.vert_properties)[:,:3],np.array(output.tri_verts))
    if not result.is_volume:raise ValueError('CAD Boolean did not produce a closed positive volume.')
    return result

@dataclass
class Assembly:
    anatomy:dict
    params:dict
    meshes:list
    screws:list
    regions:list
    checks:dict
    geometry_hash:str
    shape_hash:str
    cad_version:int=3
    def packet(self):
        return {'anatomy':self.anatomy,'params':self.params,'regions':self.regions,'screws':self.screws,
                'checks':self.checks,'geometry_hash':self.geometry_hash,'shape_hash':self.shape_hash,
                'meshes':[{'id':entry['id'],'material':entry['material'],
                    'positions':np.asarray(entry['mesh'].vertices).round(5).ravel().tolist(),
                    'indices':np.asarray(entry['mesh'].faces).ravel().tolist()} for entry in self.meshes]}


def build(anatomy_id,parameters,regions=None,snapshot=None,cad_version=3):
    if cad_version not in (3,4,5):raise ValueError('Unsupported fixation geometry version.')
    params=PlateParameters.model_validate(parameters).model_dump()
    if snapshot:
        from reference_assets import read_snapshot
        record,_=read_snapshot(snapshot)
        if record['anatomy_id']!=anatomy_id:raise ValueError('Anatomy asset version belongs to another reference.')
        meta=record['metadata']
    else:meta=metadata(anatomy_id)
    moved=np.array([0.,0.,params['advancement']])
    meshes=[]
    for name in ['proximal_left','proximal_right','distal']:
        mesh=segment(anatomy_id,name,snapshot).copy()
        if name=='distal':mesh.apply_translation(moved)
        meshes.append({'id':name,'material':'bone','mesh':mesh})
    annotations=[]
    for region in (regions if regions is not None else meta['regions']):
        r={**region,'center':list(region['center'])}
        if r.get('points'):
            r['points']=[(np.asarray(p)+(moved if r['kind']!='support' else 0)).tolist() for p in r['points']]
            r['center']=np.mean(r['points'],axis=0).tolist()
        elif 'points' in r:r.pop('points')
        if r['kind']!='support' and not r.get('points'):r['center']=(np.array(r['center'])+moved).tolist()
        annotations.append(r)
    screws=[];engagement=[];hole_spacings=[]
    for key,side in [('left',-1),('right',1)]:
        anchors=np.array(meta['plate_anchors'][key])
        distal=~proximal_mask(anchors,meta['cut_parameters'])
        anchors[distal]+=moved
        tangent=anchors[-1]-anchors[0];tangent[1]=0;tangent/=np.linalg.norm(tangent)
        normal=np.cross(tangent,[0,1,0])*side
        # Choose the radial outward direction on each side.
        if normal[0]*side<0:normal=-normal
        anchors[:,1]+=params['plate_shift'];anchors[2,1]+=params['offset']
        # Reproject sliding edits onto the intended bone segment. Each screw
        # follows the local outward surface normal, rather than a common axis
        # that can entirely miss a curved ramus.
        normals=[]
        for i,anchor in enumerate(anchors):
            target=meshes[2 if distal[i] else (0 if side<0 else 1)]['mesh']
            point,_,face=trimesh.proximity.closest_point(target,anchor[None,:])
            anchors[i]=point[0]
            n=target.face_normals[face[0]].copy()
            if np.dot(n,normal)<0: n=-n
            normals.append(n/np.linalg.norm(n))
        normals=np.asarray(normals)
        centers=anchors+normals*(1.+params['thickness']/2)
        plate_parts=[];holes=[]
        if cad_version>=4:
            if cad_version==5:
                from contoured_cad_v5 import plate as contoured_plate
                plate,hole_normals=contoured_plate(centers,normals,params['width'],params['thickness'],params['screw_angle'])
            else:
                from contoured_cad import plate as contoured_plate
                plate,hole_normals=contoured_plate(centers,normals,params['width'],params['thickness'])
            normals=hole_normals
        for i,point in enumerate(centers):
            local_normal=normals[i]
            if cad_version==3:plate_parts.append(cylinder_between(point-local_normal*params['thickness']/2,point+local_normal*params['thickness']/2,max(2.5,params['width']*.7)))
            if cad_version>=4:
                tilt=np.array([0.,1.,0.])-local_normal*local_normal[1];tilt/=np.linalg.norm(tilt)
                angle=math.radians(params['screw_angle']);hole_axis=local_normal*math.cos(angle)+tilt*math.sin(angle)
            else:hole_axis=local_normal
            holes.append(cylinder_between(point-hole_axis*(params['thickness']/2+2),point+hole_axis*(params['thickness']/2+2),1.2))
            if i<3:
                bridge_normal=normals[i]+normals[i+1];bridge_normal/=np.linalg.norm(bridge_normal)
                if cad_version==3:plate_parts.append(bridge_between(point,centers[i+1],params['width'],params['thickness'],bridge_normal))
                hole_spacings.append(float(np.linalg.norm(point-centers[i+1])))
        if cad_version==3:plate=trimesh.boolean.union(plate_parts,engine='manifold')
        if cad_version==5:
            from contoured_cad_v5 import clean
            plate=clean(plate)
        else:plate=clean_solid(trimesh.boolean.difference([plate,*holes],engine='manifold'))
        meshes.append({'id':f'plate_{key}','material':'titanium','mesh':plate})
        for i,anchor in enumerate(anchors):
            # Positive trajectory angles tilt towards superior, preserving a unit axis.
            angle=math.radians(params['screw_angle']);local_normal=normals[i]
            tilt=np.array([0.,1.,0.])-local_normal*local_normal[1];tilt/=np.linalg.norm(tilt)
            direction=local_normal*math.cos(angle)+tilt*math.sin(angle)
            start=anchor+direction*(1.+params['thickness']+.3) if cad_version==3 else centers[i]+direction*(params['thickness']/2+.3)
            end=start-direction*params['screw_length']
            if cad_version==3:
                shaft=cylinder_between(start,end,1.1)
                head=cylinder_between(start-direction*.45,start+direction*.6,1.65)
                hardware=clean_solid(trimesh.boolean.union([shaft,head],engine='manifold'))
            else:
                from contoured_cad import screw as blended_screw
                if cad_version==5:
                    from contoured_cad_v5 import clean,screw as blended_screw
                    hardware=clean(blended_screw(start,direction,params['screw_length']))
                else:hardware=clean_solid(blended_screw(start,direction,params['screw_length']))
            meshes.append({'id':f'screw_{key}_{i+1}','material':'titanium','mesh':hardware})
            keep_outs=[r for r in annotations if r['kind']=='keep_out']
            if not keep_outs:raise ValueError('At least one keep-out annotation is required for clearance review.')
            clearance=min(keep_out_clearance(r,start,end) for r in keep_outs)
            samples=start+np.linspace(0,1,16)[:,None]*(end-start)
            inside=np.zeros(len(samples),dtype=bool)
            for entry in meshes[:3]:inside|=entry['mesh'].contains(samples)
            engaged=float(inside.mean()*params['screw_length']);engagement.append(engaged)
            screws.append({'id':f'screw_{key}_{i+1}','start':start.tolist(),'end':end.tolist(),
                'radius':1.1,'clearance_mm':float(max(clearance,0.)),'bone_engagement_proxy_mm':engaged})
    clearance=min(s['clearance_mm'] for s in screws)
    checks={'min_clearance_mm':clearance,'clearance_pass':clearance>=params['min_clearance'],
            'min_hole_spacing_mm':min(hole_spacings),'hole_spacing_pass':min(hole_spacings)>5.5,
            'min_bone_engagement_proxy_mm':min(engagement),'engagement_pass':min(engagement)>=1.,
            'plate_volume_mm3':sum(e['mesh'].volume for e in meshes if e['id'].startswith('plate_')),
            'note':'Engagement is a surface-volume sampling proxy. Developer-defined keep-out annotations are not traced patient nerves.'}
    digest=hashlib.sha256(json.dumps({'source':meta['source_sha256'],'registration':meta['plate_anchors'],
        'cuts':meta['cut_parameters'],'params':params,'regions':annotations,'geometry_version':cad_version},sort_keys=True).encode()).hexdigest()
    shape_params={key:value for key,value in params.items() if key in ('thickness','width','offset','advancement','screw_length','screw_angle','plate_shift')}
    shape_digest=hashlib.sha256(json.dumps({'source':meta['source_sha256'],'registration':meta['plate_anchors'],
        'cuts':meta['cut_parameters'],'params':shape_params,'geometry_version':cad_version,'snapshot':snapshot},sort_keys=True).encode()).hexdigest()
    return Assembly(meta,params,meshes,screws,annotations,checks,digest,shape_digest,cad_version)

if __name__=='__main__':
    result=build('male',{})
    print(json.dumps({'hash':result.geometry_hash,'checks':result.checks,'volumes':{m['id']:m['mesh'].volume for m in result.meshes}},indent=2))
