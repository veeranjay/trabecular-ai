# Trabecular — product, technical, and commercial due diligence

**Framing correction, October 29:** recommendations for a narrow first workflow below do not replace the original multi-horizon platform. See [the correction](FRAMING_CORRECTION.md). Competitive/numerical findings and recommended strategy are separate judgments.

**As of October 28, 2026.** Subject: the local Trab AI / Trabecular project and its supplied specifications. Decision: whether and how to continue development toward a defensible startup. This is an external-source and supplied-artifact assessment, conducted using the project-due-diligence skill. It is not a new runtime verification or a clinical/regulatory clearance.

## 1. Judgment

**The opportunity warrants a focused discovery and feasibility phase. The original positioning does not yet justify the proposed platform build.** There is useful implementation work and a plausible problem in repeated implant-engineering analysis. However, the specifications combine unproven speed, universality, numerical credibility, regulatory utility, and commercial demand into one story. Several supposed market gaps are directly contradicted by primary sources.

The strongest reason to continue is the possibility of reducing repeated engineering effort when geometry changes: preparation, analysis setup, failure review, comparison, and evidence assembly. The strongest reason to stop broad implementation is that neither customer willingness to pay nor a reliable SDF-based advantage has been established. Solving the latter without the former risks building a research solver with no distribution. Selling the former without reliable calculations risks producing persuasive but unusable evidence.

The recommendation is therefore conditional: investigate one buyer's repeated decision, retain SDF as the main technical hypothesis, keep tetrahedral FEM as a checker, and advance only through explicit evidence gates. There is no basis to claim a present moat, clinical usefulness, regulatory acceptance, or guaranteed venture-scale market.

## 2. Scope and evidence quality

All five files in `Spec/` were reviewed: the master and detailed project specifications, original MVP, approved expanded MVP, and earlier AI analysis. The implementation record, retained calculation-reliability report, dependency manifests, and selected source paths were inspected read-only. Existing reported test results were not rerun. Public research covered direct implicit-analysis competitors, medical simulation providers, incumbent automation, FDA guidance, method prior art, selected licensing terms, public anatomy provenance, and cloud prices.

No company registry investigation was attributed to Trabecular: no canonical legal entity, registration jurisdiction, founder identity, financing, or claimed incorporated business was supplied. Similarly named companies were not assumed related. No private customer financials, security audit, full patent search, full dependency audit, clinical study, or experimental validation was performed. Those omissions remain explicit gaps; they are not findings of wrongdoing.

Evidence levels throughout this pack:

- **Observed local evidence:** supplied files, source text, saved reports. Strong for what is recorded, weaker than independent replication for runtime claims.
- **Primary external evidence:** regulator documents, vendor documentation, rights-holder terms, original method research. Vendor pages establish published capabilities, not an independent performance comparison.
- **Analysis:** mathematical deductions, product judgments, and inferences identified as such.
- **Hypothesis:** buyer pain, prices, adoption, advantages, and moat acquisition plans that require testing.

The earlier `Analysis.md` contains an AI conversation with unresolved `[cite: 1]` placeholders and quantitative claims without usable underlying attribution. Its engineering concerns are leads worth assessing; its assurances are not corroboration.

## 3. Original claim versus evidence

