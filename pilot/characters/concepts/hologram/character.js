// "Oli" — HOLOGRAM / GAME-HUD PROJECTION. Same smooth rig; additive fresnel-glow shader with depth pre-pass,
// scanlines + flicker band (pure function of HOLO.uTime). Face = bright emissive shapes.
// API: createCharacter(opts) -> root; setPose; setExpression; setHoloTime(t, bandY)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const PALETTE = {
  ink: 0x1e1b24, skin: 0xf2c9a8, skinS: 0xd9a383, blush: 0xf28c7a,
  hair: 0x3b2a22, hairS: 0x2a1d17, hood: 0xf2b33d, hoodS: 0xc98e25, cream: 0xfff4dc,
  pants: 0x26305a, pantsS: 0x1a2142, shoe: 0xf7f3ea, shoeS: 0xd8d2c4, stripe: 0xff5d5d, teal: 0x2ec4b6,
};
const P = PALETTE;
const D = Math.PI / 180;

// ======================= STYLE:BEGIN (the only block that differs between concepts) =======================
export const STYLE_NAME = 'hologram';
// shared deterministic time-driven uniforms (frame = pure function of these)
export const HOLO = { uTime: { value: 3.1 }, uBand: { value: 1.0 } };
export function setHoloTime(t, bandY) { HOLO.uTime.value = t; if (bandY !== undefined) HOLO.uBand.value = bandY; }

