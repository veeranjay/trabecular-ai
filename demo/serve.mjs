import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('dist');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.stl':'application/octet-stream', '.png':'image/png', '.svg':'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    const filename = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (filename !== root && !filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    let file = filename;
    try { if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html'); } catch { file = path.join(root, 'index.html'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-cache' });
    res.end(await readFile(file));
  } catch { res.writeHead(500).end('Unable to load demo'); }
});
server.listen(Number(process.env.PORT || 3100), '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${server.address().port}/`));
