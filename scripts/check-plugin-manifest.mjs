#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs"
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

function requireFile(relative) {
  const path = join(root, relative)
  if (!existsSync(path)) {
    throw new Error(`missing ${relative}`)
  }
}

const marketplace = readJson(".claude-plugin/marketplace.json")
const claudePlugin = readJson(".claude-plugin/plugin.json")
const cursorPlugin = readJson(".cursor-plugin/plugin.json")

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
if (claudePlugin.data.name !== "panels") {
  throw new Error(".claude-plugin/plugin.json name must be panels")
}
if (
  typeof claudePlugin.data.description !== "string" ||
  claudePlugin.data.description.length < 20
) {
  throw new Error(".claude-plugin/plugin.json description is missing")
}

if (cursorPlugin.data.name !== "panels") {
  throw new Error(".cursor-plugin/plugin.json name must be panels")
}
if (cursorPlugin.data.homepage !== "https://offbr.co/tools/panels") {
  throw new Error(".cursor-plugin/plugin.json homepage must be https://offbr.co/tools/panels")
}
if (cursorPlugin.data.skills !== "./skills") {
  throw new Error(".cursor-plugin/plugin.json skills must be ./skills")
}
if (cursorPlugin.data.logo !== "assets/logo.svg") {
  throw new Error(".cursor-plugin/plugin.json logo must be assets/logo.svg")
}
if (!cursorPlugin.data.author?.name) {
  throw new Error(".cursor-plugin/plugin.json author.name is required")
}

requireFile("assets/logo.svg")
requireFile("skills/panels/SKILL.md")
requireFile("AGENT.md")

console.log("plugin manifests ok: tjcages-panels / panels (claude + cursor)")
