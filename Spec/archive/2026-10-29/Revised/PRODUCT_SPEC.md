# Revised product specification

**Framing correction, October 29:** the narrow product described below is an unapproved proposal, not a faithful replacement for the original platform vision. Its framing requires reconsideration within the original horizons. See [the correction](FRAMING_CORRECTION.md).

**Status: proposed, October 28, 2026.** This describes the intended product. It does not claim that the existing application meets these requirements. [MVP_SPEC.md](MVP_SPEC.md) defines the first delivery; [ARCHITECTURE_AND_VALIDATION.md](ARCHITECTURE_AND_VALIDATION.md) controls what its calculations can support.

## 1. Product definition

Trabecular helps implant engineers evaluate a bounded fixation design change and preserve the evidence behind the comparison. The product connects geometry, assumptions, protocols, calculations, candidate changes, and review in one reproducible workflow.

The primary technical development direction is **implicit/SDF geometry with immersed analysis**. The existing **tetrahedral FEM implementation remains a separately identified reference/checker**, subject to its own qualification. A fast fitted calculation must never be presented as proof that immersed physics works.

### Initial intended use

Engineering exploration and comparison of supported fixation-device configurations under explicitly defined static mechanical conditions. A qualified engineer reviews setup, model applicability, numerical evidence, and conclusions. The first customer context should preferably be a bounded test fixture or otherwise well-characterized engineering comparison.

The initial product does not authorize treatment, approve an implant for a patient, establish device compliance, predict fatigue lifetime, or replace physical validation. Those would require new evidence and a separate product/intended-use assessment. These boundaries affect features and sales language, not merely a footer disclaimer.

### Initial customer

A fixation-device manufacturer's engineering team with a recurring design-change task and an accountable technical reviewer. A testing lab may become the first customer if actual access and recurring work are stronger there. The final design family and launch country remain decisions to make from discovery.

## 2. User outcomes

| User need | Product behavior | Observable acceptance |
|---|---|---|
| Know exactly what is being compared | Immutable baseline and candidate with explicit input differences | Reviewer can identify changed geometry, assumptions, and protocol |
| Avoid repeating preparation unnecessarily | Reusable named geometry regions and reviewed dependencies | Reuse is explicit; invalid/missing mappings block analysis |
| Understand whether a result is usable | Separate job, numerical, applicability, and constraint states | Completion cannot appear as numerical qualification or clinical safety |
| Review the source of a finding | Link quantities, locations, fields, logs, and evidence to a run | Every assessment value traces to a result and manifest |
| Compare changes fairly | Same declared protocol and physical display scales | Differences cannot be explained by an unnoticed protocol/legend change |
| Share a reproducible engineering record | Export inputs, results, assumptions, evidence, and limitations | Another engineer can reconstruct the intended comparison |

## 3. End-to-end workflow

### 3.1 Project and protocol

Create an engineering project with a named question, design family, reviewer, and evaluation protocol. Choose the quantities of interest before calculating: for example, fixture displacement, a declared hardware stress measure, or relative change in compliance. State permitted geometry/material/load ranges and decision limits, including the source and authority for each.

An unsupported context can be saved as exploratory work. It cannot inherit a supported context's qualification merely because the geometry looks similar.

### 3.2 Prepare inputs

Load supported geometry with explicit units, coordinate transform, source/license, component identity, and checks for ambiguous or missing regions. The prepared public jaws remain research references. Imported geometry is not automatically a prepared mechanical model.

Review material regions, supports, distributed loads, ties, segment independence, and any keep-out annotation. Distinguish measured tissue geometry from an offset proxy. The entire screw trajectory is relevant to geometric clearance; an external bone surface cannot establish an internal nerve's position.

### 3.3 Baseline and candidate

Freeze a baseline revision. Edit only supported parameters within declared bounds. Show changed geometry, invalidate dependent results, and create a new immutable candidate revision on apply. Display the analysis model corresponding to each revision; do not leave an old heatmap on newly edited geometry.

### 3.4 Analyze

Choose the supported model and protocol. Estimate resource use if available, then queue a bounded job. Show real stages and elapsed time, allow cancellation, preserve failed logs, and distinguish exact-cache retrieval from newly computed results.

Outputs include displacements, material-specific stress/strain fields, declared assessment quantities, reactions/balance, residuals, numerical settings, and applicability limitations. Display values calculated from the selected run, never a scripted before/after success story.

### 3.5 Compare and propose

Compare baseline/candidate using the same declared protocol or explicitly disclose changed inputs. Show geometry differences and mechanical differences together. A bounded candidate search can propose a revision; final eligibility requires the protocol's full-fidelity and scenario gates. “No feasible candidate” and “insufficient evidence” are legitimate results.

### 3.6 Study and review

Run explicitly named scenarios only after the canonical model is usable. Show distinct geometries separately from load/material variants, retain failures, and link every point to its run. Report the worst observed result within the study. Do not display population confidence intervals without a justified statistical model.

The reviewer records findings and open issues. In the MVP, a local engineering review note is sufficient; electronic signatures or formal quality-system approval are not claimed.

### 3.7 Export

Deliver a versioned engineering bundle: question/context, geometry/parameters, registration, loads/materials/interfaces, manifest, method/version, numerical evidence, results, comparison tables, limitations, and sources. A report describes what evidence exists; it does not issue a regulatory approval.

