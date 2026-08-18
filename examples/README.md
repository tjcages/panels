# Recipes

Copy these into the **host app**. This folder is not compiled and is not in the package build. Runnable Settings + Dashboard demos live in [`playground/`](../playground) and at [offbr.co/tools/panels/docs](https://offbr.co/tools/panels/docs/). A hosted gallery is still a separate track.

Each recipe is a minimal integration: files an agent would edit, plus one complete TSX snippet. Paste into the component that owns the values. Do not wrap production UI in `ToolShell` / `PanelRoot`.

| Recipe | When | File |
|---|---|---|
| Shader / WebGL | Canvas or `ShaderMount` uniforms | [shader-webgl.md](./shader-webgl.md) |
| R3F scene | React Three Fiber materials / panel clock | [r3f-scene.md](./r3f-scene.md) |
| Map + POIs | Item lists, canvas pins, optional drag | [map-pois.md](./map-pois.md) |
| Form / dashboard | Page config, thresholds, series, multi-target | [form-dashboard.md](./form-dashboard.md) |
| Settings panel | Theme, flags, presets, persist | [settings-panel.md](./settings-panel.md) |

## Rules every recipe assumes

- Import `usePanel` from `@tjcages/panels`, not `@tjcages/panels/dev`.
- Prefer an explicit `fields` array. Omit `fields` (or pass `[]`) to infer: number → slider, hex string → color, boolean → toggle, `[x,y]` → vec2, `{ id: string }[]` → collection. Nested objects and non-hex strings are skipped. There is **no** `type: "text"` field.
- Persist key is `panels:<id>` in `localStorage`. Pass `persist: false` to skip value I/O.
- `usePanel({ onSelect })` is **target** navigation (header switcher), not collection-row select.
- Production builds compile the panel out (~5 KB no-op). Shader adapters stay live. Overlay / drag / capture / UI stub.
- Toggle the panel with ⌘⌥D / Ctrl+Alt+D.
