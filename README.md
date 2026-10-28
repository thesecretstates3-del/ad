# Evolution of India — map animation

A map animation that runs from 3000 BC to the year 10000: a territory with cartoon eyes morphs from era to era, the camera follows it, and the year counter rolls between dates.

- `scripts/eras.mjs`: the eras (year, name, color, eye mood, approximate borders)
- `scripts/build-geo.mjs`: Natural Earth data → `src/geo-data.js` (real coastlines, empire borders clipped to land)
- `src/index.html` + `src/animation.js`: the animation; every frame is a function of `t`
- `scripts/render-video.cjs`: Playwright + ffmpeg → `out/evolution-of-india.mp4`

```bash
npm install
node scripts/build-geo.mjs            # after editing eras.mjs
open src/index.html                   # live preview (space = pause, ←/→ = jump one era)
node scripts/render-video.cjs 30      # 1920x1080 30fps MP4
node scripts/snapshot.cjs <dir> 10 40 # stills at given seconds
```

Borders before 1858 are approximate; everything after 2026 is fiction.
