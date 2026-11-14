// "Oli" — paper cut-out / collage rig for PixiJS v8.
// Every body part is its own Container + Sprite whose texture is a procedurally generated
// piece of craft paper (seeded grain, scissor-cut jittered edge, cream border, baked drop shadow).
import { Container, Sprite, Texture } from 'pixi.js';

export const PAL = {
  ink: '#1E1B24', skin: '#F2C9A8', skinSh: '#D9A383', blush: '#F28C7A',
  hair: '#3B2A22', hairSh: '#2A1D17', hood: '#F2B33D', hoodSh: '#C98E25',
  cream: '#FFF4DC', pants: '#26305A', pantsSh: '#1A2142', shoe: '#F7F3EA', shoeSh: '#D8D2C4',
  stripe: '#FF5D5D', teal: '#2EC4B6', bg: '#F4EAD5', border: '#FAF1DC',
};

// ---------------------------------------------------------------- seeded randomness
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// ---------------------------------------------------------------- polygon helpers
const TAU = Math.PI * 2;
export function ell(cx, cy, rx, ry, rot = 0, pow = 2) {
  const n = Math.max(20, Math.ceil(Math.PI * (rx + ry) / 3));
  const out = [], c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU, ct = Math.cos(t), st = Math.sin(t);
    const x = rx * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / pow);
    const y = ry * Math.sign(st) * Math.pow(Math.abs(st), 2 / pow);
    out.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return out;
}
// polygon with rounded corners (radius r or per-vertex array)
export function rpoly(pts, r) {
  const out = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[(i + n - 1) % n], v = pts[i], q = pts[(i + 1) % n];
    const ri = Array.isArray(r) ? r[i] : r;
    const l1 = Math.hypot(p[0] - v[0], p[1] - v[1]), l2 = Math.hypot(q[0] - v[0], q[1] - v[1]);
    const rr = Math.min(ri, l1 / 2, l2 / 2);
    const a = [v[0] + (p[0] - v[0]) / l1 * rr, v[1] + (p[1] - v[1]) / l1 * rr];
    const b = [v[0] + (q[0] - v[0]) / l2 * rr, v[1] + (q[1] - v[1]) / l2 * rr];
    const steps = rr < 1 ? 1 : 8;
    for (let k = 0; k <= steps; k++) {
      const t = k / steps, u = 1 - t;
      out.push([u * u * a[0] + 2 * u * t * v[0] + t * t * b[0], u * u * a[1] + 2 * u * t * v[1] + t * t * b[1]]);
    }
  }
  return out;
}
export const rrect = (x, y, w, h, r) => rpoly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], r);
export function cap(x1, y1, x2, y2, r1, r2) {
  const a = Math.atan2(y2 - y1, x2 - x1), out = [], N = 14;
  for (let i = 0; i <= N; i++) { const t = a + Math.PI / 2 + (i / N) * Math.PI; out.push([x1 + Math.cos(t) * r1, y1 + Math.sin(t) * r1]); }
  for (let i = 0; i <= N; i++) { const t = a - Math.PI / 2 + (i / N) * Math.PI; out.push([x2 + Math.cos(t) * r2, y2 + Math.sin(t) * r2]); }
  return out;
}
export function catmull(P, n = 10, closed = false) {
  const out = [], N = P.length;
  const g = (i) => closed ? P[(i + N) % N] : P[Math.max(0, Math.min(N - 1, i))];
  const segs = closed ? N : N - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((d) => 0.5 * ((2 * p1[d]) + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
    }
  }
  if (!closed) out.push(P[N - 1].slice());
  return out;
}
// thick brush stroke along a centre line (tapering width) with round caps -> array of polys
export function strokeR(line, w0, w1 = w0, caps = true) {
  const L = [], R = [], n = line.length;
  for (let i = 0; i < n; i++) {
    const a = line[Math.max(0, i - 1)], b = line[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * (i / (n - 1))) / 2;
    L.push([line[i][0] - dy / d * w, line[i][1] + dx / d * w]);
    R.push([line[i][0] + dy / d * w, line[i][1] - dx / d * w]);
  }
  const polys = [L.concat(R.reverse())];
  if (caps) { polys.push(ell(line[0][0], line[0][1], w0 / 2, w0 / 2)); polys.push(ell(line[n - 1][0], line[n - 1][1], w1 / 2, w1 / 2)); }
  return polys;
}
const area = (p) => { let s = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; s += p[i][0] * q[1] - q[0] * p[i][1]; } return s / 2; };

