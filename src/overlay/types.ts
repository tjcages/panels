/**
 * Renderer-agnostic overlay types (OFF-138).
 *
 * The core knows nothing about Three.js / R3F / WebGL. A renderer adapter
 * supplies the two primitives everything else is built on via `RendererBinding`
 * — `project` (world → screen px) and `onFrame` (per-frame tick driven by the
 * panel clock). The R3F binding ships in `@tjcages/panels/shader`; a raw 2D
 * canvas can supply a trivial identity binding.
 */

/** A 3-component world/scene position. Plain tuple — no Three.js dependency. */
export type Vec3 = readonly [number, number, number]

/** Result of projecting a world position to the screen. */
export type ProjectedPoint = {
  /** Screen px, relative to the canvas top-left. */
  x: number
  /** Screen px, relative to the canvas top-left. */
  y: number
  /** `false` when behind the camera or otherwise culled. */
  visible: boolean
}

/**
 * The renderer adapter. Supplies world→screen projection and a per-frame hook;
 * `createOverlayProjector` needs nothing else.
 */
export type RendererBinding = {
  /**
   * World/scene position → screen px (relative to the canvas), or `null` if
   * culled (behind camera / off-screen).
   */
  project: (world: Vec3) => ProjectedPoint | null
  /**
   * Screen px → world position on a target surface (raycast); `null` on a miss.
   * Optional — only needed by the drag helpers (OFF-139).
   */
  unproject?: (screen: { x: number; y: number }) => Vec3 | null
  /**
   * Register a per-frame callback driven by the panel clock (OFF-140). Returns
   * an unsubscribe fn.
   */
  onFrame: (cb: (t: { time: number; delta: number }) => void) => () => void
}

/** A scene anchor: a DOM node kept pinned over a world position every frame. */
export type OverlayAnchor = {
  /** Stable id (used only for bookkeeping / debugging). */
  id: string
  /** World position to project. Called every frame — return a fresh value. */
  getWorld: () => Vec3
  /** The DOM node to position. Written to with `transform` / `visibility` only. */
  node: HTMLElement
  /** When `false`, the node is hidden regardless of projection. Default `true`. */
  visible?: boolean
}

/** Handle returned by `createOverlayProjector`. */
export type OverlayProjector = {
  /**
   * Register an anchor. Appends its node to the overlay layer and starts
   * positioning it each frame. Returns an unregister fn that removes the node.
   */
  register: (anchor: OverlayAnchor) => () => void
  /** Tear down: stop the frame loop and remove the overlay layer from the DOM. */
  destroy: () => void
}

/** Options for `createOverlayProjector`. */
export type OverlayProjectorOptions = {
  /**
   * The element the overlay layer is appended to. The layer is absolutely
   * positioned to fill it, so this should be the canvas's positioned parent.
   * Defaults to `document.body` (only sensible for a full-viewport canvas).
   */
  container?: HTMLElement
}
