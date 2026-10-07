// Usage: node scripts/shot.mjs "<query>" out.png [width height] [waitMs]
// Takes a screenshot of the dev server (http://localhost:5199/?<query>) with headless Chromium.
//
// Safety rules (a runaway of parallel Chromiums once froze the server):
//  - only ONE browser at a time: an exclusive lock file is taken before launching
//  - the browser is always closed in `finally`, also on errors/timeouts
//  - a hard watchdog kills the process after 150 s
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LOCK = path.join(os.tmpdir(), '3d-objects-shot.lock');
const [q = '', out = 'shot.png', w = '412', h = '915', wait = '1500'] = process.argv.slice(2);

function takeLock() {
  try {
    fs.writeFileSync(LOCK, String(process.pid), { flag: 'wx' });
    return true;
  } catch {
    const pid = Number(fs.readFileSync(LOCK, 'utf8'));
    try { process.kill(pid, 0); return false; } catch { /* stale lock */ }
    fs.rmSync(LOCK, { force: true });
    return takeLock();
  }
}

if (!takeLock()) {
  console.error('Another screenshot run is active – aborting (one browser at a time).');
  process.exit(2);
}

let browser;
const watchdog = setTimeout(async () => {
  console.error('Watchdog: aborting after 150 s');
  try { await browser?.close(); } catch {}
  fs.rmSync(LOCK, { force: true });
  process.exit(3);
}, 150_000);

try {
  browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error') logs.push(`[error] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(`http://localhost:5199/?nointro=1&${q}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 90_000 }).catch(() => logs.push('TIMEOUT waiting for __ready'));
  await page.waitForTimeout(+wait);
  const info = await page.evaluate(() => {
    const s = window.__stage; if (!s) return null;
    const r = s.renderer; r.info.autoReset = false; r.info.reset();
    r.render(s.scene, s.camera);
    const res = { calls: r.info.render.calls, tris: r.info.render.triangles, selectables: window.__count };
    r.info.autoReset = true; return res;
  }).catch(() => null);
  await page.screenshot({ path: out, timeout: 60_000 });
  console.log(JSON.stringify(info), logs.slice(0, 15).join('\n'));
} catch (e) {
  console.error('shot failed:', e.message);
  process.exitCode = 1;
} finally {
  clearTimeout(watchdog);
  try { await browser?.close(); } catch {}
  fs.rmSync(LOCK, { force: true });
}
