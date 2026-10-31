"""Three-dimensional small-strain elasticity assembled with NVIDIA Warp FEM.

This module supplies a genuine 3D benchmark before anatomy-specific assembly is
introduced. All reported residuals and reactions are evaluated from matrices.
"""
from __future__ import annotations
import time
import numpy as np
import warp as wp
import warp.fem as fem
from warp.optim.linear import cg, preconditioner
from warp.sparse import bsr_copy, bsr_diag, bsr_mv

@fem.integrand
def elastic_form(s: fem.Sample, u: fem.Field, v: fem.Field, young: wp.float64, poisson: wp.float64):
    mu = young / (wp.float64(2.0) * (wp.float64(1.0) + poisson))
    lam = young * poisson / ((wp.float64(1.0) + poisson) * (wp.float64(1.0) - wp.float64(2.0)*poisson))
    du = wp.mat33d(fem.D(u, s))
    dv = wp.mat33d(fem.D(v, s))
    return wp.float64(2.0)*mu*wp.ddot(du,dv) + lam*wp.float64(fem.div(u,s))*wp.float64(fem.div(v,s))

@fem.integrand
def tip_traction(s: fem.Sample, domain: fem.Domain, v: fem.Field, traction: wp.vec3d):
    normal = fem.normal(domain,s)
    if normal[0] > 0.5:
        return wp.dot(wp.vec3d(v(s)),traction)
    return wp.float64(0.0)

@fem.integrand
def equivalent_stress(s: fem.Sample, u: fem.Field, young: wp.float64, poisson: wp.float64):
    mu = young / (wp.float64(2.0) * (wp.float64(1.0) + poisson))
    lam = young * poisson / ((wp.float64(1.0) + poisson) * (wp.float64(1.0) - wp.float64(2.0)*poisson))
    strain = wp.mat33d(fem.D(u,s))
    stress = wp.float64(2.0)*mu*strain + lam*wp.trace(strain)*wp.identity(n=3,dtype=wp.float64)
    dev = stress - wp.trace(stress)/wp.float64(3.0)*wp.identity(n=3,dtype=wp.float64)
    return wp.float32(wp.sqrt(wp.float64(1.5)*wp.ddot(dev,dev)))


def solve_displacements(matrix, rhs, pinned, positions, *, tolerance=1e-8, max_iterations=8000, amg=False):
    device=matrix.device
    raw_matrix=bsr_copy(matrix)
    raw_rhs=wp.clone(rhs)
    projectors=np.zeros((len(pinned),3,3),dtype=np.float64)
    projectors[pinned]=np.eye(3)
    projector=bsr_diag(wp.array(projectors,dtype=wp.mat33d,device=device))
    fem.project_linear_system(matrix,rhs,projector)
    solution=wp.zeros(len(positions),dtype=wp.vec3d,device=device)
    amg_levels=[]
    setup_start=time.perf_counter()
    if amg:
        from gpu_amg import build
        precondition,amg_levels=build(matrix,positions,pinned)
    else:precondition=preconditioner(matrix,'diag')
    setup_seconds=time.perf_counter()-setup_start
    start=time.perf_counter()
    iterations,recursive_residual,absolute_tolerance=cg(matrix,rhs,solution,
        M=precondition,tol=tolerance,atol=1e-12,
        maxiter=max_iterations,check_every=20,use_cuda_graph=device.is_cuda)
    wp.synchronize_device(device)
    solve_seconds=time.perf_counter()-start
    residual=wp.clone(rhs)
    bsr_mv(matrix,solution,residual,alpha=-1.,beta=1.)
    relative_residual=float(np.linalg.norm(residual.numpy())/np.linalg.norm(rhs.numpy()))
    reaction=wp.clone(raw_rhs)
    bsr_mv(raw_matrix,solution,reaction,alpha=1.,beta=-1.)
    reaction_values=reaction.numpy()
    applied=raw_rhs.numpy()
    force_error=float(np.linalg.norm(reaction_values[pinned].sum(axis=0)+applied.sum(axis=0))/np.linalg.norm(applied.sum(axis=0)))
    moment_applied=np.cross(positions,applied).sum(axis=0)
    moment_reaction=np.cross(positions[pinned],reaction_values[pinned]).sum(axis=0)
    moment_error=float(np.linalg.norm(moment_reaction+moment_applied)/max(np.linalg.norm(moment_applied),1e-12))
    return solution,{'iterations':int(iterations),'relative_residual':relative_residual,
        'recursive_residual':float(recursive_residual),'absolute_tolerance':float(absolute_tolerance),
        'solve_seconds':solve_seconds,'force_balance_error':force_error,'moment_balance_error':moment_error,
        'preconditioner':'GPU algebraic multigrid' if amg else 'Jacobi','amg_levels':amg_levels,'preconditioner_setup_seconds':setup_seconds,
        'reaction_force_n':reaction_values[pinned].sum(axis=0).tolist(),
        'applied_force_n':applied.sum(axis=0).tolist()}

