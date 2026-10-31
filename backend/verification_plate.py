"""1.5 mm plate-bending calculation check with explicit thickness refinement."""
from itertools import product
import time
import numpy as np
import warp as wp
import warp.fem as fem
from jaw_solver import heterogeneous_elasticity
from fem_solver import solve_system,tip_traction

def cantilever(resolution,device='cuda:0',degree=2):
    nx,ny,nz=resolution;length,width,thickness,force=24.,4.,1.5,1.
    points=np.array(list(product(np.linspace(0,length,nx+1),np.linspace(-width/2,width/2,ny+1),np.linspace(-thickness/2,thickness/2,nz+1))))
    ids=np.arange(len(points)).reshape(nx+1,ny+1,nz+1);offsets=np.array(list(product((0,1),repeat=3)))
    pattern=np.array([[0,1,3,7],[0,3,2,7],[0,2,6,7],[0,6,4,7],[0,4,5,7],[0,5,1,7]])
    cells=[]
    for i,j,k in product(range(nx),range(ny),range(nz)):
        cube=np.array([ids[i+di,j+dj,k+dk] for di,dj,dk in offsets]);cells.extend(cube[pattern])
    cells=np.asarray(cells,dtype=np.int32)
    determinant=np.linalg.det(np.transpose(points[cells[:,1:]]-points[cells[:,0,None]],(0,2,1)))
    negative=determinant<0;cells[negative,1],cells[negative,2]=cells[negative,2].copy(),cells[negative,1].copy()
    rhs=np.zeros_like(points)
    for j,k in product(range(ny),range(nz)):rhs[ids[nx,j:j+2,k:k+2].ravel(),2]-=force/(ny*nz*4)
    wp.init();start=time.perf_counter()
    with wp.ScopedDevice(device):
        mesh=fem.Tetmesh(wp.array(cells,dtype=wp.int32),wp.array(points,dtype=wp.vec3d))
        space=fem.make_polynomial_space(mesh,degree=degree,dtype=wp.vec3d)
        matrix=fem.integrate(heterogeneous_elasticity,fields={'u':fem.make_trial(space),'v':fem.make_test(space)},
            values={'young':wp.array(np.full(len(cells),110000.),dtype=wp.float64),'poisson':wp.array(np.full(len(cells),.3),dtype=wp.float64)},
            output_dtype=wp.float64,assembly='generic')
        boundary=fem.BoundarySides(mesh)
        rhs_field=fem.integrate(tip_traction,fields={'v':fem.make_test(space,domain=boundary)},
            values={'traction':wp.vec3d(0,0,-force/(width*thickness))},output_dtype=wp.vec3d)
        nodes=space.node_positions().numpy()
        field,telemetry=solve_system(matrix,rhs_field,np.isclose(nodes[:,0],0),space,tolerance=1e-9,max_iterations=4000,amg=True)
        displacement=field.dof_values.numpy()
    tip=float(np.sum(displacement[:,2]*rhs_field.numpy()[:,2])/force)
    exact=force*length**3/(3*110000*(width*thickness**3/12))
    return {'resolution':list(resolution),'degree':degree,'nodes':len(nodes),'tetrahedra':len(cells),'thickness_layers':nz,
        'tip_deflection_mm':tip,'analytical_tip_deflection_mm':exact,'error_pct':abs(tip-exact)/exact*100,
        **telemetry,'elapsed_seconds':time.perf_counter()-start}

def check():
    diagnostic=cantilever((48,4,2),degree=1)
    levels=[cantilever(resolution) for resolution in ((24,4,2),(48,6,4),(72,8,6))]
    change=abs(levels[-1]['tip_deflection_mm']-levels[-2]['tip_deflection_mm'])/levels[-1]['tip_deflection_mm']
    return {'name':'Conforming quadratic Tet10 thin-plate cantilever','dimensions_mm':[24.,4.,1.5],
        'linear_tet_diagnostic':diagnostic,
        'force_n':[0.,0.,-1.],'series':levels,'last_deflection_change_pct':change*100,
        'passed':bool(levels[-1]['error_pct']<5 and change<.05 and levels[-1]['relative_residual']<1e-6 and levels[-1]['force_balance_error']<.01),
        'scope':'Quadratic hardware method check for 1.5 mm rectangular plate bending. Does not qualify an anatomically fitted plate mesh or screw bonds.'}

if __name__=='__main__':
    import json
    result=check();print(json.dumps(result,indent=2));raise SystemExit(0 if result['passed'] else 1)
