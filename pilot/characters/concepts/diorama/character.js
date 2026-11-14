// "Oli" — DIORAMA concept character: flat-coloured low-poly toy (adapted from ../../lowpoly), fork-branch pin redrawn.
// API: createCharacter(opts) -> root Object3D; setPose(char,'idle'|'point'); setExpression(char,name);
//      explode(char,amount); addPivotMarkers(char); skeletonLines(char); blink(char,k)
import * as THREE from 'three';

export const PALETTE = {
  ink: 0x1e1b24, skin: 0xf2c9a8, skinS: 0xd9a383, blush: 0xf28c7a,
  hair: 0x3b2a22, hairS: 0x2a1d17, hood: 0xf2b33d, hoodS: 0xc98e25, cream: 0xfff4dc,
  pants: 0x26305a, pantsS: 0x1a2142, shoe: 0xf7f3ea, shoeS: 0xd8d2c4, stripe: 0xff5d5d, teal: 0x2ec4b6,
};
const P = PALETTE;
const D = Math.PI / 180;

// THREE.Color treats hex ints as sRGB and converts to linear working space (ColorManagement).
const _mats = new Map();
function mat(hex, o = {}) {
  const key = hex + JSON.stringify(o);
  if (!_mats.has(key)) _mats.set(key, new THREE.MeshStandardMaterial({ color: hex, flatShading: true, roughness: 0.8, metalness: 0, ...o }));
  return _mats.get(key);
}
const smooth = (hex, o = {}) => mat(hex, { flatShading: false, roughness: 0.45, ...o });

function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); } // deterministic

function mesh(geo, m, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], name = '', shadow = true } = {}) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(...p); o.rotation.set(...r); o.scale.set(...s); o.name = name;
  o.castShadow = shadow; o.receiveShadow = shadow;
  return o;
}
function group(name, p = [0, 0, 0]) { const g = new THREE.Group(); g.name = name; g.position.set(...p); return g; }
function oct(rt, rb, h, seg = 8) { const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1); g.rotateY(Math.PI / seg); return g; }
function limb(rt, rb, len, seg = 6) { const g = new THREE.CylinderGeometry(rt, rb, len, seg, 1); g.translate(0, -len / 2, 0); return g; }
const ico = (r, d = 1) => new THREE.IcosahedronGeometry(r, d);

// skull ellipsoid radii (head-centre space)
const RX = 0.46, RY = 0.38, RZ = 0.41;
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

