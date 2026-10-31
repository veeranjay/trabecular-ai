# Trabecular — Design Principles

Updated: 27 October 2026. Applies to the application, its components, charts, voice interface and engineering exports.

**Design intent:** a modern, calm engineering workspace with a black foundation, restrained glass surfaces, confident typography and a generous anatomical canvas. Precision should be easy to read. Complexity should appear when the task needs it.

This is the project design source of truth. The supplied websites inform visual and interaction principles only; their branding, assets, business features and claims are not product requirements. The concrete layout and tokens below define the direction for the revised MVP implementation, whose build scope is tracked separately in `MVP_Revised_Plan.md`.

Supporting files:
- [Reference review](docs/design/REFERENCE_REVIEW.md): observations from the four requested websites and how we adapt them.
- [Workspace layout](docs/design/WORKSPACE_LAYOUT.md): screen structure, navigation, inspector behavior and responsive rules.
- [Design tokens](docs/design/tokens.json): source values applied to the new workspace styles in `frontend/src/app/workspace.css`.

## 1. Make the current task obvious

A user should be able to identify the selected case, active revision, current workflow stage and next useful action without reading a wall of controls.

- One global navigation system and one case workflow. Do not repeat Cases/Studies/History in several tab bars.
- One dominant action per workflow stage. Analysis uses Run analysis; remediation appears when results make it relevant; exports remain secondary.
- Group inputs around user decisions: Geometry, Fixation, Loading and Constraints. Put advanced numerical settings in an expandable section.
- Show human-readable labels before identifiers. Keep run IDs, hashes and configuration detail available in an evidence panel or report.
- Keep the primary action visible while the inspector content scrolls.

**Review question:** can a first-time user explain what to do next within five seconds?

## 2. Let the anatomy lead the workspace

The mandible and hardware are the central working object, not a decoration between two dashboards.

- At the 1440 px desktop reference size, give the anatomy roughly 65–75% of the usable working width with the inspector open.
- Use one contextual inspector by default. Do not permanently flank the model with full input and result columns.
- Show a quiet summary of the current findings on the canvas; open detailed results when Analyze or a finding is selected.
- Keep overlays out of the model's main silhouette and away from pickable anatomy. Collapse redundant annotations at smaller sizes.
- Use a faint optional grid and restrained lighting. Avoid auto-rotation, bloom, dense wireframes and animated particle backgrounds in the default view.
- Camera transitions preserve orientation and give the user an obvious Fit anatomy action.

**Review question:** does the model remain comfortably inspectable with all default controls visible?

## 3. Use typography to establish hierarchy

Modernity comes from readable proportions and deliberate spacing, not tiny labels.

- Use one primary sans family: locally bundled Inter Variable where available, with a system sans fallback. Do not depend on a remote font request to make the app usable.
- Use regular and medium weights for most content. Reserve semibold for selected navigation, compact headings and important values.
- Body and form text: 14–16 px. Form labels and ordinary metadata: 12–13 px. Nonessential metadata may use 11 px; critical instructions, units, statuses and chart labels must not drop below 12 px.
- Case/workspace title: 20–24 px. Overview titles: 28–36 px. Primary result values: 32–40 px where space supports them.
- Use tabular numerals for metrics and tables; reserve monospace for identifiers, coordinates and technical logs.
- Keep units attached to values at a readable size: `476.8 MPa`, `1.85×`, `4.24 mm`.
- Use uppercase letter-spaced labels sparingly. Do not render every group heading as tiny uppercase telemetry.
- Editorial serif styling from the references can inform future brand communication; it is not the default font for controls or engineering values.

**Review question:** is the distinction between title, label, value and explanation clear at normal browser zoom?

## 4. Create depth with restraint

The UI stays dark/black. Glass should explain which controls float above the workspace.

