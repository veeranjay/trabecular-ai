"""Experimental immersed finite-cell elasticity on an SDF-cut background grid.

Quadratic displacement, positive subcell Gauss integration and an optional
gradient-jump stabilizer. No tetrahedral meshing or ersatz exterior stiffness.
This bounded specimen is method evidence; it does not qualify full-jaw physics.
"""
import time
import numpy as np
import warp as wp
import warp.fem as fem
from warp.sparse import bsr_axpy, bsr_mv
from implicit_geometry import parameters, grid, quadrature, identity, surface
from fem_solver import elastic_form, solve_displacements


@wp.func
def plate_phi(x: wp.vec3d, width: wp.float64, thickness: wp.float64, radius: wp.float64, shift: wp.float64):
    q = wp.abs(x) - wp.vec3d(20.0, width * 0.5, thickness * 0.5)
    d = wp.length(wp.max(q, wp.vec3d(0.0))) + wp.min(wp.max(q[0], wp.max(q[1], q[2])), wp.float64(0.0))
    if radius > 0.0:
        for i in range(4):
            cx = wp.float64(-15.0) + wp.float64(i) * wp.float64(10.0) + shift
            hole = wp.sqrt((x[0] - cx) * (x[0] - cx) + x[1] * x[1]) - radius
            d = wp.max(d, -hole)
    return d


@wp.kernel
def sample_plate(points: wp.array(dtype=wp.vec3d), values: wp.array(dtype=wp.float64), width: wp.float64, thickness: wp.float64, radius: wp.float64, shift: wp.float64):
    i = wp.tid()
    values[i] = plate_phi(points[i], width, thickness, radius, shift)


@fem.integrand
def end_load(s: fem.Sample, domain: fem.Domain, v: fem.Field, width: wp.float64, thickness: wp.float64, radius: wp.float64, shift: wp.float64):
    x = wp.vec3d(fem.position(domain, s))
    n = fem.normal(domain, s)
    if n[0] > 0.5 and plate_phi(x, width, thickness, radius, shift) <= wp.float64(1.e-7):
        return -wp.float64(v(s)[2])
    return wp.float64(0.0)


@fem.integrand
def ghost_form(s: fem.Sample, domain: fem.Domain, u: fem.Field, v: fem.Field, active: wp.array(dtype=int), scale: wp.float64):
    inner = fem.to_inner_cell(domain, s)
    outer = fem.to_outer_cell(domain, s)
    if active[inner.element_index] == 0 or active[outer.element_index] == 0:
        return wp.float64(0.0)
    return scale * wp.ddot(wp.mat33d(fem.grad_jump(u, s)), wp.mat33d(fem.grad_jump(v, s)))


@fem.integrand
def stress_value(s: fem.Sample, u: fem.Field, young: wp.float64, poisson: wp.float64):
    mu = young / (wp.float64(2.0) * (wp.float64(1.0) + poisson))
    lam = young * poisson / ((wp.float64(1.0) + poisson) * (wp.float64(1.0) - wp.float64(2.0) * poisson))
    strain = wp.mat33d(fem.D(u, s))
    stress = wp.float64(2.0) * mu * strain + lam * wp.trace(strain) * wp.identity(n=3, dtype=wp.float64)
    dev = stress - wp.trace(stress) / wp.float64(3.0) * wp.identity(n=3, dtype=wp.float64)
    return wp.sqrt(wp.float64(1.5) * wp.ddot(dev, dev))


