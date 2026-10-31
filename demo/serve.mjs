import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { tokenResponse, configResponse } from './server/deepgram.mjs';
import { loadLocalEnvironment } from './server/load-env.mjs';
loadLocalEnvironment();
const root = path.resolve('dist');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.stl':'application/octet-stream', '.png':'image/png', '.svg':'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname.startsWith('/api/')) {
      if (!['/api/voice-config','/api/deepgram-token'].includes(pathname)) { res.writeHead(404).end(); return; }
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 1024) { res.writeHead(413).end(); return; } chunks.push(chunk); }
      const url = `http://${req.headers.host}${req.url}`;
      const request = new Request(url, { method: req.method, headers: req.headers, ...(['GET','HEAD'].includes(req.method) ? {} : { body: Buffer.concat(chunks) }) });
      const response = pathname === '/api/voice-config' ? configResponse(request) : await tokenResponse(request, { client: req.socket.remoteAddress || 'local' });
      res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(Buffer.from(await response.arrayBuffer())); return;
    }
    const filename = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (filename !== root && !filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    let file = filename;
    try { if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html'); } catch { file = path.join(root, 'index.html'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-cache' });
    res.end(await readFile(file));
  } catch { res.writeHead(500).end('Unable to load demo'); }
});
server.listen(Number(process.env.PORT || 3100), '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${server.address().port}/`));
