"""Prepare the licensed Visible Human surface; never synthesize replacement anatomy."""
import hashlib
import json
from pathlib import Path
import numpy as np
import trimesh

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'assets/mandible_source.stl'
TARGET = ROOT.parent / 'frontend/public/assets'


def prepare():
    surface = trimesh.load_mesh(SOURCE)
    surface = max(surface.split(only_watertight=False), key=lambda part: len(part.faces))
    center = surface.bounds.mean(axis=0)
    # Source CT coordinates -> viewer: x left/right, y superior, z anterior.
    v = surface.vertices - center
    surface.vertices = np.column_stack((v[:, 0], v[:, 2], -v[:, 1]))
    # This is a right-handed rotation; preserve source face winding.
    surface.export(TARGET / 'mandible.stl')
    queries = np.array([[-51, -22, -5], [-47, -25, 7], [-38, -28, 20], [-26, -31, 31]])
    anchors = []
    for query in queries:
        index = np.argmin(np.linalg.norm(surface.vertices - query, axis=1))
        anchors.append(surface.vertices[index].round(4).tolist())
    metadata = {
        'id': 'visible-human-male', 'name': 'Visible Human · mandible',
        'source_url': 'https://huggingface.co/datasets/BoneHub/visible-human-3d-models',
        'license': 'CC BY 4.0', 'authors': 'S. H. Alavi & M. Asseln (2026)',
        'source_paper': 'https://doi.org/10.1038/s41597-022-01905-2',
        'dataset_doi': 'https://doi.org/10.57967/hf/10464',
        'source_sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        'triangles': len(surface.faces), 'units': 'mm',
        'transform': {'center': center.tolist(), 'axes': ['x', 'z', '-y']},
        'plate_anchors': anchors,
        'nerve_center': [-31, -33, 20], 'nerve_radius_mm': 4,
        'registration': 'Illustrative manual hardware and nerve registration; not patient landmarks.',
        'osteotomy': '6 mm plate bridge scenario; reference mandible is intact, not a segmented BSSO.',
    }
    (TARGET / 'anatomy.json').write_text(json.dumps(metadata, indent=2))
    (ROOT / 'assets/anatomy.json').write_text(json.dumps(metadata, indent=2))
    print(json.dumps({'triangles': len(surface.faces), 'anchors': anchors}))


if __name__ == '__main__':
    prepare()


