# Calculation reliability protocol

Locked 28 October 2026, before the new jaw audits and sensitivity runs. Scope: engineering calculations for the two saved reference revisions; no clinical or experimental validation claim.

## Separate gates

1. **Code checks:** independently assembled Tet4, affine patch/energy, CPU/GPU and quadratic plate benchmark. Analytical thin-plate error below 5%; last two refinement levels below 5% change.
2. **Saved jaw algebra:** independently reconstruct internal element and attachment forces from the portable NPZ. Relative free-node residual, reaction force/moment imbalance and energy/work error at most 1e-6; relative stress discrepancy at most 1e-8; attachment partition error at most 1e-10 and geometric reproduction error at most 1e-6 mm. These thresholds do not change after observing results.
3. **Attachment sensitivity:** same anatomy, geometry, material field, load/support registration and mesh; penalty multipliers 30, 100 and 300. Last two compliance and unsmoothed titanium peak changes below 5%; attachment slip below 0.01 mm. A failed strength check is recorded separately from numerical sensitivity.
4. **Spatial refinement:** preview, standard and refined settings for unchanged inputs. Record actual node/cell counts and geometry surface changes. Require the last two compliance, displacement and unsmoothed titanium peak changes below 5%. This is a project screening tolerance, not an estimated continuum error bound. Two levels alone cannot establish an observed convergence order. Irregular changes, geometry/surface changes or resource-limited levels keep the gate open. Never infer a passing stress peak from a stable average.
5. **Physical context:** anatomical/registration review, no-contact and overlapping-material approximations, cortical proxy, linear-strain applicability and yield/strength checks remain explicit. Passing algebra alone cannot promote `qualified` to true.

Native execution only, one GPU calculation at a time. No cloud spend. Keep bounded child processes, resource/error logs, exact inputs/source identity and every failed level. Do not modify the user's saved design to obtain a passing verification result.

## Amendment: exact attachment formulation

The completed 30/100/300 sweep exposed a failed sensitivity gate in the penalty model. Its results and failed gate remain recorded. An experimental `jaw-exact-tet-v4` formulation now eliminates the attachment degrees of freedom algebraically, implementing the stated perfectly bonded idealization without a tunable spring stiffness. It preserves the same physical geometry and registrations. This changes the numerical formulation; it does not retroactively qualify the earlier penalty results.

Before the exact formulation's refinement study, require a direct comparison with an independently solved Lagrange-multiplier system, rigid-motion reproduction, full saved-jaw force/energy/stress audits on both anatomies and maximum attachment constraint error below 1e-9 mm. Keep the existing 5% spatial screening tolerance and three-level requirement. Perfect bonding remains a physical assumption; exact elimination alone does not validate an interface or a device.

The distinction between iterative convergence and spatial convergence follows [NASA's grid convergence tutorial](https://www.grc.nasa.gov/www/wind/valid/tutorial/spatconv.html). Its GCI discussion is CFD guidance; this project does not claim a GCI from three unrelated tetrahedral meshes or treat the 5% screening tolerance as a physical uncertainty estimate. Production assembly uses the installed Warp 1.18 FEM implementation; the new saved-field audit uses independently written NumPy B/D matrices.
