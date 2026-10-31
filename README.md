# Trabecular

Current presentation work: the standalone [demo workspace](demo/README.md) runs at `http://127.0.0.1:3100/`, without the engineering backend. Live Deepgram voice uses a server-side key; direct controls and the explicit Browser voice fallback remain usable without it. Source branch: `demo/buildathon`. The pre-demo engineering checkpoint is preserved on `mvp-baseline`, tagged `pre-demo-2026-10-31`. [Submission scope](Spec/DEMO.md). The owner-hosted presentation is at https://trabecular-ai-demo.vercel.app/.

A dark engineering workspace for preparing reference mandibles, editing bilateral fixation assemblies, running experimental 3D elasticity and retaining reproducible evidence.

The expanded MVP is in progress for completion before October 31. The current jaw model is **unqualified**. Its calculated stress, residuals and timing are real; completing a solve does not make the design validated or clinically safe.

## Run locally

Use Python 3.12 and Node 20.9+ with an NVIDIA CUDA-capable GPU for the default compute configuration.

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
npm --prefix frontend install
npm --prefix frontend run dev
```

Open http://localhost:3000. The existing `.venv` is detected automatically. The Next.js server starts the persistent loopback API on port 8100 when needed; analysis runs in isolated worker processes, one at a time. The Node and Python processes must run on the same machine with persistent `backend/data/` storage. This is not a static or serverless deployment.

For lower preview memory use, build the frontend and use `npm --prefix frontend run start -- --hostname 127.0.0.1`. The current verification session switched the port-3000 preview to this production mode. Source edits require rebuilding/restarting it, or returning to the development server. Saved cases and browser drafts are retained.

For a different interpreter set `TRAB_PYTHON`. For a different local API port update both `TRAB_API_PORT` in `backend/.env` and `TRAB_API_URL` in `frontend/.env.local`. Local mode rejects access through a public hostname. Hosting requires the Supabase authentication and storage mode together; no anonymous cloud fallback is provided.

## Workflow

1. **Prepare:** choose either distinct male/female CT reference, inspect the split segments and edit support/load regions and buffered keep-out paths. Pick bone surfaces or enter coordinates. Review the developer registrations before solving.
2. **Design:** edit advancement, plate thickness/width/placement, screw shift/length/trajectory, loading and material assumptions. The backend generates draft geometry for the viewport; saving creates an immutable input revision.
3. **Analyze:** queue an actual 3D Warp FEM solve on the local GPU. Inspect material-specific stress/displacement, residuals, force and moment balance, bond slip and qualification limits. Cancel queued/running work. Matching jobs are reused instead of recomputed.
4. **Compare:** overlay an exact saved revision, optionally including its bone surfaces, with shared physical field scales. Changes make previous fields stale. Drafts are retained locally per revision; Revert draft restores saved inputs and matching fields.
5. **Report:** download a generated engineering PDF or a ZIP with named assembly STLs, frozen preparation assets, input/source manifests and numerical evidence. Full volume displacement/stress/strain arrays are available as NPZ, alongside result JSON and viewport PNG.

Global Cases, Studies and Runs views expose saved cases, the 18-scenario study queue and job history. Studies require reviewed saved revisions for both anatomies, use shared thickness/width with case-specific placement, and vary three loading scenarios and three core moduli. Each scenario retains its own ID, inputs, source revision and result. The study view provides partial evidence, governing stress, a plot, drill-down and CSV/JSON export. Design search screens up to 16 distinct dimensional/placement candidates, refines up to two mechanically admissible candidates and checks a nine-case load/material envelope. Partial calculations and failures remain inspectable and exportable. The full search still needs measured acceptance and model qualification; unqualified results cannot become a verified winner.

Display options include axis clipping and actual surface intersection outlines, displacement amplification, camera bookmarks and a two-point ruler that reports distance on original geometry. Camera views persist on the current device. New calculation jobs retain a verified numerical-source archive; older evidence keeps its original fingerprint without a fabricated archive.

STL import requires explicit source units and records original bytes, scale, dimensions and surface quality. Orientation is saved per revision. Imported surfaces remain inspection-only until segmentation and mechanical registrations exist; analysis is rejected rather than fabricated.

The earlier CPU beam model is retained separately at `/reduced-model`, with its own explicit assumptions. It is not used as a silent fallback for a failed 3D calculation.

## Services and budget

See [SERVICE_SETUP.md](SERVICE_SETUP.md) for Supabase project creation, the SQL migration, key locations and verification commands. Never paste permanent keys into chat or frontend public variables.

- Local SQLite state and RTX 3050 compute work without provider credentials.
- Supabase auth, owner-filtered storage and the private artifact bucket adapter are implemented; hosted checks await configured credentials.
- The Deepgram browser SDK connects with short-lived backend tokens. Voice tools use the same validated case/revision/job services as the controls. Live audio/provider checks await the user's key. There is no Bolna integration.
- Modal execution is disabled. There are no automatic cloud calls, warm workers or paid retries. The user's $30/month allowance is a ceiling; current development uses the native GPU.

## Technology

Next.js 16.4 / React 19 / TypeScript, Three.js indexed geometry and OrbitControls, custom CSS, Lucide, FastAPI, Pydantic, SQLite, Supabase SDK, Deepgram Agents SDK, ReportLab, NVIDIA Warp 1.18 FEM, TetGen, Manifold3D, Shapely/Triangle, NumPy/SciPy and PyAMG. A CPU-built aggregation hierarchy preconditions GPU CG; equilibrium assembly and iterative application execute on the selected Warp device.

The model uses conforming tetrahedra: linear displacement in bone and quadratic displacement in titanium. Three bone domains remain disjoint. New CAD v5 calculations use `jaw-exact-tet-v4`: exact condensed interpolation constraints for locking heads and embedded screws, with no arbitrary spring stiffness. This is a perfectly bonded engineering assumption. Historical penalty results remain readable. Each new exact solve independently checks its saved forces, stresses and energy before acceptance. Finer native runs hit available-RAM limits, so mesh convergence and overall qualification remain open. See the [calculation reliability report](docs/verification/CALCULATION_RELIABILITY.md) and [implementation status](IMPLEMENTATION.md).

## Checks

```powershell
backend/.venv/Scripts/python.exe -m unittest discover -s backend -p 'test_*.py'
backend/.venv/Scripts/python.exe backend/verification3d.py --output docs/verification/local-3d-checks.json
npm --prefix frontend run lint
npm --prefix frontend run test:inspection
npm --prefix frontend run build
backend/.venv/Scripts/python.exe backend/check_configuration.py
```

The configuration check prints presence flags only. The numerical report contains rectangular benchmark convergence, independent Hex8 and Tet4 assemblies, an affine patch/energy check, CPU/GPU comparisons and a quadratic thin-plate thickness-refinement series. These are calculation checks, not anatomical validation.

## Anatomy and design

Both references derive from Alavi & Asseln (2026), [Visible Human 3D Models](https://huggingface.co/datasets/BoneHub/visible-human-3d-models), [dataset DOI](https://doi.org/10.57967/hf/10464), **CC BY 4.0**. CT provenance: Andreassen et al. (2023), [Scientific Data](https://doi.org/10.1038/s41597-022-01905-2). Original source hashes, dimensions, coordinate transforms and developer-defined cuts/registrations are retained in the anatomy manifests. The stepped split references need anatomical review; they are not patient surgical plans. Keep-out spheres are not traced nerves.

Reproduce the two prepared references with `backend/prepare_cases.py` using the retained source STLs. Each case captures immutable prepared solids and registrations by content hash, so updating the reference library does not rewrite saved cases. Numerical cache identities include source-code and dependency versions.

[DESIGN_PRINCIPLES.md](DESIGN_PRINCIPLES.md), [workspace composition](docs/design/WORKSPACE_LAYOUT.md) and [reference review](docs/design/REFERENCE_REVIEW.md) define the black/glass design direction. [MVP_Revised_Plan.md](MVP_Revised_Plan.md) remains the approved expanded scope.
