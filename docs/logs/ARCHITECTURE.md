# Architecture and system design log

Read this and [CODE_CHANGES.md](CODE_CHANGES.md) at the start of a task, alongside the [current specs](../../Spec/README.md). Append dated decisions; never erase or silently rewrite history. Read recent entries and search earlier relevant decisions. Later explicit revisions supersede earlier decisions; user instructions take precedence. Keep each **Changed** and **Why** to one line. Use a shared `TRAB-*` audit ID to connect related architecture and code records; mark proposals, accepted decisions and implemented changes distinctly.

This initial backfill summarizes recorded decisions in [AUDIT.md](../../Spec/AUDIT.md); it is not a complete reconstruction of earlier development. The specs define intended behavior; the code log and verification evidence establish implementation state.

## 2026-10-30 · TRAB-001 · Platform direction · Accepted

**Changed:** Reaffirmed the multi-horizon biomechanical platform with SDF/immersed analysis as the intended primary engine and fitted tetrahedra retained as a named reference/checker.
**Why:** Preserve the original reconstruction, cohort evaluation and CAD remediation direction without turning an interim solver or initial CMF showcase into a product pivot.

## 2026-10-30 · TRAB-001 · Specification organization · Implemented

**Changed:** Consolidated current specifications into `Spec/` and preserved 17 historical documents in a dated, hash-manifested archive.
**Why:** Give agents one navigable current source of truth while preserving earlier requirements, reviews and evidence.

## 2026-10-30 · TRAB-001 · Service boundaries · Accepted

**Changed:** Deferred live Deepgram and Supabase integration while retaining scaffolds and working local controls and persistence.
**Why:** Follow the owner's integration sequence without making unfinished external services prerequisites for local development.

## 2026-10-31 · TRAB-002 · Workspace interaction model · Accepted; implementation partial

**Changed:** Adopted one contextual inspector, evidence on demand and a reduced-chrome presentation view with restrained black/glass styling.
**Why:** Reduce repeated status text and visual clutter while preserving access to detailed engineering evidence.

## 2026-10-31 · TRAB-003 · Immersed method development · Experimental; incomplete

**Changed:** Introduced a bounded parametric thin-plate specimen and SDF-cut quadratic background-grid formulation as an initial method milestone.
**Why:** Establish inspectable geometry-to-physics evidence before anatomical integration; specimen results cannot qualify or replace the jaw workflow.

## 2026-10-31 · TRAB-004 · Compute placement · Current decision; cloud disabled

**Changed:** Switched current development to local `cuda:0`, retaining Modal as an inactive bounded adapter under the $30 monthly ceiling.
**Why:** Modal rejected GPU use without payment verification, and a guaranteed no-payment CPU allowance could not be established; the owner requested local fallback.

Evidence: [Modal access verification](../verification/MODAL_ACCESS.md). The local RTX 3050 has 4 GB VRAM; host RAM remains a separate constraint. This revises earlier authorization to attempt bounded cloud execution: resume cloud only on explicit owner instruction.

## 2026-10-31 · TRAB-005 · Agent context and change history · Implemented

**Changed:** Established separate architecture and code logs, mandatory agent read/update instructions and links from the spec index, retaining the detailed audit.
**Why:** Make decisions and their rationale easy to recover between tasks without confusing intended architecture with implemented or verified behavior.

## 2026-10-31 · TRAB-006 · Submission delivery scope · Implemented; full MVP preserved

**Changed:** Separated the browser-only presentation from the engineering app using demo/buildathon and the pre-demo-2026-10-31 checkpoint.
**Why:** Meet the immediate selection deadline without replacing the intended SDF engine, production work or saved engineering evidence.

## 2026-10-31 · TRAB-007 · Voice boundary · Browser voice implemented; Deepgram deferred

**Changed:** Added browser-managed recognition/synthesis as a separate voice mode sharing the same design action dispatcher as direct and typed controls.
**Why:** Provide usable speech interaction without exposing provider keys or claiming an unconfigured Deepgram connection.

## 2026-10-31 · TRAB-008 · Interaction and rendering · Implemented; owner review pending

**Changed:** Moved navigation to an expanding floating glass dock, reduced workspace copy and reused existing v5 CAD hardware for presentation rendering.
**Why:** Address owner feedback about clutter, static navigation and unrealistic metal without running new numerical analyses.