export function createCharacter(opts = {}) {
  const root = group('root');
  const parts = { root };
  const reg = (o) => { parts[o.name] = o; o.userData.rest = o.position.clone(); return o; };

  // ---------------- hips + legs ----------------
  const hips = reg(group('hips', [0, 0.58, 0])); root.add(hips);
  hips.add(mesh(oct(0.34, 0.36, 0.26), mat(P.pants), { p: [0, -0.04, 0], s: [1, 1, 0.78], name: 'pants_hips' }));

  for (const [side, S] of [['L', 1], ['R', -1]]) {
    const up = reg(group(`leg${side}_upper`, [S * 0.17, -0.02, 0])); hips.add(up);
    up.add(mesh(ico(0.16), mat(P.pants), { name: 'hip_ball' }));
    up.add(mesh(limb(0.155, 0.125, 0.25), mat(P.pants), { name: 'thigh' }));
    const lo = reg(group(`leg${side}_lower`, [0, -0.23, 0])); up.add(lo);
    lo.add(mesh(ico(0.125), mat(P.pantsS), { name: 'knee' }));
    lo.add(mesh(limb(0.12, 0.105, 0.14), mat(P.pants), { name: 'shin' }));
    lo.add(mesh(limb(0.085, 0.085, 0.1), mat(P.shoe), { p: [0, -0.13, 0], name: 'sock' }));
    const ft = reg(group(`foot${side}`, [0, -0.23, 0])); lo.add(ft);
    ft.add(mesh(ico(1, 1), mat(P.shoe), { p: [0, -0.025, 0.08], s: [0.135, 0.095, 0.24], name: 'sneaker_upper' }));
    ft.add(mesh(ico(1, 1), mat(P.shoeS), { p: [0, -0.04, 0.26], s: [0.115, 0.075, 0.115], name: 'toe_cap' }));
    ft.add(mesh(new THREE.BoxGeometry(0.28, 0.05, 0.5), mat(P.shoeS), { p: [0, -0.095, 0.09], name: 'sole' }));
    ft.add(mesh(new THREE.BoxGeometry(0.29, 0.02, 0.51), mat(P.stripe), { p: [0, -0.06, 0.09], name: 'sole_stripe' }));
    for (const lz of [0.05, 0.12]) ft.add(mesh(new THREE.BoxGeometry(0.1, 0.014, 0.025), mat(P.cream), { p: [0, 0.052 - lz * 0.2, lz], name: 'lace' }));
  }

  // ---------------- torso ----------------
  const torso = reg(group('torso')); hips.add(torso);
  torso.add(mesh(oct(0.33, 0.4, 0.66), mat(P.hood), { p: [0, 0.31, 0], s: [1, 1, 0.8], name: 'hoodie_body' }));
  torso.add(mesh(oct(0.418, 0.418, 0.1), mat(P.hoodS), { p: [0, 0.03, 0], s: [1, 1, 0.8], name: 'hoodie_hem' }));
  torso.add(mesh(limb(0.1, 0.11, 0.16, 6), mat(P.skin), { p: [0, 0.68, 0], name: 'neck' }));

  const collar = reg(group('hood_collar', [0, 0.6, 0])); torso.add(collar);
  collar.add(mesh(new THREE.TorusGeometry(0.22, 0.095, 5, 9), mat(P.hood), { r: [Math.PI / 2 - 0.12, 0, 0], s: [1, 0.85, 1], name: 'collar_ring' }));
  collar.add(mesh(ico(0.24, 1), mat(P.hoodS), { p: [0, -0.03, -0.19], s: [1.15, 0.75, 0.75], name: 'hood_bunch' }));

  // teal fork pin: a stem that splits into two branches, each ending in a round node (a branch symbol, not a letter)
  const pin = reg(group('pin', [0.17, 0.43, 0.262])); torso.add(pin);
  pin.add(mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.05, 10), mat(P.cream), { r: [Math.PI / 2, 0, 0], p: [0, 0, 0.0], name: 'pin_disc' }));
  const yMat = mat(P.teal, { roughness: 0.5 });
  const rod = (a, b, r, name) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    return mesh(new THREE.CylinderGeometry(r, r, len, 6), yMat, { p: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.034], r: [0, 0, -Math.atan2(dx, dy)], name, shadow: false });
  };
  const J = [0, -0.004], Bm = [0, -0.056], T1 = [-0.048, 0.05], T2 = [0.048, 0.05];
  pin.add(rod(Bm, J, 0.0105, 'pin_stem'), rod(J, T1, 0.0105, 'pin_branchA'), rod(J, T2, 0.0105, 'pin_branchB'));
  for (const [n, q] of [['pin_nodeBase', Bm], ['pin_nodeA', T1], ['pin_nodeB', T2]])
    pin.add(mesh(ico(0.0215, 1), yMat, { p: [q[0], q[1], 0.034], name: n, shadow: false }));

  const pocket = reg(group('pocket', [0, 0.14, 0.3])); torso.add(pocket);
  pocket.add(mesh(new THREE.BoxGeometry(0.31, 0.17, 0.05), mat(P.hoodS), { name: 'pocket_body' }));
  pocket.add(mesh(new THREE.BoxGeometry(0.31, 0.014, 0.056), mat(P.hood), { p: [0, 0.085, 0.002], name: 'pocket_lip' }));

  const strings = reg(group('strings')); torso.add(strings);
  for (const S of [1, -1]) {
    strings.add(mesh(limb(0.018, 0.018, 0.25, 5), mat(P.cream), { p: [S * 0.06, 0.56, 0.272], r: [0, 0, S * 0.04], name: 'string' }));
    strings.add(mesh(ico(0.03, 1), mat(P.cream), { p: [S * 0.06 - S * 0.01, 0.305, 0.272], s: [1, 1.5, 1], name: 'string_tip' }));
  }

  // ---------------- arms ----------------
  for (const [side, S] of [['L', 1], ['R', -1]]) {
    const up = reg(group(`arm${side}_upper`, [S * 0.4, 0.5, 0])); torso.add(up);
    up.add(mesh(ico(0.155), mat(P.hood), { name: 'shoulder' }));
    up.add(mesh(limb(0.13, 0.12, 0.27), mat(P.hood), { name: 'sleeve_upper' }));
    const lo = reg(group(`arm${side}_lower`, [0, -0.26, 0])); up.add(lo);
    lo.add(mesh(ico(0.125), mat(P.hood), { name: 'elbow' }));
    lo.add(mesh(limb(0.12, 0.105, 0.24), mat(P.hood), { name: 'sleeve_lower' }));
    lo.add(mesh(limb(0.112, 0.112, 0.07, 6), mat(P.hoodS), { p: [0, -0.2, 0], name: 'cuff' }));
    const hd = reg(group(`hand${side}`, [0, -0.25, 0])); lo.add(hd);
    hd.add(mesh(ico(1, 1), mat(P.skin), { p: [0, -0.07, 0], s: [0.09, 0.105, 0.07], name: 'mitten' }));
    hd.add(mesh(ico(0.045, 1), mat(P.skin), { p: [0, -0.06, 0.075], s: [0.9, 1.3, 1], name: 'thumb' }));
    const idx = mesh(limb(0.032, 0.026, 0.12, 5), mat(P.skin), { p: [0, -0.15, 0], name: 'index' });
    idx.visible = false; hd.add(idx);
    hd.userData.index = idx;
  }

  // ---------------- head ----------------
  const head = reg(group('head', [0, 0.62, 0])); torso.add(head);
  head.add(mesh(ico(1, 2), mat(P.skin), { p: [0, 0.38, 0], s: [RX, RY, RZ], name: 'skull' }));
  for (const S of [1, -1]) head.add(mesh(ico(0.07, 1), mat(P.skinS), { p: [S * 0.455, 0.35, -0.02], s: [0.5, 1, 0.8], name: 'ear' }));

  const capBlob = (parent, a, e, r, m, f = 1) => {
    const A = a * D, E = e * D, k = hash(a * 7.3 + e * 3.1 + r * 50);
    parent.add(mesh(ico(r * (0.92 + 0.16 * k), 1), m,
      { p: [RX * Math.cos(E) * Math.sin(A) * f, RY * Math.sin(E) * f, RZ * Math.cos(E) * Math.cos(A) * f], r: [k * 6, k * 3, k * 2], s: [1, 0.92, 1] }));
  };
  const H = mat(P.hair), HS = mat(P.hairS);
  const hairBack = reg(group('hair_back', [0, 0.38, 0])); head.add(hairBack);
  [[95, 30, .2], [130, 28, .21], [165, 26, .22], [200, 26, .22], [235, 28, .21], [265, 30, .2],
   [100, 52, .22], [140, 52, .23], [180, 52, .23], [220, 52, .23], [260, 52, .22],
   [150, 8, .2], [180, 4, .21], [210, 8, .2], [150, 76, .22], [210, 76, .22], [90, 72, .2], [270, 72, .2], [0, 84, .2]]
    .forEach(([a, e, r], i) => capBlob(hairBack, a, e, r, hash(i * 5.1) > 0.55 ? HS : H));
  const hairFront = reg(group('hair_front', [0, 0.38, 0])); head.add(hairFront);
  [[-62, 66, .14], [-38, 69, .15], [-12, 70, .17], [14, 69, .15], [38, 69, .15], [62, 66, .14],
   [-40, 78, .17], [0, 80, .18], [40, 78, .17], [-70, 38, .15], [70, 38, .15], [-82, 20, .11], [82, 20, .11]]
    .forEach(([a, e, r], i) => capBlob(hairFront, a, e, r, hash(i * 2.7 + 1) > 0.6 ? HS : H));

  // signature curl: tapered tube hooking forward, like a question mark
  const curl = reg(group('hair_curl', [0, 0.82, 0.0])); head.add(curl); curl.scale.setScalar(0.85);
  const curve = new THREE.CatmullRomCurve3([
    [0, -0.12, 0], [0, 0.08, -0.03], [0, 0.3, -0.02], [0.0, 0.5, 0.05], [0.0, 0.64, 0.2], [0, 0.6, 0.38], [0, 0.45, 0.43], [0, 0.34, 0.32], [0, 0.37, 0.22],
  ].map((v) => new THREE.Vector3(...v)));
  const SEG = 44, RAD = 6;
  const tube = new THREE.TubeGeometry(curve, SEG, 0.11, RAD, false);
  const pos = tube.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i <= SEG; i++) {
    const u = i / SEG; curve.getPointAt(u, c);
    const k = 1 - 0.62 * Math.pow(u, 0.9);
    for (let j = 0; j <= RAD; j++) {
      const idx = i * (RAD + 1) + j;
      v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(k).add(c); pos.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  const curlMesh = mesh(tube, H, { name: 'curl_tube', r: [0, -0.85, 0] });
  const endP = curve.getPointAt(1);
  curlMesh.add(mesh(ico(0.05, 1), H, { p: [endP.x, endP.y, endP.z], name: 'curl_tip' }));
  curl.add(curlMesh);
  curl.add(mesh(ico(0.17, 1), HS, { p: [0, -0.03, 0], s: [1, 0.8, 1], name: 'curl_base' }));

  // ---------------- face ----------------
  const face = reg(group('face', [0, 0.38, 0])); head.add(face);
  const inkM = smooth(P.ink);
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyes = {};
  for (const [side, S] of [['L', 1], ['R', -1]]) {
    const g = group(`eye${side}`);
    const oval = mesh(ico(1, 1), inkM, { s: [0.07, 0.108, 0.026], name: 'oval', shadow: false });
    const hi = mesh(new THREE.SphereGeometry(1, 8, 6), white, { p: [0.025, 0.045, 0.021], s: [0.024, 0.028, 0.012], name: 'highlight', shadow: false });
    const arc = mesh(new THREE.TorusGeometry(0.068, 0.019, 6, 12, Math.PI), inkM, { p: [0, -0.03, 0.005], name: 'arc', shadow: false });
    arc.visible = false;
    g.add(oval, hi, arc); face.add(g); placeDecal(g, S * 0.175, -0.03, 0.016);
    parts[g.name] = g; eyes[side] = { g, oval, hi, arc, S };
    // blush
    const bl = mesh(new THREE.CircleGeometry(1, 14), new THREE.MeshBasicMaterial({ color: P.blush, transparent: true, opacity: 0.42, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
      { s: [0.078, 0.05, 1], name: `cheek${side}`, shadow: false });
    face.add(bl); placeDecal(bl, S * 0.29, -0.13, 0.014); parts[bl.name] = bl; eyes[side].blush = bl;
  }
  const brows = {};
  for (const [side, S] of [['L', 1], ['R', -1]]) {
    const g = group(`brow${side}`);
    const bar = mesh(new THREE.CapsuleGeometry(0.024, 0.1, 2, 6).rotateZ(Math.PI / 2), mat(P.hairS, { flatShading: false }), { s: [1, 1, 0.6], name: 'bar', shadow: false });
    g.add(bar); face.add(g); parts[g.name] = g; brows[side] = { g, bar, S };
  }
  const mouth = group('mouth'); face.add(mouth); parts.mouth = mouth;
  const mOpen = smooth(P.ink, { side: THREE.DoubleSide });
  const mouths = {};
  { // neutral: short closed line, tiny upward ends
    const cv = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.07, 0.004, 0), new THREE.Vector3(0, -0.018, 0), new THREE.Vector3(0.07, 0.004, 0));
    mouths.neutral = mesh(new THREE.TubeGeometry(cv, 8, 0.015, 5), inkM, { name: 'mouth_neutral', shadow: false });
  }
  { // happy: open D-shaped smile with tongue
    const sh = new THREE.Shape();
    sh.moveTo(-0.115, 0.025); sh.quadraticCurveTo(0, -0.02, 0.115, 0.025);
    sh.bezierCurveTo(0.095, -0.12, -0.095, -0.12, -0.115, 0.025);
    const g = group('mouth_happy');
    g.add(mesh(new THREE.ShapeGeometry(sh, 8), mOpen, { shadow: false }));
    g.add(mesh(new THREE.CircleGeometry(1, 12), smooth(0xe8695f), { p: [0, -0.078, 0.003], s: [0.052, 0.026, 1], shadow: false }));
    mouths.happy = g;
  }
  mouths.surprised = mesh(new THREE.CircleGeometry(1, 16), mOpen, { p: [0, -0.02, 0], s: [0.04, 0.058, 1], name: 'mouth_surprised', shadow: false });
  { // scared: wide wobbly line
    const pts = []; for (let i = 0; i < 9; i++) pts.push(new THREE.Vector3(-0.115 + i * 0.0288, (i % 2 ? 1 : -1) * 0.02 - 0.015, 0));
    mouths.scared = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.017, 5), inkM, { name: 'mouth_scared', shadow: false });
  }
  for (const k of Object.keys(mouths)) { mouths[k].visible = false; mouth.add(mouths[k]); }
  placeDecal(mouth, 0, -0.205, 0.016);

  root.userData = { parts, joints: JOINTS.map((n) => parts[n]), eyes, brows, mouths, expression: 'neutral', pose: 'idle' };
  setPose(root, 'idle'); setExpression(root, 'neutral');
  if (opts.scale) root.scale.setScalar(opts.scale);
  return root;
}

