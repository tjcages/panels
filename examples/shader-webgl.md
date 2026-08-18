# Shader / WebGL

Tune a fragment shader (raw WebGL, `ShaderMount`, or any `setUniforms` host). Adapters map slider / color / toggle / select / vec2 only — keep collections and the rest off this field list.

**Edit:** the component that owns the shader mount (e.g. `src/shaders/Particles.tsx`). Optional: the GLSL files it already imports.

```tsx
import { useEffect, useRef } from "react"
import { usePanel, usePanelFrame, type PanelField } from "@tjcages/panels"
import { createWebGLAdapter } from "@tjcages/panels/shader"

type Config = {
  speed: number
  count: number
  tint: string
  trails: boolean
}

const DEFAULTS: Config = { speed: 1, count: 24, tint: "#ff5e1f", trails: true }

const FIELDS: PanelField<Config>[] = [
  { type: "section", title: "Motion" },
  { type: "slider", key: "speed", label: "Speed", min: 0, max: 4, step: 0.01 },
  { type: "slider", key: "count", label: "Count", min: 1, max: 200, step: 1 },
  { type: "toggle", key: "trails", label: "Trails" },
  { type: "section", title: "Look" },
  { type: "color", key: "tint", label: "Tint" },
]

const toUniforms = createWebGLAdapter<Config>({ fields: FIELDS })
// hex → [r,g,b] in 0–1; booleans → 0/1. Uniform names default to u_<key>.

export function Particles() {
  const mountRef = useRef<{ setUniforms: (u: Record<string, unknown>) => void } | null>(null)
  const [config] = usePanel({
    id: "particles",
    title: "Particles",
    defaults: DEFAULTS,
    fields: FIELDS,
  })

  useEffect(() => {
    mountRef.current?.setUniforms(toUniforms(config))
  }, [config])

  // Honor the panel clock: delta is 0 while paused; step/seek still produce a real delta.
  usePanelFrame(({ time, delta }) => {
    if (delta === 0) return
    mountRef.current?.setUniforms({ ...toUniforms(config), u_time: time })
  })

  return <canvas ref={(el) => { /* assign your ShaderMount / gl program to mountRef */ void el }} />
}
```

Persists to `localStorage` key `panels:particles`.

**Optional — hi-res PNG.** Register from `@tjcages/panels` and return the unsubscribe. Prefer `registerPanelCapture` when it is on the package export; `registerShaderCapture` is the same function (deprecated alias) and is always importable:

```tsx
import { useEffect } from "react"
import { registerPanelCapture } from "@tjcages/panels"
// Fallback if your types only export the alias:
// import { registerShaderCapture as registerPanelCapture } from "@tjcages/panels"

useEffect(() => {
  return registerPanelCapture(async ({ maxEdge }) => {
    // Re-render at maxEdge (clamp to the GPU limit, keep aspect) → PNG Blob.
    return new Blob()
  })
}, [])
```

GIF / video / record-canvas: `registerPanelGifExport` / `registerPanelVideoExport` / `registerPanelRecordCanvas` / `registerPanelRecordPrepare` / `registerPanelRecordFrame` (each has a `registerShader*` alias). If nothing is registered, PNG falls back to the largest `<canvas>` at screen resolution.

**AI prompt rail:** `useShaderPanel` from `@tjcages/panels/shader` is `usePanel` with prompts on. Pass `prompts: []` to hide.

**Production:** `usePanel` becomes local state seeded from `defaults`. `createWebGLAdapter` stays live.

**Verify:** drag Speed → the shader changes; reload keeps the value; pause freezes motion (`delta === 0`) without tearing down the program.
