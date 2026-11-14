// Pose library + helpers on top of the approved comic Oli rig (character.js is imported untouched).
import { createCharacter, setPose, setExpression, setBlink, POSES } from '../../characters/concepts/comic/character.js';
import { hash, clamp } from './lib.js';

const I = POSES.idle;
const clone = (o) => JSON.parse(JSON.stringify(o));
const mk = (o) => { const b = clone(I); for (const k in o) b[k] = (typeof o[k] === 'object' && !Array.isArray(o[k]) && b[k]) ? { ...b[k], ...o[k] } : o[k]; return b; };

export const PO = {
  idle: I,
  point: POSES.point,
  holdCup: mk({ turn: 0.35, hips: { x: -6, y: -192, r: 0 }, torso: { r: -0.03 }, head: { r: 0.05 }, armL: { u: -0.55, l: -1.75, hand: 'open' }, armR: { u: 0.12, l: -0.1, hand: 'open' } }),
  sip: mk({ turn: 0.7, hips: { x: -10, y: -190, r: 0 }, torso: { r: -0.05 }, head: { r: -0.1 }, armL: { u: -0.75, l: -2.15, hand: 'open' }, armR: { u: 0.12, l: -0.1, hand: 'open' }, footDir: { L: 1, R: 1 } }),
  stumble: mk({ turn: 0.6, hips: { x: -14, y: -184, r: 0.2 }, torso: { r: 0.24 }, head: { r: -0.28 }, armL: { u: -2.2, l: -0.3, hand: 'open' }, armR: { u: 1.7, l: 0.5, hand: 'open' }, legL: { u: -0.5, l: 0.6, foot: 0 }, legR: { u: 0.32, l: 0.1, foot: 0 }, footDir: { L: 1, R: 1 } }),
  stumble2: mk({ turn: 0.6, hips: { x: 12, y: -188, r: -0.16 }, torso: { r: -0.2 }, head: { r: 0.3 }, armL: { u: -1.4, l: -0.5, hand: 'open' }, armR: { u: 2.3, l: 0.2, hand: 'open' }, legL: { u: 0.25, l: 0.2, foot: 0 }, legR: { u: -0.45, l: 0.55, foot: 0 }, footDir: { L: 1, R: 1 } }),
  look: mk({ turn: 0.5, hips: { x: -4, y: -192, r: 0 }, head: { r: 0.05 }, armL: { u: -0.18, l: 0.1, hand: 'open' }, armR: { u: 0.2, l: -0.1, hand: 'open' } }),
  cower: mk({ hips: { x: 0, y: -184, r: 0.02 }, torso: { r: -0.05 }, head: { r: 0.08 }, armL: { u: -0.75, l: -2.4, hand: 'open' }, armR: { u: 0.75, l: 2.4, hand: 'open' }, legL: { u: -0.12, l: 0.2, foot: 0 }, legR: { u: 0.12, l: -0.2, foot: 0 } }),
  scream: mk({ hips: { x: 0, y: -196, r: 0 }, torso: { r: 0 }, head: { r: -0.12 }, armL: { u: -2.7, l: -0.25, hand: 'open' }, armR: { u: 2.7, l: 0.25, hand: 'open' }, legL: { u: -0.2, l: 0.1, foot: 0 }, legR: { u: 0.2, l: -0.1, foot: 0 } }),
  leanA: mk({ hips: { x: -34, y: -190, r: -0.05 }, torso: { r: -0.16 }, head: { r: -0.2 }, armL: { u: -0.25, l: 0.2, hand: 'open' }, armR: { u: 0.5, l: -0.9, hand: 'open' }, legL: { u: -0.12, l: 0.12, foot: 0 }, legR: { u: 0.2, l: -0.1, foot: 0 } }),
  think: mk({ hips: { x: 0, y: -192, r: 0 }, head: { r: 0.06 }, armL: { u: -0.15, l: 0.1, hand: 'open' }, armR: { u: 0.7, l: -2.2, hand: 'open' } }),
  turnB: mk({ turn: 0.7, hips: { x: 14, y: -190, r: 0.04 }, torso: { r: 0.12 }, head: { r: 0.2 }, armL: { u: -0.5, l: 0.1, hand: 'open' }, armR: { u: 0.3, l: -0.1, hand: 'open' }, legL: { u: -0.2, l: 0.2, foot: 0 }, footDir: { L: 1, R: 1 } }),
};
export function walkPose(ph, bob = 1) {
  const sL = Math.sin(ph), sR = Math.sin(ph + Math.PI);
  const p = clone(PO.point);
  p.turn = 1; p.hips = { x: -4, y: -192 + Math.abs(Math.cos(ph)) * -9 * bob + 4, r: 0.02 }; p.torso = { r: -0.05 }; p.head = { r: 0.06 };
  p.armL = { u: -0.1 - 0.5 * -sL, l: -0.3, hand: 'open' }; p.armR = { u: 0.1 - 0.5 * sL, l: -0.3, hand: 'open' };
  p.legL = { u: -0.5 * sL, l: 0.1 + 0.8 * Math.max(0, Math.cos(ph)), foot: 0.15 * Math.max(0, Math.cos(ph)) };
  p.legR = { u: -0.5 * sR, l: 0.1 + 0.8 * Math.max(0, Math.cos(ph + Math.PI)), foot: 0.15 * Math.max(0, Math.cos(ph + Math.PI)) };
  p.footDir = { L: 1, R: 1 };
  return p;
}
export function blend(a, b, k) {
  if (k <= 0) return JSON.parse(JSON.stringify(a)); if (k >= 1) return JSON.parse(JSON.stringify(b));
  const out = {};
  for (const key in a) {
    const va = a[key], vb = b[key];
    if (key === 'footDir') out[key] = k < 0.5 ? va : vb;
    else if (typeof va === 'number') out[key] = va + (vb - va) * k;
    else if (typeof va === 'string') out[key] = k < 0.5 ? va : vb;
    else if (va && typeof va === 'object') out[key] = blend(va, vb, k);
    else out[key] = va;
  }
  return out;
}
export function makeOli(app) { return createCharacter(app, { pose: 'idle', expression: 'neutral' }); }

