// Shared, safe headless-browser runner for the dev scripts.
// A runaway of parallel Chromiums once froze the server, therefore:
//  - only ONE browser at a time (exclusive lock file, stale locks are detected)
//  - the browser is ALWAYS closed in `finally`, also on errors/timeouts
//  - a hard watchdog closes the browser and exits after `timeoutMs`
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LOCK = path.join(os.tmpdir(), '3d-objects-browser.lock');

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

export async function withBrowser(fn, { timeoutMs = 150_000 } = {}) {
  if (!takeLock()) {
    console.error('Another browser run is active – aborting (one browser at a time).');
    process.exit(2);
  }
  let browser;
  const watchdog = setTimeout(async () => {
    console.error(`Watchdog: aborting after ${timeoutMs / 1000} s`);
    try { await browser?.close(); } catch {}
    fs.rmSync(LOCK, { force: true });
    process.exit(3);
  }, timeoutMs);
  try {
    browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
    return await fn(browser);
  } catch (e) {
    console.error('browser run failed:', e.message);
    process.exitCode = 1;
  } finally {
    clearTimeout(watchdog);
    try { await browser?.close(); } catch {}
    fs.rmSync(LOCK, { force: true });
  }
}

/** Open the app and wait until the world is built. */
export async function openApp(page, query = '') {
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error') logs.push(`[error] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(`http://localhost:5199/?nointro=1&${query}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 90_000 }).catch(() => logs.push('TIMEOUT waiting for __ready'));
  return logs;
}
