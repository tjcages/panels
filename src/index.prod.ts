/**
 * Production no-op entry for shader-panel.
 *
 * Resolved automatically when bundlers (Vite, Webpack, Rollup, esbuild) build
 * with the `production` condition. The full panel — controls, store, styles,
 * keyboard handling, persistence I/O — is excluded from the bundle entirely.
 *
 * What stays: `createWebGLAdapter`, `createR3FAdapter`, `hexToRgb01`, and
 * `patchShaderConfigDefaults` — these are uniform / config utilities consumers
 * use in their actual shader runtime, not panel UI. Stripping them would break
 * shipping shaders.
 *
 * Everything else is replaced with the smallest stub that satisfies the dev
 * `.d.ts` declarations (still served via the `types` export condition).
 */

// Re-export types (zero runtime cost — type-only imports are erased).
export type {
  PanelActionField,
  PanelCollectionField,
  PanelCollectionItem,
  PanelColorField,
  PanelField,
  PanelGradientStopsField,
  PanelImageField,
  PanelReferenceField,
  PanelSide,
  PanelPathField,
  PanelPresetOption,
  PanelPresetsField,
  PanelSectionField,
  PanelSelectField,
  PanelSelectOption,
  PanelSliderField,
  PanelStripeTableField,
  PanelToggleField,
  PanelToggleGroupField,
  PanelToggleGroupOption,
  PanelVec2Field,
  PanelWriteResult,
} from "./types"
// Tiny utility — kept as a real impl since it has no UI deps.
export { isPanelSection } from "./types"
export type { PanelPrompt } from "./prompts"

// Overlay projector (OFF-138) — types re-exported; the projector no-ops in prod
// (no panel-driven overlays to position). `register` still returns an
// unregister fn and `destroy` is a no-op so consumer teardown stays valid.
export type {
  OverlayAnchor,
  OverlayProjector,
  OverlayProjectorOptions,
  ProjectedPoint,
  RendererBinding,
  Vec3,
} from "./overlay"
import type { OverlayProjector } from "./overlay"
export function createOverlayProjector(): OverlayProjector {
  return { register: () => () => {}, destroy: () => {} }
}
export type {
  PanelRegistration,
  PanelState,
} from "./store"
export type { PanelTheme } from "./hooks/use-theme"

// --- No-op runtime ----------------------------------------------------------

const NOOP = (): void => {}
const NULL_COMPONENT = (): null => null

// Constants
export const PANEL_CSS = ""
export const PANEL_STYLE_ID = "shader-dev-styles"
export const PANEL_TOGGLE_EVENT = "cf-shader-dev-toggle"

// Registry
export function registerPanel(): () => void {
  return NOOP
}
export const unregisterPanel = NOOP
export const setActivePanel = NOOP
export function getActivePanel(): null {
  return null
}
export function getActivePanelId(): null {
  return null
}
export function getActivePanelIdForSide(): null {
  return null
}
export function getActivePanelForSide(): null {
  return null
}
export function getPanelRegistration(): null {
  return null
}
const EMPTY_MAP: ReadonlyMap<string, never> = new Map<string, never>()
export function getPanelRegistrations(): ReadonlyMap<string, never> {
  return EMPTY_MAP
}
export function getPanelRegistrationsForSide(): never[] {
  return []
}
export function getPanelRevision(): number {
  return 0
}
export function subscribePanelRegistration(): () => void {
  return NOOP
}

