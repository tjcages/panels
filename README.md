# @tjcages/panels

[![npm version](https://img.shields.io/npm/v/@tjcages/panels.svg)](https://www.npmjs.com/package/@tjcages/panels) [![bundle size](https://img.shields.io/bundlephobia/minzip/@tjcages/panels?label=min%2Bgzip)](https://bundlephobia.com/package/@tjcages/panels) [![license](https://img.shields.io/npm/l/@tjcages/panels.svg)](./LICENSE)

A floating dev panel for tuning **any React state live** — shaders, canvases, 3D scenes, simulations, layout math, or a plain config object. Describe your values once; get a draggable, dockable, resizable panel with sliders, color pickers, dropdowns, and more.

<p align="center">
  <img src="https://raw.githubusercontent.com/tjcages/panels/main/assets/hero.webp" alt="Panels — a floating dev panel open over a shader" width="720">
</p>

No CSS framework, no animation library, two peer deps (`react`, `react-dom`), and it **compiles out of production builds** (~5 KB no-op). Toggle with <kbd>⌘⌥D</kbd> (<kbd>Ctrl+Alt+D</kbd>).

```sh
npm install @tjcages/panels
```

**Agent setup.** `npx @tjcages/panels setup` copies the skill into `.agents/skills/panels` and `.cursor/skills/panels`. No postinstall. Claude Code: `/plugin marketplace add tjcages/panels` then `/plugin install panels@tjcages-panels`. Cursor/agents: `npx skills add tjcages/panels --skill panels`.

Live docs + playground: [`playground/`](./playground) (GitHub Pages once enabled on this repo).

## One hook

`usePanel` owns the state, injects the panel, and hands you a `useState`-style tuple. No `<PanelRoot/>`, no extra files.

```tsx
import { usePanel, type PanelField } from "@tjcages/panels"

type Config = { speed: number; count: number; tint: string; trails: boolean }

const DEFAULTS: Config = { speed: 1, count: 24, tint: "#ff5e1f", trails: true }

const FIELDS: PanelField<Config>[] = [
  { type: "section", title: "Motion" },
  { type: "slider", key: "speed", label: "Speed", min: 0, max: 4, step: 0.01 },
  { type: "slider", key: "count", label: "Count", min: 1, max: 200, step: 1 },
  { type: "toggle", key: "trails", label: "Trails" },
  { type: "color", key: "tint", label: "Tint" },
]

export function Scene() {
  const [config] = usePanel({
    id: "particles",
    title: "Particles",
    defaults: DEFAULTS,
    fields: FIELDS,
  })

  // `config` updates as you drag — feed it to anything: a canvas draw loop,
  // Three.js uniforms, a physics step, CSS custom properties, a data viz.
}
```

Edits persist to `localStorage` and rehydrate on reload (pass `persist: false` to opt out). The returned setter lets you drive values from props too — it's just `useState`.

## Works with anything

The panel doesn't know or care what it's driving. `config` is a plain object; wire it wherever a value belongs.

| Use it for | Wire `config` into |
|---|---|
| Canvas / WebGL | your draw loop or uniforms |
| Three.js / R3F | `useFrame`, material uniforms (see [Shaders](#shaders)) |
| Simulations | the per-step parameters |
| Layout / motion | CSS custom properties or transform math |
| Dashboards / data viz | scales, thresholds, series config |

## Field types

Each field maps a `key` in your config to a control. Beyond the basics:

| `type` | Control |
|---|---|
| `slider` | Draggable track with an editable value box; flick to throw. |
| `color` | Swatch → dark popover with a saturation/hue picker, hex input, and an optional color library. |
| `toggle` / `toggle-group` | Boolean switch / segmented control. |
| `select` | Custom dropdown, keyboard-navigable. |
| `vec2` | Paired sliders for an `[x, y]` tuple. |
| `gradient-stops` | Draggable multi-stop gradient / 2D hotspot editor. |
| `stripe-table` | Editable color-stop table with reorder, flip, and easing. |
| `image` / `path` | Image upload, point-path editor. |
| `collection` / `reference` | Managed item lists and cross-item links. |
| `presets` / `action` | One-click value sets and custom buttons. |
| `section` | A collapsible group heading. |

Compose them in the `fields` array; nest with `section`.

## The panel

- **Floats, docks, resizes.** Drag the header to move it (throw it and it coasts to an edge), grab any edge or corner to resize, two-finger swipe the header to fling it to a side. Opens centered on the right of tall viewports, top-right otherwise.
- **Config tools.** Copy, paste, or reset the whole config, or edit it as live JSON — built into every panel.
- **Keyboard throughout.** Arrow/Enter/Escape in dropdowns, the color library, and sub-popups.
- **Theming.** Dark and light out of the box; override any `--panel-*` CSS custom property to restyle.
- **Reduced-motion aware** — every animation honors `prefers-reduced-motion`.

## Shaders

Shaders are a first-class use — the `@tjcages/panels/shader` entry adds adapters that turn `config` into uniforms and stay live in production:

```tsx
import { usePanel } from "@tjcages/panels"
import { createWebGLAdapter } from "@tjcages/panels/shader"

const toUniforms = createWebGLAdapter<Config>({ fields: FIELDS }) // hex → vec3, etc.

const [config] = usePanel({ id: "my-shader", title: "My shader", defaults, fields })
mount.setUniforms(toUniforms(config))
```

`createR3FAdapter` does the same for React Three Fiber, mutating `.value` slots in place. `hexToRgb01` and `patchShaderConfigDefaults` are also on the subpath. These stay functional in production builds even though the panel UI does not.

## Recipes

Copy-paste integrations live in [`examples/`](./examples) (shader/WebGL, R3F, map+POIs, dashboard, settings). They are not a running playground.

## Production

The package resolves to a **~5 KB no-op** under the `production` build condition — `usePanel` still returns your defaults, the shader adapters still work, and nothing else ships. Force the full panel in any environment by importing from `@tjcages/panels/dev`.

## Manual mount

Prefer to control where the panel renders? Pass `autoMount: false` and render `<PanelRoot/>` yourself, or drive a `<FloatingPanel float />` with `renderPanelField` for a fully custom shell. See the exported types for the full surface.

## License

MIT
