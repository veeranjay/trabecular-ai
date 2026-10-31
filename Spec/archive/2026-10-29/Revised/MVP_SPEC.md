# Revised MVP specification and acceptance gates

**Framing correction, October 29:** the controlled-fixture/manufacturer-first scope below is an unapproved proposed experiment. It does not redefine the original platform or approved scope. See [the correction](FRAMING_CORRECTION.md).

**Proposal — October 28, 2026.** Engineering work remains paused. Approval of this document would select direction and scope; execution also needs an explicit resumption of the paused checks/runs. No new result is required or implied by writing this plan.

## 1. Smallest convincing proof

For one bounded fixation design family, an engineer changes geometry, evaluates baseline/candidate under a declared mechanical protocol, compares the results against a separately identified reference, and exports the evidence and limitations.

The product's first scientific proof is **real SDF/immersed analysis at a useful, declared accuracy**. The product's first commercial proof is **a buyer using and paying for a repeated engineering comparison**. These are separate gates. Voice, a large cohort dashboard, or an apparently passing implant cannot substitute for either.

## 2. Three milestones, three truthful labels

| Milestone | What it means | What it does not establish |
|---|---|---|
| M0: existing prototype / submission | Current application and retained tetrahedral evidence, accurately described | SDF jaw analysis, complete expanded MVP, mesh qualification, or customer demand |
| M1: technical feasibility MVP | One bounded immersed mechanical model meets its stated numerical comparison gates | Physical prediction validity or a commercial market |
| M2: paid engineering pilot | A customer-defined comparison is delivered, reviewed, and repeated or contracted | Clinical approval, universal solver credibility, or automatic scalability |

The owner previously required the expanded MVP before October 31. **That scope is not shown complete by current evidence.** This proposal recommends an honest M0 submission if the deadline remains, followed by gated M1/M2 development. That is a proposed scope/schedule change requiring owner acceptance, not a silent redefinition of the earlier commitment. No credible completion date for M1/M2 can be promised before the method spike, expert access, and customer context are known.

## 3. Required M1 scope

### A. One physical question

Select one question and protocol before more features. Prefer a controlled static fixture with known load/supports and a fixation component; then extend to the prepared jaw assembly as a research context. If the customer requires a different meaningful first question, revise the model boundary explicitly.

Define component geometry, material data, interface idealizations, force/moment resultants, quantities of interest, comparison regions, valid parameter ranges, and rejection rules. Use one supported hardware family. Do not broaden to contact, fatigue, remodeling, or other body regions to make the demo appear larger.

**Acceptance:** another engineer can explain the modeled question and identify which real-world decisions it cannot answer.

### B. Genuine SDF/immersed path

Preserve explicit geometry and implicit fields with shared source identity. Implement the selected unfitted formulation: boundary integration, material/body separation, supported attachment conditions, stabilization/conditioning, and thin-feature treatment. “SDF CAD followed by tetrahedral analysis” is not M1 completion.

**Acceptance:** benchmark evidence proves that loads, geometry edits, and material interfaces enter the immersed calculation correctly. A checkerboard/voxel material demonstration is insufficient for the stated thin-hardware question. See the full [validation protocol](ARCHITECTURE_AND_VALIDATION.md).

### C. Tetrahedral reference/checker

Keep the existing implementation and archived results. Independently document its element choices, geometry, interfaces, loads, convergence, assessment regions, and remaining limitations. Resolve the current refinement gate on an adequately provisioned host only after runs resume. Compare against a separately developed solver on a simple supported problem as well; shared Warp code may share errors.

**Acceptance:** reference adequacy is established for the selected comparison. Both routes use the same physical problem within documented mapping tolerances. The reference is not labeled truth solely because it is conforming.

### D. A complete baseline/candidate workflow

Load supported input, freeze baseline, change bounded geometry, invalidate stale fields, run analysis, compare with a common protocol/scale, preserve errors and logs, and export a reproducible package. Preserve useful current case/job/revision/report plumbing. Include numerical and applicability states as specified in the product spec.

**Acceptance:** a second engineer can reconstruct the comparison from exported evidence; every displayed number belongs to the selected run and geometry. There are no canned results or predetermined passing candidates.

### E. Bounded search after the canonical model is accepted

Start with a very small derivative-free candidate set, chosen to answer a concrete design question. Record geometry rejection before solving, resource limits, failed candidates, objective, and declared constraints. Confirm the proposed final candidate at accepted fidelity and over the complete chosen scenario set.

**Acceptance:** replay reproduces the conclusion within declared tolerance. If none qualify, the product reports no eligible proposal. Searching coarse unqualified models may generate research leads, not an accepted engineering recommendation.

### F. Honest scenario studies

