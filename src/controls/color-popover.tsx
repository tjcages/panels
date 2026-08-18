"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { cn } from "../lib/cn"

export interface ColorLibraryColor {
  label: string
  hex: string
  p3?: string
  oklch?: string
}

export interface ColorLibraryGroup {
  name: string
  colors: ColorLibraryColor[]
}

export interface ColorPopoverProps {
  color: string
  onChange: (hex: string) => void
  /** Named swatch groups for the Library tab; picker-only when absent. */
  library?: ColorLibraryGroup[]
  disabled?: boolean
  ariaLabel?: string
  triggerClassName?: string
  triggerStyle?: CSSProperties
  children?: ReactNode
}

type RgbColor = { r: number; g: number; b: number }
type HsvColor = { h: number; s: number; v: number }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeHex(value: string): string {
  const raw = value.trim().replace(/^#/, "")
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return "#ffffff"
  return `#${raw.toLowerCase()}`
}

function channelToHex(value: number): string {
  return clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0")
}

function hexToRgb(hex: string): RgbColor {
  const normalized = normalizeHex(hex).replace(/^#/, "")
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

function rgbToHex({ r, g, b }: RgbColor): string {
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`
}

function rgbToHsv({ r, g, b }: RgbColor): HsvColor {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  let h = 0

  if (delta > 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6
    else if (max === gn) h = (bn - rn) / delta + 2
    else h = (rn - gn) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }

  return {
    h,
    s: max <= 0 ? 0 : (delta / max) * 100,
    v: max * 100,
  }
}

function hsvToRgb({ h, s, v }: HsvColor): RgbColor {
  const hue = ((h % 360) + 360) % 360
  const sat = clamp(s, 0, 100) / 100
  const val = clamp(v, 0, 100) / 100
  const chroma = val * sat
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = val - chroma
  const [rp, gp, bp] =
    hue < 60
      ? [chroma, x, 0]
      : hue < 120
        ? [x, chroma, 0]
        : hue < 180
          ? [0, chroma, x]
          : hue < 240
            ? [0, x, chroma]
            : hue < 300
              ? [x, 0, chroma]
              : [chroma, 0, x]

  return {
    r: (rp + m) * 255,
    g: (gp + m) * 255,
    b: (bp + m) * 255,
  }
}

function hsvToHex(hsv: HsvColor): string {
  return rgbToHex(hsvToRgb(hsv))
}

let supportsP3Cache: boolean | null = null

function supportsDisplayP3(): boolean {
  if (supportsP3Cache !== null) return supportsP3Cache
  supportsP3Cache =
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("color", "color(display-p3 1 1 1)") &&
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(color-gamut: p3)").matches
  return supportsP3Cache
}

function swatchColor(color: ColorLibraryColor): string {
  return supportsDisplayP3() && color.p3 ? color.p3 : color.hex
}

const POPOVER_WIDTH = 224
const POPOVER_MAX_HEIGHT = 420
const POPOVER_MIN_HEIGHT = 220
const VIEWPORT_PADDING = 8
const TRIGGER_GAP = 6

type PopoverPosition = {
  left: number
  top?: number
  bottom?: number
  maxHeight: number
  up: boolean
}

/* Anchor to the trigger rect: prefer below start-aligned, flip above when it
   does not fit, shift within the viewport padding. Replaces @floating-ui. */
function placePopover(trigger: HTMLElement): PopoverPosition {
  const rect = trigger.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const spaceBelow = vh - rect.bottom - TRIGGER_GAP - VIEWPORT_PADDING
  const spaceAbove = rect.top - TRIGGER_GAP - VIEWPORT_PADDING
  const up = spaceBelow < POPOVER_MIN_HEIGHT && spaceAbove > spaceBelow
  const maxHeight = Math.min(
    POPOVER_MAX_HEIGHT,
    Math.max(POPOVER_MIN_HEIGHT, up ? spaceAbove : spaceBelow),
  )
  const left = clamp(
    rect.left,
    VIEWPORT_PADDING,
    Math.max(VIEWPORT_PADDING, vw - POPOVER_WIDTH - VIEWPORT_PADDING),
  )
  return up
    ? { left, bottom: vh - rect.top + TRIGGER_GAP, maxHeight, up }
    : { left, top: rect.bottom + TRIGGER_GAP, maxHeight, up }
}

function EmbeddedPicker({
  color,
  onChange,
}: {
  color: string
  onChange: (hex: string) => void
}) {
  const hsv = useMemo(() => rgbToHsv(hexToRgb(color)), [color])
  const saturationRef = useRef<HTMLButtonElement>(null)
  const hueRef = useRef<HTMLButtonElement>(null)

  const updateSaturation = useCallback(
    (clientX: number, clientY: number) => {
      const rect = saturationRef.current?.getBoundingClientRect()
      if (!rect) return
      const s = clamp(((clientX - rect.left) / Math.max(1, rect.width)) * 100, 0, 100)
      const v = clamp(
        (1 - (clientY - rect.top) / Math.max(1, rect.height)) * 100,
        0,
        100,
      )
      onChange(hsvToHex({ h: hsv.h, s, v }))
    },
    [hsv.h, onChange],
  )

  const updateHue = useCallback(
    (clientX: number) => {
      const rect = hueRef.current?.getBoundingClientRect()
      if (!rect) return
      const h = clamp(((clientX - rect.left) / Math.max(1, rect.width)) * 360, 0, 360)
      onChange(hsvToHex({ ...hsv, h }))
    },
    [hsv, onChange],
  )

  const beginPointerDrag = useCallback(
    (
      event: ReactPointerEvent<HTMLButtonElement>,
      update: (clientX: number, clientY: number) => void,
    ) => {
      event.preventDefault()
      update(event.clientX, event.clientY)

      const handleMove = (moveEvent: PointerEvent) => {
        moveEvent.preventDefault()
        update(moveEvent.clientX, moveEvent.clientY)
      }
      const handleEnd = () => {
        window.removeEventListener("pointermove", handleMove)
        window.removeEventListener("pointerup", handleEnd)
        window.removeEventListener("pointercancel", handleEnd)
      }

      window.addEventListener("pointermove", handleMove, { passive: false })
      window.addEventListener("pointerup", handleEnd)
      window.addEventListener("pointercancel", handleEnd)
    },
    [],
  )

  return (
    <div className="panel-color-pop-canvas">
      <button
        type="button"
        ref={saturationRef}
        role="slider"
        aria-label="Color"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.v)}
        aria-valuetext={`Saturation ${Math.round(hsv.s)}%, Brightness ${Math.round(hsv.v)}%`}
        className="panel-color-pop-sat"
        style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
        onPointerDown={(event) => beginPointerDrag(event, updateSaturation)}
      >
        <span
          className="panel-color-pop-thumb"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
            backgroundColor: normalizeHex(color),
          }}
        />
      </button>
      <button
        type="button"
        ref={hueRef}
        role="slider"
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsv.h)}
        className="panel-color-pop-hue"
        onPointerDown={(event) => beginPointerDrag(event, (clientX) => updateHue(clientX))}
      >
        <span
          className="panel-color-pop-thumb panel-color-pop-thumb-hue"
          style={{
            left: `${(hsv.h / 360) * 100}%`,
            backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
          }}
        />
      </button>
    </div>
  )
}

/**
 * Dark color popover: Library/Picker tabs when a `library` is given,
 * picker-only otherwise. Portals to <body>, positions itself against the
 * trigger, and scales in from the anchored corner.
 */
export function ColorPopover({
  color,
  onChange,
  library,
  disabled,
  ariaLabel,
  triggerClassName,
  triggerStyle,
  children,
}: ColorPopoverProps) {
  const hasLibrary = !!library && library.length > 0
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"library" | "picker">("library")
  const [pos, setPos] = useState<PopoverPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const selectedItemRef = useRef<HTMLButtonElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const normalizedColor = normalizeHex(color)
  const [draftColor, setDraftColor] = useState(normalizedColor)
  const [hexDraft, setHexDraft] = useState(normalizedColor.toUpperCase())
  const displayColor = open ? draftColor : normalizedColor

  // rAF-coalesced onChange so drags don't flood the consumer.
  const pendingColor = useRef<string | null>(null)
  const colorRaf = useRef<number | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const lastSentColor = useRef(normalizedColor)

  useEffect(
    () => () => {
      if (colorRaf.current != null) cancelAnimationFrame(colorRaf.current)
      const pending = pendingColor.current
      pendingColor.current = null
      if (pending && pending !== lastSentColor.current) {
        lastSentColor.current = pending
        onChangeRef.current(pending)
      }
    },
    [],
  )

  const updateColor = useCallback((hex: string) => {
    const next = normalizeHex(hex)
    setDraftColor(next)
    setHexDraft(next.toUpperCase())
    pendingColor.current = next
    if (colorRaf.current != null) return
    colorRaf.current = requestAnimationFrame(() => {
      colorRaf.current = null
      const pending = pendingColor.current
      pendingColor.current = null
      if (!pending || pending === lastSentColor.current) return
      lastSentColor.current = pending
      onChangeRef.current(pending)
    })
  }, [])

  const commitHexDraft = useCallback(() => {
    const raw = hexDraft.trim().replace(/^#/, "")
    if (!/^[0-9a-fA-F]{6}$/.test(raw)) {
      setHexDraft(displayColor.toUpperCase())
      return
    }
    updateColor(raw)
  }, [displayColor, hexDraft, updateColor])

  const handleHexInputKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      event.stopPropagation()
      if (event.key === "Enter") {
        event.currentTarget.blur()
      }
      if (event.key === "Escape") {
        setHexDraft(displayColor.toUpperCase())
        event.currentTarget.blur()
      }
    },
    [displayColor],
  )

  // Sync from the outside value while no drag is pending.
  useEffect(() => {
    if (pendingColor.current) return
    lastSentColor.current = normalizedColor
    setDraftColor(normalizedColor)
    setHexDraft(normalizedColor.toUpperCase())
  }, [normalizedColor])

  useEffect(() => {
    setHexDraft(displayColor.toUpperCase())
  }, [displayColor])

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  const openPopover = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    setTab("library")
    setPos(placePopover(trigger))
    setOpen(true)
  }, [])

  // Dismiss on outside pointerdown / Escape; reposition on scroll & resize.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      )
        return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    const reposition = () => {
      const trigger = triggerRef.current
      if (trigger) setPos(placePopover(trigger))
    }
    const onScroll = (event: Event) => {
      if (popoverRef.current?.contains(event.target as Node)) return
      reposition()
    }
    window.addEventListener("pointerdown", onPointerDown, true)
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", reposition)
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", reposition)
    }
  }, [open])

  // Entrance: scale up from the anchored corner. Close stays instant (the
  // element just unmounts).
  useLayoutEffect(() => {
    if (!open) return
    const el = popoverRef.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    el.style.transformOrigin = pos?.up ? "left bottom" : "left top"
    el.animate(
      [
        { opacity: 0, transform: "scale(0.6)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      { duration: 200, easing: "cubic-bezier(0.17, 1, 0.32, 1)" },
    )
    // Run only on open — repositions must not replay the entrance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Scroll affordances: fade whichever end of the list is clipped.
  const updateListFades = useCallback(() => {
    const sc = listRef.current
    if (!sc) return
    sc.dataset.fadeTop = String(sc.scrollTop > 1)
    sc.dataset.fadeBottom = String(sc.scrollTop + sc.clientHeight < sc.scrollHeight - 1)
  }, [])

  // Center the selection by scrolling only the list — scrollIntoView would
  // also scroll the page to center the popover.
  useEffect(() => {
    if (!open || disabled || tab !== "library") return
    const frame = requestAnimationFrame(() => {
      const btn = selectedItemRef.current
      const list = listRef.current
      if (!btn || !list) return
      const delta = btn.getBoundingClientRect().top - list.getBoundingClientRect().top
      list.scrollTop += delta - (list.clientHeight - btn.clientHeight) / 2
      updateListFades()
    })
    return () => cancelAnimationFrame(frame)
  }, [disabled, displayColor, open, tab, updateListFades])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        className={triggerClassName}
        style={triggerStyle}
        onClick={() => (open ? setOpen(false) : openPopover())}
      >
        {children}
      </button>
      {open && !disabled && pos
        ? createPortal(
            <div
              ref={popoverRef}
              role="dialog"
              className="panel-color-pop"
              style={{
                left: pos.left,
                top: pos.top,
                bottom: pos.bottom,
                maxHeight: pos.maxHeight,
              }}
            >
              {hasLibrary ? (
                <div className="panel-color-pop-tabs" role="tablist">
                  {(["library", "picker"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={tab === value}
                      className="panel-color-pop-tab"
                      onClick={() => setTab(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="panel-color-pop-spacer" />
              )}
              {!hasLibrary || tab === "picker" ? (
                <div className="panel-color-pop-picker">
                  <EmbeddedPicker color={displayColor} onChange={updateColor} />
                  <div className="panel-color-pop-hex">
                    <input
                      value={hexDraft}
                      onChange={(event) => {
                        const withoutHash = event.target.value.trim().replace(/^#/, "")
                        if (/^[0-9a-fA-F]{0,6}$/.test(withoutHash)) {
                          setHexDraft(
                            withoutHash.length > 0
                              ? `#${withoutHash.toUpperCase()}`
                              : "",
                          )
                        }
                        if (/^[0-9a-fA-F]{6}$/.test(withoutHash)) {
                          updateColor(withoutHash)
                        }
                      }}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={handleHexInputKeyDown}
                      onBlur={commitHexDraft}
                      aria-label={
                        ariaLabel ? `${ariaLabel} hex value` : "Hex color value"
                      }
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="panel-color-pop-list"
                  onScroll={updateListFades}
                  ref={(node) => {
                    listRef.current = node
                    if (node) updateListFades()
                  }}
                >
                  {library?.map((group) => (
                    <div key={group.name} className="panel-color-pop-group">
                      <span className="panel-color-pop-group-label">{group.name}</span>
                      {group.colors.map((c) => {
                        const selected = c.hex.toLowerCase() === displayColor
                        return (
                          <button
                            ref={selected ? selectedItemRef : undefined}
                            key={`${group.name}-${c.label}`}
                            type="button"
                            aria-pressed={selected}
                            title={
                              c.oklch
                                ? `${c.oklch} / ${c.p3 ?? c.hex} / fallback ${c.hex.toUpperCase()}`
                                : c.p3
                                  ? `${c.p3} / fallback ${c.hex.toUpperCase()}`
                                  : c.hex.toUpperCase()
                            }
                            onClick={() => {
                              updateColor(c.hex)
                              setOpen(false)
                            }}
                            className={cn(
                              "panel-color-pop-item",
                              selected && "panel-color-pop-item-selected",
                            )}
                          >
                            <span
                              className="panel-color-pop-item-swatch"
                              style={{ backgroundColor: swatchColor(c) }}
                            />
                            <span className="panel-color-pop-item-label">{c.label}</span>
                            <span className="panel-color-pop-item-hex">{c.hex}</span>
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

/**
 * Styles for the color popover, kept separate so the injector can compose
 * them with the base panel CSS. All classes are `.panel-color-pop*` prefixed.
 */
export const colorPopoverStyles = `
.panel-color-pop {
  position: fixed;
  z-index: 2147483647;
  display: flex;
  flex-direction: column;
  width: ${POPOVER_WIDTH}px;
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid #2e2e2e;
  background: #1c1c1c;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.28), 0 12px 32px rgba(0, 0, 0, 0.32);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #d4d4d4;
}

.panel-color-pop-tabs {
  display: flex;
  flex: none;
  margin: 8px;
  border-radius: 6px;
  background: #2a2a2a;
  padding: 2px;
}

.panel-color-pop-spacer {
  flex: none;
  height: 8px;
}

.panel-color-pop-tab {
  flex: 1;
  cursor: pointer;
  border: 0;
  border-radius: 4px;
  background: transparent;
  padding: 4px 8px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  text-transform: capitalize;
  color: #8f8f8f;
  transition: color 150ms ease, background-color 150ms ease;
}

.panel-color-pop-tab:hover { color: #d4d4d4; }

.panel-color-pop-tab[aria-selected="true"] {
  background: #3a3a3a;
  color: #f0f0f0;
}

.panel-color-pop-picker {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 8px;
  padding: 0 8px 8px;
}

.panel-color-pop-canvas {
  display: flex;
  width: 200px;
  flex-direction: column;
  gap: 12px;
}

.panel-color-pop-sat {
  position: relative;
  height: 164px;
  width: 200px;
  cursor: crosshair;
  touch-action: none;
  overflow: hidden;
  border: 0;
  border-radius: 8px;
  padding: 0;
  background-image: linear-gradient(0deg, #000, transparent),
    linear-gradient(90deg, #fff, rgba(255, 255, 255, 0));
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
}

.panel-color-pop-hue {
  position: relative;
  height: 24px;
  width: 200px;
  cursor: ew-resize;
  touch-action: none;
  border: 0;
  border-radius: 0 0 8px 8px;
  padding: 0;
  background: linear-gradient(90deg, red 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, red 100%);
}

.panel-color-pop-thumb {
  pointer-events: none;
  position: absolute;
  height: 28px;
  width: 28px;
  border-radius: 9999px;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
  transform: translate(-50%, -50%);
}

.panel-color-pop-thumb-hue { top: 50%; }

.panel-color-pop-hex {
  display: flex;
  align-items: center;
  border: 1px solid #2e2e2e;
  border-radius: 4px;
  padding: 4px 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  color: #d4d4d4;
}

.panel-color-pop-hex input {
  width: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  outline: none;
  font: inherit;
  color: inherit;
  text-transform: uppercase;
}

/* Animatable fade heights for the list's cut-off masks. */
@property --panel-color-pop-fade-top {
  syntax: "<length>";
  inherits: false;
  initial-value: 0px;
}

@property --panel-color-pop-fade-bottom {
  syntax: "<length>";
  inherits: false;
  initial-value: 0px;
}

/* Full-bleed scroller with its padding inside, thin scrollbar, and fades on
   whichever end is clipped (data-fade-top / data-fade-bottom are set from
   the component's scroll handler). */
.panel-color-pop-list {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 8px 8px;
  scrollbar-width: thin;
  scrollbar-color: rgb(255 255 255 / 0.25) transparent;
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    black var(--panel-color-pop-fade-top),
    black calc(100% - var(--panel-color-pop-fade-bottom)),
    transparent 100%
  );
  transition:
    --panel-color-pop-fade-top 240ms cubic-bezier(0.22, 1, 0.36, 1),
    --panel-color-pop-fade-bottom 240ms cubic-bezier(0.22, 1, 0.36, 1);
}

.panel-color-pop-list[data-fade-top="true"] { --panel-color-pop-fade-top: 32px; }
.panel-color-pop-list[data-fade-bottom="true"] { --panel-color-pop-fade-bottom: 40px; }

.panel-color-pop-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.panel-color-pop-group-label {
  padding: 2px 4px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.025em;
  text-transform: uppercase;
  color: #737373;
}

.panel-color-pop-item {
  display: flex;
  cursor: pointer;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  padding: 4px;
  text-align: left;
  font-family: inherit;
  transition: background-color 150ms ease;
}

.panel-color-pop-item:hover,
.panel-color-pop-item-selected { background: #2a2a2a; }

.panel-color-pop-item-swatch {
  height: 20px;
  width: 20px;
  flex: none;
  border-radius: 4px;
  border: 1px solid #3a3a3a;
}

.panel-color-pop-item-selected .panel-color-pop-item-swatch {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.panel-color-pop-item-label {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: #d4d4d4;
}

.panel-color-pop-item-hex {
  flex: none;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  text-transform: uppercase;
  color: #737373;
}

@media (prefers-reduced-motion: reduce) {
  .panel-color-pop-list,
  .panel-color-pop-tab,
  .panel-color-pop-item { transition: none; }
}
`
