# `usePanel` — API design

Status: **shipped** (Phase 1–2, OFF-127 / OFF-129). `usePanel` is the public API. This doc is the contract it was built to.

## Goal

One general hook. `usePanel` owns *any* React state and is the public entry point. Shaders are one optional adapter, not the center. The old shader-shaped surface (`useShaderDev`, `ShaderDevValues`, uniform assumptions) is replaced. **Simpler is the bar** — fewer names, one obvious entry point.

## Signature

```ts
function usePanel<T extends PanelState>(
  options: UsePanelOptions<T>,
): readonly [T, SetPanelState<T>]

type PanelState = Record<string, unknown>
type SetPanelState<T> = (next: T | ((prev: T) => T)) => void   // useState-style

type UsePanelOptions<T extends PanelState> = {
  id: string
  title: string
  defaults: T
  fields: PanelField<T>[]

  side?: "left" | "right"          // default "right"
  persist?: boolean                // default true
  prompts?: PanelPrompt[]          // default [] (no AI rail unless you add one)
  actionHandlers?: Record<string, () => void>
  onWriteConfig?: (values: T) => Promise<PanelWriteResult>
  writeLabel?: string

  autoMount?: boolean              // default true — injects the panel for you
  defaultTheme?: PanelTheme
  defaultOpen?: boolean
}
```

Usage is unchanged in spirit from `useShaderDev`, just general:

```tsx
const [state, setState] = usePanel({
  id: "home-canvas",
  title: "Canvas",
  defaults: DEFAULTS,
  fields: FIELDS,
})
// feed `state` to your thing; call setState(next) or setState(prev => ...) to update
```

## What changes vs `useShaderDev`

| Today | Panels | Why |
|---|---|---|
| `useShaderDev` | `usePanel` | Not shader-specific |
| `ShaderDevValues` | `PanelState` | Any record, not "uniform values" |
| `ShaderDevFieldDef<T>` | `PanelField<T>` | Shorter, general |
| `ShaderDevRegistration<T>` | `PanelRegistration<T>` | — |
| `(next: T) => void` setter | `(next \| (prev => next))` | useState-style; small ergonomic win |
| default `prompts` = 6 shader briefs | default `prompts` = `[]` | Core carries no shader content |
| single `.` entry | `.` (core) + `./shader` | Shaders are an add-on |

The **field schema itself is already general** — `slider / color / toggle / select / vec2 / image / path / action / presets / section`. It needs no shader concepts to work; it just gets renamed. New field types (`collection`, `reference`) arrive in Phase 3.

## Shaders become an adapter

Everything shader/Three-specific moves to a subpath:

```tsx
import { usePanel } from "@tjcages/panels"
import { createR3FAdapter } from "@tjcages/panels/shader"

const [state] = usePanel({ id, title, defaults, fields })
const apply = useMemo(() => createR3FAdapter({ uniforms, fields }), [uniforms])
useEffect(() => apply(state), [state, apply])
```

The core (`@tjcages/panels`) imports nothing from Three.js / WebGL. `createWebGLAdapter`, `createR3FAdapter`, and the shader AI prompts live in `@tjcages/panels/shader`.

## Back-compat: `useShaderDev` stays (deprecated)

`shader-panel` users keep working. `useShaderDev` becomes a thin wrapper that defaults the shader AI-prompt rail on:

```ts
/** @deprecated Use `usePanel` from "@tjcages/panels". */
export function useShaderDev<T extends PanelState>(o: UseShaderDevOptions<T>) {
  return usePanel<T>({ prompts: DEFAULT_SHADER_PROMPTS, ...o })
}
```

Exported from `@tjcages/panels/shader` (and re-exported from the deprecated `shader-panel` package) so the core stays clean. One deprecation cycle, then it's removed at 1.0.

## Open questions (resolve during Phase 2)

- **`state` vs `defaults` naming.** Keep `defaults` (matches useState mental model) — the live value is what the hook returns. No separate `state` prop. ✅ decided.
- **Controlled mode.** Do we need a `value` / `onChange` controlled variant for hosts that own state elsewhere? `registerPanel` (the low-level API, renamed from `registerShaderDev`) already covers this; `usePanel` stays uncontrolled. Lean: yes, keep the split.
- **Prompts default.** Core default `[]`; the `./shader` `useShaderDev` alias re-enables the briefs. ✅ decided.

## Touched code (for Phase 2 / OFF-128, OFF-129)

- `src/types.ts` — `ShaderDev*Field` → `Panel*Field`, `ShaderDevFieldDef` → `PanelField`.
- `src/store.ts` — `ShaderDevRegistration/Values` → `PanelRegistration/State`; `registerShaderDev` → `registerPanel`.
- `src/hooks/use-shader-dev.ts` → `src/hooks/use-panel.ts`; old file re-exports the deprecated alias.
- `src/index.ts` — new primary exports; `./shader` subpath entry for adapters + `useShaderDev`.
- Internal `sd-` CSS prefix / `data-shader-dev` / storage keys → `panel-` equivalents with read-shims (OFF-128).
