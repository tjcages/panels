"use client"

/**
 * R3F `<PanelClock />` (OFF-140) — keep a `frameloop="demand"` canvas
 * advancing while the panel animation clock is playing.
 *
 * Invalidates only when the panel-clock delta is non-zero (playing, or a
 * paused step/seek). Does **not** invalidate while paused, so a demand
 * canvas rests. Overlay projection stays on `useFrame` in `PanelOverlay`,
 * so a paused clock does not freeze overlay tracking when the camera moves
 * (orbit controls still invalidate on their own).
 */

import { useThree } from "@react-three/fiber"
import type { ReactNode } from "react"

import { usePanelFrame } from "../hooks/use-panel-frame"

/**
 * Drop inside an R3F `<Canvas frameloop="demand">`. No markup — it only
 * calls `invalidate()` while the panel clock is advancing.
 */
export function PanelClock(): ReactNode {
  const invalidate = useThree((s) => s.invalidate)
  usePanelFrame(({ delta }) => {
    if (delta !== 0) invalidate()
  })
  return null
}