// Capture registry — no-op in prod (no export panel to drive it).
export type {
  ShaderCaptureFn,
  ShaderGifExportFn,
  ShaderGifExportOptions,
  ShaderRecordFrameFn,
  ShaderRecordingOptions,
  ShaderVideoExportFn,
  ShaderVideoSession,
} from "./hooks/capture-registry"
export function registerShaderCapture(): () => void {
  return NOOP
}
export function getShaderCapture(): null {
  return null
}
export function subscribeShaderCapture(): () => void {
  return NOOP
}
export function registerShaderRecordCanvas(): () => void {
  return NOOP
}
export function getShaderRecordCanvas(): null {
  return null
}
export function registerShaderRecordPrepare(): () => void {
  return NOOP
}
export function getShaderRecordPrepare(): null {
  return null
}
export function registerShaderRecordFrame(): () => void {
  return NOOP
}
export function getShaderRecordFrame(): null {
  return null
}
export function registerShaderGifExport(): () => void {
  return NOOP
}
export function getShaderGifExport(): null {
  return null
}
export function registerShaderVideoExport(): () => void {
  return NOOP
}
export function getShaderVideoExport(): null {
  return null
}
export function subscribeShaderRecording(): () => void {
  return NOOP
}
export function setShaderRecording(): void {}

// Animation clock — always runs on real time in prod (no panel to pause).
export type { PanelAnimationSnapshot } from "./hooks/animation-clock"
export const PANEL_ANIMATION_STEP = 1 / 30
let prodAnimStart = typeof performance !== "undefined" ? performance.now() : 0
export function getPanelAnimationTime(): number {
  return (performance.now() - prodAnimStart) / 1000
}
export function advancePanelAnimationDelta(previousTime: number): {
  time: number
  delta: number
} {
  const nextTime = getPanelAnimationTime()
  const delta = Math.min(Math.max(0, nextTime - previousTime), 0.1)
  return { time: nextTime, delta }
}
export function getPanelAnimationSnapshot() {
  return { playing: true, time: getPanelAnimationTime(), rate: 1 }
}
export const playPanelAnimation = NOOP
export const pausePanelAnimation = NOOP
export const togglePanelAnimation = NOOP
export const stepPanelAnimationForward = NOOP
export const stepPanelAnimationBackward = NOOP
export const resetPanelAnimation = (): void => {
  prodAnimStart = performance.now()
}
export const setPanelAnimationTime = NOOP
export const setPanelAnimationRate = NOOP
export function getPanelAnimationRevision(): number {
  return 0
}
export function subscribePanelAnimation(): () => void {
  return NOOP
}
export const initPanelAnimationClock = NOOP

// Persistence — return defaults, never touch storage.
export function loadPersistedPanelValues<T>(_id: string, defaults: T): T {
  return { ...(defaults as object) } as T
}
export const persistPanelValues = NOOP
export const clearPersistedPanelValues = NOOP
export function hasPersistedPanelValues(): boolean {
  return false
}
export function loadPersistedPanelSections(): Record<string, boolean> {
  return {}
}
export const persistPanelSections = NOOP

// Keyboard / shortcut
export const dispatchPanelToggle = NOOP
export function readPanelOpenFlag(): boolean {
  return false
}
export const writePanelOpenFlag = NOOP
export const usePanelShortcut = NOOP
export const handlePanelShortcutKeydown = NOOP
export function installPanelKeyboard(): () => void {
  return NOOP
}
export function matchPanelShortcut(): boolean {
  return false
}

// Theme — minimal context, just enough to typecheck.
import { createContext, useContext, useState } from "react"
const ThemeContext = createContext<"dark" | "light">("dark")
export const PanelThemeProvider = ThemeContext.Provider
export function usePanelTheme(): "dark" | "light" {
  return "dark"
}
export function usePanelThemeContext(): "dark" | "light" {
  return useContext(ThemeContext)
}

// usePanel — in prod, just local state seeded with the defaults. No panel,
// no registry, no overlay. The shader runs with its default config.
export type { UsePanelOptions } from "./hooks/use-panel"
export function usePanel<T>(options: {
  defaults: T
}): [T, (next: T) => void] {
  return useState(() => ({ ...(options.defaults as object) }) as T)
}

