"""Independent heterogeneous Tet4 matrix, affine patch and CPU/GPU solution checks."""
from itertools import product
import numpy as np
from scipy.sparse import coo_matrix,bsr_matrix
from scipy.sparse.linalg import spsolve
import warp as wp
import warp.fem as fem
from jaw_solver import heterogeneous_elasticity
from fem_solver import solve_system

def reference(points,tets,young,poisson):
    blocks=[];gradients=[]
    for vertices,e,nu in zip(points[tets],young,poisson):
        coordinates=np.column_stack((np.ones(4),vertices))
        gradient=np.linalg.inv(coordinates)[1:,:].T;gradients.append(gradient)
        volume=abs(np.linalg.det(coordinates))/6
        lam=e*nu/((1+nu)*(1-2*nu));mu=e/(2*(1+nu))
        elasticity=np.zeros((6,6));elasticity[:3,:3]=lam
        np.fill_diagonal(elasticity[:3,:3],lam+2*mu);elasticity[3:,3:]=np.eye(3)*mu
        strain=np.zeros((6,12))
        for i,(dx,dy,dz) in enumerate(gradient):
            strain[:,i*3:i*3+3]=[[dx,0,0],[0,dy,0],[0,0,dz],[dy,dx,0],[0,dz,dy],[dz,0,dx]]
        blocks.append(strain.T@elasticity@strain*volume)
    dofs=(tets[:,:,None]*3+np.arange(3)).reshape(-1,12)
    rows=np.broadcast_to(dofs[:,:,None],(len(tets),12,12)).ravel()
    columns=np.broadcast_to(dofs[:,None,:],(len(tets),12,12)).ravel()
    return coo_matrix((np.asarray(blocks).ravel(),(rows,columns)),shape=(len(points)*3,)*2).tocsr()

def check(device='cuda:0'):
    points=np.array(list(product(np.linspace(0,8,5),np.linspace(-1,1,3),np.linspace(-1,1,3))))
    ids=np.arange(len(points)).reshape(5,3,3)
    offsets=np.array(list(product((0,1),repeat=3)))
    pattern=np.array([[0,1,3,7],[0,3,2,7],[0,2,6,7],[0,6,4,7],[0,4,5,7],[0,5,1,7]])
    tets=[]
    for i,j,k in product(range(4),range(2),range(2)):
        cube=np.array([ids[i+di,j+dj,k+dk] for di,dj,dk in offsets]);tets.extend(cube[pattern])
    tets=np.asarray(tets,dtype=np.int32)
    determinant=np.linalg.det(np.transpose(points[tets[:,1:]]-points[tets[:,0,None]],(0,2,1)))
    negative=determinant<0;tets[negative,1],tets[negative,2]=tets[negative,2].copy(),tets[negative,1].copy()
    young=np.where(points[tets].mean(1)[:,0]<4,1200.,110000.);poisson=np.full(len(tets),.3)
    cpu=reference(points,tets,young,poisson)
    wp.init()
    with wp.ScopedDevice(device):
        mesh=fem.Tetmesh(wp.array(tets,dtype=wp.int32),wp.array(points,dtype=wp.vec3d))
        space=fem.make_polynomial_space(mesh,degree=1,dtype=wp.vec3d)
        matrix=fem.integrate(heterogeneous_elasticity,fields={'u':fem.make_trial(space),'v':fem.make_test(space)},
            values={'young':wp.array(young,dtype=wp.float64),'poisson':wp.array(poisson,dtype=wp.float64)},output_dtype=wp.float64,assembly='generic')
        count=matrix.nnz_sync()
        gpu=bsr_matrix((matrix.values.numpy()[:count],matrix.columns.numpy()[:count],matrix.offsets.numpy()),shape=matrix.shape).tocsr()
        matrix_error=float(np.linalg.norm((gpu-cpu).data)/np.linalg.norm(cpu.data))
        rhs=np.zeros_like(points);tip=np.isclose(points[:,0],8);rhs[tip,1]=-1/tip.sum();fixed=np.isclose(points[:,0],0)
        free=~np.repeat(fixed,3);expected=np.zeros(len(points)*3);expected[free]=spsolve(cpu[free][:,free],rhs.ravel()[free])
        solution,telemetry=solve_system(matrix,wp.array(rhs,dtype=wp.vec3d),fixed,space,tolerance=1e-10,max_iterations=3000)
        solution_error=float(np.linalg.norm(solution.dof_values.numpy().ravel()-expected)/np.linalg.norm(expected))
        from gpu_amg import build
        precondition,_=build(matrix,points,fixed)
        rng=np.random.default_rng(42)
        x=wp.array(rng.normal(size=points.shape),dtype=wp.vec3d)
        y_initial=rng.normal(size=points.shape);y=wp.array(y_initial,dtype=wp.vec3d)
        mx=wp.zeros(len(points),dtype=wp.vec3d)
        precondition.matvec(x,mx,mx,1.,0.)
        expected_action=1.7*mx.numpy()+.3*y_initial
        precondition.matvec(x,y,y,1.7,.3)
        alias_error=float(np.linalg.norm(y.numpy()-expected_action)/np.linalg.norm(expected_action))
    homogeneous=reference(points,tets,np.full(len(tets),110000.),poisson)
    affine=np.array([[1e-4,2e-5,0],[2e-5,-3e-5,1e-5],[0,1e-5,2e-5]])
    u=(points@affine.T+np.array([.02,-.03,.01])).ravel()
    interior=(points[:,0]>0)&(points[:,0]<8)&(np.abs(points[:,1])<1)&(np.abs(points[:,2])<1)
    nodal_force=(homogeneous@u).reshape(-1,3)
    patch_error=float(np.linalg.norm(nodal_force[interior])/max(np.linalg.norm(nodal_force),1e-16))
    mu=110000/(2*1.3);lam=110000*.3/(1.3*.4)
    exact_energy=32*(2*mu*(affine**2).sum()+lam*np.trace(affine)**2)
    energy_error=float(abs(u@homogeneous@u-exact_energy)/exact_energy)
    return {'model':'heterogeneous-tet4-check-v1','nodes':len(points),'tetrahedra':len(tets),
        'independent_matrix_relative_error':matrix_error,'independent_solution_relative_error':solution_error,
        'affine_patch_relative_residual':patch_error,'affine_energy_relative_error':energy_error,
        'gpu_relative_residual':telemetry['relative_residual'],
        'amg_aliased_action_relative_error':alias_error,
        'passed':bool(alias_error<1e-10 and matrix_error<1e-10 and solution_error<1e-6 and patch_error<1e-10 and energy_error<1e-10),
        'scope':'Small heterogeneous Tet4 calculation check; excludes anatomical registration, screw bonds and mesh convergence.'}

if __name__=='__main__':
    import json
    result=check();print(json.dumps(result,indent=2));raise SystemExit(0 if result['passed'] else 1)
