// "Oli" in PIXEL ART style. Every part is a real pixel grid (palette indices) baked to a
// nearest-neighbour texture. Poses/expressions are frame swaps + whole-pixel offsets, no rotation.
// Character space: 1 unit = 1 logical pixel, x right, y down, ground (between feet) = (0,0).
// Screen-left limbs are "L", screen-right limbs are "R".
import { Container, Sprite, Texture } from 'pixi.js';

// ---------------------------------------------------------------- palette (locked to the bible)
const HEX = ['', '#1E1B24', '#F2C9A8', '#D9A383', '#F2B196', '#3B2A22', '#2A1D17', '#5B4338',
  '#F2B33D', '#C98E25', '#FFF4DC', '#26305A', '#1A2142', '#F7F3EA', '#D8D2C4', '#FF5D5D', '#2EC4B6', '#F28C7A'];
const C = { INK: 1, SKIN: 2, SKINS: 3, BLUSH: 4, HAIR: 5, HAIRS: 6, HAIRH: 7, HOOD: 8, HOODS: 9, CREAM: 10,
  PANT: 11, PANTS: 12, SNK: 13, SNKS: 14, CORAL: 15, TEAL: 16, MOUTH: 17 };
// BLUSH = #F28C7A at 40% over skin, pre-mixed; HAIRH = one lifted hair tone used only as a rim light.
const RGB = HEX.map(h => h ? [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) : null);
export const PALETTE = HEX.slice(1);

// ---------------------------------------------------------------- tiny raster toolkit
class Grid {
  constructor(x0, y0, x1, y1) { this.x0 = x0; this.y0 = y0; this.w = x1 - x0 + 1; this.h = y1 - y0 + 1; this.d = new Uint8Array(this.w * this.h); }
  get(x, y) { x -= this.x0; y -= this.y0; return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? 0 : this.d[y * this.w + x]; }
  set(x, y, c) { x = Math.round(x) - this.x0; y = Math.round(y) - this.y0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.d[y * this.w + x] = c; }
  each(fn) { for (let y = this.y0; y < this.y0 + this.h; y++) for (let x = this.x0; x < this.x0 + this.w; x++) fn(x, y, this.get(x, y)); }
}
function ell(g, cx, cy, rx, ry, c) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy <= 1) g.set(x, y, c);
  }
}
function rect(g, x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g.set(x, y, c); }
function cap(g, ax, ay, bx, by, r, c, o = {}) {
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  const x0 = Math.floor(Math.min(ax, bx) - r - 1), x1 = Math.ceil(Math.max(ax, bx) + r + 1);
  const y0 = Math.floor(Math.min(ay, by) - r - 1), y1 = Math.ceil(Math.max(ay, by) + r + 1);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const px = x - ax, py = y - ay, t = px * ux + py * uy, tc = Math.max(0, Math.min(L, t));
    const ex = px - ux * tc, ey = py - uy * tc;
    if (ex * ex + ey * ey > r * r) continue;
    if (o.t0 !== undefined && t < o.t0) continue;
    if (o.t1 !== undefined && t > o.t1) continue;
    g.set(x, y, c);
  }
}
// recolour pixels of `base` whose bottom/right/left side is within b/r/l pixels of the silhouette edge
function shade(g, base, sh, { b = 0, r = 0, l = 0 } = {}) {
  const list = [];
  g.each((x, y, c) => {
    if (c !== base) return; let s = false;
    for (let k = 1; k <= b; k++) if (!g.get(x, y + k)) s = true;
    for (let k = 1; k <= r; k++) if (!g.get(x + k, y)) s = true;
    for (let k = 1; k <= l; k++) if (!g.get(x - k, y)) s = true;
    if (s) list.push([x, y]);
  });
  list.forEach(([x, y]) => g.set(x, y, sh));
}
function rim(g, base, hi, top = true, left = false) {
  const list = [];
  g.each((x, y, c) => { if (c === base && ((top && !g.get(x, y - 1)) || (left && !g.get(x - 1, y)))) list.push([x, y]); });
  list.forEach(([x, y]) => g.set(x, y, hi));
}
function shearGrid(g, k, y0) {
  const src = g.d.slice(); g.d.fill(0);
  for (let y = g.y0; y < g.y0 + g.h; y++) for (let x = g.x0; x < g.x0 + g.w; x++) {
    const c = src[(y - g.y0) * g.w + (x - g.x0)]; if (c) g.set(x + Math.round((y - y0) * k), y, c);
  }
}
function outline(g, o) {
  const list = [];
  g.each((x, y, c) => {
    if (c) return;
    let hit = null;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = g.get(x + dx, y + dy); if (n) { hit = [dx, dy, n]; break; } }
    if (!hit) return;
    if (o.excl && o.excl(x, y)) return;
    let col = o.outlineColor || C.INK;
    // selective lighter outline: on the lit (top/left) sides of hoodie + sneakers
    if (o.light && (hit[0] === 1 || hit[1] === 1) && o.light[hit[2]]) col = o.light[hit[2]];
    list.push([x, y, col]);
  });
  list.forEach(([x, y, col]) => g.set(x, y, col));
}
function bake(g, pivot, extra = {}) {
  const cv = document.createElement('canvas'); cv.width = g.w; cv.height = g.h;
  const ctx = cv.getContext('2d'); const im = ctx.createImageData(g.w, g.h);
  for (let i = 0; i < g.d.length; i++) { const c = g.d[i]; if (c) { im.data[i * 4] = RGB[c][0]; im.data[i * 4 + 1] = RGB[c][1]; im.data[i * 4 + 2] = RGB[c][2]; im.data[i * 4 + 3] = 255; } }
  ctx.putImageData(im, 0, 0);
  const tex = Texture.from(cv); tex.source.scaleMode = 'nearest';
  return { tex, px: pivot[0] - g.x0, py: pivot[1] - g.y0, pivot, w: g.w, h: g.h, grid: g, ...extra };
}
// bb = drawing bounds [x0,y0,x1,y1]; pivot = joint in the same coordinates
function mk(bb, pivot, draw, o = {}) {
  const m = o.margin || 0;
  const g = new Grid(bb[0] - 1 - m, bb[1] - 1, bb[2] + 1 + m, bb[3] + 1);
  draw(g);
  if (o.shear) shearGrid(g, o.shear.k, o.shear.y0);
  if (!o.noOutline) outline(g, o);
  return bake(g, pivot, { next: o.next });
}
// feature sprite from char rows, centred on its pivot
function feat(rows, map) {
  const w = rows[0].length, h = rows.length, ox = -(w >> 1), oy = -(h >> 1);
  return mk([ox, oy, ox + w - 1, oy + h - 1], [0, 0], g => {
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (map[ch]) g.set(ox + i, oy + j, map[ch]); }));
  }, { noOutline: true });
}
const flip = rows => rows.map(r => [...r].reverse().join(''));

