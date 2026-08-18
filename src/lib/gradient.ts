/**
 * 2D color-field gradient stops — shared math for the gradient-stops control.
 *
 * A stop is a colored hotspot on a unit plane; the field between stops is an
 * inverse-distance-weighted (power 2) blend. Saved 1D ramps (`offset` only)
 * round-trip through the same shape: `offset` is an alias of `x`.
 */

export type GradientStop = {
  id: string
  /** Horizontal UV (0 = left, 1 = right). */
  x: number
  /** Vertical UV (0 = top, 1 = bottom). */
  y: number
  /** Alias of `x` so saved 1D ramps round-trip. */
  offset: number
  color: string
}

export const GRADIENT_STOP_MIN = 1
export const GRADIENT_STOP_MAX = 16
export const GRADIENT_HANDLE_HIT_PX = 26

const IDW_POWER = 2
const EPSILON = 1e-12
const HEX_RE = /^#[0-9a-f]{6}$/i

const DEFAULT_FAR = "#fea700"
const DEFAULT_NEAR = "#f46021"

/** Ink for newly added stops — first hex not already on the field wins. */
const NEW_STOP_PALETTE = [
  "#fea700",
  "#f46021",
  "#f77720",
  "#e92e28",
  "#b33806",
  "#fa4541",
  "#ff8839",
  "#ff89a5",
  "#ffa05b",
  "#b0241f",
  "#ffbb7d",
  "#ff6967",
  "#8a2b01",
  "#ff9a96",
  "#ffb5b6",
  "#882426",
]

function nextPaletteColor(used: string[]): string {
  const taken = new Set(used.map((hex) => hex.toLowerCase()))
  return (
    NEW_STOP_PALETTE.find((hex) => !taken.has(hex)) ??
    NEW_STOP_PALETTE[used.length % NEW_STOP_PALETTE.length] ??
    DEFAULT_NEAR
  )
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function sanitizeHex(value: unknown, fallback: string): string {
  if (typeof value === "string" && HEX_RE.test(value)) return value.toLowerCase()
  if (typeof fallback === "string" && HEX_RE.test(fallback))
    return fallback.toLowerCase()
  return DEFAULT_NEAR
}

export function parseHexRgb(hex: string): { r: number; g: number; b: number } {
  const raw = sanitizeHex(hex, DEFAULT_NEAR).slice(1)
  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16),
  }
}

let stopIdCounter = 0

export function createGradientStopId(): string {
  stopIdCounter += 1
  return `g${stopIdCounter.toString(36)}-${Date.now().toString(36)}`
}

export function defaultGradientStops(
  colorFar: string = DEFAULT_FAR,
  colorNear: string = DEFAULT_NEAR,
): GradientStop[] {
  return [
    { id: "far", x: 0, y: 0.5, offset: 0, color: sanitizeHex(colorFar, DEFAULT_FAR) },
    { id: "near", x: 1, y: 0.5, offset: 1, color: sanitizeHex(colorNear, DEFAULT_NEAR) },
  ]
}

export function sortGradientStops(
  stops: readonly GradientStop[],
): GradientStop[] {
  return [...stops].sort(
    (a, b) => a.x - b.x || a.y - b.y || a.id.localeCompare(b.id),
  )
}

function round4(value: number): number {
  return Number(clamp01(value).toFixed(4))
}

function stopFromUnknown(
  value: unknown,
  index: number,
  fallbackColor: string,
): GradientStop | null {
  if (!value || typeof value !== "object") return null
  const record = value as Record<string, unknown>
  const rawX = isFiniteNumber(record.x)
    ? record.x
    : isFiniteNumber(record.offset)
      ? record.offset
      : null
  if (rawX === null) return null
  const x = round4(rawX)
  const y = isFiniteNumber(record.y) ? round4(record.y) : 0.5
  return {
    id:
      typeof record.id === "string" && record.id.trim()
        ? record.id.trim()
        : `g${index}`,
    x,
    y,
    offset: x,
    color: sanitizeHex(record.color, fallbackColor),
  }
}

function placeStop(stop: GradientStop, x: number, y: number): GradientStop {
  const px = round4(x)
  return { ...stop, x: px, y: round4(y), offset: px }
}

