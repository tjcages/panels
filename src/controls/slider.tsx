"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "../lib/cn"

function decimalsForStep(s: number): number {
  const str = s.toString()
  const dot = str.indexOf(".")
  return dot === -1 ? 0 : str.length - dot - 1
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

type SliderState = "idle" | "hover" | "drag"

// Momentum tuning. Velocity is tracked in fraction-of-track per millisecond;
// on release it decays exponentially and coasts the value to rest.
const FRICTION = 0.94 // per-frame velocity decay (~60fps)
const MIN_VELOCITY = 0.00002 // fraction/ms below which the coast stops
const MAX_VELOCITY = 0.006 // clamp so a fast flick can't fling wildly
// Momentum only engages on a real throw — an ordinary release stops dead.
const THROW_VELOCITY = 0.0012 // fraction/ms
// A pointer that paused this long before release has no live velocity.
const VELOCITY_STALE_MS = 80

export interface ControlSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  className?: string
}

export function ControlSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  className,
}: ControlSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  const overscrollRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<SliderState>("idle")

  const percentage = ((value - min) / (max - min)) * 100
  const decimals = decimalsForStep(step)
  const displayValue = value.toFixed(decimals)

  // Reflect prop changes into CSS variables. CSS handles whether to animate
  // (data-panel-state="drag" disables the width transition, everything else gets
  // a 220ms ease-out).
  useEffect(() => {
    const fill = fillRef.current
    const handle = handleRef.current
    if (fill) fill.style.setProperty("--panel-fill-pct", `${percentage}%`)
    if (handle) handle.style.setProperty("--panel-handle-left", `${percentage}%`)
  }, [percentage])

  // Snap a raw 0..1 fraction to a committed, in-range, stepped value.
  const fractionToValue = useCallback(
    (frac: number) => {
      const clamped = Math.max(0, Math.min(1, frac))
      const raw = min + clamped * (max - min)
      const stepped = Math.round(raw / step) * step
      return Math.max(
        min,
        Math.min(max, Number.parseFloat(stepped.toFixed(decimals))),
      )
    },
    [min, max, step, decimals],
  )

  const positionToValue = useCallback(
    (clientX: number) => {
      const el = trackRef.current
      if (!el) return value
      const rect = el.getBoundingClientRect()
      return fractionToValue((clientX - rect.left) / rect.width)
    },
    [fractionToValue, value],
  )

  const onChangeRef = useRef(onChange)
  const fractionToValueRef = useRef(fractionToValue)
  const positionToValueRef = useRef(positionToValue)
  onChangeRef.current = onChange
  fractionToValueRef.current = fractionToValue
  positionToValueRef.current = positionToValue

  const setOverscroll = useCallback((scale: number, origin: string) => {
    const el = overscrollRef.current
    if (!el) return
    el.style.setProperty("--panel-os-scale", String(scale))
    el.style.setProperty("--panel-os-origin", origin)
  }, [])

  // Paint fill + handle at an arbitrary visual fraction (0..1), bypassing the
  // committed-value round-trip so momentum stays smooth at 60fps. Only touches
  // transform/CSS-vars — never triggers layout.
  const paintFraction = useCallback((frac: number) => {
    const clamped = Math.max(0, Math.min(1, frac))
    const pct = `${clamped * 100}%`
    if (fillRef.current)
      fillRef.current.style.setProperty("--panel-fill-pct", pct)
    if (handleRef.current)
      handleRef.current.style.setProperty("--panel-handle-left", pct)
  }, [])

  const rafRef = useRef<number | null>(null)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      const reduced = prefersReducedMotion()

      // Cancel any in-flight momentum coast from a previous release.
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      setState("drag")
      onChangeRef.current(positionToValueRef.current(e.clientX))

      const overscrollEl = overscrollRef.current
      // Disable spring-back transition while actively dragging.
      if (overscrollEl) overscrollEl.dataset.panelRelease = "false"

      // Velocity tracking: sample (fraction, timestamp) pairs; velocity is the
      // signed slope of the two most recent samples, in fraction/ms.
      let lastFrac = 0
      let lastT = e.timeStamp
      let velocity = 0

      const rawFraction = (clientX: number) => {
        const el = trackRef.current
        if (!el) return 0
        const rect = el.getBoundingClientRect()
        return (clientX - rect.left) / rect.width
      }
      lastFrac = rawFraction(e.clientX)

      const onMove = (ev: PointerEvent) => {
        ev.preventDefault()
        const rawPct = rawFraction(ev.clientX)

        // Velocity from the latest sample delta.
        const now = ev.timeStamp
        const dt = now - lastT
        if (dt > 0) {
          velocity = (rawPct - lastFrac) / dt
          lastT = now
          lastFrac = rawPct
        }

        // Soft rubber-band beyond the ends (disabled under reduced motion).
        if (!reduced) {
          if (rawPct < 0) {
            const d = Math.abs(rawPct)
            const v = (1 - 1 / (d * 3 + 1)) * 0.02
            setOverscroll(1 + v, "100% 50%")
          } else if (rawPct > 1) {
            const d = rawPct - 1
            const v = (1 - 1 / (d * 3 + 1)) * 0.02
            setOverscroll(1 + v, "0% 50%")
          } else {
            setOverscroll(1, "50% 50%")
          }
        }

        onChangeRef.current(fractionToValueRef.current(rawPct))
      }

      const springBack = () => {
        // Rubber-band snaps back to neutral via the house spring bezier.
        if (!overscrollEl) return
        overscrollEl.dataset.panelRelease = "true"
        setOverscroll(1, "50% 50%")
        const clear = () => {
          overscrollEl.dataset.panelRelease = "false"
          overscrollEl.removeEventListener("transitionend", clear)
        }
        overscrollEl.addEventListener("transitionend", clear)
      }

      const finishDrag = () => {
        setState((prev) => (prev === "drag" ? "hover" : prev))
      }

      const onUp = (upEvent: PointerEvent) => {
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)

        if (reduced) {
          // No momentum, no overscroll — value already tracks the pointer.
          setOverscroll(1, "50% 50%")
          finishDrag()
          return
        }

        springBack()

        // A pause before release means the gesture ended at rest — the last
        // sampled slope is stale, not a live throw.
        if (upEvent.timeStamp - lastT > VELOCITY_STALE_MS) velocity = 0

        // Coast only on a real throw: project the tracked velocity forward
        // with exponential decay. Runs purely on CSS-var paints; commits
        // stepped values as it passes them and a final clamped value at rest.
        let v = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocity))
        let frac = lastFrac
        let last = performance.now()

        if (Math.abs(v) < THROW_VELOCITY) {
          // Ordinary release — stop exactly where the pointer left it.
          finishDrag()
          return
        }

        const coast = (t: number) => {
          const dt = t - last
          last = t
          // Advance position, decay velocity per ~16ms frame.
          frac += v * dt
          v *= Math.pow(FRICTION, dt / 16)

          // Clamp visual to the ends (momentum can't paint out of range).
          const visual = Math.max(0, Math.min(1, frac))
          // Commit the stepped value; the value effect repaints fill/handle.
          // paintFraction keeps sub-step frames smooth between commits.
          paintFraction(visual)
          onChangeRef.current(fractionToValueRef.current(visual))

          const atEdge = frac <= 0 || frac >= 1
          if (Math.abs(v) < MIN_VELOCITY || atEdge) {
            const final = fractionToValueRef.current(visual)
            onChangeRef.current(final)
            paintFraction((final - min) / (max - min))
            rafRef.current = null
            finishDrag()
            return
          }
          rafRef.current = requestAnimationFrame(coast)
        }
        rafRef.current = requestAnimationFrame(coast)
      }

      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
    },
    [setOverscroll, paintFraction, min, max],
  )

  // Clean up any running coast on unmount.
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Editable value box, leva-style: free text while focused, committed
  // (parsed, clamped, stepped) on Enter/blur; Escape reverts; arrows step.
  const [draft, setDraft] = useState<string | null>(null)
  const commitDraft = useCallback(
    (raw: string) => {
      setDraft(null)
      const parsed = Number.parseFloat(raw.replace(",", "."))
      if (!Number.isFinite(parsed)) return
      const stepped = Math.round(parsed / step) * step
      onChangeRef.current(
        Math.max(
          min,
          Math.min(max, Number.parseFloat(stepped.toFixed(decimals))),
        ),
      )
    },
    [min, max, step, decimals],
  )
  const stepBy = useCallback(
    (direction: number, multiplier: number) => {
      const next = value + direction * step * multiplier
      onChangeRef.current(
        Math.max(min, Math.min(max, Number.parseFloat(next.toFixed(decimals)))),
      )
    },
    [value, min, max, step, decimals],
  )

  const discreteSteps = (max - min) / step
  const hashCount = discreteSteps <= 10 ? discreteSteps - 1 : 9
  const hashMarks = Array.from({ length: hashCount }, (_, i) => {
    const pct =
      discreteSteps <= 10
        ? (((i + 1) * step) / (max - min)) * 100
        : (i + 1) * 10
    return (
      <div key={`h${pct}`} className="panel-slider-hash" style={{ left: `${pct}%` }} />
    )
  })

  return (
    <div
      data-panel-state={state}
      className={cn("panel-slider-row", className)}
    >
      <span className="panel-slider-row-label" title={label}>
        {label}
      </span>
      <div className="panel-slider">
        <div ref={overscrollRef} className="panel-slider-overscroll">
          <div
            ref={trackRef}
            role="slider"
            tabIndex={0}
            aria-valuenow={value}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-label={label}
            className="panel-slider-track"
            onPointerDown={handlePointerDown}
            onPointerEnter={() => setState((s) => (s === "drag" ? s : "hover"))}
            onPointerLeave={() => setState((s) => (s === "drag" ? s : "idle"))}
          >
            <div className="panel-slider-hash-row">{hashMarks}</div>
            <div
              ref={fillRef}
              className="panel-slider-fill"
              style={
                { "--panel-fill-pct": `${percentage}%` } as React.CSSProperties
              }
            />
            <div
              ref={handleRef}
              className="panel-slider-handle"
              style={
                {
                  "--panel-handle-left": `${percentage}%`,
                } as React.CSSProperties
              }
            />
          </div>
        </div>
      </div>
      <input
        className="panel-slider-num"
        type="text"
        inputMode="decimal"
        aria-label={`${label} value`}
        value={draft ?? displayValue}
        onFocus={(e) => {
          setDraft(displayValue)
          e.currentTarget.select()
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commitDraft(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === "Enter") e.currentTarget.blur()
          else if (e.key === "Escape") {
            setDraft(null)
            e.currentTarget.blur()
          } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setDraft(null)
            stepBy(1, e.shiftKey ? 10 : 1)
          } else if (e.key === "ArrowDown") {
            e.preventDefault()
            setDraft(null)
            stepBy(-1, e.shiftKey ? 10 : 1)
          }
        }}
      />
    </div>
  )
}
