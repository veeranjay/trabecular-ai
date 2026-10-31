# Trabecular — due diligence and proposed revisions

**Review date:** October 29, 2026, Asia/Kolkata. **Status:** proposals for owner review; no specification changes or pivot approved by this document.

**Decision supported:** how to strengthen the original multi-horizon platform thesis and specifications before further implementation. Subject: this local Trab AI / Trabecular project, not another business with a similar name. No legal entity, launch jurisdiction, verified founder credentials, customer contracts, or financial statements were supplied.

The review used the project-due-diligence skill, original specifications, selected source and saved calculation artifacts, and primary external sources. No new project code, calculations, tests, benchmarks, builds, deployments, account actions, or outreach were performed. New engineering runs remain paused.

## 1. Judgment and scope boundary

**Retain the original platform vision. Revise unsupported claims, define evidence gates for each horizon, and distinguish delivered capability from intended capability.** The sources support the technical plausibility of implicit/unfitted analysis and show precedents for medical simulation businesses. They also establish substantial competition and additional scientific work between an initial static mechanical calculation and the later clinical/biological promises.

This evidence does **not** justify replacing the original VSP/CAD/reconstruction entry point with a manufacturer-only product. Nor does it establish customer demand, a proprietary moat, clinical validity, or the proposed speed/cost advantages. Those remain open questions.

The October 28 `Spec/Revised/` pack is not the baseline for this review's product framing. Its narrow positioning was an unapproved recommendation, as recorded in [the framing correction](Revised/FRAMING_CORRECTION.md). The baseline is the original project, including subsequent user corrections such as Deepgram and retaining the tetrahedral solver as a reference/checker.

### Preserve these elements

- A reusable **SDF/immersed biomechanical foundation**, with anatomy-specific models and workflows.
- **CMF/mandibular fixation as the initial showcase**, without redefining the company as a mandible-only tool.
- All three commercial pillars: complex reconstruction evaluation, virtual-cohort evaluation, and closed-loop CAD remediation with the VSP co-pilot.
- The first three commercial horizons and later remodeling/clinical horizon.
- **Deepgram**, Modal with the owner's **$30/month ceiling**, local GPU fallback where feasible, and Supabase as the selected service direction.
- The **tetrahedral implementation as a reference/checker**, with its own qualification requirements.
- The requested modern **dark/black glass UI** and truthful interaction/state behavior.

### Evidence categories

**Corroborated:** supported within the source's actual scope. **Partly corroborated:** some part holds, with material limits. **Contradicted:** a specific absolute statement conflicts with evidence. **Self-reported:** a vendor/party represents a capability; not independently measured here. **Unresolved:** insufficient evidence, not evidence of falsity.

Revision types below:

- **C — correction:** fix a factual, mathematical, or status inconsistency.
- **D — design proposal:** a recommended requirement or evidence gate, not a proven best implementation.
- **H — commercial hypothesis:** requires customer/market evidence and owner choice.

Priority: **P0** affects truthful claims, interpretation, or release eligibility; **P1** affects technical/commercial validation; **P2** affects later expansion or documentation maintenance. Priority is not a numerical likelihood or aggregate project score.

## 2. Clear list of proposed revisions

Every item remains proposed. “Approve” means agree to the revision, not authorize its implementation or resume paused runs.

| ID | Proposed revision | Type | Priority |
|---|---|---|---|
| R01 | Preserve the platform, pillars, and original horizons in the project description | C | P0 |
| R02 | Separate current implementation, intended architecture, and qualified capability | C | P0 |
| R03 | Replace “100% anatomy-agnostic / zero solver changes” with shared core plus domain models | C/D | P0 |
| R04 | Remove uniqueness claims for SDF + immersed analysis + automated iteration | C | P0 |
| R05 | Correct the claim that tetrahedral workflows are inherently manual | C | P0 |
| R06 | Replace assumptions about named CAD partners and Simq with sourced capability statements | C/H | P0 |
| R07 | Define Horizon 1's engineering question and clinical boundary without deleting its VSP/CAD entry point | D/H | P1 |
| R08 | Keep Horizon 2; replace “true worst case / 510(k) proof” with declared study coverage and evidence | C/D | P0 |
| R09 | Separate distinct anatomies, scenarios, synthetic variants, and statistically justified percentiles | C/D | P0 |
| R10 | Keep Horizon 3; separate mechanical appliance analysis from tooth-movement/outcome prediction | C/D | P1 |
| R11 | Keep Horizon 4; require calibrated time/outcome models and accurately describe FEops precedent | C/D | P1 |
| R12 | Replace crash-proof SDF/Boolean guarantees with a supported-input and geometry-error contract | C/D | P0 |
| R13 | Correct resolution/DOF assumptions and require thin-feature evidence | C/D | P0 |
| R14 | Specify separate-body/interface mechanics and test stabilization/void effects | D | P0 |
| R15 | Separate linear static screening from fatigue, plasticity, pullout, and biological claims | C/D | P0 |
| R16 | Keep rendering interpolation separate from numerical accuracy and reported extrema | C/D | P0 |
| R17 | Require evidence for shape gradients and independent confirmation of optimization results | D | P1 |
| R18 | Keep the tetrahedral checker; qualify it and distinguish numerical from physical validation | C/D | P0 |
| R19 | Replace fixed latency/memory/100×/$2 promises with matched-error, end-to-end benchmarks | C/D | P1 |
| R20 | Replace regulatory-compliance implications with context-specific evidence and function review | C/D | P0 |
| R21 | Preserve Deepgram and dark glass UI; remove scripted successes and ambiguous live states | C/D | P0 |
| R22 | Turn the three claimed moats into asset-acquisition plans with rights and measurable proof | C/D | P1 |
| R23 | Keep horizon-specific buyers/prices as hypotheses and validate them separately | H | P1 |
| R24 | Reconcile completion status with actual open gates; do not silently change the October 31 requirement | C/D | P0 |
| R25 | Resolve commercial-use/distribution terms for actual and contemplated dependencies | D | P0 before commercial release |
| R26 | Add a versioned claim/evidence register and keep unapproved strategy separate from the spec | D | P2 |

