// One-off Trainerize exercise library export — logs in, navigates to the exercise
// library, and dumps a raw {name, media_url?} list for review before anything
// touches lib/exercise-db.json. Credentials via env vars, never written to disk.
//
// Usage: TRAINERIZE_EMAIL=... TRAINERIZE_PASSWORD=... node scripts/scrape-trainerize-exercises.mjs [--inspect]

// Ubuntu 26.04 needs the newer bundled Chromium build (revision 1228) shipped in
// playwright@1.61.0, not the hoisted top-level 1.59.1 (revision 1217, unsupported on this OS).
import { createRequire } from "module";
import { join as pathJoin } from "path";
const require = createRequire(import.meta.url);
const { chromium } = require(pathJoin(process.cwd(), "node_modules/.pnpm/playwright@1.61.0/node_modules/playwright"));
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const EMAIL = process.env.TRAINERIZE_EMAIL;
const PASSWORD = process.env.TRAINERIZE_PASSWORD;
const INSPECT = process.argv.includes("--inspect");
const OUT_DIR = join(process.cwd(), ".context");

if (!EMAIL || !PASSWORD) {
  console.error("Set TRAINERIZE_EMAIL and TRAINERIZE_PASSWORD env vars first.");
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("Navigating to login...");
  await page.goto("https://eternalfitness8.trainerize.com/app/login", { waitUntil: "domcontentloaded" });

  if (INSPECT) {
    await page.screenshot({ path: join(OUT_DIR, "trainerize-login.png"), fullPage: true });
    writeFileSync(join(OUT_DIR, "trainerize-login.html"), await page.content());
    console.log("Saved login page screenshot + HTML for inspection.");
  }

  // Trainerize's login form field names/ids vary by build — try a few common selectors.
  const emailSelectors = ["#emailInput", '[data-testid="email-input"]', 'input[name="email"]', "#email", 'input[type="email"]', 'input[name="username"]'];
  const passSelectors = ["#passInput", '[data-testid="password-input"]', 'input[name="password"]', "#password", 'input[type="password"]'];

  let filled = false;
  for (const sel of emailSelectors) {
    if (await page.locator(sel).count() > 0) {
      await page.fill(sel, EMAIL);
      filled = true;
      break;
    }
  }
  if (!filled) throw new Error("Could not find email/username field — run with --inspect and check trainerize-login.html");

  filled = false;
  for (const sel of passSelectors) {
    if (await page.locator(sel).count() > 0) {
      await page.fill(sel, PASSWORD);
      filled = true;
      break;
    }
  }
  if (!filled) throw new Error("Could not find password field — run with --inspect and check trainerize-login.html");

  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => null),
    page.click('[data-testid="signIn-button"]'),
  ]);
  await page.waitForTimeout(2000);

  console.log("Logged in (or attempted). Current URL:", page.url());

  await page.goto("https://eternalfitness8.trainerize.com/app/ExerciseLibrary.aspx?mode=all&level=trainer", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(4000);

  // The library is lazy-loaded (~40 cards at a time on scroll) — scroll the
  // internal list container until the exercise-id count stops growing.
  let lastCount = 0;
  for (let i = 0; i < 200; i++) {
    const count = await page.locator("[exercise-id]").count();
    if (count === lastCount && i > 0) break;
    lastCount = count;
    await page.evaluate(() => {
      const scroller = document.querySelector(".exerciseLibrary-container") || document.scrollingElement;
      scroller.scrollTop = scroller.scrollHeight;
    });
    await page.waitForTimeout(600);
  }
  console.log(`Stopped scrolling at ${lastCount} exercises loaded.`);

  if (INSPECT) {
    await page.screenshot({ path: join(OUT_DIR, "trainerize-exercise-library.png"), fullPage: true });
    writeFileSync(join(OUT_DIR, "trainerize-exercise-library.html"), await page.content());
    console.log("Saved exercise library screenshot + HTML for inspection.");
    await browser.close();
    return;
  }

  const exercises = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll("[exercise-id]").forEach((node) => {
      const name = node.querySelector("p")?.textContent?.trim();
      const imgDiv = node.querySelector(".exerciseLibrary-exercise__imgExerciseLibrary");
      const bg = imgDiv?.style?.backgroundImage ?? "";
      const match = bg.match(/url\("?(.*?)"?\)$/);
      const media_url = match ? match[1] : null;
      if (name) {
        results.push({ id: node.getAttribute("exercise-id"), name, media_url });
      }
    });
    return results;
  });

  const deduped = Array.from(new Map(exercises.map((e) => [e.id, e])).values());
  writeFileSync(join(OUT_DIR, "trainerize-exercise-export.json"), JSON.stringify(deduped, null, 2));
  console.log(`Exported ${deduped.length} exercises to .context/trainerize-exercise-export.json`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
