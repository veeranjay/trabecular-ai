import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
// Local development only. Production functions use Vercel environment variables.
export function loadLocalEnvironment() {
  for (const relative of ['../.env.local', '../.env', '../../backend/.env']) {
    const filename = fileURLToPath(new URL(relative, import.meta.url));
    if (existsSync(filename)) process.loadEnvFile(filename);
  }
}