## 3. Horizon-by-horizon assessment

The [master spec §6](Project_Spec.md) supplies the expansion sequence. The [detailed spec §1.3](Project_Spec_detailed.md) supplies the three commercial pillars. They are related, but not identical lists.

| Horizon retained | What is supported | What remains unestablished | Proposed next evidence, after separate authorization |
|---|---|---|---|
| **H1: complex reconstruction and CAD/VSP partners** | Relevant platforms and manufacturers exist; the app has genuine prepared-anatomy calculations; SDF/unfitted methods are technically established | A partner's unmet need, willingness to buy, trustworthy patient-specific setup, model adequacy, and speed benefit | Observe a real VSP/CAD/reconstruction workflow; agree one supported question; compare actual preparation and results against its existing process |
| **H2: virtual-cohort device R&D** | Medical cohort/testing offerings already exist, corroborating an established product category while challenging uniqueness | Our anatomy coverage, population relevance, uncertainty model, defensible worst-case selection, throughput and buying intent | Rights-cleared study design with an R&D reviewer; explicit coverage/holdouts; numerical and empirical evidence appropriate to the claim |
| **H3: orthodontics and dental appliances** | Existing staging/attachment products and original PDL/clinical research establish a real technical/commercial field | Our useful improvement over incumbents; root/PDL geometry; material/contact behavior; prediction of achieved movement, refinements or injury | Select one appliance/mechanical question; bench comparison first where relevant; separate prospective outcome evidence for clinical claims |
| **H4: calibrated remodeling and clinical prediction** | Original remodeling research exists; FDA records confirm a specific simulation product's De Novo authorization | Patient-specific calibrated rates, longitudinal predictive validity, rights to follow-up data, and Trabecular's regulatory route | A defined clinical question, longitudinal data rights, calibration/holdouts, expert review and jurisdiction-specific regulatory plan |

This table does not select a new business. A small test or pilot can validate a shared dependency without replacing the overall roadmap. No horizon should inherit another horizon's validation automatically.

## 4. Revision details and concrete evidence

### R01 — Preserve the original platform and horizons

**Location:** [detailed spec §§1.2–1.3](Project_Spec_detailed.md), [master spec §6](Project_Spec.md).

**Evidence/assessment:** the detailed spec explicitly distinguishes the reusable engine from the CMF showcase and lists three pillars. The master lists reconstruction/CAD, cohort R&D, orthodontics, and later remodeling. **Corroborated, high confidence** as original intent. This says nothing by itself about delivery or commercial viability.

**Proposed wording:** “Trabecular is an SDF/immersed biomechanical analysis and closed-loop design platform. CMF reconstruction is the initial showcase and intended first commercial horizon, followed by device-family cohort studies, orthodontic/dental applications, and calibrated longitudinal prediction.”

**Decision:** preserve this identity. Any different launch buyer is an explicit optional proposal, not a replacement description. No evidence from this review mandates a manufacturer-only pivot.

### R02 — Distinguish intent, implementation, and qualified scope

**Location:** executive descriptions in both project specs; [approved MVP §2.C](MVP_Revised_Plan.md); current implementation descriptions.

**Evidence:** [current meshing source](../backend/volume_mesh.py) calls TetGen; [FEM source](../backend/mixed_fem.py) uses tetrahedral elements; [saved report](../docs/verification/CALCULATION_RELIABILITY.md) identifies `jaw-exact-tet-v4` and qualification false. The approved MVP still calls for an immersed/SDF representation. **Contradicted, high confidence** if the present full-jaw path is described as an implemented immersed solver.

**Proposed change:** every capability table gets separate columns: intended method, implemented method/version, numerical evidence, physical/clinical applicability, and remaining gate. Describe the SDF primary path as intended until it exists and passes its stated checks. Preserve the real tetrahedral work accurately.

**Closure:** source and retained artifacts support each current-state statement. No new run is necessary just to correct the description.

### R03 — Shared foundation plus domain physics

**Location:** detailed spec §§1.2 and 2, including “100% Anatomy-Agnostic” and “zero changes to the solver code.”

**Evidence:** the same spec's domain table requires fatigue, subsidence, micromotion, tooth movement and remodeling, while §3.3 writes a static elastic law. Original human PDL research demonstrates nonlinear/time-dependent behavior [S12](https://pubmed.ncbi.nlm.nih.gov/12231287/); the cited remodeling research adds an adaptation law [S14](https://ris.utwente.nl/ws/portalfiles/portal/6561771/Huiskes87adaptive.pdf). **Partly corroborated** for reusable infrastructure, **unsupported** as a universal no-change guarantee; high confidence in the distinction.

**Proposed change:** define reusable geometry, discretization/integration tools, compute, parameter search and evidence contracts. A domain package supplies anatomy registration, material laws, loads, interfaces, quantities/failure models and its qualification evidence. The core may need new capabilities when a domain introduces new physics.

**Closure:** a domain capability matrix shows what is reused, added and independently validated. This preserves the architecture's ambition.

### R04 — Correct the SDF uniqueness claim

**Location:** master spec §7; the “nobody has packaged” assertion in [Analysis.md](Analysis.md).