// scissor cut: keep sharp corners, thin smooth runs to ~step spacing, jitter along the normal
function cut(poly, rng, amp, step) {
  if (area(poly) < 0) poly = poly.slice().reverse();
  const n = poly.length, dense = [], corner = [];
  for (let i = 0; i < n; i++) {
    const p = poly[(i + n - 1) % n], a = poly[i], b = poly[(i + 1) % n];
    const t1 = Math.atan2(a[1] - p[1], a[0] - p[0]), t2 = Math.atan2(b[1] - a[1], b[0] - a[0]);
    let dt = Math.abs(t2 - t1); if (dt > Math.PI) dt = TAU - dt;
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.ceil(L / 2));
    for (let j = 0; j < k; j++) { dense.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]); corner.push(j === 0 && dt > 0.7); }
  }
  const pick = []; let acc = 0;
  for (let i = 0; i < dense.length; i++) {
    if (i === 0 || corner[i] || acc >= step) { pick.push({ p: dense[i], c: corner[i] }); acc = 0; }
    const nx = dense[(i + 1) % dense.length];
    acc += Math.hypot(nx[0] - dense[i][0], nx[1] - dense[i][1]);
  }
  const ph = rng() * 6.28, m = pick.length, out = [];
  for (let i = 0; i < m; i++) {
    const a = pick[(i + m - 1) % m].p, b = pick[(i + 1) % m].p, p = pick[i];
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const k = p.c ? 0.15 : 1;
    const o = ((rng() * 2 - 1) * amp + amp * 0.8 * Math.sin(i * 0.55 + ph)) * k;
    out.push([p.p[0] + dy / d * o, p.p[1] - dx / d * o]);
  }
  return out;
}

// ---------------------------------------------------------------- paper textures
let GRAIN = null;
function grainTile() {
  if (GRAIN) return GRAIN;
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), rng = mulberry32(90210);
  const img = g.createImageData(S, S);
  for (let i = 0; i < S * S; i++) {
    const v = rng(), light = v > 0.5;
    const a = Math.pow(Math.abs(v - 0.5) * 2, 1.6) * 34;
    img.data[i * 4] = light ? 255 : 40; img.data[i * 4 + 1] = light ? 250 : 28; img.data[i * 4 + 2] = light ? 235 : 16; img.data[i * 4 + 3] = a;
  }
  g.putImageData(img, 0, 0);
  g.lineCap = 'round';
  for (let i = 0; i < 1400; i++) {
    const x = rng() * S, y = rng() * S, len = 6 + rng() * 26, a = rng() * TAU, bend = (rng() - 0.5) * 1.2;
    const light = rng() > 0.45;
    g.strokeStyle = light ? `rgba(255,250,235,${0.07 + rng() * 0.12})` : `rgba(70,45,20,${0.04 + rng() * 0.09})`;
    g.lineWidth = 0.5 + rng() * 0.9;
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      g.beginPath(); g.moveTo(x + ox, y + oy);
      g.quadraticCurveTo(x + ox + Math.cos(a + bend) * len / 2, y + oy + Math.sin(a + bend) * len / 2, x + ox + Math.cos(a) * len, y + oy + Math.sin(a) * len);
      g.stroke();
    }
  }
  GRAIN = c; return c;
}

const CACHE = new Map();
const pathPolys = (g, polys) => { g.beginPath(); for (const p of polys) { g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]); g.closePath(); } };

