// "Oli" — VOXEL concept. Every part is built from unit cubes on an integer grid (1 voxel = S world units),
// face-culled + baked ambient occlusion into one merged BufferGeometry per rig part.
// API: createCharacter(opts) -> root Object3D; setPose(char,'idle'|'point'); setExpression(char,'neutral'|'happy'|'surprised'|'scared')
//      blink(char,k); buildVoxelMesh(vox, opts) (used by the sheet for floor/props).
// Deterministic: all variation comes from an integer hash, never Math.random.
import * as THREE from 'three';

export const PALETTE = {
  ink: 0x1e1b24, skin: 0xf2c9a8, skinS: 0xd9a383, blush: 0xf2b096, hair: 0x3b2a22, hairS: 0x2a1d17,
  hood: 0xf2b33d, hoodS: 0xc98e25, cream: 0xfff4dc, pants: 0x26305a, pantsS: 0x1a2142,
  shoe: 0xf7f3ea, shoeS: 0xd8d2c4, stripe: 0xff5d5d, teal: 0x2ec4b6, white: 0xffffff, tongue: 0xe8695f,
};
const P = PALETTE;
export const S = 0.05; // world units per voxel

// ------------------------------------------------------------------ voxel store
const K = (x, y, z) => ((x + 256) & 511) | (((y + 256) & 511) << 9) | (((z + 256) & 511) << 18);
export function h3(x, y, z, s = 0) {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177) ^ Math.imul(s + 1, 2246822519);
  n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}
export class Vox {
  constructor() { this.m = new Map(); }
  set(x, y, z, c) { this.m.set(K(x, y, z), { x, y, z, c }); return this; }
  has(x, y, z) { return this.m.has(K(x, y, z)); }
  del(x, y, z) { this.m.delete(K(x, y, z)); }
  box(x0, y0, z0, x1, y1, z1, c) {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++)
      this.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c);
    return this;
  }
  mirror() { const o = new Vox(); for (const v of this.m.values()) o.set(-1 - v.x, v.y, v.z, v.c); return o; }
  merge(o) { for (const v of o.m.values()) this.set(v.x, v.y, v.z, v.c); return this; }
}
const sup = (px, py, pz, cx, cy, cz, a, b, c, n) =>
  (Math.abs((px - cx) / a) ** n + Math.abs((py - cy) / b) ** n + Math.abs((pz - cz) / c) ** n) <= 1;
function fillSuper(v, cx, cy, cz, a, b, c, n, colorFn, pred) {
  for (let x = Math.floor(cx - a) - 1; x <= Math.ceil(cx + a); x++)
    for (let y = Math.floor(cy - b) - 1; y <= Math.ceil(cy + b); y++)
      for (let z = Math.floor(cz - c) - 1; z <= Math.ceil(cz + c); z++) {
        if (!sup(x + 0.5, y + 0.5, z + 0.5, cx, cy, cz, a, b, c, n)) continue;
        if (pred && !pred(x, y, z)) continue;
        const col = colorFn(x, y, z); if (col != null) v.set(x, y, z, col);
      }
  return v;
}
const pick = (base, alt, p, seed = 0) => (x, y, z) => (h3(x, y, z, seed) < p ? alt : base);

