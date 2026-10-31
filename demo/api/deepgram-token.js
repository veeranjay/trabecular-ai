import { tokenResponse } from '../server/deepgram.mjs';
export default { fetch(request) { return tokenResponse(request, { client: request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown' }); } };