// ---------------- expressions ----------------
// brow: y position, tilt (rad, + = inner ends raised), eye scale [x,y], highlight scale, blush opacity
const EXPR = {
  neutral:   { browY: 0.14, tilt: 0.0,  arc: false, eye: [1, 1],       hi: 1,   mouth: 'neutral',   blush: 0.4 },
  happy:     { browY: 0.185, tilt: -0.14, arc: true,  eye: [1, 1],       hi: 1,   mouth: 'happy',     blush: 0.55 },
  surprised: { browY: 0.2, tilt: 0.0,  arc: false, eye: [1.12, 1.2],  hi: 1.35, mouth: 'surprised', blush: 0.3 },
  scared:    { browY: 0.185, tilt: 0.5,  arc: false, eye: [1.08, 1.22], hi: 1.5, mouth: 'scared',    blush: 0.2 },
};
export function setExpression(char, name) {
  const e = EXPR[name]; if (!e) throw new Error('unknown expression ' + name);
  const u = char.userData; u.expression = name;
  for (const k of ['L', 'R']) {
    const E = u.eyes[k];
    E.oval.visible = !e.arc; E.hi.visible = !e.arc; E.arc.visible = e.arc;
    E.oval.scale.set(0.07 * e.eye[0], 0.108 * e.eye[1], 0.026);
    E.hi.scale.set(0.024 * e.hi, 0.028 * e.hi, 0.012);
    E.hi.position.set(0.025 * e.eye[0], 0.045 * e.eye[1], 0.021);
    E.blush.material.opacity = e.blush;
    const B = u.brows[k];
    placeDecal(B.g, B.S * 0.175, e.browY, 0.032);
    B.bar.rotation.z = -B.S * e.tilt;
  }
  for (const [k, m] of Object.entries(u.mouths)) m.visible = k === e.mouth;
}
export const EXPRESSIONS = Object.keys(EXPR);
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
  const b = new THREE.Box3();
  let minY = Infinity;
  for (const f of ['footL', 'footR']) { b.setFromObject(u.parts[f]); minY = Math.min(minY, b.min.y); }
  u.parts.hips.position.y -= minY - c.position.y;
}
export function setPose(c, name) {
  resetPose(c);
  const p = c.userData.parts, u = c.userData; u.pose = name;
  if (name === 'idle') {
    p.armL_upper.rotation.z = 0.2;  p.armR_upper.rotation.z = -0.2;
    p.armL_lower.rotation.x = -0.18; p.armR_lower.rotation.x = -0.18;
    p.armL_lower.rotation.z = -0.04; p.armR_lower.rotation.z = 0.04;
    p.legL_upper.rotation.z = 0.03; p.legR_upper.rotation.z = -0.03;
    p.footL.rotation.y = 0.12; p.footR.rotation.y = -0.12;
    p.head.rotation.x = 0.03;
    p.hair_curl.rotation.z = 0.06;
  } else if (name === 'point') {
    // iso diorama: body faces the camera, the character's LEFT arm (screen right) points sideways at "the one"
    c.rotation.y = 0;
    p.hips.rotation.z = -0.05; p.torso.rotation.z = 0.06; p.torso.rotation.y = 0.12;
    p.armL_upper.rotation.set(0, 0, 1.68);
    p.armL_lower.rotation.set(0, 0, 0.03);
    p.handL.userData.index.visible = true;
    p.armR_upper.rotation.set(0.12, 0, -0.18); p.armR_lower.rotation.set(-0.55, 0, 0);
    // weight on left leg (straight), right leg relaxed
    p.legL_upper.rotation.set(0, 0, 0.03);
    p.legR_upper.rotation.set(-0.16, 0, -0.1); p.legR_lower.rotation.set(0.38, 0, 0); p.footR.rotation.set(-0.2, 0, 0);
    p.head.rotation.set(0.0, 0.28, -0.12);
    p.hair_curl.rotation.z = -0.1;
  } else throw new Error('unknown pose ' + name);
  groundFeet(c);
}

