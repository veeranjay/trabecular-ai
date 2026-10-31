# Trabecular — Revised MVP Build Plan

Status: APPROVED FOR IMPLEMENTATION by the user. Local-first development is underway. Modal execution remains disabled; the user's $30 monthly credit allowance is a ceiling, with no automatic cloud fallback.

Prepared: 27 October 2026. Completion target: **before October 31**, as requested by the user. Final verification and demo preparation must finish on October 30; October 31 is submission only. All dates use Asia/Kolkata. See IMPLEMENTATION.md for the current incomplete gates and deadline risk.

## 1. Product and success definition

Build a small but complete mandibular fixation engineering workspace: prepare a case, position fixation hardware, define loads and constraints, run a real three-dimensional numerical analysis, remediate a design, test its uncertainty envelope, and export reproducible evidence. The same workflow must be accessible through direct controls and a connected Deepgram voice agent.

The October 31 MVP supports two prepared reference anatomies and a bounded fixation design family. It remains an engineering exploration tool. Analytical calculation checks and numerical refinement are part of the deliverable; experimental/clinical validation and regulatory clearance are not implied.

The existing black glass interface, real CT surface, viewport controls, basic exports, and recorded run comparison are retained. The current beam engine stays available under an explicit reduced-model label for diagnostics and quick estimates. It cannot stand in for completion of the 3D solver.

This is an aggressive four-day implementation schedule, not evidence that all work is already feasible. The geometry and solver gate on October 28 determines whether the full scope remains achievable. A failed core gate is reported as a schedule/scope issue, never disguised by canned results or an unannounced model downgrade.

## 2. Required scope and acceptance criteria

### A. Persistent cases and anatomy preparation

- Two distinct, licensed CT-derived mandibles, each with its own source hash, dimensions, coordinate transform, hardware registration and load/support configuration.
- An STL import path with explicit units, scale/orientation review, surface integrity checks and useful rejection messages. Unprepared imports can be inspected and saved but cannot be analyzed until required registrations are supplied.
- Manual editing of condylar support regions, bite regions, muscle/load regions and nerve keep-out annotations. Persist these with the case rather than reuse landmarks from an unrelated mesh.
- Prepare a bilateral sagittal osteotomy reference case with separate bone segments and a default 6 mm advancement. Permit a bounded 2–8 mm advancement on the prepared case, with visible segment transforms and collision checks.
- Prepare a second registered fixation case for cross-anatomy comparison. It needs its own geometry and boundary-condition review; merely resizing the first mesh does not count.
- Keep-out annotations can be manually supplied polylines plus a radius/buffer. Their origin and uncertainty are displayed. The software does not infer a patient nerve from an external bone STL.

Acceptance: case reopening restores geometry and registrations; a generic planar notch is not labeled BSSO; imports with ambiguous units or missing registrations cannot silently produce analysis results. Case geometry and displayed advancement agree with solver inputs.

### B. Parametric fixation CAD

- Bilateral four-hole plate assemblies fitted to the prepared osteotomy regions.
- Edit strut thickness, bridge width, local plate placement, bounded screw position, screw length and screw trajectory.
- Measure screw-to-keep-out distance along the full screw segment, not just the screw head.
- Check plate/bone stand-off, hole spacing, minimum edge distance and a geometric bone engagement proxy. Report the limits of surface-only engagement checks.
- Generate analysis geometry and viewport geometry from one versioned parameter/geometry definition.
- Export plate and screws as named assembly components and include their parameter manifest. Clearly identify an assembly export versus a Boolean-unioned fabrication solid.

Acceptance: every edit changes the relevant geometry, invalidates affected results and is represented in the exported artifact and the next solve. A proposed screw shift must remain geometrically admissible rather than merely increase nerve distance.

### C. Actual 3D GPU analysis

