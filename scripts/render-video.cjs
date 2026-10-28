// Renders src/index.html frame by frame and encodes out/evolution-of-india.mp4.
// Usage: node scripts/render-video.cjs [fps=30] [start=0] [end=DURATION]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
(async () => {
  const fps = +(process.argv[2] || 30);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('pageerror', e.message));
  await page.goto('file://' + path.resolve(__dirname, '../src/index.html') + '?render');
  const duration = await page.evaluate(() => window.DURATION);
  const start = +(process.argv[3] || 0), end = +(process.argv[4] || duration);
  const outDir = path.resolve(__dirname, '../out');
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, 'evolution-of-india.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg',
    '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.round((end - start) * fps);
  for (let f = 0; f < frames; f++) {
    await page.evaluate(t => window.renderAt(t), start + f / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 300 === 0) console.log(`frame ${f}/${frames}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('wrote', out);
})();
