// "Oli" — CLAYMATION concept. Hand-sculpted modelling-clay look: seeded lumpy vertex displacement,
// matte material with procedural bump (fine grain + thumbprints), imperfect seams.
// API: createCharacter(opts) -> root; setPose(char,'idle'|'point'); setExpression(char,'neutral'|'happy'|'surprised'|'scared')
import * as THREE from 'three';

export const PALETTE = {
  ink: 0x1e1b24, skin: 0xf2c9a8, skinS: 0xd9a383, blush: 0xf28c7a,
  hair: 0x3b2a22, hairS: 0x2a1d17, hood: 0xf2b33d, hoodS: 0xc98e25, cream: 0xfff4dc,
  pants: 0x26305a, pantsS: 0x1a2142, shoe: 0xf7f3ea, shoeS: 0xd8d2c4, stripe: 0xff5d5d, teal: 0x2ec4b6,
};
const P = PALETTE;
const D = Math.PI / 180;

// ---------- seeded noise ----------
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function lat(ix, iy, iz, s) { const n = Math.sin(ix * 127.1 + iy * 311.7 + iz * 74.7 + s * 19.19) * 43758.5453; return n - Math.floor(n); }
const sm = (t) => t * t * (3 - 2 * t);
export function vnoise(x, y, z, s) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = sm(x - ix), fy = sm(y - iy), fz = sm(z - iz);
  const l = (a, b, c) => lat(ix + a, iy + b, iz + c, s);
  const x00 = l(0, 0, 0) + (l(1, 0, 0) - l(0, 0, 0)) * fx, x10 = l(0, 1, 0) + (l(1, 1, 0) - l(0, 1, 0)) * fx;
  const x01 = l(0, 0, 1) + (l(1, 0, 1) - l(0, 0, 1)) * fx, x11 = l(0, 1, 1) + (l(1, 1, 1) - l(0, 1, 1)) * fx;
  const y0 = x00 + (x10 - x00) * fy, y1 = x01 + (x11 - x01) * fy;
  return (y0 + (y1 - y0) * fz) * 2 - 1;
}

// ---------- clay geometry ----------
// weld normals across seams (same position => same normal) so UV seams / poles do not show
function weldNormals(g) {
  g.computeVertexNormals();
  const pos = g.attributes.position, nor = g.attributes.normal, map = new Map();
  const key = (i) => `${Math.round(pos.getX(i) * 4000)},${Math.round(pos.getY(i) * 4000)},${Math.round(pos.getZ(i) * 4000)}`;
  for (let i = 0; i < pos.count; i++) {
    const k = key(i); let e = map.get(k); if (!e) { e = [0, 0, 0, []]; map.set(k, e); }
    e[0] += nor.getX(i); e[1] += nor.getY(i); e[2] += nor.getZ(i); e[3].push(i);
  }
  for (const e of map.values()) {
    const l = Math.hypot(e[0], e[1], e[2]) || 1;
    for (const i of e[3]) nor.setXYZ(i, e[0] / l, e[1] / l, e[2] / l);
  }
}
// lumpy displacement along the surface normal, two octaves, keyed by position (seam-safe)
function clayify(g, seed, amp = 0.012, freq = 4) {
  weldNormals(g);
  const pos = g.attributes.position, nor = g.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n = vnoise(x * freq, y * freq, z * freq, seed) + 0.35 * vnoise(x * freq * 3.7, y * freq * 3.7, z * freq * 3.7, seed + 9);
    const d = amp * n;
    pos.setXYZ(i, x + nor.getX(i) * d, y + nor.getY(i) * d, z + nor.getZ(i) * d);
  }
  weldNormals(g);
  return g;
}
function blobGeo(rx, ry, rz, seed, amp = 0.012, seg = 40) {
  const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.65)); g.scale(rx, ry, rz);
  return clayify(g, seed, amp, 3.2 / Math.max(rx, ry, rz, 0.15));
}
// tapered capsule limb, top at y=0, extends down by len (round caps)
function limbGeo(r0, r1, len, seed, amp = 0.008) {
  const pts = [];
  for (let i = 0; i <= 8; i++) { const a = (90 - i * 90 / 8) * D; pts.push(new THREE.Vector2(Math.max(r0 * Math.cos(a), 1e-4), r0 * Math.sin(a))); }
  for (let i = 0; i <= 8; i++) { const a = (i * 90 / 8) * D; pts.push(new THREE.Vector2(Math.max(r1 * Math.cos(a), 1e-4), -len - r1 * Math.sin(a))); }
  const g = new THREE.LatheGeometry(pts, 36);
  return clayify(g, seed, amp, 7);
}
function profileGeo(profile, seed, amp, zScale = 1, segs = 48) {
  const c = new THREE.SplineCurve(profile.map(([x, y]) => new THREE.Vector2(x, y)));
  const pts = c.getPoints(36).map((p) => new THREE.Vector2(Math.max(p.x, 1e-4), p.y));
  const g = new THREE.LatheGeometry(pts, segs); g.scale(1, 1, zScale);
  return clayify(g, seed, amp, 5);
}

