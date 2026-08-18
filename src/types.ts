import type { ColorLibrary } from "./lib/color-library"

export type PanelSide = "left" | "right"

export type PanelSectionField = {
  type: "section"
  title: string
}

export type PanelSliderField<T extends Record<string, unknown>> = {
  type: "slider"
  key: keyof T & string
  label: string
  min: number
  max: number
  step: number
  /** Optional one-line hint rendered as small muted text above the slider.
   *  Use sparingly — only when behaviour can't be conveyed in the label. */
  description?: string
}

export type PanelColorField<T extends Record<string, unknown>> = {
  type: "color"
  key: keyof T & string
  label: string
  /**
   * Named color library. When set the field renders as a library color row —
   * swatch + token display (`Orange / 900 [Accent]`) for matching hexes.
   */
  library?: ColorLibrary
  /**
   * Accepts null values with a clear (×) affordance — the value reads as
   * "Transparent" when unset. Mirrors the site schemas' persist option so
   * they stay portable; the package itself does no extra persistence.
   */
  persist?: "backgroundColor"
  /** Optional one-line hint rendered as small muted text above the color field. */
  description?: string
}

export type PanelToggleField<T extends Record<string, unknown>> = {
  type: "toggle"
  key: keyof T & string
  label: string
  /** Optional one-line hint rendered as small muted text above the toggle. */
  description?: string
}

export type PanelSelectOption = {
  value: string | number
  label: string
}

export type PanelSelectField<T extends Record<string, unknown>> = {
  type: "select"
  key: keyof T & string
  label: string
  options: ReadonlyArray<PanelSelectOption>
  /** Label above control (default) or on the same row. */
  layout?: "inline" | "stacked"
  description?: string
}

export type PanelToggleGroupOption = {
  value: string | number
  /** Text label. Omit when using an icon-only option. */
  label?: string
}

/**
 * Segmented single-select control — N option buttons sharing one track, the
 * selected value highlighted. Options render as text (via `label`); icon
 * options are only available when constructing `ControlToggleGroup` directly.
 */
export type PanelToggleGroupField<T extends Record<string, unknown>> = {
  type: "toggle-group"
  key: keyof T & string
  label: string
  options: ReadonlyArray<PanelToggleGroupOption>
  description?: string
}

/**
 * Pair of coupled sliders that read/write a `[x, y]` tuple at `key`.
 * Use for direction vectors, scroll offsets, anchor positions, etc.
 */
export type PanelVec2Field<T extends Record<string, unknown>> = {
  type: "vec2"
  key: keyof T & string
  label: string
  min: number
  max: number
  step: number
  /** Optional per-axis labels. Default to "X" / "Y". */
  xLabel?: string
  yLabel?: string
}

/**
 * Image slot backed by a string URL (asset path, blob/object URL, or data URL).
 *
 * Renders a thumbnail preview; unless `readonly`, clicking (or dropping a file
 * onto) the preview picks a local file and writes an object URL to the config.
 *
 * Image values are NEVER persisted to localStorage — object URLs don't survive
 * a reload, so on refresh the field falls back to its default.
 */
export type PanelImageField<T extends Record<string, unknown>> = {
  type: "image"
  key: keyof T & string
  label: string
  /** Preview-only slot for generated outputs (e.g. a depth map) — no upload UI. */
  readonly?: boolean
  /** `accept` attribute for the file picker. Default `"image/*"`. */
  accept?: string
  /** Muted text shown when the value is an empty string. */
  emptyLabel?: string
  description?: string
}

/**
 * 2D waypoint path editor. The value is an ordered array of `[x, y]` points a
 * light (or anything) travels through. Click the pad to append a point, drag a
 * point to move it, double-click to remove it.
 *
 * `anchorKey` optionally names another config key holding the `[x, y]` home
 * position, drawn as the start of the path (waypoints chain off it). When set,
 * the home point is draggable on the path pad and writes back to that key.
 */
export type PanelPathField<T extends Record<string, unknown>> = {
  type: "path"
  key: keyof T & string
  label: string
  min: number
  max: number
  anchorKey?: keyof T & string
  description?: string
}

/**
 * Gradient stop editor. The value at `key` is a `GradientStop[]` (or a
 * serialized JSON string of one — both normalize on render): colored hotspots
 * on a unit plane, edited on a 2D field preview (or a 1D ramp track) with
 * draggable stops, add/remove, and per-stop color via the color popover.
 */
export type PanelGradientStopsField<T extends Record<string, unknown>> = {
  type: "gradient-stops"
  key: keyof T & string
  label: string
  /** Named color library for token display on the selected stop. */
  library?: ColorLibrary
  /** `field` (2D hotspot plane, default) or `ramp` (1D stop track). */
  layout?: "field" | "ramp"
  description?: string
}

export type PanelStripeTableOptions = {
  /** Show the brightness-ramp easing select + graph. */
  showRampEasing?: boolean
  /** Show per-row color swatches. Default `true`; off = image-driven levels. */
  showColorControls?: boolean
  /**
   * Show a "Save palette" button — wire the handler via `actionHandlers`
   * under the key `` `${field.key}:savePalette` ``.
   */
  showSavePalette?: boolean
  /** Sibling config key holding the ramp easing string (`EasingName`). */
  rampEasingKey?: string
  /** Sibling config key holding the threshold easing string. */
  thresholdEasingKey?: string
}

