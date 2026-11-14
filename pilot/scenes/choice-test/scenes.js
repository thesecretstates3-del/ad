// Scene composition. Every function here is a pure function of time.
import { Container, Graphics, ColorMatrixFilter, BlurFilter } from 'pixi.js';
import { INK, TEAL, CORAL, YEL, CREAM, NAVY, W, H, clamp, lerp, prog, sstep, outCubic, inCubic, inOutCubic, outBack, pop, hash, hash2, noise1,
  shakeAt, T, keepers, cached, dots, rays, burst, polyPanel, caption, bang, bubble, speedLines, streaks, puff, star4 } from './lib.js';
import { GY, buildStreet, buildBusStop, drawBooth, lightBurst, drawVault, drawCoin, buildCup } from './props.js';
import { PO, walkPose, blend, makeOli, placeOli, blinkAt } from './oli.js';

let app, root, oli1, oli2, cup, cupStart = { x: 1400, y: 900 };
const greyF = new ColorMatrixFilter(), blurF = new BlurFilter({ strengthX: 0, strengthY: 0, quality: 3 });
const greyM = (k) => [(1 - k) + k * 0.3, k * 0.59, k * 0.11, 0, 0, k * 0.3, (1 - k) + k * 0.59, k * 0.11, 0, 0, k * 0.3, k * 0.59, (1 - k) + k * 0.11, 0, 0, 0, 0, 0, 1, 0];
const q15 = (t) => Math.floor(t * 15 + 1e-6) / 15; // animate on twos (15 fps)

// ---------- event data (all in real seconds) ----------
const HSTOPS = [{ t: 0.12, d: 0.12 }, { t: 5.6, d: 0.12 }];
const HEV = [{ t: 0, amp: 0.9, dur: 0.6 }, { t: 3.05, amp: 0.25, dur: 0.35 }, { t: 4.2, amp: 0.35, dur: 0.3 }, { t: 5.6, amp: 1, dur: 0.8 }];
const GEV = [{ t: 6.4, amp: 0.5, dur: 0.3 }, { t: 7.15, amp: 0.9, dur: 0.5 }, { t: 9.0, amp: 0.5, dur: 0.4 }, { t: 9.5, amp: 0.15, dur: 0.2 }, { t: 9.9, amp: 0.15, dur: 0.2 },
  { t: 13.5, amp: 0.6, dur: 0.5 }, { t: 14.3, amp: 0.2, dur: 0.3 }, { t: 16.4, amp: 0.3, dur: 0.3 }, { t: 18.44, amp: 1, dur: 0.7 }];
const CSTOPS = [{ t: 13.5, d: 0.1 }, { t: 18.44, d: 0.08 }];
// hit-stop: freeze the animation clock inside the stop window (resumes at real time afterwards)
const hold = (t, stops) => { for (const s of stops) if (t >= s.t && t < s.t + s.d) return s.t; return t; };

export function init(a) {
  app = a; root = new Container(); app.stage.addChild(root);
  oli1 = makeOli(app); oli2 = makeOli(app); cup = buildCup();
  keepers.push(oli1.root, oli2.root, cup);
  // cup release point = where Oli2's hand is at 5.6 s in the split panel
  const tmp = new Container(); root.addChild(tmp); splitLayout(tmp, 5.6, 5.6);
  const p = oli2.parts.handL.getGlobalPosition(); cupStart = { x: p.x, y: p.y };
  oli1.root.parent?.removeChild(oli1.root); oli2.root.parent?.removeChild(oli2.root); cup.parent?.removeChild(cup);
  for (const k of keepers) k.parent?.removeChild(k);
  root.removeChild(tmp); tmp.destroy({ children: true });
}
function clear() {
  for (const k of keepers) k.parent?.removeChild(k);
  for (const c of root.removeChildren()) c.destroy({ children: true });
  root.filters = null;
}

// =====================================================================================
// HOOK
// =====================================================================================
const BX = 700, BS = 1.3; // booth world x + scale
function hook(th) {
  const ta = hold(th, HSTOPS), tq = q15(ta);
  const sc = new Container();
  if (th < 4.2) street(sc, th, ta, tq); else splitLayout(sc, th, ta);
  return { c: sc, sh: shakeAt(th, HEV) };
}