// ---------- materials: matte clay with bump ----------
function makeBump() {
  const S = 1024, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, S, S);
  // fine grain
  for (let i = 0; i < 60000; i++) {
    const x = hash(i * 1.37) * S, y = hash(i * 2.91 + 5) * S, r = 0.6 + hash(i * 0.77 + 2) * 1.8, v = 110 + hash(i * 3.3 + 1) * 50;
    g.fillStyle = `rgba(${v},${v},${v},0.45)`; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
  }
  // soft kneading dents
  for (let i = 0; i < 46; i++) {
    const x = hash(i * 9.1) * S, y = hash(i * 4.3 + 8) * S, r = 14 + hash(i * 7.7) * 36, hi = hash(i * 3.1 + 4) > 0.5;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, hi ? 'rgba(190,190,190,.5)' : 'rgba(60,60,60,.5)'); gr.addColorStop(1, 'rgba(128,128,128,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // thumbprints: concentric broken ridges
  for (let t = 0; t < 14; t++) {
    const cx = hash(t * 5.5 + 3) * S, cy = hash(t * 8.1 + 1) * S, rot = hash(t * 2.2) * 3.14, sq = 0.7 + hash(t * 6.6) * 0.3;
    g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(1, sq);
    for (let k = 0; k < 9; k++) {
      const r = 6 + k * 4.2, a0 = hash(t * 13 + k) * 6.28, span = 2.4 + hash(t * 17 + k * 3) * 3.0;
      g.strokeStyle = k % 2 ? 'rgba(75,75,75,.55)' : 'rgba(180,180,180,.45)'; g.lineWidth = 1.7;
      g.beginPath(); g.arc(0, 0, r, a0, a0 + span); g.stroke();
    }
    g.restore();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4;
  return tex;
}
let _bump; const _mats = new Map();
export function clayMat(hex, o = {}) {
  _bump ||= makeBump();
  const key = hex + JSON.stringify(o);
  if (!_mats.has(key)) _mats.set(key, new THREE.MeshStandardMaterial({ color: hex, roughness: 0.78, metalness: 0, bumpMap: _bump, bumpScale: 2.2, ...o }));
  return _mats.get(key);
}
// per-lump subtle colour drift like unevenly kneaded clay
function tint(hex, seed, k = 0.035) {
  const c = new THREE.Color(hex), hsl = {}; c.getHSL(hsl);
  c.setHSL(hsl.h + (hash(seed) - 0.5) * 0.012, hsl.s * (1 + (hash(seed + 3) - 0.5) * 0.12), THREE.MathUtils.clamp(hsl.l * (1 + (hash(seed + 7) - 0.5) * 2 * k), 0, 1));
  return c.getHex();
}
let _seed = 1;
const mat = (hex, o = {}) => clayMat(tint(hex, (_seed++) * 3.17), o);

function mesh(geo, m, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], name = '', shadow = true } = {}) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(...p); o.rotation.set(...r); o.scale.set(...s); o.name = name;
  o.castShadow = shadow; o.receiveShadow = shadow;
  return o;
}
function group(name, p = [0, 0, 0]) { const g = new THREE.Group(); g.name = name; g.position.set(...p); return g; }
const blob = (rx, ry, rz, hex, o = {}) => mesh(blobGeo(rx, ry, rz, o.seed ?? (_seed * 1.7), o.amp ?? 0.011, o.seg ?? 36), mat(hex, o.m), o);
const limb = (r0, r1, len, hex, o = {}) => mesh(limbGeo(r0, r1, len, o.seed ?? (_seed * 2.3), o.amp ?? 0.007), mat(hex, o.m), o);

