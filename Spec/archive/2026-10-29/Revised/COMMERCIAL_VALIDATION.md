# Commercial validation, pilot design, economics, and rights

**Framing correction, October 29:** manufacturer design-change evaluation is one unapproved entry-point hypothesis. The original VSP/CAD/reconstruction entry point and later horizons remain part of the project baseline. See [the correction](FRAMING_CORRECTION.md).

**Proposed plan, October 28, 2026.** No interviews, outreach, account actions, purchases, or experiments were performed for this document. Dollar amounts are USD and hypothetical except for cited published infrastructure rates. No customer, revenue, or partnership is claimed.

## 1. What we must learn before another broad build

The proposed buyer is a fixation implant manufacturer's engineering/verification team. The first commercial question is not “Do you like SDF?” It is whether a repeated design-change task consumes enough effort, delays, or rework to justify buying a new workflow.

Discovery should use completed and upcoming projects. Ask how the work happened, what files/tools were used, who reviewed it, what failed, how often it recurs, and what was paid or budgeted. Separate a user's interest from the authority to purchase and the ability to supply lawful inputs.

The founder's current industry access, technical expertise, available advisor/lab, launch country, incorporation, cash budget, and procurement relationships are unknown. Establish these first; they may favor a testing-lab wedge or an explicit workflow-automation alternative.

## 2. Discovery protocol

### Suggested initial sample

Seek conversations with 8–12 relevant people across roughly 4–6 independent organizations: simulation/design engineers, verification leads, quality/regulatory engineering, testing labs, and at least two budget owners. These are proposed exploration targets, not a statistically representative study or activity already completed. Prefer depth in one family to superficial coverage across five specialties.

No external messages should be sent without the owner's authorization. The following are interview prompts, not prepared outreach sent to anyone.

### Questions tied to real work

1. Walk through the last design change that required a new mechanical evaluation. What changed and what decision did the result support?
2. Who prepared geometry, registered regions, selected loads, ran analysis, checked failures, and approved the report? How much hands-on time did each step take?
3. Which parts were already automated? What still required expert correction, and why?
4. How often does this task recur? Distinguish per-case personalization, design-family changes, new processes, and formal test campaigns.
5. What happened when analysis disagreed with a physical test or a reviewer? Which evidence was trusted?
6. What would let you accept an additional numerical method? What must remain in your existing solver or quality process?
7. Which inputs and historical results could you lawfully share? Could any derived evidence be reused, and under which terms?
8. Who owns budget? What existing spend could this replace? What are procurement, IT, security, and review requirements?
9. What specific project would you try next, when, and with what measurable outcome?
10. Would you pay for a fixed-scope evaluation of that project? What must be true for a second paid use?

Do not lead with “we make it 100× faster,” ask users to invent our roadmap, or count politeness as intent. Record negative evidence and competent incumbent automation.

### Discovery evidence record

For each organization record role, date, permissions, family/task, recent project, recurrence, baseline effort, economic consequence, installed alternatives, buyer, procurement path, usable inputs, evidence standard, next commitment, and unresolved objections. Distinguish observation, reported estimate, and our inference. Retain only information we are authorized to retain.

## 3. The first paid engagement

**Offer:** an assisted, bounded design-change evaluation with a traceable comparison and evidence package, reviewed against a predefined protocol. Prefer retrospective comparison followed by a prospective repeat. The engagement is exploratory unless the promised engineering conclusion has sufficient applicability evidence.

| Contract item | Proposed definition |
|---|---|
| Buyer and reviewer | Named purchasing owner and qualified technical reviewer |
| Question/context | One device family, one decision, declared fixture/load/material range |
| Inputs | Authorized geometry, setup, material/process information, existing analysis/test records if available |
| Scope | A baseline and a small pre-agreed candidate/scenario set; revisions capped |
| Deliverable | Source-linked comparison, diagnostics, numerical evidence, limitations, reproducible bundle, reviewer walkthrough |
| Acceptance | Agreed traceability/replay, quantity/error requirements, and measured workflow comparison; no guaranteed passing design |
| Exclusions | Clinical decisions, device approval, guaranteed lifetime, unlimited geometry, or unbudgeted physical tests |
| Rights | Customer ownership/confidentiality, retention, deletion, and separately negotiated derived-evidence reuse |
| Commercials | Fixed fee, milestones, change requests, support limit, and responsibility boundaries |
| Next step | A second concrete change or repeated-use contract if the first outcome is useful |

The customer must understand whether it is buying engineering services, prototype software access, or a qualified workflow. Do not sell a “validated platform” while relying on unresolved model gates. Use appropriate professional contract and intended-use review before the first consequential commercial delivery.

## 4. Pricing and service-to-product transition

**Initial price hypotheses:** $5,000–$15,000 for a genuinely useful fixed-scope assisted pilot; $24,000–$60,000 per year for repeated team use after evidence of recurrence and declining service burden. These are proposed discovery anchors, not competitor prices, signed contracts, or recommended quotes before scope is known. Academic/research projects may have different budgets and do not automatically validate manufacturer willingness to pay.

Avoid unlimited analysis at a low seat price. Define included project/scenario/resource bands and expert support. Charge for expensive bespoke model development or experiments as separate work. Compute is a cost component, not the sole value metric.

An illustrative $10,000 pilot with 60 engineering/review hours at an assumed fully loaded $100/hour, $300 compute/storage, and $500 allocated other delivery cost leaves $3,200, or 32%, contribution before company overhead, sales, and taxes. At 100 hours, it loses $800 on those assumptions. At 20 hours with the other costs unchanged, contribution rises to $7,200, or 72%. These are arithmetic scenarios, not our actual costs or margins.

