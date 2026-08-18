"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import { cn } from "../lib/cn"
import { PanelCloseButton } from "./close-button"
import {
  cssColorForHex,
  findLibraryColorByHex,
  type ColorLibrary,
} from "../lib/color-library"
import { loadControlDrawerOpen, saveControlDrawerOpen } from "../lib/drawer-state"
import {
  DEFAULT_CUSTOM_EASING,
  easeValue,
  formatCustomEasing,
  parseCustomEasing,
  type CustomEasingControlPoints,
} from "../lib/easing"
import type { EditableStripe } from "../lib/stripe-adapter"
import { ControlSelect } from "./select"
import { ControlSlider } from "./slider"
import {
  NativeColorSwatch,
  type PanelColorPopoverProps,
  type PanelColorPopoverRenderer,
} from "./gradient-stops"

const STRIPE_START_FROM_MIN = 0
const STRIPE_START_FROM_MAX = 0.8
const STRIPE_WIDTH_MIN = 0.5
const STRIPE_WIDTH_MAX = 64
const CUSTOM_EASING_VALUE = "__custom"

let stripeIdCounter = 0
function makeStripeId(): string {
  stripeIdCounter += 1
  return `stripe-${Date.now().toString(36)}-${stripeIdCounter}`
}

function normalizeHexForDisplay(value: string): string {
  const raw = value.trim().replace(/^#/, "")
  return /^[0-9a-fA-F]{6}$/.test(raw) ? `#${raw.toUpperCase()}` : value
}

function getStripeColorMeta(
  hex: string,
  library?: ColorLibrary,
): { name: string; code: string } {
  const match = findLibraryColorByHex(hex, library)
  if (match) {
    return { name: match.token, code: normalizeHexForDisplay(match.hex) }
  }
  return { name: "Custom", code: normalizeHexForDisplay(hex) }
}

function clampRangeValue(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

function GripIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="6" r="1.4" />
      <circle cx="15" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" />
      <circle cx="15" cy="18" r="1.4" />
    </svg>
  )
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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {open ? <path d="M6 9l6 6 6-6" /> : <path d="M9 6l6 6-6 6" />}
    </svg>
  )
}

export interface EasingGraphProps {
  value: string | undefined
  disabled?: boolean
  editableDefault?: CustomEasingControlPoints
  onChange?: (value: string) => void
}

