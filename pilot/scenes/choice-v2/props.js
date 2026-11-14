// Props: city street (dusk), bus stop, coral phone booth, teal vault, coins, coffee cup.
import { Container, Graphics } from 'pixi.js';
import { INK, TEAL, CORAL, YEL, CREAM, NAVY, hash, dots, rays, T, clamp, lerp, star4 } from './lib.js';

export const GY = 940; // street ground line (feet)

export function buildStreet(WW = 3500) {
  const c = new Container(), g = new Graphics();
  const bands = ['#2B2A6E', '#47348F', '#8E4A9E', '#D9568A', '#FF8C78', '#FFC27A'];
  const hz = 860, bh = hz / bands.length;
  bands.forEach((col, i) => g.rect(0, i * bh, WW, bh + 2).fill(col));
  for (let i = 1; i < bands.length; i++) dots(g, 0, i * bh - 46, WW, i * bh + 46, 15, (x, y) => 5.2 * (1 - Math.abs(y - i * bh) / 46) * (y < i * bh ? 1 : 0.0), bands[i]);
  for (let i = 1; i < bands.length; i++) dots(g, 0, i * bh, WW, i * bh + 46, 15, (x, y) => 5.2 * (1 - (y - i * bh) / 46), bands[i - 1]);
  // moon
  g.circle(1560, 190, 96).fill(CREAM).stroke({ width: 6, color: INK });
  dots(g, 1464, 94, 1656, 286, 12, (x, y) => (Math.hypot(x - 1560, y - 190) < 90 && x + y > 1760 ? 3.4 : 0), '#E9D6B0');
  // far + near skyline
  const skyline = (y0, hMin, hMax, colA, colB, seed, wMin, wMax, winSize, ink) => {
    let x = -40, i = 0;
    while (x < WW + 40) {
      const w = wMin + hash(seed + i) * (wMax - wMin), h = hMin + hash(seed * 3 + i) * (hMax - hMin);
      g.rect(x, y0 - h, w, h + 40).fill(i % 2 ? colA : colB);
      if (ink) g.rect(x, y0 - h, w, h + 40).stroke({ width: 6, color: INK, join: 'miter' });
      dots(g, x + w * 0.55, y0 - h, x + w, y0, 12, (xx, yy) => 3.6 * (xx - x - w * 0.55) / (w * 0.45), '#14193A');
      for (let wy = y0 - h + 34; wy < y0 - 50; wy += winSize * 1.9) for (let wx = x + 22; wx < x + w - winSize - 12; wx += winSize * 1.7) {
        const lit = hash(seed * 7 + i * 31 + Math.floor(wx) * 3 + Math.floor(wy)) > 0.55;
        g.rect(wx, wy, winSize, winSize * 1.25).fill(lit ? YEL : '#3A4A86');
        if (ink) g.rect(wx, wy, winSize, winSize * 1.25).stroke({ width: 3, color: INK });
      }
      x += w + (ink ? 0 : 8); i++;
    }
  };
  skyline(hz - 20, 160, 360, '#3A2E7A', '#4A3A94', 11, 120, 220, 16, false);
  skyline(hz, 250, 520, '#1A2142', '#26305A', 4, 170, 300, 24, true);
  // sidewalk
  g.rect(0, hz, WW, 1080 - hz + 200).fill('#8A86B8');
  g.rect(0, hz, WW, 34).fill('#C9C4E8'); g.rect(0, hz, WW, 34).stroke({ width: 6, color: INK, join: 'miter' });
  for (let x = -200; x < WW; x += 250) g.moveTo(x, hz + 34).lineTo(x - 110, 1200).stroke({ width: 5, color: '#5F5B8C' });
  g.moveTo(0, 1010).lineTo(WW, 1010).stroke({ width: 5, color: '#5F5B8C' });
  dots(g, 0, hz + 34, WW, 1080, 16, (x, y) => 3.8 * (1 - (y - hz - 34) / 120), '#6F6BA0');
  // street lamps (+ glow)
  for (const lx of [1480, 3000]) {
    g.circle(lx, 400, 210).fill({ color: '#FFD08A', alpha: 0.13 }); g.circle(lx, 400, 120).fill({ color: '#FFE9B0', alpha: 0.2 });
    g.rect(lx - 9, 400, 18, hz - 400 + 6).fill('#1E1B24');
    g.poly([lx - 52, 402, lx + 52, 402, lx + 34, 358, lx - 34, 358]).fill('#26305A').stroke({ width: 6, color: INK, join: 'round' });
    g.rect(lx - 34, 402, 68, 26).fill(YEL).stroke({ width: 5, color: INK });
  }
  c.addChild(g);
  return c;
}

