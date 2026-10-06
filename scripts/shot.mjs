// Usage: node scripts/shot.mjs "<query>" out.png [width height] [waitMs]
// Takes a screenshot of the dev server (http://localhost:5199/?<query>) with headless Chromium.
import { chromium } from 'playwright';
const [q = '', out = 'shot.png', w = '412', h = '915', wait = '1500'] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(`http://localhost:5199/?${q}`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 }).catch(() => logs.push('TIMEOUT waiting for __ready'));
await page.waitForTimeout(+wait);
const info = await page.evaluate(() => { const s = window.__stage; return s ? { calls: s.renderer.info.render.calls, tris: s.renderer.info.render.triangles, objects: window.__count } : null; });
await page.screenshot({ path: out });
console.log(JSON.stringify(info), logs.slice(0, 15).join('\n'));
await browser.close();
