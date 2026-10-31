import { build } from 'esbuild';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
await build({ entryPoints: ['src/main.tsx'], bundle: true, outdir: 'dist', entryNames: 'app', minify: true, sourcemap: false, jsx: 'automatic', target: ['es2022'], external: ['/fonts/*'], define: { 'process.env.NODE_ENV': '"production"' } });
const html = (await readFile('index.html', 'utf8')).replace('<script type="module" src="/src/main.tsx"></script>', '<link rel="stylesheet" href="/app.css"><script type="module" src="/app.js"></script>');
await writeFile('dist/index.html', html);
await cp('public', 'dist', { recursive: true });
console.log('Built self-contained browser demo in demo/dist. No backend or cloud services required.');
