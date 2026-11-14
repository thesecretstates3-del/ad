// Shared helpers: easing, seeded hash noise, trauma shake, hit-stop, comic drawing primitives, cached text.
import { Container, Graphics, Text } from 'pixi.js';

export const INK = '#1E1B24', TEAL = '#2EC4B6', CORAL = '#FF5D5D', YEL = '#FFD54A', CREAM = '#FFF4DC', NAVY = '#26305A';
export const W = 1920, H = 1080;
export const FONT = 'DejaVu Sans, Verdana, Arial, sans-serif';

// ---------- math ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const prog = (t, a, b) => clamp((t - a) / (b - a));           // 0..1 progress of t in [a,b]
export const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
export const outCubic = (k) => 1 - Math.pow(1 - k, 3);
export const inCubic = (k) => k * k * k;
export const inOutCubic = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const outBack = (k, s = 1.70158) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
export const outElastic = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * (2 * Math.PI / 3)) + 1);
// pop-in: 0 before t0, overshoots, settles at 1
export const pop = (t, t0, d = 0.28, s = 2.2) => (t < t0 ? 0 : outBack(clamp((t - t0) / d), s));

export function hash(n) {
  n |= 0; n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}
export const hash2 = (x, y, s = 0) => hash(Math.imul(x | 0, 73856093) ^ Math.imul(y | 0, 19349663) ^ Math.imul(s | 0, 83492791));
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash(i * 131 + seed), hash((i + 1) * 131 + seed), u);
}

// ---------- trauma shake + hit-stop (pure functions of time) ----------
export function shakeAt(t, events, k = 1) {
  let x = 0, y = 0, r = 0;
  events.forEach((e, i) => {
    const dt = t - e.t; if (dt < 0 || dt > e.dur) return;
    const tr = e.amp * (1 - dt / e.dur), s = tr * tr, f = t * 40;
    x += s * 54 * (noise1(f, i * 17 + 1) * 2 - 1); y += s * 40 * (noise1(f, i * 17 + 5) * 2 - 1); r += s * 0.04 * (noise1(f, i * 17 + 9) * 2 - 1);
  });
  return { x: x * k, y: y * k, r: r * k };
}
export const stopTime = (t, stops) => { let d = 0; for (const s of stops) d += clamp(t - s.t, 0, s.d); return t - d; };

// ---------- cached text ----------
export const keepers = [];
const textCache = new Map();
export function T(key, s, size, o = {}) {
  let t = textCache.get(key);
  if (!t) {
    t = new Text({ text: s, style: { fontFamily: FONT, fontSize: size, fontWeight: '900', fontStyle: o.italic === false ? 'normal' : 'italic',
      fill: o.fill || INK, letterSpacing: o.ls ?? 2, stroke: o.stroke ? { color: o.stroke, width: o.sw ?? 8, join: 'round' } : undefined,
      align: 'center' } });
    textCache.set(key, t); if (!o.nokeep) keepers.push(t);
  }
  if (t.text !== s) t.text = s;
  t.anchor.set(o.ax ?? 0.5, o.ay ?? 0.5); t.position.set(o.x ?? 0, o.y ?? 0); t.rotation = o.rot || 0; t.scale.set(o.s ?? 1); t.alpha = o.a ?? 1;
  return t;
}
// cache a static container (backgrounds etc.)
const bgCache = new Map();
export function cached(key, build) {
  let c = bgCache.get(key);
  if (!c) { c = build(); bgCache.set(key, c); keepers.push(c); }
  return c;
}

