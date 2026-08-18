# Changelog

All notable changes to `shader-panel` are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **`usePanelFrame` / `<PanelClock />`** — per-frame callback driven by the panel clock (delta is 0 while paused); R3F helper invalidates `frameloop="demand"` while playing. Clicking a `PanelOverlay` can open the matching collection row. (OFF-140)
- **Field inference** — `usePanel({ defaults })` with no `fields` infers sliders, colors, toggles, vec2s, and collections. `inferPanelFields` is exported. (OFF-143, OFF-460)
- **Agent catalog + skill** — `AGENTS.md` / `llms.txt` primitive catalog, remaining SETUP_PROMPT coverage for collections/overlay/export, and `skills/panels/SKILL.md`. (OFF-144, OFF-145, OFF-146)
- **Generic capture registry** — `registerPanelCapture` and siblings are the canonical names; `registerShader*` aliases stay (same function). Export UI looks for any canvas. (OFF-142)
- **`compositeCaptureFrame`** — draw canvas / ImageBitmap layers into one PNG for overlay+canvas export. (OFF-141)
- **Recipe examples** — copyable integrations in `examples/` (shader, R3F, map+POIs, dashboard, settings). (OFF-147)
- **Public export snapshot** — `api-exports.txt` + `scripts/check-public-exports.mjs`; 0.x semver policy in CONTRIBUTING. (OFF-461)
- **Field error boundary** — a crashing control shows an inline error row instead of taking down the host. (OFF-462)
- **Panel shell error boundary** — a throw in animation/export/prompts shows `Panel failed to render` instead of crashing the host. (OFF-462)
- **Bundle gzip budgets** in CI for core and shader, dev and prod entries. (OFF-462)
- **Per-target navigation** — a registration can carry `scrollTo` (a selector scrolled into view, reduced-motion aware) and/or `onSelect` (route with your own router); picking a target in the header switcher takes you there. The built-in multi-target switcher now uses the custom `PanelHeaderSelect` dropdown. (OFF-468)
- **Header hover locks the body** — while the header is hovered in float mode, the panel body ignores pointer events, so reaching to drag can't catch a control. (OFF-466)
- **`PanelCloseButton`** — the one X/close/remove primitive; header close, stripe/collection row removes, and field clears all render it (md 22px, sm 18px variants). (OFF-459)
- **`PanelHeaderSelect`** — custom header dropdown: fit-to-text trigger that animates its width to the open menu, full listbox keyboard (wrapping arrows, Home/End, type-ahead, Enter commits, Escape contained), outside-click close. (OFF-457)
- **Color popover keyboard** — arrows walk the library with in-list scrolling, Enter picks, arrows/Tab switch tabs, type-ahead by color name, Escape never leaks to panel handlers. (OFF-457)
- **Slider value input** — every slider row is now label / stretchy track / editable value box (leva-style): type a value and press Enter, Escape reverts, arrow keys step (shift x10). (OFF-456)
- **Header swipe throw** — in float mode, a two-finger trackpad swipe while hovering the header moves the panel with the fingers and releases it with the swipe velocity into the same dock/settle as a drag. (OFF-456)
- **Free-float mode** — `float` prop on `FloatingPanel`: drag the panel by its header with release momentum, resize from all eight edges and corners, and dock to viewport edges (hint pills preview the dock target). The panel hard-clamps inside a 16px viewport margin, survives page zoom and ancestor transforms via per-gesture screen→style calibration, hides instantly on close, and scales back in from its docked edge. `floatStorageKey` keeps the placement across close/reopen. (OFF-454)
- **`ColorPopover`** — dark color picker popover (Library/Picker tabs, injectable color library, saturation/hue picker, hex input, scroll fade masks, anchor-corner entrance). Replaces the native color input in `ControlColorInput`; no new dependencies. (OFF-455)
- **`{ type: "gradient-stops" }` field** — 2D field / 1D ramp gradient editor with draggable stops, add/remove, and per-stop popover colors (`ControlGradientStops`). (OFF-455)
- **`{ type: "stripe-table" }` field** — controlled stripe palette table: per-row color/opacity/threshold/width, drag reorder, flip, add/remove, optional easing editors (`ControlStripeColorsTable`). (OFF-455)
- **Color library support** — `library` + `persist` options on color fields (`ControlLibraryColor`), with consumer-injected color data (`ColorLibraryGroup`). (OFF-455)
- **`renderPanelField`** — exported field renderer for composing custom shells (e.g. the float shell) with schema-driven fields.