function street(sc, th, ta, tq) {
  const camX = 960 + 1340 * inOutCubic(prog(th, 3.0, 3.5));
  const zoom = 1 + 0.1 * (1 - outCubic(prog(th, 0, 0.5))) + 0.06 * sstep(3.6, 4.2, th);
  const view = new Container(); sc.addChild(view);
  const world = new Container(); view.addChild(world);
  world.pivot.set(camX, 600); world.position.set(960, 600); world.scale.set(zoom);
  const pan = Math.sin(Math.PI * prog(th, 3.0, 3.5));
  if (pan > 0.05) { blurF.strengthX = pan * 34; blurF.strengthY = 0; view.filters = [blurF]; }
  world.addChild(cached('street', () => { const c = buildStreet(); try { c.cacheAsTexture(true); } catch (e) { } return c; }));
  world.addChild(cached('bus', () => buildBusStop(2480)));

  // light spill from the open booth
  const open = th < 0 ? 0 : outBack(prog(ta, 0, 0.2), 2.6);
  const lg = 0.9 * (1 - sstep(0.6, 2.2, th));
  if (lg > 0.01) { const lc = new Container(); lightBurst(lc, BX, GY - 330, 900, lg * 0.55, th * 0.25); world.addChild(lc); }
  // booth
  const rat = th < 1.2 ? 12 * Math.exp(-th * 5) * Math.sin(th * 70) : 0;
  const bo = drawBooth({ open, glow: 1 - sstep(1.0, 2.6, th) * 0.5, clockPulse: Math.max(0, Math.sin(th * 6)) });
  for (const p of [bo.back, bo.front]) { p.position.set(BX + rat, GY); p.scale.set(BS); }
  world.addChild(bo.back);

  // Oli 1 (stumbles out of the booth)
  const o1 = oli1State(th, ta, tq);
  if (o1.vis) {
    placeOli(oli1, o1);
    if (o1.behind) { world.addChild(oli1.root); world.addChild(bo.front); } else { world.addChild(bo.front); world.addChild(oli1.root); }
    if (th > 1.5 && th < 2.7) {
      const g = new Graphics(), hx = oli1.root.x + 20, hy = oli1.root.y - 735 * o1.s;
      for (let i = 0; i < 3; i++) { const a = tq * 8 + i * 2.094; const x = hx + Math.cos(a) * 150 * o1.s, y = hy + Math.sin(a) * 34 * o1.s; star4(g, x, y, 30, a); g.fill(YEL); star4(g, x, y, 30, a); g.stroke({ width: 5, color: INK, join: 'miter' }); }
      world.addChild(g);
    }
  } else world.addChild(bo.front);

  // smoke puffs
  for (let i = 0; i < 9; i++) {
    const t0 = -0.15 + hash(i * 5) * 0.2, k = prog(th, t0, t0 + 1.0 + hash(i) * 0.4); if (k <= 0 || k >= 1) continue;
    const dir = i % 2 ? 1 : -1, e = outCubic(k);
    const x = BX + dir * (170 + 260 * e * (0.6 + hash(i * 11 + 3) * 0.6)), y = GY - 60 - 90 * e - hash(i + 40) * 200 * e;
    puff(world, x, y, (40 + 80 * e + hash(i + 7) * 30) * (1 - sstep(0.7, 1, k)), 1, i * 13);
  }
  // Oli 2 at the bus stop
  const o2 = oli2State(th, ta, tq);
  placeOli(oli2, o2); world.addChild(oli2.root);
  if (th < 3.9) { cup.position.set(0, 36); cup.rotation = -0.15; cup.scale.set(0.9); oli2.parts.handL.addChild(cup); }
  else { cup.position.set(0, 36); cup.rotation = -0.15; cup.scale.set(0.9); oli2.parts.handL.addChild(cup); }

  // overlays (screen space)
  const ov = new Container(); sc.addChild(ov);
  if (th < 0.7) speedLines(ov, th, 960, 540, { alpha: 0.6 * (1 - prog(th, 0, 0.7)), r0: 380 });
  if (pan > 0.05) streaks(ov, th, pan);
  const b = pop(th + 0.12, 0, 0.3, 2.6) * (1 - sstep(1.1, 1.4, th));
  bang(ov, 'bam', 'BAM!', 1230, 330, 330, { pop: b, rot: -0.1 + Math.sin(th * 30) * 0.015 * (th < 0.6 ? 1 : 0), seed: 5, n: 12, size: 190, dot: '#FFB000' });
}

