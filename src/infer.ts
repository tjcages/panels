import type {
  PanelCollectionItem,
  PanelField,
  PanelSliderField,
  PanelVec2Field,
} from "./types"

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const MAX_STEP_DECIMALS = 4

/**
 * Infer a panel schema from a plain config object.
 *
 * Heuristics (runtime values only — TypeScript unions/enums are erased):
 * - `number` → slider. Range is 0–1 when the value sits in `[0, 1]`; otherwise
 *   a 1-2-5-10 magnitude scale around `abs(v) * 2`. Step follows decimal
 *   places (integers step 1).
 * - `#rgb` / `#rrggbb` string → color
 * - `boolean` → toggle
 * - `[x, y]` tuple of two finite numbers → vec2 (range/step unioned per axis)
 * - nested plain objects are skipped (the field renderer looks up keys on the
 *   parent record, so nested keys would not bind)
 * - `object[]` whose items look like `{ id: string, ... }` → collection, with
 *   inferred `itemFields` and a `newItem` factory that clones a blank item
 *
 * Plain non-hex strings are skipped: there is no `text` field on `PanelField`
 * yet, and inventing one here would fork the schema. Enum-like string unions
 * are likewise unrecoverable at runtime, so they are skipped too.
 */
export function inferPanelFields<T extends Record<string, unknown>>(
  defaults: T,
): PanelField<T>[] {
  if (!isPlainObject(defaults)) return []
  return inferObjectFields(defaults)
}

function inferObjectFields<T extends Record<string, unknown>>(
  values: T,
): PanelField<T>[] {
  const fields: PanelField<T>[] = []
  for (const key of Object.keys(values) as Array<keyof T & string>) {
    fields.push(...inferValueFields(key, values[key]))
  }
  return fields
}

function inferValueFields<T extends Record<string, unknown>>(
  key: keyof T & string,
  value: unknown,
): PanelField<T>[] {
  const label = humanizeKey(key)

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return []
    const range = inferNumberRange(value)
    const field: PanelSliderField<T> = {
      type: "slider",
      key,
      label,
      min: range.min,
      max: range.max,
      step: range.step,
    }
    return [field]
  }

  if (typeof value === "boolean") {
    return [{ type: "toggle", key, label }]
  }

  if (typeof value === "string") {
    if (!isHexColor(value)) return []
    return [{ type: "color", key, label }]
  }

  if (isVec2(value)) {
    const range = inferVec2Range(value)
    const field: PanelVec2Field<T> = {
      type: "vec2",
      key,
      label,
      min: range.min,
      max: range.max,
      step: range.step,
    }
    return [field]
  }

  if (isCollectionArray(value)) {
    const first = value[0]
    return [
      {
        type: "collection",
        key,
        label,
        itemFields: inferPanelFields(first),
        newItem: () => blankClone(first) as Omit<PanelCollectionItem, "id">,
      },
    ]
  }

  if (isPlainObject(value)) {
    // Nested records cannot bind through the current renderer (keys are
    // looked up on the parent). Skip until a group field exists.
    return []
  }

  return []
}

/** Sentence-case a camelCase / snake_case / kebab-case key (`bgColor` → `Bg color`). */
function humanizeKey(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (!spaced) return key
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase()
}

function isHexColor(value: string): boolean {
  return HEX_COLOR_RE.test(value.trim())
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false
  if (Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function isVec2(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  )
}

function isCollectionItem(
  value: unknown,
): value is Record<string, unknown> & PanelCollectionItem {
  return isPlainObject(value) && typeof value.id === "string"
}

function isCollectionArray(
  value: unknown,
): value is Array<Record<string, unknown> & PanelCollectionItem> {
  return Array.isArray(value) && value.length > 0 && value.every(isCollectionItem)
}

type NumberRange = { min: number; max: number; step: number }

function inferNumberRange(value: number): NumberRange {
  const step = inferStep(value)
  if (value >= 0 && value <= 1) {
    return { min: 0, max: 1, step }
  }
  const max = magnitudeMax(Math.abs(value))
  if (value < 0) return { min: -max, max, step }
  return { min: 0, max, step }
}

function inferVec2Range(value: [number, number]): NumberRange {
  const a = inferNumberRange(value[0])
  const b = inferNumberRange(value[1])
  return {
    min: Math.min(a.min, b.min),
    max: Math.max(a.max, b.max),
    step: Math.min(a.step, b.step),
  }
}

/** Step from decimal places; integers step 1. Caps at 4 fractional digits. */
function inferStep(value: number): number {
  const places = decimalPlaces(value)
  if (places <= 0) return 1
  return 10 ** -Math.min(places, MAX_STEP_DECIMALS)
}

function decimalPlaces(value: number): number {
  if (Number.isInteger(value)) return 0
  const rounded = Math.round(value * 10 ** MAX_STEP_DECIMALS) / 10 ** MAX_STEP_DECIMALS
  if (Number.isInteger(rounded)) return 0
  const abs = Math.abs(rounded)
  const str = String(abs)
  if (str.includes("e") || str.includes("E")) {
    const [mantissa, expRaw] = str.split(/[eE]/)
    const exp = Number(expRaw)
    const mantDec = (mantissa.split(".")[1] ?? "").length
    return Math.max(0, mantDec - exp)
  }
  return (str.split(".")[1] ?? "").length
}

/**
 * Upper bound around `abs(v) * 2`, snapped up to a 1-2-5-10 decade so a
 * default of 24 yields 50 rather than 48.
 */
function magnitudeMax(mag: number): number {
  const scaled = mag * 2
  if (!Number.isFinite(scaled) || scaled <= 0) return 1
  const exp = Math.floor(Math.log10(scaled))
  const base = 10 ** exp
  const n = scaled / base
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return nice * base
}

/** Shape-preserving blank clone for collection `newItem` — drops `id`. */
function blankClone(value: unknown): unknown {
  if (typeof value === "number") return 0
  if (typeof value === "boolean") return false
  if (typeof value === "string") return isHexColor(value) ? "#000000" : ""
  if (isVec2(value)) return [0, 0]
  if (isCollectionArray(value)) return []
  if (Array.isArray(value)) return value.map(blankClone)
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(value)) {
      if (key === "id") continue
      out[key] = blankClone(child)
    }
    return out
  }
  return value
}
