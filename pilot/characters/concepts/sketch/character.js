// "Oli" — PENCIL SKETCHBOOK / BOILING LINE rig. Each part = opaque paper ground + graphite
// hatching + misregistered marker scribble (mustard / teal / coral only) + several loose,
// jittered, partially-covering pencil contour passes + faint construction guides.
// Everything is deterministic: wobbleSeed re-jitters all lines (re-seed every 2-3 frames to "boil").
// Convention: L = character's left = +x on screen. Feet at y=0, up is negative.
// setWobbleSeed(ch, n) re-generates every wash/line deterministically (for "boiling" later).
import { Container, Graphics, Texture } from 'pixi.js';

export const PALETTE = {
  ink: '#1E1B24', skin: '#F2C9A8', skinShade: '#D9A383', blush: '#F28C7A',
  hair: '#3B2A22', hairShade: '#2A1D17', hood: '#F2B33D', hoodShade: '#C98E25',
  cream: '#FFF4DC', pants: '#26305A', pantsShade: '#1A2142', shoe: '#F7F3EA',
  shoeShade: '#D8D2C4', coral: '#FF5D5D', teal: '#2EC4B6', bg: '#F4EAD5',
  mouthIn: '#7B2535', sweat: '#8FD3F4',
};
const P = PALETTE;
export const SEPIA = '#34323A';

// ---------- colour + random utils ----------
const rgb = (c) => { const n = typeof c === 'number' ? c : parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return (Math.round(A[0] + (B[0] - A[0]) * t) << 16) | (Math.round(A[1] + (B[1] - A[1]) * t) << 8) | Math.round(A[2] + (B[2] - A[2]) * t); };
const lum = (c) => { const [r, g, b] = rgb(c); return (0.3 * r + 0.59 * g + 0.11 * b) / 255; };
const PAPER = '#FBF3E2', WARM = '#FFD9A0', COOL = '#8FA6C8';
const soft = (c) => mix(c, '#FFF3DC', 0.11);
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const hash2 = (a, b) => { let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0); };

// ---------- path recorder -> polylines ----------
class Rec {
  constructor() { this.subs = []; this.cur = null; this.x = 0; this.y = 0; }
  moveTo(x, y) { this.cur = { pts: [[x, y]], closed: false }; this.subs.push(this.cur); this.x = x; this.y = y; return this; }
  lineTo(x, y) { if (!this.cur) return this.moveTo(x, y); this.cur.pts.push([x, y]); this.x = x; this.y = y; return this; }
  quadraticCurveTo(cx, cy, x, y) { const x0 = this.x, y0 = this.y; for (let i = 1; i <= 10; i++) { const t = i / 10, u = 1 - t; this.cur.pts.push([u * u * x0 + 2 * u * t * cx + t * t * x, u * u * y0 + 2 * u * t * cy + t * t * y]); } this.x = x; this.y = y; return this; }
  bezierCurveTo(c1x, c1y, c2x, c2y, x, y) { const x0 = this.x, y0 = this.y; for (let i = 1; i <= 14; i++) { const t = i / 14, u = 1 - t; this.cur.pts.push([u * u * u * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x, u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y]); } this.x = x; this.y = y; return this; }
  closePath() { if (this.cur) { this.cur.closed = true; const p = this.cur.pts[0]; this.x = p[0]; this.y = p[1]; } return this; }
  ellipse(cx, cy, rx, ry) { const pts = []; for (let i = 0; i < 28; i++) { const a = i / 28 * 6.2832; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } this.subs.push({ pts, closed: true }); this.cur = null; return this; }
  circle(cx, cy, r) { return this.ellipse(cx, cy, r, r); }
}
const FLAT = new WeakMap();
const flatten = (fn) => { let s = FLAT.get(fn); if (!s) { const r = new Rec(); fn(r); s = r.subs; FLAT.set(fn, s); } return s; };

function resample(pts, closed, step) {
  const p = closed ? [...pts, pts[0]] : pts;
  const out = []; let carry = 0; out.push(p[0]);
  for (let i = 1; i < p.length; i++) {
    const [x0, y0] = p[i - 1], [x1, y1] = p[i]; const d = Math.hypot(x1 - x0, y1 - y0); if (d < 1e-6) continue;
    let t = step - carry;
    while (t <= d) { out.push([x0 + (x1 - x0) * t / d, y0 + (y1 - y0) * t / d]); t += step; }
    carry = d - (t - step);
  }
  if (closed) { const l = out[out.length - 1], f = out[0]; if (Math.hypot(l[0] - f[0], l[1] - f[1]) < step * 0.5 && out.length > 3) out.pop(); }
  else out.push(p[p.length - 1]);
  return out;
}
const perim = (pts) => { let L = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); } return L; };
// smooth, closed-loop displacement field (sum of integer harmonics around the ring)
function displace(pts, closed, r, amp, wl) {
  const L = perim(pts) || 1;
  const hs = [[1, 1], [0.5, 0.4], [0.25, 0.1]].map(([m, a]) => ({ k: Math.max(1, Math.round(L / (wl * m))), a: amp * a, px: r() * 6.2832, py: r() * 6.2832 }));
  let s = 0; const out = [];
  for (let i = 0; i < pts.length; i++) {
    if (i) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const th = 6.2832 * s / L; let dx = 0, dy = 0;
    for (const h of hs) { dx += h.a * Math.sin(h.k * th + h.px); dy += h.a * Math.sin(h.k * th + h.py); }
    out.push([pts[i][0] + dx, pts[i][1] + dy]);
  }
  return out;
}
const centroid = (pts) => { let x = 0, y = 0; for (const p of pts) { x += p[0]; y += p[1]; } return [x / pts.length, y / pts.length]; };
const area = (pts) => { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a / 2); };
const scaleAbout = (pts, c, k, dx = 0, dy = 0) => pts.map(([x, y]) => [c[0] + (x - c[0]) * k + dx, c[1] + (y - c[1]) * k + dy]);
const flat = (pts) => { const f = []; for (const p of pts) f.push(p[0], p[1]); return f; };

function penLine(g, pts, w, color, alpha, r, vary = 0.32) {
  const ph = r() * 6.28, f = 0.15 + r() * 0.2, n = pts.length;
  for (let i = 0; i < n - 1; i += 2) {
    const j = Math.min(n - 1, i + 2);
    const e = Math.min(i, n - 1 - i) / 5, tap = 0.5 + 0.5 * Math.min(1, e);
    g.poly(flat(pts.slice(i, j + 1)), false).stroke({ width: Math.max(0.6, w * (1 + vary * Math.sin(ph + i * f)) * tap), color, alpha, cap: 'round', join: 'round' });
  }
}
const arcOf = (ring, start, len) => { const n = ring.length, out = []; for (let i = 0; i < len; i++) out.push(ring[(start + i) % n]); return out; };

