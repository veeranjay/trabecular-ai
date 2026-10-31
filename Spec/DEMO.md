# Submission presentation scope

October 31, 2026. The owner replaced immediate full-MVP delivery with an isolated, self-contained presentation version covering the intended workflow. The [full MVP](MVP.md) and platform horizons remain the engineering target. This is a temporary delivery scope, not an architectural pivot or evidence of numerical qualification.

- Preserve the exact pre-demo engineering source under `mvp-baseline` / `pre-demo-2026-10-31`; build presentation code only in `demo/` on `demo/buildathon`.
- Include a polished landing page, first-visit interactive tour, cases/import, prepare/design/response/comparison/evidence, design exploration, cohort studies, history and SDF Lab.
- Include a working browser voice copilot with microphone capture, transcript, spoken replies, shared design/camera/study actions, explicit start/stop, mute, failure handling and typed fallback. November 1: the owner authorized live Deepgram Voice Agent integration with server-only credentials and temporary browser tokens. Keep Browser voice as an explicit separate provider.
- Direct controls, browser persistence, downloads and analytical SDF visualization operate locally; heavy mechanics and orchestration may be illustrative behind the scenes. Keep simulated physics distinguishable in methods, field labels and exported provenance. No invented validation or clinical claims.
- Keep the workspace concise: functional titles and units, no decorative canvas copy or repeated presentation badges. Use subdued titanium, real contoured hardware, frosted glass, smooth transitions, reduced motion and a floating navigation dock expanding on hover/focus.
- Landing page and presentation transitions may be more expressive, within reconstruction → cohort → connected applications rather than an unrelated product.
- All application assets ship locally. Browser-managed speech may need its own network service and supported browser. No cloud numerical jobs or private case uploads are needed. Live Deepgram voice requires a server-only provider key and internet access; direct controls remain local.
- Current hosting: the owner supplied https://trabecular-ai-demo.vercel.app/ and requested Deepgram integration. GitHub-connected Vercel updates are in scope; the separate Sites publication remains held.

Implementation/launch/recovery notes: [demo README](../demo/README.md). Concise history: [architecture log](../docs/logs/ARCHITECTURE.md), [code log](../docs/logs/CODE_CHANGES.md). Full engineering code and numerical artifacts remain separate.

October 31 review update: GitHub source pushes to `https://github.com/veeranjay/trabecular-ai` are authorized and the baseline/demo recovery refs are backed up. The separate Sites deployment remains held; the owner subsequently hosted the demo on Vercel. Add optional Violet/indigo alongside Sage; preserve wordmark typography, use a three-shape symbol, remove duplicate header voice control and hero capsule, and keep the view toolbar horizontal at every breakpoint. Voice remains accessible from the floating dock on phones and in presentation mode.
