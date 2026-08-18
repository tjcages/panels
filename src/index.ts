export { type PanelPrompt } from "./prompts"
export { createOverlayProjector } from "./overlay"
export type {
  OverlayAnchor,
  OverlayProjector,
  OverlayProjectorOptions,
  ProjectedPoint,
  RendererBinding,
  Vec3,
} from "./overlay"
export {
  clearPersistedPanelSections,
  clearPersistedPanelValues,
  hasPersistedPanelValues,
  loadPersistedPanelSections,
  loadPersistedPanelValues,
  persistPanelSections,
  persistPanelValues,
} from "./persist"
export {
  PanelCloseButton,
  PanelCloseIcon,
  type PanelCloseButtonProps,
} from "./controls/close-button"
export { FloatingPanel } from "./panel/floating-panel"
export {
  PanelHeaderSelect,
  type PanelHeaderSelectOption,
  type PanelHeaderSelectProps,
} from "./panel/header-select"
export { Panel } from "./panel/panel"
export {
  renderPanelField,
  type AnyRenderableField,
  type RenderedField,
  type RenderFieldContext,
} from "./panel/render-field"
export { PanelRoot } from "./panel/root"
export {
  EyeToggle,
  PanelToggleButton,
  ToolShell,
  type EyeToggleProps,
  type PanelToggleButtonProps,
  type ToolShellProps,
} from "./panel/tool-shell"
export { PanelToolPanel, ToolPanel, type ToolPanelProps } from "./panel/tool-panel"

export {
  TOOL_PANEL_FULL,
  TOOL_PANEL_INSET,
  TOOL_PANEL_WIDTH,
} from "./constants"

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
  PanelStripeTableOptions,
  PanelToggleField,
  PanelToggleGroupField,
  PanelToggleGroupOption,
  PanelVec2Field,
  PanelWriteResult,
} from "./types"
export { isPanelSection } from "./types"

export {
  getActivePanel,
  getActivePanelForSide,
  getActivePanelId,
  getActivePanelIdForSide,
  getPanelRegistration,
  getPanelRegistrations,
  getPanelRegistrationsForSide,
  getPanelRevision,
  registerPanel,
  setActivePanel,
  subscribePanelRegistration,
  unregisterPanel,
  getPanelCollectionSelection,
  selectPanelCollectionItem,
  subscribePanelCollectionSelection,
  type PanelCollectionSelection,
  type PanelRegistration,
  type PanelState,
} from "./store"

export {
  usePanel,
  type UsePanelOptions,
} from "./hooks/use-panel"

export { inferPanelFields } from "./infer"

export {
  usePanelFrame,
  type PanelFrameTick,
  type UsePanelFrameCallback,
} from "./hooks/use-panel-frame"

export {
  getShaderCapture,
  getShaderGifExport,
  getShaderRecordCanvas,
  getShaderRecordFrame,
  getShaderRecordPrepare,
  getShaderVideoExport,
  registerShaderCapture,
  registerShaderGifExport,
  registerShaderRecordCanvas,
  registerShaderRecordFrame,
  registerShaderRecordPrepare,
  registerShaderVideoExport,
  subscribeShaderCapture,
  subscribeShaderRecording,
  setShaderRecording,
  type ShaderCaptureFn,
  type ShaderGifExportFn,
  type ShaderGifExportOptions,
  type ShaderRecordFrameFn,
  type ShaderRecordingOptions,
  type ShaderVideoExportFn,
  type ShaderVideoSession,
} from "./hooks/capture-registry"

export {
  PANEL_ANIMATION_STEP,
  advancePanelAnimationDelta,
  getPanelAnimationRevision,
  getPanelAnimationSnapshot,
  getPanelAnimationTime,
  initPanelAnimationClock,
  pausePanelAnimation,
  playPanelAnimation,
  resetPanelAnimation,
  setPanelAnimationRate,
  setPanelAnimationTime,
  stepPanelAnimationBackward,
  stepPanelAnimationForward,
  subscribePanelAnimation,
  togglePanelAnimation,
  type PanelAnimationSnapshot,
} from "./hooks/animation-clock"

export {
  ControlAnimation,
  type ControlAnimationProps,
} from "./controls/animation-controls"

export {
  dispatchPanelToggle,
  readPanelOpenFlag,
  PANEL_TOGGLE_EVENT,
  usePanelShortcut,
  writePanelOpenFlag,
} from "./hooks/use-shortcut"

