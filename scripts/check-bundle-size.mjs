#!/usr/bin/env node
/**
 * gzip size budgets for package entries (OFF-462).
 *
 * Budgets are gzip-9 of the built files. Prod is not a pure no-op: adapters,
 * inferPanelFields, and compositeCaptureFrame stay live. Raise a budget in
 * the same PR that grows the file, with a CHANGELOG note.
 *
 * Usage: pnpm build && node scripts/check-bundle-size.mjs
 */

import { gzipSync } from "node:zlib"
import { readFileSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

/** gzip-9 byte ceilings. Headroom over 2026-08-18 measured sizes. */
const BUDGETS = [
  { file: "dist/index.prod.js", maxGzip: 14_000 },
  { file: "dist/index.js", maxGzip: 90_000 },
  { file: "dist/shader/index.prod.js", maxGzip: 4_000 },
  { file: "dist/shader/index.js", maxGzip: 95_000 },
]

let failed = false
for (const { file, maxGzip } of BUDGETS) {
  const path = join(root, file)
  if (!existsSync(path)) {
    console.error(`Missing ${file}. Run \`pnpm build\` first.`)
    process.exit(1)
  }
  const gz = gzipSync(readFileSync(path), { level: 9 }).byteLength
  const ok = gz <= maxGzip
  const line = `${file}: gzip ${gz} / budget ${maxGzip}`
  if (ok) console.log(line)
  else {
    console.error(`${line}  OVER`)
    failed = true
  }
}

if (failed) {
  console.error("Bundle over budget. Raise the ceiling in scripts/check-bundle-size.mjs with a CHANGELOG note.")
  process.exit(1)
}
console.log("Bundle budgets ok")