/** Editable cubic-bezier preview — drag the two handles to author `custom:` easings. */
export function EasingGraph({
  value,
  disabled = false,
  editableDefault = DEFAULT_CUSTOM_EASING,
  onChange,
}: EasingGraphProps) {
  const width = 168
  const height = 88
  const pad = 10
  const ref = useRef<SVGSVGElement | null>(null)
  const activeHandle = useRef<"p1" | "p2" | null>(null)
  const custom = parseCustomEasing(value)
  const pointX = (x: number) => pad + x * (width - pad * 2)
  const pointY = (y: number) => height - pad - y * (height - pad * 2)
  const graphX = (x: number) =>
    clampRangeValue((x - pad) / (width - pad * 2), 0, 1)
  const graphY = (y: number) =>
    clampRangeValue((height - pad - y) / (height - pad * 2), 0, 1)
  const editablePoints = custom ?? editableDefault

  function updateHandle(handle: "p1" | "p2", clientX: number, clientY: number) {
    if (!onChange || disabled) return
    const bounds = ref.current?.getBoundingClientRect()
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return
    const svgX = ((clientX - bounds.left) / bounds.width) * width
    const svgY = ((clientY - bounds.top) / bounds.height) * height
    const next =
      handle === "p1"
        ? { ...editablePoints, x1: graphX(svgX), y1: graphY(svgY) }
        : { ...editablePoints, x2: graphX(svgX), y2: graphY(svgY) }
    onChange(formatCustomEasing(next))
  }

  function nearestHandle(clientX: number, clientY: number): "p1" | "p2" {
    const bounds = ref.current?.getBoundingClientRect()
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return "p1"
    const svgX = ((clientX - bounds.left) / bounds.width) * width
    const svgY = ((clientY - bounds.top) / bounds.height) * height
    const d1 = Math.hypot(
      svgX - pointX(editablePoints.x1),
      svgY - pointY(editablePoints.y1),
    )
    const d2 = Math.hypot(
      svgX - pointX(editablePoints.x2),
      svgY - pointY(editablePoints.y2),
    )
    return d1 <= d2 ? "p1" : "p2"
  }

  const points = Array.from({ length: 40 }, (_, index) => {
    const t = index / 39
    const x = pointX(t)
    const y = pointY(easeValue(t, value || "linear"))
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(" ")

  return (
    <svg
      ref={ref}
      className={cn(
        "panel-stripes-easing-graph",
        onChange && !disabled ? "is-editable" : null,
      )}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      onPointerDown={(event) => {
        if (!onChange || disabled) return
        event.preventDefault()
        event.stopPropagation()
        const handle = nearestHandle(event.clientX, event.clientY)
        activeHandle.current = handle
        event.currentTarget.setPointerCapture(event.pointerId)
        updateHandle(handle, event.clientX, event.clientY)
      }}
      onPointerMove={(event) => {
        if (!onChange || disabled || !activeHandle.current) return
        event.preventDefault()
        event.stopPropagation()
        updateHandle(activeHandle.current, event.clientX, event.clientY)
      }}
      onPointerUp={(event) => {
        if (!activeHandle.current) return
        event.preventDefault()
        event.stopPropagation()
        activeHandle.current = null
        event.currentTarget.releasePointerCapture(event.pointerId)
      }}
      onPointerCancel={() => {
        activeHandle.current = null
      }}
    >
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} />
      <line x1={pad} y1={pad} x2={pad} y2={height - pad} />
      {custom || onChange ? (
        <>
          <line
            className="panel-stripes-easing-handle-line"
            x1={pad}
            y1={height - pad}
            x2={pointX(editablePoints.x1)}
            y2={pointY(editablePoints.y1)}
          />
          <line
            className="panel-stripes-easing-handle-line"
            x1={width - pad}
            y1={pad}
            x2={pointX(editablePoints.x2)}
            y2={pointY(editablePoints.y2)}
          />
        </>
      ) : null}
      <polyline points={points} />
      {custom || onChange ? (
        <>
          <circle
            className="panel-stripes-easing-handle"
            cx={pointX(editablePoints.x1)}
            cy={pointY(editablePoints.y1)}
            r="4.2"
          />
          <circle
            className="panel-stripes-easing-handle"
            cx={pointX(editablePoints.x2)}
            cy={pointY(editablePoints.y2)}
            r="4.2"
          />
        </>
      ) : null}
    </svg>
  )
}

function EasingControl({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string
  value?: string
  options: Readonly<Record<string, string>>
  disabled: boolean
  onChange: (value: string) => void
}) {
  const customValue = value?.startsWith("custom:")
    ? value
    : formatCustomEasing(DEFAULT_CUSTOM_EASING)
  const selectValue = value?.startsWith("custom:")
    ? CUSTOM_EASING_VALUE
    : (value ?? "")

  return (
    <div className="panel-stripes-easing-row">
      <span className="panel-stripes-label">{label}</span>
      <div className="panel-stripes-easing-control">
        <ControlSelect
          label={label}
          layout="inline"
          value={selectValue}
          options={[
            ...Object.entries(options).map(([optionLabel, optionValue]) => ({
              label: optionLabel,
              value: optionValue,
            })),
            { label: "Custom", value: CUSTOM_EASING_VALUE },
          ]}
          onChange={(nextValue) =>
            onChange(
              nextValue === CUSTOM_EASING_VALUE
                ? customValue
                : String(nextValue),
            )
          }
        />
        <EasingGraph
          value={value}
          disabled={disabled}
          onChange={disabled ? undefined : onChange}
        />
      </div>
    </div>
  )
}

export interface ControlStripeColorsTableProps {
  value: readonly EditableStripe[]
  onChange: (next: EditableStripe[]) => void
  disabled?: boolean
  /** Named color library for token display + wide-gamut swatches. */
  library?: ColorLibrary
  showRampEasing?: boolean
  rampEasingOptions?: Readonly<Record<string, string>>
  rampEasingValue?: string
  onRampEasingChange?: (easing: string) => void
  thresholdEasingOptions?: Readonly<Record<string, string>>
  thresholdEasingValue?: string
  onThresholdEasingChange?: (easing: string) => void
  /** Hide the color swatches (image-driven levels). Default `true`. */
  showColorControls?: boolean
  showSavePalette?: boolean
  onSavePalette?: () => void
  onShufflePalette?: () => void
  onUndoShuffle?: () => void
  canUndoShuffle?: boolean
  /** Injectable color popover; falls back to the native picker swatch. */
  renderColorPopover?: PanelColorPopoverRenderer
  className?: string
}

function StripeDetailRow({
  stripe,
  index,
  disabled,
  library,
  showColorControls,
  renderColorPopover,
  dragging,
  dragover,
  reorderEnabled,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onColorChange,
  onOpacityChange,
  onThresholdChange,
  onWidthChange,
  onRemove,
}: {
  stripe: EditableStripe
  index: number
  disabled: boolean
  library?: ColorLibrary
  showColorControls: boolean
  renderColorPopover?: PanelColorPopoverRenderer
  dragging: boolean
  dragover: boolean
  reorderEnabled: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onColorChange: (id: string, hex: string) => void
  onOpacityChange: (id: string, opacity: number) => void
  onThresholdChange: (id: string, value: number) => void
  onWidthChange: (id: string, value: number) => void
  onRemove: (id: string) => void
}) {
  const colorMeta = getStripeColorMeta(stripe.hex, library)
  const opacityPercent = Math.round(stripe.opacity * 100)

  const popoverProps: PanelColorPopoverProps = {
    color: stripe.hex,
    onChange: (hex) => onColorChange(stripe.id, hex),
    disabled,
    ariaLabel: `Stripe ${index + 1} color`,
    triggerClassName: "panel-stripes-swatch",
    triggerStyle: {
      "--panel-stripes-swatch-color": cssColorForHex(stripe.hex, library),
    } as CSSProperties,
    align: "right",
  }

  return (
    <div
      className="panel-stripes-detail-row"
      data-panel-dragging={dragging ? "true" : "false"}
      data-panel-dragover={dragover ? "true" : "false"}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="panel-stripes-color-header">
        <span
          className="panel-stripes-grip"
          role="button"
          tabIndex={-1}
          aria-label={`Reorder Stripe ${index + 1}`}
          draggable={reorderEnabled && !disabled}
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move"
            onDragStart()
          }}
          onDragEnd={onDragEnd}
        >
          <GripIcon />
        </span>
        {showColorControls ? (
          <>
            {renderColorPopover ? (
              renderColorPopover(popoverProps)
            ) : (
              <NativeColorSwatch {...popoverProps} />
            )}
            <div className="panel-stripes-color-meta">
              <span className="panel-stripes-color-name">{colorMeta.name}</span>
              <span className="panel-stripes-color-code">
                [{colorMeta.code}]
              </span>
            </div>
          </>
        ) : (
          <>
            <div
              className="panel-stripes-swatch panel-stripes-swatch-placeholder"
              aria-hidden="true"
            />
            <div className="panel-stripes-color-meta">
              <span className="panel-stripes-color-name">
                Level {index + 1}
              </span>
              <span className="panel-stripes-color-code">[image colors]</span>
            </div>
          </>
        )}
        <PanelCloseButton
          ariaLabel={`Remove Stripe ${index + 1}`}
          className="panel-stripes-remove"
          size="sm"
          disabled={disabled}
          onClick={() => onRemove(stripe.id)}
        />
      </div>
      <div className="panel-stripes-control-stack">
        <ControlSlider
          label="Opacity"
          value={opacityPercent}
          min={0}
          max={100}
          step={1}
          onChange={(v) => {
            if (!disabled) onOpacityChange(stripe.id, v / 100)
          }}
        />
        <ControlSlider
          label="Threshold"
          value={stripe.startFrom}
          min={STRIPE_START_FROM_MIN}
          max={STRIPE_START_FROM_MAX}
          step={0.01}
          onChange={(v) => {
            if (!disabled) onThresholdChange(stripe.id, v)
          }}
        />
        <ControlSlider
          label="Width"
          value={stripe.width}
          min={STRIPE_WIDTH_MIN}
          max={STRIPE_WIDTH_MAX}
          step={0.5}
          onChange={(v) => {
            if (!disabled) onWidthChange(stripe.id, v)
          }}
        />
      </div>
    </div>
  )
}

