# YC-style company brief and conditional roadmap

**Framing correction, October 29:** the narrow company description and roadmap below are not the approved project framing and should not be used as its settled pitch. They require revision against the original multi-horizon platform. See [the correction](FRAMING_CORRECTION.md).

**October 28, 2026. Proposed positioning, not a submitted application or claim of YC endorsement.** The business and moat hypotheses are unvalidated. Implementation remains paused. This brief distinguishes the company we propose building from what exists today.

## 1. The idea in one sentence

**Trabecular helps implant engineers evaluate design changes and produce reproducible mechanical evidence, using SDF-based immersed analysis to reduce repeated geometry preparation.**

The “using” clause describes the intended technical direction. Current demonstrations must say the full-jaw implementation is tetrahedral and the immersed route is proposed, not imply delivery of the latter.

## 2. Company description for a future application

We are building an engineering evaluation workspace for implant manufacturers, starting with a bounded fixation-device family. When a design changes, engineers need to preserve geometry, loading, material assumptions, comparisons, and evidence across another round of review. Our hypothesis is that this repeated workflow remains costly even where capable simulation tools already exist.

Trabecular will connect the design revision to its mechanical protocol, results, numerical evidence, and limitations. We intend to develop SDF-based immersed analysis so geometry changes can be evaluated without repeated body-fitted remeshing, while retaining a separately qualified tetrahedral route for comparison. The product should be able to report an unresolved model or infeasible design, rather than force a pass.

Today we have an early engineering application and retained tetrahedral calculations on two public reference anatomies. Some elementary and independent calculation checks passed; mesh convergence and physical validation remain open. We have not established a production immersed jaw solver, paid demand, or proprietary validation data in the evidence reviewed here.

Our next proof is one customer-defined design-change workflow, a credible independent benchmark, and a paid repeat evaluation. If those work, the durable assets would be rights-cleared paired test/simulation evidence, qualified family-specific protocols, and integration into recurring engineering reviews. Expansion would follow demonstrated applicability to adjacent device families.

This wording deliberately leaves founders, traction, incorporation, funding, and customers unspecified because those facts were not supplied. Fill them with verified facts before external use.

## 3. Questions an investor or cofounder will press

| Question | Honest current answer | Evidence that improves it |
|---|---|---|
| Who urgently wants this? | Proposed manufacturer engineering buyer; demand unresolved | Observed recent projects, named budget owner, paid commitment |
| Why is it better than their current tools? | Proposed lower repeated preparation/review effort | Error-matched workflow comparison against competent alternatives |
| Isn't implicit FEA already available? | Yes; see diligence. The method alone is not the business moat | A useful vertical workflow and acquired evidence competitors cannot instantly reproduce |
| Why write another solver? | Only justified if it materially improves the selected workflow | Technical spike and benchmark; otherwise explicit integration/pivot decision |
| What is proprietary? | No established exclusive asset identified in reviewed evidence | Specific reusable rights, curated paired evidence, tested numerical know-how |
| Is this clinically validated? | No | A separately defined clinical claim and adequate future evidence, if pursued |
| Can you sell without replacing the incumbent? | Proposed coexistence via reviewable outputs/reference comparisons | Customer acceptance of the integration and purchasing model |
| Is this a venture-scale market? | Unproven; a niche may be a useful smaller business | Bottom-up account model and demonstrated expansion inside/across customers |
| Can the team execute the science and sales? | Founder expertise/access not established here | Relevant demonstrated work and committed domain/testing support |
| What has been built? | Real early app, tetrahedral calculations, tests/reports as recorded | Precisely labeled live demonstration and reproducible artifacts |

## 4. Why now — without invented inevitability

The method foundations are not new. Current implicit-analysis products, programmable workflows, and metered GPU access make this a practical time to test a narrower product, but they also increase competition. Regulatory interest in computational evidence is a reason to be disciplined about context and credibility, not proof that customers must adopt us.

The opportunity hypothesis is that an accessible manufacturer still lacks a reliable, low-effort way to handle a particular recurring design change. “Why now” becomes convincing when a real buyer names a current trigger: personalization volume, a process revision, repeated review rework, or an impending test campaign. None has yet been established for this project. Relevant external evidence is indexed in [E01–E17 and E24](EVIDENCE_LEDGER.md).

## 5. The demo story we should earn

An engineer opens a frozen baseline, shows the setup and supported question, changes one meaningful design parameter, and starts a real calculation. The product identifies the actual numerical method and evidence state. The engineer compares baseline and candidate on common scales, inspects the independent comparison, sees unresolved issues if present, and exports the traceable package.

The governing result need not pass. A useful demonstration might show that a seemingly beneficial change is unresolved or transfers load in an undesirable way. The product's value is a trustworthy comparison and less repeated effort, not a scripted green implant.

Deepgram may explain the structured findings and guide the camera once its live integration works. It does not generate numerical truth, and the company should remain understandable with the microphone muted.

## 6. Conditional roadmap

Dates below are planning horizons **after explicit resumption**, not commitments that scientific/customer dependencies will finish on a calendar. No work is automatically resumed by this document.

