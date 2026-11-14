// Scene composition v2. Every function here is a pure function of time t (plus the loaded voice.json).
import { Container, Graphics, ColorMatrixFilter, BlurFilter } from 'pixi.js';
import { INK, TEAL, CORAL, YEL, CREAM, W, H, clamp, lerp, prog, sstep, outCubic, inCubic, inOutCubic, outBack, pop, hash, hash2, noise1,
  shakeAt, T, keepers, cached, dots, rays, burst, caption, bang, bubble, speedLines, streaks, star4 } from './lib.js';
import { drawBooth, lightBurst, drawVault, buildCup } from './props.js';
import { buildCafe, drawChair, drawTable } from './cafe.js';
import { PO, walkPose, blend, makeOli, placeOli } from './oli.js';

let app, root, capLayer, oli1, oli2, cupA, cupT, phone, VOICE = [], TB = 7.0, TD = 2.0, CAFE;
const greyF = new ColorMatrixFilter(), blurV = new BlurFilter({ strengthX: 0, strengthY: 0, quality: 3 }), blurB = new BlurFilter({ strengthX: 6, strengthY: 6, quality: 3 });
const greyM = (k) => [(1 - k) + k * 0.3, k * 0.59, k * 0.11, 0, 0, k * 0.3, (1 - k) + k * 0.59, k * 0.11, 0, 0, k * 0.3, k * 0.59, (1 - k) + k * 0.11, 0, 0, 0, 0, 0, 1, 0];
const clone = (o) => JSON.parse(JSON.stringify(o));

// ---------- voice helpers ----------
const KEY = { n1: { 'dün': CORAL }, n2: { benim: CORAL, 'dünkü': TEAL }, o1: { benim: CORAL }, n3: { 'seçimle': TEAL }, n4: { milyon: TEAL, geri: CORAL }, o2: { 'seçiyorum': CORAL } };
const norm = (w) => w.replace(/[.,?!…]/g, '').toLocaleLowerCase('tr');
function wordTimes(L) {
  const words = L.text.split(' '), tot = words.reduce((a, w) => a + w.length + 1, 0); let c = 0;
  return words.map((w) => { const t = L.start + (c / tot) * L.dur * 0.88; c += w.length + 1; return { w, t }; });
}
function talkLevel(t) {
  for (const L of VOICE) if (L.who === 'oli' && t >= L.start && t < L.start + L.dur + 0.03) { const f = (t - L.start) * 30, i = Math.floor(f); return Math.max(0, (L.env[i] ?? 0) * (1 - (f - i)) + (L.env[i + 1] ?? 0) * (f - i)); }
  return -1;
}
const talkOf = (t) => { const v = talkLevel(t); return { talk: v, frame: Math.floor(t * 30) }; };
const hold = (t, stops) => { for (const s of stops) if (t >= s.t && t < s.t + s.d) return s.t; return t; };

// events
const HSTOPS = [{ t: 8.9, d: 0.1 }];
const CSTOPS = [{ t: 22.62, d: 0.12 }];
const GEV = [{ t: 4.2, amp: 0.25, dur: 0.35 }, { t: 8.55, amp: 0.5, dur: 0.3 }, { t: 8.9, amp: 1, dur: 0.9 }, { t: 10.5, amp: 0.5, dur: 0.3 },
  { t: 16.4, amp: 0.3, dur: 0.3 }, { t: 22.62, amp: 0.6, dur: 0.5 }, { t: 24.3, amp: 0.3, dur: 0.3 }, { t: 25.55, amp: 0.45, dur: 0.4 }];

export function init(a, voice) {
  app = a; VOICE = voice; root = new Container(); capLayer = new Container(); app.stage.addChild(root, capLayer);
  oli1 = makeOli(app); oli2 = makeOli(app); cupA = buildCup(); cupT = buildCup(); CAFE = buildCafe();
  phone = new Graphics(); phone.roundRect(-20, -38, 40, 76, 8).fill(INK); phone.roundRect(-16, -33, 32, 66, 5).fill('#7FE3D8'); phone.rect(-8, -24, 16, 8).fill('#FFFFFF');
  keepers.push(oli1.root, oli2.root, cupA, cupT, phone, CAFE.back, CAFE.mid);
  const n2 = VOICE.find((l) => l.id === 'n2'), n1 = VOICE.find((l) => l.id === 'n1');
  TB = wordTimes(n2).find((x) => norm(x.w) === 'benim')?.t ?? 7.0;
  TD = wordTimes(n1).find((x) => norm(x.w) === 'dün')?.t ?? 2.0;
}
function clear() {
  for (const k of keepers) k.parent?.removeChild(k);
  for (const c of root.removeChildren()) c.destroy({ children: true });
  for (const c of capLayer.removeChildren()) c.destroy({ children: true });
  root.filters = null;
}

// =====================================================================================
// HOOK  (cafe)
// =====================================================================================
const setLayer = (c, f, camX, z) => { c.pivot.set(960 + (camX - 960) * f, 600); c.position.set(960, 600); c.scale.set(z); };
const O1X = 800, O2X = 2150, OY = 786 + 192 * 1.1, TY = 70;

function camAt(th) {
  const pan = inOutCubic(prog(th, 4.2, 4.6));
  const z0 = lerp(1.0, 1.12, prog(th, 0, 4.2));
  let z = lerp(z0, 1.0, pan) + 0.12 * sstep(4.6, 8.6, th);
  const x = lerp(880, 2130, pan) + 10 * Math.sin(th * 0.7);
  const k = prog(th, TB, TB + 0.16), b = outBack(k, 2.2) * (1 - sstep(TB + 0.45, TB + 1.1, th)) * (th >= TB ? 1 : 0);
  return { x, zf: z * (1 + 0.3 * b), zb: (1 + (z - 1) * 0.55) * (1 - 0.14 * b), pan: Math.sin(Math.PI * prog(th, 4.2, 4.6)), bump: b };
}