/**
 * Stripe rows editor: per-stripe color swatch (popover trigger), opacity /
 * threshold / width sliders, drag-to-reorder, add/remove, flip color order,
 * and optional easing controls. Fully controlled — `value` + `onChange`.
 */
export function ControlStripeColorsTable({
  value,
  onChange,
  disabled = false,
  library,
  showRampEasing = false,
  rampEasingOptions = {},
  rampEasingValue,
  onRampEasingChange,
  thresholdEasingOptions = {},
  thresholdEasingValue,
  onThresholdEasingChange,
  showColorControls = true,
  showSavePalette = false,
  onSavePalette,
  onShufflePalette,
  onUndoShuffle,
  canUndoShuffle = false,
  renderColorPopover,
  className,
}: ControlStripeColorsTableProps) {
  const [colorsOpen, setColorsOpen] = useState(() =>
    loadControlDrawerOpen("Colors", false),
  )
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  // Guard against ids missing on consumer-provided rows.
  useEffect(() => {
    if (value.every((s) => s.id)) return
    onChange(value.map((s, i) => (s.id ? s : { ...s, id: `stripe-${i}` })))
  }, [value, onChange])

  const updateStripe = (id: string, patch: Partial<EditableStripe>) => {
    onChange(value.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const moveStripe = (from: number, to: number) => {
    if (from === to) return
    const next = [...value]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  const addStripe = () => {
    // Lab source of truth: insert a new fixed gray row, not a clone of the last stripe.
    const last = value[value.length - 1]
    onChange([
      ...value,
      {
        id: makeStripeId(),
        hex: "#888888",
        startFrom: 0,
        width: last?.width ?? 4,
        opacity: 1,
      },
    ])
  }

  const removeStripe = (id: string) => {
    if (value.length <= 1) return
    onChange(value.filter((s) => s.id !== id))
  }

  const reverseColorOrder = () => {
    // Flip the colors across rows; thresholds/widths keep their ladder.
    const hexes = value.map((s) => s.hex).reverse()
    onChange(value.map((s, i) => ({ ...s, hex: hexes[i] })))
  }

  return (
    <div
      className={cn(
        "panel-stripes-table",
        disabled && "is-disabled",
        className,
      )}
    >
      {/* Flip is built in, so the Distribution block always renders. */}
      <div className="panel-stripes-palette-wrap">
        <div className="panel-stripes-palette-head">
          <span className="panel-stripes-palette-title">Distribution</span>
          <div className="panel-stripes-palette-toolbar">
            {onShufflePalette ? (
              <button
                type="button"
                className="panel-stripes-palette-action"
                disabled={disabled}
                onClick={onShufflePalette}
              >
                Shuffle
              </button>
            ) : null}
            {onUndoShuffle ? (
              <button
                type="button"
                className="panel-stripes-palette-action"
                disabled={disabled || !canUndoShuffle}
                onClick={onUndoShuffle}
              >
                Undo
              </button>
            ) : null}
            <button
              type="button"
              className="panel-stripes-palette-action"
              disabled={disabled || value.length < 2}
              onClick={reverseColorOrder}
            >
              Flip
            </button>
          </div>
        </div>
        {showRampEasing && onRampEasingChange ? (
          <EasingControl
            label="Brightness easing"
            value={rampEasingValue}
            options={rampEasingOptions}
            disabled={disabled}
            onChange={onRampEasingChange}
          />
        ) : null}
        {Object.keys(thresholdEasingOptions).length > 0 &&
        onThresholdEasingChange ? (
          <EasingControl
            label="Threshold easing"
            value={thresholdEasingValue}
            options={thresholdEasingOptions}
            disabled={disabled}
            onChange={onThresholdEasingChange}
          />
        ) : null}
      </div>
      <button
        type="button"
        className="panel-stripes-drawer-toggle"
        disabled={disabled}
        aria-expanded={colorsOpen}
        onClick={() =>
          setColorsOpen((open) => {
            const next = !open
            saveControlDrawerOpen("Colors", next)
            return next
          })
        }
      >
        <ChevronIcon open={colorsOpen} />
        <span>{showColorControls ? "Colors" : "Levels"}</span>
        <span className="panel-stripes-drawer-count">{value.length}</span>
      </button>
      {colorsOpen ? (
        <div className="panel-stripes-drawer-panel">
          <div className="panel-stripes-detail-list">
            {value.map((stripe, index) => (
              <StripeDetailRow
                key={stripe.id}
                stripe={stripe}
                index={index}
                disabled={disabled}
                library={library}
                showColorControls={showColorControls}
                renderColorPopover={renderColorPopover}
                reorderEnabled={value.length > 1}
                dragging={dragIndex === index}
                dragover={overIndex === index}
                onDragStart={() => setDragIndex(index)}
                onDragEnd={() => {
                  setDragIndex(null)
                  setOverIndex(null)
                }}
                onDragOver={
                  dragIndex != null
                    ? (e) => {
                        e.preventDefault()
                        setOverIndex(index)
                      }
                    : undefined
                }
                onDrop={
                  dragIndex != null
                    ? (e) => {
                        e.preventDefault()
                        moveStripe(dragIndex, index)
                        setDragIndex(null)
                        setOverIndex(null)
                      }
                    : undefined
                }
                onColorChange={(id, hex) => updateStripe(id, { hex })}
                onOpacityChange={(id, opacity) => updateStripe(id, { opacity })}
                onThresholdChange={(id, startFrom) =>
                  updateStripe(id, { startFrom })
                }
                onWidthChange={(id, width) => updateStripe(id, { width })}
                onRemove={removeStripe}
              />
            ))}
          </div>
          <button
            type="button"
            className="panel-stripes-add"
            disabled={disabled}
            onClick={addStripe}
          >
            <PlusIcon />
            Add stripe
          </button>
          {showSavePalette && onSavePalette ? (
            <button
              type="button"
              className="panel-stripes-save"
              disabled={disabled}
              onClick={onSavePalette}
            >
              Save palette
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/**
 * CSS for the stripe colors table. Injected by the package's style pipeline;
 * exported so custom setups can inject it manually.
 */
export const stripeColorsTableStyles = `
.panel-stripes-table {
  display: grid;
  width: 100%;
  min-width: 0;
  row-gap: 0;
  font-size: 11px;
  color: var(--panel-text);
}

.panel-stripes-table.is-disabled {
  pointer-events: none;
  opacity: 0.45;
}

.panel-stripes-palette-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

/* Title left, actions right — one vertically-centered 24px row. */
.panel-stripes-palette-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 24px;
  min-width: 0;
}

.panel-stripes-palette-title {
  color: var(--panel-text-muted);
  font-weight: 400;
  line-height: 1.2;
  white-space: nowrap;
}

.panel-stripes-palette-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
}

button.panel-stripes-palette-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 24px;
  padding: 0 12px;
  text-align: center;
  border: 1px solid transparent;
  border-radius: 4px;
  background-color: var(--panel-surface);
  color: var(--panel-text-muted);
  font: inherit;
  font-size: 11px;
  white-space: nowrap;
  cursor: pointer;
}

button.panel-stripes-palette-action:not(:disabled):hover,
button.panel-stripes-palette-action:not(:disabled):focus-visible {
  background-color: var(--panel-surface-active);
  color: var(--panel-text);
  outline: none;
}

button.panel-stripes-palette-action:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.panel-stripes-easing-row {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  align-items: start;
  gap: 6px;
  min-width: 0;
}

.panel-stripes-easing-control {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.panel-stripes-easing-graph {
  width: 100%;
  height: 88px;
  display: block;
  overflow: visible;
  border-radius: 4px;
  background: var(--panel-surface);
  touch-action: none;
  user-select: none;
}

.panel-stripes-easing-graph.is-editable {
  cursor: crosshair;
}

.panel-stripes-easing-graph line {
  stroke: var(--panel-hash);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.panel-stripes-easing-graph polyline {
  fill: none;
  stroke: var(--panel-text-muted);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.panel-stripes-easing-handle-line {
  stroke: var(--panel-hash);
  stroke-width: 1;
  stroke-dasharray: 2 2;
  vector-effect: non-scaling-stroke;
}

.panel-stripes-easing-handle {
  fill: var(--panel-text-muted);
  stroke: var(--panel-surface);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

/* Sub-section disclosure — matches the .panel-section-header language:
   transparent 20px row, chevron leading, 500-weight label, muted count. */
.panel-stripes-drawer-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  min-width: 0;
  height: 20px;
  margin-top: 8px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--panel-label);
  font: inherit;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: -0.01em;
  text-align: left;
  cursor: pointer;
}

.panel-stripes-drawer-toggle svg {
  flex-shrink: 0;
  color: var(--panel-muted-icon);
  transition: color 150ms ease;
}

.panel-stripes-drawer-toggle:not(:disabled):hover,
.panel-stripes-drawer-toggle:not(:disabled):focus-visible {
  color: var(--panel-label-active);
  outline: none;
}

.panel-stripes-drawer-toggle:not(:disabled):hover svg,
.panel-stripes-drawer-toggle:not(:disabled):focus-visible svg {
  color: var(--panel-label-active);
}

.panel-stripes-drawer-toggle span:nth-child(2) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.panel-stripes-drawer-count {
  margin-left: auto;
  color: var(--panel-text-muted);
  font-weight: 400;
  font-variant-numeric: tabular-nums;
}

.panel-stripes-drawer-panel {
  display: grid;
  row-gap: 8px;
  min-width: 0;
  padding-top: 8px;
}

.panel-stripes-detail-list {
  display: grid;
  row-gap: 8px;
  min-width: 0;
}

.panel-stripes-detail-row {
  display: grid;
  gap: 6px;
  min-width: 0;
  padding: 6px 0;
  border-bottom: 1px solid var(--panel-divider);
}

.panel-stripes-detail-row:last-child {
  border-bottom: none;
}

.panel-stripes-detail-row[data-panel-dragging="true"] {
  opacity: 0.5;
}

.panel-stripes-detail-row[data-panel-dragover="true"] {
  box-shadow: 0 -1px 0 0 var(--panel-text-muted);
}

.panel-stripes-color-header {
  display: grid;
  grid-template-columns: 18px 24px minmax(0, 1fr) 16px;
  align-items: center;
  column-gap: 8px;
  min-width: 0;
}

.panel-stripes-grip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  padding: 0;
  color: var(--panel-muted-icon);
  touch-action: none;
  cursor: grab;
}

.panel-stripes-grip:active {
  cursor: grabbing;
}

.panel-stripes-detail-row:hover .panel-stripes-grip,
.panel-stripes-grip:focus-visible {
  color: var(--panel-text);
  outline: none;
}

button.panel-stripes-swatch {
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
  background-color: var(--panel-stripes-swatch-color, #000000);
}

.panel-stripes-swatch-placeholder {
  width: 24px;
  height: 24px;
}

.panel-stripes-color-meta {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.panel-stripes-color-name,
.panel-stripes-color-code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  font-variant-numeric: tabular-nums;
}

.panel-stripes-color-name {
  color: var(--panel-text);
}

.panel-stripes-color-code {
  flex: 0 1 auto;
  color: var(--panel-text-muted);
  font-size: 10px;
}

/* Layout only — look comes from the shared .panel-close-btn. */
.panel-stripes-remove {
  justify-self: end;
}

.panel-stripes-control-stack {
  display: grid;
  row-gap: 6px;
  min-width: 0;
  padding-left: 26px;
}

.panel-stripes-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  font-weight: 400;
  color: var(--panel-text-muted);
}

button.panel-stripes-add {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  height: 24px;
  border: 1px dashed var(--panel-swatch-border);
  border-radius: 4px;
  background-color: transparent;
  color: var(--panel-text-muted);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

button.panel-stripes-add:not(:disabled):hover {
  border-color: var(--panel-text-muted);
  color: var(--panel-text);
}

button.panel-stripes-save {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 28px;
  border: 1px solid var(--panel-swatch-border);
  border-radius: 4px;
  background-color: var(--panel-surface);
  color: var(--panel-text);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

button.panel-stripes-save:not(:disabled):hover,
button.panel-stripes-save:not(:disabled):focus-visible {
  border-color: var(--panel-text-muted);
  background-color: var(--panel-surface-active);
  outline: none;
}
`
