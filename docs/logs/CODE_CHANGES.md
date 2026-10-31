# Backend and frontend code change log

Read this and [ARCHITECTURE.md](ARCHITECTURE.md) at the start of a task. Append one entry per logical change, labeled **Backend**, **Frontend**, **Cross-stack** or **Project docs**. Each entry needs a date/shared audit ID, one-line **Changed**, one-line **Why**, affected files and concise verification/open work. Record fixes and failed checks honestly; do not log secrets. Do not treat an entry as proof that checks passed.

Initial entries are backfilled from [AUDIT.md](../../Spec/AUDIT.md), with its recorded dates; they do not invent earlier code history. Subsequent changes must be recorded when made. For mixed changes, use separate backend/frontend entries under the same audit ID when that makes the changes clearer.

## 2026-10-31 · TRAB-002 · Frontend · Partial

**Changed:** Added an evidence drawer, presentation controls, shorter repeated labels, rounded glass styling and animated camera transitions.
**Why:** Implement the approved cleaner workspace while retaining detailed engineering evidence on demand.
**Files:** `frontend/src/components/{Workspace,WorkspaceEvidence,WorkspaceInspector,WorkspaceOverview,CaseViewport}.tsx`, `frontend/src/app/workspace.css`.
**Checks/open work:** TypeScript passed; browser/layout checks and final responsive styling remain outstanding.

## 2026-10-31 · TRAB-003 · Backend · Experimental; incomplete

**Changed:** Added parametric CSG/SDF geometry, cut-domain quadrature and an experimental quadratic immersed elasticity kernel.
**Why:** Begin real SDF method development independently of the retained tetrahedral reference solver.
**Files:** `backend/implicit_geometry.py`, `backend/immersed_kernel.py`.
**Checks/open work:** Geometry syntax/small quadrature checks passed; remote CPU compilation failed on a float64/float32 mismatch; no successful new physics result; API integration, convergence, independent comparison and anatomical formulation remain open.

## 2026-10-31 · TRAB-003 · Frontend · Scaffold; incomplete

**Changed:** Added Implicit Lab types, specimen controls and a Three.js geometry/distance/grid viewport with result display hooks.
**Why:** Make the intended immersed method inspectable and support a demonstrable geometry-to-physics workflow.
**Files:** `frontend/src/lib/implicit.ts`, `frontend/src/components/ImplicitLab.tsx`, `frontend/src/components/ImplicitViewport.tsx`.
**Checks/open work:** TypeScript passed; required backend routes, completed styling and browser acceptance remain outstanding; this is not a working end-to-end physics demo yet.

## 2026-10-31 · TRAB-004 · Backend · Cloud disabled

**Changed:** Added allowlisted bounded Modal workers and a reservation ledger, then enforced explicit cloud opt-in before budget reservation or worker launch.
**Why:** Retain a future cloud adapter while honoring local fallback and preventing credentials alone from authorizing cloud execution.
**Files:** `backend/modal_implicit.py`, `backend/cloud_budget.py`, `backend/settings.py`, `backend/test_cloud_policy.py`; private configuration values are excluded from logs.
**Checks/open work:** Four cloud-policy tests passed; configuration reports cloud disabled/local `cuda:0`; no active Modal apps were listed; provider attempts produced no successful immersed result.

## 2026-10-31 · TRAB-004 · Frontend · Implemented selection

**Changed:** Defaulted Implicit Lab to local compute and removed cloud selection from its controls.
**Why:** Match the owner's local-compute decision and avoid offering currently blocked cloud execution.
**Files:** `frontend/src/components/ImplicitLab.tsx`.
**Checks/open work:** TypeScript passed; experiment API/kernel completion remains open under TRAB-003.

## 2026-10-31 · TRAB-005 · Project docs · Implemented

**Changed:** Added the two context logs, required agents to read/update them and synchronized the documented local-compute decision.
**Why:** Preserve concise change rationale for future tasks and prevent stale cloud authorization or unfinished work from being mistaken for current behavior.
**Files:** `docs/logs/ARCHITECTURE.md`, `docs/logs/CODE_CHANGES.md`, `AGENTS.md`, `Spec/README.md`, `Spec/MVP.md`, `Spec/AUDIT.md`, `docs/audit/changes.jsonl`.
**Checks/open work:** Documentation references, initial backfill sources and machine-readable audit checked; no application code or calculations changed in this batch.
