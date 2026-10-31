# Trabecular presentation workspace

Self-contained React/Three.js presentation, isolated from the engineering app. Direct controls and exports work without Python, Modal, Supabase or API keys. Live Deepgram voice uses server-only credentials and temporary browser tokens. All fonts, anatomy and contoured reference hardware ship locally. A separately selected Browser provider retains browser speech recognition/synthesis; it is never labeled as Deepgram. Microphone capture starts only when the visitor presses its button, and stops when ended, closed or the page is hidden.

## Open locally

```powershell
cd demo
npm ci
npm run build
$env:PORT='3100'
npm run dev
```

Open `http://127.0.0.1:3100/`. A prebuilt distribution needs `dist/`, `serve.mjs` and `server/` with Node 22.16+ or 24+; run `node serve.mjs` with `PORT=3100`, or serve `dist/` using an ordinary static HTTP server for direct controls and Browser voice only. Static-only hosting cannot issue Deepgram tokens. Use HTTPS for a hosted microphone session. Chrome/Edge are recommended for browser speech recognition; unavailable/denied recognition gives an actionable error and typed commands remain available.

## Presentation path

Live voice setup: see [Deepgram integration](../docs/verification/DEEPGRAM_CHECKS.md) for configuration, verified behavior and limits.

Landing → guided tour → Prepare → Design → Analyze → Compare → Explore → Studies → SDF Lab → Evidence. Replay the tour with the help button. Use Present to reduce chrome; Escape exits. The floating navigation expands on hover or keyboard focus and becomes a floating bottom dock on phones.

The voice copilot accepts speech or text through the same action dispatcher. Try:

- “Set plate thickness to two millimeters.”
- “Inspect the response.”
- “Show the left view.”
- “Compare with the baseline.”
- “Reduce stress.”
- “Run a cohort study.”
- “Show the distance field.”
- “Export report.”

Actual features include 3D inspection, parameter-responsive display geometry, sectioning, picking/ruler, STL import, local revisions/history, candidate application, 18-scenario study tables, CSV/JSON/STL/PNG downloads and printable HTML reports. Imported geometry remains session-only and must be reimported after reload; saved original engineering data is never touched. `?qa=1` uses separate browser-storage keys for verification.

## Simulation boundary

CT mandibles and default v5 fixation geometry originate from the engineering project. Hardware display morphs are lightweight visual illustrations and do not generate analysis-ready CAD. SDF Lab uses an analytical CSG field. Stress/deformation colors, response values, cohort rows and search ranking use a declared deterministic proxy, not FEM or clinical predictions; there is no safety-qualified winner. Method details and exported provenance retain this distinction without persistent presentation badges. The browser speech provider is separate from the live Deepgram integration.

## Return to the exact engineering checkpoint

The source checkpoint is commit `69ab06c286218e5a0146199fc8fbbe14bca502f0`, branch `mvp-baseline`, tag `pre-demo-2026-10-31`. Demo development is on `demo/buildathon`. Once current demo changes are committed, use:

```powershell
git switch mvp-baseline
```

Return with `git switch demo/buildathon`. Private environment settings, databases, existing artifacts and browser drafts are excluded from Git and were left in place; switching source branches does not restore or overwrite those runtime files. Both source branches and recovery tags are backed up at https://github.com/veeranjay/trabecular-ai. Private environment settings, databases and artifacts are excluded from that repository.

The owner now hosts the presentation at https://trabecular-ai-demo.vercel.app/ through GitHub-connected Vercel deployments; GitHub source pushes are explicitly authorized. The separate Sites publication remains held. The registered Sites identity is `appgprj_6ae620dad71081918b83d7496fb4f184`; its private manifest is retained in the isolated publishing checkout under `tmp/trabecular-site/.openai/hosting.json`. Reuse it rather than create another Site. No Sites deployment has been completed. GitHub source backup is a separate operation.

Attribution: Visible Human / BoneHub, S. H. Alavi & M. Asseln (2026), CC BY 4.0, https://huggingface.co/datasets/BoneHub/visible-human-3d-models. Local DM Sans and Manrope font licenses are included in `public/fonts/`.

## Appearance

Choose Sage or Violet in Settings → Appearance, or with the landing-page footer swatches. The selected palette persists on this browser. Anatomy materials and scientific field ramps keep their colors. The wordmark typography is unchanged; the symbol contains exactly three shapes.

## Vercel hosting

Use the `demo/buildathon` branch, Root Directory `demo`, and Application/Framework Preset **Other**. `demo/vercel.json` pins `npm ci`, `npm run build` and output `dist`. The Services preset expects a different multi-service configuration and is unnecessary for this presentation. Refresh the import screen after the configuration push.

Static assets and the two server functions under `api/` deploy together. The browser connects directly to Deepgram after receiving a temporary token; no long-running WebSocket passes through Vercel. Heavy numerical work remains a separate future compute backend. Git-connected deployments update the same site as the implementation evolves.
