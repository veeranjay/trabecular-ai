// Server-only. Never import this module from src/ or embed secrets at build time.
const buckets = new Map();
const pending = new Set();
const TOKEN_TTL = 30;
const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, private', 'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff' };
const json = (status, data, extra = {}) => new Response(JSON.stringify(data), { status, headers: { ...headers, ...extra } });
export function voiceConfiguration(env = process.env) {
  return { provider: 'deepgram', configured: Boolean(env.DEEPGRAM_API_KEY?.trim()), requires_access_code: Boolean(env.DEEPGRAM_DEMO_ACCESS_CODE), token_ttl_seconds: TOKEN_TTL, max_session_seconds: 300 };
}
export function configResponse(request, env = process.env) {
  if (request.method !== 'GET') return json(405, { error: 'Use GET.' }, { Allow: 'GET' });
  return json(200, voiceConfiguration(env));
}
export async function tokenResponse(request, { env = process.env, fetcher = fetch, now = Date.now, client = 'local', limits = buckets, inflight = pending } = {}) {
  if (request.method !== 'POST') return json(405, { error: 'Use POST.' }, { Allow: 'POST' });
  const origin = request.headers.get('origin');
  if (origin !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') return json(403, { error: 'Voice must be started from this site.' });
  if (!env.DEEPGRAM_API_KEY?.trim()) return json(503, { error: 'Deepgram is not configured on this deployment. Add the server-side DEEPGRAM_API_KEY and redeploy.' });
  if (env.DEEPGRAM_DEMO_ACCESS_CODE && request.headers.get('x-voice-access-code') !== env.DEEPGRAM_DEMO_ACCESS_CODE) return json(401, { error: 'Enter the voice access code.' });
  if (Number(request.headers.get('content-length') || 0) > 1024) return json(413, { error: 'Request is too large.' });
  let text;
  try { text = await request.text(); } catch { return json(400, { error: 'Invalid request.' }); }
  if (text.length > 1024) return json(413, { error: 'Request is too large.' });
  try { const body = text ? JSON.parse(text) : {}; if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length) return json(400, { error: 'No token options are accepted.' }); } catch { return json(400, { error: 'Invalid JSON.' }); }
  const time = now();
  // Best-effort per-instance throttling; not a distributed quota or a billing cap.
  for (const [id, entry] of limits) if (time - entry.start > 600_000) limits.delete(id);
  const entry = limits.get(client) || { start: time, count: 0 };
  if (entry.count >= 6 || inflight.has(client) || limits.size > 2000) return json(429, { error: 'Too many voice starts. Please wait before reconnecting.' }, { 'Retry-After': '60' });
  limits.set(client, { ...entry, count: entry.count + 1 });
  inflight.add(client);
  try {
    const response = await fetcher('https://api.deepgram.com/v1/auth/grant', {
      method: 'POST', headers: { Authorization: `Token ${env.DEEPGRAM_API_KEY.trim()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttl_seconds: TOKEN_TTL }), signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return json(response.status === 429 ? 429 : 502, { error: response.status === 429 ? 'Deepgram is rate limited. Try again shortly.' : 'Deepgram rejected token issuance. Check the server key permissions and account access.' });
    const data = await response.json();
    if (typeof data.access_token !== 'string' || !data.access_token) return json(502, { error: 'Deepgram returned an invalid token response.' });
    return json(200, { access_token: data.access_token, expires_in: TOKEN_TTL });
  } catch { return json(502, { error: 'Deepgram could not be reached. Please try again.' }); }
  finally { inflight.delete(client); }
}
