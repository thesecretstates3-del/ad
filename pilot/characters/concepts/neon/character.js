// "Oli" — NEON GLOW rig. Same named-part rig as the flat vector, but every part is a glowing neon
// tube outline (role colour) over a near-black fill. Fills stay opaque so limbs occlude each other.
// Convention: L = character's left = +x on screen. Units: feet at y=0, up is negative.
import { Container, Graphics } from 'pixi.js';

export const PALETTE = {
  ink: '#FFFFFF', // dynamic: returns the current role's neon colour (see below)
  skin: '#F2C9A8', skinShade: '#D9A383', blush: '#F28C7A',
  hair: '#3B2A22', hairShade: '#2A1D17', hood: '#F2B33D', hoodShade: '#C98E25',
  cream: '#FFF4DC', pants: '#26305A', pantsShade: '#1A2142', shoe: '#F7F3EA',
  shoeShade: '#D8D2C4', coral: '#FF5D5D', teal: '#2EC4B6', bg: '#0E1222',
  mouthIn: '#7B2535', sweat: '#8FD3F4',
};
export const NEON = {
  skin: '#FFB38A', face: '#FFD9C2', hair: '#FF3FB4', hairB: '#9A5BFF', hood: '#FFAA22',
  pants: '#3F8BFF', shoe: '#E4F6FF', teal: '#2EE6D0', coral: '#FF5D6E', violet: '#B070FF', cyan: '#4FE8FF',
};
// near-black fills (tinted per bible colour) so the tubes read and limbs still occlude
const DARK = { '#F2C9A8': '#2A1620', '#D9A383': '#2B1620', '#3B2A22': '#1B0C24', '#2A1D17': '#12071B',
  '#F2B33D': '#1F1406', '#C98E25': '#2F1D07', '#26305A': '#0A1432', '#1A2142': '#0F1B44',
  '#F7F3EA': '#0F1F2B', '#D8D2C4': '#173040', '#7B2535': '#3A0B1E' };
let ROLE = 'skin';
const role = (r) => { ROLE = r; };
Object.defineProperty(PALETTE, 'ink', { get: () => NEON[ROLE] });
const P = PALETTE;
const INK_W = 8;

const hx = (c) => parseInt(c.slice(1), 16);
const mix = (c, w = 0.6) => { const n = hx(c); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (v) => Math.round(v + (255 - v) * w); return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1); };

// ---------- drawing helpers ----------
// tube outline: wide role-colour stroke + hot pale core on the outer edge, dark fill inside
const inkOf = (fn) => {
  const col = P.ink;
  const c = new Container();
  const g = new Graphics(); fn(g);
  g.fill(DARK[P.skin] && '#0B0A14'); g.stroke({ width: INK_W * 2, color: col, join: 'round', cap: 'round' });
  const k = new Graphics(); fn(k);
  k.stroke({ width: 6, color: mix(col, 0.7), join: 'round', cap: 'round' });
  c.addChild(g, k);
  return c;
};
const fillOf = (fn, color, alpha = 1) => { const g = new Graphics(); fn(g); g.fill({ color: DARK[color] || color, alpha }); return g; };
const lineG = (g, width, color, d) => {
  d(g); g.stroke({ width: width + 3, color, join: 'round', cap: 'round', alpha: 0.9 });
  g.stroke({ width: Math.max(2, width * 0.45), color: mix(color, 0.7), join: 'round', cap: 'round' }); return g;
};

function blob(g, cx, cy, rx, ry) {
  const k = 0.5523;
  g.moveTo(cx - rx, cy);
  g.bezierCurveTo(cx - rx, cy - ry * k, cx - rx * k, cy - ry, cx, cy - ry);
  g.bezierCurveTo(cx + rx * k, cy - ry, cx + rx, cy - ry * k, cx + rx, cy);
  g.bezierCurveTo(cx + rx, cy + ry * k, cx + rx * k, cy + ry, cx, cy + ry);
  g.bezierCurveTo(cx - rx * k, cy + ry, cx - rx, cy + ry * k, cx - rx, cy);
  g.closePath();
}
// tapered limb capsule, pivot at (0,0), pointing +y
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

// ---------- the curl (question-mark hook), centre line + ribbon ----------
const CURL_CTRL = [[0, 22], [-3, -20], [-12, -62], [-6, -104], [22, -138], [62, -140], [92, -112], [90, -74], [68, -52], [46, -62], [42, -80]]
  .map(([x, y]) => ({ x, y }));
