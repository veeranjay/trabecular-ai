# Strategy, positioning, and defensibility

**Framing correction, October 29:** this document's narrow positioning is an unapproved market-entry hypothesis. The original multi-horizon biomechanical platform remains the baseline; see [the correction](FRAMING_CORRECTION.md). Do not treat the proposed first workflow as the company's replacement identity.

**Proposed direction — October 28, 2026.** Customer access, expertise, and launch geography remain unknown. Recommendations below are hypotheses to test, not a claim of product-market fit.

## 1. The company we should try to build

**An engineering evaluation and evidence workspace for changing implant designs.** Start with one fixation-device family and one repeatable decision: a design changed; which scenarios need evaluation, what did the calculations show, what evidence is still missing, and can another engineer reproduce the comparison?

The long-term ambition is a reusable evidence foundation across qualified device families. The initial product must do a small version of that job exceptionally well. “Every bone in the body” is an expansion ambition, not the first product or proof that one model transfers everywhere.

The proposed technical advantage is an SDF-based representation and immersed analysis that reduces repeated geometry-to-analysis work. Its business value must appear as less hands-on preparation, fewer failed iterations, or cheaper trustworthy comparisons at a declared accuracy. A different numerical representation is valuable only if it improves that outcome.

## 2. First buyer and buying trigger

| Role | Proposed fit | What we must learn |
|---|---|---|
| Economic buyer | R&D/engineering head at a small or midsize fixation implant manufacturer | Budget, procurement path, recurring projects, internal versus outsourced analysis |
| Daily user | Simulation, design, or verification engineer | Current preparation/review work and accepted tools |
| Technical approver | Verification lead or qualified external biomechanical engineer | Required context, quantities, validation, and evidence format |
| Quality stakeholder | Quality/regulatory engineering | Review traceability and software-use requirements for this specific workflow |
| Potential channel | Testing lab, engineering service bureau, CAD platform | Whether it introduces repeatable customers or simply passes bespoke work downstream |

**First trigger:** a bounded design-family revision or test-campaign comparison. Example: an engineer changes bridge dimensions within an existing fixation assembly and needs a consistent comparison across declared fixtures and load cases. Early work may be a nonclinical benchtop fixture because its loads and measured quantities are easier to define than physiological patient loading. The customer chooses the meaningful decision; we do not invent a test just to favor the solver.

**Why this is preferable as the starting hypothesis:** the output has a named reviewer, a repeated artifact, and a potentially measurable labor cost. It also permits a narrow question before attempting clinical prediction. Whether it happens often enough to support a subscription is unresolved.

An initial reconstruction fixation family could have stronger engineering pain than routine BSSO miniplates, but it also introduces harder loading and fatigue questions. BSSO should remain the current technical demonstrator unless discovery and access justify a different commercial family. Do not label the current prepared cuts as clinician-reviewed anatomy.

## 3. The product's job

The promise to test is: **“A design change becomes a traceable engineering comparison without rebuilding the entire workflow by hand.”**

The workspace links the changed parameters, anatomy/fixture, registrations, loads, material assumptions, solver configuration, evaluation protocol, and report. It identifies stale evidence and reruns only what the declared dependency policy requires. A reviewer can inspect baseline/candidate differences and unresolved issues without reconstructing the history from screenshots and files.

The strongest proof would be a customer returning with a second change and asking to use the same workflow again. A beautiful first demonstration or a free letter of interest would be weaker evidence.

## 4. Competitive strategy

