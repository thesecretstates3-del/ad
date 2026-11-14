// "Oli" — VINYL DESIGNER TOY concept. Perfectly smooth glossy vinyl (MeshPhysicalMaterial + clearcoat),
// chunky oversized head, painted face decals, round display base with the teal fork symbol.
// API: createCharacter(opts) -> root; setPose(char,'idle'|'point'); setExpression(char,'neutral'|'happy'|'surprised'|'scared')
import * as THREE from 'three';

export const PALETTE = {
  ink: 0x1e1b24, skin: 0xf2c9a8, skinS: 0xd9a383, blush: 0xf28c7a,
  hair: 0x3b2a22, hairS: 0x2a1d17, hood: 0xf2b33d, hoodS: 0xc98e25, cream: 0xfff4dc,
  pants: 0x26305a, pantsS: 0x1a2142, shoe: 0xf7f3ea, shoeS: 0xd8d2c4, stripe: 0xff5d5d, teal: 0x2ec4b6,
};
const P = PALETTE;
const D = Math.PI / 180;
export const BASE_TOP = 0.11;
const HEAD_K = 1.3; // head group scale: the "even bigger head"

// ---------- smooth geometry ----------
function weld(g) {
  g.computeVertexNormals();
  const pos = g.attributes.position, nor = g.attributes.normal, map = new Map();
  for (let i = 0; i < pos.count; i++) {
    const k = `${Math.round(pos.getX(i) * 4000)},${Math.round(pos.getY(i) * 4000)},${Math.round(pos.getZ(i) * 4000)}`;
    let e = map.get(k); if (!e) { e = [0, 0, 0, []]; map.set(k, e); }
    e[0] += nor.getX(i); e[1] += nor.getY(i); e[2] += nor.getZ(i); e[3].push(i);
  }
  for (const e of map.values()) { const l = Math.hypot(e[0], e[1], e[2]) || 1; for (const i of e[3]) nor.setXYZ(i, e[0] / l, e[1] / l, e[2] / l); }
  return g;
}
const blobGeo = (rx, ry, rz, seg = 48) => { const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.66)); g.scale(rx, ry, rz); return weld(g); };
function limbGeo(r0, r1, len) {
  const pts = [];
  for (let i = 0; i <= 10; i++) { const a = (90 - i * 9) * D; pts.push(new THREE.Vector2(Math.max(r0 * Math.cos(a), 1e-4), r0 * Math.sin(a))); }
  for (let i = 0; i <= 10; i++) { const a = (i * 9) * D; pts.push(new THREE.Vector2(Math.max(r1 * Math.cos(a), 1e-4), -len - r1 * Math.sin(a))); }
  return weld(new THREE.LatheGeometry(pts, 48));
}
function profileGeo(profile, zScale = 1) {
  const c = new THREE.SplineCurve(profile.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.LatheGeometry(c.getPoints(48).map((p) => new THREE.Vector2(Math.max(p.x, 1e-4), p.y)), 64);
  g.scale(1, 1, zScale); return weld(g);
}

// ---------- glossy vinyl material ----------
const _mats = new Map();
export function vinylMat(hex, o = {}) {
  const key = hex + JSON.stringify(o);
  if (!_mats.has(key)) _mats.set(key, new THREE.MeshPhysicalMaterial({
    color: hex, roughness: 0.2, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, reflectivity: 0.5, envMapIntensity: 1, ...o }));
  return _mats.get(key);
}
const mat = vinylMat;

function mesh(geo, m, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], name = '', shadow = true } = {}) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(...p); o.rotation.set(...r); o.scale.set(...s); o.name = name;
  o.castShadow = shadow; o.receiveShadow = shadow;
  return o;
}
function group(name, p = [0, 0, 0]) { const g = new THREE.Group(); g.name = name; g.position.set(...p); return g; }
const blob = (rx, ry, rz, hex, o = {}) => mesh(blobGeo(rx, ry, rz, o.seg ?? 40), mat(hex, o.m), o);
const limb = (r0, r1, len, hex, o = {}) => mesh(limbGeo(r0, r1, len), mat(hex, o.m), o);

