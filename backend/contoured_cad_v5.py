"""Contour with explicitly triangulated holes, avoiding intersecting Boolean skins.

All topology is established in the plate's longitudinal/transverse coordinates
before mapping to its registered 3D curve. Hole walls follow the screw axis.
"""
import numpy as np
import trimesh
from shapely.geometry import Polygon
import manifold3d as mf
from contoured_cad import frame_functions

def screw(start,direction,length):
    # Explicit 16-sided engineering geometry: <= 0.032 mm radial chord error
    # at the head. Avoid sub-0.1 mm bevel facets in the preview CAD family.
    profile=[[0,-length],[1.1,-length],[1.1,-.9]]
    for t in (.25,.5,.75,1.):profile.append([1.1+.55*t*t*(3-2*t),-.9+.8*t])
    profile.extend([[1.65,.5],[1.55,.6],[0,.6]])
    mesh=trimesh.creation.revolve(np.asarray(profile),sections=16)
    mesh.apply_transform(trimesh.geometry.align_vectors([0,0,1],direction))
    mesh.apply_translation(start);mesh.fix_normals()
    return mesh

def as_solid(mesh):
    value=mf.Manifold(mf.Mesh64(np.asarray(mesh.vertices,dtype=np.float64),np.asarray(mesh.faces,dtype=np.uint64)))
    if value.status()!=mf.Error.NoError:raise ValueError('Hardware topology is invalid.')
    return value

def as_mesh(solid):
    out=solid.to_mesh64()
    mesh=trimesh.Trimesh(np.array(out.vert_properties)[:,:3],np.array(out.tri_verts),process=False)
    if not mesh.is_volume:raise ValueError('Hardware is not a closed positive solid.')
    return mesh

def clean(mesh):return as_mesh(as_solid(mesh).simplify(.001))

def union(parts):
    solid=as_solid(parts[0])
    for mesh in parts[1:]:solid=solid+as_solid(mesh)
    return as_mesh(solid.simplify(.001))

def plate(centers,normals,width,thickness,angle):
    arc,frame=frame_functions(centers,normals)
    radius=max(2.5,width*.7)
    coordinates=np.linspace(-radius+.04,arc[-1]+radius-.04,max(60,int((arc[-1]+2*radius)/.7)))
    half=np.full(len(coordinates),width/2)
    for hole in arc:half=np.maximum(half,width/2+(radius-width/2)*np.exp(-((coordinates-hole)/(radius*.85))**4))
    before=coordinates<0;after=coordinates>arc[-1]
    half[before]=np.sqrt(np.maximum(.01,radius**2-coordinates[before]**2))
    half[after]=np.sqrt(np.maximum(.01,radius**2-(coordinates[after]-arc[-1])**2))
    outline=np.vstack((np.column_stack((coordinates,half)),np.column_stack((coordinates[::-1],-half[::-1]))))
    theta=np.linspace(0,2*np.pi,32,endpoint=False)
    holes=[np.column_stack((s+1.2*np.cos(theta),1.2*np.sin(theta))) for s in arc]
    polygon=Polygon(outline,holes)
    if not polygon.is_valid:raise ValueError('The registered plate outline intersects a screw hole.')
    uv,faces=trimesh.creation.triangulate_polygon(polygon,engine='triangle',triangle_args='pqa2')
    mesh=trimesh.creation.extrude_triangulation(uv,faces,thickness)
    local=np.asarray(mesh.vertices).copy();local[:,2]-=thickness/2
    path,n,b=frame(local[:,0])
    tilt=np.tile([0.,1.,0.],(len(n),1))-n*n[:,1,None]
    tilt/=np.linalg.norm(tilt,axis=1)[:,None]
    world=path+b*local[:,1,None]+(n+tilt*np.tan(np.deg2rad(angle)))*local[:,2,None]
    _,hole_normals,_=frame(arc)
    mesh.vertices=world;mesh.fix_normals()
    if not mesh.is_volume:raise ValueError('The registered contour folds onto itself.')
    return mesh,hole_normals