- Implement small-strain, static, isotropic linear elasticity using NVIDIA Warp and its FEM toolkit.
- Analyze cortical-shell proxy, trabecular-core proxy and titanium hardware domains on the prepared cases. A cortical thickness generated from an outer mesh is a modeling assumption, not measured patient anatomy.
- Use bounded support regions and normalized distributed loads with documented total forces and moments. Fix rigid-body modes explicitly.
- Use an immersed/SDF representation, with a coarse jaw domain and adequately resolved hardware region. Test a sparse/adaptive or conforming 3D local refinement strategy during the first-day spike; choose and document the supported formulation before expanding the UI.
- Resolve thin plate bending with a thickness-resolution study. A smooth rendering of a one-cell-thick plate is not numerical verification. If using a submodel, derive and document the transfer conditions from the whole-jaw solve rather than inventing local loads.
- Model locking screw/bone attachments through explicit ties/bonded constraints for the MVP. Keep osteotomy interfaces mechanically distinct under an explicitly documented no-contact approximation; do not accidentally weld opposing segments or allow a stiff void floor to carry material load across the interface. Frictional/nonlinear contact is outside this release.
- Output displacement, 3D stress/strain fields, plate equivalent stress, bone strain indicators, reaction balance, residual, iteration count, measured timing, grid resolution and numerical-quality flags.
- Recover stresses separately for each material. Preserve vertex correspondence and do not smooth bone/titanium/void values together. Preserve unsmoothed numerical extrema separately from display interpolation.
- Run the same model on local hardware where memory permits and a Modal GPU worker for larger jobs. The installed local device is an RTX 3050 Laptop GPU with 4 GB VRAM; dense full-jaw high-resolution solves are not assumed to fit.

Acceptance: real assembly and solution on the GPU; no fixed stress targets; a documented benchmark and refinement study; rejected or flagged results when numerical checks fail. Existing beam results are explicitly labeled as a different model.

### D. Three loading scenarios and uncertainty controls

- Bilateral loading, left unilateral loading and right unilateral loading on separately registered regions.
- Configurable applied load and material assumptions, with units and assumptions visible.
- Three bone-modulus values per study: low, central and high, initially 500/1,200/1,800 MPa as explicit configurable assumptions inherited from the original spec.
- Compare fixed material settings with uncertainty results; identify the governing scenario.

Acceptance: each load scenario changes actual boundary/load data, and each material value enters the material assembly. Results are keyed to anatomy, CAD, registrations, loading, materials and solver version.

### E. Robust CAD remediation

- Objective: reduce titanium volume/section burden while meeting the specified mechanical and geometric constraints over the selected study scenarios.
- Use bounded discrete candidate search and refinement. Gradient-based topology optimization is not required for October 31.
- Reject geometrically inadmissible candidates before solving.
- Use a measured coarse 3D calculation to screen candidates; re-evaluate the best candidates with the qualified resolution across the selected uncertainty/load envelope.
- Keep baseline and candidate evidence, return the governing load/material case, and make clear whether a design was checked for one scenario or a full envelope.
- Report infeasible, cancelled, numerically unresolved and failed searches distinctly. Do not force a passing winner.
- Show proposed parameter changes, comparison geometry and computed before/after results. Applying a design creates a versioned revision.

Acceptance: the reported winner can be replayed from its manifest, meets the requested checks for its declared scope, and is never selected solely from the reduced beam estimate.

### F. Honest cross-anatomy batch study

- Two prepared anatomies × three load scenarios × three bone moduli = 18 explicitly identified scenario runs for a fixed plate family.
- Fit/placement is registered separately for each anatomy; global plate-family dimensions and case-specific placement are both recorded.
- Queue progress, per-scenario status, worst-case identification, filtering, scatter plots, a result table and CSV/JSON export.
- Display the number of distinct anatomies separately from the number of scenarios. Eighteen calculations are not eighteen patients or a population validation dataset.

Acceptance: each plotted point links to its own persisted run and input manifest. Partial failures remain visible and do not inflate pass-rate denominators.

### G. Connected Deepgram co-pilot

