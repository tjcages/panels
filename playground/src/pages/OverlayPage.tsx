import { useLayoutEffect, useRef } from "react"
import {
  createOverlayProjector,
  selectPanelCollectionItem,
  usePanel,
  type PanelCollectionItem,
  type PanelField,
} from "@tjcages/panels"
import { DocsPage } from "./DocsPage"

type Pin = {
  id: string
  x: number
  y: number
  label: string
  visible: boolean
}

type MapConfig = { pins: Pin[] }

const DEFAULTS: MapConfig = {
  pins: [
    { id: "north", x: 0.28, y: 0.32, label: "North", visible: true },
    { id: "south", x: 0.68, y: 0.62, label: "South", visible: true },
  ],
}

const FIELDS: PanelField<MapConfig>[] = [
  {
    type: "collection",
    key: "pins",
    label: "Pins",
    itemLabel: (item) => ("label" in item ? String(item.label) : item.id),
    min: 1,
    max: 8,
    newItem: () => ({
      x: 0.5,
      y: 0.5,
      label: "Pin",
      visible: true,
    }),
    itemFields: [
      { type: "slider", key: "x", label: "X", min: 0, max: 1, step: 0.01 },
      { type: "slider", key: "y", label: "Y", min: 0, max: 1, step: 0.01 },
      { type: "toggle", key: "visible", label: "Visible" },
    ] as unknown as PanelField<PanelCollectionItem>[],
  },
]

export function OverlayPage() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pinsRef = useRef(DEFAULTS.pins)

  const [map] = usePanel({
    id: "overlay-map",
    title: "Overlay",
    defaults: DEFAULTS,
    fields: FIELDS,
    defaultOpen: true,
  })

  pinsRef.current = map.pins
  const pinKey = map.pins.map((pin) => pin.id).join(",")

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const projector = createOverlayProjector(
      {
        project: (world) => {
          const rect = canvas.getBoundingClientRect()
          return {
            x: world[0] * rect.width,
            y: world[1] * rect.height,
            visible: true,
          }
        },
        onFrame: (cb) => {
          let frame = 0
          let last = performance.now()
          const tick = (now: number) => {
            cb({ time: now / 1000, delta: (now - last) / 1000 })
            last = now
            paint(canvas, pinsRef.current)
            for (const pin of pinsRef.current) {
              const node = wrap.querySelector(
                `.overlay-pin[data-pin-id="${pin.id}"]`,
              )
              if (node && node.textContent !== pin.label) {
                node.textContent = pin.label
              }
            }
            frame = requestAnimationFrame(tick)
          }
          frame = requestAnimationFrame(tick)
          return () => cancelAnimationFrame(frame)
        },
      },
      { container: wrap },
    )

    const unregisters = pinKey.split(",").filter(Boolean).map((id) => {
      const node = document.createElement("button")
      node.type = "button"
      node.className = "overlay-pin"
      node.dataset.pinId = id
      node.textContent =
        pinsRef.current.find((item) => item.id === id)?.label ?? id
      node.addEventListener("click", () => {
        selectPanelCollectionItem("overlay-map", "pins", id)
      })
      const stop = projector.register({
        id,
        node,
        getWorld: () => {
          const current = pinsRef.current.find((item) => item.id === id)
          return [current?.x ?? 0.5, current?.y ?? 0.5, 0] as const
        },
        get visible() {
          return pinsRef.current.find((item) => item.id === id)?.visible !== false
        },
      })
      return () => {
        stop()
        node.remove()
      }
    })

    return () => {
      for (const unregister of unregisters) unregister()
      projector.destroy()
    }
  }, [pinKey])

  return (
    <DocsPage
      kicker="Docs"
      title="Overlay"
      lede="createOverlayProjector pins DOM nodes to scene positions. Click a pin to open its collection row. R3F ships PanelOverlay on /shader; this page uses the core 2D binding."
    >
      <div id="overlay-stage" className="overlay-stage" ref={wrapRef}>
        <canvas ref={canvasRef} width={720} height={360} aria-label="Map" />
      </div>
      <p className="muted">
        Selection store: <code>selectPanelCollectionItem(panelId, collectionKey, itemId)</code>{" "}
        — not <code>usePanel.onSelect</code>.
      </p>
    </DocsPage>
  )
}

function paint(canvas: HTMLCanvasElement, pins: Pin[]) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const { width, height } = canvas
  ctx.fillStyle = "#101218"
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = "#2a2d33"
  for (let i = 1; i < 8; i++) {
    ctx.beginPath()
    ctx.moveTo((i / 8) * width, 0)
    ctx.lineTo((i / 8) * width, height)
    ctx.moveTo(0, (i / 8) * height)
    ctx.lineTo(width, (i / 8) * height)
    ctx.stroke()
  }
  for (const pin of pins) {
    if (!pin.visible) continue
    ctx.beginPath()
    ctx.fillStyle = "#ff5e1f"
    ctx.arc(pin.x * width, pin.y * height, 5, 0, Math.PI * 2)
    ctx.fill()
  }
}
