# Canvas + overlay binding — design

Status: **design** (Phase 4, OFF-138/139/140). Turns Panels from "a control panel next to a canvas" into "a panel *bound* to a canvas": DOM overlays pinned to scene objects, draggable handles that edit item params, selection synced both ways, and one animation clock that actually drives everything. Generalizes region-earth's globe/POI overlay so any canvas tool gets it for free.

The core stays renderer-agnostic; a thin **renderer adapter** supplies the two primitives everything else builds on:

```ts
type RendererBinding = {
  /** World/scene position → screen px (relative to the canvas), or null if culled (behind camera / off-screen). */
  project: (world: Vec3) => { x: number; y: number; visible: boolean } | null
  /** Screen px → world position on a target surface (raycast); null if it misses. */
  unproject?: (screen: { x: number; y: number }) => Vec3 | null
  /** Register a per-frame callback driven by the panel clock (see OFF-140). */
  onFrame: (cb: (t: { time: number; delta: number }) => void) => () => void
}
```

R3F ships this binding in `@tjcages/panels/shader` (camera `.project()` / `Raycaster` / `useFrame`); a raw-canvas/2D binding is trivial (identity or a supplied matrix).

## OFF-138 — overlay-anchor projector

Register a scene anchor, get a DOM node kept over its screen projection every frame.

```tsx
// R3F
<PanelOverlay anchor={object3D | vec3} visible={poi.visible}>
  <Pin label={poi.name} />
</PanelOverlay>
```

- Core `createOverlayProjector(binding)` owns a single positioned overlay layer (`pointer-events: none`, absolutely positioned over the canvas) and, each frame, `project()`s every registered anchor and writes `transform: translate(x,y)` on its node. Off-screen/behind-camera anchors get `visibility: hidden` (no layout thrash — transform/opacity only, per house perf rules).
- Directly generalizes region-earth's `GlobePOIOverlayProjector` (per-frame project + visibility cull + caption offset). Overlays are authored with the library's own primitives/DOM — no bespoke projector per tool.

## OFF-139 — hit-test & drag helpers

- `unproject(screen)` (raycast) converts a pointer to a world position on a target surface.
- `useDragHandle({ anchor, onDrag })` — a draggable overlay handle; on drag it `unproject`s the pointer and calls `onDrag(world)`. Bind it to a **collection item's** position field (Phase 3): drag the handle → `setItem({ ...item, pos })`. This is region-earth's `DraggablePOIHandles` (screen→lat/lon), generalized.
- Native pointer events only; respects the overlay layer's `pointer-events` (handles opt back in). No custom gesture that fights scroll.

## OFF-140 — two-way binding + one animation clock

Two directions, one source of truth:

1. **Selection sync.** Collection `onSelect(key, id)` (Phase 3) ↔ canvas. Select an item in the panel → highlight its overlay/anchor; click an anchor on the canvas → open that item's row in the panel. One `selectedId` per collection, shared.
2. **State sync.** Panel edits already flow to the canvas via config; drag handles (OFF-139) flow canvas → panel. No manual glue.
3. **The animation clock, fixed.** *Motivation: today honoring play/pause is opt-in and hand-wired per shader — in sun-shader most shaders never sample the clock (pause does nothing) and one wires it but still reads frozen. That inconsistency is the bug.* The fix: the library owns the binding.
   - `usePanelFrame(cb)` (and the R3F `binding.onFrame`) drive a per-frame callback **from the panel clock** — `cb({ time, delta })` where `delta` is 0 while paused, respects step/seek/rate. One opt-in per surface; play/pause/step then "just works," no per-shader `advancePanelAnimationDelta` bookkeeping.
   - R3F: a `<PanelClock/>` helper (or the binding) invalidates the frameloop while playing so `frameloop="demand"` canvases still advance, and stops invalidating when paused — which also fixes the "connect never plays" class of bug.
   - `advancePanelAnimationDelta` stays as the low-level primitive; `usePanelFrame` is the ergonomic layer.

## Scope / sequencing

- 138 → 139 → 140 (overlay first; drag needs projection; binding ties them + collections/selection together).
- Built + verified against the sun-shader playground (and its R3F canvases) — the animation-clock fix is verifiable there directly.
- Shader/R3F specifics live in `@tjcages/panels/shader`; the core stays renderer-agnostic (a 2D/DOM tool can supply its own trivial binding).

## Out of scope

- Compositing overlay + canvas into an exported frame → Phase 5 (OFF-141, composite capture).
- Auto-inferring overlays from data → not planned; overlays are authored.