// ---------- unit registry (so the whole character can be re-seeded) ----------
let CUR = null, UID = 0;
const reg = (g, draw) => { g._id = ++UID; g._draw = draw; if (CUR) CUR.units.push(g); g._redraw = (seed) => { g.clear(); draw(hash2(g._id, seed)); }; g._redraw(CUR ? CUR.wobbleSeed : 0); return g; };
const MAIN = new WeakSet();

// ---------- pencil primitives ----------
const GR = '#34323A', PAPER_BG = '#F7F2E5';
const gstroke = (g, pts, w, a, col = GR) => { if (pts.length > 1) g.poly(flat(pts), false).stroke({ width: w, color: col, alpha: a, cap: 'round', join: 'round' }); };

// scan-line hatch of (possibly several) rings; returns segments [x0,y0,x1,y1]
function hatchSegs(rings, ang, sp, r, jit = 1.2) {
  const ca = Math.cos(-ang), sa = Math.sin(-ang), co = Math.cos(ang), so = Math.sin(ang);
  const R = rings.map((rg) => rg.map(([x, y]) => [x * ca - y * sa, x * sa + y * ca]));
  let minY = 1e9, maxY = -1e9; for (const rg of R) for (const p of rg) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
  const segs = [];
  for (let y = minY + sp * 0.5; y < maxY; y += sp) {
    const xs = [];
    for (const rg of R) for (let i = 0; i < rg.length; i++) {
      const a = rg[i], b = rg[(i + 1) % rg.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const x0 = xs[k] + (r() - 0.5) * jit * 2, x1 = xs[k + 1] + (r() - 0.5) * jit * 2, yy = y + (r() - 0.5) * jit;
      segs.push([x0 * co - yy * so, x0 * so + yy * co, x1 * co - yy * so, x1 * so + yy * co]);
    }
  }
  return segs;
}
function drawHatch(g, segs, w, alpha, r, inset = 3, col = GR, bow = 1.4) {
  for (const [x0, y0, x1, y1] of segs) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy); if (L < inset * 2.5) continue;
    const ux = dx / L, uy = dy / L, i0 = r() * inset, i1 = r() * inset;
    const ax = x0 + ux * i0, ay = y0 + uy * i0, bx = x1 - ux * i1, by = y1 - uy * i1, b = (r() - 0.5) * 2 * bow;
    g.moveTo(ax, ay).quadraticCurveTo((ax + bx) / 2 - uy * b, (ay + by) / 2 + ux * b, bx, by);
  }
  g.stroke({ width: w, color: col, alpha, cap: 'round', join: 'round' });
}
// marker scribble: continuous zig-zag through the hatch rows
function drawScribble(g, segs, w, alpha, col, sp, r, over = 2) {
  let px = null, py = null, flip = false, open = false;
  for (const s of segs) {
    let [x0, y0, x1, y1] = s; if (flip) [x0, y0, x1, y1] = [x1, y1, x0, y0]; flip = !flip;
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, e0 = (r() - 0.4) * over * 2, e1 = (r() - 0.4) * over * 2;
    x0 -= dx / L * e0; y0 -= dy / L * e0; x1 += dx / L * e1; y1 += dy / L * e1;
    if (open && Math.hypot(x0 - px, y0 - py) < sp * 3) g.lineTo(x0, y0); else g.moveTo(x0, y0);
    g.lineTo(x1, y1); px = x1; py = y1; open = true;
  }
  g.stroke({ width: w, color: col, alpha, cap: 'round', join: 'round' });
}
const rings5 = (sub, step = 5) => resample(sub.pts, true, step);

// class table: how each bible colour is rendered in pencil / marker
const ACC = { [P.hood]: P.hood, [P.hoodShade]: P.hood, [P.teal]: P.teal, [P.coral]: P.coral, [P.sweat]: P.teal };
const HATCH = {
  [P.hair]: [[62, 3.4, 1.5, 0.62], [25, 6, 1.2, 0.4]],
  [P.hairShade]: [[62, 2.8, 1.6, 0.72], [25, 4.4, 1.3, 0.55], [-40, 5, 1.2, 0.4]],
  [P.pants]: [[50, 5.6, 1.3, 0.42]],
  [P.pantsShade]: [[50, 4.2, 1.3, 0.55], [-45, 5.2, 1.2, 0.45]],
  [P.hoodShade]: [[-50, 6, 1.2, 0.4]],
  [P.skinShade]: [[55, 5, 1.1, 0.38]],
  [P.shoeShade]: [[50, 5, 1.1, 0.4]],
};
const OVERLAY_HATCH = { [P.hoodShade]: [[-50, 5, 1.2, 0.5], [42, 8, 1.1, 0.32]], [P.pantsShade]: [[50, 4.2, 1.3, 0.55], [-45, 5.2, 1.2, 0.45]], [P.skinShade]: [[55, 4.6, 1.1, 0.42]], [P.hairShade]: [[62, 3, 1.5, 0.5]] };
const LEAD = { [P.hair]: 0.34, [P.hairShade]: 0.5, [P.pants]: 0.13, [P.pantsShade]: 0.28 };
const deg = (d) => d * Math.PI / 180;