const CURL_PTS = catmull(CURL_CTRL, 10);
function curlRibbon(g, from = 0) {
  const pts = CURL_PTS, N = pts.length;
  const wAt = (i) => 44 - 34 * Math.pow(i / (N - 1), 0.75);
  const L = [], R = [];
  for (let i = from; i < N; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)];
    let tx = b.x - a.x, ty = b.y - a.y; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    const w = wAt(i) / 2;
    L.push({ x: pts[i].x - ty * w, y: pts[i].y + tx * w });
    R.push({ x: pts[i].x + ty * w, y: pts[i].y - tx * w });
  }
  g.moveTo(L[0].x, L[0].y);
  for (let i = 1; i < L.length; i++) g.lineTo(L[i].x, L[i].y);
  const tip = pts[N - 1], w = wAt(N - 1) / 2;
  const a = pts[N - 2]; let tx = tip.x - a.x, ty = tip.y - a.y; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
  g.bezierCurveTo(L[L.length - 1].x + tx * w * 1.3, L[L.length - 1].y + ty * w * 1.3,
    R[R.length - 1].x + tx * w * 1.3, R[R.length - 1].y + ty * w * 1.3, R[R.length - 1].x, R[R.length - 1].y);
  for (let i = R.length - 2; i >= 0; i--) g.lineTo(R[i].x, R[i].y);
  g.closePath();
}

// ---------- expressions (data) ----------
export const EXPRESSIONS = {
  neutral:   { eyes: 'oval', eyeScale: [1, 1], hl: 1, browY: -27, browRot: 0.0, browX: 52, mouth: 'neutral', sweat: false },
  happy:     { eyes: 'arc', eyeScale: [1, 1], hl: 1, browY: -40, browRot: 0.16, browX: 52, mouth: 'happy', sweat: false },
  surprised: { eyes: 'oval', eyeScale: [1.18, 1.15], hl: 1.4, browY: -48, browRot: 0.06, browX: 52, mouth: 'surprised', sweat: false },
  scared:    { eyes: 'oval', eyeScale: [0.95, 1.12], hl: 1.5, browY: -38, browRot: 0.42, browX: 46, mouth: 'scared', sweat: true },
};

// ---------- poses (data): joint angles in radians, driven onto the same rig ----------
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
  const t = side === 'L' ? -1 : 1; // thumb side for the open mitten
  role('skin');
  const hand = new Container();
  named(hand, 'hand' + side, ch);
  const mit = (g) => {
    g.moveTo(-17, -4); g.bezierCurveTo(-21, 20, -19, 44, 0, 46); g.bezierCurveTo(19, 44, 21, 20, 17, -4); g.closePath();
    g.moveTo(t * 12, 8); g.bezierCurveTo(t * 30, 4, t * 40, 22, t * 28, 34); g.bezierCurveTo(t * 22, 40, t * 14, 32, t * 12, 26); g.closePath();
  };
  const open = new Container(); open.label = 'hand_open';
  open.addChild(inkOf(mit), fillOf(mit, P.skin));
  open.addChild(lineG(new Graphics(), 4, P.ink, (g) => { g.moveTo(t * 14, 12); g.quadraticCurveTo(t * 20, 24, t * 15, 32); }));
  // pointing hand: fist + extended index finger (finger on -t side, thumb on top)
  const f = -t; // finger side sign
  const fist = (g) => {
    g.moveTo(-18, -4); g.bezierCurveTo(-22, 16, -20, 36, 0, 38); g.bezierCurveTo(20, 36, 22, 16, 18, -4); g.closePath();
    // finger
    g.moveTo(f * 12 - 8, 14); g.lineTo(f * 12 - 8, 74); g.bezierCurveTo(f * 12 - 8, 88, f * 12 + 8, 88, f * 12 + 8, 74); g.lineTo(f * 12 + 8, 14); g.closePath();
    // thumb
    g.moveTo(-f * 14, 6); g.bezierCurveTo(-f * 36, 0, -f * 40, 20, -f * 26, 28); g.bezierCurveTo(-f * 18, 30, -f * 14, 24, -f * 14, 20); g.closePath();
  };
  const pt = new Container(); pt.label = 'hand_point'; pt.visible = false;
  pt.addChild(inkOf(fist), fillOf(fist, P.skin));
  pt.addChild(lineG(new Graphics(), 4, P.ink, (g) => {
    g.moveTo(f * 4 - 2, 30); g.quadraticCurveTo(f * 12 - 2, 26, f * 20 - 4, 30);
    g.moveTo(-f * 14, 16); g.quadraticCurveTo(-f * 8, 22, -f * 14, 28);
  }));
  hand.addChild(open, pt);
  hand.setKind = (k) => { open.visible = k !== 'point'; pt.visible = k === 'point'; };
  return hand;
}