function hook(th, live = true) {
  const ta = hold(th, HSTOPS), sc = new Container();
  if (th < 8.55) cafeShot(sc, th, ta, live); else splits(sc, th, ta, live);
  return { c: sc };
}

function cafeShot(sc, th, ta, live) {
  const cam = camAt(th), view = new Container(); sc.addChild(view);
  const { back, mid } = CAFE;
  setLayer(back, 0.75, cam.x, cam.zb); setLayer(mid, 0.92, cam.x, (cam.zb + cam.zf) / 2);
  const rack = th >= 4.2 ? 11 * (1 - sstep(4.55, 5.3, th)) : (th > 1.0 && th < 3.5 ? 3 * Math.sin(Math.PI * prog(th, 1.0, 3.5)) : 0);
  back.filters = rack > 0.3 ? [blurB] : null; blurB.strengthX = blurB.strengthY = rack;
  view.addChild(back, mid);
  const act = new Container(); view.addChild(act); setLayer(act, 1, cam.x, cam.zf);
  // table 1 + Oli 1 (looks at phone)
  { const c1 = drawChair(O1X, 1); c1.y = TY; act.addChild(c1); }
  const p1 = clone(PO.holdCup); p1.turn = 0.55; p1.hips.y += 8; p1.head.r = 0.16 - 0.2 * sstep(3.3, 3.9, th);
  const react = sstep(TD - 0.2, TD + 0.1, th) * (1 - sstep(TD + 0.9, TD + 1.5, th));
  p1.head.r += 0.05 * Math.sin(th * 1.3) - 0.06 * react;
  const ex1 = th > TD + 0.2 && th < TD + 1.3 ? 'surprised' : 'neutral';
  placeOli(oli1, { x: O1X, y: OY, s: 1.1, pose: p1, expr: ex1, t: th, seed: 3, brow: -12 * react, browTilt: 0.12 * react, glance: th > 3.4 && th < 4.2 ? 1 : (th < 1.0 ? 0.5 : undefined) });
  act.addChild(oli1.root);
  { const lp = act.toLocal(oli1.parts.handL.getGlobalPosition()); phone.position.set(lp.x, lp.y - 10); phone.rotation = 0.25; phone.scale.set(2.0); act.addChild(phone); }
  { const tb = drawTable(O1X + 60); tb.y = TY; act.addChild(tb); }
  cupT.position.set(O1X + 230, 716 + TY - 6); cupT.scale.set(1.0); cupT.rotation = 0; act.addChild(cupT); steam(cupT, th);
  // table 2 + Oli 2 (yesterday)
  { const c2 = drawChair(O2X + 20, -1); c2.y = TY; act.addChild(c2); }
  const sipK = sstep(4.2, 4.4, th) * (1 - sstep(4.85, 5.05, th));
  const low = clone(PO.holdCup); low.turn = 0; low.head.r = 0; low.armL = { u: -0.3, l: -0.95, hand: 'open' };
  let p2 = blend(PO.holdCup, PO.sip, sipK); p2 = blend(p2, low, outCubic(prog(th, 5.0, 5.4)));
  const sur = th >= 5.4, bump = sur ? Math.max(0, 1 - (th - 5.4) * 8) : 0;
  p2.hips.y += 8;
  placeOli(oli2, { x: O2X, y: OY, s: 1.12 * (1 + 0.06 * bump), pose: p2, expr: sur ? 'surprised' : 'neutral', t: th, seed: 11, glance: th > 5.1 ? 0 : undefined, brow: sur ? -8 : 0 });
  cupA.position.set(0, 36); cupA.rotation = -0.15; cupA.scale.set(0.9); oli2.parts.handL.addChild(cupA); steam(cupA, th);
  act.addChild(oli2.root);
  { const tb2 = drawTable(O2X - 20); tb2.y = TY; act.addChild(tb2); }
  // pan blur + streaks
  if (cam.pan > 0.05) { blurV.strengthX = cam.pan * 40; blurV.strengthY = 0; view.filters = [blurV]; } else view.filters = null;
  // overlays
  const ov = new Container(); sc.addChild(ov);
  ov.addChild(cached('cafeVig', () => { const g = new Graphics(); dots(g, 0, 0, W, H, 16, (x, y) => { const d = Math.hypot((x - 960) / 960, (y - 540) / 540); return d > 0.7 ? (d - 0.7) * 9 : 0; }, '#8A4B2A'); g.alpha = 0.45; return g; }));
  if (cam.pan > 0.05) streaks(ov, th, cam.pan, { color: '#FFF1D0' });
  if (cam.bump > 0.05) speedLines(ov, th, 1250, 480, { alpha: 0.5 * cam.bump, r0: 420, n: 34 });
  phoneInsert(ov, th);
}
function steam(cup, th) {
  const g = cup._steam; g.clear();
  for (let i = 0; i < 3; i++) { const x = -14 + i * 14, ph = th * 2.2 + i * 1.7; g.moveTo(x, -56); for (let k = 1; k <= 6; k++) g.lineTo(x + Math.sin(ph + k * 0.9) * 6, -56 - k * 11); }
  g.stroke({ width: 4, color: '#FFFFFF', alpha: 0.7, cap: 'round' });
}

