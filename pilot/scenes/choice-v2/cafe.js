// Cosy cafe interior (comic-pop): back layer (wall, windows, board), mid layer (floor, counter, lamps, plants), tables + chairs.
import { Container, Graphics } from 'pixi.js';
import { INK, TEAL, CORAL, YEL, CREAM, hash, dots, rays, T } from './lib.js';

export const FLOOR = 800, WW = 3200;

function windowArt(g, x0, y0, x1, y1) {
  const w = x1 - x0, h = y1 - y0;
  g.rect(x0, y0, w, h).fill('#9FE3F5');
  g.rect(x0, y0 + h * 0.55, w, h * 0.45).fill('#CDF3FA');
  g.circle(x0 + w * 0.78, y0 + h * 0.28, 52).fill('#FFE9A0').stroke({ width: 5, color: INK });
  let x = x0 + 10, i = 0;
  while (x < x1 - 30) { const bw = 50 + hash(i * 3 + x0) * 70, bh = 60 + hash(i + 7 + x0) * 150; g.rect(x, y1 - bh, Math.min(bw, x1 - x), bh).fill(i % 2 ? '#7B8CC4' : '#9AA7D6').stroke({ width: 4, color: INK }); x += bw + 6; i++; }
  for (const [cx, cy] of [[x0 + w * 0.25, y0 + h * 0.25], [x0 + w * 0.5, y0 + h * 0.4]]) { g.circle(cx, cy, 30).circle(cx + 28, cy + 8, 24).circle(cx - 28, cy + 8, 22).fill('#FFFFFF'); }
}

export function buildCafe() {
  const back = new Container(), mid = new Container();
  const g = new Graphics();
  g.rect(-300, -200, WW + 600, FLOOR + 200).fill('#FFD9A8');
  for (let x = -300; x < WW + 300; x += 120) g.rect(x, -200, 60, FLOOR + 200).fill({ color: '#F7C98F', alpha: 0.55 });
  dots(g, -300, -200, WW + 300, 280, 18, (x, y) => Math.max(0, 4.4 - (y + 200) / 100), '#E9A96B');
  // wainscot
  g.rect(-300, 580, WW + 600, FLOOR - 580).fill('#2A9D8F');
  for (let x = -280; x < WW + 300; x += 210) g.rect(x, 612, 170, 150).fill('#35B3A4').stroke({ width: 5, color: INK });
  dots(g, -300, 580, WW + 300, FLOOR, 14, (x, y) => (y - 580) / 60, '#23867A');
  g.rect(-300, 560, WW + 600, 26).fill(CREAM).stroke({ width: 6, color: INK });
  // big window
  g.rect(1226, 96, 748, 484).fill(INK);
  windowArt(g, 1240, 110, 1960, 570);
  g.moveTo(1600, 110).lineTo(1600, 570).moveTo(1240, 340).lineTo(1960, 340).stroke({ width: 12, color: INK });
  g.rect(1240, 110, 720, 460).stroke({ width: 14, color: INK, join: 'miter' });
  g.rect(1210, 570, 780, 22).fill('#B66E3C').stroke({ width: 6, color: INK });
  // round window
  g.circle(2790, 300, 132).fill(INK); g.circle(2790, 300, 118).fill('#9FE3F5');
  g.circle(2830, 260, 30).fill('#FFE9A0'); g.rect(2700, 340, 180, 70).fill('#7B8CC4');
  g.circle(2790, 300, 118).stroke({ width: 12, color: INK }); g.moveTo(2672, 300).lineTo(2908, 300).moveTo(2790, 182).lineTo(2790, 418).stroke({ width: 8, color: INK });
  // chalk board (left of table 1)
  g.rect(330, 150, 400, 330).fill('#B66E3C').stroke({ width: 7, color: INK });
  g.rect(348, 168, 364, 294).fill('#26305A').stroke({ width: 5, color: INK });
  back.addChild(g);
  back.addChild(T('cb1', 'GÜNÜN KAHVESİ', 40, { x: 530, y: 232, fill: '#FFFFFF', ls: 1, nokeep: true }));
  back.addChild(T('cb2', 'LATTE · FİLTRE', 30, { x: 530, y: 300, fill: YEL, ls: 1, nokeep: true }));
  back.addChild(T('cb3', 'TATLI · ÇAY', 30, { x: 530, y: 350, fill: '#7FE3D8', ls: 1, nokeep: true }));
  // shelves behind table 2
  const gs = new Graphics();
  for (const sy of [330, 470]) {
    gs.rect(1980 + 120, sy, 560, 18).fill('#B66E3C').stroke({ width: 5, color: INK });
    for (let i = 0; i < 6; i++) { const cx = 2130 + i * 85 + hash(i + sy) * 20; if (i % 3 === 2) { gs.roundRect(cx - 24, sy - 66, 48, 66, 8).fill(i % 2 ? CORAL : YEL).stroke({ width: 5, color: INK }); } else { gs.poly([cx - 24, sy - 46, cx + 24, sy - 46, cx + 18, sy, cx - 18, sy]).fill('#FFFFFF').stroke({ width: 5, color: INK }); gs.rect(cx - 24, sy - 46, 48, 12).fill(i % 2 ? TEAL : CORAL); } }
  }
  back.addChild(gs);

  // mid: floor, counter, lamps, plants
  const m = new Graphics();
  m.rect(-300, FLOOR, WW + 600, 700).fill('#C98A5A');
  for (let x = -300; x < WW + 300; x += 150) m.moveTo(x, FLOOR).lineTo(x - 90, 1300).stroke({ width: 4, color: '#A66C40' });
  m.moveTo(-300, 950).lineTo(WW + 300, 950).moveTo(-300, 1090).lineTo(WW + 300, 1090).stroke({ width: 4, color: '#A66C40' });
  dots(m, -300, FLOOR, WW + 300, 1100, 16, (x, y) => 4 * (1 - (y - FLOOR) / 220), '#B4784A');
  m.rect(-300, FLOOR - 4, WW + 600, 10).fill(INK);
  // counter
  m.rect(-200, 640, 700, 170).fill(TEAL).stroke({ width: 7, color: INK, join: 'miter' });
  for (let x = -170; x < 480; x += 130) m.rect(x, 668, 100, 110).fill('#7FE3D8').stroke({ width: 4, color: INK });
  m.rect(-220, 620, 740, 28).fill('#B66E3C').stroke({ width: 7, color: INK });
  // espresso machine
  m.rect(60, 500, 230, 120).fill('#D94545').stroke({ width: 6, color: INK, join: 'miter' }); m.rect(80, 520, 190, 36).fill(CREAM).stroke({ width: 4, color: INK });
  m.circle(120, 590, 12).fill(YEL).stroke({ width: 3, color: INK }); m.rect(200, 566, 50, 56).fill('#FFFFFF').stroke({ width: 4, color: INK });
  m.rect(360, 560, 40, 60).fill('#FFFFFF').stroke({ width: 4, color: INK }); m.rect(410, 540, 56, 80).fill(YEL).stroke({ width: 4, color: INK });
  // pendant lamps
  for (const lx of [880, 2230]) {
    m.moveTo(lx, -200).lineTo(lx, 120).stroke({ width: 5, color: INK });
    m.circle(lx, 210, 150).fill({ color: '#FFE9A0', alpha: 0.18 }); m.circle(lx, 200, 90).fill({ color: '#FFF4C8', alpha: 0.25 });
    m.poly([lx - 80, 190, lx + 80, 190, lx + 44, 120, lx - 44, 120]).fill(CORAL).stroke({ width: 6, color: INK, join: 'miter' });
    m.ellipse(lx, 192, 80, 12).fill(YEL).stroke({ width: 4, color: INK });
  }
  // plants
  for (const px of [1500, 2720]) {
    m.poly([px - 50, 700, px + 50, 700, px + 38, 800, px - 38, 800]).fill('#D94545').stroke({ width: 6, color: INK, join: 'miter' });
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.42, L = 120 + hash(i + px) * 70; m.poly([px, 700, px + Math.cos(a - 0.16) * L, 700 + Math.sin(a - 0.16) * L, px + Math.cos(a + 0.16) * L, 700 + Math.sin(a + 0.16) * L]).fill(i % 2 ? '#3DB86B' : '#2A9D5C').stroke({ width: 5, color: INK, join: 'round' }); }
  }
  mid.addChild(m);
  // window light shaft (drawn in mid, soft)
  const sh = new Graphics();
  sh.poly([1300, 590, 1600, 590, 1380, 960, 760, 960]).fill({ color: '#FFF1B8', alpha: 0.16 });
  sh.poly([1640, 590, 1930, 590, 2250, 960, 1700, 960]).fill({ color: '#FFF1B8', alpha: 0.13 });
  mid.addChild(sh);
  return { back, mid };
}

