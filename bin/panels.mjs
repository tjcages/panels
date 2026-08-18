#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, statSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const skillSrc = join(packageRoot, "skills", "panels")

function printUsage() {
  console.log(`Usage:
  npx @tjcages/panels [help|--help|-h]
  npx @tjcages/panels setup [--dir <path>] [--claude]

  setup   Copy the packaged agent skill into a host project.
          Writes:
            <dir>/.agents/skills/panels/
            <dir>/.cursor/skills/panels/
          --claude  also write <dir>/.claude/skills/panels/
          Default <dir> is the current working directory.
`)
}

function fail(message, code = 1) {
  console.error(message)
  process.exit(code)
}

const args = process.argv.slice(2)
const helpArgs = new Set(["help", "--help", "-h"])

if (args.length === 0 || helpArgs.has(args[0])) {
  printUsage()
  process.exit(0)
}

if (args[0] !== "setup") {
  printUsage()
  process.exit(1)
}

let dir = process.cwd()
let claude = false
const rest = args.slice(1)

for (let i = 0; i < rest.length; i++) {
  const arg = rest[i]
  if (arg === "--claude") {
    claude = true
    continue
  }
  if (arg === "--dir") {
    const next = rest[i + 1]
    if (!next || next.startsWith("-")) {
      fail("error: --dir requires a path")
    }
    dir = resolve(next)
    i++
    continue
  }
  if (arg.startsWith("--dir=")) {
    const value = arg.slice("--dir=".length)
    if (!value) fail("error: --dir requires a path")
    dir = resolve(value)
    continue
  }
  if (arg === "--help" || arg === "-h") {
    printUsage()
    process.exit(0)
  }
  printUsage()
  process.exit(1)
}

if (!existsSync(skillSrc) || !statSync(skillSrc).isDirectory()) {
  fail(`error: packaged skill missing at ${skillSrc}`)
}

const destinations = [
  join(dir, ".agents", "skills", "panels"),
  join(dir, ".cursor", "skills", "panels"),
]
if (claude) {
  destinations.push(join(dir, ".claude", "skills", "panels"))
}

for (const dest of destinations) {
  mkdirSync(dirname(dest), { recursive: true })
  cpSync(skillSrc, dest, { recursive: true, force: true })
}

console.log(`Copied the panels skill to:`)
for (const dest of destinations) {
  console.log(`  ${dest}`)
}
console.log(`
Open a file and follow SETUP_PROMPT.md in the @tjcages/panels package.

Optional installs:
  npx skills add tjcages/panels --skill panels
  Claude Code: /plugin marketplace add tjcages/panels
               then /plugin install panels@tjcages-panels
  Docs: https://offbr.co/tools/panels/docs/
  Agent: https://offbr.co/tools/panels/installation
`)
