"use client"

/**
 * `useDragHandle` (OFF-139) — a draggable overlay handle for `@tjcages/panels/shader`.
 *
 * Returns props to spread on a DOM handle that lives in the `PanelOverlay`
 * layer. On pointer down → move it raycasts the pointer against a target
 * surface (via the same `raycastSurface` used by `createR3FBinding.unproject`)
 * and calls `onDrag(worldPos)` each move, so a consumer can write the position
 * back to a collection item's field. Fire start/end callbacks.
 *
 * Uses native pointer events + pointer capture: the drag only runs while THIS
 * handle is grabbed, so it never competes with the canvas's orbit/scroll
 * gestures. The overlay layer is `pointer-events: none`; the returned props set
 * `pointerEvents: "auto"` on the handle so it opts back in.
 *
 * Only this module + `overlay.tsx` may import `three` / `@react-three/fiber`;
 * the core stays renderer-agnostic.
 */

import { useThree } from "@react-three/fiber"
import {
  useCallback,
  useMemo,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { Plane, Raycaster, Vector2, Vector3 } from "three"

import type { Vec3 } from "../overlay/types"
import { raycastSurface, type RaycastSurface } from "./overlay"

export type UseDragHandleOptions = {
  /**
   * The item's current world position. Unused by the drag math itself (the
   * pointer is raycast against `surface`), but kept in the API so consumers
   * pass the item's field and it reads as a bound handle. May inform the
   * default surface later; today it's advisory.
   */
  anchor?: Vec3
  /** Called on each pointer move with the new world position on `surface`. */
  onDrag: (world: Vec3) => void
  /** Called once when the drag begins (pointer down on the handle). */
  onDragStart?: (world: Vec3 | null) => void
  /** Called once when the drag ends (pointer up / cancel). */
  onDragEnd?: (world: Vec3 | null) => void
  /**
   * The surface the pointer is raycast against. See {@link RaycastSurface}.
   * Omit for a plane through the world origin facing the camera.
   */
  surface?: RaycastSurface
}

export type DragHandleProps = {
  onPointerDown: (e: ReactPointerEvent) => void
  onPointerMove: (e: ReactPointerEvent) => void
  onPointerUp: (e: ReactPointerEvent) => void
  onPointerCancel: (e: ReactPointerEvent) => void
  style: CSSProperties
}

export type UseDragHandleReturn = {
  /** Spread onto the handle element. Opts back into `pointer-events: auto`. */
  handleProps: DragHandleProps
  /** `true` between pointer down and up/cancel. */
  isDragging: () => boolean
}

/**
 * Make an overlay element a draggable world-space handle.
 *
 * ```tsx
 * const drag = useDragHandle({
 *   anchor: item.pos,
 *   onDrag: (p) => setItem({ ...item, pos: p }),
 *   surface: { radius: 1 }, // globe
 * })
 * return (
 *   <PanelOverlay anchor={item.pos}>
 *     <div {...drag.handleProps} className="my-handle" />
 *   </PanelOverlay>
 * )
 * ```
 */
export function useDragHandle(
  options: UseDragHandleOptions,
): UseDragHandleReturn {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)

  // Keep callbacks/surface fresh without re-creating the handlers each render.
  const optsRef = useRef(options)
  optsRef.current = options

  const draggingRef = useRef(false)
  const rayScratch = useMemo(
    () => ({
      raycaster: new Raycaster(),
      ndc: new Vector2(),
      hit: new Vector3(),
      plane: new Plane(),
      normal: new Vector3(),
    }),
    [],
  )

  /** Pointer clientX/Y → world pos on the surface (canvas-relative raycast). */
  const worldAt = useCallback(
    (clientX: number, clientY: number): Vec3 | null => {
      const canvas = gl.domElement
      const rect = canvas.getBoundingClientRect()
      return raycastSurface(
        { x: clientX - rect.left, y: clientY - rect.top },
        camera,
        { width: rect.width, height: rect.height },
        optsRef.current.surface,
        rayScratch,
      )
    },
    [gl, camera, rayScratch],
  )

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      // Only the primary button starts a drag; leave other buttons to bubble.
      if (e.button !== 0) return
      draggingRef.current = true
      // Capture so move/up still target this handle even if the pointer leaves
      // it — and so the drag can't leak into the canvas orbit controls.
      e.currentTarget.setPointerCapture(e.pointerId)
      // Don't let the gesture reach the canvas underneath.
      e.stopPropagation()
      const world = worldAt(e.clientX, e.clientY)
      optsRef.current.onDragStart?.(world)
    },
    [worldAt],
  )

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!draggingRef.current) return
      e.stopPropagation()
      const world = worldAt(e.clientX, e.clientY)
      if (world) optsRef.current.onDrag(world)
    },
    [worldAt],
  )

  const endDrag = useCallback(
    (e: ReactPointerEvent) => {
      if (!draggingRef.current) return
      draggingRef.current = false
      e.stopPropagation()
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
      const world = worldAt(e.clientX, e.clientY)
      optsRef.current.onDragEnd?.(world)
    },
    [worldAt],
  )

  const handleProps = useMemo<DragHandleProps>(
    () => ({
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      style: {
        // The overlay layer is pointer-events: none; opt this handle back in.
        pointerEvents: "auto",
        // Suppress native touch scrolling/panning while dragging the handle so
        // it doesn't fight the page or canvas — the handle owns the gesture.
        touchAction: "none",
        cursor: "grab",
      },
    }),
    [onPointerDown, onPointerMove, endDrag],
  )

  const isDragging = useCallback(() => draggingRef.current, [])

  return { handleProps, isDragging }
}