function oli1State(th, ta, tq) {
  const o = { x: BX, y: GY, s: 0.74, pose: PO.stumble, expr: 'scared', blink: 1, vis: th > 0.3, behind: th < 1.0 };
  if (!o.vis) return o;
  const alt = Math.floor(tq / 0.18) % 2;
  const sw = alt ? PO.stumble2 : PO.stumble;
  if (th < 1.9) {
    o.pose = sw; o.x = BX + 300 * outCubic(prog(tq, 1.0, 1.9)) - (alt ? 6 : 0);
    if (th < 1.0) { o.s = 0.7; o.x = BX + Math.sin(tq * 12) * 10; }
    o.expr = alt ? 'scared' : 'surprised';
  } else if (th < 2.5) {
    const k = 0.5 + 0.5 * Math.sin(tq * 8), f = 1 - prog(tq, 1.9, 2.5) * 0.7;
    o.pose = blend(PO.stumble2, PO.look, 1 - k * f); o.x = BX + 300; o.expr = th < 2.2 ? 'scared' : 'neutral';
  } else {
    const p = JSON.parse(JSON.stringify(PO.look)); const ph = tq - 2.5;
    p.head.r = 0.26 * Math.sin(ph * 3.4); p.torso.r = 0.03 * Math.sin(ph * 3.4);
    o.pose = p; o.x = BX + 300; o.expr = 'neutral'; o.glance = Math.sin(ph * 3.4 + 0.6); o.blink = blinkAt(tq, 0.4);
  }
  o.y = GY + (th >= 1.0 ? 20 : 0);
  return o;
}
function oli2State(th, ta, tq) {
  const frontCup = JSON.parse(JSON.stringify(PO.holdCup)); frontCup.turn = 0; frontCup.head.r = 0;
  const sipK = sstep(3.0, 3.25, tq) * (1 - sstep(3.4, 3.6, tq));
  let p = blend(PO.holdCup, PO.sip, sipK);
  p = blend(p, frontCup, outCubic(prog(tq, 3.62, 3.82)));
  const sur = tq >= 3.95;
  const bump = Math.max(0, 1 - (tq - 3.95) * 9) * (sur ? 1 : 0);
  return { x: 2540, y: GY, s: 0.76 * (1 + 0.07 * bump), pose: p, expr: sur ? 'surprised' : 'neutral', blink: blinkAt(tq, 1.1), vis: true };
}

// ---------- split comic panels (close-ups) ----------
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
function splitLayout(sc, th, ta) {
  const tq = q15(ta);
  sc.addChild(cached('splitBg', () => { const c = new Container(), g = new Graphics(); g.rect(0, 0, W, H).fill('#FFF4DC'); dots(g, 0, 0, W, H, 16, (x, y) => 2.4 - (y / H) * 1.2, '#EBDBB6'); c.addChild(g); return c; }));
  const e1 = outBack(prog(th, 4.2, 4.5), 1.5), e2 = outBack(prog(th, 4.26, 4.56), 1.5);
  const scream = th >= 5.6, sk = th - 5.6;
  // characters
  const S = 1.5;
  const hz = (a, b) => prog(tq, a, b);
  const mkOli = (ch, x, who) => {
    let pose = who === 1 ? PO.idle : PO.holdCup, expr = 'neutral', mouthShape = null, mouth = null;
    if (tq >= 4.45) expr = 'surprised';
    if (tq >= 4.95) { expr = 'scared'; pose = blend(pose, who === 1 ? PO.cower : blend(PO.holdCup, PO.cower, 0.5), outCubic(hz(4.95, 5.2))); }
    let hs = 0;
    if (tq >= 5.6) { pose = JSON.parse(JSON.stringify(blend(who === 1 ? PO.cower : PO.holdCup, PO.scream, outCubic(hz(5.6, 5.72))))); expr = 'scared'; mouthShape = 'surprised'; mouth = [2.1, 3.0 + 0.4 * Math.sin(tq * 40)]; pose.head.r += 0.14 * Math.sin(tq * 38 + who); hs = 1; }
    const wide = 1 + 0.28 * sstep(4.45, 4.75, tq);
    placeOli(ch, { x, y: 1290, s: S * (1 + 0.05 * (1 - Math.min(1, (tq - 5.6) * 8)) * (tq >= 5.6 ? 1 : 0)), pose, expr, blink: tq < 4.45 ? blinkAt(tq, who) : 1, mouth, shadow: false });
    ch.parts.eyeL.scale.x *= wide; ch.parts.eyeL.scale.y *= wide; ch.parts.eyeR.scale.x *= wide; ch.parts.eyeR.scale.y *= wide;
    if (mouthShape) { const sh = ch.parts.mouth._shapes; for (const k in sh) sh[k].visible = k === mouthShape; }
  };
  const c1 = panelCard(sc, P1, -1150 * (1 - e1), '#5B3FA0', (inner) => {
    inner.addChild(cached('bgP1', () => { const c = new Container(), g = new Graphics(); g.rect(0, 0, W, H).fill('#4A3490'); rays(g, 470, 520, 1500, 30, '#6B4FBA', 0.5, 0.2, 21);
      const d = new Graphics(); dots(d, 0, 0, W, H, 18, (x, y) => Math.max(0, 4.6 - (H - y) / 55), CORAL); c.addChild(g, d); return c; }));
    mkOli(oli1, 460, 1); inner.addChild(oli1.root);
  });
  const c2 = panelCard(sc, P2, 1150 * (1 - e2), YEL, (inner) => {
    inner.addChild(cached('bgP2', () => { const c = new Container(), g = new Graphics(); g.rect(0, 0, W, H).fill('#FFD54A'); rays(g, 1450, 520, 1500, 30, '#FFE88F', 0.5, 0.1, 22);
      const d = new Graphics(); dots(d, 0, 0, W, H, 18, (x, y) => Math.max(0, 4.6 - (H - y) / 55), '#F2B33D'); c.addChild(g, d); return c; }));
    mkOli(oli2, 1420, 2); inner.addChild(oli2.root);
    if (th < 5.6) { cup.position.set(0, 36); cup.rotation = -0.15; cup.scale.set(0.9); oli2.parts.handL.addChild(cup); }
  });
  // overlays
  const ov = new Container(); sc.addChild(ov);
  if (th >= 5.6 && th < 6.45) speedLines(ov, th, 960, 520, { alpha: 0.5, r0: 420, color: '#FFFFFF' });
  // coffee cup flying
  if (th >= 5.6) {
    const r = th - 5.6, g0 = 2600, v = { x: -300, y: -1850 };
    const pos = (u) => ({ x: cupStart.x + v.x * u, y: cupStart.y + v.y * u + 0.5 * g0 * u * u });
    const p = pos(r), vy = v.y + g0 * r, sp = Math.min(1, Math.hypot(v.x, vy) / 1500);
    const tr = new Graphics();
    for (let i = 1; i <= 8; i++) { const pp = pos(Math.max(0, r - i * 0.035)); const jx = (hash(i * 3) - 0.5) * 50, jy = (hash(i * 7) - 0.5) * 50; const rr = 15 - i * 1.2; if (r - i * 0.035 < 0) continue; tr.circle(pp.x + jx, pp.y + jy, rr + 4).fill(INK); tr.circle(pp.x + jx, pp.y + jy, rr).fill('#8A5A3C'); }
    ov.addChild(tr);
    const sq = r < 0.1 ? 1 - 0.35 * Math.sin(Math.PI * r / 0.1) * 0 : 1;
    cup.position.set(p.x, p.y); cup.rotation = r * 11; const st = 1 + 0.5 * sp * (r < 0.12 ? 1 : 0.6);
    cup.scale.set(1.1 / st * (r < 0.06 ? 1.35 : 1), 1.1 * st * (r < 0.06 ? 0.7 : 1)); ov.addChild(cup);
  }
  const bw = pop(th, 5.6, 0.22, 3.0);
  bang(ov, 'what', 'WHAT?!', 960, 470, 340, { pop: bw, rot: -0.07 + 0.02 * Math.sin(th * 45), seed: 9, n: 13, size: 190, dot: '#FFB000' });
  caption(ov, 'cap1', 'Wait… that’s ME?!', 960, 1000, { size: 52, bg: '#FFFFFF', pop: pop(th, 4.6, 0.25, 2.2), rot: -0.02 });
}