// skull ellipsoid radii (head-centre space)
const RX = 0.47, RY = 0.38, RZ = 0.42;
const _z = new THREE.Vector3(0, 0, 1), _n = new THREE.Vector3();
function placeDecal(o, x, y, off) {
  const t = 1 - (x / RX) ** 2 - (y / RY) ** 2;
  const z = RZ * Math.sqrt(Math.max(t, 0.02));
  _n.set(x / RX ** 2, y / RY ** 2, z / RZ ** 2).normalize();
  o.position.set(x, y, z).addScaledVector(_n, off);
  o.quaternion.setFromUnitVectors(_z, _n);
}

const JOINTS = ['hips', 'torso', 'head', 'hair_curl',
  'armL_upper', 'armL_lower', 'handL', 'armR_upper', 'armR_lower', 'handR',
  'legL_upper', 'legL_lower', 'footL', 'legR_upper', 'legR_lower', 'footR'];

// branching fork symbol out of clay "snakes": stem splits into two curved twigs with buds
export function forkParts(hex, scale = 1, flat = 1, seedBase = 40) {
  const g = new THREE.Group();
  const V = (x, y) => new THREE.Vector3(x * scale, y * scale, 0);
  const paths = [
    [V(0, -0.065), V(0.008, -0.04), V(0.004, -0.01), V(0, 0.008)],
    [V(0, 0.008), V(-0.012, 0.03), V(-0.03, 0.047), V(-0.046, 0.076)],
    [V(0, 0.008), V(0.014, 0.022), V(0.03, 0.032), V(0.042, 0.052)],
  ];
  paths.forEach((pts, i) => {
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, 0.0155 * scale, 12, false);
    g.add(mesh(clayify(geo, seedBase + i, 0.0016 * scale, 40), mat(hex, { bumpScale: 1 }), { s: [1, 1, flat], name: 'fork_branch' }));
  });
  for (const [x, y, r] of [[0, -0.065, 0.0155], [-0.046, 0.076, 0.024], [0.042, 0.052, 0.02]])
    g.add(mesh(clayify(new THREE.SphereGeometry(r * scale, 14, 10), seedBase + 7, 0.0012 * scale, 40), mat(hex, { bumpScale: 1 }), { p: [x * scale, y * scale, 0], s: [1, 1, flat], name: 'fork_bud' }));
  return g;
}

