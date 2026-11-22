import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createApp } from 'astro/app/entrypoint';
import { createRequest, writeResponse } from 'astro/app/node';

const app = createApp();
const client = fileURLToPath(new URL('../client/', import.meta.url));
const port = Number(process.env.PORT || 4321);
const host = process.env.HOST || '127.0.0.1';
const types = { css: 'text/css', js: 'text/javascript', svg: 'image/svg+xml', png: 'image/png', woff2: 'font/woff2', ico: 'image/x-icon' };

export function render(request) {
  return app.render(request, { addCookieHeader: true });
}

function start() {
  const server = createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      const path = resolve(client, '.' + pathname);
      const type = types[pathname.split('.').at(-1)];
      if (type && ['GET', 'HEAD'].includes(req.method) && path.startsWith(resolve(client) + sep)) {
        const info = await stat(path).catch(() => null);
        if (info?.isFile()) {
          res.writeHead(200, { 'Content-Type': type, 'Content-Length': info.size, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': pathname.startsWith('/_astro/') ? 'public, max-age=31536000, immutable' : 'no-cache' });
          if (req.method === 'HEAD') { res.end(); return; }
          createReadStream(path).on('error', () => res.destroy()).pipe(res);
          return;
        }
      }
      const request = createRequest(req, { port, bodySizeLimit: 11 * 1024 * 1024, allowedDomains: [] });
      const response = await render(request);
      await writeResponse(response, res);
    } catch (error) {
      if (res.headersSent) { res.destroy(); return; }
      console.error(error.message);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No se pudo procesar la solicitud.');
    }
  });
  server.listen(port, host, () => console.log('Seguimiento municipal en http://' + host + ':' + port));
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) start();
