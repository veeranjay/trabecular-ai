"""Linear bone / quadratic titanium FEM without quadratic whole-jaw overhead."""
import numpy as np
from scipy.spatial import cKDTree
import warp as wp
import warp.fem as fem
from warp.sparse import bsr_from_triplets

EDGES=((0,1),(0,2),(0,3),(1,2),(1,3),(2,3))
GAUSS=np.full((4,4),.1381966011250105);np.fill_diagonal(GAUSS,.5854101966249685)

def assemble(assembly,arrays,mesh_info,device,form,progress):
    points=[];cells=[];connectivity=[];degrees=[];node_offsets=[];cell_offsets=[]
    young=[];poisson=[];material=[];rows=[];columns=[];values=[]
    for i,component in enumerate(mesh_info['components']):
        progress('Assembling '+component['id'].replace('_',' '),.35+i/len(mesh_info['components'])*.3)
        p,t=arrays[f'p{i}'],arrays[f't{i}'];degree=1 if i<3 else 2
        node_offsets.append(sum(len(value) for value in points));cell_offsets.append(sum(len(value) for value in cells))
        if i<3:
            distance,_=cKDTree(assembly.meshes[i]['mesh'].vertices).query(p[t].mean(axis=1))
            cortical=distance<2.;e=np.where(cortical,17000.,assembly.params['modulus']);mat=np.where(cortical,1,2)
        else:e=np.full(len(t),110000.);mat=np.full(len(t),3)
        nu=np.full(len(t),.3)
        with wp.ScopedDevice(device):
            geometry=fem.Tetmesh(wp.array(t,dtype=wp.int32),wp.array(p,dtype=wp.vec3d))
            space=fem.make_polynomial_space(geometry,degree=degree,dtype=wp.vec3d)
            nodes=space.node_positions().numpy()
            matrix=fem.integrate(form,fields={'u':fem.make_trial(space),'v':fem.make_test(space)},
                values={'young':wp.array(e,dtype=wp.float64),'poisson':wp.array(nu,dtype=wp.float64)},
                output_dtype=wp.float64,assembly='generic')
            count=matrix.nnz_sync();offsets=matrix.offsets.numpy()
            rows.append(np.repeat(np.arange(len(nodes),dtype=np.int32),np.diff(offsets))+node_offsets[-1])
            columns.append(matrix.columns.numpy()[:count]+node_offsets[-1]);values.append(matrix.values.numpy()[:count])
            del matrix,space,geometry
        tree=cKDTree(nodes);distance,base_nodes=tree.query(p)
        if distance.max()>1e-7:raise ValueError('FEM nodes do not preserve source tetrahedral vertices.')
        local=np.full((len(t),10),-1,dtype=np.int32);local[:,:4]=base_nodes[t]
        if degree==2:
            for edge,(a,b) in enumerate(EDGES):
                distance,edge_nodes=tree.query((p[t[:,a]]+p[t[:,b]])/2)
                if distance.max()>1e-7:raise ValueError('Quadratic edge-node correspondence failed.')
                local[:,4+edge]=edge_nodes
        shifted=local.copy();shifted[shifted>=0]+=node_offsets[-1]
        connectivity.append(shifted);points.append(nodes);cells.append(base_nodes[t]+node_offsets[-1])
        degrees.append(np.full(len(t),degree,dtype=np.int8));young.append(e);poisson.append(nu);material.append(mat)
        component.update(displacement_degree=degree,field_nodes=len(nodes))
    positions=np.vstack(points)
    with wp.ScopedDevice(device):
        matrix=bsr_from_triplets(len(positions),len(positions),wp.array(np.concatenate(rows),dtype=wp.int32),
            wp.array(np.concatenate(columns),dtype=wp.int32),wp.array(np.concatenate(values),dtype=wp.mat33d))
    return {'matrix':matrix,'points':points,'positions':positions,'cells':np.vstack(cells).astype(np.int32),
        'connectivity':np.vstack(connectivity),'degree':np.concatenate(degrees),'node_offsets':node_offsets,
        'cell_offsets':cell_offsets,'young':np.concatenate(young),'poisson':np.concatenate(poisson),'material':np.concatenate(material)}

def recover(positions,cells,connectivity,degree,u,young,poisson):
    inverse=np.linalg.inv(np.transpose(positions[cells[:,1:]]-positions[cells[:,0,None]],(0,2,1)))
    gradient_lambda=np.concatenate((-inverse.sum(axis=1)[:,None,:],inverse),axis=1)
    stress_q=np.zeros((len(cells),4));principal_q=np.zeros((len(cells),4,3))
    for element_degree in (1,2):
        selected=np.flatnonzero(degree==element_degree)
        grad=gradient_lambda[selected];values=u[connectivity[selected,:4 if element_degree==1 else 10]]
        mu=young[selected]/(2*(1+poisson[selected]));lam=young[selected]*poisson[selected]/((1+poisson[selected])*(1-2*poisson[selected]))
        for q,bary in enumerate(GAUSS):
            if element_degree==1:gradient_shape=grad
            else:
                gradient_shape=np.empty((len(selected),10,3));gradient_shape[:,:4]=(4*bary-1)[None,:,None]*grad
                for edge,(i,j) in enumerate(EDGES):gradient_shape[:,4+edge]=4*(bary[i]*grad[:,j]+bary[j]*grad[:,i])
            gradient=values.transpose(0,2,1)@gradient_shape;strain=(gradient+gradient.transpose(0,2,1))/2
            stress=2*mu[:,None,None]*strain+lam[:,None,None]*np.trace(strain,axis1=1,axis2=2)[:,None,None]*np.eye(3)
            dev=stress-np.trace(stress,axis1=1,axis2=2)[:,None,None]/3*np.eye(3)
            stress_q[selected,q]=np.sqrt(1.5*(dev**2).sum(axis=(1,2)));principal_q[selected,q]=np.linalg.eigvalsh(strain)
    return stress_q,principal_q
