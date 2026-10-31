"""Independent NumPy/SciPy Hex8 assembly and measured Warp qualification checks.

Uses physical shape gradients and 2x2x2 Gauss quadrature, independent of Warp's
FEM assembly. All units are N, mm, MPa. This verifies the rectangular benchmark,
not mandibular geometry or a contact/bonding model.
"""
from __future__ import annotations
import argparse
import contextlib
import io
import json
import time
from itertools import product
from pathlib import Path
import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import spsolve


def hex8_reference(resolution=(16, 2, 2)):
    nx, ny, nz = resolution
    length, width, height, young, poisson, force = 80., 4., 4., 110000., .3, 1.
    positions = np.array(list(product(np.linspace(0, length, nx+1),
                                      np.linspace(-width/2, width/2, ny+1),
                                      np.linspace(-height/2, height/2, nz+1))))
    indices = np.arange(len(positions)).reshape(nx+1, ny+1, nz+1)
    signs = np.array(list(product((-1., 1.), repeat=3)))
    local_offsets = ((signs+1)/2).astype(int)
    cells = np.array([[indices[i+di, j+dj, k+dk] for di, dj, dk in local_offsets]
                       for i, j, k in product(range(nx), range(ny), range(nz))])
    lam = young*poisson/((1+poisson)*(1-2*poisson))
    mu = young/(2*(1+poisson))
    elasticity = np.zeros((6, 6))
    elasticity[:3, :3] = lam
    np.fill_diagonal(elasticity[:3, :3], lam+2*mu)
    elasticity[3:, 3:] = np.eye(3)*mu
    element = np.zeros((24, 24))
    # Every cell is an affine brick, so this matrix is identical for all cells.
    vertices = positions[cells[0]]
    for gp in product((-1/np.sqrt(3), 1/np.sqrt(3)), repeat=3):
        natural = np.empty((8, 3))
        for axis in range(3):
            others = [a for a in range(3) if a != axis]
            natural[:, axis] = signs[:, axis]/8
            for other in others:
                natural[:, axis] *= 1+signs[:, other]*gp[other]
        jacobian = vertices.T @ natural
        gradients = natural @ np.linalg.inv(jacobian)
        strain = np.zeros((6, 24))
        for a, (dx, dy, dz) in enumerate(gradients):
            strain[:, 3*a:3*a+3] = [[dx, 0, 0], [0, dy, 0], [0, 0, dz],
                                     [dy, dx, 0], [0, dz, dy], [dz, 0, dx]]
        element += strain.T @ elasticity @ strain * np.linalg.det(jacobian)
    dofs = (cells[:, :, None]*3+np.arange(3)).reshape(-1, 24)
    rows = np.broadcast_to(dofs[:, :, None], (len(cells), 24, 24)).ravel()
    cols = np.broadcast_to(dofs[:, None, :], (len(cells), 24, 24)).ravel()
    matrix = coo_matrix((np.broadcast_to(element, (len(cells), 24, 24)).ravel(),
                         (rows, cols)), shape=(3*len(positions),)*2).tocsr()
    rhs = np.zeros(3*len(positions))
    # Integrate constant face traction using consistent bilinear nodal weights.
    for j, k in product(range(ny), range(nz)):
        face = indices[nx, j:j+2, k:k+2].ravel()
        rhs[3*face+1] -= force/(ny*nz*4)
    fixed = np.repeat(positions[:, 0] == 0, 3)
    free = ~fixed
    solution = np.zeros_like(rhs)
    solution[free] = spsolve(matrix[free][:, free], rhs[free])
    residual = matrix @ solution-rhs
    displacement = solution.reshape(-1, 3)
    return {'positions_mm': positions.tolist(), 'displacements_mm': displacement.tolist(),
            'tip_deflection_mm': float(-displacement[positions[:, 0] == length, 1].mean()),
            'relative_residual': float(np.linalg.norm(residual[free])/np.linalg.norm(rhs[free])),
            'force_balance_error': float(np.linalg.norm(residual.reshape(-1, 3)[positions[:, 0] == 0].sum(0)+rhs.reshape(-1, 3).sum(0))/force)}


def aligned_difference(first, second):
    index = {tuple(np.round(point, 4)): i for i, point in enumerate(second['positions_mm'])}
    order = [index[tuple(np.round(point, 4))] for point in first['positions_mm']]
    a = np.asarray(first['displacements_mm'])
    b = np.asarray(second['displacements_mm'])[order]
    return float(np.linalg.norm(a-b)/max(np.linalg.norm(b), 1e-16))


def qualification():
    from fem_solver import cantilever
    import warp as wp
    start = time.perf_counter()
    independent = hex8_reference()
    gpu = cantilever((16, 2, 2), device='cuda:0', include_fields=True)
    cpu = cantilever((16, 2, 2), device='cpu', include_fields=True)
    independent_error = aligned_difference(gpu, independent)
    cpu_error = aligned_difference(gpu, cpu)
    levels = [cantilever((nx, 4, 4), device='cuda:0') for nx in (32, 64, 128)]
    from verification_tet import check
    tetrahedral_check=check()
    from verification_plate import check as check_plate
    plate_check=check_plate()
    gpu_device = wp.get_device('cuda:0')
    # This is total device capacity, not a claimed full-jaw solve allocation.
    report = {'created_at_utc': __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),
        'model': '3d-linear-elastic-cantilever-v1', 'device': gpu_device.name,
        'device_total_memory_bytes': int(gpu_device.total_memory),
        'independent_reference': {'method': 'NumPy/SciPy Hex8, 2x2x2 Gauss quadrature',
            'resolution': [16, 2, 2], 'relative_displacement_difference': independent_error,
            'passed': independent_error < 1e-4,
            'reference_relative_residual': independent['relative_residual'],
            'reference_force_balance_error': independent['force_balance_error']},
        'cpu_gpu': {'resolution': [16, 2, 2], 'relative_displacement_difference': cpu_error,
                    'passed': cpu_error < 1e-4},
        'refinement': levels,
        'tetrahedral_check':tetrahedral_check,
        'thin_plate_check':plate_check,
        'passed': bool(plate_check['passed'] and tetrahedral_check['passed'] and independent_error < 1e-4 and cpu_error < 1e-4 and levels[-1]['qualified']
                       and levels[-1]['deflection_error_pct'] < levels[0]['deflection_error_pct']),
        'elapsed_seconds': time.perf_counter()-start,
        'limitations': ['Pass status covers the rectangular Hex8, small heterogeneous Tet4 and quadratic thin-plate calculation checks only.',
                       'The jaw uses linear bone elements and quadratic hardware elements; the assembled jaw still requires mesh and bond sensitivity studies.',
                       'These checks do not establish full-jaw memory budgets, osteotomy bonding or mesh qualification.']}
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', default='data/verification3d.json')
    args = parser.parse_args()
    report = qualification()
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2))
    raise SystemExit(0 if report['passed'] else 1)