def solve(value, device='cuda:0', progress=None):
    p = parameters(value)
    def stage(text, fraction):
        if progress: progress(text, fraction)
    started = time.perf_counter()
    wp.init()
    if device.startswith('cuda') and not wp.is_cuda_available():
        raise RuntimeError('CUDA is unavailable. No implicit GPU result was substituted.')
    lo, hi, resolution, h = grid(p)
    stage('Integrating the implicit material domain', .12)
    cell_ids, coords, measures = quadrature(p)
    xyz = lo + (np.stack(np.unravel_index(cell_ids, tuple(resolution)), -1) + coords) * h
    active = np.bincount(cell_ids, minlength=int(np.prod(resolution))) > 0
    volume = float(measures.sum())
    analytic_volume = float((40 * p.width - 4 * np.pi * p.hole_radius ** 2) * p.thickness)
    with wp.ScopedDevice(device):
        geometry = fem.Grid3D(wp.vec3i(*resolution.tolist()), bounds_lo=wp.vec3d(*lo), bounds_hi=wp.vec3d(*hi), scalar_type=wp.float64)
        partition = fem.ExplicitGeometryPartition(geometry, wp.array(active.astype(np.int32), dtype=int))
        domain = fem.Cells(partition)
        space = fem.make_polynomial_space(geometry, degree=2, dtype=wp.vec3d)
        nodes = fem.make_space_partition(space.topology, geometry_partition=partition, with_halo=False)
        test = fem.make_test(space, space_partition=nodes, domain=domain)
        trial = fem.make_trial(space, space_partition=nodes, domain=domain)
        pic = fem.PicQuadrature(fem.Cells(geometry), positions=(wp.array(cell_ids, dtype=int), wp.array(coords, dtype=wp.vec3d)), measures=wp.array(measures, dtype=wp.float64))
        pic.domain = domain
        values = {'young': wp.float64(110000.), 'poisson': wp.float64(.3)}
        stage('Assembling quadratic immersed elasticity', .3)
        matrix = fem.integrate(elastic_form, quadrature=pic, fields={'u': trial, 'v': test}, values=values, output_dtype=wp.float64, assembly='generic')
        if p.stabilization:
            sides = fem.Sides(partition)
            side_trial = fem.make_trial(space, space_partition=nodes, domain=sides)
            side_test = fem.make_test(space, space_partition=nodes, domain=sides)
            stabilizer = fem.integrate(ghost_form, fields={'u': side_trial, 'v': side_test},
                values={'active': wp.array(active.astype(np.int32), dtype=int), 'scale': wp.float64(p.stabilization * 110000. * min(h))}, output_dtype=wp.float64, assembly='generic')
            bsr_axpy(stabilizer, matrix)
            del stabilizer
        positions = space.node_positions().numpy()[nodes.space_node_indices().numpy()]
        boundary = fem.BoundarySides(partition)
        load_test = fem.make_test(space, space_partition=nodes, domain=boundary)
        load_values = {'width': wp.float64(p.width), 'thickness': wp.float64(p.thickness), 'radius': wp.float64(p.hole_radius), 'shift': wp.float64(p.hole_shift)}
        rhs = fem.integrate(end_load, fields={'v': load_test}, values=load_values, output_dtype=wp.vec3d)
        loads = rhs.numpy()
        resultant = float(-loads[:, 2].sum())
        if resultant <= 0: raise ValueError('The supported end-load region has no integrated area.')
        loads *= p.force / resultant
        pinned = np.isclose(positions[:, 0], -20., atol=1e-7)
        if pinned.sum() < 3: raise ValueError('The clamp is not represented by the active grid.')
        # An independently specified affine energy checks stiffness/partition assembly.
        affine = np.zeros_like(positions); affine[:, 0] = .001 * positions[:, 0]
        action = wp.zeros(len(positions), dtype=wp.vec3d)
        bsr_mv(matrix, wp.array(affine, dtype=wp.vec3d), action)
        computed_energy = .5 * float(np.sum(affine * action.numpy()))
        lam = 110000. * .3 / (1.3 * .4); mu = 110000. / 2.6
        exact_energy = .5 * (lam + 2 * mu) * .001 ** 2 * volume
        patch_error = abs(computed_energy - exact_energy) / exact_energy
        stage('Solving the actual cut-domain system', .58)
        displacement, telemetry = solve_displacements(matrix, wp.array(loads, dtype=wp.vec3d), pinned, positions, tolerance=1e-8, max_iterations=4000, amg=True)
        field = space.make_field(nodes); field.dof_values = displacement
        stress = wp.empty(len(cell_ids), dtype=wp.float64)
        sampled_u = wp.empty(len(cell_ids), dtype=wp.vec3d)
        fem.interpolate(stress_value, dest=stress, at=pic, fields={'u': field}, values=values)
        fem.interpolate(field, dest=sampled_u, at=pic)
        stress_np = stress.numpy(); u_q = sampled_u.numpy()
        # Compare the GPU field to an independent NumPy implementation of the same CSG.
        from implicit_geometry import distance
        distance_out = wp.empty(min(4096, len(xyz)), dtype=wp.float64)
        check_xyz = xyz[::max(1, len(xyz) // 4096)][:4096]
        distance_out = wp.empty(len(check_xyz), dtype=wp.float64)
        wp.launch(sample_plate, len(check_xyz), inputs=[wp.array(check_xyz, dtype=wp.vec3d), distance_out, *load_values.values()])
        sdf_error = float(np.max(np.abs(distance_out.numpy() - distance(check_xyz, p))))
    stage('Recovering the surface and numerical evidence', .9)
    from scipy.spatial import cKDTree
    mesh = surface(p)
    _, nearest = cKDTree(xyz).query(mesh.vertices)
    tip = positions[:, 0] > 20. - 1.e-7
    tip_deflection = float(-displacement.numpy()[tip, 2].mean())
    analytical = p.force * 40. ** 3 / (3 * 110000. * (p.width * p.thickness ** 3 / 12)) if p.hole_radius == 0 else None
    finite = bool(np.isfinite(stress_np).all() and np.isfinite(u_q).all())
    resolved = finite and telemetry['relative_residual'] < 1.e-6 and telemetry['force_balance_error'] < .01 and telemetry['moment_balance_error'] < .01
    return {'model': 'immersed-finite-cell-v1', 'method': 'Quadratic background-grid FEM with SDF-cut subcell quadrature',
        'scope': 'Controlled thin-plate method specimen. Not full-jaw, fatigue, clinical or anatomical validation.',
        'input_hash': identity(p), 'params': p.model_dump(), 'device': wp.get_device(device).name,
        'nodes': len(positions), 'dofs': 3 * len(positions), 'active_cells': int(active.sum()), 'quadrature_points': len(cell_ids),
        'grid': {'resolution': resolution.tolist(), 'bounds_mm': [lo.tolist(), hi.tolist()], 'spacing_mm': h.tolist(), 'order': 2},
        'volume_mm3': volume, 'analytic_volume_mm3': analytic_volume, 'volume_error_pct': abs(volume - analytic_volume) / analytic_volume * 100,
        'affine_energy_relative_error': patch_error, 'gpu_cpu_sdf_max_error_mm': sdf_error,
        'tip_deflection_mm': tip_deflection, 'analytical_deflection_mm': analytical,
        'deflection_error_pct': abs(tip_deflection - analytical) / analytical * 100 if analytical else None,
        'peak_stress_mpa': float(stress_np.max()), 'max_displacement_mm': float(np.linalg.norm(u_q, axis=1).max()),
        'numerically_resolved': resolved, 'qualified': False, 'status': 'exploratory',
        'mesh': {'positions': mesh.vertices.round(7).ravel().tolist(), 'indices': mesh.faces.ravel().tolist()},
        'fields': {'stress_mpa': stress_np[nearest].round(6).tolist(), 'displacement_mm': u_q[nearest].round(9).ravel().tolist()},
        'elapsed_seconds': time.perf_counter() - started, **telemetry,
        'assumptions': ['Static isotropic linear elasticity; E=110000 MPa, nu=0.3; N/mm/MPa.',
            'Strong clamp at the left end; normalized integrated transverse load at the right end.',
            'Positive SDF-filtered subcell Gauss integration; no exterior stiffness.',
            'Optional first-gradient jump stabilization; its sensitivity must be checked.',
            'Unsmoothed quadrature stress maximum; nearest same-domain samples for display only.'],
        'unresolved_gates': ['Resolution/integration/grid-position and stabilization sensitivity', 'Independent perforated-specimen comparison', 'Physical applicability', 'Full anatomical and attachment formulation']}
