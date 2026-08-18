# Panels docs + playground

Vite + React site that drives the local `@tjcages/panels` package (source-aliased from `../src`). Hash routes cover install, field types, collections, overlay, export, and theming, plus the Settings / Dashboard recipe demos.

Region-earth is not here.

## Run

```sh
cd playground
pnpm install
pnpm dev
```

Toggle the panel: <kbd>Cmd</kbd>+<kbd>Alt</kbd>+<kbd>D</kbd> / <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>D</kbd>.

Production:

```sh
pnpm build
pnpm preview
```

GitHub Pages (this repo): enable **Settings → Pages → GitHub Actions**. The `Pages` workflow deploys `playground/dist` to `https://tjcages.github.io/panels/`.
