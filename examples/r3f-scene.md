# R3F scene

Tune a React Three Fiber material. `createR3FAdapter` mutates uniform `.value` slots in place (colors / vec2 with `.set` are updated, not replaced).

**Edit:** the R3F component that owns the material (e.g. `src/scene/WaveMesh.tsx`). Peers: `three`, `@react-three/fiber` (already required for R3F). Overlay / drag helpers are not needed here.

```tsx
import { useEffect, useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import { Color, type IUniform } from "three"
import { usePanel, usePanelFrame, type PanelField } from "@tjcages/panels"
import { createR3FAdapter, PanelClock } from "@tjcages/panels/shader"

type Config = {
  amplitude: number
  frequency: number
  tint: string
  wireframe: boolean
}

const DEFAULTS: Config = {
  amplitude: 0.4,
  frequency: 2,
  tint: "#4cc9f0",
  wireframe: false,
}

const FIELDS: PanelField<Config>[] = [
  { type: "section", title: "Wave" },
  { type: "slider", key: "amplitude", label: "Amplitude", min: 0, max: 2, step: 0.01 },
  { type: "slider", key: "frequency", label: "Frequency", min: 0.1, max: 8, step: 0.1 },
  { type: "color", key: "tint", label: "Tint" },
  { type: "toggle", key: "wireframe", label: "Wireframe" },
]

export function WaveScene() {
  const [config] = usePanel({
    id: "wave",
    title: "Wave",
    defaults: DEFAULTS,
    fields: FIELDS,
  })

  return (
    <Canvas frameloop="demand">
      <PanelClock />
      <WaveMesh config={config} />
    </Canvas>
  )
}

function WaveMesh({ config }: { config: Config }) {
  const uniforms = useMemo(
    () =>
      ({
        u_amplitude: { value: DEFAULTS.amplitude },
        u_frequency: { value: DEFAULTS.frequency },
        u_tint: { value: new Color(DEFAULTS.tint) },
        u_time: { value: 0 },
      }) satisfies Record<string, IUniform>,
    [],
  )

  const apply = useMemo(
    () => createR3FAdapter<Config>({ uniforms, fields: FIELDS }),
    [uniforms],
  )

  useEffect(() => {
    apply(config)
  }, [apply, config])

  // Skip elapsed time as a panel field. Sample the panel clock instead:
  // delta is 0 while paused; step/seek still produce a real delta.
  usePanelFrame(({ time, delta }) => {
    if (delta === 0) return
    uniforms.u_time.value = time
  })

  return (
    <mesh>
      <planeGeometry args={[4, 4, 64, 64]} />
      <shaderMaterial
        uniforms={uniforms}
        wireframe={config.wireframe}
        vertexShader="/* sample u_amplitude / u_frequency / u_time */"
        fragmentShader="/* sample u_tint */"
      />
    </mesh>
  )
}
```

Persists to `panels:wave`.

`<PanelClock />` must render **inside** `<Canvas frameloop="demand">`. Without it, a paused or demand canvas will not step. For a continuously looping canvas (`frameloop="always"`), you can still drop it in — it only calls `invalidate()` when delta is non-zero.

Drive host logic (physics, not projection) with `usePanelFrame` from `@tjcages/panels` in a component outside the canvas if you need `delta === 0` while paused.

**Production:** adapters stay live; `PanelClock` no-ops; `usePanel` returns defaults-backed local state.

**Verify:** drag Amplitude → the mesh deforms; pause stops the demand loop; reload keeps edits.