// ---------------------------------------------------------------- head
const mass = (g, ox) => { ell(g, ox, -69, 23, 17, C.HAIR); ell(g, ox, -64, 23, 13, C.HAIR); };
function fringeY(x) {
  const ax = Math.abs(x);
  if (ax >= 19) return -57;
  if (ax >= 17) return -66;
  const t = (((x + 16) % 12) + 12) % 12, d = Math.abs(t - 6) / 6, amp = x < -4 ? 3 : x < 8 ? 3 : 2;
  return -73 + Math.round(amp * (1 - d));
}
function curlPath(ox) {
  const pts = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push([ox - 1 - 2.2 * t, -83 - 10 * t, 3.8 - 0.3 * t]); }
  const R = 7, cx = ox + 4, cy = -93;
  for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * 1.3 * Math.PI; pts.push([cx - R * Math.cos(a), cy - R * Math.sin(a), 3.5 - 2.0 * t]); }
  return pts;
}
function headFrames(ox, k) {
  const o = k ? { shear: { k, y0: -48 }, margin: 8 } : {};
  const f = {};
  f.hair_back = mk([ox - 24, -87, ox + 24, -50], [ox, -63], g => { mass(g, ox); shade(g, C.HAIR, C.HAIRS, { b: 2, r: 2 }); }, o);
  f.head = mk([ox - 22, -79, ox + 22, -48], [ox, -48], g => {
    ell(g, ox, -63, 21, 15, C.SKIN); shade(g, C.SKIN, C.SKINS, { b: 2, r: 2 });
  }, o);
  f.hair_front = mk([ox - 24, -87, ox + 24, -55], [ox, -63], g => {
    const m = new Grid(g.x0, g.y0, g.x0 + g.w - 1, g.y0 + g.h - 1); mass(m, ox);
    m.each((x, y, c) => { if (c && y <= fringeY(x - ox)) g.set(x, y, C.HAIR); });
    shade(g, C.HAIR, C.HAIRS, { b: 2, r: 2 });
    rim(g, C.HAIR, C.HAIRH, true, false);
    // soft sheen arc on the upper-left of the mop
    g.each((x, y, c) => {
      if (c !== C.HAIR) return;
      const dx = (x - ox) / 17, dy = (y + 69) / 11, v = dx * dx + dy * dy;
      if (v > 0.55 && v < 0.85 && x - ox < -3 && x - ox > -15 && y < -76) g.set(x, y, C.HAIRH);
    });
  }, o);
  f.hair_curl = mk([ox - 9, -110, ox + 18, -82], [ox, -84], g => {
    for (const [x, y, r] of curlPath(ox)) ell(g, x, y, r, r, C.HAIR);
    shade(g, C.HAIR, C.HAIRS, { b: 2, r: 2 });
    rim(g, C.HAIR, C.HAIRH, true, true);
  }, { ...o, excl: (x, y) => y >= -83 });
  return f;
}

