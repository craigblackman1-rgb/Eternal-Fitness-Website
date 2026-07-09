// Trainerize exercise library export — logs in, loads the full exercise list,
// then opens each exercise's detail dialog to pull Type/Tags/video/instructions,
// plus a separate pass using the "Custom exercises" library filter to flag which
// exercise-ids are Esther's own additions vs Trainerize's stock library.
// Output is a raw export for review before anything touches the `exercises` table
// — no auto-categorization guessing, only what Trainerize itself reports.
//
// Credentials via env vars, never written to disk.
// Usage:
//   TRAINERIZE_EMAIL=... TRAINERIZE_PASSWORD=... node scripts/scrape-trainerize-exercises.mjs [--inspect] [--limit N]

// Ubuntu 26.04 needs the newer bundled Chromium build (revision 1228) shipped in
// playwright@1.61.0, not the hoisted top-level 1.59.1 (revision 1217, unsupported on this OS).
import { createRequire } from "module";
import { join } from "path";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
const require = createRequire(import.meta.url);
const { chromium } = require(join(process.cwd(), "node_modules/.pnpm/playwright@1.61.0/node_modules/playwright"));

const EMAIL = process.env.TRAINERIZE_EMAIL;
const PASSWORD = process.env.TRAINERIZE_PASSWORD;
const INSPECT = process.argv.includes("--inspect");
const LIMIT_ARG = process.argv.indexOf("--limit");
const LIMIT = LIMIT_ARG !== -1 ? parseInt(process.argv[LIMIT_ARG + 1], 10) : null;
const OUT_DIR = join(process.cwd(), ".context");
const OUT_FILE = join(OUT_DIR, "trainerize-exercise-export.json");

// Known filter vocabularies (from the Exercise Filters drawer) — used to split
// each exercise's flat "Tags" list back into muscle_groups vs equipment.
const MAIN_MUSCLES = new Set([
  "Abductors", "Abs", "Adductors", "Back (lower)", "Back (middle)", "Bicep", "Calves",
  "Chest (inner)", "Chest (mid)", "Chest (upper)", "Forearms", "Glutes", "Hamstrings",
  "Lats", "Neck", "Obliques", "Quads", "Shoulder (front)", "Shoulder (rear)",
  "Shoulder (side)", "Traps", "Triceps",
]);
const EQUIPMENT = new Set([
  "Balance board", "Bands (handles)", "Bands (loops)", "Barbell", "Battle ropes", "Bench",
  "Body weight", "BOSU", "Box", "Cable", "D-ring", "Dumbbell", "EZ bar", "Foam roller",
  "Jump rope", "Kettlebell", "Lacrosse ball", "Landmine", "Machine", "Mat", "Medicine ball",
  "Mini band", "Plate", "Pull up bar", "Sandbag", "Slam ball", "Sled", "Sliders",
  "Smith machine", "Suspension", "Swiss ball",
]);

if (!EMAIL || !PASSWORD) {
  console.error("Set TRAINERIZE_EMAIL and TRAINERIZE_PASSWORD env vars first.");
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

async function login(page) {
  await page.goto("https://eternalfitness8.trainerize.com/app/login", { waitUntil: "domcontentloaded" });
  await page.fill("#emailInput", EMAIL);
  await page.fill("#passInput", PASSWORD);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => null),
    page.click('[data-testid="signIn-button"]'),
  ]);
  await page.waitForTimeout(2000);
}

// Lazy-loads ~40 cards per scroll inside .exerciseLibrary-wrap — needs a dispatched
// scroll event, not just scrollTop. Requires the count to hold steady across 2
// consecutive checks before declaring done — a single stable read was unreliable
// (the list occasionally pauses mid-batch under load).
async function scrollToLoadAll(page) {
  let lastCount = -1;
  let stableStreak = 0;
  for (let i = 0; i < 400; i++) {
    const count = await page.locator("[exercise-id]").count();
    if (count === lastCount) {
      stableStreak++;
      if (stableStreak >= 2) break;
    } else {
      stableStreak = 0;
    }
    lastCount = count;
    await page.locator(".exerciseLibrary-wrap").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event("scroll", { bubbles: true }));
    });
    await page.waitForTimeout(1800);
  }
  return lastCount;
}

