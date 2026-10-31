import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
await mkdir('.checks',{recursive:true});
await build({entryPoints:['scripts/check-deepgram.ts'],bundle:true,platform:'node',format:'esm',packages:'external',outfile:'.checks/check-deepgram.mjs'});
await import('../.checks/check-deepgram.mjs');
