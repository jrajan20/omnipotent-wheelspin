// Capture README screenshots of the running app with Playwright.
//
// Usage:
//   1. Start the dev server:   npm run dev
//   2. In another terminal:    npm run screenshots
//
// Screenshots are written to docs/screenshots/. Several screens (Builder,
// winner modal, guest shared wheel, auth modal, mobile) render without a real
// Supabase backend, so a demo .env is enough.

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'docs', 'screenshots');

const WHEEL = {
  title: 'Friday Night Dinner',
  labels: ['Pizza', 'Sushi', 'Tacos', 'Ramen', 'Burgers', 'Thai', 'Salad', 'BBQ'],
};

// Distinct HSL colors, mirroring src/utils/wheels.js output format.
function colorFor(i, total) {
  const hue = Math.round((360 / total) * i);
  return `hsl(${hue} 68% 55%)`;
}

function buildOptions(labels) {
  return labels.map((label, i) => ({
    id: crypto.randomUUID(),
    label,
    color: colorFor(i, labels.length),
  }));
}

// Mirrors encodeWheelToHash() in src/utils/wheels.js (btoa(utf8)).
function encodeWheelToHash(title, options) {
  const payload = JSON.stringify({ title, options });
  return Buffer.from(payload, 'utf-8').toString('base64');
}

async function waitForServer(url, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(
    `Dev server never became reachable at ${url}. Start it with "npm run dev" first.`,
  );
}

async function populateWheel(page) {
  await page.getByPlaceholder(/name your wheel/i).fill(WHEEL.title);
  const optionInput = page.getByPlaceholder(/add an option/i);
  for (const label of WHEEL.labels) {
    await optionInput.fill(label);
    await optionInput.press('Enter');
  }
  // Let the wheel + list settle.
  await page.waitForTimeout(600);
}

async function run() {
  await waitForServer(BASE_URL);
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();

  // ---- Desktop (dark) ----
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });
  const page = await desktop.newPage();

  // 1. Builder — empty state
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.getByText('Wheelspin Bot').waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: resolve(OUT_DIR, 'builder-empty.png'), fullPage: true });
  console.log('✓ builder-empty.png');

  // 2. Builder — populated wheel
  await populateWheel(page);
  await page.screenshot({ path: resolve(OUT_DIR, 'builder-wheel.png'), fullPage: true });
  console.log('✓ builder-wheel.png');

  // 3. Winner reveal modal
  await page.getByRole('button', { name: /spin the wheel/i }).click();
  await page.getByText('The wheel has spoken').waitFor({ timeout: 8000 });
  await page.waitForTimeout(300);
  await page.getByRole('dialog').screenshot({ path: resolve(OUT_DIR, 'result-modal.png') });
  console.log('✓ result-modal.png');
  await page.keyboard.press('Escape');

  // 4. Auth modal
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Sign in' }).first().click();
  await page.getByText('Welcome to Omnipotent Wheelspin').waitFor();
  await page.waitForTimeout(300);
  await page.getByRole('dialog').screenshot({ path: resolve(OUT_DIR, 'auth-modal.png') });
  console.log('✓ auth-modal.png');

  // 5. Guest shared wheel (no backend needed — encoded in the URL hash)
  const hash = encodeWheelToHash(WHEEL.title, buildOptions(WHEEL.labels));
  await page.goto(`${BASE_URL}/w/local#${hash}`, { waitUntil: 'networkidle' });
  await page.getByText('Shared wheel').waitFor();
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(OUT_DIR, 'shared-wheel.png'), fullPage: true });
  console.log('✓ shared-wheel.png');

  await desktop.close();

  // ---- Mobile (dark) ----
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    colorScheme: 'dark',
    isMobile: true,
    hasTouch: true,
  });
  const mPage = await mobile.newPage();
  await mPage.goto(BASE_URL, { waitUntil: 'networkidle' });
  await mPage.getByText('Wheelspin Bot').waitFor();
  await populateWheel(mPage);
  await mPage.screenshot({ path: resolve(OUT_DIR, 'mobile-builder.png'), fullPage: true });
  console.log('✓ mobile-builder.png');

  await mobile.close();
  await browser.close();
  console.log(`\nDone. Screenshots written to ${OUT_DIR}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