// ---------- drawing ----------
export function dots(g, x0, y0, x1, y1, step, f, color) {
  for (let j = 0, y = y0; y < y1; y += step * 0.5, j++)
    for (let x = x0 + (j & 1) * step * 0.5; x < x1; x += step) { const r = f(x, y); if (r > 0.7) g.circle(x, y, r); }
  g.fill(color);
}
export function rays(g, cx, cy, R, n, color, jitter = 0.35, start = 0, seed = 5, r0 = 0) {
  for (let i = 0; i < n; i++) {
    const a = start + (i / n) * Math.PI * 2, w = (Math.PI / n) * (1 - jitter + hash(seed * 97 + i) * jitter * 2);
    const c1 = Math.cos(a - w), s1 = Math.sin(a - w), c2 = Math.cos(a + w), s2 = Math.sin(a + w);
    g.moveTo(cx + c1 * r0, cy + s1 * r0).lineTo(cx + c1 * R, cy + s1 * R).lineTo(cx + c2 * R, cy + s2 * R).lineTo(cx + c2 * r0, cy + s2 * r0).closePath();
  }
  g.fill(color);
}
export function starPts(cx, cy, R, r, n, rot = 0, jit = 0, seed = 0) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i / (n * 2)) * Math.PI * 2, rr = (i % 2 ? r : R) * (1 + (hash(seed * 31 + i) - 0.5) * jit);
    pts.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  return pts;
}
// comic burst panel: ink shadow, fill, ink outline, optional halftone
export function burst(parent, cx, cy, R, o = {}) {
  const pts = starPts(cx, cy, R, R * (o.r ?? 0.66), o.n ?? 12, o.rot ?? 0, o.jit ?? 0.28, o.seed ?? 1);
  const g = new Graphics();
  g.poly(pts.map((v, i) => v + (i % 2 ? 12 : 10))).fill(INK);
  g.poly(pts).fill(o.fill || YEL).stroke({ width: o.sw ?? 9, color: INK, join: 'miter', miterLimit: 3 });
  if (o.dot) dots(g, cx - R, cy - R, cx + R, cy + R, 14, (x, y) => { const d = Math.hypot(x - cx, y - cy) / R; return d < 0.9 && x - cx + (y - cy) > 0 ? 4.2 * (1 - d) + 0.6 : 0; }, o.dot);
  parent.addChild(g); return g;
}
// polygon panel filled+stroked
export const polyPanel = (parent, pts, fill, sw = 10, shadow = [12, 14]) => {
  const g = new Graphics();
  if (shadow) g.poly(pts.map((v, i) => v + (i % 2 ? shadow[1] : shadow[0]))).fill(INK);
  g.poly(pts).fill(fill); if (sw) g.poly(pts).stroke({ width: sw, color: INK, join: 'miter' });
  parent.addChild(g); return g;
};
// caption box centred on (x,y) with pop scale. returns container
export function caption(parent, key, s, x, y, o = {}) {
  const c = new Container();
  const t = T(key, s, o.size ?? 40, { fill: o.fill, ls: o.ls ?? 3, italic: o.italic, stroke: o.stroke, sw: o.sw });
  const w = t.width + 56, h = t.height + 28;
  const g = new Graphics();
  g.rect(-w / 2 + 10, -h / 2 + 12, w, h).fill(INK);
  g.rect(-w / 2, -h / 2, w, h).fill(o.bg || YEL).stroke({ width: 6, color: INK, join: 'miter' });
  c.addChild(g, t); c.position.set(x, y); c.rotation = o.rot || 0; const p = o.pop ?? 1; c.scale.set(p); c.alpha = o.a ?? 1;
  c.visible = p > 0.001; parent.addChild(c); c._w = w; c._h = h; return c;
}
// onomatopoeia burst with text
export function bang(parent, key, s, x, y, R, o = {}) {
  const c = new Container();
  burst(c, 0, 0, R, { fill: o.fill || YEL, n: o.n ?? 11, seed: o.seed ?? 3, rot: o.rot0 ?? 0, dot: o.dot });
  c.addChild(T(key, s, o.size ?? R * 0.5, { fill: o.tfill || CORAL, stroke: INK, sw: o.sw ?? 10, rot: -0.1 }));
  c.position.set(x, y); c.rotation = o.rot ?? -0.08; const p = o.pop ?? 1; c.scale.set(p); c.visible = p > 0.001; c.alpha = o.a ?? 1;
  parent.addChild(c); return c;
}
export function bubble(parent, key, s, x, y, w, h, tailX, tailY, o = {}) {
  const c = new Container();
  const g = new Graphics();
  const ang = Math.atan2(tailY - y, tailX - x);
  const ba = ang + Math.PI / 2, bw = 40;
  const tri = [x + Math.cos(ang) * 0 + Math.cos(ba) * bw * 0.0, 0];
  g.ellipse(x + 10, y + 12, w / 2, h / 2).fill(INK);
  const tailPts = (ox, oy) => [x + Math.cos(ba) * bw * 1 + ox, y + Math.sin(ba) * bw + oy, tailX + ox, tailY + oy, x - Math.cos(ba) * bw + ox, y - Math.sin(ba) * bw + oy];
  g.poly(tailPts(10, 12)).fill(INK);
  g.poly(tailPts(0, 0)).fill('#FFFFFF');
  g.ellipse(x, y, w / 2, h / 2).fill('#FFFFFF').stroke({ width: 7, color: INK });
  g.poly(tailPts(0, 0)).stroke({ width: 7, color: INK, join: 'miter' });
  g.ellipse(x, y, w / 2 - 5, h / 2 - 5).fill('#FFFFFF');
  g.poly([tailPts(0, 0)[0] * 0.5 + x * 0.5, tailPts(0, 0)[1] * 0.5 + y * 0.5 - 0, tailPts(0, 0)[2] * 0.85 + x * 0.15, tailPts(0, 0)[3] * 0.85 + y * 0.15, tailPts(0, 0)[4] * 0.5 + x * 0.5, tailPts(0, 0)[5] * 0.5 + y * 0.5]).fill('#FFFFFF');
  c.addChild(g, T(key, s, o.size ?? 64, { x, y: y + 2 }));
  const p = o.pop ?? 1; c.pivot.set(tailX, tailY); c.position.set(tailX, tailY); c.scale.set(p); c.visible = p > 0.001;
  parent.addChild(c); return c;
}
// radial speed lines around (cx,cy); jitter on twos
export function speedLines(parent, t, cx, cy, o = {}) {
  const g = new Graphics(); const n = o.n ?? 38, seed = Math.floor(t * 15);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (hash(seed * 7 + i) - 0.5) * 0.12, w = 0.012 + hash(i + 9) * 0.03;
    const r0 = (o.r0 ?? 300) * (0.8 + hash(seed + i * 3) * 0.5), r1 = o.r1 ?? 1400;
    g.moveTo(cx + Math.cos(a - w) * r1, cy + Math.sin(a - w) * r1).lineTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0).lineTo(cx + Math.cos(a + w) * r1, cy + Math.sin(a + w) * r1).closePath();
  }
  g.fill({ color: o.color || '#FFFFFF', alpha: o.alpha ?? 0.5 }); parent.addChild(g); return g;
}
// horizontal streaks (whip-pan blur lines)
export function streaks(parent, t, amt, o = {}) {
  const g = new Graphics(); const seed = Math.floor(t * 30);
  for (let i = 0; i < 26; i++) {
    const y = hash(seed * 13 + i) * H, x = hash(seed * 5 + i * 9) * W - 300, len = (350 + hash(i + seed) * 900) * amt, th = 3 + hash(i * 3 + seed) * 9;
    g.rect(x, y, len, th);
  }
  g.fill({ color: o.color || '#FFFFFF', alpha: 0.55 * amt }); parent.addChild(g); return g;
}
// halftone cloud puff
export function puff(parent, x, y, r, alpha, seed) {
  const g = new Graphics();
  const n = 5; const cs = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * 6.283 + hash(seed + i) * 2; cs.push([x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.42, r * (0.55 + hash(seed * 3 + i) * 0.25)]); }
  cs.push([x, y, r * 0.8]);
  for (const [cx, cy, cr] of cs) g.circle(cx, cy, cr + 6);
  g.fill({ color: INK, alpha });
  for (const [cx, cy, cr] of cs) g.circle(cx, cy, cr);
  g.fill({ color: '#F6F1FF', alpha });
  // shade dots on lower-right
  for (const [cx, cy, cr] of cs.slice(0, 4)) {
    const st = 11;
    for (let j = -cr; j < cr; j += st * 0.5) for (let i = -cr + ((Math.round(j / (st * 0.5)) & 1) * st * 0.5); i < cr; i += st) {
      const d = Math.hypot(i, j) / cr; const k = (i + j) / (cr * 1.6);
      if (d < 0.92 && k > 0) g.circle(cx + i, cy + j, 1 + 3.2 * k);
    }
  }
  g.fill({ color: '#9B8FD0', alpha: alpha * 0.9 });
  parent.addChild(g); return g;
}
export function star4(g, x, y, r, rot = 0) {
  const pts = []; for (let i = 0; i < 8; i++) { const a = rot + (i / 8) * 6.283 - 1.5708, rr = i % 2 ? r * 0.22 : r; pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.poly(pts);
}
