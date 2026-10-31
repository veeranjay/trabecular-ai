# Presentation workspace checks

October 31, 2026. Scope: standalone `demo/`, not qualification of the engineering solver. No new FEM or cloud calculation was run. Existing CAD was exported locally for presentation geometry.

Verified:

- Standalone TypeScript check and static build pass.
- Landing loads bundled CT anatomy, with locally bundled fonts and no required application API keys/backend.
- First-visit tour opens and all nine destinations work, including the voice step; skip/replay controls are available.
- Thickness slider updates the actual design value; a search candidate changes the actual design; browser persistence retains values across reload.
- Search produces 16 distinct thickness/width candidates; cohort study exposes 18 scenario rows across two anatomies, three directions and three moduli.
- CSV, evidence JSON, binary STL, viewport PNG and printable HTML report download through browser controls. Downloaded JSON identifies illustrative provenance and qualification false; STL byte length matches its triangle count; PNG has its correct signature; report identifies the simulation boundary.
- Conversational text “Set plate thickness to two millimeters” changes the live slider to 2 mm. It uses the same action dispatcher as speech input.
- Browser speech synthesis briefing enters Speaking and can be stopped immediately. Audible quality was not assessed; live human microphone recognition has not been exercised.
- Froster glass copilot, compact functional headings, silver contoured CAD and hover/focus-expanded floating dock visually inspected.
- At a 390 × 844 phone breakpoint, copilot and floating bottom dock fit with no horizontal overflow. Temporary browser viewport override reset afterward.
- SDF Lab displays the plate with holes, analytical distance contours and independent grid; no immersed jaw computation is claimed.

Remaining review:

- Owner should test a live microphone command in Chrome/Edge on localhost or HTTPS. Browser recognition support, permissions and its speech-service availability vary. Capture starts only on explicit microphone-button activation; denial/errors have typed fallback. Deepgram is not configured or represented as connected.
- Owner visual/presentation acceptance; deployment and public access are on hold per latest instruction.
- Rendering morphs and response proxies are presentation mechanisms, not analysis-ready CAD or physical validation. Full engineering implementation resumes from `mvp-baseline` / `pre-demo-2026-10-31`.
