"""Cloud execution stays disabled while local 3D qualification is incomplete.

The previous module returned fixed stresses and fictional A10G timings. Those
responses were removed. Use the local engine via Next.js or FastAPI instead.
"""
def solve_bsso_plate_gpu(*args, **kwargs):
    raise NotImplementedError('Modal execution is disabled. Use the local 3D workspace; qualify and budget a cloud worker before deploying.')

if __name__ == '__main__':
    raise SystemExit('Cloud execution is disabled. See SERVICE_SETUP.md and IMPLEMENTATION.md.')