/**
 * Stripe rows table. The value at `key` is an `EditableStripe[]` — per row a
 * color swatch, opacity/threshold/width sliders, drag reorder, add/remove,
 * and a flip-color-order action. Easing selects read/write sibling keys named
 * in `options`.
 */
export type PanelStripeTableField<T extends Record<string, unknown>> = {
  type: "stripe-table"
  key: keyof T & string
  label: string
  options?: PanelStripeTableOptions
  /** Named color library for token display + wide-gamut swatches. */
  library?: ColorLibrary
  description?: string
}

/**
 * One-off action button — does not read or write config. Wire handlers via
 * `actionHandlers` on `usePanel` / `Panel`.
 */
export type PanelActionField = {
  type: "action"
  /** Key into the `actionHandlers` map passed to the panel. */
  actionId: string
  label: string
  description?: string
  variant?: "default" | "primary"
  /** Optional predicate — hide the button when this returns false. */
  when?: (values: Record<string, unknown>) => boolean
}

/**
 * One-click preset that merges partial values or replaces the full config.
 * Use a function for presets that need the current state (e.g. reset-all).
 */
export type PanelPresetOption<T extends Record<string, unknown>> = {
  label: string
  /** Merge partial values or replace via function. Omit when using `actionId`. */
  values?: Partial<T> | ((current: T) => T)
  /** Call a handler from `actionHandlers` instead of merging values. */
  actionId?: string
}

export type PanelPresetsField<T extends Record<string, unknown>> = {
  type: "presets"
  /** Optional heading above the preset buttons. */
  label?: string
  presets: ReadonlyArray<PanelPresetOption<T>>
}

/** Minimum contract for a collection item — a stable string id. */
export type PanelCollectionItem = { id: string }

/**
 * A managed list of items stored as an array at `key` (`T[key]` is `Item[]`).
 * Each item is edited through its own `itemFields`, rendered recursively via
 * the same field renderer every other control uses — so sliders, selects,
 * colors, references, etc. all work unchanged inside an item.
 *
 * Items MUST carry a stable `id: string`. On add, if `newItem()` omits it the
 * collection assigns one (`crypto.randomUUID()` with a counter fallback). `id`
 * is what React keys, reorder, selection, and references use.
 */
export type PanelCollectionField<
  T extends Record<string, unknown>,
  Item extends PanelCollectionItem = PanelCollectionItem,
> = {
  type: "collection"
  /** `T[key]` must be `Item[]`. */
  key: keyof T & string
  label: string
  /**
   * Fields rendered for each item. A function receives the item + its index so
   * you can return per-item / per-type schemas (e.g. branch on `item.kind`).
   */
  itemFields:
    | PanelField<Item>[]
    | ((item: Item, index: number) => PanelField<Item>[])
  /** Row title. Default `${label} ${i + 1}`. */
  itemLabel?: (item: Item, index: number) => string
  /** "Add" factory. Omit to hide the add button (list becomes read-only-size). */
  newItem?: () => Omit<Item, "id"> | Item
  /** Add-button label. Default `Add ${singular(label)}`. */
  addLabel?: string
  /** Block remove below this count. */
  min?: number
  /** Block add above this count. */
  max?: number
  /** Show a drag handle to reorder. Default `true`. */
  reorderable?: boolean
  /** Allow several rows open at once. Default `false` (single-open selection). */
  multiOpen?: boolean
  /**
   * Applied to `T[key]` on load (after persistence merge) for versioned
   * item-shape changes — e.g. renaming a field across a schema bump.
   */
  migrate?: (items: Item[]) => Item[]
  description?: string
}

/**
 * Points at an item (or items) in a sibling collection. The value at `key` is
 * a string id, or `string[]` when `multiple`. Resolving the label needs the
 * sibling collection, so the renderer receives the ROOT state, not just the
 * item being edited.
 */
export type PanelReferenceField<T extends Record<string, unknown>> = {
  type: "reference"
  /** Value is a string id, or `string[]` when `multiple`. */
  key: keyof T & string
  label: string
  /** The sibling collection key whose items are the choices. */
  collection: keyof T & string
  /** Allow multiple targets. Default `false`. */
  multiple?: boolean
  /** How each choice reads. Default `itemLabel` / the item's `id`. */
  optionLabel?: (item: PanelCollectionItem) => string
  /** Shown when unset. */
  placeholder?: string
  description?: string
}

export type PanelField<T extends Record<string, unknown>> =
  | PanelSectionField
  | PanelSliderField<T>
  | PanelColorField<T>
  | PanelToggleField<T>
  | PanelSelectField<T>
  | PanelToggleGroupField<T>
  | PanelVec2Field<T>
  | PanelImageField<T>
  | PanelPathField<T>
  | PanelGradientStopsField<T>
  | PanelStripeTableField<T>
  | PanelActionField
  | PanelPresetsField<T>
  | PanelCollectionField<T>
  | PanelReferenceField<T>

export type PanelWriteResult = { ok: boolean; message: string }

export function isPanelSection(
  field: PanelField<Record<string, unknown>>,
): field is PanelSectionField {
  return field.type === "section"
}