// =====================================================================================
// POST FX around the hook: freeze / rewind
// =====================================================================================
function freezeRewind(t) {
  const sc = new Container();
  const rew = t >= 6.75;
  const th = rew ? 6.3 - 0.7 * clamp(Math.floor((t - 6.75) * 30), 0, 7) : 6.4;
  const h = hook(th); const inner = h.c; sc.addChild(inner);
  const gk = rew ? 0.75 : sstep(6.4, 6.5, t);
  greyF.matrix = greyM(gk); inner.filters = [greyF];
  const ov = new Container(); sc.addChild(ov);
  ov.addChild(cached('htVig', () => { const g = new Graphics(); dots(g, 0, 0, W, H, 15, (x, y) => { const d = Math.hypot((x - 960) / 960, (y - 540) / 540); return d > 0.62 ? (d - 0.62) * 8.5 : 0; }, '#3A3A52'); g.alpha = 0.5; return g; }));
  if (!rew) {
    const fl = 0.8 * (1 - prog(t, 6.4, 6.52)); if (fl > 0.01) ov.addChild(new Graphics().rect(0, 0, W, H).fill({ color: '#FFFFFF', alpha: fl }));
    // record-scratch lines
    const g = new Graphics(), seed = Math.floor(t * 30);
    for (let i = 0; i < 5; i++) { let x = hash(seed * 5 + i) * W, y = 0; g.moveTo(x, y); while (y < H) { y += 70 + hash(i * 9 + y) * 60; x += (hash(i * 3 + y + seed) - 0.5) * 120; g.lineTo(x, y); } }
    g.stroke({ width: 4, color: '#FFFFFF', alpha: 0.65 * (1 - prog(t, 6.4, 6.75)) });
    ov.addChild(g);
    const sp = pop(t, 6.45, 0.18, 2.5), sk = 1 + 1.6 * (1 - clamp((t - 6.45) / 0.1));
    caption(ov, 'rew', '◀◀ REWIND', 960, 330, { size: 120, bg: CORAL, fill: '#FFFFFF', stroke: INK, sw: 8, rot: -0.1, pop: sp * (t < 6.55 ? sk : 1), italic: true });
  } else {
    const g = new Graphics(); for (let y = 0; y < H; y += 7) g.rect(0, y, W, 2); g.fill({ color: '#10142A', alpha: 0.2 }); ov.addChild(g);
    ov.addChild(new Graphics().rect(0, 0, W, H).fill({ color: '#4A78FF', alpha: 0.14 }));
    const blink = Math.floor((t - 6.75) * 30) % 2 === 0;
    caption(ov, 'rew', '◀◀ REWIND', 220, 90, { size: 54, bg: CORAL, fill: '#FFFFFF', stroke: INK, sw: 6, rot: -0.04, a: blink ? 1 : 0.6, italic: true });
  }
  caption(ov, 'cap2', 'How did I get here? Let’s rewind.', 960, 975, { size: 50, bg: '#FFFFFF', pop: pop(t, 6.5, 0.22, 2.2), rot: 0.01 });
  return { c: sc, sh: rew ? h.sh : { x: 0, y: 0, r: 0 } };
}

