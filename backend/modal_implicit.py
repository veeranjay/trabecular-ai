"""Short-lived, explicitly requested Modal workers with no automatic fallback.

Images include only allowlisted source, never .env or local case databases.
"""
from pathlib import Path
from importlib.metadata import version
import modal

ROOT = Path(__file__).resolve().parent
SOURCE_FILES = ('implicit_geometry.py', 'immersed_kernel.py', 'fem_solver.py', 'gpu_amg.py', 'block_scaling.py')
PACKAGES = ('numpy', 'scipy', 'warp-lang', 'pyamg', 'pydantic', 'trimesh', 'manifold3d')
image = modal.Image.debian_slim(python_version='3.12').pip_install(*(f'{name}=={version(name)}' for name in PACKAGES))
image = image.env({'OMP_NUM_THREADS': '4', 'OPENBLAS_NUM_THREADS': '4'})
for name in SOURCE_FILES:
    image = image.add_local_file(ROOT / name, f'/root/trab/{name}')
app = modal.App('trabecular-implicit-dev')
cpu_app = modal.App('trabecular-implicit-cpu-dev')


@app.function(image=image, gpu='A10', cpu=4, memory=16384, timeout=300,
              max_containers=1, buffer_containers=0, scaledown_window=2)
def implicit_worker(data: dict):
    import sys
    sys.path.insert(0, '/root/trab')
    from immersed_kernel import solve
    return solve(data, device='cuda:0', progress=lambda text, value: print(f'{value:.2f} {text}', flush=True))


@cpu_app.function(image=image, cpu=4, memory=16384, timeout=300,
                  max_containers=1, buffer_containers=0, scaledown_window=2)
def implicit_cpu_worker(data: dict):
    import sys
    sys.path.insert(0, '/root/trab')
    from immersed_kernel import solve
    return solve(data, device='cpu', progress=lambda text, value: print(f'{value:.2f} {text}', flush=True))


def run_implicit_cloud(value, identifier, ceiling=30., on_call=None, compute='gpu'):
    from settings import require_cloud_execution
    config = require_cloud_execution()
    from implicit_geometry import parameters
    from cloud_budget import reserve, record
    payload = parameters(value).model_dump()
    if compute not in ('gpu', 'cpu'): raise ValueError('Choose an explicit cloud compute device.')
    reservation = reserve(identifier, min(ceiling, config['cloud_budget_usd']))
    call = None
    try:
        with (app if compute == 'gpu' else cpu_app).run():
            call = (implicit_worker if compute == 'gpu' else implicit_cpu_worker).spawn(payload)
            record(identifier, 'running', {'call_id': call.object_id})
            if on_call: on_call(call.object_id)
            result = call.get(timeout=600)
        result['provider'] = 'modal-' + compute; result['cloud_budget'] = reservation
        record(identifier, 'completed', {'call_id': call.object_id, 'elapsed_seconds': result['elapsed_seconds']})
        return result
    except BaseException as error:
        if call is not None:
            try: call.cancel(terminate_containers=True)
            except Exception: pass
        record(identifier, 'failed', {'error': type(error).__name__})
        raise


if __name__ == '__main__':
    import argparse, json, uuid
    from settings import configuration
    parser = argparse.ArgumentParser()
    parser.add_argument('--resolution', type=int, default=16)
    parser.add_argument('--solid', action='store_true')
    parser.add_argument('--cpu', action='store_true')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    result = run_implicit_cloud({'resolution': args.resolution, 'hole_radius': 0. if args.solid else 1.2}, 'check-' + uuid.uuid4().hex, min(30., configuration()['cloud_budget_usd']), compute='cpu' if args.cpu else 'gpu')
    destination = Path(args.output); destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(result, allow_nan=False), encoding='utf-8')
    print(json.dumps({key: result[key] for key in ('model', 'device', 'nodes', 'active_cells', 'relative_residual', 'affine_energy_relative_error', 'deflection_error_pct', 'elapsed_seconds')}, indent=2))
