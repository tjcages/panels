"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { cn } from "../lib/cn"
import { PanelCloseButton } from "../controls/close-button"
import { ControlThemeToggle } from "../controls/theme-toggle"
import {
  HINT_SIDES,
  RESIZE_DIRS,
  usePanelDragResize,
} from "../hooks/use-drag-resize"
import { useInjectPanelStyles } from "../hooks/use-inject-styles"
import {
  PanelThemeProvider,
  usePanelTheme,
  type PanelTheme,
} from "../hooks/use-theme"

export function FloatingPanel({
  side,
  collapsed,
  onToggle,
  onOpen,
  title,
  titleSlot,
  children,
  className,
  defaultTheme,
  themeStorageKey,
  showThemeToggle = true,
  container,
  inline = false,
  peek = true,
  float = false,
  floatStorageKey,
}: {
  side: "left" | "right"
  collapsed: boolean
  /** Close (header ✕). */
  onToggle: () => void
  /** Open — used by the edge sensor / peek preview. Defaults to `onToggle`. */
  onOpen?: () => void
  title: string
  /** Rendered next to the title — used by PanelRoot for the multi-shader switcher. */
  titleSlot?: React.ReactNode
  children: React.ReactNode
  className?: string
  defaultTheme?: PanelTheme
  /** sessionStorage key for the header theme toggle. */
  themeStorageKey?: string
  /** Show the light/dark toggle in the panel header. Default true. */
  showThemeToggle?: boolean
  /** Portal target. Defaults to `document.body`. Ignored when `inline` is true. */
  container?: HTMLElement | null
  /** Render in-place (absolute positioning) instead of portaling to body. */
  inline?: boolean
  /** Edge-hover peek preview while collapsed. Default true; disabled when inline. */
  peek?: boolean
  /**
   * Free-float mode: drag the panel by its header, resize from every edge
   * and corner, dock to viewport edges. Replaces the slide-out collapse with
   * an instant hide and a scale-up entrance from the docked edge. Disables
   * peek. Default false.
   */
  float?: boolean
  /** sessionStorage key that keeps the float placement across close/reopen. */
  floatStorageKey?: string
}) {
  const open = onOpen ?? onToggle
  useInjectPanelStyles()
  const theme = usePanelTheme(defaultTheme)
  const [mounted, setMounted] = useState(false)

  const floating = float && !inline
  const { panelRef, headerRef, onHeaderPointerDown, onResizePointerDown } =
    usePanelDragResize({
      enabled: floating,
      collapsed,
      ready: mounted,
      storageKey: floatStorageKey,
    })

  const showPeek = peek && !inline && !floating
  const [hoverSensor, setHoverSensor] = useState(false)
  const [hoverPanel, setHoverPanel] = useState(false)
  const peeking = showPeek && collapsed && (hoverSensor || hoverPanel)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!collapsed) {
      setHoverSensor(false)
      setHoverPanel(false)
    }
  }, [collapsed])

  // Arm the body's bottom fade mask while more content is cut off below
  // the fold (styles.ts keys the mask off .panel-body-cut-off).
  const bodyRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const sc = bodyRef.current
    if (!sc) return
    const update = () =>
      sc.classList.toggle(
        "panel-body-cut-off",
        sc.scrollTop + sc.clientHeight < sc.scrollHeight - 1,
      )
    update()
    sc.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(sc)
    // Content grows/shrinks as sections toggle.
    if (sc.firstElementChild) ro.observe(sc.firstElementChild)
    return () => {
      sc.removeEventListener("scroll", update)
      ro.disconnect()
    }
  }, [mounted])

  if (!mounted) return null

  const panel = (
    <PanelThemeProvider value={theme}>
      {showPeek && collapsed ? (
        <div
          className="panel-edge-sensor"
          data-panel-side={side}
          data-panel-inline={inline ? "true" : "false"}
          onMouseEnter={() => setHoverSensor(true)}
          onMouseLeave={() => setHoverSensor(false)}
          onClick={open}
          aria-hidden="true"
        />
      ) : null}
      <div
        data-panel=""
        data-panel-theme={theme}
        data-panel-side={side}
        data-panel-collapsed={collapsed ? "true" : "false"}
        data-panel-peek={peeking ? "true" : "false"}
        data-panel-inline={inline ? "true" : "false"}
        data-panel-float={floating ? "true" : "false"}
        className={cn("panel-floating", className)}
        onMouseEnter={() => setHoverPanel(true)}
        onMouseLeave={() => setHoverPanel(false)}
        ref={panelRef}
      >
        {floating
          ? RESIZE_DIRS.map((dir) => (
              <div
                key={dir}
                className={`panel-resize panel-resize-${dir}`}
                onPointerDown={(e) => onResizePointerDown(e, dir)}
              />
            ))
          : null}
        {floating
          ? HINT_SIDES.map((hintSide) => (
              <div
                key={hintSide}
                aria-hidden="true"
                className={`panel-snap-hint panel-snap-hint-${hintSide}`}
              />
            ))
          : null}
        <div className="panel-panel">
          <div
            className="panel-panel-header"
            onPointerDown={floating ? onHeaderPointerDown : undefined}
            ref={floating ? headerRef : undefined}
          >
            <div className="panel-panel-title-row">
              <span className="panel-panel-title">{title}</span>
              {titleSlot}
            </div>
            <div className="panel-panel-header-end">
              {showThemeToggle ? (
                <ControlThemeToggle storageKey={themeStorageKey} />
              ) : null}
              <PanelCloseButton onClick={onToggle} ariaLabel="Close panel" />
            </div>
          </div>
          <div className="panel-panel-body" ref={bodyRef}>
            {children}
          </div>
        </div>
        {peeking ? (
          <button
            type="button"
            className="panel-peek-catch"
            onClick={open}
            aria-label="Open panel"
          />
        ) : null}
      </div>
    </PanelThemeProvider>
  )

  if (inline) return panel

  const target =
    container ?? (typeof document !== "undefined" ? document.body : null)
  if (!target) return null

  return createPortal(panel, target)
}
