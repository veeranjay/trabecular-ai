# Workspace Layout Specification

Date: 27 October 2026. Proposed layout direction for the revised MVP. Governed by [DESIGN_PRINCIPLES.md](../../DESIGN_PRINCIPLES.md).

## Information architecture

Global destinations: Cases, Workspace, Studies and Runs. Account/settings/help remain utility actions. A selected case carries its own workflow: Prepare, Design, Analyze, Compare and Report. Do not render both hierarchies as large competing tab bars.

Case context includes its name, active revision and model/readiness status. Technical provenance opens through a compact evidence control; do not use it as a persistent paragraph below every panel.

## Desktop reference composition

At 1440 × 900 CSS px:

- Navigation rail: 64 px, with accessible labels/tooltips; expandable labels are optional.
- Workspace top bar: 56 px, containing case/revision, workflow stage and quiet secondary utilities.
- Optional stage toolbar: 44 px maximum when the current task requires it.
- Outer workspace gutters: 24 px; region gaps: 16 px.
- Main anatomy region: remaining width with `minmax(0, 1fr)` sizing.
- Contextual inspector: 320 px default, bounded to 300–340 px, resizable/collapsible where useful.
- Inspector sections: 24 px padding and spacing, single internal scroll region, sticky primary action.
- Deepgram dock: compact 44 px control surface aligned to a canvas edge, with an expanded conversation/tool panel on demand. No permanent full-width conversation footer.

The canvas should generally retain 65–75% of usable working width with the inspector open. Use composition changes below the desktop breakpoint instead of shrinking font sizes.

```text
+--------+-------------------------------------------------------------+
|        | Case / revision       Prepare Design Analyze Compare Report |
|  Nav   +------------------------------------------+------------------+
|  rail  | Contextual viewport tools                 | Contextual       |
|        |                                          | inspector        |
| Cases  |                                          |                  |
| Work   |             MANDIBLE CANVAS              | Relevant inputs  |
| Study  |                                          | or results       |
| Runs   |                                          |                  |
|        | Camera / layer tools        Field legend |                  |
|        | [Deepgram · connect / mute]               | Primary action   |
+--------+------------------------------------------+------------------+
```

This is a composition guide, not a requirement to box every rectangle visibly. Most internal separation should come from space and surface tone.

## Inspector behavior by stage

| Stage | Canvas | Contextual inspector | Primary action |
|---|---|---|---|
| Prepare | Anatomy, segments, registration overlays | Units/orientation; supports; loading regions; keep-out annotations; readiness | Save preparation / Continue |
| Design | Hardware and anatomical fit | Fixation dimensions; screw placement; geometric constraints; optional loading summary | Run analysis |
| Analyze | Stress/displacement and clickable findings | Three leading result quantities; governing scenario; numerical quality; expandable evidence | Remediate when relevant, otherwise Run updated analysis |
| Compare | Baseline/candidate with a shared physical scale | Revision deltas; constraint changes; selected study scope | Apply selected design |
| Report | Compact case/evidence overview | Package contents, scope and reproducibility settings | Export package |

Preserve the selected case and stage as navigation changes. When a result belongs to a previous revision, identify that revision and mark it out of date.

## Cases overview

Use a clear 28–36 px title, one Import case action, searchable case rows and restrained readiness labels. Show case anatomy/name, revision, latest activity and analysis readiness. Empty state provides one meaningful import/open-reference action. Do not add decorative metrics merely to fill the page.

## Canvas tools

- Group camera presets separately from display layers and measurement modes.
- Keep core tools in one compact dock. Put infrequent actions in an overflow menu with names.
- Move advanced layer controls to a popover or inspector section; do not stretch a long toolbar across the whole viewport.
- Keep physical legends stable in comparisons, explicitly label units/range and ensure labels remain readable.
- Reserve safe overlay areas around the anatomy. Measurement labels, voice panels and job notifications must not obscure the selected region.
- An expanded assistant can replace inspector content temporarily or use a deliberate overlay; do not create a second permanent right column.

## Studies and runs

Use a full-width content view with one heading/action row, a concise summary, a large plot and a readable table. Keep filters in a single toolbar or drawer. Use row selection for detailed evidence instead of another layer of cards. Display distinct anatomy counts separately from scenario counts.

## Responsive composition

| Width | Behavior |
|---|---|
| 1440 px and wider | Full working canvas + 320 px inspector; navigation remains compact |
| 1200–1439 px | Same model where space allows; reduce gutters, not critical font sizes; collapse inspector when needed |
| 900–1199 px | Prioritize canvas; inspector becomes a toggled drawer/sheet rather than leaving a squeezed central column |
| 600–899 px | Full-width canvas followed by or paired with one deliberate inspector sheet; compact top context and stage selection |
| Below 600 px | Case status, results and model inspection first; precision forms use a dedicated full-width view |

Comparison switches to an explicit baseline/candidate selector when two viewports would become too narrow. On touch devices, controls retain usable hit areas. The main action and essential result scope stay discoverable without scrolling through a long setup sidebar.

## Current-to-next layout changes

1. Consolidate the global header and repeated workspace context into a more economical shell.
2. Replace simultaneous full setup and results columns with one stage-driven inspector.
3. Enlarge ordinary text and units, even if that means fewer controls visible at once.
4. Turn the permanent conversation strip into a compact, expandable Deepgram dock.
5. Replace most inner card borders with whitespace and occasional dividers.
6. Keep geometry, job identity, numerical quality and data freshness understandable in every stage.
7. Use the same component variants across cases, studies, report panels and dialogs.

## Review sizes and states

Inspect 1440×900, 1280×800, 1024×768, 768×1024 and 390×844, plus 200% browser zoom. Review empty case, ready design, running analysis, current results, stale results, failed job, unresolved numerical result, failed voice connection and expanded comparison states. These are implementation review targets, not already-executed checks.
