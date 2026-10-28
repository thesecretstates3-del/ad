// Deterministic timeline: everything on screen is a pure function of t (seconds),
// so the same code drives live playback and frame-by-frame video export.
(() => {
  const G = window.GEO;
  const eras = G.eras;
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };

  // ---- timing ----
  const INTRO = 2.0, TRANS = 1.5, HOLD = 3.4, OUTRO = 3.5;
  const SEG = TRANS + HOLD;
  const DURATION = INTRO + HOLD + (eras.length - 1) * SEG + OUTRO;

  // Era i settles at INTRO + HOLD + (i-1)*SEG + TRANS; transition into i starts TRANS earlier.
  function locate(t) {
    if (t < INTRO + HOLD) return { i: 0, p: 1, hold: Math.max(0, t - INTRO) / HOLD };
    const k = (t - INTRO - HOLD) / SEG;
    const i = Math.min(eras.length - 1, Math.floor(k) + 1);
    const local = t - INTRO - HOLD - (i - 1) * SEG;
    if (i === eras.length - 1 && local > SEG) return { i, p: 1, hold: 1 };
    if (local < TRANS) return { i, p: local / TRANS, hold: 0 };
    return { i, p: 1, hold: (local - TRANS) / HOLD };
  }

  // ---- easing & helpers ----
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const easeInOut = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  const easeOutBack = p => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
  const easeOutElastic = p => p === 0 ? 0 : p === 1 ? 1 : Math.pow(2, -9 * p) * Math.sin((p * 10 - .75) * 2.1) + 1;
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, p) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], p))).join(',')})`; };
  const shade = (c, f) => `rgb(${hex(c).map(v => Math.round(v * f)).join(',')})`;
  const ringPath = r => 'M' + r.map(p => p[0] + ',' + p[1]).join('L') + 'Z';
  const ringsPath = rs => rs.map(ringPath).join('');

  // ---- static layers ----
  $('land').setAttribute('d', G.land);
  $('borders').setAttribute('d', G.borders);
  for (const s of G.seaLabels) el('text', { x: s.x, y: s.y }, $('seaLabels')).textContent = s.text.toUpperCase();

  // Main-shape morphs: largest ring of era i-1 into largest ring of era i.
  const morphs = eras.map((e, i) => i === 0 ? null :
    flubber.interpolate(eras[i - 1].rings[0], e.rings[0], { maxSegmentLength: 6 }));
  const extras = eras.map(e => ringsPath(e.rings.slice(1)));

  // ---- year label ----
  const fmtYear = y => y < 0 ? `${-y} BC` : y < 1000 ? `${Math.max(1, y)} AD` : `${y}`;

  // ---- timeline ticks ----
  const span = [eras[0].year, eras[eras.length - 1].year];
  // Compress the long future span so history keeps most of the bar.
  const tickX = i => 1400 * i / (eras.length - 1);
  const ticks = eras.map((e, i) => el('circle', { cx: tickX(i), cy: 0, r: 7 }, $('ticks')));

  // ---- faces ----
  // Mood → lid coverage, lid tilt (deg, + = inner corner down), brow lift/angle, pupil size, eye scale.
  const MOODS = {
    neutral:   { up: .14, low: 0,   tilt: 0,   browY: 1.5,  brow: 0,   pupil: .5,  size: 1 },
    happy:     { up: .06, low: .26, tilt: -4,  browY: 1.65, brow: -10, pupil: .52, size: 1 },
    proud:     { up: .42, low: .14, tilt: -6,  browY: 1.45, brow: 8,   pupil: .46, size: 1 },
    angry:     { up: .36, low: .06, tilt: 24,  browY: 1.18, brow: 26,  pupil: .42, size: 1 },
    sad:       { up: .3,  low: 0,   tilt: -20, browY: 1.55, brow: -24, pupil: .56, size: .97 },
    surprised: { up: 0,   low: 0,   tilt: 0,   browY: 1.9,  brow: -4,  pupil: .3,  size: 1.14 },
    sleepy:    { up: .56, low: .1,  tilt: -4,  browY: 1.38, brow: -4,  pupil: .5,  size: 1 },
  };
  const moodMix = (a, b, p) => {
    const A = MOODS[a], B = MOODS[b], o = {};
    for (const k in A) o[k] = lerp(A[k], B[k], p);
    return o;
  };

  let clipSeq = 0;
  function makeFace(parent) {
    const g = el('g', {}, parent);
    const eyes = [-1, 1].map(side => {
      const id = 'eyeclip' + (clipSeq++);
      const eg = el('g', {}, g);
      const clip = el('clipPath', { id }, eg);
      const clipShape = el('ellipse', {}, clip);
      const sclera = el('ellipse', { fill: '#fff' }, eg);
      const inner = el('g', { 'clip-path': `url(#${id})` }, eg);
      const pupil = el('circle', { fill: '#141414' }, inner);
      const glint = el('circle', { fill: '#fff' }, inner);
      const upper = el('path', {}, inner);
      const lower = el('path', {}, inner);
      const outline = el('ellipse', { fill: 'none', stroke: '#141414' }, eg);
      const brow = el('line', { stroke: '#141414', 'stroke-linecap': 'round' }, eg);
      return { side, eg, clipShape, sclera, pupil, glint, upper, lower, outline, brow };
    });
    return { g, eyes };
  }

  // f: {x, y, R, mood, look:[dx,dy], blink, squash, skin, opacity}
  function drawFace(face, f) {
    face.g.setAttribute('opacity', f.opacity);
    face.g.setAttribute('transform', `translate(${f.x} ${f.y}) scale(${1 / f.squash} ${f.squash})`);
    const m = f.mood, R = f.R * m.size;
    const rx = R, ry = R * 1.18, sep = f.R * 1.22;
    for (const e of face.eyes) {
      const s = e.side;
      e.eg.setAttribute('transform', `translate(${s * sep} 0)`);
      for (const n of [e.clipShape, e.sclera, e.outline]) {
        n.setAttribute('rx', rx); n.setAttribute('ry', ry);
      }
      e.outline.setAttribute('stroke-width', R * .13);
      // pupils: look vector, a touch cross-eyed toward center for warmth
      const pr = R * m.pupil;
      const lx = clamp(f.look[0], -1, 1), ly = clamp(f.look[1], -1, 1);
      const px = lx * (rx - pr * .9) - s * R * .04, py = ly * (ry - pr * .9) + R * .05;
      e.pupil.setAttribute('cx', px); e.pupil.setAttribute('cy', py); e.pupil.setAttribute('r', pr);
      e.glint.setAttribute('cx', px + pr * .35); e.glint.setAttribute('cy', py - pr * .38); e.glint.setAttribute('r', pr * .28);
      // lids (skin colored), blink closes the upper lid fully
      const up = lerp(m.up, 1.04, f.blink), low = m.low * (1 - f.blink * .3);
      const yUp = -ry + 2 * ry * up;
      const tan = Math.tan(m.tilt * Math.PI / 180);
      const ly1 = x => yUp + tan * (x * -s);
      const W = rx * 2.2;
      e.upper.setAttribute('d', `M${-W},${-ry * 2}L${W},${-ry * 2}L${W},${ly1(W)}L${-W},${ly1(-W)}Z`);
      const yLow = ry - 2 * ry * low;
      e.lower.setAttribute('d', `M${-W},${ry * 2}L${W},${ry * 2}L${W},${yLow}Q0,${yLow - ry * low * 1.6} ${-W},${yLow}Z`);
      e.upper.setAttribute('fill', f.skin); e.lower.setAttribute('fill', f.skin);
      e.upper.setAttribute('stroke', '#141414'); e.lower.setAttribute('stroke', '#141414');
      e.upper.setAttribute('stroke-width', up > .02 ? R * .1 : 0);
      e.lower.setAttribute('stroke-width', low > .02 ? R * .1 : 0);
      // brow
      const a = m.brow * Math.PI / 180, L = R * .95, cy = -ry - R * (m.browY - 1.18) - R * .28;
      e.brow.setAttribute('x1', -s * L * Math.cos(a)); e.brow.setAttribute('y1', cy + L * Math.sin(a) * .9);
      e.brow.setAttribute('x2', s * L * Math.cos(a));  e.brow.setAttribute('y2', cy - L * Math.sin(a) * .9);
      e.brow.setAttribute('stroke-width', R * .3);
    }
  }

  const eyeSize = r => clamp(r * .2, 12, 34);

  // Pupils drift between seeded targets while holding.
  function wander(seed, t) {
    const step = 1.3, k = Math.floor(t / step), p = easeInOut(clamp((t / step - k) / .35));
    const at = j => [hash(seed * 31 + j) * 1.6 - .8, hash(seed * 57 + j) * 1.2 - .6];
    const a = at(k), b = at(k + 1);
    return [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];
  }
  function blinkAt(seed, t) {
    // a blink roughly every 2.4–3.6 s, 0.2 s long, sometimes doubled
    const period = 2.4 + hash(seed) * 1.2, k = Math.floor(t / period), local = t - k * period;
    const start = .4 + hash(seed + k) * (period - .8);
    const d = local - start;
    const one = d => d > 0 && d < .2 ? Math.sin(Math.PI * d / .2) : 0;
    return Math.max(one(d), hash(seed * 3 + k) > .7 ? one(d - .28) : 0);
  }

  const mainFace = makeFace($('faces'));
  const otherFaces = {}; // name -> {face, path}

  // ---- camera ----
  function cameraFor(e) {
    let [x0, y0, x1, y1] = e.bbox;
    for (const o of e.others) {
      x0 = Math.min(x0, o.bbox[0]); y0 = Math.min(y0, o.bbox[1]);
      x1 = Math.max(x1, o.bbox[2]); y1 = Math.max(y1, o.bbox[3]);
    }
    const area = { x0: 160, y0: 330, x1: 1760, y1: 960 };
    const s = clamp(Math.min((area.x1 - area.x0) / (x1 - x0), (area.y1 - area.y0) / (y1 - y0)), .9, 2.4);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return { s, x: (area.x0 + area.x1) / 2 - cx * s, y: (area.y0 + area.y1) / 2 - cy * s };
  }
  const cams = eras.map(cameraFor);

  // ---- render ----
  let lastYearText = '';
  function render(t) {
    t = clamp(t, 0, DURATION);
    const { i, p, hold } = locate(t);
    const prev = eras[Math.max(0, i - 1)], cur = eras[i];
    const ep = easeInOut(p);
    const inTrans = p < 1;

    // camera: ease between framings, breathe out mid-transition, slow push while holding
    const ca = cams[Math.max(0, i - 1)], cb = cams[i];
    const intro = clamp(t / INTRO);
    let s = lerp(ca.s, cb.s, ep) * (1 - .1 * Math.sin(Math.PI * p) * (inTrans ? 1 : 0)) * (1 + .035 * hold);
    s *= lerp(.82, 1, easeInOut(intro));
    const fx = 960, fy = 620;
    const bx = lerp(ca.x, cb.x, ep), by = lerp(ca.y, cb.y, ep), bs = lerp(ca.s, cb.s, ep);
    // scale about the framing center so the push-in stays centered
    const cx = (fx - bx) / bs, cy = (fy - by) / bs;
    $('camera').setAttribute('transform', `translate(${fx - cx * s} ${fy - cy * s}) scale(${s})`);

    $('seaLabels').setAttribute('opacity', clamp((1.45 - s) / .3));

    // main territory
    const color = inTrans ? mix(prev.color, cur.color, ep) : mix(cur.color, cur.color, 0);
    const d = i > 0 && inTrans ? morphs[i](ep) : ringPath(cur.rings[0]);
    const stroke = shade(cur.color, .55);
    for (const id of ['mainShape', 'mainExtraA', 'mainExtraB']) {
      const n = $(id);
      n.setAttribute('fill', color);
      n.setAttribute('stroke', inTrans ? shade(prev.color, .55) : stroke);
      n.setAttribute('stroke-width', 3 / s * 1.6);
    }
    $('mainShape').setAttribute('d', d);
    $('mainShine').setAttribute('d', d);
    $('mainExtraA').setAttribute('d', extras[Math.max(0, i - 1)]);
    $('mainExtraA').setAttribute('opacity', inTrans ? 1 - ep : 0);
    $('mainExtraB').setAttribute('d', extras[i]);
    $('mainExtraB').setAttribute('opacity', inTrans ? ep : 1);
    $('main').setAttribute('opacity', easeInOut(clamp((t - .3) / 1.2)));

    // arrival ripple from the face
    const rp = inTrans ? -1 : clamp(hold * HOLD / .9);
    const rip = $('ripple');
    if (rp >= 0 && rp < 1 && i > 0) {
      rip.setAttribute('cx', cur.face.x); rip.setAttribute('cy', cur.face.y);
      rip.setAttribute('r', cur.face.r * (.4 + 1.4 * easeInOut(rp)));
      rip.setAttribute('stroke-width', 6 / s * (1 - rp));
      rip.setAttribute('opacity', .7 * (1 - rp));
    } else rip.setAttribute('opacity', 0);

    // others (e.g. Pakistan, Bangladesh after 1947): crossfade by name
    const names = new Set([...prev.others, ...cur.others].map(o => o.name));
    for (const name in otherFaces) if (!names.has(name)) {
      otherFaces[name].path.setAttribute('opacity', 0);
      otherFaces[name].face.g.setAttribute('opacity', 0);
    }
    for (const name of names) {
      const a = prev.others.find(o => o.name === name), b = cur.others.find(o => o.name === name);
      const o = b || a;
      if (!otherFaces[name]) {
        const path = el('path', { 'stroke-linejoin': 'round', filter: 'url(#shadow)' }, $('others'));
        otherFaces[name] = { path, face: makeFace($('faces')) };
      }
      const of = otherFaces[name];
      const op = !inTrans ? (b ? 1 : 0) : a && b ? 1 : b ? ep : 1 - ep;
      const pop = b && !a ? easeOutBack(clamp(p * 1.4 - .4)) : 1;
      of.path.setAttribute('d', ringsPath(o.rings));
      of.path.setAttribute('fill', o.color);
      of.path.setAttribute('stroke', shade(o.color, .55));
      of.path.setAttribute('stroke-width', 3 / s * 1.6);
      of.path.setAttribute('opacity', op);
      const look = [clamp((cur.face.x - o.face.x) / 150), clamp((cur.face.y - o.face.y) / 150)];
      const moodA = a ? a.mood : o.mood, moodB = b ? b.mood : o.mood;
      drawFace(of.face, {
        x: o.face.x, y: o.face.y, R: Math.max(16, eyeSize(o.face.r)) * pop, mood: moodMix(moodA, moodB, ep),
        look, blink: blinkAt(name.length * 7.3, t), squash: 1, skin: o.color, opacity: op,
      });
    }

    // main face: glides to the new center, looks up at the counter while years roll
    const fxw = lerp(prev.face.x, cur.face.x, ep), fyw = lerp(prev.face.y, cur.face.y, ep);
    const R = lerp(eyeSize(prev.face.r), eyeSize(cur.face.r), ep);
    let look = wander(i + 1, t);
    if (cur.others.length && !inTrans) {
      const o = cur.others[0];
      const toward = [clamp((o.face.x - cur.face.x) / 200), clamp((o.face.y - cur.face.y) / 200)];
      look = hold < .5 ? toward : look;
    }
    const lookUp = inTrans ? Math.sin(Math.PI * p) : 0;
    look = [lerp(look[0], 0, lookUp), lerp(look[1], -1, lookUp)];
    const arrive = inTrans ? 0 : clamp(hold * HOLD / .7);
    const squash = inTrans ? 1 - .12 * Math.sin(Math.PI * p) : arrive < 1 ? lerp(.88, 1, easeOutElastic(arrive)) : 1;
    drawFace(mainFace, {
      x: fxw, y: fyw, R, mood: moodMix(prev.mood, cur.mood, ep),
      look, blink: inTrans ? 0 : blinkAt(i + 11, t), squash,
      skin: color, opacity: easeInOut(clamp((t - .8) / .8)),
    });

    // year counter rolls through the gap, then punches on arrival
    const y = Math.round(lerp(prev.year, cur.year, easeInOut(p)));
    const yText = fmtYear(i === 0 ? cur.year : y);
    if (yText !== lastYearText) { $('year').textContent = yText; lastYearText = yText; }
    const punch = inTrans ? 1 + .04 * Math.sin(Math.PI * p) : 1 + .12 * (1 - easeOutElastic(clamp(hold * HOLD / .6)));
    $('yearGroup').setAttribute('transform', `translate(960 150) scale(${punch})`);
    $('yearGroup').setAttribute('opacity', easeInOut(clamp((t - .5) / .8)));

    // era name: old slides up and out, new slides in from below
    const showing = p < .5 ? prev : cur;
    const np = p < .5 ? easeInOut(1 - p * 2) : easeInOut((p - .5) * 2);
    const nameText = $('name');
    if (nameText.textContent !== showing.name) nameText.textContent = showing.name;
    const w = Math.max(260, showing.name.length * 21 + 70);
    const pill = $('namePill');
    pill.setAttribute('x', -w / 2); pill.setAttribute('width', w);
    pill.setAttribute('fill', shade(showing.color, .7));
    pill.setAttribute('stroke', '#fff'); pill.setAttribute('stroke-opacity', .8); pill.setAttribute('stroke-width', 3);
    const off = p < .5 ? -24 * (1 - np) : 24 * (1 - np);
    $('nameGroup').setAttribute('transform', `translate(960 ${238 + off})`);
    $('nameGroup').setAttribute('opacity', np * easeInOut(clamp((t - .9) / .8)));

    $('fiction').setAttribute('opacity', (cur.future ? (inTrans && !prev.future ? ep : 1) : 0) * np);

    // timeline
    const prog = lerp(tickX(Math.max(0, i - 1)), tickX(i), ep);
    $('progress').setAttribute('width', prog);
    ticks.forEach((c, k) => {
      const reached = tickX(k) <= prog + .5;
      c.setAttribute('fill', reached ? (eras[k].future ? '#ffd75e' : '#ffd166') : '#2a4a66');
      c.setAttribute('stroke', '#0a1a2a'); c.setAttribute('stroke-width', 3);
      c.setAttribute('r', k === i && !inTrans ? 7 + 4 * (1 - easeOutElastic(clamp(hold * HOLD / .6))) + 2 : 7);
    });
    $('timeline').setAttribute('opacity', easeInOut(clamp((t - 1) / .8)));

    // fade in / out
    const out = clamp((t - (DURATION - 1.2)) / 1.2);
    $('fade').setAttribute('opacity', Math.max(1 - easeInOut(clamp(t / .9)), out));
  }

  window.DURATION = DURATION;
  window.renderAt = render;

  if (new URLSearchParams(location.search).has('render')) {
    document.body.classList.add('render');
    render(0);
    return;
  }

  // ---- live playback ----
  let playing = true, t0 = performance.now(), offset = 0;
  const now = () => playing ? offset + (performance.now() - t0) / 1000 : offset;
  const btn = $('play'), scrub = $('scrub'), clock = $('clock');
  const setT = t => { offset = clamp(t, 0, DURATION); t0 = performance.now(); };
  btn.onclick = () => { setT(now()); playing = !playing; btn.textContent = playing ? 'Pause' : 'Play'; };
  scrub.oninput = () => setT(scrub.value / 1000 * DURATION);
  addEventListener('keydown', e => {
    if (e.code === 'Space') btn.onclick();
    if (e.code === 'ArrowRight') setT(now() + SEG);
    if (e.code === 'ArrowLeft') setT(now() - SEG);
  });
  (function loop() {
    let t = now();
    if (t >= DURATION) setT(0), t = 0;
    render(t);
    scrub.value = t / DURATION * 1000;
    clock.textContent = `${t.toFixed(1)}s / ${DURATION.toFixed(0)}s`;
    requestAnimationFrame(loop);
  })();
})();
