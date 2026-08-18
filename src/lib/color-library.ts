/**
 * Named color library support for color-ish controls (gradient stops, stripe
 * rows, library color inputs). The package ships NO color data — consumers
 * inject their own `ColorLibrary` (groups of named swatches) through the field
 * defs, and these helpers resolve hexes to display tokens / wide-gamut CSS.
 */

export type LibraryColor = {
  label: string
  hex: string
  /** Optional pre-computed `color(display-p3 …)` string for this swatch. */
  p3?: string
  oklch?: string
}

export type LibraryGroup = {
  name: string
  colors: LibraryColor[]
}

export type ColorLibrary = ReadonlyArray<LibraryGroup>

export type LibraryColorMatch = {
  group: string
  label: string
  hex: string
  /** Stable display token, e.g. `Orange / 900 [Accent]`. */
  token: string
}

function normalizeHex(value: string): string {
  const raw = value.trim().replace(/^#/, "")
  return /^[0-9a-fA-F]{6}$/.test(raw) ? `#${raw.toLowerCase()}` : "#000000"
}

function p3ChannelFromHex(hex: string, start: number): string {
  return (Number.parseInt(hex.slice(start, start + 2), 16) / 255).toFixed(4)
}

export function p3CssFromHex(hex: string): string {
  const normalized = normalizeHex(hex).replace(/^#/, "")
  return `color(display-p3 ${p3ChannelFromHex(normalized, 0)} ${p3ChannelFromHex(normalized, 2)} ${p3ChannelFromHex(normalized, 4)})`
}

let supportsDisplayP3Cache: boolean | null = null

export function supportsDisplayP3Color(): boolean {
  if (supportsDisplayP3Cache !== null) return supportsDisplayP3Cache
  supportsDisplayP3Cache =
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("color", "color(display-p3 1 1 1)") &&
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(color-gamut: p3)").matches
  return supportsDisplayP3Cache
}

/** Library-provided p3 string when the hex matches a swatch, else derived. */
export function p3ColorForHex(hex: string, library?: ColorLibrary): string {
  const normalized = normalizeHex(hex)
  if (library) {
    for (const group of library) {
      for (const color of group.colors) {
        if (color.hex.toLowerCase() === normalized && color.p3) return color.p3
      }
    }
  }
  return p3CssFromHex(normalized)
}

/** Best CSS color for a hex — display-p3 on wide-gamut displays, else the hex. */
export function cssColorForHex(hex: string, library?: ColorLibrary): string {
  const normalized = normalizeHex(hex)
  return supportsDisplayP3Color() ? p3ColorForHex(normalized, library) : normalized
}

export function findLibraryColor(
  library: ColorLibrary,
  groupName: string,
  label: string,
): LibraryColor | null {
  const group = library.find((entry) => entry.name === groupName)
  if (!group) return null
  return group.colors.find((color) => color.label === label) ?? null
}

/** Resolve a hex to a library token when it matches a swatch exactly. */
export function findLibraryColorByHex(
  hex: string,
  library?: ColorLibrary,
): LibraryColorMatch | null {
  if (!library) return null
  const normalized = normalizeHex(hex)
  for (const group of library) {
    for (const color of group.colors) {
      if (color.hex.toLowerCase() === normalized) {
        return {
          group: group.name,
          label: color.label,
          hex: color.hex,
          token: `${group.name} / ${color.label}`,
        }
      }
    }
  }
  return null
}