// =====================================================================================
// TITLE
// =====================================================================================
function title(t) {
  const sc = new Container();
  sc.addChild(cached('titleBg', () => {
    const c = new Container(), g = new Graphics();
    g.rect(0, 0, W, H).fill('#FFF4DC');
    g.poly([0, 0, 1180, 0, 760, H, 0, H]).fill('#7FDDD2'); g.poly([1180, 0, W, 0, W, H, 760, H]).fill('#FF9C8C');
    const g2 = new Graphics(); rays(g2, 960, 330, 2000, 30, '#FFFFFF', 0.4, 0.1, 31); g2.alpha = 0.5;
    const d = new Graphics(); dots(d, 0, 0, W, 300, 18, (x, y) => Math.max(0, 4.2 - y / 70), '#FFFFFF');
    const d2 = new Graphics(); dots(d2, 0, 0, 960, H, 18, (x, y) => Math.max(0, 4.2 - (H - y) / 90), TEAL); dots(d2, 960, 0, W, H, 18, (x, y) => Math.max(0, 4.2 - (H - y) / 90), CORAL);
    c.addChild(g, g2, d, d2); return c;
  }));
  const k = prog(t, 7.0, 7.17), land = t - 7.17;
  let s = t < 7.0 ? 0 : 1 + 2.6 * Math.pow(1 - k, 2) + (k >= 1 ? 0.09 * Math.exp(-land * 9) * Math.cos(land * 28) : 0);
  const up = inOutCubic(prog(t, 7.85, 8.25));
  const ty = lerp(480, 300, up), ts = s * lerp(1, 0.6, up);
  const ov = new Container(); sc.addChild(ov);
  if (t >= 7.17 && t < 7.7) speedLines(ov, t, 960, ty, { alpha: 0.7 * (1 - prog(t, 7.17, 7.7)), r0: 330, color: '#FFFFFF' });
  const bc = new Container(); bc.position.set(960, ty); bc.scale.set(ts); bc.visible = ts > 0.001; ov.addChild(bc);
  burst(bc, 0, 0, 450, { fill: YEL, n: 13, seed: 12, jit: 0.3, dot: '#F2B33D' });
  bc.addChild(T('title', 'WHAT IF…?', 150, { fill: CORAL, stroke: INK, sw: 14, rot: -0.07, ls: 3 }));
  // option chips
  const chip = (key, s2, y, bg, t0, rot) => caption(ov, key, s2, 960, y, { size: 66, bg, fill: '#FFFFFF', stroke: INK, sw: 9, pop: pop(t, t0, 0.28, 2.4), rot, italic: true });
  chip('chipA', '$1,000,000…', 665, TEAL, 8.0, -0.025);
  const orp = pop(t, 8.28, 0.25, 2.8);
  const oc = new Container(); oc.position.set(960, 775); oc.scale.set(orp); oc.visible = orp > 0.001; ov.addChild(oc);
  oc.addChild(new Graphics().circle(6, 8, 42).fill(INK)); oc.addChild(new Graphics().circle(0, 0, 42).fill('#FFFFFF').stroke({ width: 6, color: INK })); oc.addChild(T('or', 'OR', 38, { }));
  chip('chipB', '24 HOURS IN THE PAST?', 890, CORAL, 8.5, 0.02);
  return { c: sc, sh: { x: 0, y: 0, r: 0 } };
}