## 4. State model and trust rules

The product must represent these axes separately:

| Axis | Example states |
|---|---|
| Execution | Not run, queued, running, completed, cancelled, failed |
| Numerical evidence | Unchecked, unresolved, protocol checks passed, checks failed |
| Model applicability | Exploratory, within supported context, outside context, review needed |
| Engineering constraints | Not evaluated, pass for declared scope, fail, indeterminate |
| Freshness | Current exact input, saved historical run, stale for current draft |
| Evidence provenance | Newly computed, exact cache, imported reference, historical artifact |

An overall “safe” badge is not a product state. A legacy boolean such as `qualified` cannot stand in for these distinctions in the revised specification; any implementation migration would be separate work after approval.

## 5. Core records and relationships

- **Project:** owner/workspace, engineering question, intended context, design family, reviewer, rights/access rules.
- **Geometry asset:** source, license/permission, hash, units, transform, component/material identity, supported-input checks.
- **Design revision:** immutable parameters and geometry references; parent revision and change explanation.
- **Setup revision:** named loads/supports/interfaces/materials, uncertainty assumptions, annotation sources and review status.
- **Protocol version:** quantities, domains, resolution/error checks, scenario list, thresholds and rationale, supported context.
- **Run:** exact design/setup/protocol/method identity, environment/hardware, execution state, raw artifacts, diagnostics, provenance.
- **Comparison/search/study:** declared membership and objective, rejected/failed candidates, final confirmation and scope.
- **Evidence/review:** benchmark or experimental record, applicability assessment, findings, source links, limitations, export identity.

Avoid storing a result against a mutable “current case” alone. Tenant identity and access checks apply to records, file access, events, voice actions, and exports.

## 6. UI and interaction principles

Retain the modern **black/dark glass** direction in [DESIGN_PRINCIPLES.md](../../DESIGN_PRINCIPLES.md). This proposal refines the product hierarchy without changing those aesthetic requirements.

Use one project bar, one workflow navigation, a large geometry canvas, and one contextual inspector. The primary sequence is **Prepare → Design → Analyze → Compare → Evidence**. Projects and study history sit outside that sequence, rather than duplicating tabs across the page.

The initial view answers: what project/revision is selected, what is the current task, what changed, what evidence exists, and what action comes next? Keep dense settings in an expandable advanced area. Use glass for floating controls; give forms/tables sufficiently opaque surfaces. Avoid rows of decorative statistics and nested cards.

The canvas prioritizes real anatomy/hardware, readable loads/supports, clear selection, an explicit field legend, and a visible deformation amplification factor. Comparison uses a shared physical scale by default. Keep color from being the only status cue. A selected control must not resemble a passed engineering constraint.

The evidence drawer exposes method identity, numerical/applicability state, assumptions, and source details. Its collapsed summary must still show material limitations and freshness. Errors identify an action: review missing region, correct units, inspect failed numerical checks, or reconnect an integration.

Deepgram is a compact optional companion. It reads structured results, explains evidence, controls the camera, or proposes typed actions. It must bind actions to the selected project/revision, reject stale requests, and use the same validated commands as buttons. It may not invent a load, threshold, or pass result. Live provider operation requires separate acceptance; no fake audio or fallback represented as Deepgram.

## 7. Technology direction

| Layer | Proposed decision | Status / rationale |
|---|---|---|
| Frontend | Retain Next.js, React, TypeScript, Three.js, custom styles, Lucide | Existing stack; no library migration for appearance alone |
| Backend | Retain FastAPI/Pydantic and durable job/state boundaries | Keep working application plumbing where useful |
| Geometry | Versioned implicit/SDF geometry with a selected, license-reviewed backend | OpenVDB/NanoVDB are candidates, not implemented requirements by assertion |
| Primary analysis | NVIDIA Warp, explicit immersed formulation | Research/development path gated by validation plan |
| Reference analysis | Existing tetrahedral route plus a separately developed solver comparison when feasible | Preserve work; do not treat shared code as fully independent evidence |
| Storage/auth | Supabase Postgres, Storage, authentication if configured and validated | Local development persistence remains explicitly labeled; hosted readiness not assumed |
| Cloud | Bounded Modal workers after approval/configuration | $30/month owner ceiling; no automatic spillover |
| Voice | Deepgram Voice Agent integration | Correct provider; optional to initial engineering value |
| Evidence | Existing PDF/ZIP capability extended with actual method/context evidence | No invented benchmark fields or certification claims |

Version choices are recorded in the implementation environment when work resumes; this plan does not update dependencies. MeshLib, TetGen, Triangle and any reference binaries need an applicable license decision before commercial delivery.

## 8. Expansion boundaries

The reusable product foundation includes revision control, jobs, geometry provenance, protocols, evidence relationships, comparison, and access controls. The reusable scientific foundation is narrower: only equations, materials, interfaces, loads, and quantities whose applicability has been established may carry evidence forward.

Contact/friction, fatigue, manufacturing defects, remodeling, spinal subsidence, and orthodontic movement are separate model capabilities. Additional anatomy does not unlock them automatically. Market expansion follows qualified customer decisions rather than a catalogue of body-region tabs.
