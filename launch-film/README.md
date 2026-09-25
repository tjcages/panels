# Panels launch film

Source for the ~25 s launch film for `@tjcages/panels`, made with the [video-editor skill](https://github.com/tjcages/skills/tree/main/video-editor). Media (footage, renders, music, the MP4) is gitignored. Everything here regenerates it.

## Story

Launch film: one promise ("Tune any React state, live."), five real features, then the production claim and install line.

| # | Scene | What the viewer sees | Source |
|---|---|---|---|
| 1 | `hook` | Title: *Tune any React state, live.* | Title card |
| 2 | `reveal` | Wave field alone, then ⌘⌥D brings the panel in with its scale-up entrance | Recorded |
| 3 | `amplitude` | Close on the Amplitude slider drag; the waves swell | Recorded |
| 4 | `lines` | Lines slider packs the field denser | Recorded |
| 5 | `color` | Tint swatch → library popover → Pink 500; the field recolors | Recorded |
| 6 | `backdrop` | Macro on the Backdrop toggle → Dark; pull out as the page flips | Recorded |
| 7 | `collection` | Add Ribbon: a new row in the panel, a new blue band in the field | Recorded |
| 8 | `float` | Grab the header, throw; the panel coasts and docks left | Recorded |
| 9 | `prod` | Title: *Compiles out of production.* | Title card |
| 10 | `end` | Logo, "Panels", `npm install @tjcages/panels` | Title card |

Left out: shader adapters, overlay projector, export/capture, stripe/gradient editors, JSON tools. Each is real but needs a scene of its own to read at playback speed.

## Provenance

Every panel frame is the real package source (`../src`) running in `capture/`, a Vite fixture that mounts `FloatingPanel float` + `renderPanelField` over a canvas wave field (the field is accessory context). `capture/record.mjs` drives it with Playwright at a 1440x810 viewport and 3× device pixels, **slowed 30×**. It scales every clock the panel reads (`performance.now`, `Date.now`, rAF, timers, `Event.timeStamp`, and CSS/WAAPI through CDP `Animation.setPlaybackRate`) and replays input 30× slower. Full-resolution screenshots are then resampled to 30 fps of virtual time. Product timing, easing, drag velocity, and throw physics are the shipped behavior. The pointer is drawn in Remotion from the recorded input path (`*.cursor.json`) with the skill's native cursor glyphs.

The fixture includes a Tailwind-style button reset, like the panel's real hosts. Without one, the panel's buttons pick up browser default backgrounds.

## Rebuild

Node 22+, FFmpeg, Python 3 with numpy + scipy.

```sh
# 1. Record (≈3 min per shot). Shots chain state: each starts where the last ended.
cd capture && pnpm install && pnpm dev &      # serves the fixture on :5180
for s in reveal sliders color backdrop collection float; do node record.mjs $s; done

# 2. Cut
cd ../film && npm install && npm run assets
npx tsc --noEmit && node qc.mjs --wide=reveal,backdrop,float --flat=hook,prod,end
node build.mjs                                # → out/film.mp4 (silent)

# 3. Sound: the original bed, cue sheet → mix recipe, then the skill's exporter
cd ../music && python3 make_bed.py            # → bed.wav (synthesized, license-free)
cp -r <skills>/video-editor/skills/video-editor/assets/editor ../editor && (cd ../editor && npm ci)
cd ../sound && node recipe.mjs                # → mix.json
node ../editor/mix.mjs --video ../film/out/film.mp4 --song ../music/bed.wav --mix mix.json --out mixed.mp4
./master.sh mixed.mp4 panels-launch.mp4       # -14 LUFS, -1.5 dBFS peak
```

Cuelume samples are UI-quiet (peaks around -12 to -21 dBFS), so the recipe keeps the bed at 0.3 and the cues near full. Cue peaks land 4-12 dB above the bed's RMS.

To fine-tune music or cues by ear, open the skill's editor instead: `npm start -- --video …/film.mp4 --edit …/film/src/edit.json --cues …/sound/cues.json`.

If Remotion can't download its Chrome, set `REMOTION_CHROME` to a local headless Chromium (see `film/remotion.config.ts`).
