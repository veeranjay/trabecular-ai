"""Local plate verification. Linear Euler-Bernoulli beam FE, not whole-jaw FEM.

Units: N, mm, MPa. Uniform rectangular titanium beam, four elastic
screw supports, central transverse load = half the bilateral applied load.
Beam length is derived from the rendered polyline; screw supports are idealized.
Bone compliance enters through k=EA/L springs (8 mm engagement, r=1.1 mm).
The reference anatomy is for spatial review; it is NOT the analysis domain.
"""
import json
import math
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
import numpy as np
from scipy.sparse import csr_matrix, diags
from scipy.sparse.linalg import cg

ASSETS = Path(__file__).resolve().parent / 'assets'
LIMITS = {'thickness': (1, 3.5), 'width': (2, 6), 'offset': (0, 10),
          'load': (100, 1000), 'modulus': (450, 1900), 'min_clearance': (2, 8), 'min_sf': (1.5, 4)}
DEFAULTS = {'thickness': 1.5, 'width': 3., 'offset': 0., 'load': 520.,
            'modulus': 1200., 'min_clearance': 4., 'min_sf': 1.8}


def validate(values):
    if not isinstance(values, dict):
        raise ValueError('Parameters must be an object.')
    result = {}
    for name, default in DEFAULTS.items():
        value = values.get(name, default)
        if isinstance(value, bool) or not isinstance(value, (float, int)) or not math.isfinite(value):
            raise ValueError(f'{name} must be a finite number.')
        lo, hi = LIMITS[name]
        if not lo <= value <= hi:
            raise ValueError(f'{name} must be between {lo} and {hi}.')
        result[name] = float(value)
    return result