// ------------------------------------------------------------------ geometry builder (face culling + baked AO)
const AO_LEVELS = [0.5, 0.68, 0.84, 1.0];
export function buildVoxelGeometry(vox, occ, { ao = true, zScale = 1, zPivot = 0 } = {}) {
  const pos = [], nor = [], col = [], idx = [];
  const c = new THREE.Color();
  const E = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (const v of vox.m.values()) {
    const p = [v.x, v.y, v.z];
    c.setHex(v.c);
    // tiny per-voxel luminance jitter so large flat areas feel hand-placed
    const j = 0.965 + 0.07 * h3(v.x, v.y, v.z, 77);
    for (let a = 0; a < 3; a++) for (const sg of [1, -1]) {
      const n = [0, 0, 0]; n[a] = sg;
      if (vox.has(p[0] + n[0], p[1] + n[1], p[2] + n[2])) continue;
      const u = (a + 1) % 3, w = (a + 2) % 3;
      const order = sg > 0 ? [[0, 0], [1, 0], [1, 1], [0, 1]] : [[0, 0], [0, 1], [1, 1], [1, 0]];
      const base = pos.length / 3; const aos = [];
      for (const [du, dw] of order) {
        const q = [p[0], p[1], p[2]]; q[a] += sg > 0 ? 1 : 0; q[u] += du; q[w] += dw;
        pos.push(q[0], q[1], (q[2] - zPivot) * zScale + zPivot); nor.push(...n);
        let f = 1;
        if (ao && occ) {
          const su = du ? 1 : -1, sw = dw ? 1 : -1;
          const b = [p[0] + n[0], p[1] + n[1], p[2] + n[2]];
          const o = (i, k) => { const t = [b[0], b[1], b[2]]; t[u] += i; t[w] += k; return occ(t[0], t[1], t[2]) ? 1 : 0; };
          const s1 = o(su, 0), s2 = o(0, sw), cc = o(su, sw);
          const lv = (s1 && s2) ? 0 : 3 - (s1 + s2 + cc);
          f = AO_LEVELS[lv]; aos.push(f);
        } else aos.push(1);
        col.push(c.r * j * f, c.g * j * f, c.b * j * f);
      }
      if (aos[0] + aos[2] > aos[1] + aos[3]) idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      else idx.push(base + 1, base + 2, base + 3, base + 1, base + 3, base);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}
const VMAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0 });
const VMAT_FLAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 });

// Merge a Vox into a mesh whose origin sits at `pivot` (voxel coords); AO taken from the vox itself.
export function buildVoxelMesh(vox, { pivot = [0, 0, 0], ao = true, scale = S, mat = VMAT, name = '' } = {}) {
  const g = buildVoxelGeometry(vox, (x, y, z) => vox.has(x, y, z), { ao });
  g.translate(-pivot[0], -pivot[1], -pivot[2]);
  const m = new THREE.Mesh(g, mat); m.scale.setScalar(scale); m.name = name; m.castShadow = true; m.receiveShadow = true;
  return m;
}

// ------------------------------------------------------------------ part definitions (built once, shared)
const def = {};   // name -> { vox, pivot, parent, decal }
const order = [];
function part(name, parent, pivot, vox, opt = {}) { def[name] = { name, parent, pivot, vox, ...opt }; order.push(name); return vox; }

const hood = pick(P.hood, P.hoodS, 0.1, 3);
const pantsC = pick(P.pants, P.pantsS, 0.12, 5);

function buildLeg() { // left leg (+x): upper, lower, foot  — voxel x 1..5
  const up = new Vox().box(1, 7, -2, 5, 10, 2, pantsC);
  const lo = new Vox().box(1, 4, -2, 5, 6, 2, pantsC);
  lo.box(1, 3, -2, 5, 3, 2, P.shoe); // sock / ankle collar
  const ft = new Vox();
  for (let x = 1; x <= 5; x++) for (let z = -2; z <= 6; z++) {
    if ((z === 6 && (x === 1 || x === 5)) || (z === -2 && (x === 1 || x === 5))) continue; // rounded footprint
    ft.set(x, 0, z, P.shoeS);                                                           // sole
    const edge = x === 1 || x === 5 || z === 6 || z === -2;
    ft.set(x, 1, z, edge ? P.stripe : P.shoe);                                          // coral stripe ring
    if (z <= 3) ft.set(x, 2, z, (z >= 1 && z <= 3 && x > 1 && x < 5) ? ((x + z) % 2 ? P.cream : P.shoe) : P.shoe);
  }
  for (let x = 2; x <= 4; x++) ft.set(x, 2, 4, P.shoe);       // toe slope
  for (let x = 2; x <= 4; x++) ft.set(x, 1, 6, P.shoeS);      // toe cap shade
  ft.del(2, 2, -1); ft.del(3, 2, -1); ft.del(4, 2, -1);       // ankle opening shows the sock
  for (const [x, z] of [[2, -2], [3, -2], [4, -2]]) ft.set(x, 2, z, P.shoe);
  return { up, lo, ft };
}