function marker(g, rings, col, r, a = 1, tight = 1) {
  const c = centroid(rings[0]);
  for (const rg of rings) g.poly(flat(displace(scaleAbout(rg, centroid(rg), 1.0, 2.4, 2), true, r, 2.6, 36)), true).fill({ color: col, alpha: 0.44 * a });
  const sp = 6 * tight;
  drawScribble(g, hatchSegs(rings, deg(-35), sp, r, 1.4), 5.4 * tight, 0.5 * a, col, sp, r, 3);
  drawScribble(g, hatchSegs(rings, deg(32), sp * 1.6, r, 1.6), 4.4 * tight, 0.3 * a, col, sp * 1.6, r, 3);
  void c;
}
function paintMain(g, fn, color, seed, lineFn) {
  const r = rng(seed), subs = flatten(fn);
  const rings = subs.map((s) => rings5(s));
  const sz = Math.sqrt(Math.max(...rings.map(area)));
  // opaque paper ground (hides lines of whatever is behind)
  for (const rg of rings) g.poly(flat(rg), true).fill({ color: PAPER_BG, alpha: 1 });
  const acc = ACC[color];
  if (acc) marker(g, rings, acc, r, color === P.hoodShade ? 1.25 : (color === P.sweat ? 0.8 : 1), sz < 40 ? 0.45 : 1);
  const tone = LEAD[color];
  if (tone) for (const rg of rings) g.poly(flat(displace(rg, true, r, 1.2, 40)), true).fill({ color: GR, alpha: tone });
  for (const [a, sp, w, al] of (HATCH[color] || [])) drawHatch(g, hatchSegs(rings, deg(a), sp, r, 1.1), w, al, r, 4);
  // contour: several loose, offset passes
  const passes = [[1.9, 0.82, 1.5, 1.0], [1.3, 0.5, 2.4, 0.78], [1.0, 0.34, 3.0, 0.55]];
  for (const sub of (lineFn ? flatten(lineFn) : subs)) {
    const ring0 = resample(sub.pts, sub.closed, 5);
    for (const [w, al, amp, cov] of passes) {
      const ring = displace(ring0, sub.closed, r, amp, 44), n = ring.length;
      if (!sub.closed) { gstroke(g, ring, w, al); continue; }
      const start = Math.floor(r() * n), len = Math.min(n + 5, Math.floor(n * cov) + 3 + Math.floor(r() * 3));
      gstroke(g, arcOf(ring, start, len), w, al);
    }
  }
}
function paintOverlay(g, fn, color, alpha, seed) {
  const r = rng(seed), rings = flatten(fn).map((s) => rings5(s, 4));
  if (color === P.blush) { // coral cheek scribble
    for (const rg of rings) g.poly(flat(displace(scaleAbout(rg, centroid(rg), 1, 2, 1), true, r, 1.5, 20)), true).fill({ color: P.coral, alpha: 0.16 });
    drawScribble(g, hatchSegs(rings, deg(-30), 3.6, r, 1), 2.8, 0.42, P.coral, 3.6, r, 2.5);
    return;
  }
  for (const [a, sp, w, al] of (OVERLAY_HATCH[color] || [[50, 5, 1.1, 0.35]])) drawHatch(g, hatchSegs(rings, deg(a), sp, r, 1.1), w, al * Math.min(1, alpha + 0.2), r, 3);
}
function paintSolid(g, fn, color, alpha, seed) {
  const r = rng(seed), rings = flatten(fn).map((s) => rings5(s, 3));
  const L = lum(color);
  if (color === '#FFFFFF') { for (const rg of rings) g.poly(flat(rg), true).fill({ color: '#FFFFFF', alpha: 1 }); return; }
  if (color === P.mouthIn) { marker(g, rings, P.coral, r, 0.9, 0.5); drawHatch(g, hatchSegs(rings, deg(60), 3, r, 0.6), 1.2, 0.5, r, 2); return; }
  if (color === P.blush) { marker(g, rings, P.coral, r, 0.8, 0.45); return; }
  if (color === P.skinShade) { for (const rg of rings) g.poly(flat(rg), true).fill({ color: GR, alpha: 0.4 }); return; }
  if (L < 0.3) { // graphite-dark: packed hatch + wash of lead
    for (const rg of rings) g.poly(flat(displace(rg, true, r, 0.6, 20)), true).fill({ color: GR, alpha: 0.7 });
    drawHatch(g, hatchSegs(rings, deg(70), 2.2, r, 0.5), 1.5, 0.7, r, 1, GR, 0.6);
    drawHatch(g, hatchSegs(rings, deg(-20), 3, r, 0.5), 1.3, 0.5, r, 1, GR, 0.6);
  }
}
function paintStroke(g, d, w, color, alpha, seed) {
  const r = rng(seed);
  for (const sub of flatten(d)) {
    const ring0 = resample(sub.pts, sub.closed, 4);
    for (const [ww, al, amp] of [[w, alpha, 1.0], [w * 0.65, alpha * 0.55, 1.8]]) {
      const ring = displace(ring0, sub.closed, r, amp, 34);
      const pts = sub.closed ? [...ring, ring[0], ring[1], ring[2]] : ring;
      gstroke(g, pts, ww, al, color);
    }
  }
}
function paintGuide(g, d, seed, a = 0.24) {
  const r = rng(seed);
  for (const sub of flatten(d)) {
    for (let k = 0; k < 2; k++) { const ring = displace(resample(sub.pts, sub.closed, 5), sub.closed, r, 1.6, 50); gstroke(g, sub.closed ? [...ring, ring[0], ring[1]] : ring, 1, a, '#5B6B8A'); }
  }
}
const offsetPath = (pts, dist) => pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1; return [p[0] - dy / m * dist, p[1] + dx / m * dist]; });

// ---------- drawing API used by the builders ----------
const inkOf = (fn) => { MAIN.add(fn); return new Container(); };
const mk = (fn) => { const g = new Graphics(); return reg(g, (s) => fn(g, s)); };
const wash = (fn, color, alpha = 1, lineFn = null) => mk((g, s) => (MAIN.has(fn) ? paintMain(g, fn, color, s, lineFn) : paintOverlay(g, fn, color, alpha, s)));
const solid = (fn, color, alpha = 0.95) => mk((g, s) => paintSolid(g, fn, color, alpha, s));
const lineG = (_g, w, color, d, alpha) => mk((g, s) => (color === P.skinShade ? paintStroke(g, d, 1.1, GR, 0.4, s) : paintStroke(g, d, Math.max(1.1, w * 0.36), GR, alpha ?? 0.8, s)));
const guide = (d) => mk((g, s) => paintGuide(g, d, s));
// thick strokes: marker ribbon (accent colours), packed graphite (dark) or outlined paper ribbon (cream)
const thick = (d, wOut, cOut, wIn, cIn) => mk((g, s) => {
  const r = rng(s);
  for (const sub of flatten(d)) {
    const path = displace(resample(sub.pts, sub.closed, 4), sub.closed, r, 0.8, 30);
    if (ACC[cIn]) {
      gstroke(g, path, wIn, 0.55, cIn); gstroke(g, offsetPath(path, 1.5), wIn * 0.7, 0.35, cIn);
      gstroke(g, offsetPath(path, wIn * 0.5 + 0.5), 1.2, 0.7); gstroke(g, offsetPath(path, -wIn * 0.5 - 0.5), 1.2, 0.7);
    } else if (lum(cIn) < 0.3) {
      for (const o of [-0.3, 0, 0.3]) gstroke(g, offsetPath(path, o * wIn * 0.6), wIn * 0.55, 0.62);
      gstroke(g, displace(path, false, r, 1, 20), 1.2, 0.6);
    } else {
      gstroke(g, path, wIn, 1, PAPER_BG);
      gstroke(g, offsetPath(path, wIn * 0.5 + 0.4), 1.3, 0.78); gstroke(g, offsetPath(path, -wIn * 0.5 - 0.4), 1.3, 0.78);
    }
  }
});
// highlight/eraser strokes (hair shine) or marker strokes (sole stripe)
const washStroke = (d, w, color, alpha, passes = 2) => mk((g, s) => {
  const r = rng(s);
  for (const sub of flatten(d)) {
    const path = displace(resample(sub.pts, sub.closed, 4), sub.closed, r, 0.9, 30);
    if (ACC[color]) { gstroke(g, path, w, 0.8, color); gstroke(g, offsetPath(path, 1.4), w * 0.6, 0.5, color); }
    else gstroke(g, path, w * 0.8, 0.8, PAPER_BG);
  }
});

