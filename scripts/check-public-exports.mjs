#!/usr/bin/env node
/**
 * Freeze-check for @tjcages/panels public runtime exports.
 *
 * Compares sorted Object.keys of dist/index.js against api-exports.txt.
 * Adding a name is fine (update the snapshot). Removing or renaming is a
 * breaking change in 0.x (bump minor + CHANGELOG).
 *
 * Usage:
 *   node scripts/check-public-exports.mjs          # fail on mismatch
 *   node scripts/check-public-exports.mjs --write  # rewrite snapshot
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const snapshotPath = join(root, "api-exports.txt")
const distPath = join(root, "dist", "index.js")
const write = process.argv.includes("--write")

function fail(message) {
  console.error(message)
  process.exit(1)
}

if (!existsSync(distPath)) {
  fail(`Missing ${distPath}. Run \`pnpm build\` first.`)
}

const mod = await import(pathToFileURL(distPath).href)
const actual = Object.keys(mod).sort()

function formatList(names) {
  return `${names.join("\n")}\n`
}

if (write) {
  writeFileSync(snapshotPath, formatList(actual))
  console.log(`Wrote ${actual.length} names to api-exports.txt`)
  process.exit(0)
}

if (!existsSync(snapshotPath)) {
  fail(
    "Missing api-exports.txt. Create it with:\n  pnpm build && node scripts/check-public-exports.mjs --write",
  )
}

const expected = readFileSync(snapshotPath, "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .sort()

const expectedSet = new Set(expected)
const actualSet = new Set(actual)
const added = actual.filter((name) => !expectedSet.has(name))
const removed = expected.filter((name) => !actualSet.has(name))

if (added.length || removed.length) {
  console.error("Public export snapshot mismatch.")
  if (added.length) {
    console.error("  Added (in dist, not in api-exports.txt):")
    for (const name of added) console.error(`    ${name}`)
  }
  if (removed.length) {
    console.error("  Removed (in api-exports.txt, not in dist):")
    for (const name of removed) console.error(`    ${name}`)
  }
  console.error(
    "Refresh with: pnpm build && node scripts/check-public-exports.mjs --write",
  )
  console.error(
    "Removing or renaming a name is a breaking change (0.x: bump minor + CHANGELOG).",
  )
  process.exit(1)
}

console.log(`Public exports match: ${actual.length} names`)