function buildArm() { // left arm (+x): upper, lower, hand — voxel x 8..11
  const up = new Vox().box(8, 17, -2, 11, 23, 1, hood);
  up.del(11, 23, -2); up.del(11, 23, 1); up.del(11, 23, -1); up.del(11, 23, 0);
  up.del(8, 23, -2); up.del(8, 23, 1);
  const lo = new Vox().box(8, 12, -2, 11, 16, 1, hood);
  lo.box(8, 11, -2, 11, 11, 1, P.hoodS);                                  // ribbed cuff
  const hd = new Vox().box(8, 8, -2, 11, 10, 1, P.skin);
  for (const [x, z] of [[8, -2], [11, -2], [8, 1], [11, 1]]) hd.del(x, 8, z);
  hd.set(9, 10, 2, P.skin).set(9, 9, 2, P.skin).set(10, 10, 2, P.skinS);        // thumb
  hd.box(8, 10, -2, 11, 10, 1, (x, y, z) => P.skinS && (x === 8 || x === 11) && (z === -2) ? P.skinS : P.skin);
  const ix = new Vox().box(9, 5, -1, 10, 7, 0, P.skin);                    // index finger (point pose only)
  ix.del(9, 5, -1); ix.del(10, 5, -1);
  return { up, lo, hd, ix };
}