// phone screen close-up insert (motion graphics): date glitches 14 -> 13 KASIM
function phoneInsert(ov, th) {
  const a = prog(th, TD - 1.0, TD - 0.7), out = prog(th, TD + 1.3, TD + 1.6);
  if (a <= 0 || out >= 1) return;
  ov.addChild(new Graphics().rect(0, 0, W, H).fill({ color: INK, alpha: 0.55 * a * (1 - out) }));
  const c = new Container(); ov.addChild(c);
  c.position.set(960, lerp(1500, 540, outBack(a, 1.5)) + 1000 * inCubic(out)); c.rotation = -0.05 + 0.01 * Math.sin(th * 3); c.scale.set(0.9);
  const g = new Graphics();
  g.roundRect(-296, -456, 620, 940, 72).fill(INK);
  g.roundRect(-310, -470, 620, 940, 70).fill('#2B2F55').stroke({ width: 10, color: INK });
  g.roundRect(-280, -440, 560, 880, 44).fill('#101840');
  dots(g, -280, 200, 280, 440, 14, (x, y) => 3.2 * (y - 200) / 240, '#1B2A6E');
  g.roundRect(-70, -460, 140, 26, 13).fill(INK);
  c.addChild(g);
  c.addChild(T('ph1', '09:41', 34, { x: -200, y: -400, fill: '#FFFFFF', ls: 1, italic: false, nokeep: false }));
  c.addChild(new Graphics().roundRect(190, -412, 54, 26, 6).fill('#7FE3D8').stroke({ width: 3, color: '#FFFFFF' }));
  c.addChild(T('ph2', 'BUGÜN', 40, { x: 0, y: -280, fill: YEL, ls: 6 }));
  // date card
  const gl = th > TD - 0.45 && th < TD + 0.1, k = prog(th, TD + 0.05, TD + 0.45), flipped = k > 0.5;
  const dn = new Container(); dn.position.set(0, -80); dn.scale.y = k > 0 && k < 1 ? Math.max(0.03, Math.abs(Math.cos(Math.PI * k))) : 1; c.addChild(dn);
  dn.addChild(new Graphics().roundRect(-248, -138, 496, 276, 28).fill('#FFF4DC').stroke({ width: 8, color: INK }));
  dn.addChild(new Graphics().roundRect(-248, -138, 496, 60, 28).fill(CORAL));
  dn.addChild(new Graphics().rect(-248, -108, 496, 30).fill(CORAL));
  const fr = Math.floor(th * 30), dx = gl ? (hash(fr) - 0.5) * 36 : 0;
  const txt = flipped ? '13 KASIM' : '14 KASIM';
  if (gl) {
    dn.addChild(T('dg1', txt, 80, { x: dx + 12, y: 26, fill: CORAL, ls: 0, a: 0.85 }));
    dn.addChild(T('dg2', txt, 80, { x: dx - 12, y: 26, fill: TEAL, ls: 0, a: 0.85 }));
    const bars = new Graphics(); for (let i = 0; i < 4; i++) bars.rect(-248, -70 + hash(fr * 7 + i) * 200, 496, 10 + hash(fr + i * 3) * 18);
    bars.fill({ color: INK, alpha: 0.85 }); dn.addChild(bars);
  }
  dn.addChild(T('dtxt', txt, 80, { x: dx, y: 26, fill: INK, ls: 0 }));
  // week dots, highlight moves back one day at the flip
  const wk = new Graphics(); const hi = flipped ? 2 : 3;
  for (let i = 0; i < 7; i++) { wk.circle(-192 + i * 64, 160, 20).fill(i === hi ? CORAL : '#2B3C86').stroke({ width: 4, color: i === hi ? '#FFFFFF' : INK }); }
  c.addChild(wk);
  const rp = prog(th, TD + 0.4, TD + 0.9); if (rp > 0 && rp < 1) c.addChild(new Graphics().circle(0, -80, 150 + 330 * rp).stroke({ width: 10 * (1 - rp), color: '#FFFFFF', alpha: 1 - rp }));
  const ch = caption(c, 'phchip', 'BUGÜN = DÜN?!', 0, 300, { size: 52, bg: CORAL, fill: '#FFFFFF', stroke: INK, sw: 8, pop: pop(th, TD + 0.5, 0.25, 2.6), rot: 0.04 });
  c.addChild(T('ph3', '◀  1 gün geri', 34, { x: 0, y: 392, fill: '#7FE3D8', ls: 1, italic: false, a: flipped ? 1 : 0 }));
}

// ---------- split comic panels ----------
const P1 = [40, 40, 1050, 40, 850, 1040, 40, 1040], P2 = [1110, 40, 1880, 40, 1880, 1040, 910, 1040];
function panelCard(parent, poly, dx, base, build) {
  const c = new Container(); c.position.set(dx, 0); parent.addChild(c);
  c.addChild(new Graphics().poly(poly.map((v, i) => v + (i % 2 ? 16 : 14))).fill(INK));
  c.addChild(new Graphics().poly(poly).fill(base));
  const inner = new Container(); c.addChild(inner);
  const m = new Graphics().poly(poly).fill(0xffffff); c.addChild(m); inner.mask = m;
  build(inner);
  c.addChild(new Graphics().poly(poly).stroke({ width: 10, color: INK, join: 'miter' }));
  return c;
}
function splits(sc, th, ta, live) {
  sc.addChild(cached('splitBg', () => { const c = new Container(), g = new Graphics(); g.rect(0, 0, W, H).fill('#FFF4DC'); dots(g, 0, 0, W, H, 16, (x, y) => 2.4 - (y / H) * 1.2, '#EBDBB6'); c.addChild(g); return c; }));
  const e1 = outBack(prog(th, 8.55, 8.8), 1.5), e2 = outBack(prog(th, 8.6, 8.85), 1.5);
  const sk = Math.max(0, 1 - (th - 8.9) * 3) * (th >= 8.9 ? 1 : 0), scared = th >= 9.7;
  const mk = (id, col, ray, cx, who) => (inner) => {
    inner.addChild(cached('pbg' + id, () => { const c = new Container(), g = new Graphics(); g.rect(0, 0, W, H).fill(col); rays(g, cx, 520, 2000, 24, ray, 0.35, 0.2, 61 + id); const d = new Graphics(); dots(d, 0, 0, W, H, 18, (x, y) => Math.max(0, 4.2 - (H - y) / 70), ray); c.addChild(g, d); return c; }));
    const o = who === 1 ? oli1 : oli2;
    const lp = who === 1 ? talkOf(th) : {};
    const pose = clone(who === 1 ? PO.look : PO.idle); pose.turn = who === 1 ? 0.3 : 0; if (scared) pose.head.r = (who === 1 ? 0.1 : -0.1);
    const s = 2.05 * (1 + 0.05 * sk);
    placeOli(o, { x: cx, y: 200 + 610 * s, s, pose, expr: scared ? 'scared' : 'surprised', t: th, seed: who * 5, shadow: false, brow: 0, ...(live ? lp : {}), blink: 1 });
    inner.addChild(o.root);
    if (th > 8.55 && th < 8.7) inner.addChild(new Graphics().rect(0, 0, W, H).fill({ color: '#FFFFFF', alpha: 0.6 * (1 - prog(th, 8.55, 8.7)) }));
  };
  panelCard(sc, P1, -1100 * (1 - e1), '#FFE08A', mk(1, '#FFE08A', '#FFC24A', 450, 1));
  panelCard(sc, P2, 1100 * (1 - e2), '#BFF0EA', mk(2, '#BFF0EA', '#5FD8CC', 1400, 2));
  const ov = new Container(); sc.addChild(ov);
  const bp = pop(th, 8.9, 0.25, 2.8) * (1 - sstep(10.2, 10.5, th));
  if (th >= 8.9 && th < 9.3) speedLines(ov, th, 560, 540, { alpha: 0.5 * (1 - prog(th, 8.9, 9.3)), r0: 420, n: 30 });
  bubble(ov, 'bub1', 'BU... BENİM?!', 760, 175, 700, 190, 560, 420, { pop: bp, size: 70 });
}