async function loadExerciseLibrary(page) {
  await page.goto("https://eternalfitness8.trainerize.com/app/ExerciseLibrary.aspx?mode=all&level=trainer", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(4000);
  return scrollToLoadAll(page);
}

/** Open the "Custom exercises" library filter and return the set of exercise-ids
 *  it surfaces — everything else in the full list is Trainerize's stock library. */
async function getCustomExerciseIds(page) {
  await page.goto("https://eternalfitness8.trainerize.com/app/ExerciseLibrary.aspx?mode=all&level=trainer", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(3000);
  await page.locator('svg[name*="filter"], svg[name*="slider"], [class*="filter"]').first().click();
  await page.waitForTimeout(600);
  const customCheckbox = page.locator('text="Custom exercises"').first();
  await customCheckbox.click();
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Apply")').click();
  await page.waitForTimeout(2000);

  // Re-scroll in place (do NOT navigate/reload — that would drop the just-applied filter).
  await scrollToLoadAll(page);

  const ids = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[exercise-id]")).map((el) => el.getAttribute("exercise-id")),
  );
  return new Set(ids);
}

function splitTags(tags) {
  const muscle_groups = [];
  const equipment = [];
  const other_tags = [];
  for (const t of tags) {
    if (MAIN_MUSCLES.has(t)) muscle_groups.push(t);
    else if (EQUIPMENT.has(t)) equipment.push(t);
    else other_tags.push(t);
  }
  return { muscle_groups, equipment, other_tags };
}

async function extractDetail(page, exerciseId) {
  const card = page.locator(`[exercise-id="${exerciseId}"]`).first();
  await card.click({ timeout: 5000 }).catch(() => null);
  await page.waitForTimeout(700);

  const detail = await page.evaluate(() => {
    const root = document.querySelector(".exerciseDialog-details");
    if (!root) return null;
    const type = root.querySelector(".exerciseDialog-details__recordType")?.textContent?.trim() ?? null;
    const tags = Array.from(root.querySelectorAll(".exerciseDialog-details__tags .ant-tag")).map((t) =>
      t.textContent.trim(),
    );
    const instructions = root.querySelector(".tz-p")?.textContent?.trim() || null;
    const videoInput = document.querySelector('input[value*="youtube.com"], input[value*="vimeo.com"]');
    const iframe = document.querySelector('iframe[src*="youtube.com"], iframe[src*="vimeo.com"]');
    const videoTag = document.querySelector("video source, video");
    const video_url =
      videoInput?.getAttribute("value") ??
      iframe?.getAttribute("src") ??
      videoTag?.getAttribute("src") ??
      null;
    return { type, tags, instructions, video_url };
  });

  // Close the dialog (X button or Escape) before moving to the next card.
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(400);

  return detail;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("Logging in...");
  await login(page);
  console.log("Logged in. Current URL:", page.url());

  console.log("Finding custom exercises (Library filter)...");
  const customIds = await getCustomExerciseIds(page).catch((err) => {
    console.error("Could not determine custom-exercise ids, continuing without the flag:", err.message);
    return new Set();
  });
  console.log(`Found ${customIds.size} custom exercise ids.`);

  console.log("Loading full exercise library...");
  const total = await loadExerciseLibrary(page);
  console.log(`Loaded ${total} exercises.`);

  if (INSPECT) {
    await page.screenshot({ path: join(OUT_DIR, "trainerize-exercise-library.png"), fullPage: true });
    writeFileSync(join(OUT_DIR, "trainerize-exercise-library.html"), await page.content());
    console.log("Saved screenshot + HTML for inspection (--inspect stops here).");
    await browser.close();
    return;
  }

  const listData = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll("[exercise-id]").forEach((node) => {
      const name = node.querySelector("p")?.textContent?.trim();
      const imgDiv = node.querySelector(".exerciseLibrary-exercise__imgExerciseLibrary");
      const bg = imgDiv?.style?.backgroundImage ?? "";
      const match = bg.match(/url\("?(.*?)"?\)$/);
      const image_url = match ? match[1] : null;
      if (name && name !== "This is a modal window." && !name.startsWith("***")) {
        results.push({ id: node.getAttribute("exercise-id"), name, image_url });
      }
    });
    return results;
  });
  const deduped = Array.from(new Map(listData.map((e) => [e.id, e])).values());
  const ids = LIMIT ? deduped.slice(0, LIMIT) : deduped;

  // The full Trainerize library is Trainerize's entire platform catalog (2500+), not
  // just what Esther uses — only worth the slow per-item detail click for her own
  // "Custom exercises" (the ones actually reflected in her programming). Everything
  // else is imported as name + thumbnail only, untagged until reviewed.
  const detailWorthy = ids.filter((item) => customIds.has(item.id));
  console.log(`${detailWorthy.length} of ${ids.length} are in "Custom exercises" — only those get detail-scraped.`);

  // Resumable: pick up from a prior partial run rather than re-scraping from scratch.
  let results = existsSync(OUT_FILE) ? JSON.parse(readFileSync(OUT_FILE, "utf-8")) : [];
  const done = new Set(results.map((r) => r.id));

  for (const item of ids) {
    if (done.has(item.id) || customIds.has(item.id)) continue;
    // Non-custom stock exercise — no detail click, just the list-view data.
    results.push({
      id: item.id,
      name: item.name,
      image_url: item.image_url,
      trainerize_custom: false,
      type: null,
      muscle_groups: [],
      equipment: [],
      other_tags: [],
      instructions: null,
      video_url: null,
    });
  }
  writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));
  done.clear();
  results.forEach((r) => done.add(r.id));
  console.log(`Wrote ${results.length} stock (untagged) rows. Now detail-scraping ${detailWorthy.length} custom exercises...`);

  for (let i = 0; i < detailWorthy.length; i++) {
    const item = detailWorthy[i];
    if (done.has(item.id)) continue;

    const detail = await extractDetail(page, item.id).catch((err) => {
      console.warn(`  [${i + 1}/${detailWorthy.length}] ${item.name}: detail extraction failed — ${err.message}`);
      return null;
    });

    const { muscle_groups, equipment, other_tags } = splitTags(detail?.tags ?? []);
    results.push({
      id: item.id,
      name: item.name,
      image_url: item.image_url,
      trainerize_custom: customIds.has(item.id),
      type: detail?.type ?? null,
      muscle_groups,
      equipment,
      other_tags,
      instructions: detail?.instructions ?? null,
      video_url: detail?.video_url ?? null,
    });

    if ((i + 1) % 10 === 0 || i === detailWorthy.length - 1) {
      writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));
      console.log(`  [${i + 1}/${detailWorthy.length}] saved progress (${results.length} total)`);
    }
  }

  writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));
  console.log(`Done. Exported ${results.length} exercises to .context/trainerize-exercise-export.json`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
