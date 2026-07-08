// Local screenshot harness for the Trainer Hub redesign.
// Usage: HUB_EMAIL=... HUB_PASSWORD=... node scripts/hub-screenshots.mjs [outDir] [baseUrl]
// Outputs full-page PNGs of every hub route to outDir (default .context/screens/hub-current).
// Dev-only tool; never committed data, reads no secrets from disk.

import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const outDir = process.argv[2] ?? ".context/screens/hub-current";
const baseUrl = process.argv[3] ?? "http://localhost:3100";
const email = process.env.HUB_EMAIL;
const password = process.env.HUB_PASSWORD;

if (!email || !password) {
  console.error("Set HUB_EMAIL and HUB_PASSWORD env vars.");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const routes = [
  ["dashboard", "/hub"],
  ["clients", "/hub/clients"],
  ["exercises", "/hub/exercises"],
  ["tracker", "/hub/tracker"],
  ["agreements", "/hub/agreements"],
  ["site-review", "/hub/site-review"],
  ["client-new", "/hub/clients/new"],
];

// Client-specific routes are resolved after login by following the first
// client link on /hub/clients, so the harness works with whatever data exists.

const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

// Log in through the real form
await page.goto(`${baseUrl}/hub/login`, { waitUntil: "networkidle" });
await page.fill('input[type="email"]', email);
await page.fill('input[type="password"]', password);
await page.click('button[type="submit"]');
try {
  await page.waitForURL(
    (url) => url.pathname.startsWith("/hub") && !url.pathname.includes("login"),
    { timeout: 15000 }
  );
} catch {
  const err = await page.locator('[class*="error"], [role="alert"], .text-destructive').first().textContent().catch(() => null);
  console.error(`login failed${err ? `: ${err.trim()}` : " (no error message found)"} — still on ${page.url()}`);
  await page.screenshot({ path: join(outDir, "_login-failure.png") });
  await browser.close();
  process.exit(1);
}
console.log("logged in");

async function shoot(name, path) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(600);
      await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: true });
      console.log(`captured ${name}  (${path})`);
      return;
    } catch (e) {
      if (attempt === 3) {
        console.error(`FAILED ${name} (${path}): ${e.message.split("\n")[0]}`);
        return;
      }
      await page.waitForTimeout(1500);
    }
  }
}

for (const [name, path] of routes) {
  await shoot(name, path);
}

// Discover a real client detail page from the clients list
await page.goto(`${baseUrl}/hub/clients`, { waitUntil: "networkidle" });
const clientHref = await page
  .locator('a[href^="/hub/clients/"]:not([href$="/new"])')
  .first()
  .getAttribute("href")
  .catch(() => null);

let detailPath = clientHref;
if (!detailPath) {
  // HubTable rows navigate via onClick router.push — click the first row instead
  const row = page.locator("tbody tr").first();
  if (await row.count()) {
    await row.click();
    await page.waitForURL((u) => /\/hub\/clients\/[^/]+$/.test(u.pathname), { timeout: 10000 }).catch(() => {});
    if (/\/hub\/clients\/[^/]+$/.test(new URL(page.url()).pathname)) {
      detailPath = new URL(page.url()).pathname;
    }
  }
}

if (detailPath) {
  await shoot("client-detail", detailPath);
  // Try tabs on the client page if present
  for (const tab of ["Profile", "Training", "Updates"]) {
    const t = page.locator(`[role="tab"]:has-text("${tab}")`).first();
    if (await t.count()) {
      await t.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: join(outDir, `client-detail-${tab.toLowerCase()}.png`), fullPage: true });
      console.log(`captured client-detail-${tab.toLowerCase()}`);
    }
  }
} else {
  console.log("no client rows found — skipped client detail");
}

await browser.close();
console.log(`done → ${outDir}`);