def beam_fem(length, width, thickness, force, elements=36, bone_modulus=None):
    young = 110000.
    inertia = width * thickness**3 / 12.
    dx = length / elements
    local = young * inertia / dx**3 * np.array([
        [12, 6*dx, -12, 6*dx], [6*dx, 4*dx*dx, -6*dx, 2*dx*dx],
        [-12, -6*dx, 12, -6*dx], [6*dx, 2*dx*dx, -6*dx, 4*dx*dx]])
    size = 2 * (elements + 1)
    matrix = np.zeros((size, size))
    rhs = np.zeros(size)
    for i in range(elements):
        ids = np.arange(2*i, 2*i+4)
        matrix[np.ix_(ids, ids)] += local
    if bone_modulus is None:
        rhs[-2] = -force
        free = np.arange(2, size)
    else:
        support_stiffness = bone_modulus * math.pi * 1.1**2 / 8.
        for x in [0., length*10/36, length*26/36, length]:
            node = round(x / length * elements)
            matrix[2*node, 2*node] += support_stiffness
        rhs[2*(elements//2)] = -force
        free = np.arange(size)
    reduced = csr_matrix(matrix[np.ix_(free, free)])
    preconditioner = diags(1. / reduced.diagonal())
    steps = [0]
    def count(_):
        steps[0] += 1
    solved, code = cg(reduced, rhs[free], M=preconditioner, rtol=1e-9,
                      atol=1e-11, maxiter=3000, callback=count)
    residual = float(np.linalg.norm(reduced @ solved - rhs[free]) / np.linalg.norm(rhs[free]))
    if code != 0 or residual > 1e-6:
        raise RuntimeError(f'Linear solve did not converge (code {code}, residual {residual:.3g}).')
    displacement = np.zeros(size)
    displacement[free] = solved
    stresses = []
    moments = []
    for i in range(elements):
        end = local @ displacement[2*i:2*i+4]
        bending = max(abs(end[1]), abs(end[3])) * thickness / (2*inertia)
        shear = 1.5 * max(abs(end[0]), abs(end[2])) / (width*thickness)
        stresses.append(float(math.sqrt(bending*bending + 3*shear*shear)))
        moments.append(float(max(abs(end[1]), abs(end[3]))))
    return {'stress': stresses, 'moments': moments, 'displacement': displacement[::2].tolist(),
            'residual': residual, 'iterations': steps[0], 'dofs': len(free)}


def screw_clearance(p):
    anatomy = json.loads((ASSETS / 'anatomy.json').read_text())
    anchors = np.array(anatomy['plate_anchors'])
    # Same local normal and offset as rendered screw 3 (index 2).
    tangent = anchors[-1] - anchors[0]
    tangent[1] = 0
    tangent /= np.linalg.norm(tangent)
    normal = np.array([-tangent[2], 0., tangent[0]])
    start = anchors[2] + normal * 2.
    start[1] += p['offset']
    end = start - normal * 8.
    center = np.array(anatomy['nerve_center'])
    alpha = np.clip(np.dot(center-start, end-start) / np.dot(end-start, end-start), 0, 1)
    distance = np.linalg.norm(start + alpha * (end-start) - center)
    return float(max(0., distance - anatomy['nerve_radius_mm'] - 1.1))


def solve(p):
    start = time.perf_counter()
    p = validate(p)
    anatomy = json.loads((ASSETS / 'anatomy.json').read_text())
    anchors = np.array(anatomy['plate_anchors'])
    anchors[2, 1] += p['offset']
    length = float(np.linalg.norm(np.diff(anchors, axis=0), axis=1).sum())
    beam = beam_fem(length, p['width'], p['thickness'], p['load']/2, bone_modulus=p['modulus'])
    stress = max(beam['stress'])
    clearance = screw_clearance(p)
    sf = 880 / stress
    sf_pass = sf >= p['min_sf']
    nerve_pass = clearance >= p['min_clearance']
    return {'id': str(uuid.uuid4()), 'created_at': datetime.now(timezone.utc).isoformat(),
            'params': p, 'method': 'CPU beam finite elements', 'model': 'plate-beam-v1',
            'peak_stress': stress, 'safety_factor': sf, 'clearance': clearance,
            'stress_pass': sf_pass, 'nerve_pass': nerve_pass, 'passed': sf_pass and nerve_pass,
            'plate_length_mm': length, 'max_displacement': max(abs(x) for x in beam['displacement']),
            'stress': beam['stress'], 'displacement': beam['displacement'],
            'residual': beam['residual'], 'iterations': beam['iterations'], 'dofs': beam['dofs'],
            'elapsed_ms': (time.perf_counter()-start)*1000,
            'assumptions': [f'{length:.3f} mm equivalent straight titanium beam from the rendered centerline; 36 elements.',
                'Four transverse bone springs at 0, 0.278L, 0.722L and L; free rotations. Screw positions are idealized.',
                'Central load is half the applied bilateral load. E_Ti = 110,000 MPa.',
                'Hole stress concentrations, bone stress, contact and fatigue are excluded.',
                'Nerve is an illustrative manually registered sphere; screw clearance is geometric.',
                'Reference anatomy is intact. This is not a patient-specific BSSO simulation.']}


def optimize(p):
    start = time.perf_counter()
    p = validate(p)
    # Search the discrete thickness/width/offset space. Never force a passing result.
    offset = next((float(x) for x in np.arange(p['offset'], 10.001, .5)
                   if screw_clearance({**p, 'offset': float(x)}) >= p['min_clearance']), None)
    if offset is None:
        return {'winner': None, 'candidates': [], 'evaluated': 0,
                'reason': 'Nerve clearance is infeasible within the 10 mm screw shift limit.'}
    candidates = []
    for width in sorted(set([p['width'], min(6., p['width']+1), min(6., p['width']+2)])):
        for t in np.arange(p['thickness'], 3.501, .2):
            candidate = solve({**p, 'thickness': round(float(t), 2), 'width': width, 'offset': offset})
            candidates.append(candidate)
    passing = [c for c in candidates if c['passed']]
    winner = min(passing, key=lambda c: (c['params']['thickness']*c['params']['width'], c['peak_stress'])) if passing else None
    return {'winner': winner, 'candidates': candidates, 'evaluated': len(candidates),
            'elapsed_ms': (time.perf_counter()-start)*1000,
            'reason': None if winner else 'No design meets both constraints within the search bounds.'}


def cohort(p):
    p = validate(p)
    samples = [solve({**p, 'modulus': float(e)}) for e in np.linspace(450, 1900, 10)]
    return {'samples': samples, 'passed': sum(s['passed'] for s in samples),
            'total': len(samples), 'min_sf': min(s['safety_factor'] for s in samples),
            'max_stress': max(s['peak_stress'] for s in samples),
            'description': 'Ten stiffness scenarios of one reference plate model; not ten patient anatomies.'}


def benchmark():
    length, width, height, force = 50., 10., 10., 500.
    exact = force*length**3 / (3*110000*(width*height**3/12))
    rows = []
    for n in [8, 16, 32]:
        result = beam_fem(length, width, height, force, elements=n)
        tip = abs(result['displacement'][-1])
        rows.append({'elements': n, 'tip_deflection': tip,
                     'error_pct': abs(tip-exact)/exact*100, 'residual': result['residual']})
    return {'name': 'Euler-Bernoulli cantilever tip deflection', 'analytical_deflection': exact,
            'analytical_bending_stress': 6*force*length/(width*height**2), 'rows': rows,
            'note': 'Checks assembly and linear solution against beam theory. Does not validate anatomical predictions.'}


def dispatch(payload):
    action = payload.get('action', 'solve')
    p = payload.get('params', {})
    if action == 'solve': return solve(p)
    if action == 'optimize': return optimize(p)
    if action == 'cohort': return cohort(p)
    if action == 'benchmark': return benchmark()
    raise ValueError('Unknown action. Use solve, optimize, cohort or benchmark.')


if __name__ == '__main__':
    try:
        print(json.dumps(dispatch(json.load(sys.stdin)), allow_nan=False))
    except Exception as error:
        print(json.dumps({'error': str(error)}))
        sys.exit(1)