function faceFrames() {
  const E = { '#': C.INK, c: C.CREAM }, B = { '#': C.HAIR }, M = { '#': C.INK, c: C.CREAM, m: C.MOUTH };
  const brow = {
    flat: [".#####.", "#######", ".#####."],
    arch: ["..###..", ".#####.", "##...##"],
    tilt: ["...####", ".######", "####..."],
  };
  return {
    eye: {
      open: feat([".###.", "###cc", "###cc", "#####", "#####", "#####", "#####", "#####", ".###."], E),
      wide: feat(["..###..", ".#####.", "###ccc#", "###ccc#", "#######", "#######", "#######", "#######", "#######", ".#####.", "..###.."], E),
      scared: feat(["..###..", ".#####.", "###cc##", "###cc##", "#######", "#c#####", "#######", ".#####.", "..###.."], E),
      arc: feat(["..###..", ".##.##.", "##...##", "#.....#"], E),
      blink: feat(["#####", "#####"], E),
    },
    browL: { flat: feat(brow.flat, B), arch: feat(brow.arch, B), tilt: feat(brow.tilt, B) },
    browR: { flat: feat(flip(brow.flat), B), arch: feat(flip(brow.arch), B), tilt: feat(flip(brow.tilt), B) },
    mouth: {
      line: feat(["#####"], M),
      smile: feat(["#########", "#ccccccc#", ".#mmmmm#.", "..#mmm#..", "...###..."], M),
      o: feat([".###.", "#####", "#####", "#####", "#mmm#", ".###."], M),
      wobble: feat(["##.##.##.##", ".#########.", "..#mmmmm#..", "...#####..."], M),
    },
    blush: feat([".bbbbb.", "bbbbbbb", "bbbbbbb", ".bbbbb."], { b: C.BLUSH }),
  };
}

