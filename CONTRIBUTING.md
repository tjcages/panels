# Contributing

## Versioning

The package stays **0.x** until Phase 8 launch, then **1.0**.

In 0.x, a breaking change bumps **minor** (not major) and needs a `CHANGELOG.md` entry. Additive changes bump patch. After 1.0, ordinary semver applies (breaking → major).

## Blessed surface

Document and treat these as the intended public API:

- `usePanel` and `PanelField` types
- `FloatingPanel` (including `float`)
- `PanelHeaderSelect`
- `renderPanelField`
- `ColorPopover`
- control primitives (`ControlSlider`, `ControlToggle`, …)
- shader adapters (`createWebGLAdapter`, `createR3FAdapter` on `@tjcages/panels/shader`)
- `--panel-*` CSS custom properties (theming)

Names already on the package root stay exported until a later prune. Do not remove or rename one without a breaking-change bump.

## Frozen runtime names

`api-exports.txt` is the committed snapshot of **runtime** names on the package root (`dist/index.js`). Type-only exports do not appear there.

- Adding a name is fine — refresh the snapshot in the same PR.
- Removing or renaming a name is a **breaking change** (0.x: bump minor + CHANGELOG).

Refresh after a build:

```sh
pnpm build && node scripts/check-public-exports.mjs --write
```

CI fails if `dist/index.js` disagrees with the snapshot.

## Dev / prod parity

The `development` and `production` entries must export the **same names**. CI already checks this. A production no-op stub still has to list every runtime export.