// shapes: [{polys, fill, border=6, jit, step, details:[{polys,fill,alpha}], dots:{color,alpha,gap,r}, stripes, alpha, sh=1, grain=1, gloss}]
export function buildPaper(key, shapes, res) {
  const ck = key + '@' + res;
  if (CACHE.has(ck)) return CACHE.get(ck);
  const rng = mulberry32(hashStr(key));
  const prep = shapes.map((s) => {
    const border = s.border ?? 6, amp = s.jit ?? 1.3, step = s.step ?? 15;
    return { ...s, border,
      polys: s.polys.map((p) => cut(p, rng, amp, step)),
      cream: border > 0 ? s.polys.map((p) => cut(p, rng, amp * 1.4, step * 0.85)) : null };
  });
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of prep) for (const p of (s.cream || s.polys)) for (const q of p) {
    x0 = Math.min(x0, q[0] - s.border); y0 = Math.min(y0, q[1] - s.border); x1 = Math.max(x1, q[0] + s.border); y1 = Math.max(y1, q[1] + s.border);
  }
  const pad = 20; x0 = Math.floor(x0 - pad); y0 = Math.floor(y0 - pad); x1 = Math.ceil(x1 + pad); y1 = Math.ceil(y1 + pad);
  const W = Math.ceil((x1 - x0) * res), H = Math.ceil((y1 - y0) * res);
  const M = document.createElement('canvas'); M.width = W; M.height = H;
  const T = document.createElement('canvas'); T.width = W; T.height = H;
  const m = M.getContext('2d'), t = T.getContext('2d');
  const grain = t.createPattern(grainTile(), 'repeat');
  for (const s of prep) {
    t.setTransform(1, 0, 0, 1, 0, 0); t.clearRect(0, 0, W, H);
    t.globalCompositeOperation = 'source-over'; t.globalAlpha = 1;
    t.setTransform(res, 0, 0, res, -x0 * res, -y0 * res);
    t.lineJoin = 'round'; t.lineCap = 'round';
    if (s.border > 0) {
      for (const p of s.cream) {
        pathPolys(t, [p]);
        t.lineWidth = s.border * 2 + 1.8; t.strokeStyle = 'rgba(95,65,35,0.30)'; t.stroke();
        t.lineWidth = s.border * 2; t.strokeStyle = PAL.border; t.stroke();
        t.fillStyle = PAL.border; t.fill();
      }
    }
    t.fillStyle = s.fill;
    for (const p of s.polys) { pathPolys(t, [p]); t.fill(); }
    t.save();
    pathPolys(t, s.polys); t.clip();
    for (const d of (s.details || [])) {
      t.globalAlpha = d.alpha ?? 1; t.fillStyle = d.fill;
      for (const p of d.polys) { pathPolys(t, [p]); t.fill(); }
    }
    t.globalAlpha = 1;
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const p of s.polys) for (const q of p) { bx0 = Math.min(bx0, q[0]); by0 = Math.min(by0, q[1]); bx1 = Math.max(bx1, q[0]); by1 = Math.max(by1, q[1]); }
    if (s.dots) {
      t.fillStyle = s.dots.color; t.globalAlpha = s.dots.alpha ?? 0.3; const gap = s.dots.gap ?? 9;
      for (let yy = by0, r = 0; yy < by1; yy += gap * 0.866, r++) for (let xx = bx0 + (r % 2 ? gap / 2 : 0); xx < bx1; xx += gap) { t.beginPath(); t.arc(xx, yy, s.dots.r ?? 1.7, 0, TAU); t.fill(); }
      t.globalAlpha = 1;
    }
    if (s.stripes) {
      t.strokeStyle = s.stripes.color; t.globalAlpha = s.stripes.alpha ?? 0.15; t.lineWidth = 1.2;
      for (let xx = bx0; xx < bx1; xx += s.stripes.gap ?? 8) { t.beginPath(); t.moveTo(xx, by0); t.lineTo(xx, by1); t.stroke(); }
      t.globalAlpha = 1;
    }
    if (s.gloss !== 0) {
      const gr = t.createLinearGradient(bx0, by0, bx1, by1);
      const k = s.gloss ?? 0.11;
      gr.addColorStop(0, `rgba(255,248,230,${k})`); gr.addColorStop(0.55, 'rgba(255,255,255,0)'); gr.addColorStop(1, `rgba(40,20,0,${k})`);
      t.fillStyle = gr; t.fillRect(bx0 - 2, by0 - 2, bx1 - bx0 + 4, by1 - by0 + 4);
    }
    pathPolys(t, s.polys); t.lineWidth = 2.6; t.strokeStyle = 'rgba(40,20,0,0.16)'; t.stroke();
    t.restore();
    // grain over everything in this layer
    t.setTransform(1, 0, 0, 1, 0, 0);
    t.globalCompositeOperation = 'source-atop';
    t.globalAlpha = s.grain ?? 1;
    const gm = new DOMMatrix().translate(rng() * 512, rng() * 512).scale(res / 2);
    grain.setTransform(gm); t.fillStyle = grain; t.fillRect(0, 0, W, H);
    t.globalCompositeOperation = 'source-over'; t.globalAlpha = 1;
    // stack onto part canvas with soft drop shadow
    const sh = s.sh ?? 1;
    m.save(); m.globalAlpha = s.alpha ?? 1;
    if (sh > 0) { m.shadowColor = 'rgba(45,28,10,0.27)'; m.shadowBlur = 5.5 * res * Math.max(0.5, sh); m.shadowOffsetX = 4 * res * sh; m.shadowOffsetY = 6 * res * sh; }
    m.drawImage(T, 0, 0); m.restore();
  }
  const tex = Texture.from(M);
  tex.source.scaleMode = 'linear';
  const rec = { tex, x: x0, y: y0, res };
  CACHE.set(ck, rec);
  return rec;
}

export function paperSprite(key, shapes, res = 2) {
  const r = buildPaper(key, shapes, res);
  const s = new Sprite(r.tex);
  s.scale.set(1 / res); s.position.set(r.x, r.y);
  return s;
}
// A named paper piece as a Container (origin = pivot)
export function paperPiece(key, shapes, res = 2) {
  const c = new Container(); c.label = key; c.addChild(paperSprite(key, shapes, res)); return c;
}