That is why repeatable setup and review matter more commercially than shaving cents from a solve. Track vendor hours, customer hours, review cycles, unique custom code, support requests, acquisition effort, and time to a second project. Productization is evidenced by reuse and lower work per delivery, not by renaming a service subscription.

Per-case clinical API prices and enterprise six-figure tiers in the old spec remain unvalidated. Do not treat a buyer's annual device volume as software transaction volume until actual need for per-case evaluation is established.

## 5. Bottom-up market model

There is no sourced market-size estimate in this review. Build an account-level model after selecting family and country:

`reachable accounts × fraction with recurring relevant work × annual willingness to pay`

Then constrain it by sales capacity, procurement duration, implementation hours, retention, and support. List accounts with evidence of the workflow; logos in an addressable-market slide do not count as reachable buyers.

For scale intuition only: 100 customers at $36,000 annual revenue produce $3.6 million ARR; 300 produce $10.8 million. This arithmetic neither proves that 300 suitable buyers exist nor that they will buy. If the first niche supports only a few dozen accounts, the company needs larger value per account or a validated adjacent expansion to support a venture-scale thesis.

Use three scenarios after discovery: narrow profitable services/product business; repeatable family-specific software; broader multi-family engineering platform. Each scenario needs its own account count, price evidence, delivery cost, and expansion assumptions. Do not cite the entire orthopedic device market as our software market.

## 6. Resource economics and development budget

Modal currently publishes an A10 rate of $0.000306/GPU-second, CPU $0.0000131/physical-core-second, and memory $0.00000222/GiB-second; its Starter page lists $30 monthly credit. Verify account-specific/current rates before future execution. [Provider pricing](https://modal.com/pricing).

An illustrative worker using one A10, four physical CPU cores, 32 GiB RAM, and 600 seconds at those rates costs:

`600 × (0.000306 + 4 × 0.0000131 + 32 × 0.00000222) = $0.257664`

That is approximately $0.258 for the stated resource-time assumptions. It excludes additional build/start/preprocessing time, retries, storage, network and applicable adjustments. It is not a measured runtime, invoice, capacity promise, or total cost of delivering an engineering project. Actual billed resources and provider minimums must be checked.

Six such runs would be about $1.55; 100 about $25.77 before those extras. Parallel execution changes turnaround, not that aggregate arithmetic. A larger or slower model could cost much more. The $30 allowance therefore supports careful bounded experiments, not an unrestricted cohort research program.

**Proposed controls after resumption:** one initial small benchmark, explicit per-job timeout/CPU/RAM/GPU limits, conservative concurrency, no unnecessary warm pool, per-study candidate caps, retained logs, and a running spend ledger. Reserve credit for failure/review rather than allocating all $30 to nominal runs. Confirm remaining balance before a batch; reduce scope or request a budget decision if the cap is threatened. No spend or deployment is authorized by this report.

Local GPU use is appropriate for small supported problems that fit existing resources. The previous host-RAM failures mean larger native feasibility remains unresolved. Do not infer “fits in 4 GB VRAM” from field/storage size alone, or silently swap compute routes when one fails.

Physical testing, professional model review, commercial licenses, security/procurement work, sales, and engineering labor are outside this cloud allowance and may dominate costs. Their budget and access are currently unknown. A credible validation plan requires a realistic source of those resources.

## 7. Rights and governance required to build a moat

For every partner dataset or project, distinguish rights to **access**, **analyze**, **retain for audit**, **redistribute**, **reuse derived evidence**, and **train models across customers**. One does not imply the others. Manufacturer CAD, patient information, mechanical-test results, and third-party annotations may have different owners and restrictions.

Suggested starting agreement structure:

- Customer retains ownership of its device designs, patient information, and confidential project records.
- Trabecular retains its pre-existing software and generally reusable methods, subject to negotiated terms.
- Specific derived validation data or anonymized aggregates may be reused only under explicit permission with appropriate privacy/IP review. De-identification alone does not settle design confidentiality or every data-use obligation.
- Tenant separation, access logging where required, approved service locations, retention/deletion, incident handling, and exportability are specified for the actual inputs.
- Calibration/validation records remain traceable even where publication is prohibited; public benchmark release is separately agreed.
- Dependencies and third-party model/binary permissions are reviewed before distribution or hosted commercial use.

Do not promise automatic cross-customer learning or call restricted customer records a proprietary company dataset. Defensibility comes from useful permissions and curated evidence, not merely possession.

## 8. Decision gates and stop criteria

These are proposed operating hurdles, not proof from a statistically sufficient sample.

| Gate | Evidence to advance | Evidence to change direction or stop |
|---|---|---|
| Access | Reachable reviewer/buyer and lawful relevant project inputs | No practical route to a real project or domain review |
| Pain/recurrence | Several independent teams describe the same recent costly task with upcoming recurrence | Interest is academic, rare, or already solved adequately |
| Technical relevance | Accepted physical question and feasible evidence/resource plan | Required claim depends on unsupported contact/fatigue/biology or unavailable data |
| Willingness to pay | Budgeted paid evaluation with clear acceptance and reviewer | Only free demos/LOIs without a purchasing path |
| Workflow improvement | Proposed hurdle: material buyer-valued improvement, e.g. ≥2× less hands-on preparation on selected repeated tasks | Benchmark gain disappears with fair accuracy and competent alternatives |
| Repeatability | Second project/change uses the same workflow with lower hands-on effort | Every delivery needs a fresh bespoke model |
| Defensibility | Rights-cleared paired evidence and retained useful review context accumulate | No reusable rights or improvement from accumulated work |

If buyers value evidence automation but the SDF method does not help, present the alternative explicitly to the owner. If neither problem nor advantage is supported, stop the current thesis rather than expanding features.
