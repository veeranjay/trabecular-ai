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

## 2026-10-31 · TRAB-006 · Frontend / presentation · Implemented with stated limits

**Changed:** Initialized local Git, captured engineering source at 69ab06c286218e5a0146199fc8fbbe14bca502f0, tagged pre-demo-2026-10-31 and created demo/buildathon with independent demo/ source, assets and static build.
**Why:** Owner prioritized a self-contained selection presentation while preserving the exact engineering continuation point.
**Files:** `demo/`, `Spec/DEMO.md`, `Spec/README.md`, `AGENTS.md`.
**Checks/open work:** Standalone build and TypeScript pass; browser tour, parameter editing, candidate application and four download formats checked. Original backend/frontend source and private runtime data unchanged. Sites registered privately; publication held per owner instruction.

## 2026-10-31 · TRAB-007 · Frontend / presentation · Implemented with stated limits

**Changed:** Added user-started microphone recognition, transcripts, actual mic metering, spoken replies, stop/mute/cleanup, shared parameter/camera/response/search/study commands and typed fallback.
**Why:** Owner requires a voice copilot for the buildathon; browser speech supports the standalone presentation while Deepgram remains unconfigured.
**Files:** `demo/src/VoiceCopilot.tsx`, `demo/src/main.tsx`.
**Checks/open work:** TypeScript/build pass; typed natural-language command changed thickness from 1.8 to 2 mm in the actual controls; phone layout checked without horizontal overflow. Live human microphone recognition and audible quality are not yet verified. Browser speech may use a network service; it is not an active Deepgram session.

## 2026-10-31 · TRAB-008 · Frontend / presentation · Implemented with stated limits

**Changed:** Removed decorative canvas copy and persistent Interactive demo badge, added frosted expanding hover/focus navigation and voice surfaces, and replaced hand-built hardware with existing v5 contoured CAD assets plus lightweight display morphs.
**Why:** Owner requested less textual clutter, better titanium appearance, dynamic floating navigation, stronger glass and satisfying transitions.
**Files:** `demo/src/Viewport.tsx`, `demo/src/style.css`, `demo/src/main.tsx`, `demo/public/assets/cases/female/hardware.json`, `demo/public/assets/cases/male/hardware.json`.
**Checks/open work:** Real existing CAD exported in about 4 seconds total without a new FEM solve; current build/typecheck pass. Browser screenshots confirm compact titles, silver hardware, expanded dock, SDF field and phone copilot layout. Reduced-motion overrides included; no clinical/analysis-ready CAD claim for display morphs.

## 2026-10-31 · TRAB-009 · Frontend / package · Verified within stated scope

**Changed:** Verified the nine-step tour, shared copilot action path, speech playback start/stop, 18-row study CSV, download integrity and phone layout; packaged the standalone distribution.
**Why:** Make the presentation reviewable and portable without backend setup while distinguishing measured UI behavior from unfinished live voice/numerical validation.
**Files:** `docs/verification/DEMO_CHECKS.md`, `demo/START_DEMO.cmd`, `demo/serve.mjs`, `demo/README.md`, `README.md`.
**Checks/open work:** TypeScript and static build pass; ZIP integrity passes; no backend/frontend engineering source diff versus mvp-baseline. Live human microphone recognition/audio quality remain unverified; public deployment held.

## 2026-10-31 · TRAB-010 · Project docs / source control · Implemented

**Changed:** Configured origin as veeranjay/trabecular-ai and pushed mvp-baseline, demo/buildathon, pre-demo-2026-10-31 and demo-review-2026-10-31 after owner-completed GitHub sign-in.
**Why:** Owner requested GitHub backup first while keeping the exact engineering continuation point separate from presentation work.
**Files:** `.git/config`, `demo/README.md`, `Spec/DEMO.md`, `AGENTS.md`.
**Checks/open work:** Remote refs independently match 69ab06c286218e5a0146199fc8fbbe14bca502f0 for the baseline and 8eb9e384bca0e0c68b57f6c9edad4d94d461ef45 for the initial demo. Tracked-file checks found no environment files, private keys or databases; no force push or website deployment.

## 2026-10-31 · TRAB-011 · Frontend · Implemented

**Changed:** Removed the hero badge and duplicate header voice control, replaced only the logo symbol with three shapes, fixed responsive view-toolbar height, softened expanded dock frosting and added persistent Sage/Violet theme selection.
**Why:** Apply all five owner browser comments and the supplied violet/indigo palette while preserving wordmark typography and scientific field colors.
**Files:** `demo/src/main.tsx`, `demo/src/themes.css`, `demo/public/mark.svg`, `demo/index.html`, `demo/README.md`, `Spec/DEMO.md`, `AGENTS.md`, `docs/verification/DEMO_CHECKS.md`.
**Checks/open work:** TypeScript/static build pass. Browser checks confirm 38 px toolbar height at 931×884 presentation and 390×844 phone sizes; no phone horizontal overflow; copilot/settings remain accessible; three logo shapes, zero header copilot duplicates and theme persistence confirmed. Website publication remains held; source updates use origin/demo/buildathon.

## 2026-10-31 · TRAB-012 · Frontend / hosting configuration · Implemented

**Changed:** Added demo/vercel.json selecting Other with explicit npm install/build and dist output settings; documented how the hosted UI can later call server functions, Deepgram and a numerical backend.
**Why:** Owner encountered No detected services after selecting the multi-service preset and wanted assurance that current presentation hosting does not block future live functionality.
**Files:** `demo/vercel.json`, `demo/README.md`.
**Checks/open work:** JSON contract and expected dist files checked; configured npm run build passes. No service, credential, Deepgram connection, solver run or website deployment was added.


## 2026-11-01 · TRAB-013 · Cross-stack / presentation · Implemented / local verified

**Changed:** Integrated live Deepgram Voice Agent with server-only temporary-token issuance, streaming audio/transcripts, validated shared workspace tools and an explicit Browser fallback.
**Why:** Owner requested real Deepgram in the Vercel presentation while preserving the engineering baseline and deferring Supabase and Modal.
**Files:** `demo/api/`, `demo/server/`, `demo/src/deepgram.ts`, `demo/src/voice-contract.ts`, `demo/src/VoiceCopilot.tsx`, `demo/src/main.tsx`, `demo/src/themes.css`, `demo/serve.mjs`, `demo/build.mjs`, `demo/package.json`, `demo/package-lock.json`, `demo/tests/`, `demo/scripts/`, `demo/.env.example`, `demo/README.md`, `Spec/DEMO.md`, `Spec/README.md`, `README.md`, `SERVICE_SETUP.md`, `AGENTS.md`, `docs/verification/DEEPGRAM_CHECKS.md`, `docs/verification/deepgram-live-check.json`.
**Checks/open work:** TypeScript/build and 12 offline tests pass; a bounded generated-speech provider check applied a 2 mm fixture change and returned text/audio; an isolated browser session applied 2.5 mm and ended cleanly. Human-microphone/audio-quality review remains manual. Hosted verification follows the source push; server environment readiness is not inferred from local success. Corrected a provider-rejected Settings field using the current SDK/API contract; endpoint omission declares client functions. Permanent keys stay out of the browser.