// ---------------------------------------------------------------- torso and costume
function torsoFrame(cx, hw) {
  return mk([cx - hw - 4, -51, cx + hw + 4, -27], [0, -30], g => {
    for (let y = -51; y <= -27; y++) {
      const half = hw + Math.round(((y + 51) / 24) * 1.5);
      const cut = y === -51 ? 5 : y === -50 ? 3 : y === -49 ? 2 : y === -48 ? 1 : 0;
      for (let x = cx - half + cut; x <= cx + half - cut; x++) g.set(x, y, C.HOOD);
    }
    shade(g, C.HOOD, C.HOODS, { r: 3 });
    for (let y = -28; y <= -27; y++) g.each((x, yy, c) => { if (yy === y && c) g.set(x, yy, C.HOODS); });
    rim(g, C.HOOD, C.CREAM, true, false);
    g.each((x, y, c) => { if (c === C.CREAM && (x > cx - 2 && x < cx + 3 || y < -51)) g.set(x, y, C.HOOD); });
  }, { light: { [C.HOOD]: C.HOODS } });
}
function collarFrame(cx, rx) {
  return mk([cx - rx - 1, -54, cx + rx + 1, -38], [cx, -48], g => {
    ell(g, cx, -45, rx, 5.5, C.HOOD);
    ell(g, cx, -47, rx - 9, 2.4, C.SKIN);
    shade(g, C.HOOD, C.HOODS, { b: 2, r: 2 });
    for (let x = cx - rx + 10; x <= cx + rx - 10; x++) g.set(x, -45, C.SKINS);
    rim(g, C.HOOD, C.CREAM, true, false);
  }, { light: { [C.HOOD]: C.HOODS } });
}
function stringsFrame(cx) {
  return mk([cx - 7, -41, cx + 7, -31], [cx, -41], g => {
    [[cx - 5, 0], [cx + 4, 1]].forEach(([x, w]) => {
      for (let y = -41; y <= -32; y++) { const xx = x; g.set(xx, y, C.CREAM); g.set(xx + 1, y, C.CREAM); }
      g.set(x, -32, C.HOODS); g.set(x + 1, -32, C.HOODS); g.set(x, -31, C.HOODS); g.set(x + 1, -31, C.HOODS);
    });
  }, { noOutline: true });
}
function pocketFrame(cx, hw) {
  return mk([cx - hw - 3, -34, cx + hw + 3, -29], [cx, -32], g => {
    for (let y = -34; y <= -29; y++) { const half = hw + Math.round((y + 34) / 5 * 2); rect(g, cx - half, y, cx + half, y, C.HOOD); }
    shade(g, C.HOOD, C.HOODS, { b: 1, r: 2 });
  }, { outlineColor: C.HOODS });
}
function pinFrame(cx) {
  const rows = ["#...#", ".#.#.", "..#..", "..#..", "..#.."];
  return mk([cx - 2, -39, cx + 2, -35], [cx, -37], g => {
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '#') g.set(cx - 2 + i, -39 + j, C.TEAL); }));
  }, { noOutline: true });
}

// ---------------------------------------------------------------- limbs (authored local to their joint)
function armUpper(s, kind) {
  const nx = kind === 'down' ? [s, 10] : kind === 'bent' ? [5 * s, 8] : [11, -4];
  const L = Math.hypot(nx[0], nx[1]), ux = nx[0] / L, uy = nx[1] / L, clip = kind !== 'bent';
  return mk([Math.min(0, nx[0]) - 6, Math.min(0, nx[1]) - 6, Math.max(0, nx[0]) + 6, Math.max(0, nx[1]) + 6], [0, 0], g => {
    cap(g, 0, 0, nx[0], nx[1], 4.5, C.HOOD, clip ? { t1: L - 0.01 } : {});
    shade(g, C.HOOD, C.HOODS, { r: 2, b: clip ? 0 : 2 });
  }, { next: nx, excl: clip ? (x, y) => x * ux + y * uy >= L - 0.01 : null, light: { [C.HOOD]: C.HOODS } });
}
function armLower(s, kind) {
  const nx = kind === 'down' ? [s, 9] : kind === 'bent' ? [-5 * s, 7] : [10, -4];
  const L = Math.hypot(nx[0], nx[1]), ux = nx[0] / L, uy = nx[1] / L, clip = kind !== 'bent';
  return mk([Math.min(0, nx[0]) - 6, Math.min(0, nx[1]) - 6, Math.max(0, nx[0]) + 6, Math.max(0, nx[1]) + 6], [0, 0], g => {
    cap(g, 0, 0, nx[0], nx[1], 4.5, C.HOOD, { t1: L - 0.01, t0: clip ? 0 : undefined });
    shade(g, C.HOOD, C.HOODS, { r: 2 });
    g.each((x, y, c) => { if (c && x * ux + y * uy > L - 2.1) g.set(x, y, C.HOODS); });
  }, { next: nx, excl: clip ? (x, y) => x * ux + y * uy <= -0.9 : null, light: { [C.HOOD]: C.HOODS } });
}
function handFrame(s, kind) {
  return mk([-9, -9, 14, 12], [0, 0], g => {
    if (kind === 'point') {
      cap(g, 11, -4, 5, -2, 1.4, C.SKIN);              // index finger
      ell(g, 2.5, -0.5, 4, 3.6, C.SKIN);               // mitten block
      ell(g, 1.5, -5, 1.8, 2.3, C.SKIN);               // thumb
      ell(g, 11, -4, 1.4, 1.4, C.SKIN);
      shade(g, C.SKIN, C.SKINS, { b: 1, r: 1 });
    } else {
      ell(g, 0, 3, 4, 4.8, C.SKIN);                    // mitten
      ell(g, -s * 3.5, 3, 2, 2.6, C.SKIN);              // thumb on the inner side
      shade(g, C.SKIN, C.SKINS, { b: 2, r: 1 });
      for (let y = 1; y <= 4; y++) g.set(-s * 2, y, C.SKINS);   // thumb seam
    }
  }, { next: null });
}
function thigh(s, kind) {
  const nx = kind === 'down' ? [0, 12] : [5 * s, 12], L = Math.hypot(...nx), ux = nx[0] / L, uy = nx[1] / L;
  return mk([-8, -6, 12, 18], [0, 0], g => {
    cap(g, 0, 0, nx[0], nx[1], 4.5, C.PANT, { t1: L - 0.01 });
    shade(g, C.PANT, C.PANTS, { r: 2 });
  }, { next: nx, excl: (x, y) => x * ux + y * uy >= L - 0.01 });
}
function shin(s, dx = 1) {
  return mk([-8, -2, 8, 12], [0, 0], g => {
    cap(g, 0, 0, dx * s, 8, 4.5, C.PANT, { t0: 0, t1: 8.05 });
    shade(g, C.PANT, C.PANTS, { r: 2 });
    g.each((x, y, c) => { if (c && y >= 7) g.set(x, y, C.PANTS); });
    for (let y = 9; y <= 10; y++) rect(g, dx * s - 2, y, dx * s + 2, y, y === 10 ? C.SKINS : C.SKIN);
  }, { next: [dx * s, 9], excl: (x, y) => y <= -1 });
}
function shoe(kind) {
  const front = [[-3, 3], [-4, 4], [-5, 5], [-6, 6], [-6, 6], [-6, 6], [-6, 6], [-6, 6], [-5, 5]];
  const side = [[-4, 0], [-5, 1], [-5, 3], [-5, 6], [-5, 8], [-5, 9], [-5, 10], [-6, 10], [-6, 10]];
  const rows = kind === 'front' ? front : side;
  return mk([-8, 0, 12, 8], [0, 0], g => {
    rows.forEach(([a, b], j) => rect(g, a, j, b, j, j === 7 ? C.CORAL : j === 8 ? C.SNKS : C.SNK));
    shade(g, C.SNK, C.SNKS, { r: 2 });
    if (kind === 'front') { rect(g, -2, 1, 2, 1, C.SNKS); g.set(-2, 3, C.SNKS); g.set(0, 3, C.SNKS); g.set(2, 3, C.SNKS); }
    else { rect(g, -5, 2, -1, 2, C.SNKS); [[1, 1], [2, 2], [3, 3], [4, 4]].forEach(([x, y]) => g.set(x, y, C.SNKS)); rect(g, 6, 3, 9, 4, C.SNK); }
  }, { light: { [C.SNK]: C.SNKS } });
}

