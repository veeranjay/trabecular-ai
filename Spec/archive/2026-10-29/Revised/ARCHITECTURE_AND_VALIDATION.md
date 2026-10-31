# Proposed SDF architecture and credibility plan

**Framing correction, October 29:** a narrow model/fixture can test the shared kernel; it does not replace the original multi-horizon product vision. See [the correction](FRAMING_CORRECTION.md). Proposed method and validation choices remain subject to review.

**October 28, 2026 — design proposal, no execution authorized by this document.** The owner approved preserving the tetrahedral route as reference/checker. The primary development thesis remains SDF-based immersed analysis. Existing calculation records remain unchanged and unqualified where indicated.

## 1. Explain it simply

The SDF is a three-dimensional distance map of a shape. It makes operations such as changing thickness, cutting a region, and measuring distance convenient. The immersed solver uses a background grid to calculate how the material deforms, allowing the shape's boundary to cut through the grid instead of forcing every element face to follow it.

That can reduce repeated preparation when the shape changes. It also makes accurately handling boundaries, thin hardware, separate bodies, and attachments harder. The numerical formulation must solve those problems; a distance map alone cannot.

The tetrahedral route builds elements that fit the geometry. Keep it as a comparison route with independent convergence and assumptions. Agreement between two routes is useful; both can still share a wrong physical assumption. A controlled experiment addresses a different question: does the modeled behavior match relevant reality?

## 2. Architecture and ownership of evidence

```text
Versioned source geometry + parameters + setup + protocol
                     |
              canonical geometry contract
                     |
           +---------+----------------------+
           |                                |
    Implicit/SDF geometry            Fitted reference geometry
           |                                |
    Unfitted integration             Tetrahedral discretization
    + body/interface fields          + explicit ties/interfaces
           |                                |
    Primary immersed solve           Reference/checker solve
           |                                |
           +----------+---------------------+
                      |
       quantities, mapping checks, disagreement review
                      |
    numerical evidence + relevant experimental evidence
                      |
       context/applicability review -> evidence package
```

The application/job layer is shared. Method-specific geometry, discretization, diagnostics, and evidence are not hidden behind a generic “GPU result.” Every result identifies the actual method and physical assumptions. Shared source geometry is a consistency benefit but also a possible shared source of error; validate geometry independently.

## 3. Proposed formulation decision

### Initial physics

Small-strain, static, isotropic linear elasticity for one bounded hardware/fixture context. Each material/body has an explicit domain. Supports and loads use reviewed regions with checked force/moment resultants. The first interface model may use prescribed perfect ties only where that assumption is appropriate; separate bodies remain mechanically separate elsewhere.

Linear elasticity is a declared limitation. Large displacement, plasticity, fatigue, damage, contact-dependent load paths, and biological response do not become supported because a linear calculation returns finite values.

### Preferred immersed development direction

Use an **unfitted finite-element formulation with geometry-aware cut-domain quadrature**, separate fields or an equivalent valid construction for independent bodies, explicit boundary/interface enforcement, and a documented small-cut-cell conditioning strategy. Evaluate quadratic displacement approximation and local refinement near thin hardware/interfaces. Choose a stable, tractable implementation that meets the declared quantity error budget; do not freeze the entire jaw to a 96³ grid as a product constraint.

This is a concrete method direction, not a claim that all required operations are already supplied by the installed Warp APIs. The first resumed engineering task would be a narrow method/API feasibility spike on a controlled fixture. Its output must identify actual basis, quadrature, stabilization, interface enforcement, preconditioner, memory layout, and supported geometry.

