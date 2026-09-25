import "@fontsource/inter/400.css"
import "@fontsource/inter/500.css"
import "@fontsource/inter/600.css"
import { StrictMode, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import {
  ControlSection,
  FloatingPanel,
  renderPanelField,
  usePanel,
  usePanelShortcut,
  type ColorLibrary,
  type PanelCollectionItem,
  type PanelField,
} from "@tjcages/panels"
import "./style.css"

// Accessory context: a line-wave field the panel drives. The panel is the
// real package; this canvas only exists to show what the values change.

type Ribbon = { id: string; color: string; lift: number; visible: boolean }

type Scene = {
  speed: number
  amplitude: number
  lines: number
  twist: number
  tint: string
  backdrop: "light" | "dark"
  ribbons: Ribbon[]
}

const LIBRARY: ColorLibrary = [
  {
    name: "Orange",
    colors: [
      { label: "500", hex: "#ff5e1f" },
      { label: "800", hex: "#fea700" },
    ],
  },
  {
    name: "Pink",
    colors: [
      { label: "500", hex: "#f72585" },
      { label: "300", hex: "#ff8fab" },
    ],
  },
  {
    name: "Violet",
    colors: [
      { label: "500", hex: "#7c3aed" },
      { label: "300", hex: "#b197fc" },
    ],
  },
  {
    name: "Blue",
    colors: [
      { label: "500", hex: "#2f6bff" },
      { label: "300", hex: "#4cc9f0" },
    ],
  },
  {
    name: "Green",
    colors: [
      { label: "500", hex: "#16a34a" },
      { label: "300", hex: "#80ed99" },
    ],
  },
]

const DEFAULTS: Scene = {
  speed: 0.6,
  amplitude: 0.55,
  lines: 36,
  twist: 0.25,
  tint: "#ff5e1f",
  backdrop: "light",
  ribbons: [{ id: "base", color: "#fea700", lift: 0, visible: true }],
}

const FIELDS: PanelField<Scene>[] = [
  { type: "section", title: "Motion" },
  { type: "slider", key: "speed", label: "Speed", min: 0, max: 3, step: 0.01 },
  { type: "slider", key: "amplitude", label: "Amplitude", min: 0, max: 1.5, step: 0.01 },
  { type: "slider", key: "lines", label: "Lines", min: 4, max: 96, step: 1 },
  { type: "slider", key: "twist", label: "Twist", min: 0, max: 1, step: 0.01 },
  { type: "section", title: "Look" },
  { type: "color", key: "tint", label: "Tint", library: LIBRARY },
  {
    type: "toggle-group",
    key: "backdrop",
    label: "Backdrop",
    options: [
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
    ],
  },
  { type: "section", title: "Ribbons" },
  {
    type: "collection",
    key: "ribbons",
    label: "Ribbons",
    itemLabel: (item) => ("color" in item ? `Ribbon ${String(item.color).toUpperCase()}` : item.id),
    min: 1,
    max: 5,
    newItem: () => ({ color: "#2f6bff", lift: -0.22, visible: true }),
    itemFields: [
      { type: "color", key: "color", label: "Color", library: LIBRARY },
      { type: "slider", key: "lift", label: "Lift", min: -0.5, max: 0.5, step: 0.01 },
      { type: "toggle", key: "visible", label: "Visible" },
    ] as unknown as PanelField<PanelCollectionItem>[],
  },
]

function Waves({ scene }: { scene: Scene }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef(scene)
  sceneRef.current = scene

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let raf = 0
    let phase = 0
    let last = performance.now()
    const draw = (now: number) => {
      const s = sceneRef.current
      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== Math.round(w * dpr)) {
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
      }
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      phase += dt * s.speed
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.lineWidth = 1.6
      const ribbons = s.ribbons.filter((r) => r.visible)
      ribbons.forEach((r, ri) => {
        const base = h * (0.6 - r.lift)
        for (let j = 0; j < s.lines; j++) {
          const k = j / Math.max(1, s.lines - 1)
          ctx.strokeStyle = mix(s.tint, r.color, k)
          ctx.globalAlpha = 0.35 + 0.65 * Math.sin(k * Math.PI)
          ctx.beginPath()
          for (let x = -20; x <= w + 20; x += 12) {
            const u = x / w
            const y =
              base +
              (k - 0.5) * h * 0.34 +
              Math.sin(u * 5.2 + phase * 1.7 + k * s.twist * 9 + ri) * h * 0.12 * s.amplitude +
              Math.sin(u * 2.1 - phase * 1.1 + k * 2) * h * 0.06 * s.amplitude
            if (x === -20) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()
        }
      })
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={ref} className="waves" />
}

function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ch = (p: number, s: number) => (p >> s) & 255
  const c = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t)
  return `rgb(${c(16)}, ${c(8)}, ${c(0)})`
}

// Shots start from the state the previous shot ended on: ?s=<json overrides>.
function initialScene(params: URLSearchParams): Scene {
  const raw = params.get("s")
  return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Scene>) } : DEFAULTS
}

function App() {
  const params = new URLSearchParams(window.location.search)
  const [open, setOpen] = useState(params.get("open") !== "0")
  const [scene, setScene] = usePanel<Scene>({
    id: "waves",
    title: "Waves",
    defaults: initialScene(params),
    fields: FIELDS,
    autoMount: false,
    persist: false,
  })
  const [selection, setSelection] = useState<Record<string, string | null>>({})
  // The recorder reads the end state so the next shot starts from it.
  useEffect(() => {
    ;(window as unknown as { __scene: Scene }).__scene = scene
  }, [scene])
  const toggle = useCallback(() => setOpen((v) => !v), [])
  usePanelShortcut(toggle)

  const setValues = useCallback((next: Record<string, unknown>) => setScene(next as Scene), [setScene])

  const sections = useMemo(() => {
    const out: { title: string; nodes: React.ReactNode[] }[] = []
    const values = scene as unknown as Record<string, unknown>
    for (const field of FIELDS) {
      if (field.type === "section") {
        out.push({ title: field.title, nodes: [] })
        continue
      }
      const rendered = renderPanelField(field as never, {
        values,
        setValues,
        rootValues: values,
        setRootValues: setValues,
        onCollectionSelect: (key, id) => setSelection((s) => ({ ...s, [key]: id })),
        collectionSelection: selection,
      })
      if (!rendered) continue
      out[out.length - 1].nodes.push(
        <div key={rendered.reactKey} className="panel-field">
          {rendered.node}
        </div>,
      )
    }
    return out
  }, [scene, selection, setValues])

  return (
    <div className="stage" data-backdrop={scene.backdrop}>
      <Waves scene={scene} />
      <FloatingPanel
        float
        side="right"
        title="Waves"
        collapsed={!open}
        onToggle={toggle}
        defaultTheme="dark"
        showThemeToggle={false}
      >
        <div className="panel-fields">
          {sections.map((section) => (
            <ControlSection key={section.title} title={section.title}>
              {section.nodes}
            </ControlSection>
          ))}
        </div>
      </FloatingPanel>
    </div>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
