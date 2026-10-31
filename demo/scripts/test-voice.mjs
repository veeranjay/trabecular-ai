import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
await mkdir('.checks',{recursive:true});
await build({entryPoints:['src/deepgram.ts'],bundle:true,platform:'node',format:'esm',packages:'external',outfile:'.checks/deepgram.mjs'});
const result=spawnSync(process.execPath,['--test','tests/voice-server.test.mjs','tests/voice-client.test.mjs'],{stdio:'inherit'});
process.exitCode=result.status??1;
