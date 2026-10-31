import { configResponse } from '../server/deepgram.mjs';
export default { fetch(request) { return configResponse(request); } };