export function createCharacter(opts = {}) {
  _seed = 1;
  const root = group('root');
  const parts = { root };
  const reg = (o) => { parts[o.name] = o; o.userData.rest = o.position.clone(); return o; };

  // ---------------- hips + legs ----------------
  const hips = reg(group('hips', [0, 0.58, 0])); root.add(hips);
  hips.add(mesh(profileGeo([[0, 0.1], [0.3, 0.09], [0.355, -0.02], [0.33, -0.13], [0.24, -0.2], [0, -0.215]], 11, 0.01, 0.8), mat(P.pants), { name: 'pants_hips' }));

  for (const [side, S] of [['L', 1], ['R', -1]]) {
    const up = reg(group(`leg${side}_upper`, [S * 0.17, -0.02, 0])); hips.add(up);
    up.add(blob(0.165, 0.165, 0.165, P.pants, { name: 'hip_ball' }));
    up.add(limb(0.16, 0.128, 0.25, P.pants, { name: 'thigh' }));
    const lo = reg(group(`leg${side}_lower`, [0, -0.23, 0])); up.add(lo);
    lo.add(blob(0.13, 0.13, 0.13, P.pantsS, { name: 'knee' }));
    lo.add(limb(0.122, 0.108, 0.14, P.pants, { name: 'shin' }));
    lo.add(limb(0.088, 0.088, 0.09, P.shoe, { p: [0, -0.13, 0], name: 'sock' }));
    const ft = reg(group(`foot${side}`, [0, -0.23, 0])); lo.add(ft);
    ft.add(blob(0.135, 0.095, 0.25, P.shoe, { p: [0, -0.02, 0.08], name: 'sneaker_upper' }));
    ft.add(blob(0.118, 0.075, 0.12, P.shoeS, { p: [0, -0.04, 0.27], name: 'toe_cap' }));
    ft.add(blob(0.15, 0.036, 0.29, P.shoeS, { p: [0, -0.095, 0.09], name: 'sole' }));
    ft.add(blob(0.155, 0.014, 0.295, P.stripe, { p: [0, -0.07, 0.09], name: 'sole_stripe' }));
    for (const lz of [0.04, 0.11]) ft.add(blob(0.055, 0.012, 0.016, P.cream, { p: [0, 0.056 - lz * 0.22, lz + 0.01], name: 'lace', seg: 14 }));
  }

  // ---------------- torso ----------------
  const torso = reg(group('torso')); hips.add(torso);
  torso.add(mesh(profileGeo([[0, -0.05], [0.3, -0.04], [0.405, 0.06], [0.4, 0.2], [0.365, 0.4], [0.325, 0.56], [0.25, 0.66], [0, 0.69]], 21, 0.014, 0.8), mat(P.hood), { name: 'hoodie_body' }));
  const hem = mesh(clayify(new THREE.TorusGeometry(0.385, 0.052, 20, 64), 5, 0.006, 8), mat(P.hoodS), { p: [0, 0.035, 0], r: [Math.PI / 2, 0, 0], s: [1, 0.82, 1], name: 'hoodie_hem' });
  torso.add(hem);
  torso.add(limb(0.1, 0.112, 0.16, P.skin, { p: [0, 0.7, 0], name: 'neck' }));

  const collar = reg(group('hood_collar', [0, 0.6, 0])); torso.add(collar);
  collar.add(mesh(clayify(new THREE.TorusGeometry(0.225, 0.092, 20, 56), 8, 0.01, 6), mat(P.hood), { r: [Math.PI / 2 - 0.12, 0, 0], s: [1, 0.85, 1], name: 'collar_ring' }));
  collar.add(blob(0.27, 0.17, 0.18, P.hoodS, { p: [0, -0.03, -0.19], name: 'hood_bunch' }));

  const pin = reg(group('pin', [0.17, 0.43, 0.265])); torso.add(pin);
  pin.rotation.y = 0.28;
  pin.add(blob(0.078, 0.078, 0.022, P.cream, { name: 'pin_disc', amp: 0.004 }));
  const fork = forkParts(P.teal, 1.05, 0.9, 40); fork.position.z = 0.022; fork.name = 'pin_fork'; pin.add(fork);

  const pocket = reg(group('pocket', [0, 0.12, 0.295])); torso.add(pocket);
  pocket.add(blob(0.21, 0.1, 0.034, P.hoodS, { name: 'pocket_body', amp: 0.007 }));
  pocket.add(blob(0.21, 0.016, 0.04, P.hood, { p: [0, 0.095, 0.002], name: 'pocket_lip', amp: 0.004 }));

  const strings = reg(group('strings')); torso.add(strings);
  for (const S of [1, -1]) {
    strings.add(limb(0.02, 0.02, 0.2, P.cream, { p: [S * 0.065, 0.55, 0.292], r: [-0.14, 0, S * 0.04], name: 'string', amp: 0.003 }));
    strings.add(blob(0.03, 0.045, 0.03, P.cream, { p: [S * 0.07, 0.335, 0.325], name: 'string_tip', amp: 0.003, seg: 16 }));
  }

  // ---------------- arms ----------------
  for (const [side, S] of [['L', 1], ['R', -1]]) {
    const up = reg(group(`arm${side}_upper`, [S * 0.4, 0.5, 0])); torso.add(up);
    up.add(blob(0.15, 0.15, 0.15, P.hood, { name: 'shoulder' }));
    up.add(limb(0.128, 0.118, 0.27, P.hood, { name: 'sleeve_upper' }));
    const lo = reg(group(`arm${side}_lower`, [0, -0.26, 0])); up.add(lo);
    lo.add(blob(0.122, 0.122, 0.122, P.hood, { name: 'elbow' }));
    lo.add(limb(0.118, 0.105, 0.24, P.hood, { name: 'sleeve_lower' }));
    lo.add(limb(0.118, 0.118, 0.05, P.hoodS, { p: [0, -0.2, 0], name: 'cuff' }));
    const hd = reg(group(`hand${side}`, [0, -0.25, 0])); lo.add(hd);
    hd.add(blob(0.092, 0.108, 0.075, P.skin, { p: [0, -0.07, 0], name: 'mitten' }));
    hd.add(blob(0.045, 0.06, 0.045, P.skin, { p: [S * -0.0, -0.06, 0.08], name: 'thumb', seg: 20 }));
    const idx = limb(0.038, 0.03, 0.1, P.skin, { p: [0, -0.15, 0], name: 'index' });
    idx.visible = false; hd.add(idx);
    hd.userData.index = idx;
  }

  // ---------------- head ----------------
  const head = reg(group('head', [0, 0.62, 0])); torso.add(head);
  head.add(blob(RX, RY, RZ, P.skin, { p: [0, 0.38, 0], name: 'skull', amp: 0.008, seg: 64 }));
  for (const S of [1, -1]) head.add(blob(0.07, 0.09, 0.05, P.skinS, { p: [S * 0.46, 0.35, -0.02], name: 'ear', seg: 20, amp: 0.004 }));

  const capBlob = (parent, a, e, r, hex, f = 1) => {
    const A = a * D, E = e * D, k = hash(a * 7.3 + e * 3.1 + r * 50);
    parent.add(blob(r * (1 + 0.1 * k), r * (0.92 + 0.12 * k), r * 1.05, hex,
      { p: [RX * Math.cos(E) * Math.sin(A) * f, RY * Math.sin(E) * f, RZ * Math.cos(E) * Math.cos(A) * f], r: [k * 6, k * 3, k * 2], seg: 22, amp: 0.012 }));
  };
  const hairBack = reg(group('hair_back', [0, 0.38, 0])); head.add(hairBack);
  [[95, 30, .21], [130, 28, .22], [165, 26, .23], [200, 26, .23], [235, 28, .22], [265, 30, .21],
   [100, 52, .23], [140, 52, .24], [180, 52, .24], [220, 52, .24], [260, 52, .23],
   [150, 8, .21], [180, 4, .22], [210, 8, .21], [150, 76, .23], [210, 76, .23], [90, 72, .21], [270, 72, .21], [0, 84, .22]]
    .forEach(([a, e, r], i) => capBlob(hairBack, a, e, r, hash(i * 5.1) > 0.55 ? P.hairS : P.hair, 1.02));
  const hairFront = reg(group('hair_front', [0, 0.38, 0])); head.add(hairFront);
  [[-62, 66, .15], [-38, 69, .16], [-12, 70, .18], [14, 69, .16], [38, 69, .16], [62, 66, .15],
   [-40, 78, .18], [0, 80, .19], [40, 78, .18], [-70, 38, .16], [70, 38, .16], [-84, 20, .12], [84, 20, .12]]
    .forEach(([a, e, r], i) => capBlob(hairFront, a, e, r, hash(i * 2.7 + 1) > 0.6 ? P.hairS : P.hair, 1.03));

  // signature curl: fat clay sausage hooking forward like a question mark
  const curl = reg(group('hair_curl', [0, 0.82, 0.0])); head.add(curl); curl.scale.setScalar(0.9);
  const curve = new THREE.CatmullRomCurve3([
    [0, -0.12, 0], [0, 0.08, -0.03], [0, 0.3, -0.02], [0, 0.5, 0.05], [0, 0.65, 0.2], [0, 0.62, 0.38], [0, 0.46, 0.44], [0, 0.34, 0.33], [0, 0.37, 0.23],
  ].map((v) => new THREE.Vector3(...v)));
  const SEG = 90, RAD = 20;
  const tube = new THREE.TubeGeometry(curve, SEG, 0.12, RAD, false);
  { const pos = tube.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG; curve.getPointAt(u, c);
      const k = 1 - 0.58 * Math.pow(u, 0.9);
      for (let j = 0; j <= RAD; j++) { const idx = i * (RAD + 1) + j; v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(k).add(c); pos.setXYZ(idx, v.x, v.y, v.z); }
    } }
  clayify(tube, 77, 0.009, 7);
  const curlMesh = mesh(tube, mat(P.hair), { name: 'curl_tube', r: [0, -0.85, 0] });
  const endP = curve.getPointAt(1);
  curlMesh.add(blob(0.052, 0.052, 0.052, P.hair, { p: [endP.x, endP.y, endP.z], name: 'curl_tip', seg: 18, amp: 0.004 }));
  curl.add(curlMesh);
  curl.add(blob(0.2, 0.15, 0.2, P.hairS, { p: [0, -0.03, 0], name: 'curl_base' }));

  // ---------------- face ----------------
  const face = reg(group('face', [0, 0.38, 0])); head.add(face);
  const inkM = mat(P.ink, { roughness: 0.55 });
  const white = mat(0xffffff, { roughness: 0.6, bumpScale: 0.8 });
  const eyes = {};
  for (const [side, S] of [['L', 1], ['R', -1]]) {
    const g = group(`eye${side}`);
    const oval = blob(1, 1, 1, P.ink, { name: 'oval', amp: 0.0, seg: 24, shadow: false, m: { roughness: 0.5 } });
    oval.scale.set(0.07, 0.108, 0.03);
    const hi = mesh(new THREE.SphereGeometry(1, 14, 10), white, { p: [0.025, 0.045, 0.024], s: [0.024, 0.028, 0.012], name: 'highlight', shadow: false });
    const arc = mesh(clayify(new THREE.TorusGeometry(0.068, 0.02, 12, 28, Math.PI), 3, 0.002, 20), inkM, { p: [0, -0.03, 0.005], name: 'arc', shadow: false });
    arc.visible = false;
    g.add(oval, hi, arc); face.add(g); placeDecal(g, S * 0.178, -0.03, 0.022);
    parts[g.name] = g; eyes[side] = { g, oval, hi, arc, S };
    const bl = mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: P.blush, transparent: true, opacity: 0.42, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
      { s: [0.082, 0.052, 1], name: `cheek${side}`, shadow: false });
    face.add(bl); placeDecal(bl, S * 0.3, -0.13, 0.012); parts[bl.name] = bl; eyes[side].blush = bl;
  }
  const brows = {};
  for (const [side, S] of [['L', 1], ['R', -1]]) {
    const g = group(`brow${side}`);
    const bg = new THREE.CapsuleGeometry(0.027, 0.1, 6, 16); bg.rotateZ(Math.PI / 2);
    const bar = mesh(clayify(bg, 31 + S, 0.003, 25), mat(P.hairS), { s: [1, 1, 0.7], name: 'bar', shadow: false });
    g.add(bar); face.add(g); parts[g.name] = g; brows[side] = { g, bar, S };
  }
  const mouth = group('mouth'); face.add(mouth); parts.mouth = mouth;
  const mouths = {};
  const tubeMouth = (curve, r) => mesh(clayify(new THREE.TubeGeometry(curve, 30, r, 12, false), 4, 0.0015, 30), inkM, { shadow: false });
  mouths.neutral = tubeMouth(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.07, 0.006, 0), new THREE.Vector3(0, -0.02, 0), new THREE.Vector3(0.07, 0.006, 0)), 0.0165);
  { // happy: open D-shaped smile (pressed-in dark clay) with tongue
    const sh = new THREE.Shape();
    sh.moveTo(-0.115, 0.025); sh.quadraticCurveTo(0, -0.02, 0.115, 0.025);
    sh.bezierCurveTo(0.095, -0.12, -0.095, -0.12, -0.115, 0.025);
    const g = group('mouth_happy');
    g.add(mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 4, curveSegments: 20 }), inkM, { shadow: false }));
    g.add(mesh(new THREE.SphereGeometry(1, 20, 12), mat(0xe8695f, { roughness: 0.6 }), { p: [0, -0.078, 0.012], s: [0.052, 0.026, 0.012], shadow: false }));
    mouths.happy = g;
  }
  mouths.surprised = mesh(clayify(new THREE.SphereGeometry(1, 24, 16).scale(0.042, 0.06, 0.02), 6, 0.0015, 30), inkM, { p: [0, -0.02, 0.005], name: 'mouth_surprised', shadow: false });
  { const pts = []; for (let i = 0; i < 9; i++) pts.push(new THREE.Vector3(-0.115 + i * 0.0288, (i % 2 ? 1 : -1) * 0.02 - 0.015, 0));
    mouths.scared = tubeMouth(new THREE.CatmullRomCurve3(pts), 0.0175); }
  for (const k of Object.keys(mouths)) { mouths[k].visible = false; mouth.add(mouths[k]); }
  placeDecal(mouth, 0, -0.205, 0.018);

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
    E.oval.scale.set(0.07 * e.eye[0], 0.108 * e.eye[1], 0.03);
    E.hi.scale.set(0.024 * e.hi, 0.028 * e.hi, 0.012);
    E.hi.position.set(0.025 * e.eye[0], 0.045 * e.eye[1], 0.026);
    E.blush.material.opacity = e.blush;
    const B = u.brows[k];
    placeDecal(B.g, B.S * 0.178, e.browY, 0.034);
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
  u.parts.hips.position.y -= minY - c.position.y;
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
    p.hips.rotation.z = 0.05; p.torso.rotation.z = -0.07; p.torso.rotation.y = 0.12;
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