| Material claim in the specs | Finding | Consequence |
|---|---|---|
| Nobody packages implicit analysis and automatic design iteration | Contradicted at the category level | Rebuild positioning around a narrower workflow and measured advantage |
| Legacy CAE cannot automate optimization or batches | Contradicted | Compare against a competent scripted incumbent workflow |
| Implant CAD businesses lack physics | Contradicted for at least one named target; unresolved for others | Discover actual gaps before proposing an API partnership |
| SDF makes all input geometry crash-proof | Unsupported guarantee | Define supported inputs, geometric tolerances, and rejection paths |
| A 96³ grid resolves thin hardware/tissues adequately | Not established; scale arithmetic exposes a problem | Qualify local resolution and integration before optimizing designs |
| A void stiffness floor guarantees a valid stable solve | Incorrect as a general guarantee | Address rigid modes, conditioning, artificial coupling, and interfaces explicitly |
| Gaussian filtering fixes numerical staircasing | Incorrect as an accuracy argument | Display treatment must remain separate from computed assessment quantities |
| Autodiff automatically supplies reliable CAD shape gradients | Not established | Validate derivatives of the actual discretization and optimizer |
| Three stiffness assumptions are population percentiles | Unsupported | Use low/central/high assumption labels until distributions are justified |
| Sampling many cases proves the true worst case | Unsupported | Report worst observed within a declared study and coverage limitations |
| A generated report establishes V&V 40/FDA compliance | Unsupported | Evidence can support a credibility assessment; it does not confer acceptance |
| Full-body expansion requires zero substantive solver/model work | Unsupported beyond shared infrastructure | Each new physical question needs model development and its own evidence |
| 2–6 seconds, 100× faster, <5% error | Unverified targets | Replace promises with a fair, end-to-end benchmark protocol |

Detailed source relationships and remaining gaps are in [the evidence ledger](EVIDENCE_LEDGER.md).

## 4. Competitive reality

**The most direct challenge is Intact + nTop.** Its September 2026 technical description covers analysis of native implicit geometry using an independent hexahedral grid, cut-domain integration, and programmatic design iteration. This is strong evidence against claiming the architectural combination as unique; it does not prove superior results on Trabecular's intended fixation problems. [Intact](https://intact-solutions.com/closing-the-simulation-gap-for-implicit-design/).