export {
  handlePanelShortcutKeydown,
  installPanelKeyboard,
  matchPanelShortcut,
} from "./hooks/keyboard"

/** @deprecated Use layout inline script + PanelRoot */
export { embedPngDpi, printMaxEdgePx } from "./lib/png-dpi"

export {
  PanelThemeProvider,
  applyPanelTheme,
  PANEL_THEME_STORAGE_KEY,
  usePanelTheme,
  usePanelThemeContext,
  type PanelTheme,
} from "./hooks/use-theme"

/**
 * Raw stylesheet + id, exported so consumers with custom SSR setups can inject
 * the styles themselves. The components inject these automatically on mount —
 * you only need this when you want to control the timing.
 */
export {
  PANEL_CSS,
  PANEL_STYLE_ID,
} from "./styles"

export {
  ControlAction,
  type ControlActionProps,
} from "./controls/action"
export {
  ControlActionGroup,
  type ControlActionGroupProps,
} from "./controls/action-group"
export { ControlSlider, type ControlSliderProps } from "./controls/slider"
export { ControlSection, type ControlSectionProps } from "./controls/section"
export {
  ControlColorInput,
  type ControlColorInputProps,
} from "./controls/color-input"
export {
  ColorPopover,
  colorPopoverStyles,
  type ColorLibraryColor,
  type ColorLibraryGroup,
  type ColorPopoverProps,
} from "./controls/color-popover"
export {
  ControlImageInput,
  type ControlImageInputProps,
} from "./controls/image-input"
export {
  ControlPath,
  type ControlPathProps,
  type PathPoint,
} from "./controls/path-input"
export { ControlToggle, type ControlToggleProps } from "./controls/toggle"
export {
  ControlToggleGroup,
  type ControlToggleGroupOption,
  type ControlToggleGroupProps,
} from "./controls/toggle-group"
export {
  ControlThemeToggle,
  type ControlThemeToggleProps,
} from "./controls/theme-toggle"
export { ControlSelect, type ControlSelectProps } from "./controls/select"
export { ControlVec2, type ControlVec2Props } from "./controls/vec2"
export {
  ControlPresets,
  type ControlPresetOption,
  type ControlPresetsProps,
} from "./controls/presets"
export {
  ControlDisclosure,
  type ControlDisclosureProps,
} from "./controls/disclosure"
export {
  ControlCollection,
  type ControlCollectionProps,
} from "./controls/collection"
export {
  ControlReference,
  type ControlReferenceProps,
} from "./controls/reference"
export {
  ControlHint,
  type ControlHintProps,
} from "./controls/hint"
export {
  ControlOptionList,
  type ControlOptionListItem,
  type ControlOptionListProps,
} from "./controls/option-list"
export {
  ControlReadout,
  type ControlReadoutProps,
} from "./controls/readout"
export {
  ControlSearchField,
  type ControlSearchFieldProps,
} from "./controls/search-field"
export {
  ControlTextInput,
  type ControlTextInputProps,
} from "./controls/text-input"
export {
  ControlTextarea,
  type ControlTextareaProps,
} from "./controls/textarea"
export {
  ControlGradientStops,
  ControlLibraryColor,
  NativeColorSwatch,
  gradientStopsStyles,
  type ControlGradientStopsLayout,
  type ControlGradientStopsProps,
  type ControlLibraryColorProps,
  type PanelColorPopoverProps,
  type PanelColorPopoverRenderer,
} from "./controls/gradient-stops"
export {
  ControlStripeColorsTable,
  EasingGraph,
  stripeColorsTableStyles,
  type ControlStripeColorsTableProps,
  type EasingGraphProps,
} from "./controls/stripe-colors-table"

export {
  cssColorForHex,
  findLibraryColor,
  findLibraryColorByHex,
  p3ColorForHex,
  p3CssFromHex,
  supportsDisplayP3Color,
  type ColorLibrary,
  type LibraryColor,
  type LibraryColorMatch,
  type LibraryGroup,
} from "./lib/color-library"

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
  type GradientStop,
} from "./lib/gradient"

export {
  DEFAULT_CUSTOM_EASING,
  EASING_OPTIONS,
  easeValue,
  formatCustomEasing,
  parseCustomEasing,
  type CustomEasingControlPoints,
  type EasingName,
  type PresetEasingName,
} from "./lib/easing"

export {
  fromEditable,
  toEditable,
  type EditableStripe,
  type EngineStripe,
} from "./lib/stripe-adapter"