function buildArm(side, ch) {
  const U = 88, Lw = 70, S = side;
  const up = named(new Container(), `arm${S}_upper`, ch);
  const lo = named(new Container(), `arm${S}_lower`, ch); lo.position.set(0, U);
  const hand = buildHand(S, ch); hand.position.set(0, Lw); role('hood');
  const w0 = 50, w1 = 44, v0 = 44, v1 = 38;
  const lowerShape = (g) => limb(g, Lw, v0, v1, true, false, 4);
  lo.addChild(inkOf(lowerShape), hand, fillOf(lowerShape, P.hood), fillOf((g) => limbShade(g, Lw, v0, v1, 11), P.hoodShade));
  // cuff band (cream-free rib in shade) + outline at the cuff edge
  const b = v1 / 2;
  lo.addChild(fillOf((g) => { g.moveTo(-b, Lw - 16); g.quadraticCurveTo(0, Lw - 12, b, Lw - 16); g.lineTo(b, Lw); g.quadraticCurveTo(0, Lw + 4, -b, Lw); g.closePath(); }, P.hoodShade));
  lo.addChild(lineG(new Graphics(), 5, P.ink, (g) => { g.moveTo(-b, Lw - 16); g.quadraticCurveTo(0, Lw - 12, b, Lw - 16); }));
  lo.addChild(lineG(new Graphics(), 5, P.ink, (g) => { g.moveTo(-b, Lw); g.quadraticCurveTo(0, Lw + 4, b, Lw); }));
  const upperShape = (g) => limb(g, U, w0, w1, true, true);
  up.addChild(inkOf(upperShape), lo, fillOf(upperShape, P.hood), fillOf((g) => limbShade(g, U, w0, w1, 12), P.hoodShade));
  return up;
}

function buildFoot(side, ch) {
  role('shoe');
  const foot = named(new Container(), `foot${side}`, ch);
  const skinAnkle = (g) => { g.moveTo(-13, -26); g.lineTo(13, -26); g.lineTo(13, -2); g.lineTo(-13, -2); g.closePath(); };
  const upper = (g) => {
    g.moveTo(-22, -12); g.bezierCurveTo(-29, -4, -31, 6, -27, 12); g.lineTo(40, 12);
    g.bezierCurveTo(57, 12, 62, 2, 53, -5); g.bezierCurveTo(44, -11, 30, -6, 18, -12);
    g.bezierCurveTo(10, -17, -10, -19, -22, -12); g.closePath();
  };
  const sole = (g) => {
    g.moveTo(-28, 8); g.lineTo(56, 8); g.bezierCurveTo(66, 8, 66, 21, 52, 21); g.lineTo(-20, 21); g.bezierCurveTo(-32, 21, -33, 11, -28, 8); g.closePath();
  };
  foot.addChild(inkOf((g) => { skinAnkle(g); upper(g); sole(g); }));
  foot.addChild(fillOf(skinAnkle, P.skin), fillOf(skinAnkle, P.skin));
  foot.addChild(fillOf(upper, P.shoe), fillOf(sole, P.shoeShade));
  const d = new Graphics();
  d.moveTo(-26, 10); d.lineTo(56, 10); d.stroke({ width: 4, color: P.ink, cap: 'round' });
  d.moveTo(-23, 15); d.lineTo(55, 15); d.stroke({ width: 8, color: NEON.coral, cap: 'round', alpha: 0.9 }); d.stroke({ width: 3, color: '#FFC9CF', cap: 'round' });
  d.moveTo(34, -4); d.bezierCurveTo(40, 0, 40, 6, 37, 9); d.stroke({ width: 4, color: P.ink, cap: 'round' });
  d.moveTo(2, -13); d.lineTo(8, -4); d.moveTo(12, -12); d.lineTo(18, -3); d.moveTo(-8, -14); d.lineTo(-3, -5);
  d.stroke({ width: 3.5, color: P.ink, cap: 'round' });
  foot.addChild(d);
  return foot;
}