The [due diligence](DUE_DILIGENCE.md#4-competitive-reality) and [ledger E01–E10](EVIDENCE_LEDGER.md) document the capability overlap. There is no defensible “everyone else is manual” positioning.

| Alternative | Why a buyer might choose it | Our proposed opening | What would disprove the opening |
|---|---|---|---|
| Existing solver plus internal scripts | Trusted models, licenses, in-house skill, minimal vendor risk | Remove a specific recurring preparation/review burden | Existing scripts already solve it cheaply and reliably |
| Implicit-design/analysis stack | Geometry and simulation integration already available | A narrower fixation workflow with transferable evidence and qualified defaults | Equivalent workflow and validation are easier to obtain there |
| Specialized medical simulation vendor | Domain expertise, services, established evidence | Easier repeated change evaluation and integration for the selected buyer | Buyer prefers its domain model, service, or evidence at acceptable cost |
| Engineering consultant/testing lab | Outsourced expertise and responsibility | Productize the repeated work together | Every project remains unique and expert-heavy |
| CAD/personalization platform | Already owns upstream workflow and distribution | Be an embedded, reviewable engineering component | It builds equivalent functionality or has no unmet need |
| No additional simulation | Existing envelope/physical process is sufficient | Address a decision where analysis has demonstrated incremental value | The extra calculation does not change useful decisions |

We should coexist with the buyer's solver of record. “Trust us and replace your entire validation stack” is an expensive initial ask. Exportable models and evidence help a customer assess us; data hostage-taking is neither a product strategy nor a moat.

## 5. Differentiators to earn

These are proposed tests, not claims for the website today.

1. **Repeated geometry changes need less engineer intervention.** Compare complete workflows, including repair, registration transfer, integration, setup, failures, and review. Predefine the accuracy budget and representative edits.
2. **Every result knows what supports it.** Model assumptions and numerical/validation evidence remain attached to the exact input and version, including a clear “outside supported scope” outcome.
3. **A design change produces an explainable impact review.** Show affected loads, geometry, checks, and evidence dependencies, plus why anything was reused. Do not infer safe reuse solely from visual similarity.
4. **Candidate selection accounts for uncertainty and model limits.** Results can be infeasible or unresolved. An attractive nominal design is not automatically accepted.
5. **Independent comparison is part of the workflow.** A separate reference calculation helps expose model/discretization disagreements. Both routes need their own evidence.

A dark, clean glass interface improves comprehension. Deepgram makes navigation and explanation easier if users want it. Neither differentiates the underlying engineering result, and neither should delay its proof.

## 6. Concrete moat acquisition plans

There is **no demonstrated moat today**. The public libraries, two public anatomies, UI, API orchestration, and initial solver code are useful assets, but do not establish a durable exclusion or replication barrier.

### Moat candidate A — paired engineering evidence with usable rights

**Asset:** matched geometry, manufacturing/process metadata, fixture/loading definition, simulation, measured displacement/strain or force response, uncertainty, and expert failure annotation. Correctly registered paired evidence is more useful than a large unlabelled anatomy folder.

**How to acquire:** partner with one manufacturer or testing lab on a narrowly defined family. Negotiate rights to perform the work, retain the necessary audit trail, and reuse agreed de-identified/derived validation evidence. Keep customer-owned designs and patient information segregated. Cross-customer model training is a separate explicit permission, not a default entitlement.

**Why it could defend us:** a competitor can reproduce software more easily than it can obtain the same measured fixtures, process variations, model calibration decisions, and holdout results. The advantage is better bounded prediction and faster new-family qualification, if measured.

**12-month evidence target, conditional on funding/access:** rights-cleared paired data from two independent organizations, one family with a published or customer-reviewable validation protocol, and a held-out evaluation that demonstrates an improvement from the acquired evidence. Sample counts must follow experimental design, not a marketing quota.

**Failure modes:** nonexclusive data is already public; agreements prohibit useful reuse; every customer requires incompatible models; data is biased toward successful designs; tests cannot distinguish uncertain assumptions; or a large incumbent already has better evidence. No automatic network effect exists.

### Moat candidate B — a maintained, qualified family-specific model and protocol

**Asset:** the tested formulation, supported geometry/load/material envelope, fixtures, convergence evidence, failure cases, independent comparisons, experimental applicability, and change-control rules for a particular decision.

**How to acquire:** start with a narrow fixture/question, build the protocol before tuning, separate calibration from holdouts, and have a qualified reviewer assess applicability. Maintain evidence when software, materials, or model assumptions change.

**Why it could defend us:** reproduction requires domain knowledge, empirical work, and customer review. A qualified operational workflow can be more expensive to replace than a generic solver feature. This is accumulated trust and demonstrated applicability, not ownership of a regulatory standard or guaranteed regulator acceptance.

**12-month evidence target:** at least two paid repeat uses under the same declared context; a versioned evidence pack accepted by the customer's technical reviewer; an upgrade that preserves or explicitly requalifies claims; recorded reduction in setup/review effort.

**Failure modes:** results fail to generalize even within the family; customers do not trust the context; the qualified envelope is too narrow to be useful; support costs consume the economic benefit. A PDF template alone has no moat.

### Moat candidate C — a durable place in recurring design-change work

**Asset:** integration into the customer's versioned CAD, evaluation protocols, approval history, and evidence relationships. The product becomes where teams assess changes and retrieve the rationale.

**How to acquire:** solve one completed project, then a second design change, then connect the chosen CAD/quality workflow. Track revisions and evidence from the start. Provide exports and an understandable migration path.

**Why it could defend us:** accumulated organizational context and a workflow people rely on create retention and improve product decisions. Switching costs come from replacing proven integration and recreating review context, not preventing access to files.

**12-month evidence target:** repeated projects from at least two paying organizations, more than one role using the evidence, measured repeat usage, and reduced vendor hands-on effort per project.

**Failure modes:** analysis is bought once per year; customers only want a consulting report; existing PLM/CAE systems already cover the job; security/procurement makes integration impractical. “System of record” is earned through usage, not naming.

### Moat candidate D — specialized numerical know-how, if the advantage is real

**Asset:** robust treatment of thin hardware, moving geometry, material interfaces, boundary conditions, and efficient repeated solves, plus a corpus of failure cases. SDF alone is not this asset.

**Acquisition:** qualify an immersed method on the same decisions as the reference; measure how it behaves under unseen geometry changes; keep method and implementation tradeoffs explicit. Protect genuinely proprietary implementation details through appropriate IP/contract practices. Consider patent advice only for a specific novel invention after prior-art review.

**Evidence:** a reproducible customer-relevant advantage at matched error and full workflow cost, sustained across holdouts. A proposed internal hurdle is at least a twofold reduction in hands-on preparation or a material end-to-end improvement that a buyer values; this is a decision threshold, not a forecast.

**Failure:** accuracy erases the performance gain, preprocessing dominates, or an existing stack matches it. If so, decide openly whether to continue research, integrate a third-party method, or pursue the separate workflow business.

## 7. Land and expand in a defensible order

**Land:** one paid retrospective/prospective engineering evaluation for one design family, with no clinical decision or regulatory acceptance promise.

**Expand inside the same customer:** a second change → repeated fixture/load protocols → family variants → another engineering user → quality-review access → a versioned integration. Each step reuses evidence and workflow knowledge with permission.

**Expand across organizations:** offer the same bounded workflow to a similar buyer. Prove it does not require a fresh consultancy project every time. Prefer a lab/channel relationship that gives repeatable access without assigning away core reusable know-how.

**Expand across device families:** start with physically similar fixation cases only when load/interface/material applicability is established. Spine subsidence, orthodontic tooth movement, fatigue life, and remodeling each introduce new scientific and commercial gates; sharing storage and a UI does not satisfy them.

## 8. What would make this a strong startup rather than a good demo

Evidence of a repeated expensive problem, a buyer able to purchase, a product that meaningfully reduces that cost, a credible numerical/physical boundary, and a growing asset that improves delivery. The decisive milestones are paid repetition and trustworthy independent results. A broad platform story should follow those milestones.