Nitsche-type boundary/interface treatment and consistent stabilization are candidates to evaluate with an expert, not decorations to add to a specification. The published CutFEM framework illustrates why boundary/interface treatment and robustness need formulation-level work. [Method source](https://doi.org/10.1002/nme.4823).

### Rejected shortcut as a final thin-hardware model

Binary cell-center material labels plus a global soft exterior and display smoothing do not establish the intended thin-plate accuracy. An ersatz model can remain an explicitly labeled research comparison. If used in the selected formulation, demonstrate convergence with exterior stiffness, identify any artificial load path, and include its error in the protocol. It is not sufficient to say the floor “prevents singularity.”

If the preferred unfitted approach fails useful accuracy/resource gates, stop that development track for a decision. Options include a different immersed formulation, a bounded submodel with justified transfer, a licensed third-party engine, or an explicit business pivot. Do not silently substitute tetrahedra and mark the SDF milestone complete.

## 4. Geometry and material contract

Each source component records units, coordinate frame, transform, provenance, permitted use, hash, and component/body identity. Geometry checks include dimensions, closed/interior interpretation, missing/ambiguous regions, component intersections, minimum thickness, and known gaps. Unsupported ambiguity produces a rejection or review requirement.

Each SDF records sign convention, bounds, spacing/levels, interpolation, narrow-band extent, distance accuracy, construction version, and any reinitialization. Parameter edits preserve the connection to source geometry. Test volumes, distances, boundary normals/areas, booleans, and thin/gap features against analytic fixtures or independently measured geometry. The display surface can be separate, provided the mapping error is bounded and visible in evidence.

Use distinct labels for:

- imaging-derived geometry;
- synthetic cortex or tissue offsets;
- manually supplied anatomy/keep-out annotations;
- manufacturer CAD;
- assumed versus measured material properties.

No external bone surface automatically supplies a nerve canal, cortical thickness, or bone stiffness. A distance buffer represents an explicitly chosen margin and uncertainty assumption; it is not a measured clinical safe distance.

For each material, record the parameter source, units, constitutive law, manufacturing/process relevance, uncertainty, and allowable use. Old constants such as 880 MPa yield, 3,000 microstrain, or safety factor 1.8 may remain historical/demo assumptions only. A customer-approved protocol must justify any threshold used for a real engineering conclusion.

## 5. Boundaries, interfaces, and resource treatment

**Loads:** integrate tractions over the actual intended boundary or use a reviewed equivalent distribution. Verify total force, moment, area, and normal orientation before solving. Do not transfer point forces by nearest-vertex coincidence without an explicit model rationale.

**Supports:** constrain rigid-body modes with a physical interpretation. Check that the boundary treatment does not create artificial stiffness. Record enforcement formulation and parameters.

**Independent bodies:** a background cell containing two disconnected bone fragments must not automatically impose common displacement. The unknowns/coupling scheme must preserve intended separation. Test an open gap and a changing gap independently of the main jaw example.

**Ties/attachments:** list exactly which components are tied and how. Perfect attachment excludes loosening/pullout. The current algebraic exact-tie work is useful for a declared idealization, not evidence for a real interface's measured behavior.

**Thin structures:** choose local resolution/order from studies. A minimum number of cells through thickness can be a planning heuristic, not acceptance evidence. Compare displacement, energy, and relevant stress under bending. Refine integration and approximation separately where possible.

**Preconditioning and precision:** select based on measured conditioning and convergence across the actual material/geometry range. FP64 is a precision choice, not a stability theorem. Record CPU preprocessing and host memory as well as GPU memory; the existing reference path encountered host-RAM limits.

**Submodels:** permitted only with a documented transfer from the parent model, an overlap/interface convergence study, and a comparison with a sufficiently resolved coupled reference. Invented local loads can answer a different question while looking plausible.

## 6. Independent reference plan

Preserve existing source archives, results, and failed attempts. Do not delete the penalty study because exact ties replaced that parameter; it explains a numerical failure and the subsequent correction.

For the existing tetrahedral checker:

1. Freeze source, geometry, setup, assessment quantities, and protocol.
2. Obtain three accepted refinement levels on sufficient resources after runs resume. Confirm geometry/surface errors alongside displacement, compliance, and predefined stress quantities.
3. Document overlap/attachment idealizations and the absent contact model. Align them to the intended comparison or explicitly bound the mismatch.
4. Review high stress/displacement outputs for model applicability before treating them as design targets.
5. Compare a controlled fixture against a separately developed solver such as FEBio or another properly licensed reference. The local NumPy recovery audit does not replace independent FE model assembly/solution.

FEBio is a plausible reference tool, not a predetermined truth oracle. Its distributed binaries and source have different licensing terms; pick an authorized route rather than assuming redistribution permission. [Maintainer licensing terms](https://febio.org/about/licensing/).

## 7. Verification ladder

This is a future protocol. No check in this section was run for the diligence review.

| Stage | Question | Evidence to collect | Failure response |
|---|---|---|---|
| V0: geometry | Is the represented domain the intended shape? | Distance/volume/area/normal, thickness/gap, transforms, component overlap, cut integration errors | Reject input or fix representation; do not compensate in material parameters |
| V1: elementary mechanics | Is the method/code solving the specified equations? | Units, rigid motion, patch/affine strain, manufactured solution where suitable, energy and analytic fixtures | Isolate assembly/boundary errors before anatomy |
| V2: algebraic solution | Is this discrete system solved sufficiently accurately? | True constrained-system residual, iterations, convergence reason, precision/scaling, CPU/GPU comparison on the same small problem | Mark unresolved; do not count iteration limit as completion |
| V3: calculation verification | Is discretization/integration error controlled? | At least three resolution levels, integration/order studies, force/moment balance, predefined quantity comparisons, grid shift/rotation sensitivity | Refine/change method or narrow context |
| V4: independent numerical comparison | Does a separately developed route agree on the same physical question? | Matched setup, geometry mapping budget, quantities/fields, disagreement investigation | Treat disagreement as evidence to investigate, not average the answers |
| V5: validation/applicability | Does the model represent relevant observed behavior? | Controlled measured comparator, uncertainty, calibration/holdout separation, applicability review | Narrow or reject claim; numerical agreement is insufficient |
| V6: workflow/optimization | Does the product preserve the evidence and avoid exploiting error? | Revision replay, stale-state checks, failed-candidate records, final-resolution confirmation, study coverage | No accepted candidate or comparison conclusion |

The FDA framework distinguishes the role of a model, credibility evidence, and applicability to a defined context. This ladder is our proposed engineering plan; it does not claim to exhaust that framework or establish compliance. [FDA guidance](https://www.fda.gov/media/154985/download).

### Quantities and tolerances

Lock quantities and comparison regions before execution. Prefer physically meaningful nonsingular quantities, alongside raw maxima and their locations. Singular support/point-attachment peaks may not converge; excluding a region after seeing a result is not a valid fix. If a region is excluded by protocol, state why and retain the raw result.

The MVP's initial <5% targets apply to named quantities with an adequate reference. They are not a universal clinical tolerance. Report error definitions and denominators; near-zero reference values require an absolute scale. Allocate error across geometry, integration, discretization, and algebraic solve rather than treating their separate passes as independent guarantees.

Three levels alone do not prove asymptotic convergence or justify Richardson/GCI. Record observed order, monotonicity or oscillation, refinement ratios, and whether extrapolation assumptions hold. When they do not, report unresolved convergence.

## 8. Physical experiment plan

Select an experiment with the domain reviewer before optimizing the solver around it. A first controlled fixation/fixture test might compare load–displacement and selected strain/deflection measurements over a bounded static elastic range. Its usefulness depends on the customer's question and fixture relevance, not on whether it is easy to match.

Record actual specimen dimensions, material/process batch, assembly/fixture compliance, loads, displacement/strain measurement methods, sensor calibration, boundary conditions, repeatability, and uncertainty. Include fixture compliance in the model or bound its contribution. Define repeat count and held-out configurations based on uncertainty and experimental design with the lab; do not invent a token sample count as proof.

Separate calibration examples from validation holdouts by geometry/configuration and, where relevant, specimen/batch. Preserve failed specimens and mismatches. Do not tune loads, elastic modulus, and ties simultaneously to fit one curve without identifying whether those parameters are distinguishable.

Agreement in a static fixture establishes only the supported comparison. It does not validate in-vivo muscle loads, healing, fatigue life, or patient outcomes. Extending the claim requires new evidence and a corresponding context review.

## 9. Uncertainty and optimization

Maintain separate categories: uncertain inputs, model-form uncertainty, numerical error, and biological variability. Low/central/high material settings are scenarios unless a distribution and correlations are supported. Never promote guessed percentiles into population confidence claims.

A study declares its parameter space, exclusions, validity constraints, and sampling method. Report worst observed, unresolved regions, and coverage limitations. A surrogate used to choose the next case needs out-of-distribution checks and holdouts; candidate confirmation returns to the accepted physics model.

Begin with a bounded derivative-free design search. If shape differentiation is later selected, compare derivatives with finite differences across multiple step sizes and configurations; account for geometry integration, boundary movement, changing active sets, solver tolerances, and nondifferentiable events. A successful autodiff trace is not the gate.

The objective should serve the customer's decision, not automatically minimize titanium mass. Constraints include geometry/process requirements, model applicability, numerical evidence, and declared scenario performance. The system must be able to refuse a conclusion.

## 10. Fair benchmark protocol

Compare the immersed route against the existing qualified fitted route **and a competent alternative workflow**, including automation the buyer already owns. Avoid comparing a warm cached GPU result against a cold manual process with a different model/error.

For every benchmark record:

- problem, source geometry, permitted edits, model assumptions, hardware and software versions;
- declared quantities and achieved geometry/numerical error;
- human preparation, registration review, representation/discretization setup, compile/cold start, assembly, preconditioning, solve, recovery, export and review time;
- GPU time, CPU time, peak host/device memory, cloud billable resources, retries and failed jobs;
- warm/cold/cache states, number of repetitions, timing exclusions and environmental interruptions;
- manual intervention count and what an expert actually did;
- baseline, tuning set, holdouts, and failures under realistic geometry changes.

Report hands-on effort separately from elapsed turnaround. Parallelism may reduce elapsed time while increasing aggregate resource consumption. A useful early hurdle is a buyer-valued reduction in repeated effort, with a proposed target of at least 2× on the chosen hands-on task. Do not claim 100× speed or 2–6 second runs before matched-error evidence supports it.

## 11. Reproducibility and resource limits

A run identity includes geometry/setup/protocol hashes, method/formulation, materials/interfaces, resolution/order/integration settings, solver configuration, source/environment fingerprints, and hardware. Cache reuse requires exact matching relevant inputs and remains visibly labeled. The manifest preserves failed states as well as successful ones.

Local RTX 3050 memory limits make full-resolution feasibility uncertain; no new capacity run was performed. Start future numerical work with small controlled problems. Larger jobs require an explicit bounded resource plan, enough host RAM, configured Modal, and resumed authorization. Budget accounting includes CPU/RAM and preprocessing, not GPU seconds alone. See [commercial economics](COMMERCIAL_VALIDATION.md#6-resource-economics-and-development-budget).

## 12. Release claims

Allowed after evidence exists: “The selected method matched the stated reference quantity within X on these problems under this protocol”; “This workflow reduced measured hands-on preparation by Y for these edits”; “These assumptions/limitations remain.”

Not supported by this plan: “crash-proof anatomy,” “true worst case proved,” “clinically safe,” “FDA compliant,” “fatigue verified” from a static yield comparison, or “full-body ready.” Future evidence may support broader claims, but must be specific and independently reviewable.