// skull ellipsoid radii (head-local, before HEAD_K scale)
const RX = 0.47, RY = 0.38, RZ = 0.42;
const _z = new THREE.Vector3(0, 0, 1), _n = new THREE.Vector3();
function placeDecal(o, x, y, off) {
  const t = 1 - (x / RX) ** 2 - (y / RY) ** 2;
  const z = RZ * Math.sqrt(Math.max(t, 0.02));
  _n.set(x / RX ** 2, y / RY ** 2, z / RZ ** 2).normalize();
  o.position.set(x, y, z).addScaledVector(_n, off);
  o.quaternion.setFromUnitVectors(_z, _n);
}

// forked-branch brand symbol: one curved stem that splits into two twigs ending in round buds
export function forkParts(hex, scale = 1, flat = 1, o = {}) {
  const g = new THREE.Group();
  const V = (x, y) => new THREE.Vector3(x * scale, y * scale, 0);
  const paths = [
    [V(0, -0.065), V(0.008, -0.04), V(0.004, -0.01), V(0, 0.008)],
    [V(0, 0.008), V(-0.012, 0.03), V(-0.03, 0.047), V(-0.046, 0.076)],
    [V(0, 0.008), V(0.014, 0.022), V(0.03, 0.032), V(0.042, 0.052)],
  ];
  const m = mat(hex, o.m);
  paths.forEach((pts) => g.add(mesh(weld(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, 0.0155 * scale, 20, false)), m, { s: [1, 1, flat], name: 'fork_branch', shadow: o.shadow ?? true })));
  for (const [x, y, r] of [[0, -0.065, 0.0155], [-0.046, 0.076, 0.024], [0.042, 0.052, 0.02]])
    g.add(mesh(new THREE.SphereGeometry(r * scale, 28, 18), m, { p: [x * scale, y * scale, 0], s: [1, 1, flat], name: 'fork_bud', shadow: o.shadow ?? true }));
  return g;
}

const JOINTS = ['hips', 'torso', 'head', 'hair_curl',
  'armL_upper', 'armL_lower', 'handL', 'armR_upper', 'armR_lower', 'handR',
  'legL_upper', 'legL_lower', 'footL', 'legR_upper', 'legR_lower', 'footR'];

