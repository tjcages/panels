/**
 * `createOverlayProjector` (OFF-138) — renderer-agnostic core.
 *
 * Owns a single absolutely-positioned overlay layer (`pointer-events: none`)
 * meant to sit over the canvas. Register anchors; on each `binding.onFrame`
 * every anchor is `project()`ed and its node repositioned with
 * `transform: translate(...)`. Anchors that project `null` / `visible: false` /
 * behind-camera get `visibility: hidden`.
 *
 * Per the house perf rules this writes ONLY transform / visibility — never
 * top/left/width or any layout-thrashing property.
 *
 * This module imports nothing from `three` / `@react-three/fiber` — the whole
 * point of the binding indirection. The R3F binding lives in
 * `@tjcages/panels/shader`.
 */

import type {
  OverlayAnchor,
  OverlayProjector,
  OverlayProjectorOptions,
  RendererBinding,
} from "./types"

type RegisteredAnchor = {
  anchor: OverlayAnchor
  /** Last visibility written, so we only touch the DOM on change. */
  lastVisible: boolean
}

function createLayer(): HTMLElement {
  const layer = document.createElement("div")
  layer.className = "panel-overlay-layer"
  // Inline fallbacks so the projector works even if PANEL_CSS was never
  // injected — the class carries the same rules for the styled path.
  layer.style.position = "absolute"
  layer.style.inset = "0"
  layer.style.pointerEvents = "none"
  layer.style.overflow = "visible"
  return layer
}

/**
 * Create an overlay projector bound to a renderer.
 *
 * ```ts
 * const projector = createOverlayProjector(binding, { container })
 * const unregister = projector.register({ id, getWorld, node })
 * // …later
 * projector.destroy()
 * ```
 */
export function createOverlayProjector(
  binding: RendererBinding,
  options: OverlayProjectorOptions = {},
): OverlayProjector {
  // SSR / non-DOM guard — return an inert projector.
  if (typeof document === "undefined") {
    return { register: () => () => {}, destroy: () => {} }
  }

  const container = options.container ?? document.body
  const layer = createLayer()
  container.appendChild(layer)

  const anchors = new Map<string, RegisteredAnchor>()

  const hide = (node: HTMLElement): void => {
    node.style.visibility = "hidden"
  }

  const place = (entry: RegisteredAnchor): void => {
    const { anchor } = entry
    const node = anchor.node

    if (anchor.visible === false) {
      if (entry.lastVisible) {
        hide(node)
        entry.lastVisible = false
      }
      return
    }

    const projected = binding.project(anchor.getWorld())
    if (!projected || !projected.visible) {
      if (entry.lastVisible) {
        hide(node)
        entry.lastVisible = false
      }
      return
    }

    // Round to whole px to avoid sub-pixel blur on the overlay content.
    const x = Math.round(projected.x)
    const y = Math.round(projected.y)
    // Position first, then center the node on the point. Transform-only.
    node.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
    if (!entry.lastVisible) {
      node.style.visibility = "visible"
      entry.lastVisible = true
    }
  }

  const tick = (): void => {
    for (const entry of anchors.values()) place(entry)
  }

  const stopFrame = binding.onFrame(tick)

  const register = (anchor: OverlayAnchor): (() => void) => {
    const node = anchor.node
    node.classList.add("panel-overlay-item")
    // Inline fallbacks mirroring `.panel-overlay-item`.
    node.style.position = "absolute"
    node.style.top = "0"
    node.style.left = "0"
    node.style.willChange = "transform"
    // Start hidden until the first successful projection to avoid a flash at
    // (0,0) before the first frame runs.
    node.style.visibility = "hidden"
    layer.appendChild(node)

    const entry: RegisteredAnchor = { anchor, lastVisible: false }
    anchors.set(anchor.id, entry)
    // Project immediately so a static scene (demand frameloop, paused clock)
    // still positions the node without waiting for a tick.
    place(entry)

    return () => {
      const current = anchors.get(anchor.id)
      // Only unregister if this exact anchor is still the one registered under
      // the id (guards against a re-register under the same id).
      if (current && current.anchor === anchor) {
        anchors.delete(anchor.id)
        if (node.parentNode === layer) layer.removeChild(node)
      }
    }
  }

  const destroy = (): void => {
    stopFrame()
    anchors.clear()
    if (layer.parentNode) layer.parentNode.removeChild(layer)
  }

  return { register, destroy }
}
