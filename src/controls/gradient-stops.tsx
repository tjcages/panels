"use client"

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"
import { cn } from "../lib/cn"
import {
  cssColorForHex,
  findLibraryColorByHex,
  type ColorLibrary,
} from "../lib/color-library"
import {
  addGradientStop,
  gradientCss,
  gradientFieldClientPlane,
  moveGradientStop,
  moveGradientStopOffset,
  nearestGradientStopIdPx,
  rasterizeGradientField,
  recolorGradientStop,
  removeGradientStop,
  offsetFromClientX,
  serializeGradientStops,
  GRADIENT_HANDLE_HIT_PX,
  GRADIENT_STOP_MAX,
  GRADIENT_STOP_MIN,
  type GradientStop,
} from "../lib/gradient"

/**
 * Contract for an injectable color popover trigger. The gradient and stripe
 * controls stay decoupled from any concrete popover — the field renderer (or a
 * consumer) passes a renderer; without one, a native color-picker swatch is
 * used.
 */
export type PanelColorPopoverProps = {
  color: string
  onChange: (hex: string) => void
  disabled?: boolean
  ariaLabel?: string
  triggerClassName?: string
  triggerStyle?: CSSProperties
  align?: "left" | "right"
}

export type PanelColorPopoverRenderer = (
  props: PanelColorPopoverProps,
) => ReactNode

/**
 * Fallback popover: a swatch button that opens the browser's native color
 * picker. Same trigger contract as an injected popover renderer.
 */
export function NativeColorSwatch({
  color,
  onChange,
  disabled,
  ariaLabel,
  triggerClassName,
  triggerStyle,
}: PanelColorPopoverProps) {
  const hiddenRef = useRef<HTMLInputElement>(null)

  const openPicker = () => {
    const input = hiddenRef.current
    if (!input) return
    try {
      if (typeof input.showPicker === "function") {
        input.showPicker()
        return
      }
    } catch {
      /* fall through to click() */
    }
    input.click()
  }

  return (
    <span className="panel-gradient-swatch-wrap">
      <button
        type="button"
        className={triggerClassName}
        style={triggerStyle}
        disabled={disabled}
        aria-label={ariaLabel}
        onClick={openPicker}
      />
      <input
        ref={hiddenRef}
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="panel-gradient-swatch-native"
        tabIndex={-1}
        aria-hidden="true"
      />
    </span>
  )
}

const GRAPH_WIDTH = 168
const GRAPH_HEIGHT = 120
const GRAPH_PAD = 12
const FIELD_PREVIEW_WIDTH = 144
const FIELD_PREVIEW_HEIGHT = 96