export function createCharacter(opts = {}) {
  const root = group('root');
  const parts = { root };
  const reg = (o) => { parts[o.name] = o; o.userData.rest = o.position.clone(); return o; };

  // ---------------- display base ----------------
  const base = group('base'); root.add(base);
  const cyl = (r, h, hex, y, seg = 96, o = {}) => { const m = mesh(new THREE.CylinderGeometry(r, r, h, seg, 1), mat(hex, o), { p: [0, y, 0] }); return m; };
  base.add(cyl(0.9, 0.05, P.pantsS, 0.025));
  base.add(mesh(weld(new THREE.TorusGeometry(0.9, 0.016, 16, 96)), mat(P.pantsS), { p: [0, 0.05, 0], r: [Math.PI / 2, 0, 0] }));
  base.add(cyl(0.86, 0.06, 0xfaf3e4, 0.08));
  base.add(mesh(weld(new THREE.TorusGeometry(0.86, 0.02, 16, 96)), mat(0xfaf3e4), { p: [0, 0.11, 0], r: [Math.PI / 2, 0, 0] }));
  base.add(mesh(new THREE.RingGeometry(0.66, 0.676, 96), mat(P.teal, { clearcoat: 1 }), { p: [0, BASE_TOP + 0.001, 0], r: [-Math.PI / 2, 0, 0], shadow: false }));
  const inlay = forkParts(P.teal, 2.8, 0.12, { shadow: false, m: { roughness: 0.3, clearcoat: 0.6, envMapIntensity: 0.5 } }); inlay.name = 'base_fork';
  inlay.position.set(0, BASE_TOP + 0.003, 0.58); inlay.rotation.x = -Math.PI / 2; base.add(inlay);
  parts.base = base;

  // ---------------- hips + legs ----------------
  const hips = reg(group('hips', [0, 0.44, 0])); root.add(hips);
  hips.add(mesh(profileGeo([[0, 0.1], [0.32, 0.09], [0.37, -0.02], [0.34, -0.13], [0.24, -0.19], [0, -0.2]], 0.84), mat(P.pants), { name: 'pants_hips' }));

  for (const [side, S] of [['L', 1], ['R', -1]]) {
    const up = reg(group(`leg${side}_upper`, [S * 0.165, -0.03, 0])); hips.add(up);
    up.add(blob(0.17, 0.17, 0.17, P.pants, { name: 'hip_ball' }));
    up.add(limb(0.168, 0.145, 0.15, P.pants, { name: 'thigh' }));
    const lo = reg(group(`leg${side}_lower`, [0, -0.17, 0])); up.add(lo);
    lo.add(blob(0.14, 0.14, 0.14, P.pantsS, { name: 'knee' }));
    lo.add(limb(0.135, 0.12, 0.08, P.pants, { name: 'shin' }));
    const ft = reg(group(`foot${side}`, [0, -0.17, 0])); lo.add(ft);
    ft.add(blob(0.15, 0.11, 0.27, P.shoe, { p: [0, -0.04, 0.09], name: 'sneaker_upper' }));
    ft.add(blob(0.13, 0.085, 0.13, P.shoeS, { p: [0, -0.06, 0.3], name: 'toe_cap' }));
    ft.add(blob(0.165, 0.04, 0.31, P.shoeS, { p: [0, -0.125, 0.1], name: 'sole' }));
    ft.add(blob(0.17, 0.016, 0.315, P.stripe, { p: [0, -0.098, 0.1], name: 'sole_stripe' }));
    ft.add(blob(0.06, 0.012, 0.018, P.cream, { p: [0, 0.058, 0.07], name: 'lace' }));
  }

  // ---------------- torso ----------------
  const torso = reg(group('torso')); hips.add(torso);
  torso.add(mesh(profileGeo([[0, -0.05], [0.3, -0.04], [0.41, 0.05], [0.41, 0.17], [0.37, 0.33], [0.31, 0.46], [0.23, 0.54], [0, 0.57]], 0.85), mat(P.hood), { name: 'hoodie_body' }));
  torso.add(mesh(weld(new THREE.TorusGeometry(0.395, 0.05, 28, 96)), mat(P.hoodS), { p: [0, 0.03, 0], r: [Math.PI / 2, 0, 0], s: [1, 0.85, 1], name: 'hoodie_hem' }));
  torso.add(limb(0.1, 0.11, 0.14, P.skin, { p: [0, 0.58, 0], name: 'neck' }));

  const collar = reg(group('hood_collar', [0, 0.5, 0])); torso.add(collar);
  collar.add(mesh(weld(new THREE.TorusGeometry(0.235, 0.095, 28, 80)), mat(P.hood), { r: [Math.PI / 2 - 0.12, 0, 0], s: [1, 0.86, 1], name: 'collar_ring' }));
  collar.add(blob(0.28, 0.17, 0.18, P.hoodS, { p: [0, -0.03, -0.2], name: 'hood_bunch' }));

  const pin = reg(group('pin', [0.16, 0.33, 0.29])); torso.add(pin);
  pin.rotation.y = 0.3;
  pin.add(blob(0.08, 0.08, 0.02, P.cream, { name: 'pin_disc' }));
  const fork = forkParts(P.teal, 1.1, 0.8); fork.position.z = 0.02; fork.name = 'pin_fork'; pin.add(fork);

  const pocket = reg(group('pocket', [0, 0.09, 0.335])); torso.add(pocket);
  pocket.add(blob(0.21, 0.095, 0.03, P.hoodS, { name: 'pocket_body' }));
  pocket.add(blob(0.21, 0.014, 0.036, P.hood, { p: [0, 0.092, 0.002], name: 'pocket_lip' }));

  const strings = reg(group('strings')); torso.add(strings);
  for (const S of [1, -1]) {
    strings.add(limb(0.02, 0.02, 0.16, P.cream, { p: [S * 0.07, 0.45, 0.315], r: [-0.14, 0, S * 0.04], name: 'string' }));
    strings.add(blob(0.03, 0.042, 0.03, P.cream, { p: [S * 0.075, 0.27, 0.345], name: 'string_tip', seg: 24 }));
  }

  // ---------------- arms ----------------
  for (const [side, S] of [['L', 1], ['R', -1]]) {
    const up = reg(group(`arm${side}_upper`, [S * 0.4, 0.4, 0])); torso.add(up);
    up.add(blob(0.15, 0.15, 0.15, P.hood, { name: 'shoulder' }));
    up.add(limb(0.15, 0.13, 0.22, P.hood, { name: 'sleeve_upper' }));
    const lo = reg(group(`arm${side}_lower`, [0, -0.22, 0])); up.add(lo);
    lo.add(blob(0.12, 0.12, 0.12, P.hood, { name: 'elbow' }));
    lo.add(limb(0.128, 0.114, 0.2, P.hood, { name: 'sleeve_lower' }));
    lo.add(limb(0.122, 0.122, 0.04, P.hoodS, { p: [0, -0.17, 0], name: 'cuff' }));
    const hd = reg(group(`hand${side}`, [0, -0.21, 0])); lo.add(hd);
    hd.add(blob(0.1, 0.115, 0.085, P.skin, { p: [0, -0.07, 0], name: 'mitten' }));
    hd.add(blob(0.05, 0.065, 0.05, P.skin, { p: [0, -0.06, 0.09], name: 'thumb', seg: 28 }));
    const idx = limb(0.04, 0.032, 0.1, P.skin, { p: [0, -0.15, 0], name: 'index' });
    idx.visible = false; hd.add(idx);
    hd.userData.index = idx;
  }

  // ---------------- head (uniformly enlarged) ----------------
  const head = reg(group('head', [0, 0.54, 0])); torso.add(head); head.scale.setScalar(HEAD_K);
  head.add(blob(RX, RY, RZ, P.skin, { p: [0, 0.38, 0], name: 'skull', seg: 96 }));
  for (const S of [1, -1]) head.add(blob(0.065, 0.085, 0.05, P.skinS, { p: [S * 0.46, 0.35, -0.02], name: 'ear', seg: 28 }));

  // hair: one smooth glossy cap (tilted so the front edge sits high on the forehead) + fringe lobes
  const hairBack = reg(group('hair_back', [0, 0.38, 0])); head.add(hairBack);
  const cap = new THREE.SphereGeometry(1, 96, 64, 0, Math.PI * 2, 0, 1.34); cap.scale(RX + 0.035, RY + 0.05, RZ + 0.04);
  const capM = mesh(weld(cap), mat(P.hair, { side: THREE.DoubleSide }), { name: 'hair_cap', p: [0, 0.0, -0.03], r: [-0.62, 0, 0] });
  hairBack.add(capM);
  const hairFront = reg(group('hair_front', [0, 0.38, 0])); head.add(hairFront);
  { const fr = group('fringe'); fr.position.copy(capM.position); fr.rotation.copy(capM.rotation); hairFront.add(fr);
    const th = 1.34;
    [[-72, .115], [-50, .125], [-27, .13], [-6, .135], [16, .13], [38, .13], [60, .125], [80, .115]].forEach(([a, r], i) => {
      const A = a * D, ex = RX + 0.035, ey = RY + 0.05, ez = RZ + 0.04;
      const ol = (i % 2) ? 0.0 : 0.015;
      fr.add(blob(r * 0.98, r * 1.0, r * 0.95, i % 3 === 1 ? P.hairS : P.hair, { p: [ex * Math.sin(th) * Math.sin(A), ey * Math.cos(th) - ol, ez * Math.sin(th) * Math.cos(A)], seg: 32, name: 'fringe_lobe' }));
    }); }

  // signature curl: smooth tapered tube hooking forward, question-mark style
  const curl = reg(group('hair_curl', [0, 0.8, 0.0])); head.add(curl); curl.scale.setScalar(0.92);
  const curve = new THREE.CatmullRomCurve3([
    [0, -0.12, 0], [0, 0.08, -0.03], [0, 0.3, -0.02], [0, 0.5, 0.05], [0, 0.65, 0.2], [0, 0.62, 0.38], [0, 0.46, 0.44], [0, 0.34, 0.33], [0, 0.37, 0.23],
  ].map((v) => new THREE.Vector3(...v)));
  const SEG = 120, RAD = 32;
  const tube = new THREE.TubeGeometry(curve, SEG, 0.125, RAD, false);
  { const pos = tube.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG; curve.getPointAt(u, c); const k = 1 - 0.6 * Math.pow(u, 0.9);
      for (let j = 0; j <= RAD; j++) { const idx = i * (RAD + 1) + j; v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(k).add(c); pos.setXYZ(idx, v.x, v.y, v.z); }
    } }
  weld(tube);
  const curlMesh = mesh(tube, mat(P.hair), { name: 'curl_tube', r: [0, -0.85, 0] });
  const endP = curve.getPointAt(1);
  curlMesh.add(blob(0.052, 0.052, 0.052, P.hair, { p: [endP.x, endP.y, endP.z], name: 'curl_tip', seg: 24 }));
  curl.add(curlMesh);
  curl.add(blob(0.2, 0.15, 0.2, P.hairS, { p: [0, -0.03, 0], name: 'curl_base' }));

  // ---------------- face: painted decals ----------------
  const face = reg(group('face', [0, 0.38, 0])); head.add(face);
  const inkM = mat(P.ink, { roughness: 0.12 });
  const whiteM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyes = {};
  for (const [side, S] of [['L', 1], ['R', -1]]) {
    const g = group(`eye${side}`);
    const oval = mesh(new THREE.SphereGeometry(1, 40, 28), inkM, { s: [0.07, 0.108, 0.012], name: 'oval', shadow: false });
    const hi = mesh(new THREE.SphereGeometry(1, 20, 14), whiteM, { p: [0.025, 0.045, 0.011], s: [0.024, 0.028, 0.006], name: 'highlight', shadow: false });
    const arc = mesh(weld(new THREE.TorusGeometry(0.068, 0.02, 14, 40, Math.PI)), inkM, { p: [0, -0.03, 0.004], s: [1, 1, 0.45], name: 'arc', shadow: false });
    arc.visible = false;
    g.add(oval, hi, arc); face.add(g); placeDecal(g, S * 0.178, -0.03, 0.007);
    parts[g.name] = g; eyes[side] = { g, oval, hi, arc, S };
    const bl = mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: P.blush, transparent: true, opacity: 0.42, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
      { s: [0.085, 0.054, 1], name: `cheek${side}`, shadow: false });
    face.add(bl); placeDecal(bl, S * 0.3, -0.13, 0.004); parts[bl.name] = bl; eyes[side].blush = bl;
  }
  const brows = {};
  for (const [side, S] of [['L', 1], ['R', -1]]) {
    const g = group(`brow${side}`);
    const bg = new THREE.CapsuleGeometry(0.027, 0.1, 8, 24); bg.rotateZ(Math.PI / 2);
    const bar = mesh(weld(bg), mat(P.hairS, { clearcoat: 1 }), { s: [1, 1, 0.3], name: 'bar', shadow: false });
    g.add(bar); face.add(g); parts[g.name] = g; brows[side] = { g, bar, S };
  }
  const mouth = group('mouth'); face.add(mouth); parts.mouth = mouth;
  const mouths = {};
  const tubeMouth = (curve, r) => mesh(weld(new THREE.TubeGeometry(curve, 40, r, 14, false)), inkM, { s: [1, 1, 0.3], shadow: false });
  mouths.neutral = tubeMouth(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.07, 0.006, 0), new THREE.Vector3(0, -0.02, 0), new THREE.Vector3(0.07, 0.006, 0)), 0.0165);
  { const sh = new THREE.Shape();
    sh.moveTo(-0.115, 0.025); sh.quadraticCurveTo(0, -0.02, 0.115, 0.025);
    sh.bezierCurveTo(0.095, -0.12, -0.095, -0.12, -0.115, 0.025);
    const g = group('mouth_happy');
    g.add(mesh(new THREE.ShapeGeometry(sh, 32), inkM, { shadow: false }));
    g.add(mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshBasicMaterial({ color: 0xe8695f }), { p: [0, -0.082, 0.001], s: [0.05, 0.022, 1], shadow: false }));
    mouths.happy = g; }
  mouths.surprised = mesh(new THREE.CircleGeometry(1, 32), inkM, { p: [0, -0.02, 0], s: [0.04, 0.058, 1], name: 'mouth_surprised', shadow: false });
  { const pts = []; for (let i = 0; i < 9; i++) pts.push(new THREE.Vector3(-0.115 + i * 0.0288, (i % 2 ? 1 : -1) * 0.02 - 0.015, 0));
    mouths.scared = tubeMouth(new THREE.CatmullRomCurve3(pts), 0.0175); }
  for (const k of Object.keys(mouths)) { mouths[k].visible = false; mouth.add(mouths[k]); }
  placeDecal(mouth, 0, -0.205, 0.008);

  root.userData = { parts, joints: JOINTS.map((n) => parts[n]), eyes, brows, mouths, expression: 'neutral', pose: 'idle' };
  setPose(root, 'idle'); setExpression(root, 'neutral');
  if (opts.scale) root.scale.setScalar(opts.scale);
  return root;
}