- Use neutral charcoal and subtly warm gray surfaces, rather than a green tint on every panel.
- Define a small number of surface levels: page, working surface, inspector and transient overlay.
- Reserve translucency/blur for the case bar, contextual tools, assistant dock and overlays. Dense forms and result tables need sufficiently opaque backdrops.
- Separate ordinary sections with spacing and occasional hairlines. A border is not required around every sentence, number or form group.
- Avoid nested glass cards, multiple outline layers and shadows on every component.
- Keep shadows broad and low-opacity. Avoid neon borders and permanent glow.
- Supply solid-color fallbacks when blur is unavailable or reduced transparency is requested.

**Review question:** does each visible border, shadow or blur communicate an actual level of hierarchy?

## 5. Spend visual emphasis carefully

Use one subdued brand accent, warm white text and clear semantic colors.

- Preserve a restrained pale-lime brand accent for the primary action and selected navigation.
- Use separate semantic success, caution and error colors. A selected control must not look like a passed analysis check.
- Keep most surfaces and icons neutral. Do not place every control in a colored pill.
- Reserve the scientific stress colormap for scalar fields and their legends. Do not repeat it in navigation, logos or decorative gradients.
- Comparison charts use a small stable categorical palette. Selection also changes a marker, outline or label so color is not the only cue.
- Keep a shared physical stress scale when comparing designs. Switching the legend range must be explicit.

**Review question:** if every accent were removed except the next action and one important finding, would the hierarchy become clearer?

## 6. Reveal detail progressively

The default view should be complete enough to use and quiet enough to understand.

- Keep advanced solver diagnostics, full provenance and long assumption lists one deliberate action away.
- Keep the model type, numerical-quality state and data freshness visible even when detailed evidence is collapsed.
- Show three essential result quantities first; put supporting metrics in a structured detail section.
- Display a finding with a location, explanation and action, rather than a decorative red badge alone.
- Prefer a compact evidence drawer to repeated warning paragraphs across the screen.
- Preserve expanded sections, selected units, camera bookmarks and panel widths per user where appropriate.

**Review question:** are we hiding distraction while preserving the evidence needed for the current decision?

## 7. Keep system states truthful

Visual polish must reinforce the actual state of the application.

- Distinguish Not run, Queued, Running, Completed, Cancelled, Failed and Numerically unresolved.
- Display the actual model category, such as Reduced beam or 3D GPU FEM. A model change never happens silently.
- Editing relevant inputs marks previous results out of date and removes their active stress mapping until a matching analysis is selected or computed.
- Name the scope of a passing constraint result: selected scenario or selected study envelope. A green state is not a statement of clinical safety.
- Identify cached results and their input revision. Never animate a completed cached result as a live solve.
- Show measured stages and elapsed time. Use indeterminate progress when the engine cannot provide a real completion percentage.
- Do not use invented patient activity, fake audio bars, fabricated success rates or placeholder metrics presented as live data.
- Make recovery actions specific: retry a failed job, review missing registration, reconnect voice or open diagnostic detail.

**Review question:** can every displayed status and number be traced to actual state or recorded evidence?

## 8. Make Deepgram a focused companion

Voice is a working mode within the engineering workflow.

- Default to a compact Deepgram control dock with connection state, start/stop, mute and an optional text entry affordance.
- Expand conversation and tool activity only when the user asks or a meaningful interaction needs attention.
- Read actual microphone/agent levels; animate only while real audio or a documented connection transition is occurring.
- Keep listening, thinking, speaking and computing distinct. A solver job must not make the agent appear to be speaking indefinitely.
- Parameter proposals show a concise change preview linked to the active case and revision.
- Camera focus follows the referenced anatomy; it must not cover the region with a large transcript card.
- Voice and direct controls use the same validation, state and job feedback.

**Review question:** does the assistant help with the current case while leaving the main workspace in control?

## 9. Use consistent components and spacing

