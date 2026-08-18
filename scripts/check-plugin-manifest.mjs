#!/usr/bin/env node

import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

function readJson(relative) {
  const path = join(root, relative)
  try {
    return { path, data: JSON.parse(readFileSync(path, "utf8")) }
  } catch (error) {
    throw new Error(`${relative}: ${error instanceof Error ? error.message : error}`)
  }
}

const marketplace = readJson(".claude-plugin/marketplace.json")
const plugin = readJson(".claude-plugin/plugin.json")

if (marketplace.data.name !== "tjcages-panels") {
  throw new Error("marketplace.json name must be tjcages-panels")
}
if (!marketplace.data.owner?.name) {
  throw new Error("marketplace.json owner.name is required")
}
const entry = marketplace.data.plugins?.[0]
if (!entry || entry.name !== "panels" || entry.source !== "./") {
  throw new Error("marketplace.json must list plugins[0] name=panels source=./")
}
if (plugin.data.name !== "panels") {
  throw new Error("plugin.json name must be panels")
}
if (typeof plugin.data.description !== "string" || plugin.data.description.length < 20) {
  throw new Error("plugin.json description is missing")
}

console.log("plugin manifests ok: tjcages-panels / panels")
