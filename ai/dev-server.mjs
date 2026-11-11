#!/usr/bin/env node
/**
 * Local AI app server + NVIDIA CORS proxy (same-origin /nvidia).
 * Usage: node ai/dev-server.mjs
 * Open:  http://127.0.0.1:5500/
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const PORT = Number(process.env.PORT || 5500);
const HOST = process.env.HOST || '127.0.0.1';
const NVIDIA_API = 'https://integrate.api.nvidia.com/v1/chat/completions';
const ALLOWED_MODELS = new Set(['deepseek-ai/deepseek-v4.1-flash']);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.md': 'text/markdown; charset=utf-8',
  '.ico': 'image/x-icon'
};

const cors = (req) => ({
  'Access-Control-Allow-Origin': req.headers.origin || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
});

const readBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

const safeJoin = (root, urlPath) => {
  const decoded = decodeURIComponent((urlPath || '/').split('?')[0]);
  const clean = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const full = path.join(root, clean);
  if (!full.startsWith(root)) return null;
  return full;
};

const serveStatic = (req, res, urlPath) => {
  let filePath = safeJoin(ROOT, urlPath === '/' ? '/index.html' : urlPath);
  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  fs.createReadStream(filePath).pipe(res);
};

const handleNvidia = async (req, res) => {
  const headers = cors(req);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    res.end();
    return;
  }
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers });
    res.end(JSON.stringify({ ok: true, route: 'nvidia', v: 'dev-server' }));
    return;
  }
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json', ...headers });
    res.end(JSON.stringify({ error: { message: 'Method not allowed' } }));
    return;
  }

  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    res.writeHead(401, { 'Content-Type': 'application/json', ...headers });
    res.end(JSON.stringify({ error: { message: 'Missing Authorization header' } }));
    return;
  }

  let body;
  try {
    body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json', ...headers });
    res.end(JSON.stringify({ error: { message: 'Invalid JSON' } }));
    return;
  }

  if (!ALLOWED_MODELS.has(body.model)) {
    res.writeHead(400, { 'Content-Type': 'application/json', ...headers });
    res.end(JSON.stringify({ error: { message: 'Model not allowed' } }));
    return;
  }
  if (!Array.isArray(body.messages) || !body.messages.length) {
    res.writeHead(400, { 'Content-Type': 'application/json', ...headers });
    res.end(JSON.stringify({ error: { message: 'messages is required' } }));
    return;
  }
  if (body.stream !== true) {
    res.writeHead(400, { 'Content-Type': 'application/json', ...headers });
    res.end(JSON.stringify({ error: { message: 'stream must be true' } }));
    return;
  }

  let upstream;
  try {
    upstream = await fetch(NVIDIA_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth
      },
      body: JSON.stringify(body)
    });
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json', ...headers });
    res.end(JSON.stringify({ error: { message: 'Upstream fetch failed: ' + (err?.message || err) } }));
    return;
  }

  const outHeaders = {
    'Content-Type': upstream.headers.get('Content-Type') || 'text/event-stream',
    'Cache-Control': 'no-cache',
    ...headers
  };
  res.writeHead(upstream.status, outHeaders);
  if (!upstream.body) {
    res.end();
    return;
  }
  const reader = upstream.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
  } catch {
    /* client aborted */
  }
  res.end();
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
  if (url.pathname === '/nvidia' || url.pathname.endsWith('/nvidia')) {
    await handleNvidia(req, res);
    return;
  }
  serveStatic(req, res, url.pathname);
});

server.listen(PORT, HOST, () => {
  console.log(`Vutaso AI local server: http://${HOST}:${PORT}/`);
  console.log(`NVIDIA proxy (same-origin): http://${HOST}:${PORT}/nvidia`);
});
