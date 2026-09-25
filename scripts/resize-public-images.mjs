#!/usr/bin/env node

/**
 * Resize public/images: downscale images wider than 2000px to 2000px wide
 * (keeping aspect ratio), and re-encode any jpg/png over 400KB even if
 * not wider than 2000px — keeping the new file only if it is smaller.
 *
 * Re-encodes in the same format and same filename. Never renames or deletes.
 *
 * Usage: node scripts/resize-public-images.mjs
 */

import { readdir, stat, writeFile, unlink, rename } from "node:fs/promises";
import { join, extname } from "node:path";
import sharp from "sharp";

const ROOT = join(import.meta.dirname, "..", "public", "images");
const MAX_WIDTH = 2000;
const OVERSIZE_THRESHOLD = 400 * 1024; // 400 KB

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (/\.(jpe?g|png|webp)$/i.test(e.name)) {
      files.push(full);
    }
  }
  return files;
}

const rows = [];

for (const filePath of await walk(ROOT)) {
  const before = await stat(filePath);
  const beforeKB = Math.round(before.size / 1024);
  const ext = extname(filePath).toLowerCase();

  let meta;
  try {
    meta = await sharp(filePath).metadata();
  } catch {
    console.error(`  SKIP (cannot read): ${filePath}`);
    continue;
  }

  const needsResize = meta.width > MAX_WIDTH;
  const isOversize =
    (ext === ".jpg" || ext === ".jpeg" || ext === ".png") &&
    before.size > OVERSIZE_THRESHOLD;

  if (!needsResize && !isOversize) continue;

  let pipeline = sharp(filePath);

  if (needsResize) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  // Re-encode in the same format
  if (ext === ".jpg" || ext === ".jpeg") {
    pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
  } else if (ext === ".png") {
    pipeline = pipeline.png({ compressionLevel: 9, palette: false });
  } else if (ext === ".webp") {
    pipeline = pipeline.webp({ quality: 82 });
  }

  const buf = await pipeline.toBuffer();
  if (buf.length >= before.size) {
    // New file is not smaller — skip
    continue;
  }

  // Write to temp file, then atomic rename
  const tmpPath = filePath + ".resize-tmp";
  await writeFile(tmpPath, buf);
  await unlink(filePath);
  await rename(tmpPath, filePath);

  const afterMeta = await sharp(filePath).metadata();
  const afterKB = Math.round((await stat(filePath)).size / 1024);
  rows.push({
    file: filePath.replace(ROOT, "").replace(/^[/\\]/, ""),
    beforeKB,
    afterKB,
    beforeW: meta.width,
    beforeH: meta.height,
    afterW: afterMeta.width,
    afterH: afterMeta.height,
  });
}

if (rows.length === 0) {
  console.log("No images needed resizing.");
} else {
  console.log(
    "\n  " +
      "File".padEnd(60) +
      "Before".padEnd(10) +
      "After".padEnd(10) +
      "Dimensions (before → after)"
  );
  console.log("  " + "─".repeat(100));
  for (const r of rows) {
    console.log(
      `  ${r.file}`.padEnd(65) +
        `${r.beforeKB} KB`.padEnd(10) +
        `${r.afterKB} KB`.padEnd(10) +
        `${r.beforeW}×${r.beforeH} → ${r.afterW}×${r.afterH}`
    );
  }
  console.log(`\nResized ${rows.length} image(s).`);
}