- Real browser voice sessions using Deepgram Voice Agent API and its browser SDK over WebSocket. Mint short-lived tokens on the authenticated backend; keep DEEPGRAM_API_KEY off the client. Use the configured speech-to-text, function-calling LLM and text-to-speech settings without claiming an unconfigured model is active.
- Visible connecting, listening, thinking, speaking, muted, disconnected and failed states; genuine audio-level indication and conversation text from provider events. Handle barge-in and discard cancelled speculative function calls.
- Tools: inspect current results, focus an anatomical region, propose validated parameter changes, launch a solve, launch remediation, run a study and explain the report.
- Handle FunctionCallRequest events by validating arguments and dispatching through authenticated backend services, the same typed actions used by buttons. Correlate FunctionCallResponse with function IDs and workspace/case/revision/run IDs. Handle duplicate and cancelled calls, and reject stale or cross-case actions. Proposed parameter edits appear as a change preview; an explicit apply action or spoken instruction creates the revision.
- Long jobs return an acknowledgement and operation ID promptly so the voice turn does not wait for a simulation. Completion events update the UI and are injected into the active agent session using supported context/message events. Verify the complete acknowledgement/completion/cancellation flow during the first-day integration spike.
- Text commands remain available. Browser recognition/TTS can be offered as a separately labeled local mode, never presented as an active Deepgram call.

Acceptance: live audio connection plus at least one read tool, camera tool and actual compute action demonstrated end-to-end. Missing credentials or unsupported provider behavior are reported immediately.

### H. Complete engineering workspace

- Follow DESIGN_PRINCIPLES.md, docs/design/WORKSPACE_LAYOUT.md and docs/design/tokens.json. Keep a modern black/glass foundation, improve typography and spacing, use one contextual inspector and prioritize a generous anatomical canvas.
- Workflow: Cases → Prepare → Design → Analyze → Compare → Studies → Report.
- Show loads, constraints, osteotomy segments, hardware and keep-out annotations as independently controllable layers.
- Clip plane, cross-section inspection, measurements, anatomical camera bookmarks and a displacement display with a clearly labeled amplification factor.
- Side-by-side or overlay comparison of geometry revisions with a shared physical color scale. Show the mesh/material/solver identity behind each field. Use a compact expandable Deepgram dock instead of a permanent full-width conversation strip.
- Show job stages, elapsed time, cancellation, recovery, stale input warnings and actionable errors. Keep essential actions visible without scrolling through every control.
- Persist case setup, design revisions, runs and studies on the backend. Browser storage holds preferences, not the only copy of analysis history.

Acceptance: the core workflow works after browser reload and from a new authenticated session. Switching cases cannot show another case's results or accept its voice tool events.

### I. Reproducible engineering package and release

- Download a ZIP containing an engineering PDF, input/registration manifest, CAD assembly/components, numerical summaries, benchmark/refinement evidence, study tables and solver logs.
- Record geometry hashes, software versions, boundary conditions, material assumptions, source licenses and whether each result is newly computed or retrieved from an exact matching cache entry.
- Label the context of use and what was actually verified. Do not claim clinical validation, ASME V&V 40 credibility or FDA/510(k) compliance from these checks.
- Provide a single-user authenticated demo deployment, setup/runbook, environment template and a short end-to-end demo recording.

Acceptance: a saved manifest reproduces its numerical run within the declared tolerance; exports work without relying on the current browser DOM or a print dialog alone.

## 3. Proposed architecture

Browser (Next.js/React/TypeScript/Three.js) → same-origin API gateway → persistent FastAPI application → local worker or Modal GPU worker.

FastAPI owns case/revision/job state and publishes workspace-scoped WebSocket events. Postgres stores structured state; Supabase can provide managed Postgres, object storage and demo authentication under one project. Large meshes/field arrays/reports go to object storage through scoped/signed access. Avoid adding a second realtime event system during this release.

Deepgram browser SDK (@deepgram/agents) → authenticated temporary-token endpoint → Voice Agent WebSocket (listen/think/speak). Function calls dispatch to the authenticated tool API → the same job and camera services used by the UI. The backend validates every requested action; no browser token authorizes arbitrary case access.