### Changed
- **Header swipe always docks to an edge** — a two-finger swipe now settles against the edge it was thrown toward (a corner when diagonal), never resting mid-page, with a longer idle window so a momentary pause doesn't cut it short. (OFF-466)
- **Float panel placement** — caps at 664px tall; on a taller viewport it opens vertically centered on the right edge, otherwise top-right. (OFF-458)
- **Select, toggle-group, and preset rows lay out horizontally** — label left in the shared slider label column, control right. (OFF-457)
- **Stripe palette header** — Distribution + toolbar on one right-aligned row; the Colors drawer toggle speaks the section-header language. (OFF-457)
- **Slider momentum requires a throw** — an ordinary release stops exactly where the pointer left it; the coast only engages above a real flick velocity, and a pause before release cancels it. (OFF-456)
- **Panel spacing** — 1.5x horizontal padding in the body, header aligned so an empty title lets the switcher line up with content, action buttons center their labels with 12px x padding. (OFF-456)

### Fixed
- **Entrance animation on remount** — the float shell's position restore and scale-up entrance were skipped when the panel mounted fresh (the portal renders null pre-mount); effects now wait for the element. (OFF-456)
- **Panel reskin** — the injected stylesheet now matches the Cloudflare Connect dev panel: opaque `#1c1c1c` dark theme (no backdrop blur), 8px frame radius, 11px single text size, `#2a2a2a` control surfaces, 4px control radius, compact 24px rows, thin scrollbars, bottom fade mask on scrollable bodies. Light theme maps the same geometry to the lab's light palette. Default panel width is now 360px (was 280px). (OFF-455)

## [0.1.1] — 2026-08-18

### Fixed
- **Add stripe** — inserts a new fixed `#888888` row (`startFrom` 0, opacity 1, width from the last row or 4) instead of cloning the previous stripe. (OFF-455)
- **Nested section carets** — open-state rotation uses a child selector so a parent folder no longer flips every nested caret. (OFF-455)

## [1.2.0] — 2026-07-08

### Added
- **`ControlDisclosure`** — accordion row for nested editor panels (POIs, captions, etc.).
- **`ControlTextInput`** — stacked or inline text field with proper panel styling.
- **`ControlSearchField`** — search input with inline action button and error state.
- **`ControlOptionList`** — compact scrollable picker for search results and link targets.
- **`ControlReadout`** — label + truncated read-only value row.
- **`ControlTextarea`** — labeled multiline input using the paste textarea styling.
- **`ControlHint`** — muted helper copy for panel sections.

## [1.1.0] — 2026-07-08

### Added
- **`ToolShell`** — generic playground layout with full-bleed viewport, left/right panel slots, optional top bar, panel toggle buttons, and eye toggle. Uses `pointer-events: none` on the overlay so the viewport stays interactive.
- **`ToolPanel`** — floating panel shell for custom (non-schema) content such as POI editors.
- **Dual-panel support** — `side: "left" | "right"` on `ShaderDevRegistration`, `ShaderDevPanel`, and `useShaderDev`. `ShaderDevRoot` renders one panel per side with per-side shader switchers.
- **`{ type: "presets" }` field** — one-click preset buttons that merge partial values or replace the full config via a function.
- **`ShaderDevFloatingPanel` inline mode** — `inline` prop renders panels in-place (absolute positioning) instead of portaling to `document.body`; optional `container` prop for custom portal targets.
- **Layout constants** — `TOOL_PANEL_WIDTH`, `TOOL_PANEL_INSET`, `TOOL_PANEL_FULL` exported for top-bar padding.
- **Per-side open state** — independent sessionStorage keys for left and right panels.
- **`showAnimation` / `showExport` props** on `ShaderDevPanel` — hide shader-specific footer blocks in generic tool panels.

## [1.0.0] — 2026-06-08

First stable release. API surface is now considered stable; subsequent breaking changes will bump the major.

### Added (since 0.5.0)
- **`useShaderDev` hook** — one call owns the config state, registers the shader, and auto-injects the panel (Leva-style), so integration is a single line in the shader file with no `<ShaderDevRoot/>` and no separate config/fields files. Returns a `useState`-style `[config, setConfig]`; persists + rehydrates automatically. Pass `autoMount: false` to mount the root yourself. `ShaderDevRoot` is now a singleton, so the auto-injected panel and an explicit `<ShaderDevRoot/>` never double-render.
- **Six built-in AI prompts, written as senior-graphics-engineer briefs** (~2k chars each): improve quality, optimize GPU, reduce shimmer / temporal aliasing, find runtime bugs & leaks, expose missing parameters, switch to adapters. Each has a prioritized checklist with concrete GLSL patterns and thresholds — linear-space color math, Reinhard/ACES tone mapping, TPDF dithering, derivative-based edge AA, portable integer hashes, warp-divergence and `mediump` tradeoffs, tiler/mobile pitfalls, the Three.js disposal chain, GLSL NaN/Inf hazards, and `fwidth` prefiltering for temporal stability.
- **Zero-edit prompts** — prompts reference files by project context (no paths to fill in) and auto-name the active shader via a `{{shader}}` token resolved at copy/preview time. New `fillShaderDevPrompt(text, name)` helper, exported.
- Auto-height animations on the saved indicator, sections, prompt previews, and the paste textarea using the CSS Grid `0fr ↔ 1fr` trick + delayed opacity fade.