// ---------------- exploded rig ----------------
const EXPLODE = {
  torso: [0, 0.1, 0], head: [0, 0.16, 0], hair_back: [-0.85, 0.1, -0.6], hair_front: [0.85, 0.3, 0.5], hair_curl: [0, 0.2, 0.05], face: [0, 0.0, 0.8],
  hood_collar: [0.95, 0.15, -0.3], pin: [0.6, 0.1, 0.55], pocket: [0, -0.18, 0.6], strings: [-0.4, -0.12, 0.55],
  armL_upper: [0.95, 0.0, 0], armL_lower: [0.16, -0.12, 0], handL: [0.04, -0.12, 0],
  armR_upper: [-0.95, 0.0, 0], armR_lower: [-0.16, -0.12, 0], handR: [-0.04, -0.12, 0],
  legL_upper: [0.9, -0.1, 0], legL_lower: [0.05, -0.12, 0], footL: [0, -0.12, 0],
  legR_upper: [-0.9, -0.1, 0], legR_lower: [-0.05, -0.12, 0], footR: [0, -0.12, 0],
};
export function explode(char, amount = 1) {
  const p = char.userData.parts;
  for (const [n, o] of Object.entries(EXPLODE)) p[n].position.copy(p[n].userData.rest).add(new THREE.Vector3(...o).multiplyScalar(amount));
}