function normalizeStopList(
  value: unknown[],
  colorFar: string,
  colorNear: string,
): GradientStop[] {
  const far = sanitizeHex(colorFar, DEFAULT_FAR)
  const near = sanitizeHex(colorNear, DEFAULT_NEAR)
  const out: GradientStop[] = []
  const ids = new Set<string>()
  for (let i = 0; i < value.length; i += 1) {
    const stop = stopFromUnknown(value[i], i, i === 0 ? far : near)
    if (!stop) continue
    let id = stop.id
    if (ids.has(id)) id = `${stop.id}-${out.length}`
    ids.add(id)
    out.push({ ...stop, id })
    if (out.length >= GRADIENT_STOP_MAX) break
  }
  return out.length < GRADIENT_STOP_MIN
    ? defaultGradientStops(far, near)
    : sortGradientStops(out)
}

export function serializeGradientStops(
  stops: readonly GradientStop[],
): string {
  return JSON.stringify(
    sortGradientStops(stops).map((stop) => ({
      id: stop.id,
      x: round4(stop.x),
      y: round4(stop.y),
      offset: round4(stop.offset),
      color: stop.color,
    })),
  )
}

/**
 * Canonicalize any saved shape — array of stops, serialized JSON string, or
 * garbage — into a valid stop list. Invalid input falls back to
 * `colorFar@(0,0.5) → colorNear@(1,0.5)`.
 */
export function normalizeGradientStops(
  value: unknown,
  colorFar: string = DEFAULT_FAR,
  colorNear: string = DEFAULT_NEAR,
): GradientStop[] {
  if (Array.isArray(value)) return normalizeStopList(value, colorFar, colorNear)
  if (typeof value !== "string" || value.trim() === "")
    return defaultGradientStops(colorFar, colorNear)
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed)
      ? normalizeStopList(parsed, colorFar, colorNear)
      : defaultGradientStops(colorFar, colorNear)
  } catch {
    return defaultGradientStops(colorFar, colorNear)
  }
}

function withFallback(stops: readonly GradientStop[]): GradientStop[] {
  return stops.length > 0 ? [...stops] : defaultGradientStops()
}

/** Inverse-distance weighting (power 2). An exact hotspot hit returns that color. */
export function sampleGradientRgb(
  stops: readonly GradientStop[],
  x: number,
  y: number,
): { r: number; g: number; b: number } {
  const list = withFallback(stops)
  const px = clamp01(x)
  const py = clamp01(y)
  if (list.length === 1) return parseHexRgb(list[0].color)
  let r = 0
  let g = 0
  let b = 0
  let weight = 0
  for (const stop of list) {
    const dx = px - stop.x
    const dy = py - stop.y
    const distSq = dx * dx + dy * dy
    if (distSq <= EPSILON) return parseHexRgb(stop.color)
    const w = 1 / distSq ** (IDW_POWER / 2)
    const rgb = parseHexRgb(stop.color)
    r += w * rgb.r
    g += w * rgb.g
    b += w * rgb.b
    weight += w
  }
  if (weight <= 0) return parseHexRgb(list[0].color)
  return { r: r / weight, g: g / weight, b: b / weight }
}

/** 1D CSS ramp along stop offsets — used for the "ramp" layout preview. */
export function gradientCss(stops: readonly GradientStop[]): string {
  return `linear-gradient(90deg, ${sortGradientStops(withFallback(stops))
    .map((stop) => `${stop.color} ${(stop.offset * 100).toFixed(2)}%`)
    .join(", ")})`
}

/** RGBA pixel buffer of the 2D field, row-major, for a canvas preview. */
export function rasterizeGradientField(
  stops: readonly GradientStop[],
  width: number,
  height: number,
): Uint8ClampedArray {
  const w = Math.max(1, Math.round(width))
  const h = Math.max(1, Math.round(height))
  const pixels = new Uint8ClampedArray(w * h * 4)
  for (let row = 0; row < h; row += 1) {
    const v = (row + 0.5) / h
    for (let col = 0; col < w; col += 1) {
      const rgb = sampleGradientRgb(stops, (col + 0.5) / w, v)
      const at = (row * w + col) * 4
      pixels[at] = rgb.r
      pixels[at + 1] = rgb.g
      pixels[at + 2] = rgb.b
      pixels[at + 3] = 255
    }
  }
  return pixels
}

