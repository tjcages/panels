"use client"

import { useCallback, useEffect, useRef } from "react"

/**
 * Free-float shell for the panel: drag by the header, resize from every edge
 * and corner, dock to viewport edges.
 *
 * All gesture math runs in SCREEN coordinates (getBoundingClientRect /
 * pointer clientX,Y) and converts to style pixels through a per-gesture
 * calibration (`pin`). Style px and screen px diverge whenever the page is
 * zoomed or an ancestor transform re-bases fixed positioning; assuming they
 * match makes every write drift by an amount proportional to the coordinate.
 *
 * The panel hard-clamps inside the viewport (16px margin) at all times —
 * during drag, on release, and on window resize. While dragging, entering
 * the zone within 5% of a viewport edge shows a hint pill on that side of
 * the panel (via `data-snap-x` / `data-snap-y`); releasing inside the zone
 * docks the panel to that edge. Release also coasts with the pointer's
 * velocity.
 *
 * Surfacing after a close scales the panel up from the edge it is docked
 * to; closing hides it instantly (the float-mode CSS does not animate out).
 */

const MARGIN = 16
/** Fraction of the viewport near each edge that arms the snap. */
const SNAP_ZONE = 0.05
const MIN_W = 240
const MIN_H = 200
/** Panel cap; a taller viewport centers the panel vertically on first open.
 *  Keep in sync with the `max-height` on `[data-panel-float="true"]`. */
const PANEL_MAX_HEIGHT = 664
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"
/** How far (ms worth of travel) release velocity carries the panel. */
const MOMENTUM = 120

export type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"
export const RESIZE_DIRS: readonly ResizeDir[] = [
  "n",
  "s",
  "e",
  "w",
  "ne",
  "nw",
  "se",
  "sw",
]

export type HintSide = "left" | "right" | "top" | "bottom"
export const HINT_SIDES: readonly HintSide[] = [
  "left",
  "right",
  "top",
  "bottom",
]

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), Math.max(min, max))

/** Viewport size WITHOUT scrollbars — innerWidth overshoots by their width. */
const vw = () => document.documentElement.clientWidth
const vh = () => document.documentElement.clientHeight

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

interface Pin {
  /** Rendered rect at gesture start, screen coords. */
  r: DOMRect
  /** Screen px per style px (page zoom / ancestor scale). */
  z: number
  /** Convert a screen coordinate to the style value that renders there. */
  toStyleX: (x: number) => number
  toStyleY: (y: number) => number
}

/**
 * Pin the panel at its currently RENDERED position, kill any in-flight
 * animation, and calibrate the screen→style mapping. The (0,0) probe write
 * is invisible: style writes and the rect read happen in one synchronous
 * task, so nothing paints in between. Always re-measuring (never trusting
 * stale inline styles) keeps a grab during the settle animation jump-free.
 */
const pin = (el: HTMLElement): Pin => {
  // Fast-forward the entrance animation (a WAAPI transform) if it is still
  // playing — its mid-flight scale would otherwise be measured as page zoom.
  // CSS transitions (the snap settle) must keep their rendered position.
  for (const a of el.getAnimations()) {
    if (typeof CSSTransition === "undefined" || !(a instanceof CSSTransition)) {
      a.finish()
    }
  }
  const r0 = el.getBoundingClientRect()
  const z = r0.width / el.offsetWidth || 1
  el.style.transition = "none"
  el.style.left = "0px"
  el.style.top = "0px"
  el.style.right = "auto"
  el.style.bottom = "auto"
  // Viewport caps in calibrated pixels — stylesheet dvh caps do not track
  // page zoom.
  el.style.maxWidth = `${(vw() - 2 * MARGIN) / z}px`
  el.style.maxHeight = `${Math.min(vh() - 2 * MARGIN, PANEL_MAX_HEIGHT) / z}px`
  const probe = el.getBoundingClientRect()
  const toStyleX = (x: number) => (x - probe.left) / z
  const toStyleY = (y: number) => (y - probe.top) / z
  el.style.left = `${toStyleX(r0.left)}px`
  el.style.top = `${toStyleY(r0.top)}px`
  // Re-measure: the caps may have shrunk the panel below its original size.
  const r = el.getBoundingClientRect()
  return { r, z, toStyleX, toStyleY }
}