// =====================================================================================
// FREEZE + VHS REWIND
// =====================================================================================
const tcStr = (s) => { s = Math.max(0, s); const m = Math.floor(s / 60), ss = Math.floor(s % 60), f = Math.floor((s % 1) * 30); const p = (n) => String(n).padStart(2, '0'); return `${p(m)}:${p(ss)}:${p(f)}`; };
function rewind(t) {
  const sc = new Container(), box = new Container();
  sc.addChild(new Graphics().rect(0, 0, W, H).fill('#000000')); sc.addChild(box);
  box.pivot.set(960, 540); box.position.set(960, 540);
  const sl = prog(t, 11.1, 12.3), th = t < 11.1 ? 10.45 : lerp(10.45, 0.3, inOutCubic(sl));
  const inner = hook(th, false).c; box.addChild(inner);
  const gk = sstep(10.5, 10.75, t) * 0.88; greyF.matrix = greyM(gk); inner.filters = [greyF];
  const ov = new Container(); box.addChild(ov);
  const vib = t >= 11.1 && t < 13.4 ? 1 : 0, fr = Math.floor(t * 30);
  box.position.x += vib * (hash(fr) - 0.5) * 16; box.position.y += vib * (hash(fr + 99) - 0.5) * 6;
  ov.addChild(cached('htGrey', () => { const g = new Graphics(); dots(g, 0, 0, W, H, 15, (x, y) => 1.2 + 3.4 * Math.abs(Math.sin((x + y) * 0.004)) * (0.4 + 0.6 * noise1(x * 0.006 + y * 0.004, 7)), '#3A3A52'); g.alpha = 0.3; return g; }));
  const fl = 0.85 * (1 - prog(t, 10.5, 10.72)); if (fl > 0.01) ov.addChild(new Graphics().rect(-100, -100, W + 200, H + 200).fill({ color: '#FFFFFF', alpha: fl }));
  if (t >= 10.5 && t < 11.1) {
    const g = new Graphics(); for (let i = 0; i < 5; i++) { let x = hash(fr * 5 + i) * W, y = 0; g.moveTo(x, y); while (y < H) { y += 70 + hash(i * 9 + y) * 60; x += (hash(i * 3 + y + fr) - 0.5) * 120; g.lineTo(x, y); } }
    g.stroke({ width: 4, color: '#FFFFFF', alpha: 0.6 * (1 - prog(t, 10.5, 11.1)) }); ov.addChild(g);
  }
  if (t >= 11.0) {
    const k = Math.min(1, prog(t, 11.0, 11.2));
    const sp = Math.sin(Math.PI * sl); if (sp > 0.02) streaks(ov, t, sp * 0.9, { color: '#CFE0FF' });
    const g = new Graphics(); for (let y = 0; y < H; y += 6) g.rect(0, y, W, 2); g.fill({ color: '#0A0E24', alpha: 0.28 * k }); ov.addChild(g);
    ov.addChild(new Graphics().rect(0, 0, W, H).fill({ color: '#3F6BFF', alpha: 0.16 * k }));
    const nz = t < 12.3 ? 3 : 9, bands = new Graphics();
    for (let i = 0; i < nz; i++) { const y = ((t * (700 + i * 300) + i * 410) % (H + 200)) - 100; bands.rect(0, y, W, 14 + hash(i + fr) * 50); }
    bands.fill({ color: '#FFFFFF', alpha: 0.13 }); ov.addChild(bands);
    const dsh = new Graphics(); for (let i = 0; i < (t < 12.3 ? 26 : 60); i++) dsh.rect(hash(fr * 3 + i) * W, hash(fr * 7 + i * 5) * H, 80 + hash(i + fr) * 360, 2 + hash(i * 3 + fr) * 5);
    dsh.fill({ color: '#FFFFFF', alpha: 0.55 }); ov.addChild(dsh);
    // timecode bar + label
    const rewinding = t < 13.0;
    ov.addChild(new Graphics().roundRect(1260, 120, 560, 96, 16).fill({ color: '#000000', alpha: 0.7 }));
    ov.addChild(T('tcode', '◀◀ ' + tcStr(th), 66, { x: 1540, y: 168, fill: '#FFFFFF', ls: 2, italic: false }));
    const on = Math.floor(t * 4) % 2 === 0 || t > 13.0;
    const lab = caption(ov, 'rwlab', rewinding ? '◀◀ GERİ SAR' : '▶ OYNAT', 330, 90, { size: 76, bg: rewinding ? CORAL : TEAL, fill: '#FFFFFF', stroke: INK, sw: 9, rot: -0.03, italic: true });
    lab.alpha = on ? 1 : 0.55;
    ov.addChild(T('sp', 'SP', 44, { x: 1840, y: 250, fill: '#FFFFFF', stroke: INK, sw: 6, italic: false }));
  }
  // short VHS static burst (4 frames) instead of any black frame
  if (t >= 13.3 && t < 13.43) { const g = new Graphics(), fr2 = Math.floor(t * 30); for (let i = 0; i < 260; i++) g.rect(hash(fr2 * 3 + i) * W, hash(fr2 * 7 + i * 5) * H, 60 + hash(i + fr2) * 500, 3 + hash(i * 3 + fr2) * 14); g.fill({ color: '#FFFFFF', alpha: 0.7 }); ov.addChild(g); ov.addChild(new Graphics().rect(0, 0, W, H).fill({ color: '#8FA0FF', alpha: 0.25 })); }
  return { c: sc };
}

