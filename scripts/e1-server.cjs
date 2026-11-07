'use strict';

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const ROOT = path.resolve(__dirname, '..', 'design');
const MODULES = Object.freeze([
  ['calendar', 'Calendario'], ['missions', 'Missioni'], ['planner', 'Planner'],
  ['studio', 'Studio · KnowStudy'], ['recovery', 'Recovery'], ['flashcards', 'Flashcard'],
  ['library', 'Biblioteca'], ['leo', 'LEO Protocol'], ['engineer', 'Engineer'],
  ['agora', 'Agora'], ['nexus', 'Nexus'], ['second-brain', 'Second Brain'],
  ['jarvis', 'Jarvis · Atlas'], ['diary', 'Diario'], ['life-rpg', 'Life RPG'],
  ['arte-musica', 'Arte & Musica'], ['agent-center', 'Agent Center'], ['polyfeed', 'PolyFeed']
]);
const ROUTES = new Map([
  ['/', 'hub-redesign/e1-strumentazione.html'],
  ['/hub-redesign/e1-strumentazione.html', 'hub-redesign/e1-strumentazione.html'],
  ['/hub-redesign/shared/base.css', 'hub-redesign/shared/base.css'],
  ['/hub-redesign/shared/content.js', 'hub-redesign/shared/content.js'],
  ['/hub-redesign/shared/hub-e.css', 'hub-redesign/shared/hub-e.css'],
  ['/hub-redesign/shared/hub-e.js', 'hub-redesign/shared/hub-e.js'],
  ['/app-shell.js', '../app-shell.js']
]);
const MIME = Object.freeze({
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2'
});

for (const [slug] of MODULES) ROUTES.set(`/module-redesign/${slug}/index.html`, `module-redesign/${slug}/index.html`);
function resolveRoute(pathname) {
  if (ROUTES.has(pathname)) return ROUTES.get(pathname);
  const match = /^\/module-redesign\/([a-z0-9-]+)\/([a-z0-9-]+\.(?:css|js))$/.exec(pathname);
  if (!match || !MODULES.some(([slug]) => slug === match[1])) return null;
  return `module-redesign/${match[1]}/${match[2]}`;
}
function createPrototypeServer({ root = ROOT } = {}) {
  const designRoot = path.resolve(root);
  return http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); }
    catch { res.writeHead(400); res.end(); return; }
    if (pathname === '/hub-redesign/index.html') { res.writeHead(302, { Location: '/', 'Cache-Control': 'no-store' }); res.end(); return; }
    const relative = resolveRoute(pathname);
    if (!relative) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Pagina non inclusa'); return; }
    const file = path.resolve(designRoot, relative);
    const shellFile = path.resolve(designRoot, '../app-shell.js');
    if (pathname === '/app-shell.js' ? file !== shellFile : !file.startsWith(designRoot + path.sep)) { res.writeHead(403); res.end(); return; }
    let body;
    try { body = fs.readFileSync(file); } catch { res.writeHead(404); res.end(); return; }
    const ext = path.extname(file).toLowerCase();
    const headers = {
      'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'"
    };
    if (ext === '.html') {
      body = Buffer.from(body.toString('utf8').replace('</body>', '<script src="/app-shell.js"></script></body>'));
    }
    headers['Content-Length'] = String(body.length);
    res.writeHead(200, headers); res.end(req.method === 'HEAD' ? undefined : body);
  });
}

if (require.main === module) {
  const server = createPrototypeServer();
  server.listen(0, '127.0.0.1', () => console.log(`PolyLife · prototipi E1: http://127.0.0.1:${server.address().port}/`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}

module.exports = { createPrototypeServer, MODULES };