// ---------------------------------------------------------------- frame library (built once)
let LIB = null;
function lib() {
  if (LIB) return LIB;
  const F = {}, face = faceFrames();
  const hf = headFrames(0, 0), ht = headFrames(1, -0.09);
  F.hips = { main: { tex: null, px: 0, py: 0, pivot: [0, -30] } };
  F.torso = { front: torsoFrame(0, 17), q3: torsoFrame(1, 15) };
  F.collar = { front: collarFrame(0, 15), q3: collarFrame(2, 13) };
  F.strings = { front: stringsFrame(0), q3: stringsFrame(3) };
  F.pocket = { front: pocketFrame(0, 10), q3: pocketFrame(2, 8) };
  F.pin = { front: pinFrame(8), q3: pinFrame(7) };
  for (const n of ['head', 'hair_back', 'hair_front', 'hair_curl']) F[n] = { front: hf[n], tilt: ht[n] };
  F.eyeL = F.eyeR = face.eye; F.browL = face.browL; F.browR = face.browR; F.mouth = face.mouth;
  F.blushL = F.blushR = { on: face.blush };
  for (const [side, s] of [['L', -1], ['R', 1]]) {
    F['arm' + side + '_upper'] = { down: armUpper(s, 'down'), bent: armUpper(s, 'bent'), raise: armUpper(s, 'raise') };
    F['arm' + side + '_lower'] = { down: armLower(s, 'down'), bent: armLower(s, 'bent'), point: armLower(s, 'point') };
    F['hand' + side] = { down: handFrame(s, 'down'), point: handFrame(s, 'point') };
    F['leg' + side + '_upper'] = { down: thigh(s, 'down'), out: thigh(s, 'out') };
    F['leg' + side + '_lower'] = { down: shin(s), out: shin(s, 3) };
    F['foot' + side] = { front: shoe('front'), q3: shoe('side') };
  }
  return (LIB = F);
}

