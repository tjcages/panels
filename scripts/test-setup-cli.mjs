#!/usr/bin/env node

import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const cli = join(root, "bin", "panels.mjs")
const tmp = mkdtempSync(join(tmpdir(), "panels-setup-"))

function run(args, cwd = tmp) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: "utf8",
  })
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

let error = null
try {
  for (const args of [[], ["--help"], ["-h"], ["help"]]) {
    const result = run(args)
    assert(
      result.status === 0,
      `help ${JSON.stringify(args)} exited ${result.status}`,
    )
  }

  const unknown = run(["not-a-command"])
  assert(
    unknown.status === 1,
    `unknown command exited ${unknown.status}, expected 1`,
  )

  const setup = run(["setup"])
  assert(setup.status === 0, `setup failed: ${setup.stderr || setup.stdout}`)

  const agentsSkill = join(tmp, ".agents", "skills", "panels", "SKILL.md")
  const cursorSkill = join(tmp, ".cursor", "skills", "panels", "SKILL.md")
  for (const path of [agentsSkill, cursorSkill]) {
    assert(existsSync(path), `missing ${path}`)
    const body = readFileSync(path, "utf8")
    assert(
      body.includes("@tjcages/panels"),
      `${path} does not contain @tjcages/panels`,
    )
  }
  assert(
    !existsSync(join(tmp, ".claude")),
    ".claude/ exists after default setup",
  )

  const withClaude = run(["setup", "--claude"])
  assert(
    withClaude.status === 0,
    `setup --claude failed: ${withClaude.stderr || withClaude.stdout}`,
  )
  const claudeSkill = join(tmp, ".claude", "skills", "panels", "SKILL.md")
  assert(existsSync(claudeSkill), `missing ${claudeSkill}`)
  const claudeBody = readFileSync(claudeSkill, "utf8")
  assert(
    claudeBody.includes("@tjcages/panels"),
    `${claudeSkill} does not contain @tjcages/panels`,
  )
} catch (err) {
  error = err
} finally {
  rmSync(tmp, { recursive: true, force: true })
}

if (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}

console.log("setup CLI tests passed")
