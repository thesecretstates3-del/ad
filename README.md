# Evolution of India — map animation

A map animation that runs from 3000 BC to the year 10000: a territory with cartoon eyes morphs from era to era, the camera follows it, and the year counter rolls between dates.

- `scripts/eras.mjs`: the eras (year, name, color, eye mood, approximate borders)
- `scripts/build-geo.mjs`: Natural Earth data → `src/geo-data.js` (real coastlines, empire borders clipped to land)
- `src/index.html` + `src/animation.js`: the animation; every frame is a function of `t`
- `scripts/render-video.cjs`: Playwright + ffmpeg → `out/evolution-of-india.mp4`

## Running locally

Requirements: [Node.js](https://nodejs.org) 18+, [Git](https://git-scm.com), and [ffmpeg](https://ffmpeg.org) on PATH (only for video export; on Windows `winget install ffmpeg`, on macOS `brew install ffmpeg`).

```bash
git clone https://github.com/thesecretstates3-del/ad.git
cd ad
git checkout ccr-cdd15618-68zz3r
npm install
npx playwright install chromium   # one-time, for video export
```

```bash
# live preview: open src/index.html in a browser (space = pause, ←/→ = jump one era)
npm run build                     # after editing scripts/eras.mjs
npm run render                    # out/evolution-of-india.mp4, 1920x1080 30fps
npm run snapshot -- out 10 40     # stills at given seconds
```

Borders before 1858 are approximate; everything after 2026 is fiction.
