# Panels playground

In-repo Vite + React demos that drive the local `@tjcages/panels` package (source-aliased from `../src`). Toggle the floating panel and tweak the mock pages live.

This is **not** the hosted docs site. Region-earth is not here.

## Run

```sh
cd playground
pnpm install
pnpm dev
```

Then open the printed local URL. Production check:

```sh
pnpm build
pnpm preview
```

## Toggle the panel

- macOS: <kbd>Cmd</kbd>+<kbd>Alt</kbd>+<kbd>D</kbd>
- Windows / Linux: <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>D</kbd>

Edits persist under `localStorage` keys `panels:<id>` (`panels:settings`, `panels:kpis`, `panels:chart`).

## Demos

Use the in-page tabs to switch between **Settings** and **Dashboard**. Dashboard registers two panel targets (KPIs + Chart); the package header switcher scrolls between those sections.

`@tjcages/panels` resolves to `../src/index.ts` via the Vite alias, so a parent `pnpm build` is not required. Peer `react` / `react-dom` are the playground’s copies (`resolve.dedupe`).