function normalizeHexDisplay(value: string): string {
  const raw = value.trim().replace(/^#/, "")
  return /^[0-9a-fA-F]{6}$/.test(raw) ? `#${raw.toUpperCase()}` : value
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function graphUvFromClient(
  clientX: number,
  clientY: number,
  bounds: DOMRect,
): { x: number; y: number } {
  if (bounds.width <= 0 || bounds.height <= 0) return { x: 0, y: 0 }
  const svgX = ((clientX - bounds.left) / bounds.width) * GRAPH_WIDTH
  const svgY = ((clientY - bounds.top) / bounds.height) * GRAPH_HEIGHT
  return {
    x: clamp01((svgX - GRAPH_PAD) / (GRAPH_WIDTH - GRAPH_PAD * 2)),
    y: clamp01((svgY - GRAPH_PAD) / (GRAPH_HEIGHT - GRAPH_PAD * 2)),
  }
}

function PlusIcon() {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function CloseIcon({ size = 11 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

export type ControlGradientStopsLayout = "field" | "ramp"

export interface ControlGradientStopsProps {
  stops: readonly GradientStop[]
  onChange: (stops: GradientStop[]) => void
  disabled?: boolean
  /** `field` (2D hotspot plane, default) or `ramp` (1D stop track). */
  layout?: ControlGradientStopsLayout
  /** Header title. Defaults to "Field" / "Ramp" per layout. */
  label?: string
  /** Named color library for token display on the selected stop. */
  library?: ColorLibrary
  /** Injectable color popover; falls back to the native picker swatch. */
  renderColorPopover?: PanelColorPopoverRenderer
  className?: string
}

/**
 * Gradient stop editor: a preview canvas (2D IDW field) or ramp track with
 * draggable stops, add/remove actions, and a per-stop color swatch that opens
 * the injected color popover (or the native picker).
 */
export function ControlGradientStops({
  stops,
  onChange,
  disabled = false,
  layout = "field",
  label,
  library,
  renderColorPopover,
  className,
}: ControlGradientStopsProps) {
  const graphRef = useRef<HTMLDivElement | null>(null)
  const fieldRef = useRef<HTMLCanvasElement | null>(null)
  const dragId = useRef<string | null>(null)
  const pendingStops = useRef<GradientStop[] | null>(null)
  const rafId = useRef<number | null>(null)
  const lastSent = useRef<string | null>(null)
  const [draftStops, setDraftStops] = useState<GradientStop[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(
    stops[0]?.id ?? null,
  )
  const displayed = draftStops ?? stops
  const displayedIds = displayed.map((stop) => stop.id).join(",")

  useEffect(() => {
    if (selectedId && displayed.some((stop) => stop.id === selectedId)) return
    setSelectedId(displayed[0]?.id ?? null)
  }, [displayed, displayedIds, selectedId])

  useEffect(() => {
    if (layout !== "field") return
    const canvas = fieldRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return
    const pixels = rasterizeGradientField(
      displayed,
      FIELD_PREVIEW_WIDTH,
      FIELD_PREVIEW_HEIGHT,
    )
    const image = context.createImageData(
      FIELD_PREVIEW_WIDTH,
      FIELD_PREVIEW_HEIGHT,
    )
    image.data.set(pixels)
    context.putImageData(image, 0, 0)
  }, [displayed, displayedIds, layout])

  useEffect(
    () => () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current)
    },
    [],
  )

  const selected =
    displayed.find((stop) => stop.id === selectedId) ?? displayed[0] ?? null
  const canAdd = !disabled && displayed.length < GRADIENT_STOP_MAX
  const canRemove =
    !disabled && displayed.length > GRADIENT_STOP_MIN && !!selected

  const flush = (next: GradientStop[]) => {
    const serialized = serializeGradientStops(next)
    if (serialized === lastSent.current) return
    lastSent.current = serialized
    onChange(next)
  }

  const scheduleFlush = (next: GradientStop[]) => {
    pendingStops.current = next
    if (rafId.current != null) return
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null
      const pending = pendingStops.current
      pendingStops.current = null
      if (pending) flush(pending)
    })
  }

  const commit = (next: GradientStop[], immediate = false) => {
    if (dragId.current && !immediate) {
      setDraftStops(next)
      scheduleFlush(next)
      return
    }
    setDraftStops(null)
    flush(next)
  }

  const pointerUv = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = graphRef.current?.getBoundingClientRect()
    if (!bounds) return null
    return graphUvFromClient(event.clientX, event.clientY, bounds)
  }

  const nearestHandleId = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = graphRef.current?.getBoundingClientRect()
    if (!bounds) return null
    if (layout === "ramp") {
      let bestId: string | null = null
      let bestDist = 14
      for (const stop of displayed) {
        const x = bounds.left + stop.offset * bounds.width
        const dist = Math.abs(event.clientX - x)
        if (dist <= bestDist) {
          bestDist = dist
          bestId = stop.id
        }
      }
      return bestId
    }
    const plane = gradientFieldClientPlane(
      bounds,
      GRAPH_WIDTH,
      GRAPH_HEIGHT,
      GRAPH_PAD,
    )
    return nearestGradientStopIdPx(
      displayed,
      event.clientX,
      event.clientY,
      plane,
      GRADIENT_HANDLE_HIT_PX,
    )
  }

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>, id: string) => {
    if (disabled) return
    event.preventDefault()
    event.stopPropagation()
    dragId.current = id
    setSelectedId(id)
    setDraftStops([...displayed])
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return
    const nearId = nearestHandleId(event)
    if (nearId) {
      beginDrag(event, nearId)
      return
    }
    if (!canAdd) return
    event.preventDefault()
    event.stopPropagation()
    const bounds = graphRef.current?.getBoundingClientRect()
    if (!bounds) return
    const next =
      layout === "ramp"
        ? addGradientStop(
            displayed,
            offsetFromClientX(event.clientX, bounds),
            0.5,
          )
        : (() => {
            const uv = graphUvFromClient(event.clientX, event.clientY, bounds)
            return addGradientStop(displayed, uv.x, uv.y)
          })()
    const created = next.find(
      (stop) => !displayed.some((existing) => existing.id === stop.id),
    )
    if (created) {
      setSelectedId(created.id)
      dragId.current = created.id
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    commit(next)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || !dragId.current) return
    event.preventDefault()
    event.stopPropagation()
    const uv = pointerUv(event)
    if (!uv) return
    if (layout === "ramp") {
      const bounds = graphRef.current?.getBoundingClientRect()
      if (!bounds) return
      commit(
        moveGradientStopOffset(
          displayed,
          dragId.current,
          offsetFromClientX(event.clientX, bounds),
        ),
      )
      return
    }
    commit(moveGradientStop(displayed, dragId.current, uv.x, uv.y))
  }

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragId.current) return
    event.preventDefault()
    event.stopPropagation()
    dragId.current = null
    if (rafId.current != null) {
      cancelAnimationFrame(rafId.current)
      rafId.current = null
    }
    const pending = pendingStops.current ?? draftStops
    pendingStops.current = null
    if (pending) commit(pending, true)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const colorMeta = selected
    ? (() => {
        const match = findLibraryColorByHex(selected.color, library)
        return {
          name: match?.token ?? "Custom",
          code: normalizeHexDisplay(selected.color),
        }
      })()
    : { name: "", code: "" }

  const popoverProps: PanelColorPopoverProps | null = selected
    ? {
        color: selected.color,
        onChange: (hex) =>
          commit(recolorGradientStop(displayed, selected.id, hex), true),
        disabled,
        ariaLabel:
          layout === "ramp"
            ? "Selected gradient stop color"
            : "Selected color hotspot",
        triggerClassName: "panel-gradient-swatch",
        triggerStyle: {
          "--panel-gradient-swatch-color": cssColorForHex(
            selected.color,
            library,
          ),
        } as CSSProperties,
        align: "right",
      }
    : null

  return (
    <div
      className={cn(
        "panel-gradient-editor",
        disabled && "is-disabled",
        className,
      )}
    >
      <div className="panel-gradient-header">
        <span className="panel-gradient-title">
          {label ?? (layout === "ramp" ? "Ramp" : "Field")}
        </span>
        <div className="panel-gradient-actions">
          <button
            type="button"
            className="panel-gradient-action"
            disabled={!canAdd}
            aria-label={
              layout === "ramp" ? "Add gradient stop" : "Add color hotspot"
            }
            onClick={() => {
              if (!canAdd) return
              const next =
                layout === "ramp"
                  ? addGradientStop(displayed, 0.5, 0.5)
                  : addGradientStop(displayed)
              const created = next.find(
                (stop) => !displayed.some((existing) => existing.id === stop.id),
              )
              if (created) setSelectedId(created.id)
              commit(next, true)
            }}
          >
            <PlusIcon />
            Add
          </button>
          <button
            type="button"
            className="panel-gradient-action"
            disabled={!canRemove}
            aria-label={
              layout === "ramp"
                ? "Remove selected gradient stop"
                : "Remove selected color hotspot"
            }
            onClick={() => {
              if (!selected || !canRemove) return
              commit(removeGradientStop(displayed, selected.id), true)
            }}
          >
            <CloseIcon />
            Remove
          </button>
        </div>
      </div>
      <div
        ref={graphRef}
        className={cn(
          "panel-gradient-graph",
          layout === "ramp" && "is-ramp",
          !disabled && "is-editable",
        )}
        aria-label={
          layout === "ramp" ? "Gradient color stops" : "Gradient color hotspots"
        }
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {layout === "ramp" ? (
          <div className="panel-gradient-track">
            <div
              className="panel-gradient-fill"
              style={{ background: gradientCss(displayed) }}
            />
            <div className="panel-gradient-baseline" />
            {displayed.map((stop) => (
              <div
                key={stop.id}
                className={cn(
                  "panel-gradient-handle is-ramp",
                  stop.id === selected?.id && "is-selected",
                )}
                style={
                  {
                    left: `${stop.offset * 100}%`,
                    backgroundColor: stop.color,
                  } as CSSProperties
                }
                aria-label={`Gradient stop at ${Math.round(stop.offset * 100)} percent`}
              />
            ))}
          </div>
        ) : (
          <>
            <canvas
              ref={fieldRef}
              className="panel-gradient-field"
              width={FIELD_PREVIEW_WIDTH}
              height={FIELD_PREVIEW_HEIGHT}
              aria-hidden="true"
            />
            <svg
              className="panel-gradient-plane"
              viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <line
                x1={GRAPH_PAD}
                y1={GRAPH_HEIGHT - GRAPH_PAD}
                x2={GRAPH_WIDTH - GRAPH_PAD}
                y2={GRAPH_HEIGHT - GRAPH_PAD}
              />
              <line
                x1={GRAPH_PAD}
                y1={GRAPH_PAD}
                x2={GRAPH_PAD}
                y2={GRAPH_HEIGHT - GRAPH_PAD}
              />
            </svg>
            <div className="panel-gradient-handles">
              {displayed.map((stop) => {
                const selectedStop = stop.id === selected?.id
                return (
                  <div
                    key={stop.id}
                    className={cn(
                      "panel-gradient-handle",
                      selectedStop && "is-selected",
                    )}
                    style={
                      {
                        left: `${stop.x * 100}%`,
                        top: `${stop.y * 100}%`,
                        backgroundColor: stop.color,
                      } as CSSProperties
                    }
                    aria-label={`Color hotspot at ${Math.round(stop.x * 100)} percent, ${Math.round(stop.y * 100)} percent`}
                  />
                )
              })}
            </div>
          </>
        )}
      </div>
      {selected && popoverProps ? (
        <div className="panel-gradient-selected">
          {renderColorPopover ? (
            renderColorPopover(popoverProps)
          ) : (
            <NativeColorSwatch {...popoverProps} />
          )}
          <div className="panel-gradient-selected-meta">
            <span className="panel-gradient-selected-name">
              {colorMeta.name}
            </span>
            <span className="panel-gradient-selected-code">
              [{colorMeta.code}]
            </span>
          </div>
          <span className="panel-gradient-selected-offset">
            {layout === "ramp"
              ? `${Math.round(selected.offset * 100)}%`
              : `${Math.round(selected.x * 100)}% · ${Math.round(selected.y * 100)}%`}
          </span>
        </div>
      ) : null}
    </div>
  )
}

