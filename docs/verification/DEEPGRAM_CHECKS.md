# Deepgram integration · November 1, 2026

## Configure

Locally put `DEEPGRAM_API_KEY` in `demo/.env.local` (see `demo/.env.example`) and restart `node serve.mjs`. The local server also reads the existing `backend/.env` as a fallback without changing it. On Vercel add `DEEPGRAM_API_KEY` to server Environment Variables for Production (and Preview if needed), then redeploy. Never use a `VITE_` or `NEXT_PUBLIC_` prefix or commit the key.

Open the floating dock's copilot, select Deepgram and press the mic or send a typed command. Typed commands use the actual agent without requesting microphone access. Browser fallback is explicitly selected and never silently substituted. HTTPS or localhost is required for the mic.

## Implemented path

`/api/voice-config` exposes configured state only. Same-origin POST `/api/deepgram-token` issues a 30-second temporary token from the server-only key. The browser streams 16 kHz PCM directly to Deepgram's Voice Agent: Nova-3 transcription, GPT-4o mini reasoning, Aura-2 Thalia speech at 24 kHz. No long-running WebSocket passes through Vercel.

The agent uses validated client tools to inspect current inputs, edit bounded parameters, move the camera, show fields and run the existing illustrative analysis/search/study/remediation/comparison/save/report workflows. Shared application actions update the real controls. None of these tools turn proxy mechanics into validated FEM. Mutating calls defer until turn confirmation, duplicate IDs execute once, and changing anatomy disconnects stale context. Mute, interruption, explicit end, tab hiding, unmount and failure release session resources.

The initial real-provider checks exposed a rejected Settings field: `client_side` belongs in received function call events; omitting `endpoint` declares a client function. Correcting this in the shared configuration made the live check pass. Strict local parameter validation remains independent of the provider schema.

## Evidence

- TypeScript and static build passed.
- Offline tests cover credential isolation, request validation, fixed token lifetime, sanitized provider failures, optional access-code gating, throttling, concurrent grants, allowed tool values, duplicate calls and stale/closed sessions.
- [Live provider evidence](deepgram-live-check.json): generated speech was transcribed, `update_design` applied thickness 2 mm to the fixture, assistant text arrived and 142,080 bytes of output audio were received in 9.889 seconds. No human microphone was recorded. This check is explicitly invoked, bounded and excluded from normal build/CI.
- Local browser review used isolated `?qa=1` storage and a real Deepgram session: a typed command changed the displayed slider from 2 to 2.5 mm, the agent confirmed it, and End session returned to idle. Browser output was muted during review; audible quality and a human microphone remain manual checks. Screenshot: `output/deepgram-voice-review.png`.
- Hosted endpoint verification is recorded below after the source push. Local success alone does not establish Vercel environment readiness.

## Access and spend limits

Optional server variable `DEEPGRAM_DEMO_ACCESS_CODE` adds a code field to the copilot and gates token issuance. The endpoint limits six starts per ten minutes per client **per running instance**, and prevents concurrent grants from that client. These are best-effort safeguards, not a distributed quota. The standard UI stops after five minutes or one minute without conversation and never automatically reconnects.

Temporary tokens can open other supported provider sessions until expiry; expiry does not terminate an existing connection. Frontend session timers are not a hard billing cap. Use provider account spending controls; before broad production traffic add authenticated access and a shared quota store. No permanent credentials appear in bundles, exports, evidence or Git.

Offline tests: `npm run test:voice` in `demo/`. Optional paid provider check: `npm run check:deepgram`, using generated speech, a fixture workspace and a 25-second agent-session deadline. Supabase remains deferred, Modal stays disabled and no engineering solve ran.

Primary references: [browser SDK](https://developers.deepgram.com/docs/browser-agent-javascript), [function settings](https://developers.deepgram.com/docs/build-a-function-call), [temporary tokens](https://developers.deepgram.com/guides/fundamentals/token-based-authentication), [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js).