(function build() {
  // ---- hips (pants waist block; legs claim most of it)
  part('hips', 'root', [0, 11, 0], new Vox().box(-6, 8, -3, 5, 10, 3, pantsC));
  const leg = buildLeg();
  const legR = { up: leg.up.mirror(), lo: leg.lo.mirror(), ft: leg.ft.mirror() };
  part('legL_upper', 'hips', [3.5, 11, 0], leg.up); part('legR_upper', 'hips', [-3.5, 11, 0], legR.up);
  part('legL_lower', 'legL_upper', [3.5, 7, 0], leg.lo); part('legR_lower', 'legR_upper', [-3.5, 7, 0], legR.lo);
  part('footL', 'legL_lower', [3.5, 3, 0], leg.ft); part('footR', 'legR_lower', [-3.5, 3, 0], legR.ft);

  // ---- torso (oversized hoodie)
  const torso = new Vox();
  for (let x = -8; x <= 7; x++) for (let y = 11; y <= 24; y++) for (let z = -4; z <= 3; z++) {
    const ax = Math.abs(x + 0.5) / 8, az = Math.abs(z + 0.5) / 4;
    if (ax ** 3.2 + az ** 3.2 > 1.03) continue;
    if (y === 24 && Math.abs(x + 0.5) > 7) continue;       // sloping shoulders
    if (y === 11 && Math.abs(x + 0.5) > 7.2) continue;
    torso.set(x, y, z, y <= 12 ? (h3(x, y, z, 9) < 0.35 ? P.hoodS : P.hood) : hood(x, y, z));
  }
  part('torso', 'hips', [0, 11, 0], torso);

  // pocket, strings, pin: one-voxel-thick overlays on the chest (z = 4)
  const pocket = new Vox();
  for (let x = -5; x <= 4; x++) for (let y = 12; y <= 16; y++) {
    if (y === 12 && (x === -5 || x === 4)) continue;
    pocket.set(x, y, 4, y === 16 ? P.hood : (y === 12 ? P.hoodS : P.hoodS));
  }
  for (let y = 12; y <= 15; y++) { pocket.set(-5, y, 4, P.hoodS); pocket.set(4, y, 4, P.hoodS); }
  pocket.box(-4, 13, 4, 3, 15, 4, (x, y, z) => (h3(x, y, z, 21) < 0.14 ? 0xb87f1f : 0xd99a2b));
  pocket.box(-5, 16, 4, 4, 16, 4, P.hood);
  pocket.box(-5, 15, 4, -5, 15, 4, P.hoodS);
  part('pocket', 'torso', [0, 14, 4], pocket);
  const strings = new Vox();
  for (const x of [-2, 1]) { strings.box(x, 18, 4, x, 23, 4, P.cream); strings.set(x, 17, 4, P.shoeS); }
  part('strings', 'torso', [0, 23, 4], strings);
  // teal fork pin: stem splitting into two branches, each ending in a node (branch symbol, not a letter)
  const pin = new Vox();
  const FORK = [
    'XX.XX', 'XX.XX', '.X.X.', '..X..', '..X..', '.XXX.', '.XXX.']; // top row first
  FORK.forEach((row, i) => [...row].forEach((ch, k) => { if (ch === 'X') pin.set(3 + k, 23 - i, 4, P.teal); }));
  part('pin', 'torso', [5, 20, 4], pin);

  // hood collar + bunched hood behind the neck
  const collar = new Vox();
  for (let x = -9; x <= 8; x++) for (let z = -7; z <= 7; z++) for (let y = 24; y <= 26; y++) {
    const px = (x + 0.5), pz = (z + 0.5);
    const outer = (px / 7.6) ** 2 + (pz / 5.6) ** 2 <= 1, inner = (px / 4.3) ** 2 + (pz / 3.5) ** 2 < 1;
    if (!outer || inner) continue;
    if (y === 26 && z > 1) continue;
    collar.set(x, y, z, y === 24 && ((px / 5.4) ** 2 + (pz / 4.3) ** 2 < 1) ? P.hoodS : hood(x, y, z));
  }
  fillSuper(collar, 0, 23.2, -6.6, 6.6, 4.6, 3.2, 2.4, (x, y, z) => (h3(x, y, z, 4) < 0.3 ? P.hood : P.hoodS));
  part('hood_collar', 'torso', [0, 25, 0], collar);

  // ---- arms
  const arm = buildArm();
  const armR = { up: arm.up.mirror(), lo: arm.lo.mirror(), hd: arm.hd.mirror(), ix: arm.ix.mirror() };
  part('armL_upper', 'torso', [10, 22, 0], arm.up); part('armR_upper', 'torso', [-10, 22, 0], armR.up);
  part('armL_lower', 'armL_upper', [10, 17, 0], arm.lo); part('armR_lower', 'armR_upper', [-10, 17, 0], armR.lo);
  part('handL', 'armL_lower', [10, 11, 0], arm.hd); part('handR', 'armR_lower', [-10, 11, 0], armR.hd);
  part('indexL', 'handL', [10, 11, 0], arm.ix); part('indexR', 'handR', [-10, 11, 0], armR.ix);

  // ---- head: skull + neck, hair back, hair front
  const skull = new Vox(), hairBack = new Vox(), hairFront = new Vox();
  const skullIn = (x, y, z) => sup(x + .5, y + .5, z + .5, 0, 32.5, 0, 9.3, 7.9, 6.4, 2.8);
  const plateIn = (x, y, z) => z <= 5 && Math.abs(x + .5) <= 7.4 && y <= 36 && sup(x + .5, y + .5, z + .5, 0, 32.5, 0, 9.3, 7.9, 13, 3.5);
  const hairIn = (x, y, z) => sup(x + .5, y + .5, z + .5, 0, 33.9, -0.6, 10.3, 8.8, 7.4, 2.8);
  const isHair = (x, y, z) => {
    if (!hairIn(x, y, z)) return false;
    if (z < 3) return y >= 27;
    return y >= 37 || (Math.abs(x + 0.5) >= 8 && y >= 29);
  };
  for (let x = -11; x <= 10; x++) for (let y = 24; y <= 44; y++) for (let z = -9; z <= 8; z++) {
    const hair = isHair(x, y, z);
    if (hair) {
      const dark = h3(x, y, z, 11) < 0.22 || (y < 30 && h3(x, y, z, 12) < 0.4);
      const c = dark ? P.hairS : P.hair;
      (z >= 3 && (y >= 37 || Math.abs(x + .5) >= 8) ? hairFront : hairBack).set(x, y, z, c);
    } else if (skullIn(x, y, z) || plateIn(x, y, z)) {
      let c = P.skin;
      if (y === 36 && z >= 3) c = P.skinS;               // shadow under the fringe
      if (y === 25 || (y <= 26 && z <= 0)) c = P.skinS;  // under chin / neck
      skull.set(x, y, z, c);
    }
  }
  skull.box(-2, 21, -2, 1, 24, 1, P.skinS);               // neck
  part('head', 'torso', [0, 25, 0], skull);
  part('hair_back', 'head', [0, 25, 0], hairBack);
  part('hair_front', 'head', [0, 25, 0], hairFront);

  // ---- signature curl: sphere-swept tapered curve in the (y,z) plane, hooking forward like a question mark
  const curl = new Vox();
  const pv = [0, 42, -1], sc = 19;
  // hook drawn in the x-y plane (readable from the front camera), bending towards +x with a slight forward lean
  const cur = new THREE.CatmullRomCurve3([
    [0, -0.12, 0], [0, 0.08, -0.03], [0, 0.3, -0.02], [0, 0.5, 0.05], [0, 0.64, 0.2], [0, 0.6, 0.38], [0, 0.45, 0.43], [0, 0.34, 0.32], [0, 0.37, 0.22],
  ].map(([x, y, z]) => new THREE.Vector3(0, y * sc, z * sc)));
  const N = 300, pts = [];
  for (let i = 0; i <= N; i++) { const u = i / N; const q = cur.getPointAt(u); pts.push({ y: q.y, x: q.z, z: q.y * 0.06, r: 2.7 * (1 - 0.58 * Math.pow(u, 0.9)) }); }
  for (let x = -5; x <= 14; x++) for (let y = -6; y <= 22; y++) for (let z = -5; z <= 6; z++) {
    let hit = false;
    for (const q of pts) { if (Math.hypot(x + .5 - q.x, y + .5 - q.y, (z + .5 - q.z) * 1.15) <= q.r) { hit = true; break; } }
    if (hit) curl.set(pv[0] + x, pv[1] + y, pv[2] + z, h3(x, y, z, 31) < 0.2 ? P.hairS : (y > 8 && h3(x, y, z, 32) < 0.14 ? 0x5a4235 : P.hair));
  }
  part('hair_curl', 'head', pv, curl);

  // ---- face decals: sit on the flat face plate at z = 6, half a voxel thick
  const mk = (rows, x0, y0, map) => { const v = new Vox(); rows.forEach((r, i) => [...r].forEach((ch, k) => { if (ch !== '.') v.set(x0 + k, y0 + rows.length - 1 - i, 6, map[ch]); })); return v; };
  const I = P.ink, W = P.white;
  const eyeSets = {
    neutral: ['XW', 'XX', 'XX'], happy: ['.XX.', 'X..X'], surprised: ['XW', 'XX', 'XX', 'XX'], scared: ['XW', 'XW', 'XX', 'XX'],
  };
  const eyeY0 = { neutral: 30, happy: 30, surprised: 30, scared: 30 };
  const eyeX0 = { neutral: 4, happy: 3, surprised: 4, scared: 4 };
  const map = { X: I, W: W, c: P.tongue };
  const eyes = {};
  for (const e of Object.keys(eyeSets)) {
    const L = mk(eyeSets[e], eyeX0[e], eyeY0[e], map);
    // right eye: mirrored position, highlight kept on the viewer's right like the left eye
    const R = mk(eyeSets[e], -eyeX0[e] - eyeSets[e][0].length, eyeY0[e], map);
    eyes[e] = { L, R };
  }
  const browRows = {
    neutral: ['XXXX'], happy: ['XXXX'], surprised: ['XXXX'],
    scared: ['XX..', '.XXX'],
  };
  const browY = { neutral: 34, happy: 35, surprised: 36, scared: 34 };
  const brows = {};
  for (const e of Object.keys(browRows)) {
    const Lb = mk(browRows[e], 3, browY[e] - (browRows[e].length - 1), { X: P.hairS });
    brows[e] = { L: Lb, R: Lb.mirror() };
  }
  const mouths = {
    neutral: mk(['X..X', '.XX.'], -2, 26, map),
    happy: mk(['XXXXXX', '.XccX.', '..XX..'], -3, 26, map),
    surprised: mk(['.XX.', 'XXXX', '.XX.'], -2, 26, map),
    scared: mk(['.X.XX.X.', 'X.X..X.X'], -4, 26, map),
  };
  const cheekV = new Vox().box(5, 28, 6, 7, 29, 6, P.blush); cheekV.del(7, 29, 6);
  part('face', 'head', [0, 25, 0], new Vox(), { empty: true });
  const eyePv = { L: [5, 31.5, 6], R: [-5, 31.5, 6] };
  part('eyeL', 'face', eyePv.L, eyes.neutral.L, { decal: true, variants: Object.fromEntries(Object.keys(eyes).map((k) => [k, eyes[k].L])) });
  part('eyeR', 'face', eyePv.R, eyes.neutral.R, { decal: true, variants: Object.fromEntries(Object.keys(eyes).map((k) => [k, eyes[k].R])) });
  part('browL', 'face', [5, 34.5, 6], brows.neutral.L, { decal: true, variants: Object.fromEntries(Object.keys(brows).map((k) => [k, brows[k].L])) });
  part('browR', 'face', [-5, 34.5, 6], brows.neutral.R, { decal: true, variants: Object.fromEntries(Object.keys(brows).map((k) => [k, brows[k].R])) });
  part('mouth', 'face', [0, 27, 6], mouths.neutral, { decal: true, variants: mouths });
  part('cheekL', 'face', [6, 28.5, 6], cheekV, { decal: true });
  part('cheekR', 'face', [-6, 28.5, 6], cheekV.mirror(), { decal: true });
})();