function displayValueForHex(
  hex: string | null,
  library?: ColorLibrary,
): string {
  if (!hex) return ""
  const match = findLibraryColorByHex(hex, library)
  return match ? match.token : hex.toUpperCase()
}

function normalizeNullableHex(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null
  const raw = typeof value === "string" ? value.trim() : ""
  const withoutHash = raw.replace(/^#/, "")
  if (/^[0-9a-fA-F]{6}$/.test(withoutHash)) return `#${withoutHash.toLowerCase()}`
  return null
}

export interface ControlLibraryColorProps {
  label: string
  value: string | null
  onChange: (hex: string | null) => void
  /** Named color library — matching hexes display as `Group / Label` tokens. */
  library?: ColorLibrary
  /** Show a clear (×) button and treat empty as transparent. */
  allowClear?: boolean
  placeholder?: string
  disabled?: boolean
  renderColorPopover?: PanelColorPopoverRenderer
  className?: string
}

/**
 * Color row with library-token display: swatch (popover trigger) + a text
 * input that shows the library token for known hexes and accepts raw hex
 * entry. Ported from the site's color library input.
 */
export function ControlLibraryColor({
  label,
  value,
  onChange,
  library,
  allowClear = false,
  placeholder,
  disabled = false,
  renderColorPopover,
  className,
}: ControlLibraryColorProps) {
  const color = normalizeNullableHex(value)
  const libraryMatch = color ? findLibraryColorByHex(color, library) : null
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState(() => displayValueForHex(color, library))

  useEffect(() => {
    if (focused) return
    setDraft(displayValueForHex(color, library))
  }, [color, focused, library])

  const updateColor = (hex: string) => {
    const next = normalizeNullableHex(hex)
    if (next === null) return
    onChange(next)
  }
  const commitDraft = () => {
    const next = normalizeNullableHex(draft)
    if (next) {
      updateColor(next)
      setFocused(false)
      setDraft(displayValueForHex(next, library))
      return
    }
    setFocused(false)
    setDraft(displayValueForHex(color, library))
  }
  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation()
    if (event.key === "Enter") {
      event.currentTarget.blur()
    }
    if (event.key === "Escape") {
      setDraft(
        focused && color ? color.toUpperCase() : displayValueForHex(color, library),
      )
      event.currentTarget.blur()
    }
  }

  const swatchColor = color ?? "#000000"
  const popoverProps: PanelColorPopoverProps = {
    color: swatchColor,
    onChange: updateColor,
    disabled,
    ariaLabel: `${label} color`,
    triggerClassName: "panel-gradient-swatch",
    triggerStyle: {
      "--panel-gradient-swatch-color": cssColorForHex(swatchColor, library),
      "--panel-gradient-swatch-image": color
        ? "none"
        : "linear-gradient(45deg, #d6d6d6 25%, transparent 25%), linear-gradient(-45deg, #d6d6d6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d6d6d6 75%), linear-gradient(-45deg, transparent 75%, #d6d6d6 75%)",
    } as CSSProperties,
    align: "right",
  }

  return (
    <div
      className={cn(
        "panel-gradient-library",
        allowClear && color && "has-clear",
        className,
      )}
      aria-label={label}
    >
      {renderColorPopover ? (
        renderColorPopover(popoverProps)
      ) : (
        <NativeColorSwatch {...popoverProps} />
      )}
      <input
        className={cn(
          "panel-gradient-library-value",
          libraryMatch && !focused && "is-token",
        )}
        value={draft}
        placeholder={placeholder ?? (allowClear ? "Transparent" : "#RRGGBB")}
        disabled={disabled}
        spellCheck={false}
        inputMode="text"
        title={color ? color.toUpperCase() : undefined}
        aria-label={
          libraryMatch ? `${label} ${libraryMatch.token}` : `${label} hex value`
        }
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onFocus={() => {
          setFocused(true)
          setDraft(color ? color.toUpperCase() : "")
        }}
        onKeyDown={handleInputKeyDown}
        onChange={(event) => {
          const raw = event.target.value.trim()
          // While editing, accept hex only (tokens resolve on blur / via picker).
          const withoutHash = raw.replace(/^#/, "")
          if (withoutHash.length === 0) {
            setDraft("")
            return
          }
          if (!/^[0-9a-fA-F]{0,6}$/.test(withoutHash)) return
          const nextDraft = `#${withoutHash.toUpperCase()}`
          setDraft(nextDraft)
          if (withoutHash.length === 6) updateColor(nextDraft)
        }}
        onBlur={commitDraft}
      />
      {allowClear && color ? (
        <button
          type="button"
          className="panel-gradient-library-clear"
          onClick={() => onChange(null)}
          disabled={disabled}
        >
          ×
        </button>
      ) : null}
    </div>
  )
}

/**
 * CSS for the gradient stops editor + library color row. Injected by the
 * package's style pipeline; exported so custom setups can inject it manually.
 */
export const gradientStopsStyles = `
.panel-gradient-editor {
  display: grid;
  gap: 8px;
  width: 100%;
  min-width: 0;
  padding: 2px 0 6px;
  font-size: 11px;
  color: var(--panel-text);
}

.panel-gradient-editor.is-disabled {
  pointer-events: none;
  opacity: 0.45;
}

.panel-gradient-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.panel-gradient-title {
  color: var(--panel-text-muted);
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.panel-gradient-actions {
  display: flex;
  gap: 4px;
}

button.panel-gradient-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 7px;
  border: 0;
  border-radius: 4px;
  background: var(--panel-surface);
  color: var(--panel-text-muted);
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}

button.panel-gradient-action:not(:disabled):hover,
button.panel-gradient-action:not(:disabled):focus-visible {
  background: var(--panel-surface-active);
  color: var(--panel-text);
  outline: none;
}

button.panel-gradient-action:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.panel-gradient-graph {
  position: relative;
  width: 100%;
  height: 120px;
  box-sizing: border-box;
  border-radius: 4px;
  background: var(--panel-surface);
  touch-action: none;
  user-select: none;
  overflow: visible;
}

.panel-gradient-graph.is-ramp {
  height: 56px;
  padding: 8px 8px 0;
}

.panel-gradient-graph.is-editable {
  cursor: crosshair;
}

.panel-gradient-track {
  position: relative;
  width: 100%;
  height: 100%;
  touch-action: none;
}

.panel-gradient-fill {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 30px;
  border-radius: 4px;
  pointer-events: none;
  box-shadow: inset 0 0 0 1px var(--panel-swatch-border);
}

.panel-gradient-baseline {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  height: 1px;
  background: var(--panel-hash);
  pointer-events: none;
}

.panel-gradient-field {
  position: absolute;
  left: calc(12 / 168 * 100%);
  top: calc(12 / 120 * 100%);
  width: calc(144 / 168 * 100%);
  height: calc(96 / 120 * 100%);
  border-radius: 2px;
  pointer-events: none;
  image-rendering: auto;
}

.panel-gradient-plane {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.panel-gradient-graph line {
  stroke: var(--panel-hash);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.panel-gradient-handles {
  position: absolute;
  left: calc(12 / 168 * 100%);
  top: calc(12 / 120 * 100%);
  width: calc(144 / 168 * 100%);
  height: calc(96 / 120 * 100%);
  pointer-events: none;
}

.panel-gradient-handle {
  position: absolute;
  width: 16px;
  height: 16px;
  box-sizing: border-box;
  border-radius: 999px;
  border: 2px solid #fff;
  box-shadow: 0 1px 2px rgb(0 0 0 / 45%);
  transform: translate(-50%, -50%);
  cursor: grab;
}

.panel-gradient-handle.is-selected {
  width: 20px;
  height: 20px;
  border-width: 4px;
  border-color: #fff;
}

.panel-gradient-handle.is-ramp {
  top: auto;
  bottom: 4px;
  width: 12px;
  height: 12px;
  transform: translate(-50%, 0);
}

.panel-gradient-handle.is-ramp.is-selected {
  width: 14px;
  height: 14px;
  border-width: 3px;
}

.panel-gradient-selected {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.panel-gradient-selected-meta {
  display: grid;
  min-width: 0;
}

.panel-gradient-selected-name,
.panel-gradient-selected-code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-gradient-selected-name {
  color: var(--panel-text);
}

.panel-gradient-selected-code,
.panel-gradient-selected-offset {
  color: var(--panel-text-muted);
  font-variant-numeric: tabular-nums;
}

.panel-gradient-swatch-wrap {
  display: inline-flex;
  position: relative;
}

.panel-gradient-swatch-native {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  pointer-events: none;
}

button.panel-gradient-swatch {
  box-sizing: border-box;
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  padding: 0;
  border: 1px solid var(--panel-swatch-border);
  border-radius: 4px;
  box-shadow: none;
  cursor: pointer;
  background-color: var(--panel-gradient-swatch-color, #000000);
  background-image: var(--panel-gradient-swatch-image, none);
  background-position:
    0 0,
    0 6px,
    6px -6px,
    -6px 0;
  background-size: 12px 12px;
}

.panel-gradient-library {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  width: 100%;
  min-width: 0;
  height: 24px;
  font-size: 11px;
}

.panel-gradient-library.has-clear {
  grid-template-columns: 24px minmax(0, 1fr) 22px;
}

.panel-gradient-library-value {
  display: block;
  min-width: 0;
  width: 100%;
  height: 24px;
  border: 0;
  border-radius: 4px;
  background-color: var(--panel-surface);
  color: var(--panel-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 10px;
  line-height: 24px;
  padding: 0 8px;
  outline: none;
  box-sizing: border-box;
  text-transform: uppercase;
}

.panel-gradient-library-value.is-token {
  text-transform: none;
  font-family: inherit;
  letter-spacing: 0.01em;
}

.panel-gradient-library-value::placeholder {
  color: var(--panel-muted-icon);
  text-transform: none;
}

.panel-gradient-library-value:focus {
  box-shadow: inset 0 0 0 1px var(--panel-text-muted);
}

.panel-gradient-library-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 4px;
  background-color: transparent;
  color: var(--panel-text-muted);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
}

.panel-gradient-library-clear:hover:not(:disabled) {
  background-color: var(--panel-surface-active);
  color: var(--panel-text);
}
`
