#!/usr/bin/env node
/**
 * Node / SSR smoke: import the production entry with no DOM.
 * Fails if the module throws on load or is missing expected exports.
 */

const entryUrl = new URL("../dist/index.prod.js", import.meta.url)

let prod
try {
  prod = await import(entryUrl.href)
} catch (err) {
  console.error("Failed to import dist/index.prod.js")
  console.error(err)
  process.exit(1)
}

if (prod == null || typeof prod !== "object") {
  console.error("prod entry did not export a module object")
  process.exit(1)
}

const keys = Object.keys(prod)
if (keys.length === 0) {
  console.error("prod entry exported no keys")
  process.exit(1)
}

if (typeof prod.usePanel !== "function") {
  console.error("usePanel is not a function")
  process.exit(1)
}

if (typeof prod.compositeCaptureFrame !== "function") {
  console.error("compositeCaptureFrame is not a function")
  process.exit(1)
}

console.log(`prod entry ok: ${keys.length} exports`)