function buildLeg(side, ch) {
  const S = side, U = 86, Lw = 60;
  const up = named(new Container(), `leg${S}_upper`, ch);
  const lo = named(new Container(), `leg${S}_lower`, ch); lo.position.set(0, U);
  const foot = buildFoot(S, ch); foot.position.set(0, 82); role('pants');
  const w0 = 58, w1 = 52, v0 = 52, v1 = 46;
  const lowerShape = (g) => limb(g, Lw, v0, v1, true, false, 4);
  lo.addChild(inkOf(lowerShape), foot, fillOf(lowerShape, P.pants), fillOf((g) => limbShade(g, Lw, v0, v1, 11), P.pantsShade));
  const b = v1 / 2;
  lo.addChild(fillOf((g) => { g.moveTo(-b, Lw - 12); g.quadraticCurveTo(0, Lw - 8, b, Lw - 12); g.lineTo(b, Lw); g.quadraticCurveTo(0, Lw + 4, -b, Lw); g.closePath(); }, P.pantsShade));
  lo.addChild(lineG(new Graphics(), 5, P.ink, (g) => { g.moveTo(-b, Lw); g.quadraticCurveTo(0, Lw + 4, b, Lw); }));
  const upperShape = (g) => limb(g, U, w0, w1, true, true);
  up.addChild(inkOf(upperShape), lo, fillOf(upperShape, P.pants), fillOf((g) => limbShade(g, U, w0, w1, 12), P.pantsShade));
  return up;
}

function buildHead(ch) {
  const head = named(new Container(), 'head', ch);
  // hair_back
  role('hairB');
  const hb = named(new Container(), 'hair_back', ch);
  const hbShape = (g) => {
    g.moveTo(-152, -58); g.bezierCurveTo(-174, -160, -104, -234, 0, -234);
    g.bezierCurveTo(104, -234, 174, -160, 152, -58);
    g.bezierCurveTo(146, -26, 108, -22, 84, -40); g.lineTo(-84, -40);
    g.bezierCurveTo(-108, -22, -146, -26, -152, -58); g.closePath();
  };
  hb.addChild(inkOf(hbShape), fillOf(hbShape, P.hairShade));
  // skull (+ ears)
  role('skin');
  const sk = named(new Container(), 'skull', ch);
  const skShape = (g) => {
    blob(g, 0, -100, 135, 112);
    blob(g, -136, -92, 17, 25); blob(g, 136, -92, 17, 25);
  };
  sk.addChild(inkOf(skShape), fillOf(skShape, P.skin));
  sk.addChild(fillOf((g) => { // right-side cel shade
    g.moveTo(112, -40); g.bezierCurveTo(130, -66, 136, -110, 124, -150);
    g.bezierCurveTo(140, -120, 144, -80, 128, -42); g.bezierCurveTo(122, -24, 100, -4, 70, 6);
    g.bezierCurveTo(92, -4, 106, -22, 112, -40); g.closePath();
  }, P.skinShade));
  sk.addChild(lineG(new Graphics(), 3, P.ink, (g) => { g.moveTo(-138, -100); g.quadraticCurveTo(-130, -92, -138, -82); g.moveTo(138, -100); g.quadraticCurveTo(130, -92, 138, -82); }));
  // face
  const face = buildFace(ch);
  // hair_front (fringe + sideburns)
  role('hair');
  const hf = named(new Container(), 'hair_front', ch);
  const hfShape = (g) => {
    g.moveTo(-142, -84);
    g.bezierCurveTo(-160, -150, -112, -226, 0, -226);
    g.bezierCurveTo(112, -226, 160, -150, 142, -84);
    g.bezierCurveTo(141, -72, 128, -70, 124, -84);          // right sideburn tip
    g.bezierCurveTo(126, -128, 118, -160, 98, -176);        // up to first valley
    g.bezierCurveTo(92, -160, 80, -148, 62, -146);          // lock 1 tip
    g.bezierCurveTo(48, -152, 36, -166, 30, -186);          // valley 2
    g.bezierCurveTo(24, -168, 12, -156, -6, -154);          // lock 2 tip
    g.bezierCurveTo(-26, -158, -40, -170, -48, -184);       // valley 3
    g.bezierCurveTo(-56, -164, -78, -152, -100, -152);      // lock 3 tip
    g.bezierCurveTo(-116, -150, -124, -118, -124, -84);     // left sideburn
    g.bezierCurveTo(-128, -70, -141, -72, -142, -84);
    g.closePath();
  };
  hf.addChild(inkOf(hfShape), fillOf(hfShape, P.hair));
  hf.addChild(lineG(new Graphics(), 4, P.ink, (g) => { g.moveTo(-70, -200); g.quadraticCurveTo(-98, -180, -112, -150); g.moveTo(66, -204); g.quadraticCurveTo(100, -184, 116, -150); }));
  // hair_curl
  role('hair');
  const curl = named(new Container(), 'hair_curl', ch);
  curl.position.set(0, -218);
  curl.addChild(inkOf((g) => curlRibbon(g, 7)), fillOf((g) => curlRibbon(g, 0), P.hair));
  curl.addChild(fillOf((g) => { // soft highlight-shade stripe along the hook
    g.moveTo(-2, -26); g.bezierCurveTo(-14, -64, -8, -98, 14, -118); g.bezierCurveTo(-2, -96, -4, -62, 6, -28); g.closePath();
  }, P.hairShade));
  head.addChild(hb, sk, face, hf, curl);
  return head;
}