// ---------------- expressions ----------------
const EXPR = {
  neutral:   { browY: 0.14, tilt: 0.0,  arc: false, eye: [1, 1],      hi: 1,    mouth: 'neutral',   blush: 0.4 },
  happy:     { browY: 0.19, tilt: -0.14, arc: true,  eye: [1, 1],      hi: 1,    mouth: 'happy',     blush: 0.55 },
  surprised: { browY: 0.205, tilt: 0.0, arc: false, eye: [1.12, 1.2], hi: 1.35, mouth: 'surprised', blush: 0.3 },
  scared:    { browY: 0.185, tilt: 0.5, arc: false, eye: [1.08, 1.22], hi: 1.5, mouth: 'scared',    blush: 0.2 },
};
export const EXPRESSIONS = Object.keys(EXPR);
export function setExpression(char, name) {
  const e = EXPR[name]; if (!e) throw new Error('unknown expression ' + name);
  const u = char.userData; u.expression = name;
  for (const k of ['L', 'R']) {
    const E = u.eyes[k];
    E.oval.visible = !e.arc; E.hi.visible = !e.arc; E.arc.visible = e.arc;
    E.oval.scale.set(0.07 * e.eye[0], 0.108 * e.eye[1], 0.012);
    E.hi.scale.set(0.024 * e.hi, 0.028 * e.hi, 0.006);
    E.hi.position.set(0.025 * e.eye[0], 0.045 * e.eye[1], 0.011);
    E.blush.material.opacity = e.blush;
    const B = u.brows[k];
    placeDecal(B.g, B.S * 0.178, e.browY, 0.012);
    B.bar.rotation.z = -B.S * e.tilt;
  }
  for (const [k, m] of Object.entries(u.mouths)) m.visible = k === e.mouth;
}
export function blink(char, k = 1) { for (const s of ['L', 'R']) char.userData.eyes[s].g.scale.y = THREE.MathUtils.lerp(1, 0.1, k); }