| Layer | Chosen approach | Reason |
|---|---|---|
| UI | Keep Next.js, React, TypeScript, Three.js, custom CSS and Lucide | Preserve working UI; no R3F/VTK migration just for library count |
| Geometry | Trimesh/NumPy, implicit distance queries and a narrowly scoped robust Boolean/SDF helper selected in the geometry spike | One reproducible geometry definition; avoid introducing OpenVDB, NanoVDB and MeshLib simultaneously |
| Analysis | Installed Warp 1.18.0 as starting point; pin the tested environment; SciPy/NumPy for verification and preprocessing | Actual 3D FE computation plus independent checks |
| Cloud compute | Modal A10 or L40S selected after memory/runtime measurements; bounded concurrency | Local VRAM is limited; avoid unsupported A10G/legacy API assumptions |
| Backend | FastAPI, typed Pydantic contracts, persistent jobs, authenticated WebSockets | Replace one Python process per browser request with a durable service |
| Persistence | Supabase Postgres, Storage and simple demo authentication | Save cases/results across sessions and serve large artifacts |
| Voice | @deepgram/agents, Voice Agent API and protected backend token/tool endpoints | Real provider audio with secret isolation |
| Evidence | ReportLab for direct PDF generation and a ZIP export | Repeatable downloadable package independent of browser printing |
| Checks | Python numerical/contract tests and browser end-to-end tests | Verify computation, state isolation and the actual product workflow |

Every run carries workspace, case, anatomy, design revision, boundary condition, material, solver-version and resolution identities. Cache reuse requires an exact match to this identity. A cached result is labeled; an unavailable GPU is not called a warm solve.

## 4. Numerical release gates

These are proposed release criteria, not claims that the current implementation meets them:

1. A 3D manufactured/patch test plus an analytical plate/beam benchmark with a documented region/quantity of comparison. Target <5% error for the selected nonsingular benchmark quantity on the qualified mesh.
2. Residual measured on the actual constrained/scaled linear system, with a documented tolerance (initial target 1e-6 relative, adjusted only with explicit evidence).
3. Total force balance within 1%; report moment balance as well. Supports must eliminate rigid-body modes without unintentionally overconstraining the model.
4. At least three resolution levels on the canonical case. Target <5% change between the two finest levels for declared displacement and plate stress assessment quantities, with thin-section and interface treatment documented.
5. Report absolute maxima and any predefined assessment-region stress separately. Boundary/screw singularities are identified rather than removed after seeing the answer. Display smoothing never changes reported solver extrema.
6. CPU/GPU agreement on the same small 3D discretized problem; compare against an independently assembled/reference calculation on a simple geometry. Cross-solving the same assembled matrix alone is insufficient evidence of correct FE assembly.
7. Clearance checks against known geometry fixtures, monotonic basic load/thickness checks where appropriate, result/geometry correspondence checks, and a reproducible candidate replay.

If a gate fails, the result is marked numerically unresolved and cannot produce an unqualified green constraint badge. Clinical validity is a separate question beyond these numerical gates.

Performance is measured after correctness. The old 2–3 second promise is removed as an acceptance condition. Target usable interactive previews and asynchronous detailed solves, with measured hardware/resolution timings and capped jobs; do not reduce fidelity just to reproduce a marketing latency.

## 5. Delivery schedule — October 27–31

| Date | Main deliverables | Exit condition |
|---|---|---|
| Oct 27 | Lock contracts; verify cloud/voice credentials; connect an actual Deepgram test call; prepare first osteotomy and second anatomy; select/measure the 3D formulation; build the analytical 3D benchmark | Anatomy segments/registers are coherent; GPU benchmark assembles/solves; live voice/provider transport path confirmed |
| Oct 28 | Complete canonical jaw/hardware 3D solve, material-aware recovery, refinement/force-balance checks; finalize durable jobs and persistence | Core physics gate passed on canonical case. If not, report the blocking failure and deadline impact immediately |
| Oct 29 | Shared CAD geometry and geometric admissibility checks; robust remediation; three load cases; two-case/18-scenario study; connect voice tools to real services | Button and voice paths operate on the same case/revision/job data; candidate replay and study provenance work |
| Oct 30 | Finish remaining UI and deployment work; complete numerical evidence, clean-environment regression, artifact review and demo recording | Required workflows pass and verification is complete before October 31 |
| Oct 31 | Submission only | No planned implementation or acceptance work after the user's completion deadline |

Dependencies can be worked on in interleaved implementation tracks, but geometry → physical model → numerical checks → remediation/studies remains the critical path. This proposal does not assume additional developers or delegated agents; if the milestones cannot be met with available capacity, scope/deadline changes require an explicit decision.

## 6. Dependency decisions needed with approval

