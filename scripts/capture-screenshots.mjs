// Capture README screenshots of the running app with Playwright.
//
// Usage:
//   1. Start the dev server:   npm run dev
//   2. In another terminal:    npm run screenshots
//
// Screenshots are written to docs/screenshots/. Several screens (Builder,
// winner modal, guest shared wheel, auth modal, mobile) render without a real
// Supabase backend, so a demo .env is enough. The Profile screen additionally
// signs in, so it needs a real Supabase project plus valid credentials — set
// SCREENSHOT_EMAIL / SCREENSHOT_PASSWORD (see CREDENTIALS below).

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load variables from the project's .env (e.g. SCREENSHOT_EMAIL / _PASSWORD).
// Available in Node 20.12+; ignore if the file is missing.
try {
  process.loadEnvFile(resolve(__dirname, '..', '.env'));
} catch {
  /* no .env — rely on the ambient environment instead */
}

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const OUT_DIR = resolve(__dirname, '..', 'docs', 'screenshots');

const WHEEL = {
  title: 'Friday Night Dinner',
  labels: ['Pizza', 'Sushi', 'Tacos', 'Ramen', 'Burgers', 'Thai', 'Salad', 'BBQ'],
};

// Credentials used to capture signed-in screens (the Profile page). Set these in
// the gitignored .env (SCREENSHOT_EMAIL / SCREENSHOT_PASSWORD) or the environment
// so real credentials never live in source control.
const CREDENTIALS = {
  email: process.env.SCREENSHOT_EMAIL ?? '',
  password: process.env.SCREENSHOT_PASSWORD ?? '',
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

// Sign in through the auth modal so signed-in screens (e.g. Profile) can render.
// Throws if the modal doesn't close, which indicates the sign-in failed.
async function signIn(page, email, password) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Sign in' }).first().click();

  const dialog = page.getByRole('dialog');
  await dialog.getByText('Welcome to Omnipotent Wheelspin').waitFor();
  // Target the inputs by role: this excludes Mantine's "Toggle password
  // visibility" button (which also carries "password" in its aria-label) and
  // tolerates the required-field asterisk in the label text.
  await dialog.getByRole('textbox', { name: 'Email' }).fill(email);
  await dialog.getByRole('textbox', { name: 'Password' }).fill(password);
  await dialog.getByRole('button', { name: 'Sign in', exact: true }).click();

  // On a successful sign-in the modal closes automatically and the navbar
  // swaps the "Sign in" button for the account avatar.
  await dialog.waitFor({ state: 'detached', timeout: 15000 });
  await page.waitForTimeout(400);
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

  // 6. Profile — signed-in account page (saved wheels + account settings).
  if (!CREDENTIALS.email || !CREDENTIALS.password) {
    console.warn(
      '⚠ Skipped Profile screenshots — set SCREENSHOT_EMAIL and SCREENSHOT_PASSWORD ' +
        '(e.g. in .env) to capture the signed-in Profile page.',
    );
  } else {
    try {
      await signIn(page, CREDENTIALS.email, CREDENTIALS.password);
      await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' });
      await page.getByRole('heading', { name: 'Profile' }).waitFor({ timeout: 10000 });

      // Capture each Profile tab: saved wheels, change password, delete account.
      const tabs = [
        ['Saved wheels', 'profile-wheels.png'],
        ['Change password', 'profile-password.png'],
        ['Delete account', 'profile-delete.png'],
      ];
      for (const [tabName, file] of tabs) {
        await page.getByRole('tab', { name: tabName }).click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: resolve(OUT_DIR, file), fullPage: true });
        console.log(`✓ ${file}`);
      }
    } catch (err) {
      console.warn(
        '⚠ Skipped Profile screenshots — sign-in failed. Check SCREENSHOT_EMAIL / ' +
          'SCREENSHOT_PASSWORD and that .env points at a real Supabase project.\n  ' +
          (err?.message ?? err),
      );
    }
  }

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
