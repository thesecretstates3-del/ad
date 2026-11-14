// Frame-by-frame video renderer for pilot pages.
// The page must define window.DURATION (seconds) and window.renderAt(t) (may be async), and set window.__READY = true.
// Usage:
//   node pilot/tools/render.cjs <page> <out.mp4> [fps=30] [start=0] [end=DURATION]
//   node pilot/tools/render.cjs <page> --stills <outDir> t1 t2 ...   (PNG stills at given seconds, for review)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..', '..');
const args = process.argv.slice(2);
const pagePath = args[0];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.map': 'application/json',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.wav': 'audio/wav', '.mp3': 'audio/mpeg' };
const server = http.createServer((req, res) => {
  if (req.url === '/favicon.ico') { res.writeHead(204); return res.end(); }
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

server.listen(0, async () => {
  const port = server.address().port;
  const browser = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ' ' + r.url()); });
  const fail = async (msg) => { console.error(msg + '\n' + errors.join('\n')); await browser.close(); server.close(); process.exit(1); };
  try {
    await page.goto(`http://127.0.0.1:${port}/${pagePath}?render`);
    await page.waitForFunction(() => window.__READY === true, null, { timeout: 60000 });
  } catch (e) { return fail('page did not become ready: ' + e); }
  if (errors.length) return fail('errors while loading');

  if (args[1] === '--stills') {
    const outDir = args[2]; fs.mkdirSync(outDir, { recursive: true });
    for (const ts of args.slice(3)) {
      await page.evaluate(t => window.renderAt(t), +ts);
      const f = path.join(outDir, `t${(+ts).toFixed(2).padStart(6, '0')}.png`);
      await page.screenshot({ path: f }); console.log('saved', f);
    }
  } else {
    const out = args[1];
    const fps = +(args[2] || 30);
    const duration = await page.evaluate(() => window.DURATION);
    const start = +(args[3] || 0), end = +(args[4] || duration);
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const frames = Math.round((end - start) * fps);
    const t0 = Date.now();
    for (let f = 0; f < frames; f++) {
      await page.evaluate(t => window.renderAt(t), start + f / fps);
      const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (f % 60 === 0) console.log(`frame ${f}/${frames} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
      if (f % 10 === 0 || f === frames - 1) try { fs.writeFileSync(`/tmp/render-progress-${process.pid}.json`,
        JSON.stringify({ out, frame: f + 1, frames, elapsed: (Date.now() - t0) / 1000 })); } catch (e) {}
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    console.log('wrote', out, 'in', ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  await browser.close(); server.close();
});
