// Records the real panel in slow motion and retimes it to 30 fps.
//
// Every clock the panel reads is slowed by K together: performance.now,
// Date.now, rAF timestamps, timers, Event.timeStamp (drag/throw velocity),
// and the document animation timeline (CSS transitions + WAAPI) through
// CDP Animation.setPlaybackRate. Input is replayed K times slower in real
// time, so the product sees normal-speed interaction. The screencast frames
// are then sampled at 30 fps of *virtual* time.
//
//   node record.mjs <shot> [--k=30]
import { chromium } from "playwright"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { execFileSync } from "node:child_process"
import { SHOTS, VIEWPORT, DSF } from "./shots.mjs"

const name = process.argv[2]
const K = Number(process.argv.find((a) => a.startsWith("--k="))?.slice(4) ?? 30)
const shot = SHOTS[name]
if (!shot) throw new Error(`Unknown shot ${name}. Known: ${Object.keys(SHOTS).join(", ")}`)

const OUT = new URL(`./out/${name}/`, import.meta.url).pathname
await rm(OUT, { recursive: true, force: true })
await mkdir(`${OUT}frames`, { recursive: true })

const clockPatch = (K) => {
  const pNow = performance.now.bind(performance)
  const t0 = pNow()
  const v = (t) => t0 + (t - t0) / K
  window.__virtualNow = () => v(pNow())
  performance.now = () => v(pNow())
  const dNow = Date.now
  const d0 = dNow()
  Date.now = () => d0 + (dNow() - d0) / K
  const raf = window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame = (cb) => raf((t) => cb(v(t)))
  const st = window.setTimeout.bind(window)
  window.setTimeout = (f, ms = 0, ...a) => st(f, ms * K, ...a)
  const si = window.setInterval.bind(window)
  window.setInterval = (f, ms = 0, ...a) => si(f, ms * K, ...a)
  const ts = Object.getOwnPropertyDescriptor(Event.prototype, "timeStamp").get
  Object.defineProperty(Event.prototype, "timeStamp", {
    configurable: true,
    get() {
      return v(ts.call(this))
    },
  })
}

const browser = await chromium.launch({ args: ["--force-color-profile=srgb", "--hide-scrollbars"] })
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: DSF })
await context.addInitScript(clockPatch, K)
const page = await context.newPage()
page.on("pageerror", (e) => console.error("pageerror", e.message))
const cdp = await context.newCDPSession(page)

// Continuity: start from the state the `from` shot ended on.
let query = shot.query ?? ""
if (shot.from) {
  const prev = JSON.parse(await readFile(new URL(`./out/${shot.from}.state.json`, import.meta.url), "utf8"))
  query = `?s=${encodeURIComponent(JSON.stringify(prev))}${shot.extra ?? ""}`
}
await page.goto(`http://localhost:5180/${query}`)
await page.evaluate(() => document.fonts.ready)
await cdp.send("Animation.enable")
await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 / K })
if (shot.setup) await shot.setup(page)
await page.waitForTimeout(400 * K)

// Virtual-time helpers handed to the shot script.
const realStart = Date.now()
const virtStart = await page.evaluate(() => window.__virtualNow())
const vnow = async () => virtStart + (Date.now() - realStart) / K
const cursor = []
let pos = shot.cursorStart ?? { x: VIEWPORT.width + 60, y: VIEWPORT.height * 0.7 }
let down = false
let kind = "soft"
const log = async () => cursor.push({ t: await vnow(), x: pos.x, y: pos.y, down, kind })

const ease = {
  standard: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  arrive: (t) => 1 - Math.pow(1 - t, 4),
  linear: (t) => t,
  throw: (t) => t * t,
}
const api = {
  page,
  K,
  wait: async (ms) => {
    const end = Date.now() + ms * K
    while (Date.now() < end) {
      await log()
      await new Promise((r) => setTimeout(r, Math.min(16 * K, end - Date.now())))
    }
  },
  move: async (x, y, ms, curve = "standard") => {
    const from = { ...pos }
    const steps = Math.max(1, Math.round(ms / 16))
    for (let i = 1; i <= steps; i++) {
      const e = ease[curve](i / steps)
      pos = { x: from.x + (x - from.x) * e, y: from.y + (y - from.y) * e }
      await page.mouse.move(pos.x, pos.y)
      await log()
      await new Promise((r) => setTimeout(r, 16 * K))
    }
  },
  down: async () => {
    down = true
    await page.mouse.down()
    await log()
  },
  up: async () => {
    down = false
    await page.mouse.up()
    await log()
  },
  kind: (k) => {
    kind = k
  },
  press: async (keys) => {
    await page.keyboard.press(keys)
    await log()
  },
  wheel: async (dx, dy) => {
    await page.mouse.wheel(dx, dy)
    await log()
  },
  box: async (selector) => {
    const b = await page.locator(selector).first().boundingBox()
    if (!b) throw new Error(`No box for ${selector}`)
    return { ...b, cx: b.x + b.width / 2, cy: b.y + b.height / 2 }
  },
}

// Full-resolution screenshots in a loop (headless screencast is capped at
// CSS pixels). Each frame is stamped with the midpoint of its capture.
const frames = []
let frameNo = 0
let capturing = true
const grab = (async () => {
  while (capturing) {
    const t0 = await vnow()
    const buf = await page.screenshot({ type: "jpeg", quality: 93 })
    const t1 = await vnow()
    const file = `${OUT}frames/${String(frameNo++).padStart(6, "0")}.jpg`
    frames.push({ t: (t0 + t1) / 2, file })
    await writeFile(file, buf)
  }
})()
await page.mouse.move(pos.x, pos.y)
const start = await vnow()
await log()
await shot.run(api)
const end = await vnow()
const endState = await page.evaluate(() => window.__scene)
capturing = false
await grab
await browser.close()

// Resample to 30 fps of virtual time: each output frame shows the newest
// captured frame at or before its timestamp.
frames.sort((a, b) => a.t - b.t)
const fps = 30
const count = Math.floor(((end - start) / 1000) * fps)
const list = []
let j = 0
for (let i = 0; i < count; i++) {
  const t = start + (i * 1000) / fps
  while (j + 1 < frames.length && frames[j + 1].t <= t) j++
  list.push(`file '${frames[j].file}'\nduration ${1 / fps}`)
}
await writeFile(`${OUT}list.txt`, list.join("\n") + "\n")
execFileSync("ffmpeg", [
  "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", `${OUT}list.txt`,
  "-r", "30", "-pix_fmt", "yuv420p", "-c:v", "libx264", "-crf", "12", "-preset", "medium",
  `${OUT}../${name}.mp4`,
])
const rel = cursor.map((c) => ({ ...c, f: ((c.t - start) / 1000) * fps }))
await writeFile(`${OUT}../${name}.cursor.json`, JSON.stringify({ viewport: VIEWPORT, frames: count, samples: rel }))
await writeFile(`${OUT}../${name}.state.json`, JSON.stringify(endState))
const gaps = frames.slice(1).map((f, i) => f.t - frames[i].t)
console.log(
  `${name}: ${count} frames @30fps, ${frames.length} captured, max gap ${Math.max(...gaps).toFixed(1)}ms virtual`,
)