/** Which edges the panel currently arms for snapping, given its position. */
const snapSides = (left: number, top: number, w: number, h: number) => {
  const zoneX = vw() * SNAP_ZONE
  const zoneY = vh() * SNAP_ZONE
  // Nearer edge wins so a near-full-size panel arms the side being dragged
  // toward, not always the first one checked.
  const distL = left - MARGIN
  const distR = vw() - (left + w) - MARGIN
  const distT = top - MARGIN
  const distB = vh() - (top + h) - MARGIN
  const x =
    Math.min(distL, distR) < zoneX ? (distL <= distR ? "left" : "right") : ""
  const y =
    Math.min(distT, distB) < zoneY ? (distT <= distB ? "top" : "bottom") : ""
  return { x, y }
}

const setHints = (el: HTMLElement, x: string, y: string) => {
  if (el.dataset.snapX !== x) el.dataset.snapX = x
  if (el.dataset.snapY !== y) el.dataset.snapY = y
}

/** Animate to a SCREEN position through the gesture's calibration. */
const animateTo = (el: HTMLElement, m: Pin, left: number, top: number) => {
  const styleLeft = `${m.toStyleX(left)}px`
  const styleTop = `${m.toStyleY(top)}px`
  if (reducedMotion()) {
    el.style.left = styleLeft
    el.style.top = styleTop
    return
  }
  el.style.transition = `left 320ms ${EASE}, top 320ms ${EASE}`
  el.style.left = styleLeft
  el.style.top = styleTop
  const clear = () => {
    el.style.transition = ""
  }
  el.addEventListener("transitionend", clear, { once: true })
  window.setTimeout(clear, 400)
}

const trackPointer = (
  el: HTMLElement,
  cursor: string,
  onMove: (ev: PointerEvent) => void,
  onDone?: () => void
) => {
  const prevCursor = document.body.style.cursor
  document.body.style.cursor = cursor
  // Capture phase: host-page handlers may stopPropagation on pointer events,
  // so bubble-phase window listeners can miss the release.
  const up = () => {
    window.removeEventListener("pointermove", onMove, true)
    window.removeEventListener("pointerup", up, true)
    window.removeEventListener("pointercancel", up, true)
    document.body.style.cursor = prevCursor
    el.style.transition = ""
    onDone?.()
  }
  window.addEventListener("pointermove", onMove, true)
  window.addEventListener("pointerup", up, true)
  window.addEventListener("pointercancel", up, true)
}

