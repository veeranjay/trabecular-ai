# Calculation reliability — 28 October 2026

The independent checks agree with the saved jaw calculations. The original spring-based attachments failed sensitivity testing, so new CAD v5 jobs now use exact interpolation constraints. **Mesh convergence is still unverified because the finer local runs exhausted available RAM. Overall qualification remains false.**

## What was established

| Check | Result | Meaning |
|---|---|---|
| Known-answer blocks and plates | Pass | Independent assembly, affine patch/energy, CPU/GPU agreement and thin-plate bending meet their declared tolerances. The final plate error is approximately 0.89%. |
| Independent original jaw checks | Pass on both anatomies | A separate NumPy calculation rebuilt element forces, attachment forces, stresses and energy from exported arrays. It agrees with each saved discrete solution. |
| Original attachment sensitivity | Fail on both anatomies | Changing the spring multiplier from 100 to 300 changed stress and compliance beyond 5%, and attachment slip remained above 0.01 mm. These results cannot be called insensitive to the attachment setting. |
| Exact attachment elimination | Pass on both preview meshes | Elimination agrees with a separate Lagrange-multiplier solution on the small test, preserves rigid motion, and passes independent full-jaw audits. Constraint errors are below 4e-15 mm in completed checks. Perfect bonding is an explicit physical assumption. |
| Finer anatomy/hardware meshes | Blocked by local resources | Standard meshes were generated, but the full calculations hit the available-RAM guard. Refined calculations were not accepted or inferred. |
| Physical/clinical validation | Not established | Anatomical registrations, cortical proxy, no-contact and overlapping-material assumptions remain limitations. Yield and strain checks still fail on the tested designs. |

## Measured attachment sensitivity

Same saved geometry, materials, load/support data and discrete mesh at every multiplier. All six calculations and independent audits completed. Relative changes below use the higher multiplier as denominator, as locked in the protocol.

| Anatomy | Multiplier | Peak titanium stress (MPa) | Compliance (N·mm) | Maximum bone-attachment slip (mm) |
|---|---:|---:|---:|---:|
| Female | 30 | 5,958.72 | 3,444.72 | 0.17758 |
| Female | 100 | 5,332.96 | 2,950.14 | 0.08134 |
| Female | 300 | 4,986.82 | 2,747.46 | 0.04118 |
| Male | 30 | 22,000.11 | 5,395.60 | 0.43815 |
| Male | 100 | 19,351.17 | 4,454.27 | 0.19360 |
| Male | 300 | 17,455.16 | 4,051.86 | 0.09699 |

The final female changes are 6.94% stress / 7.38% compliance; the male changes are 10.86% / 9.93%. Both fail the locked 5% screen. Original results and their source identities remain intact.

## Exact attachment pilot

The formulation is `jaw-exact-tet-v4`. It enforces the intended perfectly bonded interpolation relationships algebraically, removing the arbitrary spring stiffness. It does not model loosening, contact or interface damage. These are separate calculations on unchanged saved design geometry.

| Anatomy | Peak titanium stress (MPa) | Maximum displacement (mm) | Compliance (N·mm) | Independent audit |
|---|---:|---:|---:|---|
| Female | 4,526.20 | 8.06 | 2,543.31 | Pass |
| Male | 14,666.17 | 12.07 | 3,552.00 | Pass |

Those stresses exceed the assumed 880 MPa yield threshold. Exact attachment constraint error near machine precision describes the numerical enforcement of an assumption; it is not a measured physical interface slip or evidence of a safe design.

## Native refinement limit

The laptop has 4 GB GPU memory and approximately 15.3 GB total system RAM. The generated standard meshes contain 540,110 tetrahedra for the female case and 435,497 for the male case, with roughly twice the preview titanium element count. Runtime guards stop the owned calculation tree when available system RAM falls below 750 MiB. Retried runs retained their logs and failed states. Memory use was reduced through block-preserving setup and a production preview server; the available-memory limit persisted.

One earlier male standard attempt also crossed its 600-second wall-clock limit during a long gap in resource sampling. That elapsed time is not treated as an uninterrupted solver performance measurement. The later active retry hit the RAM guard.

Completion requires the same inputs on a host with more available RAM, three accepted mesh levels, the locked stress/displacement/compliance change checks, and a surface-error assessment. Modal has not been configured or invoked. No cloud credit was spent. Until these checks exist, the application retains `qualified=false` and cannot select a verified optimization winner.

## Evidence and reproduction

- [Locked protocol and exact-attachment amendment](RELIABILITY_PROTOCOL.md)
- [Fresh known-answer benchmark](reliability-benchmarks-after-memory-change.json)
- [Independent original female audit](female-independent-jaw-audit.json) and [male audit](male-independent-jaw-audit.json)
- [Six-run attachment sweep](20261028T091914Z-penalty-study.json)
- [Exact attachment pilot](20261028T093520Z-penalty-exact-study.json)
- [First refinement attempt](20261028T094031Z-mesh-exact-study.json), [memory-saving retry](20261028T103154Z-mesh-exact-study.json), and [final female retry](20261028T103844Z-mesh-exact-study.json)
- [Generated standard-mesh counts](standard-mesh-counts.json) and [sampled native resources](native-refinement-resources.csv)
- [Normal app job integration](production-exact-jobs.json): completion state is recorded in the file; it is not inferred from the pilot.

Each retained experiment has input JSON, logs, a numerical source archive, and completed runs' raw fields/audits under `backend/data/reliability/`. The app exposes **Analyze → Independent calculation check → Verify saved calculation**, with JSON download and inclusion of saved audits in engineering exports. Checks apply to the selected saved run; the current draft is excluded.

The final normal app integration completed for both frozen revisions: female job `6784fc75-2781-440c-8955-eccfc3cfd587` in 76.5 seconds analysis time, male job `2c2870e6-43f9-46ce-94cd-d2527038b7ea` in 170.9 seconds. Automatic independent audits passed, all thirteen surface fields matched their geometry and contained finite values, and both results retained `qualified=false`. Sixty backend tests, five frontend geometry tests, lint and the production build passed. Both refreshed engineering ZIPs passed integrity checks and include their current raw fields and audit JSON; all six pages of the two new PDFs were visually checked.