// ---------- geometry (copied from the flat-vector rig; shapes are path functions) ----------
function blob(g, cx, cy, rx, ry) {
  const k = 0.5523;
  g.moveTo(cx - rx, cy);
  g.bezierCurveTo(cx - rx, cy - ry * k, cx - rx * k, cy - ry, cx, cy - ry);
  g.bezierCurveTo(cx + rx * k, cy - ry, cx + rx, cy - ry * k, cx + rx, cy);
  g.bezierCurveTo(cx + rx, cy + ry * k, cx + rx * k, cy + ry, cx, cy + ry);
  g.bezierCurveTo(cx - rx * k, cy + ry, cx - rx, cy + ry * k, cx - rx, cy);
  g.closePath();
}
function limb(g, len, w0, w1, top = true, bot = true, flatBow = 5) {
  const a = w0 / 2, b = w1 / 2, k = 1.33;
  g.moveTo(-a, 0);
  g.bezierCurveTo(-a - 1, len * 0.35, -b - 1, len * 0.7, -b, len);
  if (bot) g.bezierCurveTo(-b, len + b * k, b, len + b * k, b, len);
  else g.quadraticCurveTo(0, len + flatBow, b, len);
  g.bezierCurveTo(b + 1, len * 0.7, a + 1, len * 0.35, a, 0);
  if (top) g.bezierCurveTo(a, -a * k, -a, -a * k, -a, 0);
  g.closePath();
}
function limbShade(g, len, w0, w1, amt = 12) {
  const a = w0 / 2, b = w1 / 2;
  g.moveTo(a - 0.5, 4);
  g.bezierCurveTo(a + 0.5, len * 0.3, b + 0.5, len * 0.7, b - 0.5, len - 4);
  g.bezierCurveTo(b - amt, len * 0.75, a - amt, len * 0.3, a - 0.5, 4);
  g.closePath();
}
function catmull(pts, n = 12) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
const CURL_CTRL = [[0, 22], [-3, -20], [-12, -62], [-6, -104], [22, -138], [62, -140], [92, -112], [90, -74], [68, -52], [46, -62], [42, -80]].map(([x, y]) => ({ x, y }));
const CURL_PTS = catmull(CURL_CTRL, 10);
function curlRibbon(g, open = false) {
  const pts = CURL_PTS, N = pts.length;
  const wAt = (i) => 44 - 34 * Math.pow(i / (N - 1), 0.75);
  const L = [], R = [];
  for (let i = 0; i < N; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)];
    let tx = b.x - a.x, ty = b.y - a.y; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    const w = wAt(i) / 2;
    L.push({ x: pts[i].x - ty * w, y: pts[i].y + tx * w });
    R.push({ x: pts[i].x + ty * w, y: pts[i].y - tx * w });
  }
  const st = open ? 6 : 0;
  g.moveTo(L[st].x, L[st].y);
  for (let i = st + 1; i < L.length; i++) g.lineTo(L[i].x, L[i].y);
  const tip = pts[N - 1], w = wAt(N - 1) / 2;
  const a = pts[N - 2]; let tx = tip.x - a.x, ty = tip.y - a.y; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
  g.bezierCurveTo(L[L.length - 1].x + tx * w * 1.3, L[L.length - 1].y + ty * w * 1.3, R[R.length - 1].x + tx * w * 1.3, R[R.length - 1].y + ty * w * 1.3, R[R.length - 1].x, R[R.length - 1].y);
  for (let i = R.length - 2; i >= st; i--) g.lineTo(R[i].x, R[i].y);
  if (!open) g.closePath();
}
const curlFill = (g) => curlRibbon(g, false);
const curlLine = (g) => curlRibbon(g, true);

// ---------- expressions + poses (data) ----------
export const EXPRESSIONS = {
  neutral:   { eyes: 'oval', eyeScale: [1, 1], hl: 1, browY: -27, browRot: 0.0, browX: 52, mouth: 'neutral', sweat: false },
  happy:     { eyes: 'arc', eyeScale: [1, 1], hl: 1, browY: -40, browRot: 0.16, browX: 52, mouth: 'happy', sweat: false },
  surprised: { eyes: 'oval', eyeScale: [1.18, 1.15], hl: 1.4, browY: -48, browRot: 0.06, browX: 52, mouth: 'surprised', sweat: false },
  scared:    { eyes: 'oval', eyeScale: [0.95, 1.12], hl: 1.5, browY: -38, browRot: 0.42, browX: 46, mouth: 'scared', sweat: true },
};
export const POSES = {
  idle: {
    turn: 0, hips: { x: 0, y: -192, r: 0 }, torso: { r: 0 }, head: { r: 0 },
    armL: { u: -0.10, l: 0.10, hand: 'open' }, armR: { u: 0.10, l: -0.10, hand: 'open' },
    legL: { u: -0.04, l: 0.04, foot: 0 }, legR: { u: 0.04, l: -0.04, foot: 0 }, footDir: { L: 1, R: -1 },
  },
  point: {
    turn: 1, hips: { x: -26, y: -192, r: 0.03 }, torso: { r: -0.07 }, head: { r: 0.13 },
    armL: { u: -1.66, l: -0.03, hand: 'point' }, armR: { u: 0.64, l: -1.62, hand: 'open' },
    legL: { u: -0.36, l: 0.50, foot: -0.02 }, legR: { u: 0.03, l: -0.03, foot: 0 }, footDir: { L: 1, R: 1 },
  },
};

// ---------- builders ----------
function named(c, name, ch) { c.label = name; ch.parts[name] = c; return c; }

