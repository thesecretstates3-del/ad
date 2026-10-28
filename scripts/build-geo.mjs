// Projects Natural Earth data and the era outlines into screen space and
// writes src/geo-data.js for the animation page.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { geoMercator, geoPath } from 'd3-geo';
import { feature, merge } from 'topojson-client';
import pc from 'polygon-clipping';
import polylabel from 'polylabel';
import { ERAS, LAND } from './eras.mjs';

const require = createRequire(import.meta.url);
const world = require('world-atlas/countries-50m.json');
const W = 1920, H = 1080;

const geoms = world.objects.countries.geometries;
const byName = Object.fromEntries(feature(world, world.objects.countries).features.map(f => [f.properties.name, f]));
const mergeNames = names => merge(world, geoms.filter(g => names.includes(g.properties.name)));

// Frame lon 56..104, lat 2..41 into the base view.
const projection = geoMercator().fitExtent([[0, 0], [W, H]], {
  type: 'MultiPoint', coordinates: [[56, 2], [104, 2], [104, 41], [56, 41]],
});
const path = geoPath(projection);
const r1 = n => Math.round(n * 10) / 10;

// Chaikin corner cutting so hand-drawn inland borders read as organic.
function smooth(ring, iterations = 3) {
  let pts = ring;
  for (let k = 0; k < iterations; k++) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      out.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]]);
      out.push([0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
    }
    pts = out;
  }
  return pts;
}
const close = r => [...r, r[0]];

// Hand-drawn outlines are smooth curves; real frontiers wiggle. Densify the
// outline and push points sideways with deterministic multi-octave noise.
const hash = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const vnoise = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i) * (1 - u) + hash(i + 1) * u - .5; };
function roughen(ring, seed, amp = .55) {
  const dense = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / .12));
    for (let k = 0; k < n; k++) dense.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
  }
  let dist = 0;
  return dense.map((p, i) => {
    const q = dense[(i + 1) % dense.length], o = dense[(i - 1 + dense.length) % dense.length];
    dist += Math.hypot(q[0] - p[0], q[1] - p[1]);
    let tx = q[0] - o[0], ty = q[1] - o[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const d = amp * (vnoise(seed + dist / 1.6) * .9 + vnoise(seed * 3 + dist / .5) * .45 + vnoise(seed * 7 + dist / .18) * .2);
    return [p[0] - ty * d, p[1] + tx * d];
  });
}

const landMulti = mergeNames(LAND).coordinates;

function eraGeometry(def) {
  let g;
  if (def.countries) g = mergeNames(def.countries).coordinates;
  else g = pc.intersection(landMulti, [[close(smooth(roughen(smooth(def.poly, 2), def.year + 5000), 1))]]);
  if (def.extra) g = pc.union(g, ...def.extra.map(p => [[close(smooth(p, 2))]]));
  if (def.cut) g = pc.difference(g, ...def.cut.map(p => [[close(smooth(p, 2))]]));
  return g;
}

// Project to screen rings, drop specks, sort largest first.
function projectMulti(multi, minArea = 6) {
  const rings = [];
  for (const poly of multi) {
    const outer = poly[0].map(c => projection(c)).map(([x, y]) => [r1(x), r1(y)]);
    outer.pop();
    let a = 0;
    for (let i = 0; i < outer.length; i++) {
      const p = outer[i], q = outer[(i + 1) % outer.length];
      a += p[0] * q[1] - q[0] * p[1];
    }
    if (Math.abs(a / 2) >= minArea) rings.push({ pts: outer, area: Math.abs(a / 2) });
  }
  rings.sort((p, q) => q.area - p.area);
  return rings.map(r => r.pts);
}

function bbox(rings) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const r of rings) for (const [x, y] of r) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return [r1(x0), r1(y0), r1(x1), r1(y1)];
}

function face(rings) {
  const [x, y] = polylabel([rings[0]], 0.5);
  const r = polylabel([rings[0]], 0.5).distance;
  return { x: r1(x), y: r1(y), r: r1(r) };
}

const entity = (def, multi) => {
  const rings = projectMulti(multi);
  return { name: def.name, color: def.color, mood: def.mood, rings, bbox: bbox(rings), face: face(rings) };
};

const eras = ERAS.map(def => ({
  year: def.year, future: !!def.future,
  ...entity(def, eraGeometry(def)),
  others: (def.others || []).map(o => entity(o, mergeNames(o.countries).coordinates)),
}));

// Background: the wider region as land, plus faint modern borders.
const bgNames = ['India', 'Pakistan', 'Bangladesh', 'Nepal', 'Bhutan', 'Sri Lanka', 'Afghanistan', 'Myanmar',
  'China', 'Iran', 'Tajikistan', 'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan', 'Kazakhstan', 'Oman',
  'United Arab Emirates', 'Thailand', 'Laos', 'Maldives', 'Mongolia', 'Vietnam', 'Cambodia', 'Malaysia',
  'Indonesia', 'Saudi Arabia', 'Qatar', 'Iraq', 'Azerbaijan', 'Russia', 'Yemen', 'Kuwait', 'Bahrain'];
const bgLand = path(mergeNames(bgNames.filter(n => byName[n])));
const bgBorders = bgNames.filter(n => byName[n]).map(n => path(byName[n])).join('');

const r = s => s.replace(/(\d+\.\d)\d+/g, '$1');
const seaLabels = [['Arabian Sea', 64.5, 15], ['Bay of Bengal', 88.5, 15], ['Indian Ocean', 80, 4.5]]
  .map(([text, lon, lat]) => { const [x, y] = projection([lon, lat]); return { text, x: r1(x), y: r1(y) }; });
const data = { W, H, land: r(bgLand), borders: r(bgBorders), seaLabels, eras };
writeFileSync(new URL('../src/geo-data.js', import.meta.url), `window.GEO = ${JSON.stringify(data)};\n`);
console.log(eras.map(e => `${e.year} ${e.name}: rings=${e.rings.length} pts=${e.rings[0]?.length} face=${JSON.stringify(e.face)}`).join('\n'));