// ---------------- poses ----------------
function resetPose(c) {
  const u = c.userData;
  for (const j of u.joints) { j.rotation.set(0, 0, 0); j.position.copy(j.userData.rest); }
  c.rotation.set(0, 0, 0);
  for (const s of ['L', 'R']) u.parts[`hand${s}`].userData.index.visible = false;
  blink(c, 0);
}
function groundFeet(c) {
  const u = c.userData; c.updateMatrixWorld(true);
  const b = new THREE.Box3(); let minY = Infinity;
  for (const f of ['footL', 'footR']) { b.setFromObject(u.parts[f]); minY = Math.min(minY, b.min.y); }
  u.parts.hips.position.y -= minY - c.position.y - BASE_TOP;
}
export function setPose(c, name) {
  resetPose(c);
  const p = c.userData.parts, u = c.userData; u.pose = name;
  if (name === 'idle') {
    p.armL_upper.rotation.z = 0.2; p.armR_upper.rotation.z = -0.2;
    p.armL_lower.rotation.x = -0.18; p.armR_lower.rotation.x = -0.18;
    p.armL_lower.rotation.z = -0.04; p.armR_lower.rotation.z = 0.04;
    p.legL_upper.rotation.z = 0.03; p.legR_upper.rotation.z = -0.03;
    p.footL.rotation.y = 0.12; p.footR.rotation.y = -0.12;
    p.head.rotation.set(0.03, 0, 0.04);
    p.hair_curl.rotation.z = 0.06;
  } else if (name === 'point') {
    c.rotation.y = -0.8;
    p.hips.rotation.z = 0.04; p.torso.rotation.z = -0.06; p.torso.rotation.y = 0.12;
    p.armR_upper.rotation.set(-1.6, 0, -0.3);
    p.armR_lower.rotation.set(-0.06, 0, 0);
    p.handR.userData.index.visible = true;
    p.armL_upper.rotation.set(0.1, 0, 0.24); p.armL_lower.rotation.set(-0.5, 0, 0);
    p.legR_upper.rotation.set(0, 0, -0.02);
    p.legL_upper.rotation.set(-0.18, 0, 0.1); p.legL_lower.rotation.set(0.42, 0, 0); p.footL.rotation.set(-0.24, 0, 0);
    p.head.rotation.set(0.0, 0.5, 0.13);
    p.hair_curl.rotation.z = -0.1;
  } else throw new Error('unknown pose ' + name);
  groundFeet(c);
}