// kraft / cardboard background
export function paperBackground(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), rng = mulberry32(4242);
  g.fillStyle = PAL.bg; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) {
    const x = rng() * w, y = rng() * h, r = 120 + rng() * 380, warm = rng() > 0.5;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, warm ? `rgba(214,168,98,${0.04 + rng() * 0.05})` : `rgba(255,248,225,${0.08 + rng() * 0.09})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }
  // faint corrugation bands
  for (let y = 0; y < h; y += 6) { g.fillStyle = `rgba(190,130,60,${y % 12 === 0 ? 0.03 : 0.0})`; g.fillRect(0, y, w, 2); }
  g.lineCap = 'round';
  for (let i = 0; i < 16000; i++) {
    const x = rng() * w, y = rng() * h, len = 5 + rng() * 34, a = rng() * TAU, light = rng() > 0.5;
    g.strokeStyle = light ? `rgba(255,252,240,${0.10 + rng() * 0.18})` : `rgba(150,100,45,${0.03 + rng() * 0.05})`;
    g.lineWidth = 0.5 + rng() * 0.9;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.5) * len / 2, y + Math.sin(a + 0.5) * len / 2, x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
  }
  for (let i = 0; i < 5000; i++) {
    g.fillStyle = rng() > 0.5 ? `rgba(110,70,30,${0.10 + rng() * 0.2})` : `rgba(255,255,255,${0.2 + rng() * 0.3})`;
    g.fillRect(rng() * w, rng() * h, 1 + rng() * 1.5, 1 + rng() * 1.5);
  }
  const v = g.createRadialGradient(w / 2, h / 2, h * 0.45, w / 2, h / 2, w * 0.68);
  v.addColorStop(0, 'rgba(90,55,20,0)'); v.addColorStop(1, 'rgba(120,70,20,0.24)');
  g.fillStyle = v; g.fillRect(0, 0, w, h);
  const tex = Texture.from(c); return new Sprite(tex);
}

// ---------------------------------------------------------------- character part definitions
const S = (polys, fill, o = {}) => ({ polys: Array.isArray(polys[0][0]) ? polys : [polys], fill, ...o });
const D = (polys, fill, alpha = 1) => ({ polys: Array.isArray(polys[0][0]) ? polys : [polys], fill, alpha });
const flip = (shapes) => shapes.map((s) => ({
  ...s, polys: s.polys.map((p) => p.map(([x, y]) => [-x, y])),
  details: s.details && s.details.map((d) => ({ ...d, polys: d.polys.map((p) => p.map(([x, y]) => [-x, y])) })),
}));
const line = (pts, w0, w1, n = 8) => strokeR(catmull(pts, n), w0, w1 ?? w0);
const FEAT = { border: 0, jit: 0.45, step: 6, sh: 0.5, grain: 0.5, gloss: 0 };

const DEFS = {
  // ---- torso & clothing
  torso: () => [S(rpoly([[-62, -154], [62, -154], [98, -134], [112, -60], [108, 24], [-108, 24], [-112, -60], [-98, -134]], [12, 12, 30, 24, 14, 14, 24, 30]), PAL.hood, {
    jit: 1.6, step: 17,
    details: [
      D(rrect(-130, 0, 260, 40, 0), PAL.hoodSh, 0.95),
      D(rrect(70, -170, 70, 220, 0), PAL.hoodSh, 0.33),
      D(line([[-84, -112], [-92, -84], [-96, -58]], 3, 3), PAL.hoodSh, 0.7),
      D(line([[84, -112], [92, -84], [96, -58]], 3, 3), PAL.hoodSh, 0.7),
      D(line([[-96, 4], [96, 4]], 3, 3, 3), PAL.hoodSh, 0.8),
    ] })],
  hood_collar: () => [S(ell(0, 6, 98, 40), PAL.hoodSh, { jit: 1.8, step: 15, details: [
    D(ell(0, -2, 62, 22), PAL.skinSh, 1),
    D(ell(0, 22, 90, 20), PAL.hood, 0.45),
    D(line([[-70, 10], [-40, 24], [-10, 26]], 3, 3), PAL.hoodSh, 0.9),
    D(line([[70, 10], [40, 24], [10, 26]], 3, 3), '#8E6218', 0.45),
  ] })],
  strings: () => [
    S(line([[-26, 0], [-30, 30], [-27, 60]], 8, 7), PAL.cream, { border: 1.5, sh: 0.8, jit: 0.5, step: 7, gloss: 0 }),
    S(ell(-27, 63, 5, 8), PAL.hoodSh, { border: 0, sh: 0.3, jit: 0.3, step: 5, gloss: 0 }),
    S(line([[26, 0], [30, 34], [28, 70]], 8, 7), PAL.cream, { border: 1.5, sh: 0.8, jit: 0.5, step: 7, gloss: 0 }),
    S(ell(28, 73, 5, 8), PAL.hoodSh, { border: 0, sh: 0.3, jit: 0.3, step: 5, gloss: 0 }),
  ],
  pocket: () => [S(rpoly([[-64, 0], [64, 0], [80, 54], [-80, 54]], [6, 6, 14, 14]), PAL.hood, {
    border: 4.5, jit: 1.1, step: 14, dots: { color: PAL.hoodSh, alpha: 0.5, gap: 9, r: 1.8 },
    details: [
      D(line([[-70, 8], [-52, 6]], 3, 3, 2), PAL.hoodSh, 0.0),
      D(line([[-54, 7], [54, 7]], 3, 3, 2), PAL.cream, 0.0),
      D(rrect(-70, 44, 140, 20, 0), PAL.hoodSh, 0.55),
    ] })],
  pin: () => [S([...line([[0, 20], [0, 0]], 8, 8, 2), ...line([[0, 2], [-15, -18]], 8, 8, 2), ...line([[0, 2], [15, -18]], 8, 8, 2)], PAL.teal, { border: 3.5, jit: 0.5, step: 6, sh: 0.7, gloss: 0.08 })],

  // ---- arms (L drawn; R reuses with its own key for different cut jitter)
  arm_upper: () => [S(cap(0, 0, 0, 78, 27, 24), PAL.hood, { jit: 1.3, step: 15, details: [D(rrect(10, -40, 50, 150, 0), PAL.hoodSh, 0.32), D(line([[-12, 40], [-6, 56], [2, 66]], 2.6, 2.6), PAL.hoodSh, 0.7)] })],
  arm_lower: () => [S(cap(0, 0, 0, 48, 24, 22), PAL.hood, { jit: 1.2, step: 14, details: [
    D(rrect(8, -30, 40, 120, 0), PAL.hoodSh, 0.3),
    D(rrect(-40, 40, 80, 40, 0), PAL.hoodSh, 0.95),
    D(line([[-22, 40], [22, 40]], 2.5, 2.5, 2), '#8E6218', 0.4),
  ] })],
  hand_open: () => [S([rrect(-17, -10, 34, 46, 15), ell(21, 6, 10, 15, 0.3)], PAL.skin, { border: 5, jit: 0.9, step: 11, details: [D(ell(-8, 30, 16, 12), PAL.skinSh, 0.5)] })],
  hand_point: () => [S([rrect(-17, -10, 34, 36, 15), ell(21, 4, 10, 14, 0.3), rrect(-7, 14, 14, 42, 7)], PAL.skin, { border: 5, jit: 0.9, step: 11, details: [D(ell(0, 30, 13, 8), PAL.skinSh, 0.35)] })],

  // ---- legs & shoes
  leg_upper: () => [S(cap(0, 0, 0, 76, 28, 25), PAL.pants, { jit: 1.3, step: 15, stripes: { color: '#8FA0D8', alpha: 0.12, gap: 8 }, details: [D(rrect(10, -40, 50, 150, 0), PAL.pantsSh, 0.55)] })],
  leg_lower: () => [S(cap(0, 0, 0, 74, 25, 22), PAL.pants, { jit: 1.2, step: 14, stripes: { color: '#8FA0D8', alpha: 0.12, gap: 8 }, details: [D(rrect(8, -30, 40, 130, 0), PAL.pantsSh, 0.55), D(rrect(-40, 58, 80, 30, 0), PAL.pantsSh, 0.9)] })],
  foot: () => [S(rrect(-36, -14, 90, 44, 17), PAL.shoe, { border: 5, jit: 1.0, step: 12, details: [
    D(rrect(-60, 14, 140, 24, 0), PAL.shoeSh, 1),
    D(rrect(-60, 20, 140, 5, 0), PAL.stripe, 1),
    D(ell(46, 2, 14, 13), PAL.shoeSh, 0.4),
    D(line([[0, -6], [14, -2]], 2.5, 2.5, 2), PAL.shoeSh, 1),
    D(line([[12, -8], [26, -3]], 2.5, 2.5, 2), PAL.shoeSh, 1),
  ] })],

  // ---- head
  hair_back: () => {
    const base = ell(0, -118, 152, 114).map(([x, y]) => (y > -44 ? [x * (1 - (y + 44) / 300), -44 + (y + 44) * 0.12] : [x, y]));
    return [S(base, PAL.hair, { jit: 2.0, step: 17, details: [
      D(line([[-118, -90], [-126, -60], [-112, -46]], 3, 3), PAL.hairSh, 0.8),
      D(line([[118, -90], [126, -60], [112, -46]], 3, 3), PAL.hairSh, 0.8),
      D(rrect(-200, -60, 400, 60, 0), PAL.hairSh, 0.6),
    ] })];
  },
  skull: () => [
    S(ell(-139, -82, 17, 24), PAL.skin, { border: 5, jit: 0.8, step: 10, details: [D(ell(-137, -82, 8, 13), PAL.skinSh, 0.8)] }),
    S(ell(139, -82, 17, 24), PAL.skin, { border: 5, jit: 0.8, step: 10, details: [D(ell(137, -82, 8, 13), PAL.skinSh, 0.8)] }),
    S(ell(0, -102, 138, 104, 0, 2.5), PAL.skin, { jit: 1.5, step: 17, details: [D(ell(0, -260, 150, 160), PAL.skinSh, 0.0)] }),
  ],
  hair_front: () => {
    const top = [];
    for (let i = 0; i <= 30; i++) { const t = Math.PI + 0.25 - (i / 30) * (Math.PI + 0.5); top.push([146 * Math.cos(t), -104 - 118 * Math.sin(t)]); }
    // top currently runs from left sideburn over the top to the right sideburn
    const tips = [[132, -52], [100, -128], [60, -146], [14, -156], [-34, -150], [-82, -136], [-124, -108], [-136, -58]];
    const bottom = [];
    for (let i = 0; i < tips.length; i++) {
      bottom.push(tips[i]);
      if (i < tips.length - 1) { const a = tips[i], b = tips[i + 1]; bottom.push([(a[0] + b[0]) / 2 + 3, (a[1] + b[1]) / 2 - 15]); }
    }
    return [S(top.concat(bottom), PAL.hair, { jit: 1.7, step: 16, details: [
      D(line([[-90, -196], [-60, -168], [-44, -150]], 3.2, 3.2), PAL.hairSh, 0.85),
      D(line([[-10, -208], [0, -180], [8, -160]], 3.2, 3.2), PAL.hairSh, 0.85),
      D(line([[60, -204], [66, -178], [58, -152]], 3.2, 3.2), PAL.hairSh, 0.85),
      D(line([[110, -170], [110, -150], [102, -134]], 3.2, 3.2), PAL.hairSh, 0.85),
      D(line([[-30, -214], [20, -214]], 9, 9, 2), 'rgba(255,255,255,1)', 0.05),
    ] })];
  },
  hair_curl: () => {
    const pts = [[-2, 18], [-5, -20], [-14, -52], [-8, -84], [14, -106], [44, -106], [66, -86], [64, -60], [46, -46], [29, -55]];
    return [S(strokeR(catmull(pts, 10), 44, 17, true), PAL.hair, { jit: 1.2, step: 12, details: [
      D(line([[-1, -20], [-10, -52], [-4, -82], [14, -98], [42, -98]], 4, 4), PAL.hairSh, 0.85),
      D(line([[10, -30], [6, -60], [20, -84]], 4, 3), '#FFFFFF', 0.07),
    ] })];
  },

  // ---- face features (flat ink paper bits)
  eye_oval: () => [S(ell(0, 0, 15, 24), PAL.ink, FEAT), S(ell(5, -9, 5.2, 5.8), '#FFFFFF', { ...FEAT, sh: 0, grain: 0 })],
  eye_big: () => [S(ell(0, 0, 18, 29), PAL.ink, FEAT), S(ell(6, -11, 6.5, 7.2), '#FFFFFF', { ...FEAT, sh: 0, grain: 0 }), S(ell(-6, 10, 3, 3), '#FFFFFF', { ...FEAT, sh: 0, grain: 0 })],
  eye_arc: () => [S(strokeR(catmull([[-19, 7], [-11, -5], [0, -9], [11, -5], [19, 7]], 8), 9, 9), PAL.ink, FEAT)],
  eye_scared: () => [S(ell(0, 0, 15, 27), PAL.ink, FEAT), S(ell(5, -10, 6.5, 7.5), '#FFFFFF', { ...FEAT, sh: 0, grain: 0 }), S(ell(-5, 11, 3.2, 3.2), '#FFFFFF', { ...FEAT, sh: 0, grain: 0 })],
  brow: () => [S(strokeR(catmull([[-21, 3], [0, -3], [21, 3]], 8), 13, 11), PAL.hair, { ...FEAT, sh: 0.7, grain: 0.6 })],
  mouth_line: () => [S(strokeR(catmull([[-16, 0], [-6, 2.5], [6, 2.5], [16, 0]], 8), 6.5, 6.5), PAL.ink, FEAT)],
  mouth_smile: () => {
    const p = [[-28, -4]]; for (let i = 0; i <= 18; i++) { const t = (i / 18) * Math.PI; p.push([Math.cos(t) * 28 * -1 * -1, -4 + Math.sin(t) * 27]); }
    const poly = [];
    for (let i = 0; i <= 20; i++) { const t = (i / 20) * Math.PI; poly.push([28 * Math.cos(t), -4 + 27 * Math.sin(t)]); }
    return [S(rpoly(poly, 6), PAL.ink, { ...FEAT, details: [D(ell(0, 24, 17, 11), '#FF7A6E', 1)] })];
  },
  mouth_o: () => [S(ell(0, 6, 12, 15), PAL.ink, { ...FEAT, details: [D(ell(0, 14, 7, 5), '#FF7A6E', 0.9)] })],
  mouth_wobble: () => [S(strokeR(catmull([[-31, 2], [-21, -5], [-10, 5], [0, -5], [10, 5], [21, -5], [31, 2]], 6), 7.5, 7.5), PAL.ink, FEAT)],
  blush: () => [S(ell(0, 0, 23, 14), PAL.blush, { border: 0, jit: 0.6, step: 8, sh: 0, grain: 0.6, gloss: 0, alpha: 0.42 })],
  nose: () => [S(ell(0, 0, 5.5, 4.5), PAL.skinSh, { ...FEAT, sh: 0, alpha: 0.9 })],
};

// ---------------------------------------------------------------- expressions
export const EXPRESSIONS = {
  neutral: { eye: 'oval', mouth: 'line', brow: [0, 0], blush: 0.8 },
  happy: { eye: 'arc', mouth: 'smile', brow: [-9, 0.0], blush: 1.25 },
  surprised: { eye: 'big', mouth: 'o', brow: [-19, 0.0], blush: 0.7 },
  scared: { eye: 'scared', mouth: 'wobble', brow: [-8, 0.3], blush: 0.5 },
};
const BROW_Y = -118, EYE_Y = -76, EYE_X = 50, MOUTH_Y = -34;

// ---------------------------------------------------------------- build
export function createCharacter(app, opts = {}) {
  const res = opts.res ?? 2, tag = opts.tag ?? '';
  const root = new Container(); root.label = 'root';
  const parts = { root };
  const rest = {};
  const key = (n) => 'oli_' + n;
  const mk = (name, defName, x, y, parent, o = {}) => {
    const c = new Container(); c.label = name; c.position.set(x, y);
    if (defName) {
      let shapes = DEFS[defName]();
      if (o.flip) shapes = flip(shapes);
      c.addChild(paperSprite(key(name), shapes, res));
    }
    parent.addChild(c); parts[name] = c; return c;
  };
  const sub = (name, defName, parent, flipIt) => { // variant sprite inside container
    let shapes = DEFS[defName](); if (flipIt) shapes = flip(shapes);
    const sp = paperSprite(key(name), shapes, res); sp.label = name; parent.addChild(sp); return sp;
  };

  // ground contact shadow
  const gs = document.createElement('canvas'); gs.width = 256; gs.height = 64;
  { const g = gs.getContext('2d'); g.translate(128, 32); g.scale(1, 0.25); const r = g.createRadialGradient(0, 0, 0, 0, 0, 128); r.addColorStop(0, 'rgba(60,35,10,0.38)'); r.addColorStop(1, 'rgba(60,35,10,0)'); g.fillStyle = r; g.beginPath(); g.arc(0, 0, 128, 0, TAU); g.fill(); }
  const ground = new Sprite(Texture.from(gs)); ground.anchor.set(0.5); ground.scale.set(1.5, 1.5); ground.position.set(0, 4); ground.label = 'groundShadow';
  root.addChild(ground); parts.groundShadow = ground;

  const hips = mk('hips', null, 0, -180, root);
  // legs first so the hoodie hem overlaps them
  for (const s of ['R', 'L']) {
    const sg = s === 'L' ? 1 : -1;
    const up = mk('leg' + s + '_upper', 'leg_upper', sg * 40, 0, hips);
    const lo = mk('leg' + s + '_lower', 'leg_lower', 0, 76, up);
    mk('foot' + s, 'foot', 0, 74, lo, { flip: s === 'R' });
  }
  const torso = mk('torso', 'torso', 0, 0, hips);
  mk('hood_collar', 'hood_collar', 0, -150, torso);
  mk('pocket', 'pocket', 0, -50, torso);
  mk('strings', 'strings', 0, -140, torso);
  mk('pin', 'pin', 58, -98, torso);
  for (const s of ['R', 'L']) {
    const sg = s === 'L' ? 1 : -1;
    const up = mk('arm' + s + '_upper', 'arm_upper', sg * 94, -126, torso);
    const lo = mk('arm' + s + '_lower', 'arm_lower', 0, 78, up);
    const hand = new Container(); hand.label = 'hand' + s; hand.position.set(0, 52); parts['hand' + s] = hand;
    const o = sub('hand' + s + '_open', 'hand_open', hand, s === 'R'); const p = sub('hand' + s + '_point', 'hand_point', hand, s === 'R'); p.visible = false;
    hand.open = o; hand.point = p;
    lo.addChildAt(hand, 0); // hand tucks under the cuff
  }
  // head
  const head = mk('head', null, 0, -150, torso);
  mk('hair_back', 'hair_back', 0, 0, head);
  mk('skull', 'skull', 0, 0, head);
  const face = mk('face', null, 0, 0, head);
  mk('blushL', 'blush', 92, -50, face); mk('blushR', 'blush', -92, -50, face);
  mk('nose', 'nose', 3, -52, face);
  for (const s of ['R', 'L']) {
    const sg = s === 'L' ? 1 : -1;
    const eye = mk('eye' + s, null, sg * EYE_X, EYE_Y, face); eye.variants = {};
    for (const v of ['oval', 'big', 'arc', 'scared']) { const sp = sub('eye' + s + '_' + v, 'eye_' + v, eye); sp.visible = false; eye.variants[v] = sp; }
    mk('brow' + s, 'brow', sg * 52, BROW_Y, face, { flip: false });
  }
  const mouth = mk('mouth', null, 0, MOUTH_Y, face); mouth.variants = {};
  for (const [v, d] of [['line', 'mouth_line'], ['smile', 'mouth_smile'], ['o', 'mouth_o'], ['wobble', 'mouth_wobble']]) { const sp = sub('mouth_' + v, d, mouth); sp.visible = false; mouth.variants[v] = sp; }
  mk('hair_curl', 'hair_curl', 8, -206, head);
  mk('hair_front', 'hair_front', 0, 0, head);

  // remember rest transforms
  for (const [n, c] of Object.entries(parts)) rest[n] = { x: c.position.x, y: c.position.y, r: c.rotation, sx: c.scale.x, sy: c.scale.y };
  const char = root;
  char.parts = parts; char.rest = rest; char.opts = opts; char.res = res;
  // rest pose tweaks (relaxed arms/legs slightly away from body)
  char.base = {
    legL_upper: { r: -0.025 }, legR_upper: { r: 0.025 },
    armL_upper: { r: -0.1 }, armR_upper: { r: 0.1 },
    armL_lower: { r: 0.12 }, armR_lower: { r: -0.12 },
    footL: { r: 0.03 }, footR: { r: -0.03 },
  };
  setPose(char, opts.pose ?? 'idle');
  setExpression(char, opts.expression ?? 'neutral');
  return char;
}

// ---------------------------------------------------------------- pose / expression
const POSES = {
  idle: {},
  point: {
    hips: { x: -14, r: -0.05 },
    torso: { r: 0.06, sx: 0.93 },
    head: { r: 0.12, y: -2 },
    face: { x: 15 }, hair_front: { x: 7 }, hair_back: { x: -6 }, skull: { x: 3 }, hair_curl: { x: 4, r: 0.1 },
    eyeL: { sx: 0.92 }, eyeR: { sx: 0.84 }, mouth: { x: 2 },
    legR_upper: { r: 0.06 }, legR_lower: { r: -0.02 }, footR: { r: -0.02 },
    legL_upper: { r: -0.30 }, legL_lower: { r: 0.46 }, footL: { r: -0.22 },
    armL_upper: { r: -1.80 }, armL_lower: { r: -0.1 }, handL: { r: 0.0 },
    armR_upper: { r: 0.12 }, armR_lower: { r: -0.35 },
    hood_collar: { sx: 0.95 }, pin: { x: -8 }, pocket: { x: 4, sx: 0.92 }, strings: { x: 4 },
  },
};

export function toRootPoint(node, root, x, y) {
  let n = node;
  while (n && n !== root) {
    x *= n.scale.x; y *= n.scale.y;
    const c = Math.cos(n.rotation), s = Math.sin(n.rotation);
    [x, y] = [x * c - y * s, x * s + y * c];
    x += n.position.x; y += n.position.y; n = n.parent;
  }
  return [x, y];
}

export function setPose(char, name) {
  const { parts, rest, base } = char;
  for (const [n, c] of Object.entries(parts)) {
    if (n === 'root' || n === 'groundShadow') continue;
    const r = rest[n], b = base[n] || {};
    c.position.set(r.x, r.y); c.rotation = (b.r ?? r.r); c.scale.set(r.sx, r.sy);
  }
  const P = POSES[name] || {};
  for (const [n, o] of Object.entries(P)) {
    const c = parts[n], r = rest[n]; if (!c) continue;
    if (o.x !== undefined) c.position.x = r.x + o.x;
    if (o.y !== undefined) c.position.y = r.y + o.y;
    if (o.r !== undefined) c.rotation = (base[n]?.r ?? r.r) + o.r - (name === 'point' && n.startsWith('arm') && n.endsWith('upper') ? 0 : 0);
    if (o.sx !== undefined) c.scale.x = o.sx;
    if (o.sy !== undefined) c.scale.y = o.sy;
  }
  const pt = name === 'point';
  for (const s of ['L', 'R']) { const h = parts['hand' + s]; h.open.visible = !(pt && s === 'L'); h.point.visible = pt && s === 'L'; }
  char.pose = name;
  plantFeet(char);
}

// keep the lowest sole point exactly on the ground line (root y = 0)
export function plantFeet(char) {
  const { parts } = char; let maxY = -1e9;
  for (const n of ['footL', 'footR']) for (const [px, py] of [[-30, 30], [0, 30], [48, 30]]) maxY = Math.max(maxY, toRootPoint(parts[n], char, px, py)[1]);
  parts.hips.position.y += -maxY;
}

export function setExpression(char, name) {
  const E = EXPRESSIONS[name] || EXPRESSIONS.neutral, p = char.parts;
  for (const s of ['L', 'R']) {
    const sg = s === 'L' ? 1 : -1, eye = p['eye' + s];
    for (const [v, sp] of Object.entries(eye.variants)) sp.visible = v === E.eye;
    eye.scale.y = 1;
    const b = p['brow' + s];
    b.position.y = BROW_Y + E.brow[0];
    b.rotation = sg * E.brow[1];
    b.position.x = sg * 52 - sg * (E.brow[1] > 0 ? 2 : 0);
    p['blush' + s].alpha = E.blush;
  }
  for (const [v, sp] of Object.entries(p.mouth.variants)) sp.visible = (v === E.mouth);
  char.expression = name;
}
export function blink(char, k) { char.parts.eyeL.scale.y = char.parts.eyeR.scale.y = k; }

// ---------------------------------------------------------------- exploded rig view
const EXPLODE = {
  head: [0, -56], hair_back: [-175, -4], hair_front: [175, 0], hair_curl: [-55, -70], skull: [0, 0], face: [0, 0],
  eyeL: [34, -8], eyeR: [-34, -8], browL: [38, -22], browR: [-38, -22], mouth: [0, 14], blushL: [38, 12], blushR: [-38, 12], nose: [0, 2],
  hood_collar: [-170, -50], strings: [150, -64], pocket: [180, 20], pin: [110, -112],
  armL_upper: [150, -10], armR_upper: [-150, -10], armL_lower: [24, 40], armR_lower: [-24, 40], handL: [14, 34], handR: [-14, 34],
  legL_upper: [58, 40], legR_upper: [-58, 40], legL_lower: [10, 30], legR_lower: [-10, 30], footL: [26, 30], footR: [-26, 30],
};
export function explode(char, kx = 1, ky = 1) {
  setPose(char, 'idle');
  const FACEY = new Set(['eyeL', 'eyeR', 'browL', 'browR', 'mouth', 'blushL', 'blushR', 'nose', 'face']);
  for (const [n, o] of Object.entries(EXPLODE)) { const c = char.parts[n], f = FACEY.has(n); c.position.x += o[0] * (f ? 1 : kx); c.position.y += o[1] * (f ? 1 : ky); }
  char.exploded = true;
}
// pivot origins of every rig part, in the coordinate space of `target`
export function pivotPoints(char, target) {
  const out = [];
  for (const [n, c] of Object.entries(char.parts)) {
    if (n === 'root' || n === 'groundShadow' || n === 'hips' && false) continue;
    const g = c.toGlobal({ x: 0, y: 0 }); out.push({ name: n, pt: target.toLocal(g) });
  }
  return out;
}