function buildFace(ch) {
  role('face');
  const face = named(new Container(), 'face', ch);
  face.position.set(0, -100);
  const blushes = new Container(); blushes.label = 'blush';
  blushes.addChild(fillOf((g) => blob(g, -84, 48, 22, 13), NEON.coral, 0.45), fillOf((g) => blob(g, 84, 48, 22, 13), NEON.coral, 0.45));
  face.addChild(blushes);
  face.addChild(fillOf((g) => g.circle(0, 36, 3.5), NEON.skin, 0.9));
  const mkEye = (name, x) => {
    const e = named(new Container(), name, ch); e.position.set(x, 18);
    const open = new Container();
    open.addChild(fillOf((g) => blob(g, 0, 0, 15, 24), '#0B0A14'));
    open.addChild(lineG(new Graphics(), 7, NEON.cyan, (g) => blob(g, 0, 0, 15, 24)));
    open.addChild(fillOf((g) => blob(g, 0, 7, 8, 12), NEON.cyan, 0.55));
    const hl = fillOf((g) => g.circle(5.5, -9, 5.2), '#FFFFFF'); open.addChild(hl);
    const arc = lineG(new Graphics(), 9, NEON.cyan, (g) => { g.moveTo(-16, 5); g.quadraticCurveTo(0, -24, 16, 5); });
    arc.visible = false;
    e.addChild(open, arc); e._open = open; e._arc = arc; e._hl = hl;
    return e;
  };
  const eyeL = mkEye('eyeL', 52), eyeR = mkEye('eyeR', -52);
  const mkBrow = (name, x) => {
    const b = named(new Container(), name, ch); b.position.set(x, -25);
    const g = new Graphics();
    g.moveTo(-23, 4); g.quadraticCurveTo(0, -6, 23, 4); g.stroke({ width: 17, color: NEON.hair, cap: 'round', alpha: 0.9 });
    g.stroke({ width: 7, color: '#FFD1EE', cap: 'round' });
    b.addChild(g); return b;
  };
  const browL = mkBrow('browL', 52), browR = mkBrow('browR', -52);
  // mouth: swappable shapes
  const mouth = named(new Container(), 'mouth', ch); mouth.position.set(0, 62);
  const m = {};
  m.neutral = lineG(new Graphics(), 7, NEON.coral, (g) => { g.moveTo(-15, 0); g.quadraticCurveTo(0, 6, 15, 0); });
  const happyShape = (g) => { g.moveTo(-31, -6); g.quadraticCurveTo(0, 6, 31, -6); g.bezierCurveTo(30, 20, 12, 30, 0, 30); g.bezierCurveTo(-12, 30, -30, 20, -31, -6); g.closePath(); };
  m.happy = new Container();
  { const hg = fillOf(happyShape, P.mouthIn); m.happy.addChild(hg, fillOf((g) => blob(g, 0, 23, 13, 7), NEON.coral, 0.7));
    m.happy.addChild(lineG(new Graphics(), 7, NEON.coral, happyShape)); }
  m.surprised = new Container();
  { const sh = (g) => blob(g, 0, 6, 11, 15); m.surprised.addChild(fillOf(sh, P.mouthIn), lineG(new Graphics(), 7, NEON.coral, sh)); }
  const scaredShape = (g) => {
    g.moveTo(-34, 0); g.bezierCurveTo(-24, -10, -14, 8, -2, -2); g.bezierCurveTo(10, -12, 22, 8, 34, -2);
    g.bezierCurveTo(32, 18, 14, 26, 0, 26); g.bezierCurveTo(-14, 26, -32, 18, -34, 0); g.closePath();
  };
  m.scared = new Container();
  m.scared.addChild(fillOf(scaredShape, P.mouthIn), lineG(new Graphics(), 7, NEON.coral, scaredShape));
  for (const k in m) { m[k].label = 'mouth_' + k; mouth.addChild(m[k]); }
  mouth._shapes = m;
  // sweat drop (scared only)
  const sweat = new Container(); sweat.label = 'sweat'; sweat.position.set(108, -36);
  const dropShape = (g) => { g.moveTo(0, -26); g.bezierCurveTo(8, -10, 15, -2, 15, 8); g.bezierCurveTo(15, 20, -15, 20, -15, 8); g.bezierCurveTo(-15, -2, -8, -10, 0, -26); g.closePath(); };
  sweat.addChild(fillOf(dropShape, '#0B2A3A'), lineG(new Graphics(), 6, NEON.cyan, dropShape), fillOf((g) => g.circle(-5, 8, 3.2), '#FFFFFF'));
  sweat.visible = false;
  face.addChild(eyeL, eyeR, browL, browR, mouth, sweat);
  face._sweat = sweat;
  return face;
}

