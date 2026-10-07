// Usage: node scripts/shot.mjs "<query>" out.png [width height] [waitMs]   (PROFILE=1 → mesh counts per type)
// Screenshot of the dev server (http://localhost:5199/?<query>). Safe runner: see browser.mjs.
import { withBrowser, openApp } from './browser.mjs';

const [q = '', out = 'shot.png', w = '412', h = '915', wait = '1500'] = process.argv.slice(2);

await withBrowser(async (browser) => {
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  const logs = await openApp(page, q);
  await page.waitForTimeout(+wait);
  const info = await page.evaluate(() => {
    const s = window.__stage; if (!s) return null;
    const r = s.renderer; r.info.autoReset = false; r.info.reset();
    r.render(s.scene, s.camera);
    const res = { calls: r.info.render.calls, tris: r.info.render.triangles, selectables: window.__count };
    r.info.autoReset = true; return res;
  }).catch(() => null);
  if (process.env.PROFILE) {
    const prof = await page.evaluate(() => {
      const agg = {};
      window.__stage.scene.traverseVisible((o) => {
        if (!o.isMesh && !o.isInstancedMesh && !o.isPoints) return;
        let p = o; while (p && !p.userData.info) p = p.parent;
        const k = p ? p.userData.info.key : 'none';
        agg[k] = (agg[k] || 0) + 1;
      });
      return Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 25);
    });
    console.log(prof.map(([k, v]) => `${k}:${v}`).join(' '));
  }
  await page.screenshot({ path: out, timeout: 60_000 });
  console.log(JSON.stringify(info), logs.slice(0, 15).join('\n'));
});