Begin with one geometry and a minimal declared load/material set. Use both public anatomies only when each setup is supported and numerical gates pass. Two anatomies × three loads × three moduli would be 18 scenarios, not an 18-patient cohort. The existing 18-scenario plan remains unaccepted until evidence exists for every required member.

**Acceptance:** failed/cancelled/unresolved members stay in the table and study status. Material settings are “low/central/high assumptions” unless their percentile meaning is substantiated. No population confidence or global worst-case claim.

### G. Modern engineering UI

Retain dark/black glass, a large canvas, one contextual inspector, progressive disclosure and a compact assistant. Improve the hierarchy around the new Prepare → Design → Analyze → Compare → Evidence flow. Maintain readable legends, physical units, comparison scales, and persistent model/quality identity.

**Acceptance:** an engineer can identify the current revision, method, status, main finding, and next action without opening raw logs. Visual polish is not an alternate acceptance path around failed physics.

## 4. M2 additions for a paid pilot

- A named customer, authorized inputs, a named technical reviewer, one decision/context, agreed deliverables and acceptance.
- A documented baseline workflow and measured hands-on effort, failures, turnaround, and review time.
- An independent model/experimental applicability review appropriate to the promised conclusion. If physical evidence is unavailable, the engagement is explicitly limited to exploratory numerical comparison.
- Customer review of the evidence package, one replay, and a subsequent change evaluated through the same workflow where possible.
- Applicable dependency/data rights, access controls, retention/deletion agreement, and a support/cost plan.

Revenue alone does not upgrade an exploratory model's scientific status. Pilot statements of work must say what evidence is and is not being delivered.

## 5. Proposed numerical gates

These are initial engineering targets, to be finalized before execution for each quantity. They are not universal regulatory tolerances. The reviewer may require tighter or different criteria based on the decision; changes must not be made after seeing unfavorable results without a recorded reason and rerun plan.

| Gate | Initial target / acceptance principle |
|---|---|
| Basic code verification | Units, rigid motion, affine/patch/energy checks, manufactured solution where applicable; benchmark-specific expected error |
| Algebraic solution | True constrained-system relative residual initially ≤1e-6, with scaling and normalization recorded |
| Mechanical balance | Force and moment balance; initial ≤1% normalized error with a nonzero declared reference scale |
| Geometry/integration | Volume, boundary area/normals, loads, and thin features meet a predeclared error budget |
| Resolution | At least three accepted levels; initial <5% change in selected nonsingular quantities between the finest levels, supported by a credible trend |
| Grid-position sensitivity | Translate/rotate the same problem relative to the background grid; changes remain within allocated error budget |
| Reference comparison | Initial <5% error for declared benchmark quantities; geometry/setup mapping errors included; no generic singular-peak promise |
| Interface treatment | No accidental cross-gap coupling; tie/stabilization/void-floor sensitivities bounded for the selected quantities |
| Candidate confirmation | Accepted fidelity, full declared scenario set, and required reference comparison; no cherry-picked winner |
| Physical applicability | Separate experimental/comparator evidence sufficient for the particular claim; not inferred from numerical agreement |

If a gate cannot be assessed because of memory or missing evidence, it remains unresolved rather than passed. Avoid claiming GCI/Richardson certainty if the asymptotic behavior required by those methods is not established.

## 6. Integration priorities

**Required for the engineering feasibility MVP:** real calculation, revision identity, durable local state, comparison, direct export, truthful errors and cancellation. Hosted deployment is not needed to test whether the numerical thesis works.

**Required for a hosted pilot:** configured and exercised authentication/storage, tenant-scoped artifacts/events, recovery and access review appropriate to the inputs. Supabase remains the proposed service; a local instance must be labeled as local rather than counted as hosted completion.

**Deepgram:** retain as the selected voice provider. A live voice session, structured read/camera tools, and typed compute actions can be added after the numerical workflow is stable. The previously approved expanded plan includes real provider acceptance; moving it out of initial M1 is a proposed priority change, not a claim that the old requirement is already satisfied.

**Modal:** use only after configuration and explicit resumption. Each run/study has resource, timeout, concurrency, and spend limits. The owner's $30/month allowance is a hard planning ceiling; credentials do not authorize unbounded runs.

## 7. Cut order and stop conditions

Cut extra display polish, voice expansion, additional cases, larger scenario grids, and advanced search before cutting canonical correctness or traceability. Do not use a fitted solver to quietly satisfy the SDF milestone.

Stop expanding scope if the chosen immersed approach cannot meet useful error/resource limits, if reference assumptions do not answer the question, or if no buyer repeatedly needs the output. At that point decide explicitly whether to pursue numerical research, integrate a third-party solver, pursue the alternative workflow business, or stop.

The long-term product is earned by these milestones. It is not created by retaining all original features in the “MVP” list.