| Horizon | Objective and work | Evidence to exit | Owner/dependency |
|---|---|---|---|
| Now, before more engineering | Review this reset; select wedge, intended-use boundary, and submission label; identify buyer/domain access | Explicit scope decisions; known contact/access/resource gaps | Founder/owner; no outreach sent here |
| Initial 1–2 weeks | Observe workflows, inspect lawful sample projects, agree a narrow mechanical question; conduct small method feasibility work only after runs resume | A repeated buyer problem; declared protocol; implementable immersed approach or documented failure | Founder + qualified reviewer; expertise/access to be secured |
| By roughly day 30 | Complete one bounded immersed/reference comparison and an end-to-end evidence workflow; obtain pilot commitment if value is credible | Numerical gates for that context, fair benchmark, named purchasing path | Engineering + reviewer + prospective buyer; sufficient compute and rights |
| By roughly day 60 | Deliver a scoped paid evaluation; obtain relevant measured comparator/applicability review where promised | Customer-reviewed package, measured delivery effort, honest conclusion | Customer engineering/quality and testing partner as needed |
| By roughly day 90 | Repeat a design change and attempt a second organization's similar workflow | Repeat payment/use, less manual work, reusable rights/evidence, documented conversion obstacles | Founder/sales + engineering; no assumption of instant procurement |
| Months 3–6 | Productize only the repeated work; stabilize model/protocol changes; deepen paired validation | Repeatable onboarding, sustainable delivery cost, accepted family scope | Domain/engineering/testing capacity and funding |
| Months 6–12 | Expand within qualified family/customer; test one adjacent family if justified | Measured retained use, rights-cleared evidence growth, independently assessed new-context applicability | Commercial and scientific gates, not just shared code |

If buyer access is slow or the numerical method requires more research, revise dates openly. Do not compensate by adding voice, body-region tabs, or synthetic cohorts and presenting them as the missing proof.

## 7. October 31 decision

The earlier approved plan required the full expanded MVP before October 31. Current records leave major gates open, and the owner paused calculations. This report cannot truthfully promise that scope complete by the deadline.

The recommended alternative is an **honestly labeled engineering prototype and evidence submission**, using existing work and clearly identifying the proposed SDF direction, unresolved convergence, and absent validation. It should not claim the expanded MVP or SDF solver is complete. The owner must accept this revised submission scope or choose another deadline/scope outcome. No event eligibility or submission rules were verified in this review.

## 8. Decisions requested before implementation resumes

1. **Customer wedge:** investigate manufacturer fixation design-change evaluation first, subject to actual access; use a testing-lab wedge if access is materially better.
2. **Architecture:** primary SDF/immersed development, tetrahedral reference retained and separately qualified; no silent replacement.
3. **First proof:** one controlled, meaningful mechanical question plus a reproducible baseline/candidate workflow before broad anatomy coverage.
4. **Priority change:** defer large cohorts, full-body physics, biological predictions, and extensive voice work until the core engineering proof. This changes parts of the prior expanded MVP proposal and requires owner agreement.
5. **Deadline:** accept an honest prototype submission for October 31, or explicitly revise the previous commitment differently.
6. **Access/resources:** establish domain reviewer, lawful data/testing access, launch country, and noncompute validation budget. The $30 monthly cloud ceiling remains.
7. **Resumption:** approve specific future work and lift the current pause before any new tests, simulations, deployments, or builds.

These decisions distinguish approval of an idea from evidence that it works. The next build should answer the biggest open question, not recreate the old feature list under new wording.

## 9. Crosswalk from the original specifications

| Original element | Revised treatment | Governing document |
|---|---|---|
| General full-body engine | Long-term software reuse; per-context model evidence required | Product spec; architecture |
| SDF differentiator | Primary technical hypothesis preserved; novelty/exclusivity claims removed | Strategy; architecture |
| Tetrahedral replacement | Retained as reference/checker with its own qualification | Architecture |
| Crash-proof geometry / unconditional stability | Supported-input contract, rejection paths, numerical evidence | Architecture |
| 96³ / 1.4 GB / sub-3 seconds | Unverified budgets replaced by accuracy/resource measurements | MVP; architecture |
| Predetermined 512 → 184 MPa pass story | Actual baseline/candidate outputs; failure/unresolved allowed | Product; MVP |
| Fixed clinical safety thresholds | Context-specific reviewed criteria and assumption provenance | Product; architecture |
| Autodiff optimization | Deferred until derivative evidence; bounded search first | MVP; architecture |
| Bolna | Deepgram retained as selected provider | Product; MVP |
| Full 18-scenario study | Conditional on canonical gates; two anatomies remain two | MVP |
| 500/1,000 patient cohort | Later rights/coverage/statistical and compute gates | Strategy; opportunity portfolio |
| 510(k) envelope / V&V compliance button | Engineering evidence package with context and limitations | Due diligence; product |
| Immediate full clinical VSP sign-off | Engineering exploration first; clinical product separately assessed | Product; due diligence |
| Claimed automatic enterprise market/prices | Buyer discovery, scoped paid pilot, explicit price hypotheses | Commercial validation |
| Existing moat claims | Candidate assets with acquisition plans, rights, proof and failure modes | Strategy and moats |
| Broad scope before October 31 | Owner decision on honest prototype submission; no false completion | This roadmap; MVP |
| UI refactor | Preserve dark glass principles; simplify workflow hierarchy | Product; existing design principles |

The five original files remain historical inputs. If this reset is approved, the revised product/MVP/architecture documents should govern future work, with actual status kept in the implementation record. Until then this is a reviewable proposal, not a retroactive rewrite of what was delivered.
