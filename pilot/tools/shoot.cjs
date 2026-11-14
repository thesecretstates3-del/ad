// Usage: node pilot/tools/shoot.cjs <page path relative to repo root> <out.png> [width] [height]
// Serves the repo root on a random free port, opens the page in headless Chromium,
// waits for window.__READY === true (set it after drawing), fails on page errors, and saves a PNG.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..', '..');
const [, , page = '', out = 'shot.png', w = '1920', h = '1080'] = process.argv;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.map': 'application/json' };

const server = http.createServer((req, res) => {
  if (req.url === '/favicon.ico') { res.writeHead(204); return res.end(); }
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

server.listen(0, async () => {
  const port = server.address().port;
  const browser = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  const errors = [];
  pg.on('pageerror', e => errors.push('pageerror: ' + e.message));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  pg.on('response', r => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ' ' + r.url()); });
  try {
    await pg.goto(`http://127.0.0.1:${port}/${page}`);
    await pg.waitForFunction(() => window.__READY === true, null, { timeout: 30000 });
    await pg.screenshot({ path: out });
    console.log('saved', out);
  } catch (e) { errors.push(String(e)); }
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  await browser.close(); server.close();
});
