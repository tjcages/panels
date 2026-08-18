/**
 * `@tjcages/panels/shader` — the shader / WebGL / Three.js / R3F add-on.
 *
 * The core (`@tjcages/panels`) is renderer-agnostic. This entry adds the
 * batteries-included `useShaderPanel` hook (prompt rail on) plus the uniform
 * adapters and shader AI prompts. The adapters are also re-exported from the
 * package root for back-compat, but new shader code should import them here.
 */

export {
  createR3FAdapter,
  createWebGLAdapter,
  hexToRgb01,
  type CreateR3FAdapterOptions,
  type CreateWebGLAdapterOptions,
} from "../adapters"
export { patchShaderConfigDefaults } from "../patch-config"
export {
  DEFAULT_PANEL_PROMPTS,
  fillPanelPrompt,
  type PanelPrompt,
} from "../prompts"
export {
  useShaderPanel,
  type UseShaderPanelOptions,
} from "./use-shader-panel"
export {
  PanelOverlay,
  createR3FBinding,
  raycastSurface,
  type PanelOverlayProps,
  type RaycastSurface,
} from "./overlay"
export {
  useDragHandle,
  type UseDragHandleOptions,
  type UseDragHandleReturn,
  type DragHandleProps,
} from "./drag"
