// Usage: node scripts/interact.mjs <typeKey> [<typeKey> …]
// Mobile emulation: taps the first on-screen instance of each type, checks selection + info card,
// then tests the catalog, focus and follow buttons. Safe runner: see browser.mjs.
import { withBrowser, openApp } from './browser.mjs';

const keys = process.argv.slice(2);

await withBrowser(async (browser) => {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const logs = await openApp(page);
  await page.waitForTimeout(1000);
  for (const key of keys) {
    const pt = await page.evaluate((key) => {
      const s = window.__stage; const V = s.camera.position.constructor;
      const objs = []; s.scene.traverse((o) => { if (o.userData.info?.key === key) objs.push(o); });
      for (const o of objs) {
        const v = new V(); o.getWorldPosition(v); v.y += 0.8; v.project(s.camera);
        if (Math.abs(v.x) < 0.8 && Math.abs(v.y) < 0.6 && v.z < 1) return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight, id: o.userData.info.id };
      }
      return null;
    }, key);
    if (!pt) { console.log(`${key}: not on screen`); continue; }
    await page.touchscreen.tap(pt.x, pt.y);
    await page.waitForTimeout(300);
    const card = await page.evaluate(() => document.querySelector('#card').classList.contains('open')
      ? `${document.querySelector('#card-type').textContent} ${document.querySelector('#card-id').textContent}` : 'closed');
    console.log(`${key}: tapped ${pt.id} → card: ${card}`);
  }
  // catalog → jump to the ferris wheel
  await page.tap('#btn-catalog');
  await page.waitForTimeout(400);
  const n = await page.evaluate(() => document.querySelectorAll('.cat-item').length);
  console.log(`catalog entries: ${n}, total: ${await page.textContent('#catalog-total')}`);
  const btn = page.locator('.cat-item', { hasText: 'ferris_wheel' });
  await btn.tap();
  await page.waitForFunction(() => !window.__stage.fly, null, { timeout: 90_000 });
  console.log('after catalog jump, selected:', await page.evaluate(() => window.__stage.highlighter.selected?.userData.info.id));
  // follow a car
  await page.evaluate(() => { const s = window.__stage; let car; s.scene.traverse((o) => { if (!car && o.userData.info?.key === 'taxi') car = o; }); s.select(car); });
  await page.waitForTimeout(200);
  const followVisible = await page.isVisible('#card-follow');
  await page.tap('#card-follow');
  // software rendering is slow: wait for the camera flight to finish (simulation time, not wall time)
  await page.waitForFunction(() => !window.__stage.fly, null, { timeout: 90_000 });
  await page.waitForTimeout(1500);
  const dist = await page.evaluate(() => { const s = window.__stage; const V = s.camera.position.constructor; const p = new V(); s.highlighter.selected.getWorldPosition(p); return `${p.distanceTo(s.controls.target).toFixed(1)} (taxi ${p.toArray().map(Math.round)}, target ${s.controls.target.toArray().map(Math.round)}, following ${s.following?.userData.info.id}, sel ${s.highlighter.selected.userData.info.id})`; });
  console.log(`follow button visible: ${followVisible}, following: ${await page.evaluate(() => !!window.__stage.following)}, target↔taxi distance: ${dist} m`);
  await page.screenshot({ path: '.shots/interact.png' });
  if (logs.length) console.log(logs.join('\n'));
}, { timeoutMs: 200_000 });