export function buildBusStop(x) {
  const c = new Container(), g = new Graphics();
  // glass back panel
  g.rect(x - 230, 560, 460, 300).fill({ color: '#BFEFFF', alpha: 0.35 }).stroke({ width: 6, color: INK });
  g.moveTo(x - 80, 560).lineTo(x - 170, 860).moveTo(x + 40, 560).lineTo(x - 50, 860).stroke({ width: 8, color: '#FFFFFF', alpha: 0.5 });
  g.rect(x - 250, 520, 500, 40).fill(NAVY).stroke({ width: 6, color: INK });
  g.rect(x - 250, 560, 20, 300).fill(NAVY); g.rect(x + 230, 560, 20, 300).fill(NAVY);
  // pole + sign
  g.rect(x + 300 - 10, 380, 20, 480).fill('#C9C4E8').stroke({ width: 5, color: INK });
  g.circle(x + 300, 360, 62).fill(TEAL).stroke({ width: 7, color: INK });
  // bench
  g.rect(x - 170, 788, 340, 22).fill('#C98E25').stroke({ width: 5, color: INK });
  g.rect(x - 150, 810, 16, 50).fill(INK); g.rect(x + 134, 810, 16, 50).fill(INK);
  c.addChild(g); c.addChild(T('bus', 'BUS', 40, { x: x + 300, y: 360, fill: '#FFFFFF', stroke: INK, sw: 6, nokeep: true }));
  return c;
}

// ---------- phone booth ----------
const HW = 150, TOP = -450, BOT = -40, OUT = 174;
export function drawBooth(o = {}) {
  const open = o.open ?? 0, glow = o.glow ?? 0, paneA = o.paneAlpha ?? 0.9, ck = o.clockPulse ?? 0;
  const back = new Container(), front = new Container();
  const gb = new Graphics();
  gb.ellipse(10, 8, OUT + 40, 26).fill({ color: INK, alpha: 0.3 });             // ground shadow
  gb.rect(-HW, TOP, 2 * HW, BOT - TOP).fill('#2A1D45');
  const a = clamp(Math.max(open, glow));
  if (a > 0.02) {
    gb.rect(-HW, TOP, 2 * HW, BOT - TOP).fill({ color: '#FFC94A', alpha: 0.95 * a });
    gb.ellipse(0, -250, HW * 0.9, 210).fill({ color: '#FFF4C8', alpha: 0.85 * a });
    gb.ellipse(0, -250, HW * 0.55, 140).fill({ color: '#FFFFFF', alpha: 0.7 * a });
  }
  gb.roundRect(HW - 74, -300, 46, 90, 8).fill(YEL).stroke({ width: 5, color: INK }); // wall phone
  gb.circle(HW - 51, -270, 12).fill(INK);
  back.addChild(gb);
  const gf = new Graphics();
  gf.rect(-OUT, TOP - 30, 2 * OUT, BOT - TOP + 30).fill(CORAL); gf.rect(-HW, TOP, 2 * HW, BOT - TOP).cut();
  gf.rect(-OUT, TOP - 30, 2 * OUT, BOT - TOP + 30).stroke({ width: 7, color: INK, join: 'miter' });
  gf.rect(-HW, TOP, 2 * HW, BOT - TOP).stroke({ width: 6, color: INK, join: 'miter' });
  dots(gf, HW + 2, TOP - 30, OUT, BOT, 9, (x, y) => 3, '#D94545');
  gf.rect(-OUT - 10, BOT, 2 * OUT + 20, 40).fill('#D94545').stroke({ width: 7, color: INK, join: 'miter' });
  gf.poly([-OUT - 18, TOP - 30, OUT + 18, TOP - 30, OUT - 8, TOP - 76, -OUT + 8, TOP - 76]).fill('#E8484A').stroke({ width: 7, color: INK, join: 'miter' });
  gf.rect(-16, TOP - 100, 32, 30).fill('#D94545').stroke({ width: 5, color: INK });
  front.addChild(gf);
  const cy = TOP - 128, cr = 56 + ck * 6;
  const gc = new Graphics();
  gc.circle(8, cy + 10, cr + 8).fill(INK);
  gc.circle(0, cy, cr + 8).fill(INK); gc.circle(0, cy, cr).fill(CREAM);
  gc.circle(0, cy, cr - 8).stroke({ width: 4, color: '#C98E25' });
  for (let i = 0; i < 12; i++) { const an = i / 12 * 6.283; gc.moveTo(Math.cos(an) * (cr - 8), Math.sin(an) * (cr - 8) + cy).lineTo(Math.cos(an) * (cr - 16), Math.sin(an) * (cr - 16) + cy); }
  gc.stroke({ width: 4, color: INK });
  const ar = cr + 20, a0 = Math.PI * 0.95;
  gc.arc(0, cy, ar, a0, Math.PI * 2.0).stroke({ width: 10, color: TEAL, cap: 'round' });          // rewind arc
  const px = Math.cos(a0) * ar, py = cy + Math.sin(a0) * ar, dx = Math.sin(a0), dy = -Math.cos(a0), nx = Math.cos(a0), ny = Math.sin(a0);
  gc.poly([px + dx * 34, py + dy * 34, px + nx * 22, py + ny * 22, px - nx * 22, py - ny * 22]).fill(TEAL).stroke({ width: 4, color: INK, join: 'miter' });
  front.addChild(gc);
  front.addChild(T('clock', '\u221224\nSAAT', 27, { x: 0, y: cy + 2, fill: INK, ls: 0 }));
  // door leaf (hinged at left): coral ribs with real window holes
  const gl = new Graphics();
  const wf = 2 * HW * (1 - 0.88 * clamp(open, -0.2, 1.1)), mid = (TOP + BOT) / 2, Hh = BOT - TOP, pe = 0.11 * clamp(open, 0, 1.2);
  const pt = (u, v) => [-HW + wf * u, mid + (v - 0.5) * Hh * (1 + pe * u)];
  const quad = (u0, v0, u1, v1) => [...pt(u0, v0), ...pt(u1, v0), ...pt(u1, v1), ...pt(u0, v1)];
  const cols = [[0.1, 0.47], [0.53, 0.9]], rows = [[0.05, 0.31], [0.36, 0.64], [0.69, 0.95]];
  gl.poly(quad(0, 0, 1, 1)).fill(CORAL);
  for (const [u0, u1] of cols) for (const [v0, v1] of rows) gl.poly(quad(u0, v0, u1, v1)).cut();
  gl.poly(quad(0, 0, 1, 1)).stroke({ width: 6, color: INK, join: 'miter' });
  for (const [u0, u1] of cols) for (const [v0, v1] of rows) {
    gl.poly(quad(u0, v0, u1, v1)).fill({ color: '#A8E6FF', alpha: paneA }).stroke({ width: 4, color: INK, join: 'miter' });
    const p1 = pt(u0 + (u1 - u0) * 0.25, v1 - (v1 - v0) * 0.12), p2 = pt(u0 + (u1 - u0) * 0.62, v0 + (v1 - v0) * 0.14);
    gl.moveTo(p1[0], p1[1]).lineTo(p2[0], p2[1]).stroke({ width: 7, color: '#FFFFFF', alpha: 0.85, cap: 'round' });
  }
  const k = pt(0.92, 0.5); gl.circle(k[0] - 6, k[1], 9).fill(YEL).stroke({ width: 4, color: INK });
  front.addChild(gl);
  return { back, front, doorX: 0 };
}