// ---------------------------------------------------------------- rig definition
// [name, parent, zIndex, spriteOnTop, chain(position derived from parent frame.next)]
const NODES = [
  ['hips', 'root', 0, false, false],
  ['legL_upper', 'hips', 0, true, false], ['legL_lower', 'legL_upper', 1, true, true], ['footL', 'legL_lower', 1, false, true],
  ['legR_upper', 'hips', 0, true, false], ['legR_lower', 'legR_upper', 1, true, true], ['footR', 'legR_lower', 1, false, true],
  ['torso', 'hips', 5, false, false],
  ['collar', 'torso', 1, false, false], ['pocket', 'torso', 2, false, false], ['strings', 'torso', 3, false, false], ['pin', 'torso', 4, false, false],
  ['armL_upper', 'torso', 6, true, false], ['armL_lower', 'armL_upper', 1, true, true], ['handL', 'armL_lower', 1, false, true],
  ['armR_upper', 'torso', 6, true, false], ['armR_lower', 'armR_upper', 1, true, true], ['handR', 'armR_lower', 1, false, true],
  ['head', 'torso', 8, false, false],
  ['hair_back', 'head', -1, false, false], ['blushL', 'head', 1, false, false], ['blushR', 'head', 1, false, false],
  ['eyeL', 'head', 2, false, false], ['eyeR', 'head', 2, false, false], ['mouth', 'head', 2, false, false],
  ['hair_front', 'head', 3, false, false], ['browL', 'head', 4, false, false], ['browR', 'head', 4, false, false],
  ['hair_curl', 'head', 5, false, false],
];
export const PART_NAMES = NODES.map(n => n[0]);

const tiltDx = y => Math.round((y + 48) * -0.09);
const faceBase = {
  front: { eyeL: [-9, -59], eyeR: [9, -59], browL: [-9, -66], browR: [9, -66], mouth: [0, -51], blushL: [-15, -53], blushR: [15, -53] },
  q3: { eyeL: [-5, -59], eyeR: [13, -59], browL: [-5, -66], browR: [13, -66], mouth: [4, -51], blushL: [-12, -53], blushR: [15, -53] },
};
function faceAt(kind, tilt) {
  const out = {};
  for (const [k, [x, y]] of Object.entries(faceBase[kind])) out[k] = [x + (tilt ? 1 + tiltDx(y) : 0), y];
  return out;
}
const idleParts = {
  hips: { f: 'main' }, torso: { f: 'front' }, collar: { f: 'front' }, strings: { f: 'front' }, pocket: { f: 'front' }, pin: { f: 'front' },
  head: { f: 'front' }, hair_back: { f: 'front' }, hair_front: { f: 'front' }, hair_curl: { f: 'front' },
  armL_upper: { f: 'down', at: [-17, -46] }, armL_lower: { f: 'down' }, handL: { f: 'down' },
  armR_upper: { f: 'down', at: [17, -46] }, armR_lower: { f: 'down' }, handR: { f: 'down' },
  legL_upper: { f: 'down', at: [-5, -30] }, legL_lower: { f: 'down' }, footL: { f: 'front' },
  legR_upper: { f: 'down', at: [5, -30] }, legR_lower: { f: 'down' }, footR: { f: 'front' },
};
export const POSES = {
  idle: { parts: idleParts, face: faceAt('front', false) },
  point: {
    parts: {
      ...idleParts,
      torso: { f: 'q3' }, collar: { f: 'q3' }, strings: { f: 'q3' }, pocket: { f: 'q3' }, pin: { f: 'q3' },
      head: { f: 'tilt' }, hair_back: { f: 'tilt' }, hair_front: { f: 'tilt' }, hair_curl: { f: 'tilt' },
      armR_upper: { f: 'raise', at: [15, -46] }, armR_lower: { f: 'point' }, handR: { f: 'point' },
      armL_upper: { f: 'bent', at: [-12, -46] }, armL_lower: { f: 'bent' }, handL: { f: 'down' },
      legR_upper: { f: 'out', at: [5, -30] }, legR_lower: { f: 'out' },
      footL: { f: 'q3' }, footR: { f: 'q3' },
    },
    face: faceAt('q3', true),
  },
};
export const EXPRESSIONS = {
  neutral: { eye: 'open', brow: 'flat', browDy: 0, mouth: 'line' },
  happy: { eye: 'arc', brow: 'arch', browDy: -2, mouth: 'smile' },
  surprised: { eye: 'wide', brow: 'arch', browDy: -4, mouth: 'o' },
  scared: { eye: 'scared', brow: 'tilt', browDy: -2, mouth: 'wobble' },
};
// pulled-apart offsets (relative to parent) used by the exploded rig view
const EXPLODE = {
  torso: [0, -2], head: [0, -9], collar: [0, -7], pocket: [0, 7], strings: [0, 3], pin: [9, -1],
  hair_back: [-7, -2], hair_front: [5, -6], hair_curl: [7, -10],
  eyeL: [-6, 0], eyeR: [6, 0], browL: [-6, -4], browR: [6, -4], mouth: [0, 6], blushL: [-7, 4], blushR: [7, 4],
  armL_upper: [-8, 0], armL_lower: [-2, 4], handL: [-1, 4], armR_upper: [8, 0], armR_lower: [2, 4], handR: [2, 4],
  legL_upper: [-5, 4], legL_lower: [-1, 4], footL: [-1, 4], legR_upper: [5, 4], legR_lower: [1, 4], footR: [1, 4],
};

