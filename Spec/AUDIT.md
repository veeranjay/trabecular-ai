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

## TRAB-006 · 2026-10-31 · isolated presentation workspace

**Changed:** Initialized local Git, captured engineering source at 69ab06c286218e5a0146199fc8fbbe14bca502f0, tagged pre-demo-2026-10-31 and created demo/buildathon with independent demo/ source, assets and static build.

**Reason:** Owner prioritized a self-contained selection presentation while preserving the exact engineering continuation point.

**Verification:** Standalone build and TypeScript pass; browser tour, parameter editing, candidate application and four download formats checked. Original backend/frontend source and private runtime data unchanged. Sites registered privately; publication held per owner instruction.

**Files:** `demo/`, `Spec/DEMO.md`, `Spec/README.md`, `AGENTS.md`.

## TRAB-007 · 2026-10-31 · browser voice copilot

**Changed:** Added user-started microphone recognition, transcripts, actual mic metering, spoken replies, stop/mute/cleanup, shared parameter/camera/response/search/study commands and typed fallback.

**Reason:** Owner requires a voice copilot for the buildathon; browser speech supports the standalone presentation while Deepgram remains unconfigured.

**Verification:** TypeScript/build pass; typed natural-language command changed thickness from 1.8 to 2 mm in the actual controls; phone layout checked without horizontal overflow. Live human microphone recognition and audible quality are not yet verified. Browser speech may use a network service; it is not an active Deepgram session.

**Files:** `demo/src/VoiceCopilot.tsx`, `demo/src/main.tsx`.

## TRAB-008 · 2026-10-31 · presentation UI and reference hardware

**Changed:** Removed decorative canvas copy and persistent Interactive demo badge, added frosted expanding hover/focus navigation and voice surfaces, and replaced hand-built hardware with existing v5 contoured CAD assets plus lightweight display morphs.

**Reason:** Owner requested less textual clutter, better titanium appearance, dynamic floating navigation, stronger glass and satisfying transitions.

**Verification:** Real existing CAD exported in about 4 seconds total without a new FEM solve; current build/typecheck pass. Browser screenshots confirm compact titles, silver hardware, expanded dock, SDF field and phone copilot layout. Reduced-motion overrides included; no clinical/analysis-ready CAD claim for display morphs.

**Files:** `demo/src/Viewport.tsx`, `demo/src/style.css`, `demo/src/main.tsx`, `demo/public/assets/cases/female/hardware.json`, `demo/public/assets/cases/male/hardware.json`.

## TRAB-009 · 2026-10-31 · presentation verification and portable package

**Changed:** Verified the nine-step tour, shared copilot action path, speech playback start/stop, 18-row study CSV, download integrity and phone layout; packaged the standalone distribution.

**Reason:** Make the presentation reviewable and portable without backend setup while distinguishing measured UI behavior from unfinished live voice/numerical validation.

**Verification:** TypeScript and static build pass; ZIP integrity passes; no backend/frontend engineering source diff versus mvp-baseline. Live human microphone recognition/audio quality remain unverified; public deployment held.

## TRAB-010 · 2026-10-31 · GitHub source backup

**Changed:** Configured origin as veeranjay/trabecular-ai and pushed mvp-baseline, demo/buildathon, pre-demo-2026-10-31 and demo-review-2026-10-31 after owner-completed GitHub sign-in.

**Reason:** Owner requested GitHub backup first while keeping the exact engineering continuation point separate from presentation work.

**Verification:** Remote refs independently match 69ab06c286218e5a0146199fc8fbbe14bca502f0 for the baseline and 8eb9e384bca0e0c68b57f6c9edad4d94d461ef45 for the initial demo. Tracked-file checks found no environment files, private keys or databases; no force push or website deployment.

**Files:** `.git/config`, `demo/README.md`, `Spec/DEMO.md`, `AGENTS.md`.

## TRAB-011 · 2026-10-31 · review fixes and optional Violet theme

**Changed:** Removed the hero badge and duplicate header voice control, replaced only the logo symbol with three shapes, fixed responsive view-toolbar height, softened expanded dock frosting and added persistent Sage/Violet theme selection.

**Reason:** Apply all five owner browser comments and the supplied violet/indigo palette while preserving wordmark typography and scientific field colors.

**Verification:** TypeScript/static build pass. Browser checks confirm 38 px toolbar height at 931×884 presentation and 390×844 phone sizes; no phone horizontal overflow; copilot/settings remain accessible; three logo shapes, zero header copilot duplicates and theme persistence confirmed. Website publication remains held; source updates use origin/demo/buildathon.

**Files:** `demo/src/main.tsx`, `demo/src/themes.css`, `demo/public/mark.svg`, `demo/index.html`, `demo/README.md`, `Spec/DEMO.md`, `AGENTS.md`, `docs/verification/DEMO_CHECKS.md`.
