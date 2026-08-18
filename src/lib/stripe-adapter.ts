/**
 * Row shape for the stripe colors table, plus adapters to/from the numeric
 * `color` shape stripe engines use (structural match for
 * `@necatikcl/stripes-engine`'s `Stripe` — no dependency taken).
 */

export type EngineStripe = {
  color: number
  startFrom: number
  width: number
  opacity: number
}

export type EditableStripe = {
  id: string
  hex: string
  startFrom: number
  width: number
  opacity: number
}

export function toEditable(stripes: EngineStripe[]): EditableStripe[] {
  return stripes.map((s, index) => ({
    id: String(index),
    hex: `#${s.color.toString(16).padStart(6, "0")}`,
    startFrom: s.startFrom,
    width: s.width,
    opacity: s.opacity,
  }))
}

export function fromEditable(rows: EditableStripe[]): EngineStripe[] {
  return rows.map((r) => ({
    color: parseInt(r.hex.replace(/^#/, ""), 16) || 0,
    startFrom: r.startFrom,
    width: r.width,
    opacity: r.opacity,
  }))
}
