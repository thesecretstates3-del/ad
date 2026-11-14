// Parallel renderer: splits the timeline into N chunks, renders each with render.cjs in its own browser,
// then joins them losslessly and optionally muxes an audio track.
// Usage: node pilot/tools/render-par.cjs <page> <out.mp4> [workers=4] [fps=30] [audio.wav]
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'); const path = require('path'); const os = require('os');
const [page, out, W = '4', FPS = '30', audio] = process.argv.slice(2);
const workers = +W, fps = +FPS;
(async () => {
  // Ask the page for its duration via a 1-frame stills call is overkill; render.cjs prints nothing about it,
  // so read it with a tiny probe run.
  const probe = execFileSync('node', [path.join(__dirname, 'render.cjs'), page, '--duration'],
    { cwd: path.resolve(__dirname, '..', '..') }).toString().match(/DURATION=([\d.]+)/)[1];
  const total = Math.round(+probe * fps);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rpar-'));
  const t0 = Date.now();
  const parts = [];
  await Promise.all(Array.from({ length: workers }, (_, i) => new Promise((res, rej) => {
    const a = Math.floor(i * total / workers), b = Math.floor((i + 1) * total / workers);
    const f = path.join(tmp, `part${i}.mp4`); parts[i] = f;
    const p = spawn('node', [path.join(__dirname, 'render.cjs'), page, f, String(fps), String(a / fps), String(b / fps)],
      { cwd: path.resolve(__dirname, '..', '..'), stdio: ['ignore', 'ignore', 'inherit'] });
    p.on('close', c => c === 0 ? res() : rej(new Error('worker ' + i + ' failed')));
  })));
  fs.writeFileSync(path.join(tmp, 'list.txt'), parts.map(p => `file '${p}'`).join('\n'));
  const joined = audio ? path.join(tmp, 'joined.mp4') : out;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c', 'copy', joined]);
  if (audio) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', joined, '-i', audio, '-map', '0:v', '-map', '1:a',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-af', 'apad', '-shortest', out]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`wrote ${out}: ${total} frames, ${workers} workers, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
})().catch(e => { console.error(e.message); process.exit(1); });
