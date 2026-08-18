/**
 * `@tjcages/panels` overlay core (OFF-138) — renderer-agnostic.
 *
 * Imports nothing from `three` / `@react-three/fiber`. The R3F adapter that
 * supplies a `RendererBinding` lives in `@tjcages/panels/shader`.
 */

export { createOverlayProjector } from "./projector"
export type {
  OverlayAnchor,
  OverlayProjector,
  OverlayProjectorOptions,
  ProjectedPoint,
  RendererBinding,
  Vec3,
} from "./types"