def solve_system(matrix,rhs,pinned,space,**options):
    solution,telemetry=solve_displacements(matrix,rhs,pinned,space.node_positions().numpy(),**options)
    field=space.make_field()
    field.dof_values=wp.array(solution.numpy(),dtype=space.dtype,device=matrix.device)
    return field,telemetry


def cantilever(resolution=(64,4,4), device='cuda:0', degree=1, include_fields=False):
    wp.init()
    if device.startswith('cuda') and not wp.is_cuda_available():
        raise RuntimeError('CUDA is unavailable. Select CPU explicitly for the 3D reference calculation.')
    start=time.perf_counter()
    length,width,height,force,young,poisson=80.,4.,4.,1.,110000.,.3
    with wp.ScopedDevice(device):
        grid=fem.Grid3D(wp.vec3i(*resolution),bounds_lo=wp.vec3(0,-width/2,-height/2),bounds_hi=wp.vec3(length,width/2,height/2))
        space=fem.make_polynomial_space(grid,degree=degree,dtype=wp.vec3)
        trial,test=fem.make_trial(space),fem.make_test(space)
        values={'young':wp.float64(young),'poisson':wp.float64(poisson)}
        matrix=fem.integrate(elastic_form,fields={'u':trial,'v':test},values=values,output_dtype=wp.float64,assembly='generic')
        boundary=fem.BoundarySides(grid)
        load_test=fem.make_test(space,domain=boundary)
        rhs=fem.integrate(tip_traction,fields={'v':load_test},values={'traction':wp.vec3d(0,-force/(width*height),0)},output_dtype=wp.vec3d)
        positions=space.node_positions().numpy()
        pinned=positions[:,0]<1e-6
        displacement,telemetry=solve_system(matrix,rhs,pinned,space)
        scalar_space=fem.make_polynomial_space(grid,degree=0,dtype=wp.float32,discontinuous=True)
        vm=scalar_space.make_field()
        fem.interpolate(equivalent_stress,dest=vm,fields={'u':displacement},values=values)
        tip=np.isclose(positions[:,0],length,atol=1e-3)
        tip_deflection=float(-displacement.dof_values.numpy()[tip,1].mean())
        analytical=force*length**3/(3*young*(width*height**3/12))
        result = {'model':'3d-linear-elastic-cantilever-v1','method':'NVIDIA Warp 3D FEM',
            'device':str(wp.get_device(device)),'device_name':wp.get_device(device).name,
            'resolution':list(resolution),'degree':degree,'position_bounds':[positions.min(axis=0).tolist(),positions.max(axis=0).tolist()],'pinned_count':int(pinned.sum()),'tip_count':int(tip.sum()),'nodes':int(len(positions)),'dofs':int(3*len(positions)),
            'tip_deflection_mm':tip_deflection,'analytical_tip_deflection_mm':analytical,
            'deflection_error_pct':abs(tip_deflection-analytical)/analytical*100,
            'peak_cell_stress_mpa':float(vm.dof_values.numpy().max()),
            **telemetry,'elapsed_seconds':time.perf_counter()-start,
            'qualified':bool(abs(tip_deflection-analytical)/analytical<.05 and telemetry['relative_residual']<1e-6 and telemetry['force_balance_error']<.01),
            'scope':'3D rectangular cantilever calculation check; not anatomical validation.'}
        if include_fields:
            result['positions_mm']=positions.tolist()
            result['displacements_mm']=displacement.dof_values.numpy().tolist()
        return result

if __name__=='__main__':
    import argparse,json
    parser=argparse.ArgumentParser()
    parser.add_argument('--device',default='cuda:0')
    parser.add_argument('--nx',default=64,type=int)
    args=parser.parse_args()
    print(json.dumps(cantilever((args.nx,4,4),device=args.device),indent=2))