// =====================================================================================
// TITLE
// =====================================================================================
function title(t) {
  const u = t - 14.0, sc = new Container();
  sc.addChild(cached('titleBg', () => {
    const c = new Container(), g = new Graphics();
    g.rect(0, 0, W, H).fill('#FFF4DC');
    g.poly([0, 0, 1180, 0, 760, H, 0, H]).fill('#7FDDD2'); g.poly([1180, 0, W, 0, W, H, 760, H]).fill('#FF9C8C');
    const d = new Graphics(); dots(d, 0, 0, W, 300, 18, (x, y) => Math.max(0, 4.2 - y / 70), '#FFFFFF');
    const d2 = new Graphics(); dots(d2, 0, 0, 960, H, 18, (x, y) => Math.max(0, 4.2 - (H - y) / 90), TEAL); dots(d2, 960, 0, W, H, 18, (x, y) => Math.max(0, 4.2 - (H - y) / 90), CORAL);
    c.addChild(g, d, d2); return c;
  }));
  const ray = new Graphics(); rays(ray, 960, 380, 2200, 30, '#FFFFFF', 0.4, u * 0.25, 31); ray.alpha = 0.5; sc.addChild(ray);
  const k = prog(u, 0.1, 0.27), land = u - 0.27;
  const s = u < 0.1 ? 0 : 1 + 2.6 * Math.pow(1 - k, 2) + (k >= 1 ? 0.09 * Math.exp(-land * 9) * Math.cos(land * 28) : 0);
  const up = inOutCubic(prog(u, 0.95, 1.35)), ty = lerp(470, 360, up), ts = s * lerp(1, 0.78, up);
  const ov = new Container(); sc.addChild(ov);
  if (u >= 0.27 && u < 0.8) speedLines(ov, t, 960, ty, { alpha: 0.7 * (1 - prog(u, 0.27, 0.8)), r0: 330 });
  const bc = new Container(); bc.position.set(960, ty); bc.scale.set(ts); bc.visible = ts > 0.001; ov.addChild(bc);
  burst(bc, 0, 0, 450, { fill: YEL, n: 13, seed: 12, jit: 0.3, dot: '#F2B33D' });
  bc.addChild(T('title', 'YA ... \nOLSAYDI?', 124, { fill: CORAL, stroke: INK, sw: 14, rot: -0.07, ls: 2 }));
  const chip = (key, s2, y, bg, t0, rot) => caption(ov, key, s2, 960, y, { size: 64, bg, fill: '#FFFFFF', stroke: INK, sw: 9, pop: pop(u, t0, 0.28, 2.4), rot, italic: true });
  chip('chipA', '1.000.000 $ ...', 640, TEAL, 1.0, -0.025);
  const orp = pop(u, 1.28, 0.25, 2.8), oc = new Container(); oc.position.set(960, 735); oc.scale.set(orp); oc.visible = orp > 0.001; ov.addChild(oc);
  oc.addChild(new Graphics().circle(6, 8, 40).fill(INK)); oc.addChild(new Graphics().circle(0, 0, 40).fill('#FFFFFF').stroke({ width: 6, color: INK })); oc.addChild(T('or', 'YA DA', 30, {}));
  chip('chipB', '24 SAAT GERİ?', 830, CORAL, 1.5, 0.02);
  return { c: sc };
}

