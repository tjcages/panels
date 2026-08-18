# shader-panel

[![npm version](https://img.shields.io/npm/v/shader-panel.svg)](https://www.npmjs.com/package/shader-panel) [![bundle size](https://img.shields.io/bundlephobia/minzip/shader-panel?label=min%2Bgzip)](https://bundlephobia.com/package/shader-panel) [![license](https://img.shields.io/npm/l/shader-panel.svg)](./LICENSE)

A floating panel for tweaking shader uniforms live — sliders, color pickers, copy/paste JSON. Works with any **WebGL**, **Three.js**, or **React Three Fiber** shader.

<p align="center">
  <img src="https://raw.githubusercontent.com/tjcages/panels/main/assets/hero.webp" alt="Panels — a floating dev panel open over a shader" width="720">
</p>

No CSS framework, no animation library, two peer deps (`react`, `react-dom`), and it compiles out of production builds (~5 KB no-op). Toggle with <kbd>⌘⌥D</kbd>.

```sh
npm install shader-panel
```

## Set it up in seconds

Open your shader file in Cursor / Claude Code and paste **[the setup prompt »](https://github.com/tjcages/shader-panel/blob/main/SETUP_PROMPT.md)**. It detects the renderer, finds your tweakable uniforms, builds the panel, and wires up the hook — nothing to configure.

## Or wire it by hand

One hook. It owns the state, registers the shader, and injects the panel — no `<ShaderDevRoot/>`, no extra files.

```tsx
import { useShaderDev, type ShaderDevFieldDef } from "shader-panel"

type Config = { speed: number; bgColor: string }
const DEFAULTS: Config = { speed: 1, bgColor: "#ff5e1f" }

const FIELDS: ShaderDevFieldDef<Config>[] = [
  { type: "section", title: "Animation" },
  { type: "slider", key: "speed", label: "Speed", min: 0, max: 2, step: 0.01 },
  { type: "color", key: "bgColor", label: "Background" },
]

export function MyShader() {
  const [config] = useShaderDev({
    id: "my-shader",
    title: "My shader",
    defaults: DEFAULTS,
    fields: FIELDS,
  })

  // feed `config` to your shader — Three.js uniforms, mount.setUniforms(...), a useFrame ref
}
```

`config` updates as you drag. That's it. (Prefer to mount the panel yourself? See [Manual mount](#manual-mount).)

## Field types

```ts
type ShaderDevFieldDef<T> =
  | { type: "section"; title: string }
  | { type: "slider"; key; label; min; max; step }
  | { type: "color";  key; label }                       // "#rrggbb"
  | { type: "toggle"; key; label }                       // boolean
  | { type: "select"; key; label; options: {value; label}[] }
  | { type: "vec2";   key; label; min; max; step }       // [x, y]
```

Fields are grouped by `section` headers (collapsible). Anything before the first section lands under "Parameters".

## What you get for free

- **Multi-shader switcher** — use the hook in several components and a dropdown appears to flip between them.
- **Saves to localStorage** — edits survive reload automatically. "Reset to defaults" clears them; opt out with `persist: false`.
- **Copy / Paste JSON** — share a look with a teammate; paste merges known keys.
- **Per-section reset** — hover a section header for a `↻` that resets just that group.
- **AI prompts** — a row of copy-paste prompts (improve quality, optimize GPU, find bugs, reduce shimmer, …) written as expert briefs. Click to copy, paste into Cursor / Claude. Customize with `prompts: [...]` or hide with `prompts: []`.

## Adapters — skip the uniform boilerplate

Generate the `config → uniforms` mapping from your field schema instead of writing it by hand.

**WebGL / [`@paper-design/shaders`](https://github.com/paper-design/shaders):**

```tsx
import { createWebGLAdapter } from "shader-panel"

const toUniforms = createWebGLAdapter<Config>({ fields: FIELDS })
useEffect(() => mount.setUniforms(toUniforms(config)), [config])
```

**React Three Fiber** (mutates `.value` slots in place — no recompile):

```tsx
import { createR3FAdapter } from "shader-panel"

const apply = useMemo(() => createR3FAdapter<Config>({ uniforms, fields: FIELDS }), [uniforms])
useEffect(() => apply(config), [config, apply])
```

Colors auto-convert (hex → vec3 / `THREE.Color`), vec2s become `[x,y]` / `Vector2`. Uniform names default to `u_<key>`; override with `mapping: { bgColor: "u_bg" }`.

## Production builds

Bundlers building with `NODE_ENV=production` automatically resolve a tiny no-op stub via package `exports` conditions — the panel UI drops out (`ShaderDevRoot` → `null`, `registerShaderDev` → no-op), but the adapters and helpers you use at runtime stay intact. ~63 KB dev → ~5 KB prod.

Need the panel in a production build (e.g. staging)? Import from the `/dev` subpath:

```ts
import { ShaderDevRoot } from "shader-panel/dev"
```

---

<details id="manual-mount">
<summary><strong>Manual mount (without the hook)</strong></summary>

<br>

Prefer to own the wiring? Pass `autoMount: false` to the hook (or skip it entirely with `registerShaderDev`) and render the panel root yourself — once, anywhere (it portals to `<body>`):

```tsx
import { ShaderDevRoot, registerShaderDev } from "shader-panel"

// once, e.g. in your layout
<ShaderDevRoot />

// in the shader component
useEffect(() => registerShaderDev({
  id: "my-shader", title: "My shader",
  values: config, defaults: DEFAULTS, fields: FIELDS, onChange: setConfig,
}), [config])
```

`registerShaderDev` returns an unregister fn if you want it as the effect cleanup.

</details>

<details>
<summary><strong>Theming</strong></summary>

<br>

Light + dark auto-switch based on `html.dark` and OS preference. Override any color with CSS variables on the scoped root:

```css
[data-shader-dev] {
  --sd-bg: rgba(20, 20, 20, 0.92);
  --sd-text: #f5f5f5;
  --sd-handle: #00ff95;
  /* ~20 tunables — see src/styles.ts */
}
```

Force a theme per mount: `<ShaderDevRoot defaultTheme="light" />`.

</details>

<details>
<summary><strong>Write edits back to your source file</strong></summary>

<br>

Wrap your defaults in marker comments:

```ts
// @shader-config-start
export const MY_SHADER_DEFAULTS = { speed: 1.0 } as const
// @shader-config-end
```

Pass `onWriteConfig` to `registerShaderDev`, and on your dev server use `patchShaderConfigDefaults(source, "MY_SHADER_DEFAULTS", json)` to rewrite the block. A "Write config file" button appears in the panel.

</details>

<details>
<summary><strong>API reference</strong></summary>

<br>

| Export | Purpose |
| --- | --- |
| `useShaderDev({ id, title, defaults, fields, ... })` | The one-call hook. Owns state, registers, auto-injects the panel. Returns `[config, setConfig]`. |
| `registerShaderDev(reg)` | Lower-level: register a shader manually. Returns an unregister fn. Pair with `<ShaderDevRoot/>`. |
| `ShaderDevRoot` | The panel root. Rendered for you by the hook; mount it yourself only with `autoMount: false`. |
| `createWebGLAdapter({ fields, mapping?, prefix? })` | Returns `(config) => uniforms` for WebGL / `ShaderMount`. |
| `createR3FAdapter({ uniforms, fields, mapping? })` | Returns `apply(config)` that mutates Three.js `.value` slots. |
| `hexToRgb01(hex)` | `"#rrggbb"` → `[r,g,b]` in `[0,1]`. |
| `loadPersistedShaderDevValues(id, defaults)` | Manual localStorage hydration (the hook does this for you). |
| `patchShaderConfigDefaults(src, name, json)` | Rewrites a defaults block between `@shader-config-start/end` markers. |
| `setActiveShaderDev` / `getActiveShaderDev` / `getShaderDevRegistrations` | Multi-shader registry access. |
| `DEFAULT_SHADER_DEV_PROMPTS` / `fillShaderDevPrompt` | The built-in AI prompts + the `{{shader}}` token filler. |
| `ShaderDevPanel` / `ControlSlider` / `ControlColorInput` / … | Low-level primitives if you don't want the floating panel. |

</details>

## License

MIT
