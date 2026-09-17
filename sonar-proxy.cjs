#!/usr/bin/env node
/**
 * sonar-proxy.cjs
 * Lightweight local proxy + static file server for sonar-dashboard.html
 * Bypasses CORS when calling tools.publicis.sapient.com/sonar from a browser.
 *
 * Usage:  node sonar-proxy.cjs
 * Then open:  http://localhost:7474/sonar-dashboard.html
 */

const http   = require('http');
const https  = require('https');
const fs     = require('fs');
const path   = require('path');
const url    = require('url');

const PORT        = 7474;
const SONAR_HOST  = 'tools.publicis.sapient.com';
const SONAR_BASE  = '/sonar';
const STATIC_ROOT = __dirname;   // serve files from the project root

// ── MIME types for the static file server ──────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

// ── CORS headers added to every response ──────────────────────────────────
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

// ── Main request handler ───────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  cors(res);

  // Pre-flight
  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return;
  }

  const parsed   = url.parse(req.url, true);
  const pathname = parsed.pathname || '/';

  // ── /proxy/* → forward to SonarQube ─────────────────────────────────────
  if (pathname.startsWith('/proxy/')) {
    const sonarPath = pathname.replace('/proxy', '') + (parsed.search || '');
    console.log(`[proxy] → https://${SONAR_HOST}${sonarPath}`);

    const options = {
      hostname: SONAR_HOST,
      port:     443,
      path:     sonarPath,
      method:   req.method,
      headers: {
        'Authorization': req.headers['authorization'] || '',
        'Accept':        'application/json',
        'User-Agent':    'sonar-dashboard-proxy/1.0',
      },
    };

    const proxyReq = https.request(options, proxyRes => {
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': proxyRes.headers['content-type'] || 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', err => {
      console.error('[proxy] error:', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ errors: [{ msg: `Proxy error: ${err.message}` }] }));
    });

    req.pipe(proxyReq, { end: true });
    return;
  }

  // ── Static file server ────────────────────────────────────────────────────
  let filePath = path.join(STATIC_ROOT, pathname === '/' ? '/sonar-dashboard.html' : pathname);
  // Safety: don't escape the project root
  if (!filePath.startsWith(STATIC_ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`Not found: ${pathname}`);
      return;
    }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  ✅  Sonar proxy + static server running');
  console.log(`  🌐  Open:  http://localhost:${PORT}/sonar-dashboard.html`);
  console.log('');
  console.log('  Press Ctrl+C to stop.');
  console.log('');
});