**Evidence:** Intact's September 1, 2026 technical article documents native implicit geometry, an independent hexahedral analysis grid and headless design loops [S01](https://intact-solutions.com/closing-the-simulation-gap-for-implicit-design/). CutFEM is published prior art [S02](https://doi.org/10.1002/nme.4823). **Contradicted, high confidence** for uniqueness of that broad combination. These sources do not prove equivalent CMF accuracy, price or workflow quality.

**Proposed change:** “Our proposed advantage is a reusable, domain-qualified biomechanical workflow whose preparation effort, robustness and repeated-analysis performance will be compared with capable alternatives.”

**Closure:** benchmark actual differences; do not infer patentability or freedom to operate from the public search.

### R05 — Correct the manual-meshing story

**Location:** master spec §§1–2 and §7.1.

**Evidence:** our own [mesh generator](../backend/volume_mesh.py) automates tetrahedralization and caches results. Ansys documents optimization/UQ workflows [S03](https://ansyshelp.ansys.com/public/Views/Secured/corp/v252/en/opti_ug/opti_ug_overview.html). The October 28 review also inspected Simpleware batch/API and Materialise scripting documentation; see [its source ledger E06–E07](Revised/EVIDENCE_LEDGER.md). **Contradicted, high confidence** as a blanket manual-only claim.

**Proposed change:** “Body-fitted meshing can be automated. Complex geometry and repeated changes may still create preparation, mesh-quality and setup burdens. We will measure those burdens in the target workflow.”

**Closure:** compare to competent automation, including reuse and caches. An SDF approach earns its place through a useful measured advantage; one-click operation alone does not distinguish it.

### R06 — Correct named-partner and competitor assumptions

**Location:** master spec §6 H1 and §7.1; detailed spec §6 pilot targets.

**Evidence:** Meticuly's FDA-hosted K210099 summary lists comparative FEA and mechanical tests on PDF page 9 [S04](https://www.accessdata.fda.gov/cdrh_docs/pdf21/K210099.pdf). Simq publicly describes product-family/variant testing and virtual patient cohorts [S05](https://simq.de/en/simulation-services/). v-Patients markets anatomy studies and virtual trials [S06](https://www.v-patients.com/). **Contradicted** for a blanket “no physics/no cohorts” landscape; **unresolved** for exact solver ownership, degree of automation, or willingness to buy. High confidence in the documented overlap, not in untested parity.

**Proposed change:** distinguish established public capability, unknown internal capability, hypothesized integration gap, and actual commercial relationship. Keep Meticuly/CustoMED and similar platforms as research targets, not presumed customers or physics-deficient businesses.

**Closure:** a counterparty confirms an unmet need and an authorized next step. No contact was made here.

### R07 — Define H1's question without deleting its entry point

**Location:** detailed spec pillar 1; master spec H1 and VSP descriptions.

**Evidence:** the original commercial path includes VSP service bureaus, custom reconstruction labs and CAD partners. Current local evidence uses prepared registrations, an offset cortex proxy and perfect-attachment/no-contact assumptions [L02](../docs/verification/CALCULATION_RELIABILITY.md). FDA's modeling framework asks for the model's specific role [S07](https://www.fda.gov/media/154985/download). **Unresolved** whether the present model supports a particular reconstruction decision; high confidence that this must be specified.

**Proposed change:** define one initial engineering question with a VSP/CAD/reconstruction reviewer, the available anatomy/annotations, loads, interface assumptions, quantities and decision limits. Separate geometric clearance, mechanical comparison and clinical recommendation. A nerve annotation must have a source and uncertainty; an outer bone surface alone does not supply its internal path.

**Closure:** the reviewer accepts the supported question and its evidence plan. A controlled fixture may be a validation instrument, not a mandatory new company direction.

### R08 — Keep H2, qualify the envelope claim

**Location:** detailed spec pillar 2; master spec H2; original MVP “510(k) Virtual Cohort” tab.

**Evidence:** FDA's AM guidance discusses predefined patient-matched design/performance envelopes and their limits [S08](https://www.fda.gov/media/97633/download), §V.B. Testing a finite set establishes only what that set and justified inference support. A sampled maximum is not logically a proof of a global maximum over an unspecified continuous space. **Unsupported, high confidence** for “mathematically proves the true worst case” as currently specified.

**Proposed change:** “Virtual-cohort and parameter-space studies identify governing observed cases and support a documented worst-case rationale within a declared domain, subject to model credibility, coverage and uncertainty.”

**Closure:** define the domain, validity constraints, sampling/search method, coverage/holdouts and unresolved regions. Use “worst observed” unless stronger bounds are actually established. Keep cohort R&D as a central platform capability.

### R09 — Correct cohort counts and percentile labels

**Location:** master spec uncertainty sweep; detailed spec database/manifest; original MVP 10/100-skull descriptions.

**Evidence:** the source dataset card identifies two cadaveric subjects [S09](https://huggingface.co/datasets/BoneHub/visible-human-3d-models/blob/3817c725e2d7e873a225f6cfa76c8bdf6989c0d3/README.md). The [approved plan §2.F](MVP_Revised_Plan.md) already correctly distinguishes 2 anatomies × 3 loads × 3 moduli = 18 scenarios. No supplied calibration establishes the selected stiffness values as population P05/P50/P95. **Contradicted** if scenarios are counted as people; **unresolved** for population percentiles.

**Proposed change:** carry the approved plan's distinction into every spec/UI/report. Report distinct source anatomies, synthetic variants and scenario counts separately. Use low/central/high assumptions until distribution and correlation evidence exists.

**Closure:** cohort provenance, rights, selection, coverage and variable distributions are documented. Public or synthetic volume does not by itself create population representativeness or proprietary ownership.

### R10 — Keep H3; separate mechanical and treatment predictions

**Location:** master spec H3; detailed spec orthodontic domain and synthetic PDL shell.

**Evidence:** ArchForm already advertises attachment/staging controls [S10](https://www.archform.com/software), and Align described biomechanics-based activation in 2020 [S11](https://investor.aligntech.com/news-releases/news-release-details/align-technology-announces-invisalign-g8-new-smartforce). Human PDL tests found nonlinear relaxation behavior [S12](https://pubmed.ncbi.nlm.nih.gov/12231287/). A 2020 prospective study measured planned versus achieved tooth movements in 38 patients and reported movement-dependent accuracy [S13](https://pubmed.ncbi.nlm.nih.gov/32620479/). These are historical, scoped findings—not estimates of current product accuracy or proof that Trabecular improves outcomes.

**Proposed change:** retain orthodontics as its own horizon. Separate (a) appliance force/moment and immediate mechanical-response comparisons from (b) staged biological movement, refinement reduction and root-resorption prediction. Define required root/PDL geometry, appliance material/contact behavior, calibration and outcome evidence for each claim. A synthetic 0.25 mm shell establishes an assumed geometry, not measured PDL or validated tooth movement.

**Closure:** demonstrate an incremental mechanical advantage against relevant alternatives; require separately held-out longitudinal evidence before promising treatment improvements. **High confidence** in the need to separate claims; product opportunity remains **unresolved**.

### R11 — Keep H4; calibrate time and correctly use the FEops precedent

**Location:** detailed spec §3.3 remodeling; master spec H4.

**Evidence:** Huiskes et al. (1987) explicitly state on printed p.1137 / PDF p.3 that their remodeling-rate constants were assigned arbitrary values, restricting the interpretation of time [S14](https://ris.utwente.nl/ws/portalfiles/portal/6561771/Huiskes87adaptive.pdf). That historical statement does not establish today's parameters are unknowable; it shows why copying the equation does not calibrate “virtual months.” FDA granted FEops HEARTguide De Novo DEN200030 on September 8, 2021 [S15](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/denovo.cfm?id=DEN200030); its review includes clinical-data validation [S16](https://www.accessdata.fda.gov/cdrh_docs/reviews/DEN200030.pdf). The 2025 K250635 indication is specifically LAAO implantation simulation [S17](https://www.accessdata.fda.gov/cdrh_docs/pdf25/K250635.pdf).

**Proposed change:** keep remodeling/clinical prediction as a research-to-product horizon with explicit longitudinal data rights, calibrated parameters, uncertainty, holdouts and a defined claim. Describe FEops as a **corroborated, use-specific precedent**, not a transferable clearance or exit blueprint.

**Closure:** predictive accuracy over meaningful time/outcome horizons is established for our context. **High confidence** in the evidence distinction; eventual feasibility and pathway **unresolved**.

### R12 — Replace geometry guarantees with a contract

**Location:** master spec layer 2; original MVP “crash-proof”; [Analysis.md](Analysis.md) “zero-failure” and 200 ms claims.

**Evidence:** level-set/unfitted representation is well established [S02](https://doi.org/10.1002/nme.4823). It does not, as a matter of geometry, uniquely determine the intended closed anatomy from every ambiguous/open input. Min/max CSG may preserve a desired boundary without preserving exact distance everywhere. No supplied artifact proves arbitrary-input or universal timing guarantees. **Unresolved/unsupported**, high confidence in lack of evidence; not proof that all such inputs fail.

**Proposed change:** define supported surfaces, sign/interior policy, geometry tolerances, minimum features/gaps, reinitialization if needed, failure detection and rejection/review messages. Keep real anatomy as the source rather than assuming mathematical primitives reproduce it.

**Closure:** analytic/known-geometry fixtures and representative difficult inputs meet a declared error budget. Stress or material parameters must not compensate for silently altered geometry.

### R13 — Correct resolution and DOF arithmetic

**Location:** original MVP grid bounds/material labeling; master spec §5.

**Evidence/calculation:** the original bounds span 130 × 100 × 80 mm. Dividing each axis into 96 cells gives approximately **1.354 × 1.042 × 0.833 mm** cells. A 1.5 mm plate normal to an axis spans about **1.11–1.80 cells**; a 0.25 mm shell **0.18–0.30 cells**. Orientation changes the relationship. This is a scale warning, not a measured error percentage. An ordinary full Q1 vector space has `3 × 97³ = 2,738,019` DOFs at 96³ cells, and `3 × 129³ = 6,440,067` at 128³—not ~750k. Active compaction or another space must be specified separately. **Corroborated mathematical correction, high confidence under stated assumptions.**

**Proposed change:** choose geometry sampling, integration accuracy, approximation order and local resolution from thin-feature studies. Remove unconditional memory/accuracy estimates until measured. No universal cell-count heuristic substitutes for convergence.

**Closure:** declared displacement/energy/stress quantities are stable under refinement and grid-position changes at a useful resource cost.

### R14 — Specify interfaces and stabilization

**Location:** project specs' ersatz void floor, shared grid and CutFEM upgrade.

**Evidence:** CutFEM research discusses small cut intersections and stabilization [S02](https://doi.org/10.1002/nme.4823), §3. A positive local stiffness floor does not remove unconstrained global rigid-body motion by itself. Shared displacement unknowns or nonzero exterior material can also couple regions that are intended to be separate. These are formulation risks, not a finding that a completed SDF jaw solver has failed.

**Proposed change:** specify independent bodies, intended ties/contact exclusions, load/support enforcement, cut integration, conditioning strategy and sensitivity checks. Treat a void floor as a modeling/numerical choice whose effects must be bounded, not a guarantee of accuracy or stability.

**Closure:** gap/interface fixtures, rigid-motion tests and parameter sensitivities meet predeclared criteria. **High confidence** in the need for a formulation; the preferred implementation is a **design decision** requiring future evidence.

### R15 — Correct constitutive and failure-mode claims

**Location:** detailed spec §3.3 “linear (or Neo-Hookean)” and domain failure-mode table; master spec safety-factor policy.

**Evidence:** the detailed spec writes `sigma = lambda tr(epsilon) I + 2 mu epsilon`, a linear elastic law. This is not a complete Neo-Hookean large-deformation formulation. A static yield comparison contains no cyclic loading/fatigue law, interface-damage law, or biological adaptation calibration. This follows from the equations actually specified. The retained jaw report also identifies absent contact and unvalidated physical assumptions [L02](../docs/verification/CALCULATION_RELIABILITY.md).

**Proposed change:** list each supported equation/physical mechanism and its output. Treat yield factor 880 MPa/1.8, bone strain 3,000 microstrain and nerve buffers as declared assumptions or context-specific criteria until justified. Retain fatigue, pullout, subsidence and biological objectives as capability goals requiring appropriate models/evidence.

**Closure:** no output claims a failure mechanism the model does not represent. **High confidence** in the equation mismatch; no universal replacement clinical thresholds proposed here.

### R16 — Separate visualization from numerical evidence

**Location:** original MVP §3 module 2; master spec surface-stress projection.

**Evidence:** Gaussian filtering changes the displayed field; it does not add missing displacement approximation or correct boundary integration. The [approved plan §§2.C and 4](MVP_Revised_Plan.md) already requires material-aware recovery and preserving unsmoothed extrema. **Contradicted, high confidence** if smoothing is described as numerically fixing an unresolved plate.

**Proposed change:** keep optional display interpolation with a visible legend/method, raw extrema/locations and predetermined assessment-region quantities. Avoid interpolation across unrelated materials or bodies. Use a common physical scale for comparisons.

**Closure:** every report quantity traces to the declared calculation/recovery rule, and rendering choices cannot change pass/fail.

### R17 — Validate derivatives and final candidates

**Location:** master spec layer 4; detailed spec optimization and `wp.Tape`.

**Evidence:** a binary cell-center material label is piecewise constant as geometry changes, so differentiating the executed label assignments does not automatically produce a useful shape derivative. Smoothing changes that discrete model and needs its own checks. The [approved MVP §2.E](MVP_Revised_Plan.md) already allows bounded discrete search. **Unresolved** for valid shape gradients; **high confidence** that an autodiff API alone is insufficient.

**Proposed change:** keep closed-loop remediation as a pillar. Use a bounded search where appropriate, or validate the actual shape derivative against independent perturbations before claiming gradient optimization. Confirm a chosen candidate at accepted fidelity over the declared scenario set; preserve failed/infeasible/unresolved outcomes.

**Closure:** derivatives/replays and final-candidate evidence support the claimed improvement. Do not preselect a passing design or optimize solely against an unqualified screening model.

### R18 — Keep and qualify the tetrahedral reference/checker

**Location:** approved MVP numerical gates; saved calculation report; primary/reference architecture.

**Evidence:** the report records useful known-answer and independently reconstructed calculation checks, but leaves **mesh convergence unverified and qualification false** [L02](../docs/verification/CALCULATION_RELIABILITY.md). Its exact-tie runs report female 4,526.20 MPa/8.06 mm and male 14,666.17 MPa/12.07 mm. Those are saved linear-model outputs, not measurements or validated post-yield predictions. **Partly corroborated** for calculation consistency; **contradicted** for full qualification.

**Proposed change:** retain the tetrahedral work and archives. Finish its declared refinement/applicability checks only after runs resume. Distinguish separate recovery/force audits, independent solver comparison, calculation verification and experimental validation. A shared-model agreement may share wrong assumptions.

**Closure:** reference quality is adequate for each comparison, disagreements are investigated, and both methods retain explicit limitations. Do not label the checker ground truth merely because it is conforming.

### R19 — Measure performance and cost fairly

**Location:** executive pitch; master spec §5; detailed spec seven-day and 90-day targets.

**Evidence:** no supplied benchmark establishes 2–6 seconds, 100× speed, 1.4 GB VRAM or the stated cohort cost at matched accuracy. Saved application analysis times of 76.5 and 170.9 seconds apply to the present tetrahedral jobs, not the proposed SDF route [L02](../docs/verification/CALCULATION_RELIABILITY.md). Modal publishes separate GPU/CPU/memory rates [S18](https://modal.com/pricing). **Unresolved** as future performance; incorrect if represented as demonstrated capability.

**Proposed change:** report geometry/preparation, compilation/cold start, meshing/integration, assembly, preconditioning, solve, recovery, export, manual intervention, failures and memory. Compare the same physical question at matched declared error, with caches and hardware labeled. Separate hands-on effort from elapsed time.

**Cost illustration, not a run:** using published A10 $0.000306/s, CPU $0.0000131/core/s and RAM $0.00000222/GiB/s, a hypothetical 600-second job with 4 physical cores and 32 GiB costs `600 × (0.000306 + 4×0.0000131 + 32×0.00000222) = $0.257664` before extra time/charges. One hundred such jobs would be ~$25.77. This neither disproves <$2 at a faster measured workload nor validates it. Preserve the $30 owner ceiling; no cloud execution is authorized here.

### R20 — Use precise regulatory/evidence language

**Location:** stage-1 posture, “510(k) envelope,” V&V report and clinical sign-off descriptions.

**Evidence:** FDA's 2023 guidance ties credibility to a defined context and risk [S07](https://www.fda.gov/media/154985/download). FDA's intended-use navigator considers product function and intended use [S19](https://www.fda.gov/medical-devices/digital-health-center-excellence/step-1-software-function-intended-medical-purpose). AM guidance distinguishes patient-matched devices from automatic custom-device exemption [S08](https://www.fda.gov/media/97633/download). **Unsupported** for blanket exemption, compliance or guaranteed acceptance.

**Proposed change:** preserve the engineering-tool entry strategy, with specific functions/claims and a launch-country assessment. Label reports as engineering evidence supporting a context-specific review; expose missing evidence. Clinical planning and later outcome prediction get separately assessed intended uses.

**Closure:** language and actual functions agree. This review uses US sources because the specs invoke FDA; it does not conclude which pathway applies in an unspecified launch country.

### R21 — Preserve the UI/Deepgram direction and truthful states

**Location:** original MVP scripted 512→184 MPa, 100% pass-rate and fixed report examples; old Bolna references.

**Evidence:** user corrections and [approved plan §§2.G–I](MVP_Revised_Plan.md) choose Deepgram and real, revision-bound actions. Existing report values differ from the original scripted example. Installed SDKs/source adapters do not establish a live provider session. **Corroborated** for provider/design intent; **unresolved** for live service acceptance in reviewed records.

**Proposed change:** keep modern dark/black glass, the large anatomy canvas and co-pilot. Label illustrative fixtures as examples; calculate real before/after values and study denominators. Show execution, numerical quality, applicability and freshness separately. Voice uses the same validated actions as controls and reads structured evidence; it cannot announce an unearned pass.

**Closure:** actual provider and workflow acceptance later, without claiming local speech fallback or cached data as live Deepgram/GPU execution.

### R22 — Make moat plans concrete without claiming assets already owned

**Location:** master spec §7.2 three moats: credibility library, anatomy cohorts, design-to-physics telemetry.

**Evidence:** reviewed materials do not establish a proprietary representative cohort, customer data reuse rights, trained surrogate advantage or accepted customer qualification package. The two public subjects have public provenance [S09](https://huggingface.co/datasets/BoneHub/visible-human-3d-models/blob/3817c725e2d7e873a225f6cfa76c8bdf6989c0d3/README.md). Existing implicit and medical simulation offerings challenge exclusivity: [S01](https://intact-solutions.com/closing-the-simulation-gap-for-implicit-design/), [S05](https://simq.de/en/simulation-services/). **Unresolved** as owned moats, not disproven as acquisition opportunities.

**Proposed change:** retain the three moat directions, but specify the asset, source, permission/exclusivity, curation/labeling cost, measured advantage, and replication barrier. Prioritize paired simulation/test evidence for H1/H2; anatomy/response coverage for H2; licensed treatment/outcome data for H3/H4. Separate access, audit retention, redistribution and cross-customer learning permissions.

**Closure:** rights-cleared assets demonstrably improve held-out performance or repeated customer delivery. A generated PDF, public anatomy collection or generic optimization log is not automatically a moat.

### R23 — Validate each horizon's commercial assumptions

**Location:** master spec §6 prices and time horizons; named partnerships/pilot targets.

**Evidence:** the specs contain proposed prices ($75–200/case; $2,500/month; $50k–150k/year; $5–20 orthodontic case), not contracts or price research. No paid-demand evidence was located in the materials reviewed. Public competitor activity supports the existence of categories, not our access or willingness to pay. **Unresolved**; no conclusion that demand is absent.

**Proposed change:** keep horizon-specific customer hypotheses. For H1 examine VSP/CAD/reconstruction decisions and per-case recurrence; H2 examine device-study budgets and accepted evidence; H3 examine appliance workflow/distribution and marginal value; H4 examine longitudinal evidence, product claims and payer/OEM incentives. Label prices and timelines as hypotheses. Do not replace them with equally unvalidated manufacturer-pilot prices as settled strategy.

**Closure:** observed workflows, a named user/buyer, lawful inputs, a defined paid trial and repeated use support each selected entry/expansion. No outreach or partnership is authorized or claimed by this review.

### R24 — Reconcile deadline and definition of done

**Location:** [approved plan §§5 and 9](MVP_Revised_Plan.md), completion target before October 31.

**Evidence:** the last saved reliability record leaves qualification incomplete; the owner paused further checks. Therefore completion of the full acceptance set is **not established**. That is a present evidence/status finding, not proof of what can or cannot happen by a future date.

**Proposed change:** maintain a requirement-by-requirement status: delivered, demonstrated, unresolved, blocked/pending input, or explicitly deferred by the owner. Keep the existing deadline as the requirement until changed. If a prototype-only submission is proposed, record it as an owner decision rather than silently redefining the MVP.

**Closure:** acceptance evidence or an explicit approved scope/deadline change. No new commitment or resumption is made here.

### R25 — Resolve relevant dependency rights

**Location:** [current requirements](../backend/requirements.txt), [tetrahedral mesher](../backend/volume_mesh.py), [CAD triangulation](../backend/contoured_cad_v5.py); contemplated MeshLib stack.

**Evidence:** TetGen and Triangle are present in actual source/dependencies. WIAS publishes AGPL/commercial options [S20](https://www.wias-berlin.de/software/tetgen/FAQ-license.jsp?lang=0); Triangle's author states commercial inclusion restrictions [S21](https://www.cs.cmu.edu/afs/cs/project/quake/public/www/triangle.html); MeshLib lists commercial/noncommercial license options [S22](https://meshlib.io/license/). **Corroborated** for published terms and local presence; legal applicability to the exact build/use remains **unresolved**.

**Proposed change:** inventory bundled versions, wrapper versus underlying terms, service/distribution use, and reference-tool permissions. Choose a documented license/compliance or replacement path before commercial use where required. Preserve the reference implementation and evidence while resolving rights; do not delete it as a shortcut.

**Closure:** applicable permissions and notices are established. No infringement finding, purchase, legal opinion or complete dependency audit is implied.

### R26 — Maintain a claim/evidence register

**Location:** all five original documents, future pitch/UI/report material, and any proposed revision pack.

**Evidence:** old sources conflict on provider, current solver, grid size/DOFs, cohort counts and acceptance. [Analysis.md](Analysis.md) contains placeholder citations rather than traceable source links. The owner has also explicitly rejected treating a narrow recommendation as an approved pivot. **Corroborated** documentation-governance issue.

**Proposed change:** each material claim records wording, source/date, source relationship, status, context, implementation version, owner and promotion gate. Label original intent, approved scope, implementation evidence and unapproved options separately. Keep one agreed platform description across all horizons.

**Closure:** a claim cannot become “implemented,” “validated,” “partnered,” or “approved” just through repetition in another document. This file is a proposal list; the original specifications remain unchanged.

## 5. Evidence ledger

All web entries below were opened/read on **October 29, 2026**, except the explicitly dated prior-review links in R05. Publication dates are distinguished from access dates. Original-study abstracts are identified where full text was not inspected. Vendor pages establish published offerings/claims, not independent runtime performance or regulatory acceptance.

| ID | Claim / evidence and direct source | Publication / source relationship | Assessment | Gap or limit |
|---|---|---|---|---|
| S01 | [Intact implicit analysis and design loops](https://intact-solutions.com/closing-the-simulation-gap-for-implicit-design/), §§2,4 | Sep 1, 2026; competitor technical article | Contradicts broad uniqueness | No matched CMF comparison or independent replication |
| S02 | [CutFEM](https://doi.org/10.1002/nme.4823), introduction and §3 | Online Dec 29, 2014; 2015 journal article; original research | Corroborates method prior art and formulation issues | Does not qualify our implementation or settle IP rights |
| S03 | [optiSLang overview](https://ansyshelp.ansys.com/public/Views/Secured/corp/v252/en/opti_ug/opti_ug_overview.html) | 2025 R2; vendor documentation | Contradicts manual/passive-only landscape | Customer's installed/usable automation unknown |
| S04 | [Meticuly K210099](https://www.accessdata.fda.gov/cdrh_docs/pdf21/K210099.pdf), PDF p.9 | Dec 21, 2021 decision; FDA-hosted manufacturer summary | Corroborates FEA and mechanical testing for that device | Ownership/automation/current buying need not established |
| S05 | [Simq service capabilities](https://simq.de/en/simulation-services/), family testing/cohort sections | Undated current page; vendor | Published offering contradicts blanket lack-of-cohort claim | Performance, scope equivalence and customer claims not independently audited |
| S06 | [v-Patients](https://www.v-patients.com/), intro/studies | Undated; vendor | Corroborates published virtual-study offering | No inference that its strongest regulatory claims are independently true |
| S07 | [FDA credibility guidance](https://www.fda.gov/media/154985/download), §§V–VI | Nov 17, 2023; regulator | Corroborates context/risk-based assessment | Not a tool approval or a checklist giving automatic acceptance |
| S08 | [FDA additive-manufacturing guidance](https://www.fda.gov/media/97633/download), §V.B | Dec 5, 2017; accessed copy includes QMSR cover update; regulator | Supports envelope/PMD distinctions | Device-specific adequacy not determined |
| S09 | [BoneHub versioned card](https://huggingface.co/datasets/BoneHub/visible-human-3d-models/blob/3817c725e2d7e873a225f6cfa76c8bdf6989c0d3/README.md), subjects/provenance/license | Version 3817c72, exact publication date not established; dataset publisher | Two reference subjects and CC BY 4.0 are published | Not population coverage or proprietary mechanical labels |
| S10 | [ArchForm software](https://www.archform.com/software) | Undated current page; vendor | Staging/attachment functionality self-reported | No conclusion about its unpublished physics or interest in us |
| S11 | [Align G8 announcement](https://investor.aligntech.com/news-releases/news-release-details/align-technology-announces-invisalign-g8-new-smartforce) | Oct 21, 2020; manufacturer | Corroborates prior biomechanics-based product positioning | Not independent proof of treatment performance or current feature limits |
| S12 | [Toms et al., human PDL](https://pubmed.ncbi.nlm.nih.gov/12231287/), abstract | Oct 2002; original experimental study, abstract inspected | Supports nonlinear/time-dependent constitutive concern | Cadaveric test context; not universal patient parameters or a clinical outcome model |
| S13 | [Haouili et al., prospective study](https://pubmed.ncbi.nlm.nih.gov/32620479/), abstract | Sep 2020; original 38-patient study, abstract inspected | Supports need to distinguish planned/achieved movement | Historical sample; not current market-wide accuracy or our improvement |
| S14 | [Huiskes et al.](https://ris.utwente.nl/ws/portalfiles/portal/6561771/Huiskes87adaptive.pdf), printed p.1137 | 1987; original research, relevant full-text passage inspected | Supports the time-calibration distinction | Historical model limitations cannot be generalized to all modern models |
| S15 | [FEops DEN200030 entry](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/denovo.cfm?id=DEN200030) | Decision Sep 8, 2021; FDA database | De Novo precedent corroborated | Does not establish our classification or market viability |
| S16 | [FEops De Novo review](https://www.accessdata.fda.gov/cdrh_docs/reviews/DEN200030.pdf), indications, clinical validation, special controls | 2021 decision record; regulator | Corroborates use-specific clinical evidence requirements in that record | Cardiovascular product context, not an applicable rule for every Trabecular function |
| S17 | [FEops K250635](https://www.accessdata.fda.gov/cdrh_docs/pdf25/K250635.pdf), PDF p.4 | Nov 25, 2025; FDA-hosted clearance/indications | Corroborates a specific current-generation simulation indication | Not generalized skeletal remodeling or proof of improved patient outcomes |
| S18 | [Modal pricing](https://modal.com/pricing), resource costs/Starter | Undated current rates; provider | Corroborates rate inputs | Account balance, measured runtime and final bill not checked |
| S19 | [FDA intended-use navigator](https://www.fda.gov/medical-devices/digital-health-center-excellence/step-1-software-function-intended-medical-purpose) | Undated current page; regulator | Supports function/intended-use distinction | Launch jurisdiction and classification remain unknown |
| S20 | [TetGen terms](https://www.wias-berlin.de/software/tetgen/FAQ-license.jsp?lang=0) | Undated; rights holder | AGPL/commercial options published | Exact bundled version/use applicability not legally determined |
| S21 | [Triangle terms](https://www.cs.cmu.edu/afs/cs/project/quake/public/www/triangle.html) | Author page describes v1.6 (2005); rights holder | Commercial inclusion restriction published | Wrapper/bundled-code and intended-use review outstanding |
| S22 | [MeshLib license options](https://meshlib.io/license/) | Undated current page; rights holder | Commercial/noncommercial distinction published | No license selected, quote obtained or full terms audit |
| L01 | [Original master](Project_Spec.md), [detailed spec](Project_Spec_detailed.md), [original MVP](MVP_Spec.md), [approved expanded MVP](MVP_Revised_Plan.md), [earlier analysis](Analysis.md) | Local supplied planning material; read across this review and the preceding review | Establish intent and contradictions | Planning is not delivery or third-party confirmation |
| L02 | [Saved reliability report](../docs/verification/CALCULATION_RELIABILITY.md), [application artifacts](../docs/verification/production-exact-jobs.json) | Oct 28, 2026 retained internal records | Partly corroborates recorded calculations/checks; explicitly unqualified | Not rerun or independently physically validated here |
| L03 | [Meshing](../backend/volume_mesh.py), [FEM](../backend/mixed_fem.py), [requirements](../backend/requirements.txt), [CAD](../backend/contoured_cad_v5.py) | Source inspected read-only; internal implementation | Establishes automatic tetrahedral route and selected dependencies | Static inspection does not establish all runtime behavior/security |

## 6. Prioritized risks and evidence that would change the assessment

| Risk | Severity | Confidence in finding | Highest-value missing evidence |
|---|---|---|---|
| Unsupported mechanical/clinical conclusions | Critical if used consequentially | High that qualification is incomplete; eventual performance unknown | Appropriate numerical and empirical evidence for a specific question |
| SDF benefits disappear at required accuracy | High | Medium feasibility concern; high that advantage is unmeasured | Matched-error workflow benchmark on realistic geometry changes |
| Platform horizons mistaken for interchangeable physics | High | High from equation/claim comparison | Capability and validation matrix, then demonstrated transfer |
| Competition undermines claimed differentiation | High | High for published overlap; no independent feature parity claim | Specific unmet workflow and measured improvement versus its actual alternatives |
| Buyer/distribution/pricing assumptions are wrong | High | High that evidence is not supplied; demand itself unresolved | Horizon-specific customer projects, budgets and paid repeat use |
| Data/moat assets cannot legally or practically accumulate | High | High that rights/assets are unestablished | Partner agreements, paired evidence and demonstrated reusable value |
| Dependency permissions incompatible with planned release | High before commercial delivery | High on published terms/local presence; legal applicability unresolved | Exact version/use review and documented permission/compliance decision |
| Schedule pressure hides open gates or changes identity | High | High from retained status and framing correction | Explicit acceptance/status and owner decisions |

**Proceed conditionally:** strengthen the original platform by validating its shared foundation and its intended H1 workflow, while maintaining separate gates for later horizons. Do not require a pivot as the conclusion of this review. If a later study supports a different entry point, present the evidence and alternatives explicitly to the owner.

## 7. Coverage limits and research log

The review focused on original specifications and claim-changing evidence: implicit simulation and automation; named manufacturer FEA; cohort offerings; orthodontic product prior art and original mechanical/clinical studies; original remodeling time assumptions; FDA modeling, patient-matched devices, intended use and FEops precedent; selected dependency rights; anatomy provenance; and cloud rates.

Queries used official vendor/regulator domains and exact study titles, including “finite element,” “virtual patient cohorts,” “ArchForm staging,” “human periodontal ligament viscoelastic,” “Huiskes adaptive bone-remodeling,” and “FEops De Novo.” Underlying pages and relevant passages were read; search snippets alone were not treated as decisive evidence. Vendor claims were not independently benchmarked.

Virtonomy's detailed methods page timed out on October 29, so this review uses its accessible v-Patients product page and Simq's accessible cohort description. One Huiskes PDF URL timed out; the university's alternate full-text URL succeeded. Some original-study full texts were unavailable; S12/S13 conclusions are restricted to the inspected abstracts. No paywalled ASME standard was inspected and no compliance audit is claimed.

No evidence of signed Trabecular customers, revenue, partnerships, exclusive datasets, patent protection or regulatory authorization was located **in the supplied materials and sources checked**. Missing evidence is unresolved, not proof of absence. No entity registry/litigation search was attributed to an unidentified company. Founder credentials, finances, jurisdiction-specific permissions, security, full dependency licensing, formal patent/FTO and clinical validation remain outside this review's completed coverage.

Only this proposed-revisions document and its navigation pointer were added/updated for the present task. Original project specs and implementation were not edited. The owner can approve, reject or amend individual R-items; none becomes implementation authorization through inclusion here.