// UI components — all return null in prod.
export type {
  AnyRenderableField,
  RenderedField,
  RenderFieldContext,
} from "./panel/render-field"
export function renderPanelField(): null {
  return null
}
export const PanelRoot = NULL_COMPONENT
export const Panel = NULL_COMPONENT
export const FloatingPanel = NULL_COMPONENT
export const PanelHeaderSelect = NULL_COMPONENT
export type {
  PanelHeaderSelectOption,
  PanelHeaderSelectProps,
} from "./panel/header-select"
export const PanelCloseButton = NULL_COMPONENT
export const PanelCloseIcon = NULL_COMPONENT
export type { PanelCloseButtonProps } from "./controls/close-button"
export const ToolShell = NULL_COMPONENT
export const ToolPanel = NULL_COMPONENT
export const PanelToolPanel = NULL_COMPONENT
export const PanelToggleButton = NULL_COMPONENT
export const EyeToggle = NULL_COMPONENT
export const ControlSlider = NULL_COMPONENT
export const ControlSection = NULL_COMPONENT
export const ControlColorInput = NULL_COMPONENT
export const ColorPopover = NULL_COMPONENT
export const colorPopoverStyles = ""
export type {
  ColorLibraryColor,
  ColorLibraryGroup,
  ColorPopoverProps,
} from "./controls/color-popover"
export const ControlImageInput = NULL_COMPONENT
export const ControlPath = NULL_COMPONENT
export type { ControlPathProps, PathPoint } from "./controls/path-input"
export const ControlToggle = NULL_COMPONENT
export const ControlToggleGroup = NULL_COMPONENT
export const ControlSelect = NULL_COMPONENT
export const ControlVec2 = NULL_COMPONENT
export const ControlPresets = NULL_COMPONENT
export const ControlCollection = NULL_COMPONENT
export const ControlReference = NULL_COMPONENT
export const ControlAnimation = NULL_COMPONENT

export const TOOL_PANEL_WIDTH = 280
export const TOOL_PANEL_INSET = 16
export const TOOL_PANEL_FULL = 296

// --- Connect panel UI port (OFF-455) — dev/prod export parity ---------------
// Pure helpers stay real (no UI deps); components become null renders and the
// style strings empty, matching the rest of the prod entry.
export {
  GRADIENT_STOP_MAX,
  GRADIENT_STOP_MIN,
  addGradientStop,
  defaultGradientStops,
  gradientCss,
  moveGradientStop,
  moveGradientStopOffset,
  normalizeGradientStops,
  rasterizeGradientField,
  recolorGradientStop,
  removeGradientStop,
  sampleGradientRgb,
  serializeGradientStops,
  sortGradientStops,
} from "./lib/gradient"
export {
  DEFAULT_CUSTOM_EASING,
  EASING_OPTIONS,
  easeValue,
  formatCustomEasing,
  parseCustomEasing,
} from "./lib/easing"
export {
  cssColorForHex,
  findLibraryColor,
  findLibraryColorByHex,
  p3ColorForHex,
  p3CssFromHex,
  supportsDisplayP3Color,
} from "./lib/color-library"
export { fromEditable, toEditable } from "./lib/stripe-adapter"
export { embedPngDpi, printMaxEdgePx } from "./lib/png-dpi"
export { clearPersistedPanelSections } from "./persist"
export const PANEL_THEME_STORAGE_KEY = "shader-dev-theme"
export const applyPanelTheme = NOOP
export const ControlAction = NULL_COMPONENT
export const ControlActionGroup = NULL_COMPONENT
export const ControlDisclosure = NULL_COMPONENT
export const ControlGradientStops = NULL_COMPONENT
export const ControlHint = NULL_COMPONENT
export const ControlLibraryColor = NULL_COMPONENT
export const ControlOptionList = NULL_COMPONENT
export const ControlReadout = NULL_COMPONENT
export const ControlSearchField = NULL_COMPONENT
export const ControlStripeColorsTable = NULL_COMPONENT
export const ControlTextInput = NULL_COMPONENT
export const ControlTextarea = NULL_COMPONENT
export const ControlThemeToggle = NULL_COMPONENT
export const EasingGraph = NULL_COMPONENT
export const NativeColorSwatch = NULL_COMPONENT
export const gradientStopsStyles = ""
export const stripeColorsTableStyles = ""