// =====================================================================================
// CHOICE + INTO B
// =====================================================================================
const A_POLY = [0, 0, 1018, 0, 898, 1080, 0, 1080];
function choice(t) {
  const ta = hold(t, CSTOPS), tq = q15(ta);
  const sc = new Container();
  const slide = outBack(prog(t, 9.0, 9.4), 1.4);
  const expand = inOutCubic(prog(ta, 14.4, 15.1));
  const greyK = prog(ta, 14.15, 14.7), dis = prog(ta, 14.6, 15.45);
  const lean = sstep(12.0, 12.2, ta) * (1 - sstep(12.7, 12.95, ta));
  const slam = ta >= 18.44, enterT = ta;

  sc.addChild(cached('choiceBgPaper', () => new Graphics().rect(0, 0, W, H).fill('#FFF4DC')));
  // gutter
  const gut = new Graphics();
  const ga = 1 - sstep(14.5, 14.9, ta);
  if (ga > 0.01) {
    const gp = [1018 + (1 - slide) * 0, 0, 1062, 0, 942, 1080, 898, 1080];
    gut.poly(gp).fill(INK); gut.poly([1032, 0, 1048, 0, 928, 1080, 912, 1080]).fill('#FFFFFF'); gut.alpha = ga; sc.addChild(gut);
  }
  // ----- B panel (bottom layer, expands) -----
  const bl = lerp(1062, -60, expand), bl2 = lerp(942, -60, expand);
  const B_POLY = [bl, 0, W + 40, 0, W + 40, H, bl2, H];
  const offB = 1100 * (1 - slide);
  const bx = lerp(1500, 1200, expand), by = lerp(900, 1030, expand), bs = lerp(0.98, 1.3, expand);
  // booth state
  const openT = ta < 16.8 ? outBack(prog(ta, 16.4, 16.95), 2.2) : 1 - inCubic(prog(ta, 18.34, 18.44));
  const closedBlink = ta < 12.8 ? 0 : 0;
  const flashB = Math.max(0, 1 - (ta - 13.5) / 0.28) * (ta >= 13.5 ? 1 : 0);
  let boRef = null, innerB = null;
  const cB = panelCard(sc, B_POLY, offB, '#FFD0BE', (inner) => {
    const bg = cached('bgB', () => { const c = new Container(), g = new Graphics(); g.rect(0, 0, 2520, H).fill('#FFD0BE'); rays(g, 1500, 520, 2400, 28, '#FF8C78', 0.35, 0.1, 41);
      const d = new Graphics(); dots(d, 0, 0, 2520, H, 20, (x, y) => Math.max(0, 4.8 - (H - y) / 60), CORAL); dots(d, 0, 0, 2520, 260, 20, (x, y) => Math.max(0, 4.4 - y / 55), CORAL); c.addChild(g, d); return c; });
    bg.position.x = -300 * expand; inner.addChild(bg);
    // light spill (end scene)
    const lsp = ta >= 16.4 ? sstep(16.4, 16.9, ta) * (1 - (ta >= 18.34 ? 1 : 0)) : 0;
    const bs2 = bs, rat = ta >= 18.44 ? 18 * Math.exp(-(ta - 18.44) * 7) * Math.sin((ta - 18.44) * 85) : 0;
    if (lsp > 0.01) {
      const lc = new Container(); lightBurst(lc, bx, by - 255 * bs2, 1200, lsp * 0.75, ta * 0.3); inner.addChild(lc);
      inner.addChild(new Graphics().poly([bx - 190, by, bx + 190, by, bx + 640, 1100, bx - 640, 1100]).fill({ color: '#FFF4C8', alpha: 0.5 * lsp * Math.min(1, openT + 0.2) }));
    }
    const bo = drawBooth({ open: openT, glow: ta >= 16.4 && ta < 18.4 ? 1 : 0, paneAlpha: ta >= 18.44 ? 0.5 : 0.9, clockPulse: Math.max(0, Math.sin(ta * 7)) * (ta > 18.4 ? 1 : 0.35) + 0.8 * flashB });
    const sw = 1 + 0.05 * flashB;
    for (const p of [bo.back, bo.front]) { p.position.set(bx + rat, by); p.scale.set(bs * sw); }
    inner.addChild(bo.back);
    boRef = bo; innerB = inner;
    // banner + badge
    const bn = pop(t, 10.1, 0.3, 2.2) * (1 - sstep(14.6, 14.9, ta));
    caption(inner, 'labB', '24 HOURS BACK', 1500, 985, { size: 60, bg: CORAL, fill: '#FFFFFF', stroke: INK, sw: 8, pop: bn, rot: 0.02 });
    const bb = pop(t, 9.9, 0.3, 3.0) * (1 + 0.5 * flashB) * (1 - sstep(15.0, 15.3, ta));
    badge(inner, 'B', 1790, 135, CORAL, bb);
    if (flashB > 0) inner.addChild(new Graphics().rect(0, 0, W + 100, H).fill({ color: '#FFFFFF', alpha: 0.55 * flashB }));
  });
  // booth front is added after Oli decision below
  // ----- A panel (dissolves) -----
  const aW = new Container(); sc.addChild(aW);
  if (dis < 1) {
    const cA = panelCard(aW, A_POLY, -1100 * (1 - slide), '#BFF0EA', (inner) => {
      inner.addChild(cached('bgA', () => { const c = new Container(), g = new Graphics(); g.rect(0, 0, W, H).fill('#BFF0EA'); rays(g, 460, 520, 2000, 26, '#5FD8CC', 0.35, 0.3, 51);
        const d = new Graphics(); dots(d, 0, 0, W, H, 20, (x, y) => Math.max(0, 4.8 - (H - y) / 60), TEAL); dots(d, 0, 0, 1100, 260, 20, (x, y) => Math.max(0, 4.4 - y / 55), TEAL); c.addChild(g, d); return c; }));
      const v = drawVault({ t: ta, rot: ta * 0.3 + lean * 4 * Math.sin(ta * 8) });
      v.position.set(470, 505); v.scale.set(0.9 * (1 + 0.05 * lean)); inner.addChild(v);
      const an = pop(t, 9.7, 0.3, 2.2);
      caption(inner, 'labA', '$1,000,000', 470, 985, { size: 66, bg: TEAL, fill: '#FFFFFF', stroke: INK, sw: 8, pop: an, rot: -0.02 });
      badge(inner, 'A', 135, 135, TEAL, pop(t, 9.5, 0.3, 3.0) * (1 + 0.25 * lean));
      if (lean > 0.01) inner.addChild(new Graphics().rect(0, 0, W, H).fill({ color: '#FFFFFF', alpha: 0.3 * lean }));
      if (greyK > 0) {
        greyF.matrix = greyM(greyK); inner.filters = [greyF];
        const ht = new Graphics(); dots(ht, 0, 0, 1020, H, 14, (x, y) => 4.6 * greyK * (0.45 + 0.55 * noise1(x * 0.01 + y * 0.013, 3)), '#444458'); ht.alpha = 0.5; inner.addChild(ht);
      }
    });
    if (dis > 0) {
      const cs = 30, mk = new Graphics(), gl = new Graphics(), gc2 = new Graphics();
      for (let j = 0; j * cs < H; j++) for (let i = 0; i * cs < 1040; i++) {
        const cx = i * cs + cs / 2, cy = j * cs + cs / 2;
        const n = 0.5 * hash2(i, j, 7) + 0.5 * (cx / 1040 * 0.6 + (1 - cy / H) * 0.4);
        const loc = clamp((n - (dis * 1.35 - 0.35)) / 0.35, 0, 1);
        if (loc >= 1) mk.rect(cx - cs / 2 - 0.5, cy - cs / 2 - 0.5, cs + 1, cs + 1);
        else if (loc > 0.01) { mk.circle(cx, cy, cs * 0.78 * loc); if (loc < 0.45) { gl.circle(cx, cy, cs * (0.34 + 0.4 * loc)); gc2.circle(cx, cy, cs * (0.16 + 0.2 * loc)); } }
      }
      mk.fill(0xffffff); gl.fill({ color: '#FF7A1A', alpha: 0.75 }); gc2.fill({ color: '#FFE066', alpha: 0.95 });
      aW.addChild(mk); cA.mask = mk; aW.addChild(gl); aW.addChild(gc2);
    }
  }
  // ----- Oli -----
  const o = choiceOli(ta, tq, expand);
  const showO = ta >= 9.2;
  const frontFlag = o.front;
  if (showO) {
    const ps = outBack(prog(ta, 9.2, 9.55), 2.4);
    o.s *= Math.max(0.001, ps); placeOli(oli1, o);
    if (ta >= 16.8 && !frontFlag) { innerB.addChild(oli1.root); } // behind the booth front frame
    else sc.addChild(oli1.root);
  }
  innerB.addChild(boRef.front); // frame above Oli when he is inside the booth
  // ----- overlays -----
  const ov = new Container(); sc.addChild(ov);
  const bub = pop(t, 13.5, 0.25, 2.8) * (1 - sstep(14.5, 14.75, ta));
  if (t >= 13.5 && t < 13.9) speedLines(ov, t, 1400, 520, { alpha: 0.45 * (1 - prog(t, 13.5, 13.9)), r0: 380, color: '#FFFFFF', n: 30 });
  bubble(ov, 'thisone', 'THIS ONE!', 1085, 245, 460, 160, 1010, 425, { pop: bub, size: 70 });
  // slam + flash
  const fl = t >= 18.44 ? 0.9 * (1 - prog(t, 18.44, 19.1)) : 0; if (fl > 0.01) ov.addChild(new Graphics().rect(-100, -100, W + 200, H + 200).fill({ color: '#FFFFFF', alpha: fl }));
  const sb = pop(t, 18.44, 0.2, 3.0) * (1 - sstep(18.95, 19.2, t));
  if (t >= 18.44 && t < 18.9) speedLines(ov, t, 1200, 520, { alpha: 0.9 * (1 - prog(t, 18.44, 18.9)), r0: 380, color: '#FFD0C0', n: 34 });
  bang(ov, 'slam', 'SLAM!', 1200, 470, 360, { pop: sb, rot: -0.08, seed: 17, n: 12, size: 200, dot: '#FFB000' });
  const cp = pop(ta, 19.45, 0.22, 2.4);
  const lk = new Container(); lk.position.set(560, 985); lk.scale.set(cp); lk.visible = cp > 0.001; ov.addChild(lk);
  const cc = caption(lk, 'locked', 'Choice locked: B', 60, 0, { size: 50, bg: '#FFFFFF', rot: 0 });
  badge(lk, 'B2', -cc._w / 2 - 20, 0, CORAL, 0.55, 'B');
  return { c: sc, sh: { x: 0, y: 0, r: 0 } };
}
function badge(parent, key, x, y, col, sc, ch = key) {
  const c = new Container(); c.position.set(x, y); c.scale.set(sc); c.visible = sc > 0.001; parent.addChild(c);
  c.addChild(new Graphics().circle(7, 9, 88).fill(INK));
  c.addChild(new Graphics().circle(0, 0, 88).fill(col).stroke({ width: 9, color: INK }));
  c.addChild(new Graphics().circle(0, 0, 70).stroke({ width: 4, color: '#FFFFFF', alpha: 0.7 }));
  c.addChild(T('badge' + key, ch, 120, { fill: '#FFFFFF', stroke: INK, sw: 10, y: 4, ls: 0 }));
}