// =====================================================================================
// CHOICE + INTO B
// =====================================================================================
const A_POLY = [0, 0, 1018, 0, 898, 1080, 0, 1080];
function badge(parent, key, x, y, col, sc, ch = key) {
  const c = new Container(); c.position.set(x, y); c.scale.set(sc); c.visible = sc > 0.001; parent.addChild(c);
  c.addChild(new Graphics().circle(7, 9, 88).fill(INK));
  c.addChild(new Graphics().circle(0, 0, 88).fill(col).stroke({ width: 9, color: INK }));
  c.addChild(new Graphics().circle(0, 0, 70).stroke({ width: 4, color: '#FFFFFF', alpha: 0.7 }));
  c.addChild(T('badge' + key, ch, 120, { fill: '#FFFFFF', stroke: INK, sw: 10, y: 4, ls: 0 }));
}
function choiceOli(t, ta, expand) {
  const o = { x: 975, y: 1050, s: 0.74, expr: 'neutral', t, seed: 7 };
  const p = clone(PO.idle);
  let pose = p;
  const g = (a, b) => sstep(a, a + 0.18, t) * (1 - sstep(b, b + 0.18, t)); // glance window
  const gA1 = g(17.15, 18.6), gB = g(18.8, 20.3), gA2 = g(20.4, 21.2);
  const gl = -gA1 + gB - gA2; // -1 = A (left), +1 = B (right)
  pose.head.r = 0.12 * gl; pose.torso.r = 0.03 * gl; pose.hips.y += Math.sin(t * 5.2) * 2;
  o.glance = gl; o.brow = -6 * (gA1 + gB);
  const th = sstep(21.2, 21.6, t) * (1 - sstep(22.3, 22.5, t));
  if (th > 0) { pose = blend(pose, clone(PO.think), th); o.glance = -0.5 * th; o.browTilt = 0.1 * th; }
  const tb = clone(PO.turnB); tb.hips.y += 14; tb.torso.r -= 0.2;
  if (t >= 22.25 && t < 22.5) { pose = blend(pose, tb, outCubic(prog(t, 22.25, 22.5))); o.glance = 1; }
  if (t >= 22.5) {
    const pt = clone(PO.point); pt.hips.y += Math.sin(ta * 6) * 2;
    pose = blend(tb, pt, outCubic(prog(ta, 22.55, 22.7))); o.expr = 'happy'; o.glance = 1; o.brow = -10;
    Object.assign(o, talkOf(t));
    if (t >= 23.85) { pose = blend(pose, PO.look, outCubic(prog(t, 23.85, 24.3))); o.expr = 'neutral'; }
  }
  // expanded + walk into the booth
  o.x = lerp(975, 570, expand); o.y = lerp(1050, 1030, expand); o.s = lerp(0.74, 0.72, expand);
  let inside = false;
  if (t >= 24.7) {
    const k = prog(t, 24.7, 25.4), e = k * k * (3 - 2 * k) * 0.3 + k * 0.7;
    o.x = lerp(570, 1195, e); o.s = lerp(0.72, 0.6, k); o.y = lerp(1030, 1010, k);
    pose = walkPose((t - 24.7) * 7.2); o.expr = 'happy'; o.glance = 1; o.talk = undefined;
    inside = e > 0.86;
  }
  o.pose = pose; o.inside = inside;
  return o;
}
function choice(t) {
  const ta = hold(t, CSTOPS), sc = new Container();
  const slide = outBack(prog(t, 16.4, 16.85), 1.3);
  const expand = inOutCubic(prog(t, 24.3, 24.9));
  const greyK = prog(t, 22.75, 23.3), dis = prog(t, 23.1, 23.95);
  const orb = 38 * Math.sin((t - 16.4) * 0.75) * (1 - expand);
  const camC = new Container(); sc.addChild(camC);
  const zoom = 1 + 2.4 * inCubic(prog(t, 24.95, 25.85)), bx = lerp(1560, 1200, expand), by = lerp(1045, 1030, expand), bs = lerp(1.32, 1.45, expand);
  camC.pivot.set(1200, 1030 - 250 * 1.45); camC.position.set(1200, 1030 - 250 * 1.45); camC.scale.set(zoom);
  camC.addChild(cached('choiceBgPaper', () => new Graphics().rect(-400, -400, W + 800, H + 800).fill('#FFF4DC')));
  const gut = new Graphics(), ga = 1 - sstep(24.2, 24.6, t);
  if (ga > 0.01) { gut.poly([1018, 0, 1062, 0, 942, 1080, 898, 1080]).fill(INK); gut.poly([1032, 0, 1048, 0, 928, 1080, 912, 1080]).fill('#FFFFFF'); gut.alpha = ga; camC.addChild(gut); }
  // ----- B panel -----
  const bl = lerp(1062, -300, expand), bl2 = lerp(942, -300, expand);
  const B_POLY = [bl, 0, W + 400, 0, W + 400, H + 400, bl2, H + 400];
  const openT = outBack(prog(t, 25.0, 25.4), 2.2) * (t >= 25.0 ? 1 : 0);
  const flashB = t >= 22.62 ? Math.max(0, 1 - (t - 22.62) / 0.3) : 0;
  const popB = Math.max(0.001, pop(t, 16.85, 0.45, 2.2));
  let boRef, innerB;
  panelCard(camC, B_POLY, 1100 * (1 - slide), '#FFD0BE', (inner) => {
    const bg = cached('bgB', () => { const c = new Container(), g = new Graphics(); g.rect(0, -400, 3000, H + 800).fill('#FFD0BE'); rays(g, 1500, 520, 2400, 28, '#FF8C78', 0.35, 0.1, 41);
      const d = new Graphics(); dots(d, 0, 0, 3000, H + 400, 20, (x, y) => Math.max(0, 4.8 - (H - y) / 60), CORAL); dots(d, 0, 0, 3000, 260, 20, (x, y) => Math.max(0, 4.4 - y / 55), CORAL); c.addChild(g, d); return c; });
    bg.position.x = -300 * expand + orb * 0.4; inner.addChild(bg);
    const lsp = sstep(25.0, 25.5, t);
    if (lsp > 0.01) {
      const lc = new Container(); lightBurst(lc, bx, by - 255 * bs, 1300, lsp * 0.8, t * 0.3); inner.addChild(lc);
      inner.addChild(new Graphics().poly([bx - 190 * bs / 1.3, by, bx + 190 * bs / 1.3, by, bx + 700, 1300, bx - 700, 1300]).fill({ color: '#FFF4C8', alpha: 0.5 * lsp * Math.min(1, openT + 0.2) }));
    }
    const bo = drawBooth({ open: openT, glow: t >= 25 ? 1 : 0.18, paneAlpha: 0.9, clockPulse: Math.max(0, Math.sin(t * 7)) * 0.35 + 0.8 * flashB });
    for (const p of [bo.back, bo.front]) { p.position.set(bx + orb, by); p.scale.set(bs * popB * (1 + 0.05 * flashB)); }
    inner.addChild(bo.back);
    boRef = bo; innerB = inner;
    const bn = pop(t, 17.2, 0.3, 2.2) * (1 - sstep(24.0, 24.3, t));
    caption(inner, 'labB', '24 SAAT GERİ', 1440, 100, { size: 58, bg: CORAL, fill: '#FFFFFF', stroke: INK, sw: 8, pop: bn, rot: 0.02 });
    badge(inner, 'B', 1800, 130, CORAL, pop(t, 16.95, 0.3, 3.0) * (1 + 0.55 * flashB) * (1 - sstep(24.2, 24.5, t)));
    if (flashB > 0) inner.addChild(new Graphics().rect(0, 0, W + 100, H).fill({ color: '#FFFFFF', alpha: 0.55 * flashB }));
  });
  // ----- A panel (desaturates + dissolves) -----
  const aW = new Container(); camC.addChild(aW);
  if (dis < 1) {
    const cA = panelCard(aW, A_POLY, -1100 * (1 - slide), '#BFF0EA', (inner) => {
      const bgA = cached('bgA', () => { const c = new Container(), g = new Graphics(); g.rect(0, 0, W, H).fill('#BFF0EA'); rays(g, 460, 520, 2000, 26, '#5FD8CC', 0.35, 0.3, 51);
        const d = new Graphics(); dots(d, 0, 0, W, H, 20, (x, y) => Math.max(0, 4.8 - (H - y) / 60), TEAL); dots(d, 0, 0, 1100, 260, 20, (x, y) => Math.max(0, 4.4 - y / 55), TEAL); c.addChild(g, d); return c; });
      bgA.position.x = orb * 0.4; inner.addChild(bgA);
      const v = drawVault({ t, rot: t * 0.3 + 8 * (1 - outCubic(prog(t, 16.4, 17.4))) });
      v.position.set(470 + orb, 520); v.scale.set(1.0 * Math.max(0.001, pop(t, 16.65, 0.45, 2.2))); inner.addChild(v);
      caption(inner, 'labA', '1 MİLYON $', 560, 100, { size: 58, bg: TEAL, fill: '#FFFFFF', stroke: INK, sw: 8, pop: pop(t, 17.0, 0.3, 2.2), rot: -0.02 });
      badge(inner, 'A', 130, 130, TEAL, pop(t, 16.75, 0.3, 3.0));
      if (greyK > 0) {
        greyF.matrix = greyM(greyK); inner.filters = [greyF];
        const ht = new Graphics(); dots(ht, 0, 0, 1020, H, 14, (x, y) => 4.6 * greyK * (0.45 + 0.55 * noise1(x * 0.01 + y * 0.013, 3)), '#444458'); ht.alpha = 0.5; inner.addChild(ht);
      }
    });
    if (dis > 0) {
      const cs = 30, mk = new Graphics(), gl = new Graphics(), gc2 = new Graphics();
      for (let j = 0; j * cs < H; j++) for (let i = 0; i * cs < 1040; i++) {
        const cx = i * cs + cs / 2, cy = j * cs + cs / 2, n = 0.5 * hash2(i, j, 7) + 0.5 * (cx / 1040 * 0.6 + (1 - cy / H) * 0.4);
        const loc = clamp((n - (dis * 1.35 - 0.35)) / 0.35, 0, 1);
        if (loc >= 1) mk.rect(cx - cs / 2 - 0.5, cy - cs / 2 - 0.5, cs + 1, cs + 1);
        else if (loc > 0.01) { mk.circle(cx, cy, cs * 0.78 * loc); if (loc < 0.45) { gl.circle(cx, cy, cs * (0.34 + 0.4 * loc)); gc2.circle(cx, cy, cs * (0.16 + 0.2 * loc)); } }
      }
      mk.fill(0xffffff); gl.fill({ color: '#FF7A1A', alpha: 0.75 }); gc2.fill({ color: '#FFE066', alpha: 0.95 });
      aW.addChild(mk); cA.mask = mk; aW.addChild(gl); aW.addChild(gc2);
    }
  }
  // ----- Oli (foreground layer, strongest parallax) -----
  const o = choiceOli(t, ta, expand);
  const ps = outBack(prog(t, 16.6, 16.95), 2.4);
  if (t >= 16.6) {
    o.s *= Math.max(0.001, ps); o.x += orb * 1.8; o.y += 0; o.ta = undefined;
    placeOli(oli1, o);
    if (o.inside) innerB.addChild(oli1.root); else camC.addChild(oli1.root);
  }
  innerB.addChild(boRef.front);
  // ----- overlays -----
  const ov = new Container(); sc.addChild(ov);
  if (t >= 16.4 && t < 16.85) speedLines(ov, t, 960, 540, { alpha: 0.5 * (1 - prog(t, 16.4, 16.85)), r0: 420, n: 30 });
  const bub = pop(t, 22.62, 0.25, 2.8) * (1 - sstep(23.9, 24.2, t));
  if (t >= 22.62 && t < 23.0) speedLines(ov, t, 1400, 520, { alpha: 0.45 * (1 - prog(t, 22.62, 23.0)), r0: 380, n: 30 });
  bubble(ov, 'bub2', 'BUNU SEÇİYORUM!', 700, 215, 780, 170, 1000, 430, { pop: bub, size: 62 });
  // warp / zoom-through into the booth + end card
  const wp = prog(t, 25.2, 25.85);
  if (wp > 0 && t < 26.1) {
    speedLines(ov, t, 1200, 1030 - 250 * 1.45, { alpha: 0.9 * wp, r0: lerp(500, 120, wp), r1: 1800, n: 44, color: '#FFFFFF' });
    ov.addChild(new Graphics().rect(-100, -100, W + 200, H + 200).fill({ color: '#FFFFFF', alpha: Math.max(0, wp - 0.45) * 1.8 * (1 - prog(t, 25.9, 26.15)) }));
  }
  if (t >= 25.85) endCard(ov, t);
  return { c: sc };
}
function endCard(ov, t) {
  const u = t - 25.85, f = 1 - prog(u, 0, 0.3);
  const c = new Container(); ov.addChild(c);
  c.addChild(cached('endBg', () => new Graphics().rect(-100, -100, W + 200, H + 200).fill('#FFF4DC')));
  const r = new Graphics(); rays(r, 960, 430, 2400, 22, '#7FDDD2', 0.4, u * 0.3, 77); c.addChild(r);
  const d = new Graphics(); dots(d, 0, 0, W, H, 18, (x, y) => Math.max(0, 4.2 - (H - y) / 110), CORAL); c.addChild(d);
  const p1 = Math.max(0.001, pop(u, 0, 0.3, 2.4)), p2 = Math.max(0.001, pop(u, 0.06, 0.25, 2.6)), p3 = Math.max(0.001, pop(u, 0.14, 0.25, 3.0));
  const b = new Container(); b.position.set(960, 380); b.scale.set(p1 * (1 + 0.02 * Math.sin(u * 6))); c.addChild(b);
  burst(b, 0, 0, 560, { fill: YEL, n: 14, seed: 21, jit: 0.3, dot: '#F2B33D' });
  const g = new Graphics();
  g.circle(12, 14, 270).fill(INK); g.circle(0, 0, 270).fill(TEAL).stroke({ width: 14, color: INK }); g.circle(0, 0, 232).stroke({ width: 6, color: '#FFFFFF', alpha: 0.7 });
  const fork = (w, col) => { g.moveTo(0, 170).lineTo(0, 20).moveTo(0, 20).lineTo(-110, -70).moveTo(0, 20).lineTo(110, -70).moveTo(-110, -70).lineTo(-110, -125).moveTo(110, -70).lineTo(110, -125).stroke({ width: w, color: col, cap: 'round', join: 'round' }); };
  fork(66, INK); fork(40, '#FFFFFF');
  for (const sx of [-110, 110]) { g.poly([sx - 55, -122, sx + 55, -122, sx, -205]).fill(INK); g.poly([sx - 36, -128, sx + 36, -128, sx, -180]).fill('#FFFFFF'); }
  b.addChild(g);
  caption(c, 'endcap', 'SEÇİM:', 700, 835, { size: 170, bg: '#FFFFFF', fill: INK, stroke: '#FFFFFF', sw: 2, pop: p2, rot: -0.03, italic: true });
  const bb = new Container(); bb.position.set(1290, 830); bb.scale.set(p3); c.addChild(bb);
  bb.addChild(new Graphics().circle(10, 12, 150).fill(INK)); bb.addChild(new Graphics().circle(0, 0, 150).fill(CORAL).stroke({ width: 12, color: INK }));
  bb.addChild(T('endB', 'B', 220, { fill: '#FFFFFF', stroke: INK, sw: 16, y: 8, ls: 0 }));
  c.addChild(new Graphics().rect(-100, -100, W + 200, H + 200).fill({ color: '#FFFFFF', alpha: 0.7 * f }));
}