function buildHand(side, ch) {
  const t = side === 'L' ? -1 : 1;
  const hand = new Container(); named(hand, 'hand' + side, ch);
  const mit = (g) => {
    g.moveTo(-17, -4); g.bezierCurveTo(-21, 20, -19, 44, 0, 46); g.bezierCurveTo(19, 44, 21, 20, 17, -4); g.closePath();
    g.moveTo(t * 12, 8); g.bezierCurveTo(t * 30, 4, t * 40, 22, t * 28, 34); g.bezierCurveTo(t * 22, 40, t * 14, 32, t * 12, 26); g.closePath();
  };
  const open = new Container(); open.label = 'hand_open';
  open.addChild(inkOf(mit), wash(mit, P.skin));
  open.addChild(lineG(0, 4, P.ink, (g) => { g.moveTo(t * 14, 12); g.quadraticCurveTo(t * 20, 24, t * 15, 32); }));
  const f = -t;
  const fist = (g) => {
    g.moveTo(-18, -4); g.bezierCurveTo(-22, 16, -20, 36, 0, 38); g.bezierCurveTo(20, 36, 22, 16, 18, -4); g.closePath();
    g.moveTo(f * 12 - 8, 14); g.lineTo(f * 12 - 8, 74); g.bezierCurveTo(f * 12 - 8, 88, f * 12 + 8, 88, f * 12 + 8, 74); g.lineTo(f * 12 + 8, 14); g.closePath();
    g.moveTo(-f * 14, 6); g.bezierCurveTo(-f * 36, 0, -f * 40, 20, -f * 26, 28); g.bezierCurveTo(-f * 18, 30, -f * 14, 24, -f * 14, 20); g.closePath();
  };
  const pt = new Container(); pt.label = 'hand_point'; pt.visible = false;
  pt.addChild(inkOf(fist), wash(fist, P.skin));
  pt.addChild(lineG(0, 4, P.ink, (g) => { g.moveTo(f * 4 - 2, 30); g.quadraticCurveTo(f * 12 - 2, 26, f * 20 - 4, 30); g.moveTo(-f * 14, 16); g.quadraticCurveTo(-f * 8, 22, -f * 14, 28); }));
  hand.addChild(open, pt);
  hand.setKind = (k) => { open.visible = k !== 'point'; pt.visible = k === 'point'; };
  return hand;
}

function buildArm(side, ch) {
  const U = 88, Lw = 70, S = side;
  const up = named(new Container(), `arm${S}_upper`, ch);
  const lo = named(new Container(), `arm${S}_lower`, ch); lo.position.set(0, U);
  const hand = buildHand(S, ch); hand.position.set(0, Lw);
  const w0 = 50, w1 = 44, v0 = 44, v1 = 38;
  const lowerShape = (g) => limb(g, Lw, v0, v1, true, false, 4);
  const b = v1 / 2;
  const cuff = (g) => { g.moveTo(-b, Lw - 16); g.quadraticCurveTo(0, Lw - 12, b, Lw - 16); g.lineTo(b, Lw); g.quadraticCurveTo(0, Lw + 4, -b, Lw); g.closePath(); };
  lo.addChild(inkOf(lowerShape), hand, wash(lowerShape, P.hood), wash((g) => limbShade(g, Lw, v0, v1, 11), P.hoodShade, 0.9));
  lo.addChild(wash(cuff, P.hoodShade, 0.85));
  lo.addChild(lineG(0, 5, P.ink, (g) => { g.moveTo(-b, Lw - 16); g.quadraticCurveTo(0, Lw - 12, b, Lw - 16); }));
  lo.addChild(lineG(0, 5, P.ink, (g) => { g.moveTo(-b, Lw); g.quadraticCurveTo(0, Lw + 4, b, Lw); }));
  const upperShape = (g) => limb(g, U, w0, w1, true, true);
  up.addChild(inkOf(upperShape), lo, wash(upperShape, P.hood), wash((g) => limbShade(g, U, w0, w1, 12), P.hoodShade, 0.9));
  up.addChild(guide((g) => { g.circle(0, 0, 9); g.circle(0, U, 8); g.moveTo(0, -10); g.lineTo(1, U + Lw + 8); }));
  return up;
}

function buildFoot(side, ch) {
  const foot = named(new Container(), `foot${side}`, ch);
  const skinAnkle = (g) => { g.moveTo(-13, -26); g.lineTo(13, -26); g.lineTo(13, -2); g.lineTo(-13, -2); g.closePath(); };
  const upper = (g) => {
    g.moveTo(-22, -12); g.bezierCurveTo(-29, -4, -31, 6, -27, 12); g.lineTo(40, 12);
    g.bezierCurveTo(57, 12, 62, 2, 53, -5); g.bezierCurveTo(44, -11, 30, -6, 18, -12);
    g.bezierCurveTo(10, -17, -10, -19, -22, -12); g.closePath();
  };
  const sole = (g) => { g.moveTo(-28, 8); g.lineTo(56, 8); g.bezierCurveTo(66, 8, 66, 21, 52, 21); g.lineTo(-20, 21); g.bezierCurveTo(-32, 21, -33, 11, -28, 8); g.closePath(); };
  foot.addChild(inkOf(skinAnkle), wash(skinAnkle, P.skin), inkOf(upper), wash(upper, P.shoe), inkOf(sole), wash(sole, P.shoeShade));
  foot.addChild(washStroke((g) => { g.moveTo(-22, 15); g.lineTo(53, 15); }, 5.5, P.coral, 0.85, 2));
  foot.addChild(lineG(0, 4, P.ink, (g) => { g.moveTo(34, -4); g.bezierCurveTo(40, 0, 40, 6, 37, 9); g.moveTo(2, -13); g.lineTo(8, -4); g.moveTo(12, -12); g.lineTo(18, -3); g.moveTo(-8, -14); g.lineTo(-3, -5); }));
  return foot;
}

function buildLeg(side, ch) {
  const S = side, U = 86, Lw = 60;
  const up = named(new Container(), `leg${S}_upper`, ch);
  const lo = named(new Container(), `leg${S}_lower`, ch); lo.position.set(0, U);
  const foot = buildFoot(S, ch); foot.position.set(0, 82);
  const w0 = 58, w1 = 52, v0 = 52, v1 = 46;
  const lowerShape = (g) => limb(g, Lw, v0, v1, true, false, 4);
  const b = v1 / 2;
  const cuff = (g) => { g.moveTo(-b, Lw - 12); g.quadraticCurveTo(0, Lw - 8, b, Lw - 12); g.lineTo(b, Lw); g.quadraticCurveTo(0, Lw + 4, -b, Lw); g.closePath(); };
  lo.addChild(inkOf(lowerShape), foot, wash(lowerShape, P.pants), wash((g) => limbShade(g, Lw, v0, v1, 11), P.pantsShade, 0.9));
  lo.addChild(wash(cuff, P.pantsShade, 0.85), lineG(0, 5, P.ink, (g) => { g.moveTo(-b, Lw); g.quadraticCurveTo(0, Lw + 4, b, Lw); }));
  const upperShape = (g) => limb(g, U, w0, w1, true, true);
  up.addChild(inkOf(upperShape), lo, wash(upperShape, P.pants), wash((g) => limbShade(g, U, w0, w1, 12), P.pantsShade, 0.9));
  up.addChild(guide((g) => { g.circle(0, 0, 10); g.circle(0, U, 9); g.moveTo(0, -10); g.lineTo(0, U + Lw + 6); }));
  return up;
}

