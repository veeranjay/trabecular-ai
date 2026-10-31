"""A bounded implicit thin-plate specimen, shared by preview and mechanics.

This is a method demonstrator, not an anatomical or clinical model. N, mm, MPa.
The CSG field has the correct zero set; after subtraction it is not guaranteed
to remain an exact Euclidean signed distance everywhere.
"""
import hashlib
import json
import numpy as np
from pydantic import BaseModel, ConfigDict, Field


class ImplicitParameters(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)
    thickness: float = Field(1.5, ge=.8, le=3.5)
    width: float = Field(8., ge=5., le=12.)
    hole_radius: float = Field(1.2, ge=0., le=1.8)
    hole_shift: float = Field(0., ge=-1., le=1.)
    force: float = Field(5., ge=.1, le=50.)
    resolution: int = Field(24, ge=8, le=48)
    subdivisions: int = Field(2, ge=1, le=3)
    grid_shift: float = Field(.17, ge=-.4, le=.4)
    stabilization: float = Field(.01, ge=0., le=.1)


def parameters(value):
    return value if isinstance(value, ImplicitParameters) else ImplicitParameters.model_validate(value)


def identity(value):
    return hashlib.sha256(json.dumps(parameters(value).model_dump(), sort_keys=True).encode()).hexdigest()


def distance(points, value):
    p = parameters(value)
    xyz = np.asarray(points, dtype=float)
    q = np.abs(xyz) - np.array([20., p.width / 2, p.thickness / 2])
    result = np.linalg.norm(np.maximum(q, 0.), axis=-1) + np.minimum(np.max(q, axis=-1), 0.)
    if p.hole_radius:
        for center in (-15., -5., 5., 15.):
            cylinder = np.hypot(xyz[..., 0] - center - p.hole_shift, xyz[..., 1]) - p.hole_radius
            result = np.maximum(result, -cylinder)
    return result


def grid(value):
    p = parameters(value)
    h = 40. / p.resolution
    resolution = np.array([p.resolution, max(4, int(np.ceil(p.width / h))), max(2, int(np.ceil(p.thickness / h)))])
    padding = h * .3
    lo = np.array([-20., -p.width / 2 - padding + p.grid_shift * h, -p.thickness / 2 - padding])
    hi = np.array([20., p.width / 2 + padding + p.grid_shift * h, p.thickness / 2 + padding])
    return lo, hi, resolution, (hi - lo) / resolution


def quadrature(value):
    """Positive subcell Gauss integration; integrate full cells more cheaply.

    No exterior material is included. Geometry integration error is reported
    against the analytic volume of this supported specimen.
    """
    p = parameters(value)
    lo, hi, resolution, h = grid(p)
    ijk = np.indices(tuple(resolution)).reshape(3, -1).T
    centers = lo + (ijk + .5) * h
    fully_inside = distance(centers, p) < -np.linalg.norm(h) / 2
    abscissa, weight = np.polynomial.legendre.leggauss(3)
    abscissa = (abscissa + 1) / 2
    weight = weight / 2
    cells, coords, measures = [], [], []
    for full, subdivisions in ((True, 1), (False, p.subdivisions)):
        selected = np.flatnonzero(fully_inside == full)
        # Reject definitely exterior cells before generating subquadrature.
        if not full:
            selected = selected[distance(centers[selected], p) <= np.linalg.norm(h) / 2]
        sub = np.indices((subdivisions,) * 3).reshape(3, -1).T
        abc = np.stack(np.meshgrid(abscissa, abscissa, abscissa, indexing='ij'), -1).reshape(-1, 3)
        weights = np.prod(np.stack(np.meshgrid(weight, weight, weight, indexing='ij'), -1), -1).ravel()
        local = ((sub[:, None, :] + abc[None, :, :]) / subdivisions).reshape(-1, 3)
        local_weight = np.tile(weights, len(sub)) * np.prod(h) / subdivisions ** 3
        for start in range(0, len(selected), 128):
            indices = selected[start:start + 128]
            xyz = lo + (ijk[indices, None, :] + local[None, :, :]) * h
            mask = distance(xyz, p) <= 0
            row, col = np.nonzero(mask)
            cells.append(indices[row].astype(np.int32))
            coords.append(local[col])
            measures.append(local_weight[col])
    return np.concatenate(cells), np.vstack(coords), np.concatenate(measures)


def surface(value):
    import trimesh
    p = parameters(value)
    solid = trimesh.creation.box([40., p.width, p.thickness])
    if p.hole_radius:
        holes = []
        for x in (-15., -5., 5., 15.):
            hole = trimesh.creation.cylinder(p.hole_radius, height=p.thickness + 4, sections=64)
            hole.apply_translation([x + p.hole_shift, 0., 0.])
            holes.append(hole)
        solid = trimesh.boolean.difference([solid, *holes], engine='manifold')
    if not solid.is_volume:
        raise ValueError('The supported plate did not produce a closed volume.')
    return solid


def preview(value):
    p = parameters(value)
    mesh = surface(p)
    x = np.linspace(-22., 22., 176)
    y = np.linspace(-8., 8., 72)
    xx, yy = np.meshgrid(x, y)
    points = np.stack((xx, yy, np.zeros_like(xx)), -1)
    lo, hi, res, h = grid(p)
    cell_ids, _, measures = quadrature(p)
    volumes = np.bincount(cell_ids, weights=measures, minlength=int(np.prod(res)))
    active = np.flatnonzero(volumes)
    centers = lo + (np.stack(np.unravel_index(active, tuple(res)), -1) + .5) * h
    return {'input_hash': identity(p), 'params': p.model_dump(),
            'mesh': {'positions': mesh.vertices.round(7).ravel().tolist(), 'indices': mesh.faces.ravel().tolist()},
            'slice': {'shape': [len(y), len(x)], 'bounds_mm': [[-22., -8.], [22., 8.]],
                      'values_mm': distance(points, p).round(5).ravel().tolist()},
            'grid': {'bounds_mm': [lo.tolist(), hi.tolist()], 'resolution': res.tolist(), 'spacing_mm': h.tolist(),
                     'active_centers_mm': centers.round(6).tolist(), 'volume_fractions': (volumes[active] / np.prod(h)).round(6).tolist()},
            'analytic_volume_mm3': float((40 * p.width - 4 * np.pi * p.hole_radius ** 2) * p.thickness),
            'surface_chord_error_mm': float(p.hole_radius * (1 - np.cos(np.pi / 64))),
            'scope': 'Implicit plate method specimen; not anatomy or clinical validation.'}