/** First comfortable open spot for a new stop — center-ish, away from others. */
function openSpot(stops: readonly GradientStop[]): { x: number; y: number } {
  const candidates: Array<[number, number]> = [
    [0.5, 0.5],
    [0.35, 0.35],
    [0.65, 0.65],
    [0.5, 0.22],
    [0.5, 0.78],
    [0.22, 0.5],
    [0.78, 0.5],
    [0.28, 0.72],
    [0.72, 0.28],
  ]
  for (const [x, y] of candidates) {
    if (!stops.some((stop) => Math.hypot(stop.x - x, stop.y - y) < 0.08))
      return { x, y }
  }
  const n = stops.length
  return {
    x: clamp01(0.12 + ((n * 0.17) % 0.76)),
    y: clamp01(0.18 + ((n * 0.23) % 0.64)),
  }
}

export function addGradientStop(
  stops: readonly GradientStop[],
  x?: number,
  y?: number,
  color?: string,
): GradientStop[] {
  if (stops.length >= GRADIENT_STOP_MAX) return [...stops]
  const spot =
    isFiniteNumber(x) && isFiniteNumber(y)
      ? { x: clamp01(x), y: clamp01(y) }
      : openSpot(stops)
  const ink = color ?? nextPaletteColor(stops.map((stop) => stop.color))
  return [
    ...stops,
    placeStop(
      {
        id: createGradientStopId(),
        x: spot.x,
        y: spot.y,
        offset: spot.x,
        color: sanitizeHex(ink, DEFAULT_NEAR),
      },
      spot.x,
      spot.y,
    ),
  ]
}

export function removeGradientStop(
  stops: readonly GradientStop[],
  id: string,
): GradientStop[] {
  if (stops.length <= GRADIENT_STOP_MIN) return [...stops]
  const next = stops.filter((stop) => stop.id !== id)
  return next.length < GRADIENT_STOP_MIN ? [...stops] : next
}

export function moveGradientStop(
  stops: readonly GradientStop[],
  id: string,
  x: number,
  y: number,
): GradientStop[] {
  return stops.map((stop) => (stop.id === id ? placeStop(stop, x, y) : stop))
}

/** Slide a ramp stop on X only, keeping its field Y position. */
export function moveGradientStopOffset(
  stops: readonly GradientStop[],
  id: string,
  offset: number,
): GradientStop[] {
  return stops.map((stop) =>
    stop.id === id ? placeStop(stop, offset, stop.y) : stop,
  )
}

export function recolorGradientStop(
  stops: readonly GradientStop[],
  id: string,
  color: string,
): GradientStop[] {
  return stops.map((stop) =>
    stop.id === id ? { ...stop, color: sanitizeHex(color, stop.color) } : stop,
  )
}

export function offsetFromClientX(
  clientX: number,
  bounds: { left: number; width: number },
): number {
  return bounds.width <= 0 ? 0 : clamp01((clientX - bounds.left) / bounds.width)
}

/** Inner field rect in client pixels (viewBox pad mapped through the SVG box). */
export function gradientFieldClientPlane(
  bounds: { left: number; top: number; width: number; height: number },
  viewWidth: number,
  viewHeight: number,
  pad: number,
): { left: number; top: number; width: number; height: number } {
  return {
    left: bounds.left + (pad / viewWidth) * bounds.width,
    top: bounds.top + (pad / viewHeight) * bounds.height,
    width: ((viewWidth - pad * 2) / viewWidth) * bounds.width,
    height: ((viewHeight - pad * 2) / viewHeight) * bounds.height,
  }
}

/** Hit-test hotspots in screen pixels so a wide-short graph keeps round targets. */
export function nearestGradientStopIdPx(
  stops: readonly GradientStop[],
  clientX: number,
  clientY: number,
  plane: { left: number; top: number; width: number; height: number },
  thresholdPx: number = GRADIENT_HANDLE_HIT_PX,
): string | null {
  if (stops.length === 0 || plane.width <= 0 || plane.height <= 0) return null
  let bestId: string | null = null
  let bestDist = thresholdPx
  for (const stop of stops) {
    const sx = plane.left + stop.x * plane.width
    const sy = plane.top + stop.y * plane.height
    const dist = Math.hypot(clientX - sx, clientY - sy)
    if (dist <= bestDist) {
      bestDist = dist
      bestId = stop.id
    }
  }
  return bestId
}