function buildTorso(ch) {
  role('hood');
  const torso = named(new Container(), 'torso', ch);
  const bodyShape = (g) => {
    g.moveTo(-62, -150); g.bezierCurveTo(-88, -122, -94, -52, -86, 8);
    g.bezierCurveTo(-40, 24, 40, 24, 86, 8);
    g.bezierCurveTo(94, -52, 88, -122, 62, -150);
    g.bezierCurveTo(30, -162, -30, -162, -62, -150); g.closePath();
  };
  const body = named(new Container(), 'torso_body', ch);
  body.addChild(inkOf(bodyShape), fillOf(bodyShape, P.hood));
  body.addChild(fillOf((g) => {
    g.moveTo(62, -150); g.bezierCurveTo(88, -122, 94, -52, 86, 8); g.bezierCurveTo(70, 14, 52, 18, 40, 20);
    g.bezierCurveTo(66, -30, 70, -100, 40, -150); g.closePath();
  }, P.hoodShade));
  const hem = named(new Container(), 'hem', ch);
  const hemShape = (g) => { g.moveTo(-86, -6); g.quadraticCurveTo(0, 14, 86, -6); g.lineTo(87, 12); g.bezierCurveTo(40, 28, -40, 28, -87, 12); g.closePath(); };
  hem.addChild(inkOf(hemShape), fillOf(hemShape, P.hoodShade));
  hem.addChild(lineG(new Graphics(), 3.5, P.ink, (g) => { for (let x = -66; x <= 66; x += 22) { g.moveTo(x, 4 + (x * x) / 2000); g.lineTo(x * 1.01, 20 - (x * x) / 2400); } }));
  const collar = named(new Container(), 'hood_collar', ch);
  const colShape = (g) => {
    g.moveTo(-82, -144); g.bezierCurveTo(-96, -178, -56, -196, 0, -192);
    g.bezierCurveTo(56, -196, 96, -178, 82, -144);
    g.bezierCurveTo(70, -122, 34, -118, 0, -126); g.bezierCurveTo(-34, -118, -70, -122, -82, -144); g.closePath();
  };
  collar.addChild(inkOf(colShape), fillOf(colShape, P.hood));
  collar.addChild(fillOf((g) => { g.moveTo(-60, -140); g.bezierCurveTo(-30, -122, 30, -122, 60, -140); g.bezierCurveTo(30, -132, -30, -132, -60, -140); g.closePath(); }, P.hoodShade));
  collar.addChild(fillOf((g) => { g.moveTo(40, -178); g.bezierCurveTo(76, -176, 92, -160, 80, -142); g.bezierCurveTo(78, -158, 64, -170, 40, -178); g.closePath(); }, P.hoodShade));
  const pocket = named(new Container(), 'pocket', ch);
  const pkShape = (g) => { g.moveTo(-52, -58); g.bezierCurveTo(-26, -66, 26, -66, 52, -58); g.lineTo(68, -10); g.bezierCurveTo(30, 0, -30, 0, -68, -10); g.closePath(); };
  pocket.addChild(inkOf(pkShape), fillOf(pkShape, P.hoodShade));
  pocket.addChild(fillOf((g) => { g.moveTo(-50, -56); g.bezierCurveTo(-26, -63, 26, -63, 50, -56); g.lineTo(53, -46); g.bezierCurveTo(26, -53, -26, -53, -53, -46); g.closePath(); }, P.hood));
  const strings = named(new Container(), 'strings', ch);
  const sPath = (sx) => (g) => { g.moveTo(sx * 20, -134); g.bezierCurveTo(sx * 22, -118, sx * 28, -104, sx * 26, -86); };
  for (const sx of [-1, 1]) {
    const g = new Graphics();
    sPath(sx)(g); g.stroke({ width: 11, color: NEON.hood, cap: 'round', alpha: 0.85 });
    sPath(sx)(g); g.stroke({ width: 5, color: P.cream, cap: 'round' });
    g.moveTo(sx * 26, -92); g.lineTo(sx * 26, -78); g.stroke({ width: 13, color: NEON.hood, cap: 'round', alpha: 0.85 });
    g.moveTo(sx * 26, -92); g.lineTo(sx * 26, -78); g.stroke({ width: 6, color: P.cream, cap: 'round' });
    strings.addChild(g);
  }
  const pin = named(new Container(), 'pin', ch); pin.position.set(0, 0);
  // forked branch: curved stem splitting into two unequal branches, node dots at the ends (not a letter)
  const fork = (g) => {
    g.moveTo(44, -70); g.quadraticCurveTo(44, -88, 44, -92);
    g.moveTo(44, -92); g.bezierCurveTo(42, -108, 28, -106, 24, -124);
    g.moveTo(44, -86); g.bezierCurveTo(52, -90, 62, -96, 70, -102);
  };
  { const g = new Graphics(); fork(g);
    g.stroke({ width: 13, color: NEON.teal, cap: 'round', join: 'round', alpha: 0.9 });
    g.stroke({ width: 5, color: '#D4FFF8', cap: 'round', join: 'round' });
    for (const [x, y, r] of [[44, -70, 7.5], [24, -124, 7.5], [70, -102, 7.5]]) {
      g.circle(x, y, r).fill('#0A1A1E'); g.circle(x, y, r).stroke({ width: 5, color: NEON.teal });
      g.circle(x, y, r).stroke({ width: 2, color: '#D4FFF8' });
    }
    g.scale.set(1.3); g.position.set(-30, 50);
    pin.addChild(g); }
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
  role('pants');
  const pelvis = named(new Container(), 'pelvis', ch);
  const pv = (g) => { g.moveTo(-68, -4); g.bezierCurveTo(-72, 24, -62, 42, -44, 48); g.bezierCurveTo(-20, 52, 20, 52, 44, 48); g.bezierCurveTo(62, 42, 72, 24, 68, -4); g.closePath(); };
  pelvis.addChild(inkOf(pv), fillOf(pv, P.pants));
  hips.addChild(legR, legL, pelvis, buildTorso(ch));
  return hips;
}