// ---------------------------------------------------------------- public API
export function createCharacter(app, opts = {}) {
  const F = lib();
  const root = new Container(); root.label = 'root';
  const parts = { root }, sprites = {};
  for (const [name, parent, z, top] of NODES) {
    const node = new Container(); node.label = name; node.sortableChildren = true; node.zIndex = z;
    const spr = new Sprite(); spr.zIndex = top ? 10 : 0; spr.label = name + '_sprite';
    node.addChild(spr); parts[name] = node; sprites[name] = spr;
    parts[parent].addChild(node);
  }
  root.parts = parts; root.sprites = sprites; root.extra = {}; root.blink = 0;
  root.pose = 'idle'; root.expression = 'neutral';
  setPose(root, opts.pose || 'idle'); setExpression(root, opts.expression || 'neutral');
  return root;
}

function apply(ch) {
  const F = lib(), pose = POSES[ch.pose], ex = EXPRESSIONS[ch.expression];
  const abs = { root: [0, 0] }, frames = {};
  for (const [name, parent, , , chain] of NODES) {
    let spec = pose.parts[name], at = null;
    if (!spec) {
      const key = name.startsWith('eye') ? 'eye' : name.startsWith('brow') ? 'brow' : name === 'mouth' ? 'mouth' : 'blush';
      const f = key === 'eye' ? (ch.blink > 0.5 ? 'blink' : ex.eye) : key === 'brow' ? ex.brow : key === 'mouth' ? ex.mouth : 'on';
      spec = { f, at: pose.face[name] };
    }
    const frame = F[name][spec.f];
    const spr = ch.sprites[name];
    if (frame.tex) { spr.visible = true; spr.texture = frame.tex; spr.pivot.set(frame.px, frame.py); } else spr.visible = false;
    if (spec.at) at = spec.at;
    else if (chain) { const pn = frames[parent].next; at = [abs[parent][0] + pn[0], abs[parent][1] + pn[1]]; }
    else at = frame.pivot;
    abs[name] = at; frames[name] = frame;
    const ex2 = ch.extra[name] || [0, 0];
    const dy = (name === 'browL' || name === 'browR') ? ex.browDy : 0;
    ch.parts[name].position.set(Math.round(at[0] - abs[parent][0] + ex2[0]), Math.round(at[1] - abs[parent][1] + ex2[1] + dy));
  }
  ch.abs = abs;
}
export function setPose(ch, name) { if (!POSES[name]) throw new Error('unknown pose ' + name); ch.pose = name; apply(ch); }
export function setExpression(ch, name) { if (!EXPRESSIONS[name]) throw new Error('unknown expression ' + name); ch.expression = name; apply(ch); }
export function setBlink(ch, v) { ch.blink = v; apply(ch); }
export function explode(ch, k = 1) {
  ch.extra = {};
  for (const [n, [x, y]] of Object.entries(EXPLODE)) ch.extra[n] = [Math.round(x * k), Math.round(y * k)];
  apply(ch);
}