// ------------------------------------------------------------------ resolve overlaps, bake geometry once
const GEO = {}; // name -> BufferGeometry ; variants: name -> {key: geo}
(function bake() {
  // later parts win a contested cell (decals never conflict)
  const owner = new Map();
  for (const n of order) {
    const d = def[n]; if (d.decal) continue;
    for (const [k, v] of d.vox.m) { const prev = owner.get(k); if (prev && prev !== n) def[prev].vox.m.delete(k); owner.set(k, n); }
  }
  const occ = (x, y, z) => owner.has(K(x, y, z)) && def[owner.get(K(x, y, z))].vox.m.has(K(x, y, z));
  for (const n of order) {
    const d = def[n]; if (d.empty) continue;
    const mkGeo = (vox) => { const g = buildVoxelGeometry(vox, d.decal ? null : occ, { ao: !d.decal, zScale: d.decal ? 0.5 : 1, zPivot: d.decal ? 6 : 0 }); g.translate(-d.pivot[0], -d.pivot[1], -d.pivot[2]); return g; };
    GEO[n] = mkGeo(d.vox);
    if (d.variants) { GEO[n + ':v'] = {}; for (const [k, v] of Object.entries(d.variants)) GEO[n + ':v'][k] = mkGeo(v); }
  }
})();