// ---------- public API ----------
export function createCharacter(app, opts = {}) {
  const ch = { parts: {}, state: { pose: 'idle', expr: 'neutral', blink: 1 }, app };
  const root = named(new Container(), 'root', ch);
  const shadow = new Graphics();
  for (let i = 0; i < 7; i++) shadow.ellipse(0, 4, 160 - i * 14, 22 - i * 2.8).fill({ color: '#FF2FB3', alpha: 0.05 });
  shadow.label = 'shadow';
  ch.shadow = shadow;
  if (opts.shadow !== false) root.addChild(shadow);
  root.addChild(buildHips(ch));
  ch.root = root;
  // feet: ankle skin sits behind ankle; initial pose + expression
  setPose(ch, opts.pose || 'idle');
  setExpression(ch, opts.expression || 'neutral');
  return ch;
}

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
    q['foot' + s].rotation = l.foot - 0 * (l.u + l.l);
    q['foot' + s].scale.x = p.footDir[s];
  }
  // three-quarter face: features slide toward +x and the far eye narrows
  q.face.x = 26 * t;
  applyFace(ch);
}

export function setExpression(ch, name) {
  if (!EXPRESSIONS[name]) throw new Error('unknown expression ' + name);
  ch.state.expr = name; applyFace(ch);
}
export function setBlink(ch, v) { ch.state.blink = v; applyFace(ch); } // v: 1 open .. 0.1 closed

