---
name: panels
description: Add a live React control panel with usePanel from @tjcages/panels. Use when asked to add a panel, wire usePanel, install @tjcages/panels, or expose live-tweakable state (sliders, colors, collections) on a shader, canvas, simulation, or config object.
---

# @tjcages/panels

Drop-in floating panel. One hook owns the state and injects the UI. Compiles out of production. Toggle with ⌘⌥D / Ctrl+Alt+D. Install with `npx @tjcages/panels setup`, `npx skills add tjcages/panels --skill panels`, or Claude Code `/plugin marketplace add tjcages/panels` then `/plugin install panels@tjcages-panels`.

## Steps

1. Install the package (do not add other dependencies):

   ```sh
   npm install @tjcages/panels
   ```

2. Open the file that owns the values. Follow **`SETUP_PROMPT.md`** in this package (paste it if needed). Steps 1–7 are the simple case: infer fields, call `usePanel`, wire `config` through, adapters for shaders, multi-target `scrollTo` / `onSelect`. Steps 8–10 only if the file has item lists, a canvas overlay, or a custom export path.

3. Verify before finishing:

   - Editing a control changes the thing on screen.
   - Reload keeps edits (`usePanel` persists to `localStorage` unless `persist: false`).
   - Multi-target: the header switcher scrolls (`scrollTo`) or routes (`onSelect`) and then shows that target's fields.

  4. Field types, collections, overlay/drag, capture registry, and production no-op: read **`AGENTS.md`**. Prefer `registerPanel*` capture names (`registerShader*` aliases remain). Recipes: `examples/` in the repo. Shorter copy: `llms.txt`.

## Rules

- Import from `@tjcages/panels`, not `/dev`.
- Do not wrap production UI in `ToolShell` / `PanelRoot` — `usePanel` auto-mounts.
- `usePanel({ onSelect })` is target navigation, not collection-row selection. Bind canvas ↔ row with `PanelOverlay` `panelId` / `collectionKey` / `itemId` (or `select`). Drive loops with `usePanelFrame`; R3F demand canvases need `<PanelClock />`.