### Fixed (since 0.5.0)
- Floating prompt copy button is now fully opaque (stacked `--sd-bg` gradients) so prompt text no longer bleeds through behind the icon.
- Slider overscroll spring no longer clipped by the collapse wrapper (`clip-path: inset(0 -9999px)` clips vertically only).
- Paste JSON textarea auto-focuses + scrolls into view on open; font size reduced and de-bled (specificity fix).

### Notes
- `shader-panel` is the package name; the repository moved to `tjcages/shader-panel` on GitHub.

## [0.5.0] — 2026-06-08

### Added
- **localStorage persistence** — `loadPersistedShaderDevValues(id, defaults)` hydrates a shader's config on mount; the panel auto-persists on every change. "Reset to defaults" clears the storage entry.
- **Saved indicator** — "● Edits saved locally" appears below the action buttons whenever current values differ from defaults.
- **Paste JSON action** — bottom-of-panel button reveals a textarea for pasting a config blob; on Apply, known keys merge into the current config with inline validation.
- **Production zero-weight stub** — dual-entry build emits `dist/index.prod.js` (~5.6 KB) that bundlers auto-resolve under the `production` condition. Panel UI, store, keyboard, styles, and persistence I/O become no-ops; `createWebGLAdapter` / `createR3FAdapter` / `hexToRgb01` / `patchShaderConfigDefaults` stay functional. Subpath `shader-panel/dev` forces the full panel in any environment.
- **Auto-height animations** — sections, prompt previews, the saved indicator, and the paste textarea use the CSS Grid `0fr → 1fr` trick with a 280 ms spring bezier; opacity fades in over the same window.

### Fixed
- Action button background was transparent until hovered — same `[data-shader-dev] button` specificity bug that hit the color hex earlier. Scoped `.sd-action-btn` to win cleanly.
- "Edits saved locally" indicator now sits below the three action buttons and is horizontally centered.

## [0.4.0] — 2026-06-08

### Added
- **Quick actions / AI prompts rail** with five built-in templates (improve quality, expose missing parameters, optimize GPU, find bugs, switch to adapters). Each row expands inline to preview the prompt; floating copy icon writes to clipboard with brief feedback. Customize per-shader via `registerShaderDev({ prompts: [...] })`.
- **Per-section reset** — hover-revealed `↻` on each section header resets only that section's keys.

### Changed
- Section headers restyled as 10 px / 600 weight / 0.1 em letter-spacing uppercase category labels; chevron extracted into its own button so the reset can sit between title and caret.
- Prompt rows match slider row visuals (36 px surface row, no awkward bg darkening on hover).
- Keyboard shortcut hint disabled by default — pass `shortcutHint` to `ShaderDevPanel` to opt back in.

## [0.3.0] — 2026-06-08

### Added
- **Multi-shader registry** — `registerShaderDev(reg)` now returns its own cleanup fn (idiomatic `useEffect` pattern). Internal `Map<id, registration>` plus an active-shader switcher in the panel header when 2+ shaders are mounted.
- **New field types** — `toggle` (boolean switch), `select` (typed dropdown), `vec2` (paired sliders for `[x, y]` tuples).
- **Adapter helpers** — `createWebGLAdapter` returns `(config) => uniforms` for raw WebGL / `ShaderMount`; `createR3FAdapter` returns `apply(config)` that mutates Three.js uniform `.value` slots in place. Both auto-handle hex → vec3 and `.set(...)` detection.

## [0.2.0] — 2026-06-08

### Changed
- **Replaced Tailwind v4 with a self-contained CSS module.** Single `<style>` injection on first mount; theming via `--sd-*` custom properties on `[data-shader-dev]`. No build setup required for consumers.
- **Replaced `motion` peer dep with CSS transitions.** Slider drag still uses direct DOM mutation via CSS variables; spring-like feel via `cubic-bezier(0.34, 1.16, 0.64, 1)`.

### Added
- **tsup build pipeline** emitting ESM + `.d.ts`. Proper `exports` map, MIT license, repository / keywords / homepage metadata.

## [0.1.0] — Initial

- Single-shader registration store, floating panel with slider / color controls, keyboard shortcut, copy/write JSON. Tailwind-class-based styling, `motion` for spring animations.

[1.0.0]: https://github.com/tjcages/shader-panel/releases/tag/v1.0.0
[0.5.0]: https://github.com/tjcages/shader-panel/releases/tag/v0.5.0
[0.4.0]: https://github.com/tjcages/shader-panel/releases/tag/v0.4.0
[0.3.0]: https://github.com/tjcages/shader-panel/releases/tag/v0.3.0
[0.2.0]: https://github.com/tjcages/shader-panel/releases/tag/v0.2.0
[0.1.0]: https://github.com/tjcages/shader-panel/releases/tag/v0.1.0
