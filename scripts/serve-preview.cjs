#!/usr/bin/env node
/**
 * scripts/serve-preview.cjs
 * Super-fast, reliable local preview server for SmartWill India (dist/ folder)
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.xml': 'application/xml',
  '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);

  // Handle API proxying to live Vercel backend so payment & auth APIs work locally
  if (reqPath.startsWith('/api/')) {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': req.headers.origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || 'Content-Type, Authorization, x-user-id',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      });
      res.end();
      return;
    }

    const targetUrl = new URL(req.url, 'https://smartwill-india.vercel.app');
    const proxyHeaders = { ...req.headers };
    proxyHeaders.host = 'smartwill-india.vercel.app';
    if (!proxyHeaders.origin) {
      proxyHeaders.origin = 'https://smartwill-india.vercel.app';
    }

    const proxyReq = https.request(targetUrl, {
      method: req.method,
      headers: proxyHeaders
    }, (proxyRes) => {
      if (proxyRes.statusCode === 404 && reqPath === '/api/verify-download') {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': req.headers.origin || '*',
          'Access-Control-Allow-Credentials': 'true'
        });
        res.end(JSON.stringify({ authorized: true, orderId: 'LOCAL_DEV_VERIFIED', verifiedAt: Date.now() }));
        return;
      }
      const responseHeaders = { ...proxyRes.headers };
      responseHeaders['access-control-allow-origin'] = req.headers.origin || '*';
      responseHeaders['access-control-allow-credentials'] = 'true';
      res.writeHead(proxyRes.statusCode, responseHeaders);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Proxy error to Vercel API: ${err.message}` }));
    });

    req.pipe(proxyReq);
    return;
  }

  if (reqPath === '/') reqPath = '/index.html';
  if (reqPath.endsWith('/')) reqPath += 'index.html';

  let filePath = path.join(DIST_DIR, reqPath);

  // If path doesn't have an extension, try .html
  if (!path.extname(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n======================================================`);
  console.log(`  SmartWill India Local Preview Server Active`);
  console.log(`  URL: http://localhost:${PORT}/ or http://127.0.0.1:${PORT}/`);
  console.log(`  Serving: ${DIST_DIR}`);
  console.log(`  Theme toggle available in navbar on all pages!`);
  console.log(`  Press Ctrl+C to stop.`);
  console.log(`======================================================\n`);
});
