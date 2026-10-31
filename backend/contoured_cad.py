"""Continuous four-hole plate sweep and blended locking screw head geometry."""
import numpy as np
from scipy.interpolate import CubicSpline
import trimesh

def frame_functions(centers,normals):
    arc=np.concatenate(([0.],np.cumsum(np.linalg.norm(np.diff(centers,axis=0),axis=1))))
    curve=CubicSpline(arc,centers,axis=0,bc_type='natural')
    normal_curve=CubicSpline(arc,normals,axis=0,bc_type='natural')
    def frame(values):
        values=np.atleast_1d(values)
        tangent=curve(values,1);tangent/=np.linalg.norm(tangent,axis=1)[:,None]
        normal=normal_curve(np.clip(values,arc[0],arc[-1]));normal-=tangent*(normal*tangent).sum(axis=1)[:,None]
        magnitude=np.linalg.norm(normal,axis=1)
        if magnitude.min()<.1:raise ValueError('Plate registration has an unstable sweep frame.')
        normal/=magnitude[:,None];across=np.cross(normal,tangent)
        return curve(values),normal,across
    return arc,frame

def plate(centers,normals,width,thickness):
    arc,frame=frame_functions(centers,normals)
    radius=max(2.5,width*.7)
    coordinates=np.unique(np.concatenate((np.linspace(-radius+.04,arc[-1]+radius-.04,max(100,int((arc[-1]+2*radius)/.35))),arc)))
    path,normal,across=frame(coordinates)
    half=np.full(len(coordinates),width/2)
    for hole in arc:half=np.maximum(half,width/2+(radius-width/2)*np.exp(-((coordinates-hole)/(radius*.85))**4))
    before=coordinates<0;after=coordinates>arc[-1]
    half[before]=np.sqrt(np.maximum(.01,radius**2-coordinates[before]**2))
    half[after]=np.sqrt(np.maximum(.01,radius**2-(coordinates[after]-arc[-1])**2))
    vertices=[]
    for point,n,b,w in zip(path,normal,across,half):
        vertices.extend([point+b*w+n*thickness/2,point-b*w+n*thickness/2,
                         point-b*w-n*thickness/2,point+b*w-n*thickness/2])
    faces=[]
    for i in range(len(coordinates)-1):
        for j in range(4):
            a,b=4*i+j,4*i+(j+1)%4;c,d=a+4,b+4
            faces.extend([[a,b,d],[a,d,c]])
    faces.extend([[0,2,1],[0,3,2]])
    end=4*(len(coordinates)-1);faces.extend([[end,end+1,end+2],[end,end+2,end+3]])
    solid=trimesh.Trimesh(np.asarray(vertices),np.asarray(faces));solid.fix_normals()
    if not solid.is_volume:raise ValueError('The contoured plate sweep is not a closed positive solid.')
    _,hole_normals,_=frame(arc)
    return solid,hole_normals

def screw(start,direction,length):
    profile=[[0,-length],[1.1,-length],[1.1,-.9]]
    for z in np.linspace(-.9,-.1,13)[1:]:
        t=(z+.9)/.8;profile.append([1.1+.55*t*t*(3-2*t),z])
    profile.extend([[1.65,.5],[1.62,.57],[1.55,.6],[0,.6]])
    mesh=trimesh.creation.revolve(np.asarray(profile),sections=32)
    mesh.apply_transform(trimesh.geometry.align_vectors([0,0,1],direction))
    mesh.apply_translation(start);mesh.fix_normals()
    return mesh