// radial light burst from (cx,cy)
export function lightBurst(parent, cx, cy, R, alpha, rot = 0, color = '#FFF4C8') {
  const g = new Graphics(); g.circle(cx, cy, R * 0.5).fill({ color, alpha: 0.35 });
  rays(g, cx, cy, R, 14, color, 0.6, rot, 9, 60); g.alpha = alpha * 0.55;
  parent.addChild(g); return g;
}

// ---------- vault ----------
export function drawCoin(g, x, y, r, phase) {
  const sx = Math.max(0.12, Math.abs(Math.cos(phase)));
  g.ellipse(x + 3, y + 5, r * sx, r).fill(INK);
  g.ellipse(x, y, r * sx, r).fill(YEL).stroke({ width: 4, color: INK });
  if (sx > 0.4) g.ellipse(x, y, r * sx * 0.62, r * 0.62).stroke({ width: 3, color: '#C98E25' });
}
export function drawVault(o = {}) {
  const t = o.t ?? 0, c = new Container(), g = new Graphics();
  const rot = o.rot ?? 0;
  g.rect(-250, -280, 520, 580).fill(INK);                                   // shadow slab
  g.rect(-260, -290, 520, 580).fill('#1B8F85').stroke({ width: 9, color: INK, join: 'miter' });
  dots(g, -260, -290, 260, 290, 14, (x, y) => (x > 90 ? 3.6 * (x - 90) / 170 : 0) + (y > 210 ? 2.5 : 0), '#12665F');
  for (const [rx, ry] of [[-236, -266], [236, -266], [-236, 266], [236, 266]]) g.circle(rx, ry, 11).fill('#BFF5EE').stroke({ width: 4, color: INK });
  // hinges (left) + bolts (right)
  for (const hy of [-170, 90]) g.rect(-278, hy, 40, 80).fill('#BFF5EE').stroke({ width: 5, color: INK });
  for (const by of [-140, -40, 60]) g.rect(176, by, 96, 34).fill('#BFF5EE').stroke({ width: 5, color: INK });
  // door
  const cx = 0, cy = -50;
  g.circle(cx + 7, cy + 9, 214).fill(INK);
  g.circle(cx, cy, 212).fill(TEAL).stroke({ width: 9, color: INK });
  dots(g, -212, cy - 212, 212, cy + 212, 12, (x, y) => (Math.hypot(x, y - cy) < 204 && x + (y - cy) > 20 ? 1 + 3.8 * ((x + (y - cy)) / 400) : 0), '#16867C');
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.circle(Math.cos(a) * 186, cy + Math.sin(a) * 186, 11).fill('#E8FFFB').stroke({ width: 4, color: INK }); }
  g.circle(cx, cy, 150).fill('#7FE3D8').stroke({ width: 7, color: INK });
  g.circle(cx - 36, cy - 36, 100).fill({ color: '#FFFFFF', alpha: 0.22 });
  g.circle(cx, cy, 112).stroke({ width: 5, color: INK });
  // wheel
  for (let i = 0; i < 3; i++) { const a = rot + i * 2.0944; g.moveTo(cx, cy).lineTo(cx + Math.cos(a) * 118, cy + Math.sin(a) * 118).stroke({ width: 22, color: INK, cap: 'round' }); g.moveTo(cx, cy).lineTo(cx + Math.cos(a) * 118, cy + Math.sin(a) * 118).stroke({ width: 12, color: '#E8FFFB', cap: 'round' }); g.circle(cx + Math.cos(a) * 124, cy + Math.sin(a) * 124, 17).fill(YEL).stroke({ width: 5, color: INK }); }
  g.circle(cx, cy, 52).fill('#12665F').stroke({ width: 7, color: INK }); g.circle(cx, cy, 24).fill(YEL).stroke({ width: 5, color: INK });
  // plate
  g.rect(-170, 206, 350, 84).fill(INK); g.rect(-180, 196, 350, 84).fill(YEL).stroke({ width: 7, color: INK, join: 'miter' });
  g.rect(-170, 206, 330, 64).stroke({ width: 3, color: '#C98E25' });
  c.addChild(g);
  c.addChild(T('plate', '1.000.000 $', 44, { x: -5, y: 240, ls: 1 }));
  // coin stacks
  const gs = new Graphics();
  for (const [sx, n] of [[-252, 5], [242, 7]]) for (let i = 0; i < n; i++) drawCoin(gs, sx, 296 - i * 15, 46, 0);
  // floating coins + glints
  const fl = [[-330, -170, 0.0], [340, -100, 0.37], [-350, 60, 0.71], [330, 120, 0.15]];
  for (const [fx, fy, ph] of fl) drawCoin(gs, fx, fy + Math.sin(t * 2.4 + ph * 9) * 12, 30, t * 5.5 + ph * 12);
  const sp = [[-300, -250, 0.1], [300, -230, 0.45], [-150, -120, 0.7], [160, 150, 0.9], [-345, 180, 0.3], [345, 20, 0.6]];
  for (const [px, py, ph] of sp) {
    const k = Math.max(0, Math.sin(t * 4.2 + ph * 20)); if (k < 0.05) continue;
    star4(gs, px, py, 14 + 30 * k, 0); gs.fill({ color: '#FFFFFF' }); star4(gs, px, py, 14 + 30 * k, 0); gs.stroke({ width: 3, color: INK });
  }
  c.addChild(gs);
  return c;
}

// ---------- coffee cup ----------
export function buildCup() {
  const c = new Container(), g = new Graphics();
  const body = [-26, -34, 26, -34, 19, 38, -19, 38];
  g.poly(body.map((v, i) => v + (i % 2 ? 5 : 4))).fill(INK);
  g.poly(body).fill('#FFFFFF').stroke({ width: 7, color: INK, join: 'round' });
  g.poly([-24, -10, 24, -10, 21, 14, -21, 14]).fill(CORAL).stroke({ width: 4, color: INK, join: 'round' });
  g.roundRect(-31, -50, 62, 20, 8).fill('#8A5A3C').stroke({ width: 6, color: INK });
  g.moveTo(-14, 20).lineTo(-12, 34).stroke({ width: 5, color: '#D8D2C4', cap: 'round' });
  c.addChild(g); c._steam = new Graphics(); c.addChild(c._steam);
  return c;
}