const JOINTS = ['hips', 'torso', 'head', 'hair_curl', 'armL_upper', 'armL_lower', 'handL', 'armR_upper', 'armR_lower', 'handR',
  'legL_upper', 'legL_lower', 'footL', 'legR_upper', 'legR_lower', 'footR'];

export function createCharacter(opts = {}) {
  const root = new THREE.Group(); root.name = 'root';
  const parts = { root };
  for (const n of order) {
    const d = def[n];
    const g = new THREE.Group(); g.name = n;
    const par = d.parent === 'root' ? root : parts[d.parent];
    const pp = d.parent === 'root' ? [0, 0, 0] : def[d.parent].pivot;
    g.position.set((d.pivot[0] - pp[0]) * S, (d.pivot[1] - pp[1]) * S, (d.pivot[2] - pp[2]) * S);
    g.userData.rest = g.position.clone();
    if (GEO[n]) {
      const m = new THREE.Mesh(GEO[n], d.decal ? VMAT_FLAT : VMAT);
      m.scale.setScalar(S); m.name = n + '_voxels'; m.castShadow = !d.decal; m.receiveShadow = !d.decal;
      g.add(m); g.userData.mesh = m;
    }
    par.add(g); parts[n] = g;
  }
  // the pivot for rest positions of root children is world-relative to root
  root.userData = { parts, joints: JOINTS.map((n) => parts[n]), expression: 'neutral', pose: 'idle' };
  parts.hips.userData.rest = parts.hips.position.clone();
  setPose(root, 'idle'); setExpression(root, 'neutral');
  if (opts.scale) root.scale.setScalar(opts.scale);
  return root;
}

