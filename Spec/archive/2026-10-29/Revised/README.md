# Trabecular — proposed strategy and specification reset

**October 29 framing correction:** the original multi-horizon biomechanical platform remains the project baseline. The narrower manufacturer workflow below is an unapproved entry-point recommendation, not a replacement mission. Read [FRAMING_CORRECTION.md](FRAMING_CORRECTION.md) before interpreting any proposed product, MVP, commercial, or roadmap document in this pack. The strategic framing below needs reconsideration within the original horizons; factual diligence findings remain separately assessable.

**Review date:** October 28, 2026, Asia/Kolkata. **Status:** proposal, pending owner review. No implementation, tests, simulations, builds, deployments, or cloud jobs were run for this review. Documentation was added; historical specifications and calculation artifacts were preserved.

## The decision

**Continue investigating the business, but do not continue building against the original broad pitch.** The project is a credible early engineering experiment. It is not yet a validated simulation product or a demonstrated business. The proposed focus is:

> Help implant engineering teams evaluate changes to a bounded fixation design family and produce a reproducible comparison and evidence package. Develop SDF-based immersed analysis to make repeated geometry changes cheaper to evaluate, and keep a separate tetrahedral route as a reference/checker.

This preserves the SDF ambition. It gives that ambition a customer problem and a testable advantage. It does not assume the method is unique or already faster.

## What changed after diligence

1. **SDF is a technical approach, not an established moat.** Intact already documents implicit geometry analysis on an independent finite-element grid and automated design loops. The underlying method category has substantial prior art. [Intact technical description](https://intact-solutions.com/closing-the-simulation-gap-for-implicit-design/), [CutFEM research](https://doi.org/10.1002/nme.4823).
2. **The original competitor gaps were overstated.** Implant testing, population studies, optimization, and workflow scripting are already available in the market. Differentiation must be demonstrated within a specific customer's process; see the competitor analysis and evidence ledger.
3. **The current jaw engine is tetrahedral and unqualified.** Existing checks are useful work, but retained reports explicitly leave mesh convergence and physical validation open. No current evidence establishes the SDF product thesis. [Retained calculation report](../../docs/verification/CALCULATION_RELIABILITY.md).
4. **The best initial buyer hypothesis is an implant manufacturer's engineering team**, with a named verification lead and recurring design-change work. A surgeon-facing live safety assistant is a later, separately assessed product direction.
5. **There are no established proprietary moats in the reviewed evidence.** The best candidates are rights-cleared paired validation data, a narrow and maintained credibility package, and integration into repeated design-change reviews. Each requires deliberate acquisition and proof.

## Read this pack

| Document | Decision it supports |
|---|---|
| [Due diligence](DUE_DILIGENCE.md) | What holds up, what fails, and what could change the verdict |
| [Evidence ledger](EVIDENCE_LEDGER.md) | Sources, dates, evidence relationships, and unresolved claims |
| [Strategy and moats](STRATEGY_AND_MOATS.md) | Buyer, wedge, defensibility, competition, expansion |
| [Opportunity portfolio](OPPORTUNITY_PORTFOLIO.md) | Twelve adjacent ideas across land-and-expand, automation, and novel approaches |
| [Revised product specification](PRODUCT_SPEC.md) | User, workflow, product boundaries, modern UI, and data model |
| [Revised MVP specification](MVP_SPEC.md) | Smallest honest proof, acceptance gates, and October 31 implications |
| [Architecture and validation](ARCHITECTURE_AND_VALIDATION.md) | SDF primary path, tetrahedral reference, numerical and experimental evidence |
| [Commercial validation](COMMERCIAL_VALIDATION.md) | Interviews, paid pilot, pricing hypotheses, economics, rights, and stop criteria |
| [YC brief and roadmap](YC_BRIEF_AND_ROADMAP.md) | Truthful pitch, founder questions, conditional milestones, approval decisions |

These documents are coordinated proposals. The product spec describes the intended product; the MVP spec determines its first delivery; the validation plan controls which claims its outputs can support. The due diligence describes evidence as of this review, not future capability.

## Recommended choices for approval

- Investigate **design-family change evaluation for fixation-device engineering** as the first commercial wedge. Choose the exact family with an accessible buyer; do not treat BSSO as a proven market simply because it is the current demo.
- Keep **SDF/immersed analysis as the primary technical development hypothesis** and **the tetrahedral implementation as a reference/checker under its own qualification gates**.
- Prioritize one repeatable engineering decision and independent evidence before larger cohorts, other body regions, autonomous clinical recommendations, or remodeling predictions.
- Treat October 31 as an **honest prototype/evidence submission** if submitting on that date remains necessary. This would change the previously approved expanded-MVP acceptance commitment and requires owner agreement; this report does not make that change automatically.
- Require buyer evidence and numerical evidence before another scope expansion. No engineering work resumes merely because this proposal exists.

## Unknowns that materially affect the recommendation

Founder domain expertise, access to manufacturers/testing labs, launch country, customer interviews, contracts, revenue, exclusive data rights, and money available for physical validation are not established in the reviewed materials. These may change which wedge should lead. No named company in the old specs is treated as a customer, partner, or prospective acquirer with expressed interest.
