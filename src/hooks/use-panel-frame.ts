"use client"

import { useEffect, useRef } from "react"
import {
  advancePanelAnimationDelta,
  getPanelAnimationSnapshot,
  getPanelAnimationTime,
  subscribePanelAnimation,
} from "./animation-clock"

export type PanelFrameTick = {
  /** Elapsed animation time in seconds (panel clock). */
  time: number
  /**
   * Time since the previous callback, in seconds. `0` while paused (time is
   * frozen). Step/seek still produce a real (capped) delta so shaders advance
   * one frame; rate is already baked into the clock's time.
   */
  delta: number
}

export type UsePanelFrameCallback = (tick: PanelFrameTick) => void

/**
 * Per-frame callback driven by the panel animation clock.
 *
 * Samples via `advancePanelAnimationDelta` (the low-level primitive) so
 * play/pause/step/seek/rate all "just work" — no per-surface bookkeeping.
 *
 * - While **playing**, ticks arrive from `subscribePanelAnimation` after the
 *   clock advances (one sample per clock frame).
 * - While **paused**, a local rAF loop still delivers `{ delta: 0 }` every
 *   display frame so consumers can skip work without unsubscribing.
 * - **Step/seek** notify immediately through `subscribePanelAnimation`, so a
 *   paused surface still gets the stepped delta without waiting for rAF.
 */
export function usePanelFrame(callback: UsePanelFrameCallback): void {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    let previousTime = getPanelAnimationTime()
    let pausedRafId = 0

    const emit = (): void => {
      const tick = advancePanelAnimationDelta(previousTime)
      previousTime = tick.time
      callbackRef.current(tick)
    }

    const stopPausedLoop = (): void => {
      if (pausedRafId === 0) return
      cancelAnimationFrame(pausedRafId)
      pausedRafId = 0
    }

    const pausedLoop = (): void => {
      emit()
      pausedRafId = requestAnimationFrame(pausedLoop)
    }

    const startPausedLoop = (): void => {
      if (typeof requestAnimationFrame === "undefined") return
      if (pausedRafId !== 0) return
      pausedRafId = requestAnimationFrame(pausedLoop)
    }

    const applyPlaying = (playing: boolean): void => {
      if (playing) stopPausedLoop()
      else startPausedLoop()
    }

    applyPlaying(getPanelAnimationSnapshot().playing)
    // One sample on mount so a paused surface gets an immediate delta-0 tick.
    emit()

    const unsubscribe = subscribePanelAnimation(() => {
      emit()
      applyPlaying(getPanelAnimationSnapshot().playing)
    })

    return () => {
      unsubscribe()
      stopPausedLoop()
    }
  }, [])
}