function choiceOli(ta, tq, expand) {
  const o = { x: 975, y: 1045, s: 0.88, expr: 'neutral', blink: blinkAt(tq, 0.3), front: true };
  const bob = Math.sin(tq * 5.2) * 3;
  let p = JSON.parse(JSON.stringify(PO.idle)); p.hips.y += bob;
  const tq2 = tq;
  if (tq2 < 10.0) { /* idle */ }
  else if (tq2 < 10.9) { p.head.r = -0.1; o.glance = -1; p.torso.r = -0.03; }
  else if (tq2 < 11.8) { p.head.r = 0.1; o.glance = 1; p.torso.r = 0.03; }
  else if (tq2 < 12.0) { p.head.r = 0.0; }
  if (tq2 >= 12.0 && tq2 < 12.8) { p = blend(p, PO.leanA, outCubic(prog(tq2, 12.0, 12.3))); o.expr = 'happy'; o.glance = -1; }
  else if (tq2 >= 12.8 && tq2 < 13.5) {
    const tb = JSON.parse(JSON.stringify(PO.turnB)); const w = prog(tq2, 13.15, 13.5); tb.hips.y += 14 * w; tb.torso.r -= 0.2 * w; tb.armL.u -= 0.0;
    p = blend(PO.leanA, tb, outCubic(prog(tq2, 12.8, 13.0))); p = blend(p, tb, 1 * (tq2 > 13.0 ? 1 : 0)); o.glance = 1; o.expr = 'neutral';
  } else if (tq2 >= 13.5) {
    const tb = JSON.parse(JSON.stringify(PO.turnB)); tb.hips.y += 14; tb.torso.r -= 0.2;
    const pt = JSON.parse(JSON.stringify(PO.point)); pt.hips.y += Math.sin(tq2 * 6) * 2;
    p = blend(tb, pt, outCubic(prog(tq2, 13.5, 13.62))); o.expr = 'happy';
    if (tq2 >= 15.0) { p = blend(pt, PO.look, outCubic(prog(tq2, 15.0, 15.4))); o.expr = tq2 >= 15.4 ? 'neutral' : 'happy'; }
    if (tq2 >= 15.4) { p = JSON.parse(JSON.stringify(PO.look)); p.hips.y += bob; p.head.r = 0.05 * Math.sin(tq2 * 2); o.glance = 1; }
    if (tq2 >= 16.0 && tq2 < 16.4) { o.expr = 'surprised'; }
  }
  // walk into the booth
  const wk = prog(tq, 16.9, 18.3);
  const ex = expand;
  o.x = lerp(975, 570, ex); o.y = lerp(1045, 1030, ex); o.s = lerp(0.88, 1.0, ex);
  if (tq >= 16.9) {
    const k = wk, e = k * k * (3 - 2 * k) * 0.35 + k * 0.65;
    o.x = lerp(570, 1195, e); o.s = lerp(1.0, 0.74, k); o.y = lerp(1030, 1010, k);
    if (tq < 18.3) { p = walkPose((tq - 16.9) * 6.8); o.expr = 'happy'; }
    else { p = JSON.parse(JSON.stringify(PO.look)); p.turn = 0.3; o.expr = 'neutral'; o.glance = 0; }
    o.front = e < 0.9 ? true : false;
  }
  o.pose = p;
  return o;
}

// =====================================================================================
export function render(t) {
  clear();
  let r;
  if (t < 6.4) r = hook(t);
  else if (t < 7.0) r = freezeRewind(t);
  else if (t < 9.0) r = title(t);
  else r = choice(t);
  const sh = shakeAt(t, GEV);
  root.pivot.set(960, 540); root.position.set(960 + sh.x + r.sh.x, 540 + sh.y + r.sh.y); root.rotation = sh.r + r.sh.r;
  { const m = Math.abs(sh.x + r.sh.x) + Math.abs(sh.y + r.sh.y) + Math.abs(sh.r + r.sh.r) * 900; root.scale.set(1 + Math.min(0.1, m / 900)); }
  root.addChild(r.c);
  // pad: oversized backdrop so shake never exposes the stage colour
  app.render();
}