export function usePanelDragResize({
  enabled,
  collapsed,
  ready = true,
  storageKey,
}: {
  enabled: boolean
  /** Float mode plays the entrance when this flips to false. */
  collapsed: boolean
  /**
   * True once the panel element is actually in the DOM. FloatingPanel renders
   * null pre-mount, so effects gated only on `enabled` would run against a
   * null ref and silently skip the position restore and the entrance.
   */
  ready?: boolean
  /** sessionStorage key that keeps the placement across close/reopen. */
  storageKey?: string
}) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const persistKey = storageKey ? `panels:float:${storageKey}` : null

  const persist = useCallback(() => {
    const el = panelRef.current
    if (!el || !persistKey) return
    try {
      sessionStorage.setItem(persistKey, el.getAttribute("style") ?? "")
    } catch {
      // Storage failures must never break the panel.
    }
  }, [persistKey])

  useEffect(() => {
    if (!enabled || !ready) return
    const el = panelRef.current
    if (!el) return
    let restored = false
    if (persistKey) {
      try {
        const saved = sessionStorage.getItem(persistKey)
        if (saved) {
          el.setAttribute("style", saved)
          restored = true
        }
      } catch {
        // Ignore unreadable storage.
      }
    }

    // Fresh open (no saved placement): dock to the right edge. On a viewport
    // taller than the panel's max height, center it vertically; otherwise sit
    // at the top-right corner. Written as explicit left/top so drag/resize and
    // reclamp share one coordinate space.
    if (!restored) {
      const m = pin(el)
      const left = vw() - m.r.width - MARGIN
      const top =
        vh() > PANEL_MAX_HEIGHT
          ? Math.max(MARGIN, Math.round((vh() - m.r.height) / 2))
          : MARGIN
      el.style.left = `${m.toStyleX(left)}px`
      el.style.top = `${m.toStyleY(top)}px`
      el.style.transition = ""
    }

    // Keep the panel fully inside the viewport when the window shrinks.
    const reclamp = () => {
      if (!el.style.left) return
      const m = pin(el)
      let w = m.r.width
      let h = m.r.height
      if (w > vw() - 2 * MARGIN) {
        w = Math.max(MIN_W, vw() - 2 * MARGIN)
        el.style.width = `${w / m.z}px`
      }
      if (el.style.height && h > vh() - 2 * MARGIN) {
        h = Math.max(MIN_H, vh() - 2 * MARGIN)
        el.style.height = `${h / m.z}px`
      }
      el.style.left = `${m.toStyleX(clamp(m.r.left, MARGIN, vw() - w - MARGIN))}px`
      el.style.top = `${m.toStyleY(clamp(m.r.top, MARGIN, vh() - h - MARGIN))}px`
      el.style.transition = ""
      persist()
    }
    reclamp()
    window.addEventListener("resize", reclamp)
    return () => {
      window.removeEventListener("resize", reclamp)
      el.style.transition = ""
      persist()
    }
  }, [enabled, ready, persistKey, persist])

  // Entrance: scale up from the docked edge when the panel surfaces.
  useEffect(() => {
    if (!enabled || !ready || collapsed) return
    const el = panelRef.current
    if (!el || reducedMotion()) return
    const r = el.getBoundingClientRect()
    const ox =
      r.left - MARGIN < 24
        ? "left"
        : vw() - r.right - MARGIN < 24
          ? "right"
          : "50%"
    const oy =
      r.top - MARGIN < 24
        ? "top"
        : vh() - r.bottom - MARGIN < 24
          ? "bottom"
          : "50%"
    el.style.transformOrigin = `${ox} ${oy}`
    el.animate(
      [
        { opacity: 0, transform: "scale(0.6)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      { duration: 200, easing: "cubic-bezier(0.17, 1, 0.32, 1)" }
    )
  }, [enabled, ready, collapsed])

  /* Clamp to the viewport, snap to an armed edge, animate there, persist. */
  const settle = useCallback(
    (el: HTMLElement, m: Pin, vx: number, vy: number) => {
      const cur = el.getBoundingClientRect()
      const maxL = vw() - cur.width - MARGIN
      const maxT = vh() - cur.height - MARGIN
      let left = clamp(cur.left + vx * MOMENTUM, MARGIN, maxL)
      let top = clamp(cur.top + vy * MOMENTUM, MARGIN, maxT)
      const armed = snapSides(left, top, cur.width, cur.height)
      if (armed.x === "left") left = MARGIN
      else if (armed.x === "right") left = Math.max(MARGIN, maxL)
      if (armed.y === "top") top = MARGIN
      else if (armed.y === "bottom") top = Math.max(MARGIN, maxT)
      setHints(el, "", "")
      animateTo(el, m, left, top)
      persist()
    },
    [persist]
  )

  const onHeaderPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = panelRef.current
      if (!enabled || !el || e.button !== 0) return
      // Header controls keep their own behavior.
      if ((e.target as Element).closest("button, select, input, a")) return
      e.preventDefault()

      const m = pin(el)
      const startX = e.clientX
      const startY = e.clientY
      let lastX = startX
      let lastY = startY
      let lastT = e.timeStamp
      let vx = 0
      let vy = 0

      trackPointer(
        el,
        "grabbing",
        (ev) => {
          const dt = ev.timeStamp - lastT
          if (dt > 0) {
            // EMA-smoothed velocity in px/ms for the release coast.
            vx = 0.8 * ((ev.clientX - lastX) / dt) + 0.2 * vx
            vy = 0.8 * ((ev.clientY - lastY) / dt) + 0.2 * vy
          }
          lastX = ev.clientX
          lastY = ev.clientY
          lastT = ev.timeStamp
          const maxL = vw() - m.r.width - MARGIN
          const maxT = vh() - m.r.height - MARGIN
          const left = clamp(m.r.left + ev.clientX - startX, MARGIN, maxL)
          const top = clamp(m.r.top + ev.clientY - startY, MARGIN, maxT)
          el.style.left = `${m.toStyleX(left)}px`
          el.style.top = `${m.toStyleY(top)}px`
          const armed = snapSides(left, top, m.r.width, m.r.height)
          setHints(el, armed.x, armed.y)
        },
        () => settle(el, m, vx, vy)
      )
    },
    [enabled, settle]
  )

  // Two-finger swipe while hovering the header throws the panel: wheel deltas
  // move it live (a grab that tracks the fingers) and the gesture's end
  // velocity feeds the same settle as a pointer drag. Attached natively
  // because React registers wheel listeners passively, which would ignore
  // preventDefault and scroll the page behind the panel.
  const headerElRef = useRef<HTMLElement | null>(null)
  const wheelGesture = useRef<{
    m: Pin
    vx: number
    vy: number
    lastT: number
    endTimer: number
  } | null>(null)

  useEffect(() => {
    const header = headerElRef.current
    if (!enabled || !ready || !header) return
    const onWheel = (e: WheelEvent) => {
      const el = panelRef.current
      if (!el) return
      e.preventDefault()
      const now = performance.now()
      let g = wheelGesture.current
      if (!g) {
        g = { m: pin(el), vx: 0, vy: 0, lastT: now, endTimer: 0 }
        wheelGesture.current = g
      }
      window.clearTimeout(g.endTimer)
      // Natural trackpad direction: the panel follows the fingers.
      const dx = -e.deltaX
      const dy = -e.deltaY
      const dt = Math.max(1, now - g.lastT)
      g.vx = 0.8 * (dx / dt) + 0.2 * g.vx
      g.vy = 0.8 * (dy / dt) + 0.2 * g.vy
      g.lastT = now
      const r = el.getBoundingClientRect()
      const maxL = vw() - r.width - MARGIN
      const maxT = vh() - r.height - MARGIN
      const left = clamp(r.left + dx, MARGIN, maxL)
      const top = clamp(r.top + dy, MARGIN, maxT)
      el.style.left = `${g.m.toStyleX(left)}px`
      el.style.top = `${g.m.toStyleY(top)}px`
      const armed = snapSides(left, top, r.width, r.height)
      setHints(el, armed.x, armed.y)
      g.endTimer = window.setTimeout(() => {
        const gesture = wheelGesture.current
        wheelGesture.current = null
        if (gesture) settle(el, gesture.m, gesture.vx, gesture.vy)
      }, 90)
    }
    header.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      header.removeEventListener("wheel", onWheel)
      if (wheelGesture.current) {
        window.clearTimeout(wheelGesture.current.endTimer)
        wheelGesture.current = null
      }
    }
  }, [enabled, ready, settle])

  const headerRef = useCallback((node: HTMLElement | null) => {
    headerElRef.current = node
  }, [])

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent, dir: ResizeDir) => {
      const el = panelRef.current
      if (!enabled || !el || e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()

      const m = pin(el)
      if (dir.includes("n") || dir.includes("s")) {
        // Height becomes user-owned from here on.
        el.style.height = `${m.r.height / m.z}px`
      }
      const startX = e.clientX
      const startY = e.clientY
      const right = m.r.left + m.r.width
      const bottom = m.r.top + m.r.height
      const cursor = getComputedStyle(e.currentTarget as Element).cursor

      trackPointer(
        el,
        cursor,
        (ev) => {
          const dx = ev.clientX - startX
          const dy = ev.clientY - startY
          if (dir.includes("e")) {
            const w = clamp(m.r.width + dx, MIN_W, vw() - m.r.left - MARGIN)
            el.style.width = `${w / m.z}px`
          }
          if (dir.includes("w")) {
            const w = clamp(m.r.width - dx, MIN_W, right - MARGIN)
            el.style.width = `${w / m.z}px`
            el.style.left = `${m.toStyleX(right - w)}px`
          }
          if (dir.includes("s")) {
            const h = clamp(m.r.height + dy, MIN_H, vh() - m.r.top - MARGIN)
            el.style.height = `${h / m.z}px`
          }
          if (dir.includes("n")) {
            const h = clamp(m.r.height - dy, MIN_H, bottom - MARGIN)
            el.style.height = `${h / m.z}px`
            el.style.top = `${m.toStyleY(bottom - h)}px`
          }
        },
        persist
      )
    },
    [enabled, persist]
  )

  return { panelRef, headerRef, onHeaderPointerDown, onResizePointerDown }
}