**Medical simulation competitors already sell versions of the proposed outcome.** Simq markets implant variant evaluation and support for selecting worst cases. Virtonomy describes cardiovascular virtual benchtop and population simulations. Different anatomy and model scope matter, but neither virtual testing nor virtual cohorts are empty categories. [Simq](https://simq.de/en/products-services/disciplines/implant-testing/), [Virtonomy](https://www.virtonomy.io/medical-simulations/).

**Incumbents are capable of automation.** Ansys documents workflow-driven optimization, uncertainty analysis, and calibration. Simpleware supports APIs and command-line batches; Materialise documents 3-matic scripting. Whether a particular customer has implemented these capabilities is a discovery question. [optiSLang documentation](https://ansyshelp.ansys.com/public/Views/Secured/corp/v252/en/opti_ug/opti_ug_overview.html), [Simpleware](https://ansys.synopsys.com/en-in/products/structures/ansys-simpleware), [3-matic tutorial](https://www.materialise.com/en/academy/healthcare/mimics-innovation-suite/video-tutorials/scripting-3-matic).

**Meticuly cannot be described as having no FEA.** Its FDA-hosted K210099 summary lists comparative FEA alongside mechanical testing (PDF page 9, summary page 6). This is evidence for one device's submission, not knowledge of its current internal software, ownership of a solver, or willingness to buy ours. CustoMED publishes an end-to-end personalized-surgery platform; its internal physics capabilities remain unresolved in the sources checked. [FDA record](https://www.accessdata.fda.gov/cdrh_docs/pdf21/K210099.pdf), [CustoMED](https://www.customed.ai/).

**A low-cost solver is also an alternative.** FEBio publishes nonlinear biomechanics functionality and a command-line workflow. Existing open software and engineering services constrain how much a generic analysis wrapper can charge. [FEBio](https://febio.org/).

The useful competitive question is consequently: *Which recurring engineering task remains expensive or unreliable even when the buyer already has a capable solver?* The answer might be change propagation, anatomical registration transfer, failed-run triage, uncertainty setup, or evidence reconciliation. It has not yet been discovered in customer work.

## 5. Technical feasibility: preserve the idea, correct the mechanics

### 5.1 What SDF actually contributes

A signed distance field represents geometry through distance to a boundary, with sign indicating inside/outside. An immersed solver then computes mechanics on a background discretization that does not fit that boundary. These are separate layers. Using SDFs for CAD while converting everything to tetrahedra for analysis does not establish an immersed-physics implementation.

The method family is established research. CutFEM explicitly addresses unfitted geometry, interface treatment, integration, and stability; it is not simply a material lookup on ordinary cells. Its published discussion identifies problems caused by very small cut-cell intersections. [Burman et al., 2015](https://doi.org/10.1002/nme.4823).

SDF operations are attractive for repeatable cuts, offsets, placement, and geometric constraints. They do not recover missing anatomy or ensure that an ambiguous open surface has the intended interior. Min/max combinations can represent the desired boundary without remaining exact Euclidean distance everywhere. Distance-dependent material shells, clearances, and quadrature therefore require their own error checks. These are mathematical/engineering assessments, not measured defects in an implemented SDF solver.

### 5.2 The resolution budget in the original MVP is not credible as written

Using the earlier analysis's illustrative 120 mm domain width, a 96-cell axis gives `120/96 = 1.25 mm` spacing. A 1.5 mm plate spans approximately `1.2` cells through its thickness; a 0.25 mm synthetic tissue spans `0.2` cells. These examples are derived scale checks, not new runs. Writing a thin shell's implicit equation does not establish that its deformation is resolved. Neither smooth rendering nor an assumed safety factor repairs that issue.

For a full Q1 vector displacement grid with 96 cells per axis, three components at 97³ nodes produce **2,738,019 DOFs** before constraints; at 128 cells, **6,440,067 DOFs**. The old ~750k total DOF estimate is inconsistent with this particular discretization. Active-domain compaction or another space may reduce the count, but must be specified and measured. No revised memory/runtime guarantee is inferred from these counts.

### 5.3 Interfaces and constitutive assumptions dominate credibility

A soft ersatz exterior can transmit forces across supposedly separate segments. Shared background unknowns can impose unintended continuity. Neither a positive diagonal block nor FP64 arithmetic guarantees a properly constrained, well-conditioned global problem. Cut integration, independent body fields, intended ties, support enforcement, and preconditioning need explicit treatment and sensitivity evidence.

The detailed spec calls its equation linear or Neo-Hookean while writing a linear-elastic stress law. Those are not interchangeable formulations. Static linear-elastic yield screening also does not establish fatigue life, screw pullout, loosening, remodeling, or clinical outcomes. Each demands additional physical assumptions and evidence. Bone compartments generated as offsets are assumptions rather than measured tissue architecture.

The retained exact-tie jaw runs report approximately **4,526 MPa / 8.06 mm** for the female reference and **14,666 MPa / 12.07 mm** for the male reference. These are saved model outputs, not observed tissue or device behavior. They far exceed the model's assumed 880 MPa yield threshold; they should trigger review of loading, geometry, support/interface assumptions, resolution, and applicability of linear elasticity. Do not interpret the magnitudes as accurate post-yield predictions or simply optimize until they turn green. [Local report](../../docs/verification/CALCULATION_RELIABILITY.md).

### 5.4 Optimization adds a second error channel

Binary cell-center material labels change discontinuously with shape. Automatic differentiation of the code does not automatically yield a useful, physically meaningful shape derivative. A smoothed material transition may permit derivatives but changes the problem and needs thickness/interface sensitivity checks. The old analysis's recommendation to add a smooth Heaviside is a possible technique, not a complete validation strategy.

An optimizer can exploit discretization error, unresolved interfaces, or surrogate error. Its final proposal needs replay at the accepted fidelity, the entire declared scenario set, and an independent comparison appropriate to the context. Gradient methods remain deferred until derivative checks pass. A bounded derivative-free search is the simpler first experiment, provided screening never becomes an unqualified final pass.

## 6. What the implementation actually establishes

The reviewed source identifies `jaw-exact-tet-v4`, Warp tetrahedral meshes, and explicit exact attachment elimination. A separate grid-based benchmark exists; it is not proof of a full SDF jaw solver. The application has real calculation and evidence plumbing rather than only the initial visual mock. The retained report records passing known-answer checks, independent reconstruction of forces/stresses/energy, and two completed application jobs. These are material positive findings.

The same record explicitly reports **qualification false**, failed original penalty sensitivity, unresolved mesh convergence due to RAM limits, and no physical/clinical validation. The exact attachment checks verify enforcement of the perfect-bonding assumption, not that bonding matches a real implant. The separate NumPy audit is valuable calculation corroboration; it is not a separately developed end-to-end solver or a physical experiment. The existing tetrahedral route is therefore a **candidate reference/checker still requiring qualification**, not ground truth.

Existing records report 60 backend tests, five frontend geometry tests, lint, and a build passing. Those are historical recorded checks, not new diligence results, and passing software tests does not settle model adequacy. Deepgram and Supabase integration scaffolding do not prove live provider operation; Modal execution remains unestablished. [Implementation record](../../IMPLEMENTATION.md), [calculation report](../../docs/verification/CALCULATION_RELIABILITY.md).

## 7. Regulatory and rights assessment

The proposed early boundary is manufacturer engineering exploration and comparison, with decisions made by qualified reviewers. That boundary needs to be reflected in features, reports, marketing, and actual use. Calling the product “CAE” while positioning it as a patient-specific surgical sign-off engineer is internally inconsistent. FDA's navigator ties assessment to intended use and function; a disclaimer alone does not settle status. The launch country remains unknown, so this review makes no jurisdiction-specific classification determination. [FDA intended-use guidance](https://www.fda.gov/medical-devices/digital-health-center-excellence/step-1-software-function-intended-medical-purpose).

FDA's 2023 modeling guidance uses a context-of-use and risk-informed credibility assessment. A beam test, solver agreement, convergence plot, and generated PDF are distinct pieces of evidence, not a universal acceptance badge. QMSR became effective February 2, 2026 and incorporates ISO 13485:2016; it does not automatically qualify this software. [Credibility guidance, especially sections V–VI](https://www.fda.gov/media/154985/download), [QMSR](https://www.fda.gov/medical-devices/postmarket-requirements-devices/quality-management-system-regulation-qmsr).

FDA's additive-manufacturing guidance discusses predefined patient-matched design/performance envelopes and distinguishes these devices from the statutory custom-device exemption. A sampled result table cannot independently establish that a design is inside a permissible envelope. [Guidance section V.B, PDF pages 12–13](https://www.fda.gov/media/97633/download).

Selected dependency risks are concrete. The current requirements include TetGen and Triangle; their underlying terms require attention independent of a wrapper's license. WIAS offers TetGen under AGPL/commercial alternatives, while Triangle's author states restrictions on inclusion in commercial products. MeshLib, contemplated in the specs, currently distinguishes commercial from noncommercial licensing. These are **unresolved release questions**, not a legal conclusion that a violation occurred. Preserve the tetrahedral reference, inventory exact versions and use, and settle licensing before distribution or hosted commercial use. [TetGen terms](https://www.wias-berlin.de/software/tetgen/FAQ-license.jsp?lang=0), [Triangle terms](https://www.cs.cmu.edu/afs/cs/project/quake/public/www/triangle.html), [MeshLib terms](https://meshlib.io/license/).

The BoneHub source card identifies two CT-derived subjects and a CC BY 4.0 license. That is useful public reference material, not proprietary cohort ownership or population coverage. Customer imaging, implant designs, mechanical tests, and outcomes will need separate permission and reuse terms. No rights to pool customer data or train across accounts are established. [Versioned dataset card](https://huggingface.co/datasets/BoneHub/visible-human-3d-models/blob/3817c725e2d7e873a225f6cfa76c8bdf6989c0d3/README.md).

## 8. Commercial and venture assessment

The old specifications name buyers and price tiers, but the reviewed materials do not establish interviews, paid pilots, recurring revenue, acquisition interest, or a budget owner. Publicly visible clinical demand for implants is not equivalent to demand for an additional engineering software subscription.

Routine patient-matched production may use a previously established workflow; per-case mechanical simulation could be an unnecessary cost. More plausible first triggers are a design-family change, a new manufacturing process, an unusual geometry, repeated reviewer rework, or a planned test campaign. These remain hypotheses until demonstrated with actual projects.

The venture question is also unresolved. A small CMF engineering niche can support a useful business without supporting venture-scale outcomes. Expansion must earn larger contracts or repeated usage in adjacent engineering processes. The FEops acquisition shows strategic interest in specialized predictive simulation; it does not establish a reproducible exit path, valuation, or easy transfer from jaw mechanics to cardiovascular planning. [Materialise's July 2024 announcement](https://www.materialise.com/en/news/press-releases/expanding-cardiovascular-capabilities-feops-acquisition).

The proposed business sequence is assisted paid evaluation → repeated design-family workflow → broader team adoption → additional independently qualified families. Detailed assumptions and gates appear in [commercial validation](COMMERCIAL_VALIDATION.md). Voice and visual polish may help adoption, but should not lead investment decisions until the engineering value is established.

## 9. Prioritized risks

Severity describes the consequence if unresolved; confidence describes evidence for the finding, not a numerical probability of failure.

| Risk | Severity | Confidence | Evidence / next decision-changing check |
|---|---|---|---|
| Incorrect engineering conclusions despite convincing visualization | Critical | High that qualification is incomplete | Finish declared reference/SDF verification and relevant experiment only after runs resume |
| No recurring buyer need or budget | High | High that supplied evidence does not establish it; demand itself unknown | Observe completed and upcoming projects with budget owners |
| Commodity feature combination / incumbent response | High | High for published overlap | Compare on a buyer-owned workflow with competent automation |
| SDF path cannot resolve thin hardware/interfaces at a useful cost | High | Medium on eventual feasibility; high on missing evidence | Error-matched benchmarks and memory/effort measurements |
| No access to rights-cleared physical data or testing | High | High that access is unestablished | Identify partner, protocol, costs, and contractual rights |
| Commercial dependency permissions unresolved | High | High for published terms; applicability needs review | Exact version/use inventory and license decision |
| Regulatory boundary drifts toward clinical recommendations | High | High on spec contradiction | Country-specific intended-use/function review |
| Services burden overwhelms subscription economics | High | Medium | Log hands-on work and repeat a second project |
| Deadline encourages unsupported claims or scope substitution | High | High given open gates | Explicit submission classification and owner-approved scope decision |
| Limited cloud allowance constrains experimentation | Medium | High | Prioritized bounded protocol; no live spending authorized here |

## 10. Proceed / change direction / stop

**Proceed to bounded discovery and feasibility** if there is access to a real engineering reviewer, a repeatable design-change problem, and a lawful validation path. Technical continuation should aim to demonstrate the SDF advantage, not assume it.

**Change direction explicitly** if customers pay for evidence/change automation but SDF offers no meaningful advantage. That would be a separate workflow business and requires an owner decision. It must not be described as delivery of the original SDF thesis.

**Stop the current business thesis** if repeated discovery shows no budgeted problem, customers cannot provide usable inputs, the reference assumptions cannot answer the intended decision, or the cost of credible validation exceeds a realistic funding/access plan. Better UI cannot repair those blockers.

The highest-value missing evidence is: one observed engineering workflow; one named paying decision-maker; one relevant reference model and physical comparison with reuse rights; and one fair benchmark showing a material improvement at the accepted accuracy. None requires pretending that a thousand-anatomy platform already exists.
