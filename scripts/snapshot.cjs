// Usage: node scripts/snapshot.cjs <outDir> <t1> <t2> ...  — renders stills at given seconds.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [out, ...times] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('pageerror', e.message));
  await page.goto('file://' + path.resolve(__dirname, '../src/index.html') + '?render');
  console.log('duration', await page.evaluate(() => window.DURATION));
  for (const t of times) {
    await page.evaluate(t => window.renderAt(t), +t);
    await page.screenshot({ path: `${out}/t${t}.png` });
  }
  await browser.close();
})();
