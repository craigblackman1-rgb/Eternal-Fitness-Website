#!/usr/bin/env node
/**
 * Wraps stamp → build → restore. The stamped SW files are only live during
 * the next build. After the build (success or failure), originals are
 * restored so `git status` stays clean.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const stamp = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
const files = [
  path.join(__dirname, "..", "public", "hub", "sw.js"),
  path.join(__dirname, "..", "public", "portal", "sw.js"),
];

const originals = files.map((f) => fs.readFileSync(f, "utf-8"));

// Stamp
for (let i = 0; i < files.length; i++) {
  const stamped = originals[i].replace(/__SW_VERSION__/g, stamp);
  if (stamped === originals[i]) {
    console.error(`[stamp-sw] WARNING: no __SW_VERSION__ token found in ${files[i]}`);
  } else {
    console.log(`[stamp-sw] ${path.relative(path.join(__dirname, ".."), files[i])} → ${stamp}`);
  }
  fs.writeFileSync(files[i], stamped);
}

// Build + restore (finally guarantees restore even if build fails)
let exitCode = 0;
try {
  execSync("npx next build", {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
  });
} catch (e) {
  exitCode = e.status || 1;
} finally {
  for (let i = 0; i < files.length; i++) {
    fs.writeFileSync(files[i], originals[i]);
  }
}

process.exit(exitCode);
