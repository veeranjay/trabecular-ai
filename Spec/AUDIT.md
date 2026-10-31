# Change log / audit

Append a concise record for each logical change batch: reason, files/area, verification and open gates. Record failed experiments and corrections. This is a development log, not a certified tamper-proof audit. Machine-readable mirror: [changes.jsonl](../docs/audit/changes.jsonl). Never log secrets.

## TRAB-001 · 2026-10-30 · Specifications and working agreement

**Changed:** archived 17 historical spec/review files under `Spec/archive/2026-10-29/` with a SHA-256 manifest, preserved the old index, and established six active index/spec/log files. Added root working agreement and machine-readable log.

**Reason:** implement accepted evidence corrections without losing the platform/horizons; simplify navigation and require future changes to record action and rationale.

**Verification:** archive paths checked within Spec before native moves; original file list retained; hash verification pending. No cases, numerical artifacts or drafts modified. An initial documentation patch was rejected before application and corrected.

**Owner decisions:** resume implementation/checks; Deepgram/Supabase scaffold-only; Modal credentials added and detected without logging values; $30 ceiling retained. Initial inspection found ~1.1 GB free host RAM, so do not schedule heavy native calculations blindly.

## TRAB-001-V1 · 2026-10-31 · specifications

**Changed:** Verified all 17 archive entries against the retained SHA-256 manifest.

**Reason:** Close the original archive verification gate without rewriting its historical record.

**Verification:** All 17 hashes matched; no archive content changed.

## TRAB-002 · 2026-10-31 · workspace UI

**Changed:** Added contextual evidence drawer, presentation view, shorter repeated labels, rounded glass styling and animated camera transitions.

**Reason:** Implement the approved cleaner modern workspace while keeping detailed evidence accessible.

**Verification:** Frontend TypeScript check passes. Browser/layout verification and final responsive styles remain outstanding.

**Files:** `frontend/src/components/Workspace.tsx`, `frontend/src/components/WorkspaceEvidence.tsx`, `frontend/src/components/WorkspaceInspector.tsx`, `frontend/src/components/WorkspaceOverview.tsx`, `frontend/src/components/CaseViewport.tsx`, `frontend/src/app/workspace.css`.

## TRAB-003 · 2026-10-31 · experimental immersed method

**Changed:** Added analytical CSG specimen geometry, SDF-filtered quadrature, experimental quadratic immersed kernel, and Implicit Lab scene/controls.

**Reason:** Build explicit SDF method evidence while retaining the original anatomical platform and tetrahedral reference route.

**Verification:** Geometry syntax and small quadrature checks passed previously; frontend TypeScript passes. Remote CPU compilation failed on a float64/float32 mismatch; no successful new physics result. API integration, styles, kernel correction, convergence, independent comparison and full anatomy remain open.

**Files:** `backend/implicit_geometry.py`, `backend/immersed_kernel.py`, `frontend/src/lib/implicit.ts`, `frontend/src/components/ImplicitLab.tsx`, `frontend/src/components/ImplicitViewport.tsx`.

## TRAB-004 · 2026-10-31 · compute policy and Modal access

**Changed:** Added bounded allowlisted Modal specimen worker and conservative reservation ledger; verified provider access and switched current development to local cuda:0. Enforced cloud opt-in before reservations or launch, disabled cloud in private configuration and removed cloud choices from the specimen UI.

**Reason:** Owner requested verification of no-payment capacity and local fallback. GPU requires payment verification; no official guaranteed unverified CPU allowance was established.

**Verification:** 4 cloud policy tests pass, including no reservation/launch while disabled. TypeScript passes. Configuration confirms cloud=false/device=cuda:0. RTX 3050 reports 4096 MiB total. Read-only Modal app list empty; October metered=$0.01002013/billed=$0 (may lag). GPU creation rejected; prior CPU attempt failed kernel compilation. No new cloud runs launched for this verification.

**Files:** `backend/modal_implicit.py`, `backend/cloud_budget.py`, `backend/settings.py`, `backend/test_cloud_policy.py`, `frontend/src/components/ImplicitLab.tsx`, `SERVICE_SETUP.md`, `Spec/ARCHITECTURE.md`, `docs/verification/MODAL_ACCESS.md`.

**Open gates:** Exact no-payment CPU ceiling unconfirmed; no successful new immersed result. Local RAM/GPU capacity must bound later checks. Supabase/Deepgram remain deferred.

## TRAB-005 · 2026-10-31 · agent context and change logs

**Changed:** Added separate architecture/system design and backend/frontend code logs with one-line Changed/Why entries; backfilled recorded decisions, required agent reads and updates, and synchronized local-compute instructions.

**Reason:** Keep design rationale and implementation history available to future agents without confusing intended, incomplete and verified behavior.

**Verification:** Relative links and referenced files verified; each initial log entry has single-line Changed/Why fields; backfill uses existing audit records; JSONL parses with unique IDs. Documentation-only; no calculations or application code changes.

**Files:** `docs/logs/ARCHITECTURE.md`, `docs/logs/CODE_CHANGES.md`, `AGENTS.md`, `Spec/README.md`, `Spec/MVP.md`, `Spec/AUDIT.md`, `docs/audit/changes.jsonl`.
