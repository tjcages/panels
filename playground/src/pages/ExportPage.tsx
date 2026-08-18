import { useEffect, useRef } from "react"
import {
  registerPanelCapture,
  usePanel,
  type PanelField,
} from "@tjcages/panels"
import { DocsPage } from "./DocsPage"

type Scene = { hue: number; count: number; glow: boolean }

const DEFAULTS: Scene = { hue: 18, count: 12, glow: true }

const FIELDS: PanelField<Scene>[] = [
  { type: "slider", key: "hue", label: "Hue", min: 0, max: 360, step: 1 },
  { type: "slider", key: "count", label: "Dots", min: 3, max: 40, step: 1 },
  { type: "toggle", key: "glow", label: "Glow" },
]

export function ExportPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef(DEFAULTS)
  const [scene] = usePanel({
    id: "export-scene",
    title: "Export",
    defaults: DEFAULTS,
    fields: FIELDS,
    defaultOpen: true,
  })
  sceneRef.current = scene

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let frame = 0
    const tick = () => {
      draw(canvas, sceneRef.current)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    const stopCapture = registerPanelCapture(async ({ maxEdge }) => {
      const source = canvasRef.current
      if (!source) throw new Error("No canvas")
      const scale = maxEdge / Math.max(source.width, source.height)
      const out = document.createElement("canvas")
      out.width = Math.round(source.width * scale)
      out.height = Math.round(source.height * scale)
      const ctx = out.getContext("2d")
      if (!ctx) throw new Error("No 2d context")
      ctx.drawImage(source, 0, 0, out.width, out.height)
      const blob = await new Promise<Blob | null>((resolve) =>
        out.toBlob(resolve, "image/png"),
      )
      if (!blob) throw new Error("toBlob failed")
      return blob
    })

    return () => {
      cancelAnimationFrame(frame)
      stopCapture()
    }
  }, [])

  return (
    <DocsPage
      kicker="Docs"
      title="Export"
      lede="The export footer has no handle on your renderer. Register host functions. Prefer registerPanel* names; registerShader* aliases stay."
    >
      <canvas
        ref={canvasRef}
        className="export-canvas"
        width={720}
        height={280}
        aria-label="Export target"
      />
      <table className="docs-table">
        <thead>
          <tr>
            <th>export</th>
            <th>register</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Hi-res PNG</td>
            <td>registerPanelCapture</td>
          </tr>
          <tr>
            <td>GIF</td>
            <td>registerPanelGifExport</td>
          </tr>
          <tr>
            <td>Video session</td>
            <td>registerPanelVideoExport</td>
          </tr>
          <tr>
            <td>Record canvas</td>
            <td>registerPanelRecordCanvas</td>
          </tr>
        </tbody>
      </table>
      <p className="muted">
        Composite overlay + canvas with <code>compositeCaptureFrame</code>. If
        nothing is registered, PNG falls back to the largest page canvas. Open
        the panel footer and export PNG from this page — it uses the registered
        capture.
      </p>
    </DocsPage>
  )
}

function draw(canvas: HTMLCanvasElement, scene: Scene) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const { width, height } = canvas
  ctx.fillStyle = "#101218"
  ctx.fillRect(0, 0, width, height)
  const cx = width / 2
  const cy = height / 2
  for (let i = 0; i < scene.count; i++) {
    const a = (i / scene.count) * Math.PI * 2
    const r = 70 + (i % 3) * 18
    ctx.beginPath()
    ctx.fillStyle = `hsl(${scene.hue + i * 8} 80% 58%)`
    ctx.globalAlpha = scene.glow ? 0.85 : 1
    ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, scene.glow ? 8 : 5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}