function buildHead(ch) {
  const head = named(new Container(), 'head', ch);
  const hb = named(new Container(), 'hair_back', ch);
  const hbShape = (g) => {
    g.moveTo(-152, -58); g.bezierCurveTo(-174, -160, -104, -234, 0, -234);
    g.bezierCurveTo(104, -234, 174, -160, 152, -58);
    g.bezierCurveTo(146, -26, 108, -22, 84, -40); g.lineTo(-84, -40);
    g.bezierCurveTo(-108, -22, -146, -26, -152, -58); g.closePath();
  };
  hb.addChild(inkOf(hbShape), wash(hbShape, P.hairShade));
  const sk = named(new Container(), 'skull', ch);
  const skShape = (g) => { blob(g, 0, -100, 135, 112); blob(g, -136, -92, 17, 25); blob(g, 136, -92, 17, 25); };
  sk.addChild(inkOf(skShape), wash(skShape, P.skin));
  sk.addChild(wash((g) => {
    g.moveTo(112, -40); g.bezierCurveTo(130, -66, 136, -110, 124, -150);
    g.bezierCurveTo(140, -120, 144, -80, 128, -42); g.bezierCurveTo(122, -24, 100, -4, 70, 6);
    g.bezierCurveTo(92, -4, 106, -22, 112, -40); g.closePath();
  }, P.skinShade, 0.8));
  sk.addChild(lineG(0, 4, P.skinShade, (g) => { g.moveTo(-138, -100); g.quadraticCurveTo(-130, -92, -138, -82); g.moveTo(138, -100); g.quadraticCurveTo(130, -92, 138, -82); }));
  const headGuide = guide((g) => { g.ellipse(0, -100, 134, 112); g.moveTo(0, -236); g.quadraticCurveTo(4, -100, 0, 26); g.moveTo(-150, -82); g.quadraticCurveTo(0, -70, 150, -82); g.moveTo(-132, -44); g.quadraticCurveTo(0, -36, 132, -44); });
  sk.addChild(headGuide);
  const face = buildFace(ch);
  const hf = named(new Container(), 'hair_front', ch);
  const hfShape = (g) => {
    g.moveTo(-142, -84);
    g.bezierCurveTo(-160, -150, -112, -226, 0, -226);
    g.bezierCurveTo(112, -226, 160, -150, 142, -84);
    g.bezierCurveTo(141, -72, 128, -70, 124, -84);
    g.bezierCurveTo(126, -128, 118, -160, 98, -176);
    g.bezierCurveTo(92, -160, 80, -148, 62, -146);
    g.bezierCurveTo(48, -152, 36, -166, 30, -186);
    g.bezierCurveTo(24, -168, 12, -156, -6, -154);
    g.bezierCurveTo(-26, -158, -40, -170, -48, -184);
    g.bezierCurveTo(-56, -164, -78, -152, -100, -152);
    g.bezierCurveTo(-116, -150, -124, -118, -124, -84);
    g.bezierCurveTo(-128, -70, -141, -72, -142, -84);
    g.closePath();
  };
  hf.addChild(inkOf(hfShape), wash(hfShape, P.hair));
  hf.addChild(washStroke((g) => { g.moveTo(-70, -200); g.quadraticCurveTo(-98, -180, -112, -150); g.moveTo(66, -204); g.quadraticCurveTo(100, -184, 116, -150); }, 6, '#8A6248', 0.4, 1));
  hf.addChild(washStroke((g) => { g.moveTo(-30, -208); g.quadraticCurveTo(-14, -196, -6, -178); }, 5, '#8A6248', 0.3, 1));
  const curl = named(new Container(), 'hair_curl', ch);
  curl.position.set(0, -218);
  curl.addChild(inkOf(curlFill), wash(curlFill, P.hair, 1, curlLine));
  curl.addChild(washStroke((g) => { g.moveTo(8, -30); g.bezierCurveTo(-4, -66, -2, -100, 22, -122); g.bezierCurveTo(50, -140, 82, -130, 88, -100); }, 5, '#8A6248', 0.42, 1));
  head.addChild(hb, sk, face, hf, curl);
  return head;
}

function buildFace(ch) {
  const face = named(new Container(), 'face', ch);
  face.position.set(0, -100);
  const blushes = new Container(); blushes.label = 'blush';
  blushes.addChild(wash((g) => blob(g, -84, 48, 22, 13), P.blush, 0.4), wash((g) => blob(g, 84, 48, 22, 13), P.blush, 0.4));
  face.addChild(blushes);
  face.addChild(solid((g) => g.circle(0, 36, 4), P.skinShade, 0.8));
  const EYE = '#2A2232';
  const mkEye = (name, x) => {
    const e = named(new Container(), name, ch); e.position.set(x, 18);
    const open = new Container();
    open.addChild(solid((g) => blob(g, 0, 0, 15, 24), EYE, 0.95));
    const hl = solid((g) => g.circle(5.5, -9, 5.2), '#FFFFFF', 1); open.addChild(hl);
    const arc = thick((g) => { g.moveTo(-16, 5); g.quadraticCurveTo(0, -24, 16, 5); }, 0, EYE, 6, EYE, 0.95);
    arc.visible = false;
    e.addChild(open, arc); e._open = open; e._arc = arc; e._hl = hl;
    return e;
  };
  const eyeL = mkEye('eyeL', 52), eyeR = mkEye('eyeR', -52);
  const mkBrow = (name, x) => {
    const b = named(new Container(), name, ch); b.position.set(x, -25);
    b.addChild(thick((g) => { g.moveTo(-23, 4); g.quadraticCurveTo(0, -6, 23, 4); }, 0, P.hairShade, 12, P.hair, 0.95));
    return b;
  };
  const browL = mkBrow('browL', 52), browR = mkBrow('browR', -52);
  const mouth = named(new Container(), 'mouth', ch); mouth.position.set(0, 62);
  const m = {};
  m.neutral = lineG(0, 6, P.ink, (g) => { g.moveTo(-15, 0); g.quadraticCurveTo(0, 6, 15, 0); });
  const happyShape = (g) => { g.moveTo(-31, -6); g.quadraticCurveTo(0, 6, 31, -6); g.bezierCurveTo(30, 20, 12, 30, 0, 30); g.bezierCurveTo(-12, 30, -30, 20, -31, -6); g.closePath(); };
  m.happy = new Container();
  m.happy.addChild(solid(happyShape, P.mouthIn, 0.92), solid((g) => blob(g, 0, 23, 13, 7), P.blush, 0.85), lineG(0, 5, P.ink, happyShape));
  m.surprised = new Container();
  { const sh = (g) => blob(g, 0, 6, 11, 15); m.surprised.addChild(solid(sh, P.mouthIn, 0.92), lineG(0, 5, P.ink, sh)); }
  const scaredShape = (g) => { g.moveTo(-34, 0); g.bezierCurveTo(-24, -10, -14, 8, -2, -2); g.bezierCurveTo(10, -12, 22, 8, 34, -2); g.bezierCurveTo(32, 18, 14, 26, 0, 26); g.bezierCurveTo(-14, 26, -32, 18, -34, 0); g.closePath(); };
  m.scared = new Container();
  m.scared.addChild(solid(scaredShape, P.mouthIn, 0.92), lineG(0, 5, P.ink, scaredShape));
  for (const k in m) { m[k].label = 'mouth_' + k; mouth.addChild(m[k]); }
  mouth._shapes = m;
  const sweat = new Container(); sweat.label = 'sweat'; sweat.position.set(108, -36);
  const dropShape = (g) => { g.moveTo(0, -26); g.bezierCurveTo(8, -10, 15, -2, 15, 8); g.bezierCurveTo(15, 20, -15, 20, -15, 8); g.bezierCurveTo(-15, -2, -8, -10, 0, -26); g.closePath(); };
  sweat.addChild(inkOf(dropShape), wash(dropShape, P.sweat), solid((g) => g.circle(-5, 8, 3.2), '#FFFFFF', 0.95));
  sweat.visible = false;
  face.addChild(eyeL, eyeR, browL, browR, mouth, sweat);
  face._sweat = sweat;
  return face;
}