// o: {x,y,s,flip,pose,expr,blink,glance,t,seed,talk(-1 = not talking, else env level),frame,brow,browTilt,life}
export function placeOli(ch, o) {
  POSES._cur = o.pose; setPose(ch, '_cur'); setExpression(ch, o.expr || 'neutral');
  const L = o.t ?? 0, sd = o.seed ?? 1, life = o.life !== false, q = ch.parts;
  setBlink(ch, life ? Math.min(o.blink ?? 1, lifeBlink(L, sd)) : (o.blink ?? 1));
  q.torso.scale.y = life ? 1 + 0.015 * Math.sin(L * 2.1 + sd) : 1;
  if (life) { q.hips.x += 5 * Math.sin(L * 0.55 + sd * 2); q.head.rotation += 0.03 * Math.sin(L * 0.8 + sd * 3); }
  const gl = o.glance !== undefined ? o.glance : (life ? dart(L, sd) : 0);
  if (gl) { q.eyeL.x += gl * 10; q.eyeR.x += gl * 10; q.face.x += gl * 8; }
  if (o.brow) { q.browL.y += o.brow; q.browR.y += o.brow; }
  if (o.browTilt) { q.browL.rotation += o.browTilt; q.browR.rotation -= o.browTilt; }
  if (o.talk !== undefined && o.talk >= 0) setMouth(ch, o.talk, o.frame || 0);
  ch.shadow.visible = o.shadow !== false;
  ch.root.position.set(o.x, o.y); ch.root.scale.set(o.s * (o.flip ? -1 : 1), o.s);
  return ch.root;
}
// lip sync: env level -> mouth shape. closed <0.08, small <0.3, mid <0.6, wide >=0.6; E / O variants alternate every 4 frames
export function setMouth(ch, lv, frame) {
  const m = ch.parts.mouth, sh = m._shapes, bx = m.scale.x;
  for (const k in sh) sh[k].visible = false;
  const E = Math.floor(frame / 4) % 2 === 0;
  let k = 'neutral', sx = 1, sy = 1;
  if (lv < 0.08) { k = 'neutral'; }
  else if (lv < 0.3) { k = 'surprised'; sx = 0.8; sy = 0.5; }
  else if (lv < 0.6) { if (E) { k = 'happy'; sx = 0.85; sy = 0.55; } else { k = 'surprised'; sx = 1.0; sy = 0.95; } }
  else { if (E) { k = 'happy'; sx = 1.12; sy = 1.0; } else { k = 'surprised'; sx = 1.5; sy = 1.6; } }
  sh[k].visible = true; m.scale.set(bx * sx, sy);
}
export function lifeBlink(t, sd) {
  let tb = 0.8 + hash(sd) * 1.6;
  for (let i = 0; i < 14 && tb < t + 0.2; i++) {
    const d = t - tb; if (d >= 0 && d < 0.15) return d < 0.07 ? 0.15 + (d / 0.07) * 0.15 : 0.3 + ((d - 0.07) / 0.08) * 0.7;
    tb += 2.5 + 1.5 * hash(sd * 7 + i);
  }
  return 1;
}
export function dart(t, sd) {
  let st = 0, pv = 0, cur = hash(sd * 13) * 1.6 - 0.8;
  for (let i = 0; i < 40; i++) {
    const d = 1.3 + hash(sd * 31 + i) * 1.4;
    if (t < st + d) { const k = clamp((t - st) / 0.12); return pv + (cur - pv) * k; }
    st += d; pv = cur; cur = (hash(sd * 17 + i + 3) * 1.6 - 0.8) * (hash(i + sd * 5) > 0.35 ? 1 : 0.2);
  }
  return 0;
}
// deterministic blink (every ~2.3 s, 0.14 s long), offset per character
export function blinkAt(t, off = 0) {
  const p = (t + off) % 2.3; return p < 0.14 ? (p < 0.07 ? 0.1 + (p / 0.07) * 0.2 : 0.3 + ((p - 0.07) / 0.07) * 0.7) : 1;
}
