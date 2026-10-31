"""Compatibility entry point. The old Gaussian stress generator was removed.

This legacy entry point runs reduced beam diagnostics only. The actual
experimental 3D model is in jaw_solver.py, with Warp FEM assembly, GPU CG,
material-specific stress recovery and explicit unresolved qualification gates.
"""
try:
    from .engine import beam_fem, benchmark, solve, optimize, cohort
except ImportError:
    from engine import beam_fem, benchmark, solve, optimize, cohort

if __name__ == '__main__':
    import json
    print(json.dumps(benchmark(),indent=2))