function buildTorso(ch) {
  const torso = named(new Container(), 'torso', ch);
  const bodyShape = (g) => {
    g.moveTo(-62, -150); g.bezierCurveTo(-88, -122, -94, -52, -86, 8);
    g.bezierCurveTo(-40, 24, 40, 24, 86, 8);
    g.bezierCurveTo(94, -52, 88, -122, 62, -150);
    g.bezierCurveTo(30, -162, -30, -162, -62, -150); g.closePath();
  };
  const body = named(new Container(), 'torso_body', ch);
  body.addChild(inkOf(bodyShape), wash(bodyShape, P.hood));
  body.addChild(wash((g) => {
    g.moveTo(62, -150); g.bezierCurveTo(88, -122, 94, -52, 86, 8); g.bezierCurveTo(70, 14, 52, 18, 40, 20);
    g.bezierCurveTo(66, -30, 70, -100, 40, -150); g.closePath();
  }, P.hoodShade, 0.8));
  body.addChild(guide((g) => { g.moveTo(0, -165); g.quadraticCurveTo(6, -70, 0, 20); g.moveTo(-95, -128); g.quadraticCurveTo(0, -140, 95, -128); }));
  const hem = named(new Container(), 'hem', ch);
  const hemShape = (g) => { g.moveTo(-86, -6); g.quadraticCurveTo(0, 14, 86, -6); g.lineTo(87, 12); g.bezierCurveTo(40, 28, -40, 28, -87, 12); g.closePath(); };
  hem.addChild(inkOf(hemShape), wash(hemShape, P.hoodShade));
  hem.addChild(lineG(0, 3.5, P.ink, (g) => { for (let x = -66; x <= 66; x += 22) { g.moveTo(x, 4 + (x * x) / 2000); g.lineTo(x * 1.01, 20 - (x * x) / 2400); } }, 0.6));
  const collar = named(new Container(), 'hood_collar', ch);
  const colShape = (g) => {
    g.moveTo(-82, -144); g.bezierCurveTo(-96, -178, -56, -196, 0, -192);
    g.bezierCurveTo(56, -196, 96, -178, 82, -144);
    g.bezierCurveTo(70, -122, 34, -118, 0, -126); g.bezierCurveTo(-34, -118, -70, -122, -82, -144); g.closePath();
  };
  collar.addChild(inkOf(colShape), wash(colShape, P.hood));
  collar.addChild(wash((g) => { g.moveTo(-60, -140); g.bezierCurveTo(-30, -122, 30, -122, 60, -140); g.bezierCurveTo(30, -132, -30, -132, -60, -140); g.closePath(); }, P.hoodShade, 0.9));
  collar.addChild(wash((g) => { g.moveTo(40, -178); g.bezierCurveTo(76, -176, 92, -160, 80, -142); g.bezierCurveTo(78, -158, 64, -170, 40, -178); g.closePath(); }, P.hoodShade, 0.8));
  const pocket = named(new Container(), 'pocket', ch);
  const pkShape = (g) => { g.moveTo(-52, -58); g.bezierCurveTo(-26, -66, 26, -66, 52, -58); g.lineTo(68, -10); g.bezierCurveTo(30, 0, -30, 0, -68, -10); g.closePath(); };
  pocket.addChild(inkOf(pkShape), wash(pkShape, P.hoodShade));
  pocket.addChild(wash((g) => { g.moveTo(-50, -56); g.bezierCurveTo(-26, -63, 26, -63, 50, -56); g.lineTo(53, -46); g.bezierCurveTo(26, -53, -26, -53, -53, -46); g.closePath(); }, P.hood, 0.9));
  const strings = named(new Container(), 'strings', ch);
  for (const sx of [-1, 1]) {
    strings.addChild(thick((g) => { g.moveTo(sx * 20, -134); g.bezierCurveTo(sx * 22, -118, sx * 28, -104, sx * 26, -86); }, 0, P.ink, 6, P.cream, 0.98));
    strings.addChild(thick((g) => { g.moveTo(sx * 26, -92); g.lineTo(sx * 26, -78); }, 0, P.ink, 7, P.cream, 0.98));
  }
  // brand pin: a forked BRANCH (stem splitting into two curved tines ending in round nodes), not a letter
  const pin = named(new Container(), 'pin', ch);
  const forkD = (g) => { g.moveTo(46, -68); g.lineTo(46, -88); g.moveTo(46, -88); g.bezierCurveTo(46, -97, 33, -96, 33, -109); g.moveTo(46, -88); g.bezierCurveTo(46, -97, 59, -96, 59, -109); };
  pin.addChild(thick(forkD, 0, P.ink, 9, P.teal, 0.97));
  const node = (x, y, r) => (g) => g.circle(x, y, r);
  for (const [x, y, r] of [[33, -112, 7], [59, -112, 7], [46, -67, 6]]) pin.addChild(inkOf(node(x, y, r)), wash(node(x, y, r), P.teal));
  torso.addChild(body, hem, collar, pocket, strings, pin);
  const armR = buildArm('R', ch), armL = buildArm('L', ch);
  armR.position.set(-76, -126); armL.position.set(76, -126);
  const head = buildHead(ch); head.position.set(0, -148);
  torso.addChild(armR, armL, head);
  return torso;
}