export function drawChair(x, dir = 1) {
  const g = new Graphics();
  g.roundRect(x - 90 * dir - 70, 420, 140, 330, 22).fill('#8A5A3C').stroke({ width: 7, color: INK });
  for (let i = 0; i < 3; i++) g.moveTo(x - 90 * dir - 54, 480 + i * 80).lineTo(x - 90 * dir + 54, 480 + i * 80).stroke({ width: 6, color: '#6B4229' });
  g.rect(x - 90 * dir - 54, 740, 20, 120).fill(INK); g.rect(x - 90 * dir + 34, 740, 20, 120).fill(INK);
  return g;
}
export function drawTable(x, w = 540) {
  const g = new Graphics(), top = 716;
  g.poly([x - w / 2 + 18, top + 20, x + w / 2 - 18, top + 20, x + w / 2 + 34, 990, x - w / 2 - 34, 990]).fill(CORAL).stroke({ width: 7, color: INK, join: 'miter' });
  dots(g, x - w / 2 - 34, top + 20, x + w / 2 + 34, 990, 22, (xx, yy) => ((xx - x) / w > 0.1 ? 3.5 : 0) + 1.6, '#E04848');
  for (let i = 0; i < 6; i++) g.moveTo(x - w / 2 + 40 + i * (w - 80) / 5, top + 70).lineTo(x - w / 2 + 30 + i * (w - 60) / 5 - 10, 980).stroke({ width: 5, color: '#FFFFFF', alpha: 0.6 });
  g.roundRect(x - w / 2, top - 6, w, 40, 14).fill('#B66E3C').stroke({ width: 7, color: INK });
  g.rect(x - w / 2 + 20, top + 2, w - 40, 8).fill({ color: '#FFFFFF', alpha: 0.35 });
  return g;
}