export const EXPRESSIONS = ['neutral', 'happy', 'surprised', 'scared'];
export function setExpression(c, name) {
  if (!EXPRESSIONS.includes(name)) throw new Error('unknown expression ' + name);
  const p = c.userData.parts; c.userData.expression = name;
  for (const n of ['eyeL', 'eyeR', 'browL', 'browR', 'mouth']) p[n].userData.mesh.geometry = GEO[n + ':v'][name];
  p.cheekL.visible = p.cheekR.visible = name !== 'scared';   // face goes pale when scared
}
export function blink(c, k = 1) { for (const s of ['L', 'R']) c.userData.parts[`eye${s}`].scale.y = THREE.MathUtils.lerp(1, 0.1, k); }

function resetPose(c) {
  const u = c.userData;
  for (const j of u.joints) { j.rotation.set(0, 0, 0); j.position.copy(j.userData.rest); }
  c.rotation.set(0, 0, 0);
  u.parts.indexL.visible = false; u.parts.indexR.visible = false;
  blink(c, 0);
}
function groundFeet(c) {
  const u = c.userData; c.updateMatrixWorld(true);
  const b = new THREE.Box3(); let minY = Infinity;
  for (const f of ['footL', 'footR']) { b.setFromObject(u.parts[f]); minY = Math.min(minY, b.min.y); }
  u.parts.hips.position.y -= minY - c.position.y;
}
export function setPose(c, name) {
  resetPose(c);
  const p = c.userData.parts; c.userData.pose = name;
  if (name === 'idle') {
    p.armL_upper.rotation.z = 0.13; p.armR_upper.rotation.z = -0.13;
    p.armL_lower.rotation.x = -0.12; p.armR_lower.rotation.x = -0.12;
    p.head.rotation.set(0.03, 0.0, 0.04);
    p.hair_curl.rotation.z = 0.06;
  } else if (name === 'point') {
    c.rotation.y = 0.42;
    p.hips.rotation.z = 0.05; p.torso.rotation.z = -0.06; p.torso.rotation.y = -0.05;
    // pointing arm = character's right (towards viewer-left), raised a little, straight
    p.armR_upper.rotation.set(0, 0, -1.72);
    p.armR_lower.rotation.set(0, 0, -0.04);
    p.indexR.visible = true;
    // relaxed arm
    p.armL_upper.rotation.set(0.05, 0, 0.2); p.armL_lower.rotation.set(-0.35, 0, 0);
    // weight on right leg (straight), left leg relaxed
    p.legL_upper.rotation.set(-0.2, 0, 0.08); p.legL_lower.rotation.set(0.4, 0, 0); p.footL.rotation.set(-0.2, 0, 0);
    p.legR_upper.rotation.set(0, 0, -0.03);
    p.head.rotation.set(-0.02, -0.6, 0.12);
    p.hair_curl.rotation.z = -0.1;
  } else throw new Error('unknown pose ' + name);
  groundFeet(c);
}