const CORAL = [1.0, 0.36, 0.36];
// palette role -> [r,g,b display values, intensity]
const TINT = new Map([
  [P.skin, [[0.5, 0.95, 0.92], 0.8]], [P.skinS, [[0.32, 0.74, 0.78], 0.7]],
  [P.hair, [[0.2, 0.55, 0.95], 0.75]], [P.hairS, [[0.12, 0.4, 0.85], 0.7]],
  [P.hood, [[0.18, 0.77, 0.71], 1.0]], [P.hoodS, [[0.1, 0.55, 0.62], 0.9]],
  [P.cream, [[0.85, 1.0, 0.98], 1.0]],
  [P.pants, [[0.14, 0.5, 0.85], 0.85]], [P.pantsS, [[0.08, 0.32, 0.65], 0.8]],
  [P.shoe, [[0.72, 1.0, 0.96], 0.95]], [P.shoeS, [[0.45, 0.82, 0.88], 0.9]],
  [P.stripe, [CORAL, 1.1]], [P.teal, [CORAL, 1.25]],
]);
const VERT = `
  uniform float uTime; uniform float uBand;
  varying vec3 vN; varying vec3 vV; varying float vWY;
  void main(){
    vec4 wp = modelMatrix * vec4(position, 1.0);
    float jit = smoothstep(0.08, 0.0, abs(wp.y - uBand));       // flicker band tears the image sideways
    wp.x += jit * 0.03 * sin(wp.y * 150.0 + uTime * 17.0);
    vWY = wp.y;
    vec4 mv = viewMatrix * wp;
    vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;
const FRAG = `
  uniform vec3 uCol; uniform float uK; uniform float uTime; uniform float uBand;
  varying vec3 vN; varying vec3 vV; varying float vWY;
  void main(){
    vec3 n = normalize(vN);
    float lam = max(dot(n, normalize(vec3(-0.45, 0.6, 0.65))), 0.0);
    float fr = pow(1.0 - abs(dot(n, normalize(vV))), 2.0);
    vec3 base = uCol * (0.22 + 0.5 * lam) * uK;
    vec3 edge = mix(uCol, vec3(0.75, 1.0, 1.0), 0.45) * fr * 1.25;
    float scan = 0.66 + 0.34 * step(0.5, fract(gl_FragCoord.y / 4.0 + uTime * 0.6));
    float band = smoothstep(0.06, 0.0, abs(vWY - uBand));
    vec3 c = (base + edge) * scan + band * vec3(0.18, 0.4, 0.42);
    gl_FragColor = vec4(c, 0.92);
  }`;
const _mats = new Map();
function mat(hex, o = {}) {
  if (!_mats.has(hex)) {
    const [c, k] = TINT.get(hex) || [[0.3, 0.8, 0.8], 0.9];
    _mats.set(hex, new THREE.ShaderMaterial({
      uniforms: { uTime: HOLO.uTime, uBand: HOLO.uBand, uCol: { value: new THREE.Vector3(...c) }, uK: { value: k } },
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
  }
  return _mats.get(hex);
}
const depthMat = new THREE.ShaderMaterial({
  uniforms: { uTime: HOLO.uTime, uBand: HOLO.uBand }, vertexShader: VERT, fragmentShader: 'void main(){ gl_FragColor = vec4(0.0); }',
  colorWrite: false, depthWrite: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
});
// depth pre-pass twin: only the front-most surface glows (no additive pile-up from overlapping parts)
function finish(o) { const d = new THREE.Mesh(o.geometry, depthMat); d.name = 'depth_twin'; d.renderOrder = -1; o.add(d); }
const glow = (rgb, op = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(...rgb, THREE.LinearSRGBColorSpace), transparent: true, opacity: op,
  blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const NAVY = 0x0e1222;
const FACE = {
  ink: glow([0.8, 1.0, 0.97]), white: new THREE.MeshBasicMaterial({ color: 0x3aa7a8 }), brow: glow([0.7, 1.0, 1.0]),
  mouthFill: new THREE.MeshBasicMaterial({ color: NAVY, side: THREE.DoubleSide }), tongue: glow(CORAL, 0.9),
  blush: () => glow(CORAL, 0.3),
};
export const LIGHT = 'hologram';
// ======================= STYLE:END =======================

function mesh(geo, m, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], name = '', shadow = true, fx = true } = {}) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(...p); o.rotation.set(...r); o.scale.set(...s); o.name = name;
  o.castShadow = shadow; o.receiveShadow = shadow;
  if (fx) finish(o);
  return o;
}
const deco = (geo, m, o = {}) => mesh(geo, m, { shadow: false, fx: false, ...o });
function group(name, p = [0, 0, 0]) { const g = new THREE.Group(); g.name = name; g.position.set(...p); return g; }
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function limb(rt, rb, len, seg = 18) { const g = new THREE.CylinderGeometry(rt, rb, len, seg, 1); g.translate(0, -len / 2, 0); return g; }
const ico = (r, d = 3) => new THREE.IcosahedronGeometry(r, d);
const rbox = (w, h, d, r = 0.02) => new RoundedBoxGeometry(w, h, d, 4, r);
function lathe(profile, seg = 36) { return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg); }

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
  hips.add(mesh(lathe([[0, -0.2], [0.3, -0.2], [0.36, -0.1], [0.35, 0.05], [0.3, 0.1], [0, 0.1]], 32), mat(P.pants), { s: [1, 1, 0.8], name: 'pants_hips' }));

  for (const [side, S] of [['L', 1], ['R', -1]]) {
    const up = reg(group(`leg${side}_upper`, [S * 0.17, -0.02, 0])); hips.add(up);
    up.add(mesh(ico(0.16), mat(P.pants), { name: 'hip_ball' }));
    up.add(mesh(limb(0.155, 0.125, 0.25), mat(P.pants), { name: 'thigh' }));
    const lo = reg(group(`leg${side}_lower`, [0, -0.23, 0])); up.add(lo);
    lo.add(mesh(ico(0.125), mat(P.pants), { name: 'knee' }));
    lo.add(mesh(limb(0.12, 0.105, 0.14), mat(P.pants), { name: 'shin' }));
    lo.add(mesh(limb(0.085, 0.085, 0.1), mat(P.shoe), { p: [0, -0.13, 0], name: 'sock' }));
    const ft = reg(group(`foot${side}`, [0, -0.23, 0])); lo.add(ft);
    ft.add(mesh(ico(1, 3), mat(P.shoe), { p: [0, -0.02, 0.09], s: [0.135, 0.095, 0.25], name: 'sneaker_upper' }));
    ft.add(mesh(ico(1, 3), mat(P.shoe), { p: [0, -0.04, 0.27], s: [0.115, 0.075, 0.115], name: 'toe_cap' }));
    ft.add(mesh(rbox(0.28, 0.06, 0.52, 0.028), mat(P.shoeS), { p: [0, -0.1, 0.1], name: 'sole' }));
    ft.add(mesh(rbox(0.285, 0.022, 0.525, 0.01), mat(P.stripe), { p: [0, -0.07, 0.1], name: 'sole_stripe' }));
    for (const lz of [0.03, 0.1]) ft.add(deco(new THREE.CapsuleGeometry(0.012, 0.08, 3, 6).rotateZ(Math.PI / 2), mat(P.cream, { rim: false }), { p: [0, 0.058 - lz * 0.15, lz + 0.03], name: 'lace' }));
  }

  // ---------------- torso ----------------
  const torso = reg(group('torso')); hips.add(torso);
  torso.add(mesh(lathe([[0, 0], [0.38, 0], [0.425, 0.04], [0.43, 0.14], [0.4, 0.34], [0.34, 0.52], [0.26, 0.62], [0.2, 0.66], [0, 0.66]], 40),
    mat(P.hood), { s: [1, 1, 0.8], name: 'hoodie_body' }));
  torso.add(mesh(new THREE.TorusGeometry(0.4, 0.04, 10, 40), mat(P.hoodS), { p: [0, 0.035, 0], r: [Math.PI / 2, 0, 0], s: [1, 0.8, 1], name: 'hoodie_hem' }));
  torso.add(mesh(limb(0.1, 0.11, 0.16), mat(P.skin), { p: [0, 0.68, 0], name: 'neck' }));

  const collar = reg(group('hood_collar', [0, 0.6, 0])); torso.add(collar);
  collar.add(mesh(new THREE.TorusGeometry(0.22, 0.095, 14, 36), mat(P.hood), { r: [Math.PI / 2 - 0.12, 0, 0], s: [1, 0.85, 1], name: 'collar_ring' }));
  collar.add(mesh(ico(0.24), mat(P.hoodS), { p: [0, -0.03, -0.19], s: [1.15, 0.75, 0.75], name: 'hood_bunch' }));

  // brand pin: a forked branch (stem splitting into two prongs with round nodes) on a cream disc
  const pin = reg(group('pin', [0.17, 0.43, 0.262])); torso.add(pin);
  pin.rotation.y = 0.5; pin.userData.rest = pin.position.clone();
  pin.add(mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.06, 28), mat(P.cream), { r: [Math.PI / 2, 0, 0], name: 'pin_disc' }));
  const fm = mat(P.teal, { rim: false });
  const tubeAt = (pts, r) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((v) => new THREE.Vector3(v[0], v[1], 0.034))), 12, r, 8), fm, { shadow: false, name: 'pin_branch' });
  pin.add(tubeAt([[0, -0.042], [0, -0.012], [0, 0.002]], 0.0085));
  pin.add(tubeAt([[0, 0.0], [-0.01, 0.014], [-0.026, 0.028]], 0.0085));
  pin.add(tubeAt([[0, 0.0], [0.01, 0.014], [0.026, 0.028]], 0.0085));
  for (const [x, y, r] of [[0, -0.045, 0.014], [-0.028, 0.031, 0.013], [0.028, 0.031, 0.013]])
    pin.add(mesh(new THREE.SphereGeometry(r, 14, 10), fm, { p: [x, y, 0.034], shadow: false, name: 'pin_node' }));

  const pocket = reg(group('pocket', [0, 0.15, 0.33])); torso.add(pocket);
  pocket.rotation.x = 0.1;
  pocket.add(mesh(rbox(0.33, 0.17, 0.05, 0.022), mat(P.hoodS), { name: 'pocket_body' }));
  pocket.add(mesh(rbox(0.33, 0.026, 0.056, 0.012), mat(P.hood), { p: [0, 0.075, 0.002], name: 'pocket_lip' }));

  const strings = reg(group('strings')); torso.add(strings);
  for (const S of [1, -1]) {
    strings.add(mesh(limb(0.02, 0.02, 0.3, 10), mat(P.cream), { p: [S * 0.075, 0.6, 0.31], r: [-0.12, 0, S * 0.06], name: 'string' }));
    strings.add(mesh(ico(0.03, 2), mat(P.cream), { p: [S * 0.088, 0.29, 0.285], s: [1, 1.5, 1], name: 'string_tip' }));
  }

  // ---------------- arms ----------------
  for (const [side, S] of [['L', 1], ['R', -1]]) {
    const up = reg(group(`arm${side}_upper`, [S * 0.4, 0.5, 0])); torso.add(up);
    up.add(mesh(ico(0.155), mat(P.hood), { name: 'shoulder' }));
    up.add(mesh(limb(0.13, 0.12, 0.27), mat(P.hood), { name: 'sleeve_upper' }));
    const lo = reg(group(`arm${side}_lower`, [0, -0.26, 0])); up.add(lo);
    lo.add(mesh(ico(0.125), mat(P.hood), { name: 'elbow' }));
    lo.add(mesh(limb(0.12, 0.105, 0.24), mat(P.hood), { name: 'sleeve_lower' }));
    lo.add(mesh(limb(0.112, 0.112, 0.07), mat(P.hoodS), { p: [0, -0.2, 0], name: 'cuff' }));
    const hd = reg(group(`hand${side}`, [0, -0.25, 0])); lo.add(hd);
    hd.add(mesh(ico(1, 3), mat(P.skin), { p: [0, -0.07, 0], s: [0.09, 0.105, 0.075], name: 'mitten' }));
    hd.add(mesh(ico(0.045, 2), mat(P.skin), { p: [0, -0.06, 0.08], s: [0.9, 1.3, 1], name: 'thumb' }));
    const idx = mesh(new THREE.CapsuleGeometry(0.03, 0.1, 4, 10).translate(0, -0.05, 0), mat(P.skin), { p: [0, -0.13, 0], name: 'index' });
    idx.visible = false; hd.add(idx);
    hd.userData.index = idx;
  }

  // ---------------- head ----------------
  const head = reg(group('head', [0, 0.62, 0])); torso.add(head);
  head.add(mesh(ico(1, 5), mat(P.skin), { p: [0, 0.38, 0], s: [RX, RY, RZ], name: 'skull' }));
  for (const S of [1, -1]) head.add(mesh(ico(0.07, 2), mat(P.skinS), { p: [S * 0.455, 0.35, -0.02], s: [0.5, 1, 0.8], name: 'ear' }));

  const capBlob = (parent, a, e, r, m, f = 1) => {
    const A = a * D, E = e * D, k = hash(a * 7.3 + e * 3.1 + r * 50);
    parent.add(mesh(ico(r * (0.92 + 0.16 * k), 3), m,
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

  // signature curl: tapered tube hooking forward like a question mark
  const curl = reg(group('hair_curl', [0, 0.82, 0.0])); head.add(curl); curl.scale.setScalar(0.88);
  const curve = new THREE.CatmullRomCurve3([
    [0, -0.12, 0], [0, 0.08, -0.03], [0, 0.3, -0.02], [0.0, 0.5, 0.05], [0.0, 0.64, 0.2], [0, 0.6, 0.38], [0, 0.45, 0.43], [0, 0.34, 0.32], [0, 0.37, 0.22],
  ].map((v) => new THREE.Vector3(...v)));
  const SEG = 72, RAD = 14;
  const tube = new THREE.TubeGeometry(curve, SEG, 0.12, RAD, false);
  const pos = tube.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i <= SEG; i++) {
    const u = i / SEG; curve.getPointAt(u, c);
    const k = 1 - 0.6 * Math.pow(u, 0.9);
    for (let j = 0; j <= RAD; j++) {
      const idx = i * (RAD + 1) + j;
      v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(k).add(c); pos.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  tube.computeVertexNormals();
  const curlMesh = mesh(tube, H, { name: 'curl_tube', r: [0, -0.85, 0] });
  const endP = curve.getPointAt(1);
  curlMesh.add(mesh(ico(0.052, 3), H, { p: [endP.x, endP.y, endP.z], name: 'curl_tip' }));
  curl.add(curlMesh);
  curl.add(mesh(ico(0.17, 3), HS, { p: [0, -0.03, 0], s: [1, 0.8, 1], name: 'curl_base' }));

  // ---------------- face ----------------
  const face = reg(group('face', [0, 0.38, 0])); head.add(face);
  const eyes = {};
  for (const [side, S] of [['L', 1], ['R', -1]]) {
    const g = group(`eye${side}`);
    const oval = deco(ico(1, 3), FACE.ink, { s: [0.07, 0.108, 0.026], name: 'oval' });
    const hi = deco(new THREE.SphereGeometry(1, 14, 10), FACE.white, { p: [0.025, 0.045, 0.021], s: [0.024, 0.028, 0.012], name: 'highlight' });
    const arc = deco(new THREE.TorusGeometry(0.068, 0.02, 8, 20, Math.PI), FACE.ink, { p: [0, -0.03, 0.005], name: 'arc' });
    arc.visible = false;
    g.add(oval, hi, arc); face.add(g); placeDecal(g, S * 0.175, -0.03, 0.016);
    parts[g.name] = g; eyes[side] = { g, oval, hi, arc, S };
    const bl = deco(new THREE.CircleGeometry(1, 20), FACE.blush(), { s: [0.078, 0.05, 1], name: `cheek${side}` });
    face.add(bl); placeDecal(bl, S * 0.29, -0.13, 0.014); parts[bl.name] = bl; eyes[side].blush = bl;
  }
  const brows = {};
  for (const [side, S] of [['L', 1], ['R', -1]]) {
    const g = group(`brow${side}`);
    const bar = deco(new THREE.CapsuleGeometry(0.026, 0.1, 4, 10).rotateZ(Math.PI / 2), FACE.brow, { s: [1, 1, 0.6], name: 'bar' });
    g.add(bar); face.add(g); parts[g.name] = g; brows[side] = { g, bar, S };
  }
  const mouth = group('mouth'); face.add(mouth); parts.mouth = mouth;
  const mouths = {};
  const tubeOf = (pts, r, m = FACE.ink) => deco(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, r, 8), m);
  { // neutral
    const cv = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.07, 0.004, 0), new THREE.Vector3(0, -0.018, 0), new THREE.Vector3(0.07, 0.004, 0));
    mouths.neutral = deco(new THREE.TubeGeometry(cv, 12, 0.015, 8), FACE.ink, { name: 'mouth_neutral' });
  }
  { // happy: open D smile with tongue
    const sh = new THREE.Shape();
    sh.moveTo(-0.115, 0.025); sh.quadraticCurveTo(0, -0.02, 0.115, 0.025);
    sh.bezierCurveTo(0.095, -0.12, -0.095, -0.12, -0.115, 0.025);
    const g = group('mouth_happy');
    g.add(deco(new THREE.ShapeGeometry(sh, 16), FACE.mouthFill));
    g.add(deco(new THREE.CircleGeometry(1, 20), FACE.tongue, { p: [0, -0.078, 0.003], s: [0.052, 0.026, 1] }));
    const pts = sh.getPoints(24).map((q) => new THREE.Vector3(q.x, q.y, 0.001));
    g.add(deco(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 60, 0.011, 6, true), FACE.ink));
    mouths.happy = g;
  }
  { const g = group('mouth_surprised');
    g.add(deco(new THREE.CircleGeometry(1, 24), FACE.mouthFill, { p: [0, -0.02, 0], s: [0.04, 0.058, 1] }));
    g.add(deco(new THREE.TorusGeometry(1, 0.2, 6, 28), FACE.ink, { p: [0, -0.02, 0.001], s: [0.042, 0.06, 0.06] }));
    mouths.surprised = g; }
  { const pts = []; for (let i = 0; i < 9; i++) pts.push(new THREE.Vector3(-0.115 + i * 0.0288, (i % 2 ? 1 : -1) * 0.02 - 0.015, 0));
    mouths.scared = deco(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 36, 0.017, 8), FACE.ink, { name: 'mouth_scared' }); }
  for (const k of Object.keys(mouths)) { mouths[k].visible = false; mouth.add(mouths[k]); }
  placeDecal(mouth, 0, -0.205, 0.016);

  root.userData = { parts, joints: JOINTS.map((n) => parts[n]), eyes, brows, mouths, expression: 'neutral', pose: 'idle' };
  setPose(root, 'idle'); setExpression(root, 'neutral');
  if (opts.scale) root.scale.setScalar(opts.scale);
  return root;
}

// ---------------- expressions ----------------
const EXPR = {
  neutral:   { browY: 0.14, tilt: 0.0,  arc: false, eye: [1, 1],      hi: 1,   mouth: 'neutral',   blush: 0.45 },
  happy:     { browY: 0.185, tilt: -0.14, arc: true,  eye: [1, 1],      hi: 1,   mouth: 'happy',     blush: 0.65 },
  surprised: { browY: 0.2, tilt: 0.0,  arc: false, eye: [1.12, 1.2], hi: 1.35, mouth: 'surprised', blush: 0.3 },
  scared:    { browY: 0.185, tilt: 0.5,  arc: false, eye: [1.08, 1.22], hi: 1.5, mouth: 'scared',    blush: 0.15 },
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
    placeDecal(B.g, B.S * 0.175, e.browY, 0.034);
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
  const b = new THREE.Box3(); let minY = Infinity;
  for (const f of ['footL', 'footR']) { b.setFromObject(u.parts[f], true); minY = Math.min(minY, b.min.y); }
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
    // three-quarter turn; right arm raised and pointing out to the side, head tilted toward it, weight on left leg
    c.rotation.y = 0.55;
    p.hips.rotation.z = 0.04; p.torso.rotation.z = -0.05; p.torso.rotation.y = -0.1;
    p.armR_upper.rotation.set(0, 0, -1.42);
    p.armR_lower.rotation.set(-0.05, 0, -0.1);
    p.handR.userData.index.visible = true;
    p.armL_upper.rotation.set(0.1, 0, 0.26); p.armL_lower.rotation.set(-0.45, 0, 0);
    p.legL_upper.rotation.set(0, 0, 0.0);
    p.legR_upper.rotation.set(-0.16, 0, -0.12); p.legR_lower.rotation.set(0.4, 0, 0); p.footR.rotation.set(-0.24, 0, 0);
    p.head.rotation.set(0.02, -0.55, -0.16);
    p.hair_curl.rotation.z = 0.12;
  } else throw new Error('unknown pose ' + name);
  groundFeet(c);
}