- Use a 4 px base rhythm: 4, 8, 12, 16, 24, 32, 48 and 64 px.
- Default panel padding is 20–24 px; group separation is 24–32 px; label-to-field spacing is 8 px.
- Default controls are 40 px high. Compact desktop icon controls may use 36 px; touch targets should be at least 44 px as a project ergonomics target.
- Use a small radius family: 8 px compact controls, 12 px buttons/inputs, 16 px working panels, 20–24 px dialogs. Pills are reserved for short status/navigation affordances.
- Use Lucide icons with consistent optical sizing and stroke weight. Add visible labels to unfamiliar or consequential actions.
- Reuse Button, Field, InspectorSection, StatusBadge, FindingRow, RunSelector, JobIndicator and EvidenceDrawer variants rather than per-screen styling.
- Numeric inputs retain an editable decimal draft and offer increment/decrement affordances where useful. Do not force sliders for precise engineering input.

**Review question:** would two independently implemented screens still look and behave like the same product?

## 10. Make responsiveness change composition

Do not make the entire desktop interface smaller to fit a narrower screen.

- Wide desktop: compact navigation rail, large canvas and a 300–340 px contextual inspector.
- Compact desktop: keep useful text sizes, collapse nonessential navigation and let the inspector become a toggled drawer when the canvas would be squeezed.
- Tablet: full-width canvas and one inspector sheet/drawer. Avoid two narrow side-by-side columns with hidden results below the fold.
- Mobile: prioritize case status, results and an inspectable model. Complex precision edits may move to a dedicated form. Do not promise the full desktop CAD interaction in a tiny canvas.
- Comparison layouts can switch from side-by-side to a single viewport with explicit baseline/candidate selection.
- Toolbars must not wrap into multiple crowded rows over the anatomy.

**Review question:** does each breakpoint feel intentionally composed rather than scaled down?

## 11. Make accessibility part of visual quality

- Normal text must meet at least 4.5:1 contrast; large text at least 3:1 under the applicable WCAG definition. Required control/graphical cues need 3:1 against adjacent colors.
- Check the final composited glass background, not just a foreground hex value on an ideal background.
- Every critical action is keyboard reachable with a visible focus state. Icons and sliders have meaningful accessible names.
- Use dialogs/drawers with correct focus management, Escape behavior and focus return.
- Respect reduced motion and avoid unnecessary auto-animation. Do not hide essential status solely in a transient toast.
- Keep primary workflows usable at 200% browser zoom. Allow text selection and numeric copy/paste.
- Color encodings also use text, symbols, patterns or marker shapes as appropriate.

These are design targets to test during implementation, not a claim that the existing UI is already conformant. Sources: [W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [W3C non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

## 12. Finish the whole interaction

- Cover empty, loading, success, partial, stale, failure and disabled states for every major component.
- Disabled actions explain what is missing. Errors stay close to the input or job that caused them.
- Make parameter changes reversible through revision history or reset-to-recorded-values actions.
- Keep typography, charts, color semantics and evidence identifiers consistent in the exported engineering report. Print/PDF surfaces use a legible light background.
- End every design change with real browser review at the target viewport sizes and meaningful keyboard/interaction checks.

## Visual anti-patterns to remove in the next UI pass

- 8–10 px controls, faint labels and unit text that disappears beside a large number.
- Simultaneous full-height input and results sidebars around a constrained canvas.
- A permanent full-width voice conversation strip plus a redundant footer.
- Duplicate navigation, repeated context labels and several copies of the same action.
- Every subsection wrapped in a new border/card.
- Low-contrast green-gray text used as a substitute for hierarchy.
- Permanent pulsing lights, decorative clinical crosshairs or glossy effects unrelated to interaction.

## Design review checklist

- [ ] The active case, revision, stage and primary action are clear.
- [ ] The anatomy has a generous uninterrupted working area.
- [ ] The screen uses one contextual inspector by default.
- [ ] Critical text, inputs, units and chart labels meet the size/contrast rules.
- [ ] Spacing, radii, colors and component states use shared tokens.
- [ ] Glass and borders communicate hierarchy rather than decorate every surface.
- [ ] Voice is compact until expanded and reflects actual Deepgram state.
- [ ] Results preserve model identity, freshness, comparison scale and numerical-quality status.
- [ ] Keyboard, reduced-motion, zoom and narrow-screen behavior are checked.
- [ ] Empty/error/stale/export states are designed and implemented.
- [ ] No reference site's branding, assets, business features or claims were copied.
