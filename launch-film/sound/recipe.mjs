// Builds the editor's v2 mix recipe from the cut map and the cue sheet, the
// same resolution the editor performs when it loads --edit and --cues.
import { readFileSync, writeFileSync } from "node:fs"
import { resolveCues } from "../editor/effects.mjs" // the skill editor, copied in (gitignored)

const edit = JSON.parse(readFileSync("../film/src/edit.json", "utf8"))
const sheet = JSON.parse(readFileSync("cues.json", "utf8"))
const frames = edit.cuts.reduce((n, c) => n + c.out - c.in, 0)
const duration = frames / 30
// The bed's groove enters at 4.286 s (bar 3); land it on the panel's entrance.
const revealOpen = (edit.cuts[0].out - edit.cuts[0].in + 35 - edit.cuts[1].in) / 30
const start = +(4.286 - revealOpen).toFixed(3)
const mix = {
  version: 2,
  start,
  duration,
  volume: 0.3,
  fadeIn: 0.4,
  fadeOut: 1.6,
  musicSpeed: 1,
  effectsSpeed: 1,
  fps: 30,
  effects: resolveCues(edit, sheet),
  effectsVolume: 1,
  effectsEnabled: true,
  musicEnabled: true,
}
writeFileSync("mix.json", JSON.stringify(mix, null, 2))
console.log(`mix.json: ${duration.toFixed(3)} s, music from ${start} s, ${mix.effects.length} cues`)
