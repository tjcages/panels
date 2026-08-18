/**
 * Production no-op entry for `@tjcages/panels/shader`.
 *
 * Resolved under the `production` condition. The adapters and config utilities
 * stay functional (consumers use them in their real shader runtime); the
 * `useShaderPanel` hook collapses to plain local state, and the prompt array
 * is dropped so the ~2 KB of prompt text never reaches the prod bundle.
 */

import { useState, type CSSProperties, type ReactNode } from "react"

// Overlay (OFF-138) — types re-exported from core; the R3F binding no-ops and
// PanelOverlay renders its children inline (no projection in prod, no three
// import). Keeps consumer markup valid when the panel compiles out.
export type { RendererBinding, Vec3 } from "../overlay/types"
import type { RendererBinding, Vec3 } from "../overlay/types"
export type PanelOverlayProps = {
  anchor: unknown
  visible?: boolean
  children?: ReactNode
}
export function PanelOverlay(props: PanelOverlayProps): ReactNode {
  return props.children ?? null
}
export function createR3FBinding(): RendererBinding {
  return { project: () => null, unproject: () => null, onFrame: () => () => {} }
}

// Drag helpers (OFF-139) — three-free prod stubs. `RaycastSurface` is opaque
// (the real shape needs three); the hook returns inert handlers so consumer
// markup stays valid when the panel compiles out.
export type RaycastSurface = unknown
export function raycastSurface(): Vec3 | null {
  return null
}
export type UseDragHandleOptions = {
  anchor?: Vec3
  onDrag: (world: Vec3) => void
  onDragStart?: (world: Vec3 | null) => void
  onDragEnd?: (world: Vec3 | null) => void
  surface?: RaycastSurface
}
export type DragHandleProps = {
  onPointerDown: (e: unknown) => void
  onPointerMove: (e: unknown) => void
  onPointerUp: (e: unknown) => void
  onPointerCancel: (e: unknown) => void
  style: CSSProperties
}
export type UseDragHandleReturn = {
  handleProps: DragHandleProps
  isDragging: () => boolean
}
const NOOP = (): void => {}
export function useDragHandle(
  _options: UseDragHandleOptions,
): UseDragHandleReturn {
  return {
    handleProps: {
      onPointerDown: NOOP,
      onPointerMove: NOOP,
      onPointerUp: NOOP,
      onPointerCancel: NOOP,
      style: {},
    },
    isDragging: () => false,
  }
}

// Functional utilities — kept in prod (no UI deps).
export {
  createR3FAdapter,
  createWebGLAdapter,
  hexToRgb01,
  type CreateR3FAdapterOptions,
  type CreateWebGLAdapterOptions,
} from "../adapters"
export { patchShaderConfigDefaults } from "../patch-config"
export type { PanelPrompt } from "../prompts"
export type { UseShaderPanelOptions } from "./use-shader-panel"

export const DEFAULT_PANEL_PROMPTS: ReadonlyArray<unknown> = []

// Pure string util — inlined so the prompt-text array stays out of the bundle.
export function fillPanelPrompt(prompt: string, shaderName?: string): string {
  const name = shaderName?.trim() || "shader"
  return prompt.replace(/\{\{\s*shader\s*\}\}/g, name)
}

// useShaderPanel — in prod, just local state seeded with the defaults.
export function useShaderPanel<T>(options: { defaults: T }): [T, (next: T) => void] {
  return useState(() => ({ ...(options.defaults as object) }) as T)
}