// =====================================================================================
// KINETIC SUBTITLES (screen space, un-shaken)
// =====================================================================================
function subtitles(t) {
  const ov = new Container(); capLayer.addChild(ov);
  for (const L of VOICE) {
    if (t < L.start - 0.02 || t > L.start + L.dur + 0.3 || VOICE.some((M) => M.start > L.start && M.start <= t)) continue;
    const wt = wordTimes(L), size = 56, gap = 18, maxW = 1560, keys = KEY[L.id] || {};
    const items = wt.map((x, i) => { const kc = keys[norm(x.w)]; const tx = T(`sw_${L.id}_${i}`, x.w, size, { fill: kc || '#FFFFFF', stroke: INK, sw: 13, ls: 1 }); return { tx, w: tx.width, t: x.t, key: !!kc }; });
    const rows = [[]]; let rw = 0;
    for (const it of items) { if (rw + it.w > maxW && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push(it); rw += it.w + gap; }
    const out = 1 - prog(t, L.start + L.dur, L.start + L.dur + 0.25), base = 1010 - (rows.length - 1) * 66;
    rows.forEach((row, ri) => {
      const tw = row.reduce((a, it) => a + it.w + gap, -gap); let x = 960 - tw / 2;
      for (const it of row) {
        const k = outBack(prog(t, it.t, it.t + 0.2), 2.6), tx = it.tx;
        tx.position.set(x + it.w / 2, base + ri * 66 + (1 - k) * 30); tx.anchor.set(0.5, 0.5);
        const pulse = it.key ? 1 + 0.18 * Math.max(0, 1 - (t - it.t) * 3) * (t >= it.t ? 1 : 0) : 1;
        tx.scale.set(Math.max(0.001, k) * pulse); tx.alpha = (t >= it.t ? 1 : 0) * out; tx.rotation = (1 - k) * -0.12;
        ov.addChild(tx); x += it.w + gap;
      }
    });
  }
}

// =====================================================================================
export function render(t) {
  clear();
  let r;
  if (t < 10.5) r = hook(t);
  else if (t < 14.0) r = rewind(t);
  else if (t < 16.4) r = title(t);
  else r = choice(t);
  const sh = shakeAt(t, GEV);
  root.pivot.set(960, 540); root.position.set(960 + sh.x, 540 + sh.y); root.rotation = sh.r;
  { const m = Math.abs(sh.x) + Math.abs(sh.y) + Math.abs(sh.r) * 900; root.scale.set(1 + Math.min(0.1, m / 900)); }
  root.addChild(r.c);
  subtitles(t);
  app.render();
}