function applyFace(ch) {
  const q = ch.parts, e = EXPRESSIONS[ch.state.expr], turn = POSES[ch.state.pose].turn;
  const [sx, sy] = e.eyeScale;
  const arcs = e.eyes === 'arc';
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

// Pull every named part out of the hierarchy (idle pose) and scatter it for the "rig" view.
// Returns the detached parts with their pivot positions (in `view` coordinates).
const EXPLODE = {
  hair_back: [-345, -30], skull: [0, -40], face: [345, -60], hair_front: [-345, -150], hair_curl: [0, -40],
  head: [0, -40], hood_collar: [-95, 294], torso_body: [0, 0], hem: [-5, -2], pocket: [75, 171], strings: [190, 250], pin: [-281, 238],
  armR_upper: [-125, -6], armR_lower: [-215, -16], handR: [-295, -24],
  armL_upper: [125, -6], armL_lower: [215, -16], handL: [295, -24],
  hips: [0, 0], pelvis: [0, 48],
  legR_upper: [-178, 4], legR_lower: [-268, 16], footR: [-353, 28],
  legL_upper: [178, 4], legL_lower: [268, 16], footL: [353, 28],
};
export function explodeRig(ch, view, scale = 0.5) {
  setPose(ch, 'idle'); setExpression(ch, 'neutral');
  const q = ch.parts;
  const mul = (m, n) => ({ a: m.a * n.a + m.c * n.b, b: m.b * n.a + m.d * n.b, c: m.a * n.c + m.c * n.d, d: m.b * n.c + m.d * n.d,
    tx: m.a * n.tx + m.c * n.ty + m.tx, ty: m.b * n.tx + m.d * n.ty + m.ty });
  const local = (n) => { const c = Math.cos(n.rotation), s = Math.sin(n.rotation);
    return { a: c * n.scale.x, b: s * n.scale.x, c: -s * n.scale.y, d: c * n.scale.y, tx: n.x, ty: n.y }; };
  const worldOf = (n) => { const chain = []; for (let x = n; x; x = x.parent) chain.unshift(x);
    return chain.reduce((m, x) => mul(m, local(x)), { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 }); };
  const order = ['hair_back', 'skull', 'face', 'hair_front', 'hair_curl', 'hood_collar', 'torso_body', 'hem', 'pocket', 'strings', 'pin',
    'armR_upper', 'armR_lower', 'handR', 'armL_upper', 'armL_lower', 'handL', 'pelvis',
    'legR_upper', 'legR_lower', 'footR', 'legL_upper', 'legL_lower', 'footL'];
  const info = order.map((n) => ({ n, w: worldOf(q[n]) }));
  const parentOf = { hair_back: 'head', skull: 'head', face: 'head', hair_front: 'head', hair_curl: 'head', head: 'torso',
    hood_collar: 'torso', torso_body: 'torso', hem: 'torso', pocket: 'torso', strings: 'torso', pin: 'torso',
    armR_upper: 'torso', armR_lower: 'armR_upper', handR: 'armR_lower', armL_upper: 'torso', armL_lower: 'armL_upper', handL: 'armL_lower',
    legR_upper: 'hips', legR_lower: 'legR_upper', footR: 'legR_lower', legL_upper: 'hips', legL_lower: 'legL_upper', footL: 'legL_lower',
    pelvis: 'hips', torso: 'hips' };
  // pivot positions for parts that stay structural (head, torso, hips)
  const extra = ['head', 'torso', 'hips'].map((n) => ({ n, w: worldOf(q[n]) }));
  const out = {};
  const parts = [];
  for (const { n, w } of info) {
    const node = q[n];
    node.parent && node.parent.removeChild(node);
    const [dx, dy] = EXPLODE[n] || [0, 0];
    const rot = Math.atan2(w.b, w.a), sxx = Math.hypot(w.a, w.b), det = w.a * w.d - w.b * w.c;
    node.position.set((w.tx + dx) * scale, (w.ty + dy) * scale);
    node.rotation = rot; node.scale.set(sxx * scale, (det / sxx) * scale);
    parts.push(node);
    out[n] = { x: node.x, y: node.y };
  }
  for (const { n, w } of extra) { const [dx, dy] = EXPLODE[n] || [0, 0]; out[n] = { x: (w.tx + dx) * scale, y: (w.ty + dy) * scale }; }
  return { parts, pivots: out, parentOf };
}