function buildHips(ch) {
  const hips = named(new Container(), 'hips', ch);
  const legR = buildLeg('R', ch), legL = buildLeg('L', ch);
  legR.position.set(-32, 4); legL.position.set(32, 4);
  const pelvis = named(new Container(), 'pelvis', ch);
  const pv = (g) => { g.moveTo(-68, -4); g.bezierCurveTo(-72, 24, -62, 42, -44, 48); g.bezierCurveTo(-20, 52, 20, 52, 44, 48); g.bezierCurveTo(62, 42, 72, 24, 68, -4); g.closePath(); };
  pelvis.addChild(inkOf(pv), wash(pv, P.pants));
  hips.addChild(legR, legL, pelvis, buildTorso(ch));
  return hips;
}

// ---------- public API ----------
export function createCharacter(app, opts = {}) {
  const ch = { parts: {}, units: [], wobbleSeed: opts.wobbleSeed ?? 1, state: { pose: 'idle', expr: 'neutral', blink: 1 }, app };
  CUR = ch;
  const root = named(new Container(), 'root', ch);
  const shadow = mk((g, s) => {
    const r = rng(s), ring = ell(0, 8, 150, 17);
    drawHatch(g, hatchSegs([ring], deg(-12), 4.5, r, 1), 1.6, 0.34, r, 6, GR, 0.8);
    drawHatch(g, hatchSegs([ell(0, 10, 100, 11)], deg(-12), 4.5, r, 1), 1.3, 0.25, r, 6, GR, 0.8);
  });
  shadow.label = 'shadow'; ch.shadow = shadow;
  if (opts.shadow !== false) root.addChild(shadow);
  root.addChild(buildHips(ch));
  ch.root = root;
  CUR = null;
  setPose(ch, opts.pose || 'idle');
  setExpression(ch, opts.expression || 'neutral');
  return ch;
}
function ell(cx, cy, rx, ry) { const o = []; for (let i = 0; i < 36; i++) { const a = i / 36 * 6.2832; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; }

export function setWobbleSeed(ch, seed) { ch.wobbleSeed = seed; for (const u of ch.units) u._redraw(seed); }

export function setPose(ch, name) {
  const p = POSES[name]; if (!p) throw new Error('unknown pose ' + name);
  ch.state.pose = name;
  const q = ch.parts, t = p.turn, sx = 1 - 0.14 * t;
  q.hips.position.set(p.hips.x, p.hips.y); q.hips.rotation = p.hips.r;
  q.torso.rotation = p.torso.r;
  for (const n of ['torso_body', 'hem', 'hood_collar', 'pocket', 'strings', 'pin']) q[n].scale.x = sx;
  q.pocket.x = 10 * t; q.strings.x = 14 * t; q.pin.x = 46 * (sx - 1) + 16 * t;
  q.hood_collar.x = 6 * t;
  q.armL_upper.position.set(76 * sx, -126); q.armR_upper.position.set(-76 * sx, -126);
  q.head.rotation = p.head.r; q.head.x = 10 * t;
  for (const s of ['L', 'R']) {
    const a = p['arm' + s], l = p['leg' + s];
    q[`arm${s}_upper`].rotation = a.u; q[`arm${s}_lower`].rotation = a.l; q['hand' + s].setKind(a.hand);
    q[`leg${s}_upper`].rotation = l.u; q[`leg${s}_lower`].rotation = l.l;
    q['foot' + s].rotation = l.foot;
    q['foot' + s].scale.x = p.footDir[s];
  }
  q.face.x = 26 * t;
  applyFace(ch);
}
export function setExpression(ch, name) {
  if (!EXPRESSIONS[name]) throw new Error('unknown expression ' + name);
  ch.state.expr = name; applyFace(ch);
}
export function setBlink(ch, v) { ch.state.blink = v; applyFace(ch); }

function applyFace(ch) {
  const q = ch.parts, e = EXPRESSIONS[ch.state.expr], turn = POSES[ch.state.pose].turn;
  const [sx, sy] = e.eyeScale, arcs = e.eyes === 'arc';
  for (const [n, side] of [['eyeL', 1], ['eyeR', -1]]) {
    const eye = q[n];
    eye._open.visible = !arcs; eye._arc.visible = arcs;
    eye._hl.scale.set(e.hl);
    const narrow = side === 1 ? 1 - 0.2 * turn : 1 + 0.04 * turn;
    eye.scale.set(sx * narrow, sy * (arcs ? 1 : ch.state.blink));
    eye.position.set(side * (52 - (side === 1 ? 4 * turn : 0)), arcs ? 24 : 18);
  }
  for (const [n, side] of [['browL', 1], ['browR', -1]]) {
    const b = q[n];
    b.position.set(side * e.browX, e.browY); b.rotation = side * e.browRot;
    b.scale.x = side === 1 ? 1 - 0.18 * turn : 1;
  }
  const m = q.mouth._shapes;
  for (const k in m) m[k].visible = k === e.mouth;
  q.mouth.scale.x = 1 - 0.1 * turn;
  q.face._sweat.visible = e.sweat;
}

// ---------- sheet helpers (used by index.html) ----------
// A deterministic cold-press paper-grain texture to be laid over the whole sheet with MULTIPLY.
export function makePaperGrain(w, h, seed = 7) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
  const lat = (ix, iy, o) => (hash2(ix + o * 1013, iy + o * 7919 + seed) & 0xffff) / 65535;
  const vn = (x, y, o) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = lat(ix, iy, o), b = lat(ix + 1, iy, o), c = lat(ix, iy + 1, o), e = lat(ix + 1, iy + 1, o);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + e) * sx * sy; };
  const W = w + 2, H = new Float32Array(W * (h + 2));
  for (let y = 0; y < h + 2; y++) for (let x = 0; x < W; x++) H[y * W + x] = vn(x / 1.2, y / 1.2, 1) * 0.42 + vn(x / 2.6, y / 2.6, 2) * 0.3 + vn(x / 8, y / 8, 3) * 0.2 + vn(x / 30, y / 30, 4) * 0.08;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const hh = H[y * W + x], lit = (hh - H[(y + 1) * W + x + 1]) * 1.5;
    const v = 250 + lit * 22 + (hh - 0.5) * 12; const k = Math.max(214, Math.min(255, v)), i = (y * w + x) * 4;
    d[i] = k; d[i + 1] = k * 0.985; d[i + 2] = k * 0.955; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return Texture.from(cv);
}
// wobbly polygon helper for backgrounds: returns flat points of a deformed ring/band
export function wobblyPoly(pts, seed, amp = 6, wl = 90, step = 12) {
  const r = rng(seed); return displace(resample(pts, true, step), true, r, amp, wl);
}
export const util = { rng, mix, resample, displace, flat, penLine, hash2 };