- Working Modal project credentials and permission to deploy bounded GPU workers.
- Working DEEPGRAM_API_KEY with the permissions needed for temporary token issuance, plus an agent ID or inline listen/think/speak configuration supported by the account. Configure secrets locally/provider-side, not in chat or client bundles.
- Supabase project configuration for database/storage/authentication, or approval to use a single-instance persistent local backend instead. The latter changes the hosted/recovery acceptance criteria and is a scope change, not an invisible fallback.
- An HTTPS deployment/domain for the authenticated workspace. Client-dispatched Deepgram function calls use our normal authenticated backend API, so a public provider-webhook endpoint is not required for the chosen architecture. Local microphone testing can use localhost; hosted testing must use a secure origin.
- A hard cloud spending limit selected by the owner before paid execution. The plan itself does not authorize purchases, account changes or unbounded keep-warm usage. Configure worker concurrency, batch/candidate caps, idle shutdown and budget monitoring.
- Whether the prepared BSSO geometry/landmarks can receive an anatomy/domain review. Without one, label it a developer-prepared reference osteotomy and exclude claims of anatomical/clinical validation.

Credentials/connectivity and deployment checks happen first. Discovering an unavailable provider on October 30 is too late for this schedule.

## 7. Stretch items, explicitly outside the required acceptance set

Only after every required workflow and numerical gate passes:

- A third registered anatomy; additional imported ready-to-analyze cases.
- Six-hole plate variant and a second manually curated fixation arrangement.
- More load/material scenarios and a larger batch grid.
- Independent external solver deck export if the chosen formulation maps cleanly; otherwise export neutral geometry, loads and a manifest without claiming an executable solver deck.
- More report visualizations, camera bookmarks and presentation polish.

Cut order when time is tight: stretch items first, then optional UI polish. Do not silently drop real GPU computation, osteotomy consistency, robustness checks or provider connection and still call this expanded scope complete. Escalate a core miss as soon as it is known.

## 8. Explicit exclusions for October 31

Raw DICOM/CBCT segmentation; arbitrary-anatomy automatic registration; clinically validated nerve tracing; other body regions; production frictional/nonlinear contact; dynamic chewing/fatigue/lifetime prediction; bone remodeling; topology optimization/autodiff guarantees; full manufacturing-grade CAD healing; population-scale statistical claims; clinical sign-off; regulatory clearance; enterprise multi-tenant administration, billing and collaboration.

## 9. Final demonstration and definition of done

A user opens one registered case, reviews the osteotomy, edits a deliberately undersized plate, runs genuine 3D analysis, inspects its actual mechanical/geometric findings, requests remediation by voice, compares the proposed design with the baseline, runs the selected uncertainty/load study across the two prepared cases, and downloads the engineering package. The next session reopens the same case with the same evidence.

A passing story is not hardcoded: the demonstration uses whichever findings the verified model returns. If the chosen constraints are infeasible, the tool explains that and preserves the attempted candidates.

Completion requires: both prepared cases and registrations; real 3D GPU results with declared assumptions; passing numerical gates; working CAD edits/geometry checks; reproducible remediation; an auditable 18-scenario study; actual Deepgram audio/read/camera/compute actions; persistent state; working direct exports; passing build/numerical/browser checks; clear failure modes; and a recorded, reproducible walkthrough.

## 10. Primary references checked for this proposal

- NVIDIA Warp: https://github.com/NVIDIA/warp — GPU computation/FEM toolkit; installed version and bundled examples inspected locally.
- Deepgram browser SDK: https://developers.deepgram.com/docs/browser-agent-overview — browser Voice Agent WebSocket sessions with server-issued short-lived tokens.
- Deepgram Voice Agent protocol: https://developers.deepgram.com/reference/voice-agent/voice-agent — settings, audio and function-call messages.
- Deepgram temporary-token authentication: https://developers.deepgram.com/guides/fundamentals/token-based-authentication — token issuance and supported APIs.
- Modal GPU support: https://modal.com/docs/guide/gpu — supported GPU names; an enabled/billable provider project is required.
- Modal scaling: https://modal.com/docs/guide/scale — current warm-pool/concurrency settings and Function.map usage.
- Anatomy dataset: https://huggingface.co/datasets/BoneHub/visible-human-3d-models — distinct male/female CT-derived reference subjects and CC BY 4.0 provenance; preparedness for this workflow still needs verification.