const LINKS = [['root', 'hips'], ['hips', 'torso'], ['torso', 'head'], ['head', 'hair_curl'], ['torso', 'armL_upper'], ['armL_upper', 'armL_lower'],
  ['armL_lower', 'handL'], ['torso', 'armR_upper'], ['armR_upper', 'armR_lower'], ['armR_lower', 'handR'], ['hips', 'legL_upper'],
  ['legL_upper', 'legL_lower'], ['legL_lower', 'footL'], ['hips', 'legR_upper'], ['legR_upper', 'legR_lower'], ['legR_lower', 'footR']];
export const PIVOT_NAMES = ['root', ...JOINTS];

export function addPivotMarkers(char) {
  const dark = new THREE.MeshBasicMaterial({ color: P.ink, depthTest: false, toneMapped: false });
  const dot = new THREE.MeshBasicMaterial({ color: P.stripe, depthTest: false, toneMapped: false });
  for (const n of PIVOT_NAMES) {
    const g = new THREE.Group(); g.name = 'pivot_marker';
    const a = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 8), dark); a.renderOrder = 10;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.044, 10, 8), dot); b.renderOrder = 11;
    g.add(a, b); char.userData.parts[n].add(g);
  }
}
export function skeletonLines(char) {
  char.updateMatrixWorld(true);
  const pts = []; const v = new THREE.Vector3();
  for (const [a, b] of LINKS) {
    char.userData.parts[a].getWorldPosition(v); pts.push(v.x, v.y, v.z);
    char.userData.parts[b].getWorldPosition(v); pts.push(v.x, v.y, v.z);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: P.ink, transparent: true, opacity: 0.6, depthTest: false, toneMapped: false }));
  l.renderOrder = 8; return l;
}
