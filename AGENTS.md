# @tjcages/panels — agent catalog

Machine-legible primitive catalog. Human install prompt: `SETUP_PROMPT.md`.
Short copy: `llms.txt`. Skill: `skills/panels/SKILL.md`.

Do not invent APIs that are not listed here. Source of truth is `src/`.

Package: `@tjcages/panels` (`react` / `react-dom` peers). Optional peers
`three` + `@react-three/fiber` only if you import `@tjcages/panels/shader`
overlay / drag helpers.

Toggle: `⌘⌥D` / `Ctrl+Alt+D`.

---

## Composition rules

- Call `usePanel` in the component that owns the values. Do **not** wrap
  production UI in `ToolShell`, `PanelRoot`, or extra chrome. The hook
  auto-injects the panel (`autoMount: true` default).
- Prefer an explicit `fields` array. If omitted or `[]`, `usePanel` infers
  from `defaults`: number → slider, hex string → color, boolean → toggle,
  `[x,y]` → vec2, `{id}[]` → collection. Nested plain objects and non-hex
  strings are skipped (no group/`text` field). An explicit list always wins.
- Group related fields with `{ type: "section", title }`. Sections are
  headings, not values — they have no `key`.
- Nest the same `PanelField` union inside `collection.itemFields`.
  Recursion is the point: sliders, colors, references, etc. all work on
  an item. `reference` fields resolve sibling collections from **root**
  state, not the item.
- One `usePanel` per target (`id` + `title` unique). Two-plus targets on
  the same `side` get a header switcher automatically.
- Import from `@tjcages/panels`, not `@tjcages/panels/dev`, unless you
  are forcing the full panel into a production bundle on purpose.
- Shader adapters map scalar/vector fields only. Do not feed
  `collection` / `reference` / `image` / `path` / `gradient-stops` /
  `stripe-table` through `createWebGLAdapter` / `createR3FAdapter`.
- There is no `type: "text"` field. `ControlTextInput` / `ControlTextarea`
  exist for custom shells, not the schema.

---

## `usePanel`

```ts
import { usePanel, type PanelField } from "@tjcages/panels"

const [config, setConfig] = usePanel<T>({
  id: string              // required. localStorage key `panels:<id>`
  title: string           // required. header + switcher label
  defaults: T             // required. seed + persist merge base
  fields?: PanelField<T>[] // omit or [] → infer from defaults; explicit wins
  persist?: boolean       // default true. false → no value I/O; section
                          // open/close still persists when `id` is set
  scrollTo?: string       // CSS selector; scrolled into view when this
                          // target is picked in the header switcher
  onSelect?: () => void   // TARGET navigation (route, focus, …). Fires
                          // AFTER the target becomes active, after scrollTo.
                          // NOT collection-row selection.
  autoMount?: boolean     // default true. false → render <PanelRoot/> yourself
  // also: side?: "left" | "right" (default "right")
  //       prompts?: PanelPrompt[] (default [] — no AI rail)
  //       actionHandlers?: Record<string, () => void>
  //       onWriteConfig?: (values: T) => Promise<{ ok, message }>
  //       writeLabel?: string
  //       defaultTheme?: "light" | "dark"
  //       defaultOpen?: boolean  // first auto-mount this session
})
```

Returns a `useState`-style `[T, (next: T) => void]`. Typed setter takes
the next object (React's setter still accepts a functional updater at
runtime). Feed `config` into your render / uniforms / physics / CSS.

Shaders that want the built-in AI-prompt rail: `useShaderPanel` from
`@tjcages/panels/shader` — same options, prompts default on. Pass
`prompts: []` to hide.

Name collision: `usePanel({ onSelect })` is **target navigation** (header
switcher). `Panel` (custom shells) has a **different**
`onSelect?: (collectionKey: string, id: string | null) => void` that
fires when a collection row opens. Auto-mounted `usePanel` does **not**
wire that callback. Two-way canvas ↔ row binding uses
`selectPanelCollectionItem` / `PanelOverlay` `panelId`+`collectionKey`+
`itemId` (or `select`) — not `usePanel.onSelect`.

---

## `PanelField` types

Every member of `PanelField<T>` and when to use it. `key` is `keyof T & string`
unless noted.

| `type` | Value at `key` | Use when | Notes |
|---|---|---|---|
| `section` | — | Group the fields that follow | `{ title }`. No `key`. Collapsible. |
| `slider` | `number` | Scalar with a range | `{ key, label, min, max, step, description? }` |
| `color` | `string` hex (`#rrggbb`) | Color | `{ key, label, library?, persist?, description? }`. `library` → token row. `persist: "backgroundColor"` → nullable + clear. |
| `toggle` | `boolean` | On/off | `{ key, label, description? }` |
| `toggle-group` | `string \| number` | Small closed set, segmented | `{ key, label, options: { value, label? }[], description? }` |
| `select` | `string \| number` | Closed set, dropdown | `{ key, label, options: { value, label }[], layout?: "inline" \| "stacked", description? }` |
| `vec2` | `[number, number]` | Direction, offset, anchor | `{ key, label, min, max, step, xLabel?, yLabel? }` |
| `image` | `string` URL | Texture / asset slot | `{ key, label, readonly?, accept?, emptyLabel?, description? }`. **Never persisted** (object URLs die on reload). |
| `path` | `[x, y][]` | Waypoint path | `{ key, label, min, max, anchorKey?, description? }`. `anchorKey` is a sibling `[x,y]` home point, draggable on the pad. |
| `gradient-stops` | `GradientStop[]` or JSON string | Multi-stop gradient / 2D hotspots | `{ key, label, library?, layout?: "field" \| "ramp", description? }`. Stop: `{ id, x, y, offset, color }`. |
| `stripe-table` | `EditableStripe[]` | Stripe / palette rows | `{ key, label, options?, library?, description? }`. Options: `showRampEasing`, `showColorControls`, `showSavePalette`, `rampEasingKey`, `thresholdEasingKey`. Save handler key: `` `${key}:savePalette` ``. |
| `action` | — | One-off button | `{ actionId, label, description?, variant?: "default" \| "primary", when? }`. No `key`. Wire `actionHandlers[actionId]`. |
| `presets` | — | One-click value sets | `{ label?, presets: { label, values?: Partial<T> \| ((current: T) => T), actionId? }[] }`. No `key`. |
| `collection` | `Item[]` (`Item` has `id: string`) | Managed list | See [Collections](#collections--references). |
| `reference` | `string` or `string[]` | Link to a collection item | See [Collections](#collections--references). |

---

## Collections & references

### `collection`

```ts
{
  type: "collection"
  key: keyof T & string          // T[key] is Item[]
  label: string
  itemFields: PanelField<Item>[] | ((item: Item, index: number) => PanelField<Item>[])
  itemLabel?: (item, index) => string   // default `${label} ${i+1}`
  newItem?: () => Omit<Item, "id"> | Item  // omit → no Add button
  addLabel?: string
  min?: number                   // block remove below
  max?: number                   // block add above
  reorderable?: boolean          // default true
  multiOpen?: boolean            // default false (one open row)
  migrate?: (items: Item[]) => Item[]  // after persist merge
  description?: string
}
```

Items **must** carry `id: string`. If `newItem()` omits it, the control
assigns `crypto.randomUUID()` (counter fallback). `id` is the React key,
reorder identity, and what `reference` stores.

The open disclosure **is** the selection. `ControlCollection` can fire
`onSelect(id | null)`; `Panel` surfaces it as
`onSelect(collectionKey, id)`. That path is for a **manual** `<Panel/>`.
`usePanel` auto-mount does not expose it.

### `reference`

```ts
{
  type: "reference"
  key: keyof T & string          // string id, or string[] if multiple
  label: string
  collection: keyof T & string   // sibling collection key on ROOT state
  multiple?: boolean             // default false
  optionLabel?: (item) => string
  placeholder?: string
  description?: string
}
```

Use inside `itemFields` or at the top level. Resolves labels from
`rootValues[collection]`.

Persistence: collections are arrays on the state blob — they round-trip
through `localStorage` (`panels:<id>`). References are ids. Image keys
are stripped. `migrate` runs on load after the persist merge.

---

## Overlay, drag, and binding (OFF-138 / OFF-139 / OFF-140)

Shipped. Overlay projection, drag handles, two-way collection selection,
and `usePanelFrame` / `<PanelClock />`.

### Core — `@tjcages/panels`

```ts
createOverlayProjector(binding: RendererBinding, options?: { container?: HTMLElement }): {
  register: (anchor: OverlayAnchor) => () => void
  destroy: () => void
}

type RendererBinding = {
  project: (world: Vec3) => { x: number; y: number; visible: boolean } | null
  unproject?: (screen: { x: number; y: number }) => Vec3 | null  // drag only
  onFrame: (cb: (t: { time: number; delta: number }) => void) => () => void
}

type OverlayAnchor = {
  id: string
  getWorld: () => Vec3            // called every frame
  node: HTMLElement
  visible?: boolean               // default true
}

type Vec3 = readonly [number, number, number]
```

Layer is `pointer-events: none`, absolutely positioned over `container`
(default `document.body`). Positions with `transform` only; culled
anchors get `visibility: hidden`.

### R3F — `@tjcages/panels/shader`

Render `<PanelOverlay>` **inside** an R3F `<Canvas>`:

```tsx
import { PanelOverlay, PanelClock, useDragHandle, createR3FBinding } from "@tjcages/panels/shader"
import { usePanelFrame } from "@tjcages/panels"

<PanelClock />  // inside <Canvas frameloop="demand">

<PanelOverlay
  anchor={object3D | [x, y, z]}
  visible={boolean}
  panelId="particles"
  collectionKey="pois"
  itemId={poi.id}
>
  <Pin />
</PanelOverlay>

const drag = useDragHandle({
  anchor?: Vec3                   // advisory; bind the item field
  onDrag: (world: Vec3) => void
  onDragStart?: (world: Vec3 | null) => void
  onDragEnd?: (world: Vec3 | null) => void
  surface?: RaycastSurface        // default: origin plane facing camera
})
// spread drag.handleProps on the handle (sets pointerEvents: "auto")
```

`RaycastSurface`: `THREE.Plane` | `THREE.Object3D` | `{ radius, center? }`
(globe) | `{ point?, normal? }`. Also exported: `createR3FBinding({ camera,
canvas, onFrame, surface? })`, `raycastSurface(...)`.

Prod: `PanelOverlay` renders `children` inline (no projection).
`useDragHandle` returns inert handlers. `createOverlayProjector`
registers nothing.

Clock: `usePanelFrame(({ time, delta }) => { … })` from `@tjcages/panels`
(or `@tjcages/panels/shader`). `delta` is `0` while paused; step/seek
still produce a real delta. R3F: drop `<PanelClock />` in a
`frameloop="demand"` canvas. Overlay projection stays on R3F `useFrame`
so a paused clock does not freeze camera tracking.

Selection store (not `usePanel.onSelect`):
`selectPanelCollectionItem(panelId, collectionKey, itemId | null)`,
`getPanelCollectionSelection(panelId)`,
`subscribePanelCollectionSelection`. Overlay click writes the store;
the matching collection row opens. Selected overlays get
`data-panel-selected="true"`.

Low-level clock: `advancePanelAnimationDelta`, `playPanelAnimation` /
`pausePanelAnimation` / `getPanelAnimationTime`.

---

## Export / capture

The export footer (`ControlExport`, `showExport` default true on
`Panel`) has no handle on your renderer. Register host functions from
`@tjcages/panels`. Prefer `registerPanel*` names. `registerShader*`
aliases remain for back-compat (same function identity).

Each `register*` takes the fn or `null` and returns an unsubscribe.
Call from `useEffect` and return the unsubscribe.

| Export | Register | Signature |
|---|---|---|
| Hi-res PNG | `registerPanelCapture` | `(opts: { maxEdge: number }) => Promise<Blob>` |
| GIF | `registerPanelGifExport` | `(opts: { durationSec, fps, maxEdge, onProgress? }) => Promise<Blob>` |
| Host video session | `registerPanelVideoExport` | `() => Promise<{ stop: () => Promise<Blob> }>` |
| Record canvas | `registerPanelRecordCanvas` | `() => HTMLCanvasElement \| null` |
| Record prepare | `registerPanelRecordPrepare` | `() => Promise<void>` |
| Per-frame paint | `registerPanelRecordFrame` | `() => void \| Promise<void>` |

Composite canvas + overlay into one PNG: `compositeCaptureFrame({ layers, maxEdge? })` — pass `CanvasImageSource`s bottom→top (host rasterizes DOM). No extra deps.

Also: `setPanelRecording(active, { continuous? })`,
`subscribePanelRecording`, plus `get*` counterparts. `registerShader*`
aliases still work.

`maxEdge` is the requested longest-edge px. The registrant clamps to
the GPU limit and preserves aspect.

If nothing is registered, PNG falls back to the largest `<canvas>` on
the page at screen resolution (`captureStream` + `grabFrame`, then
`toBlob`). Unregister on unmount. All of this no-ops in production
(no export footer).

---

## Shader subpath

```ts
import {
  createWebGLAdapter,   // (config) => uniforms record
  createR3FAdapter,     // apply(config) mutates uniforms[name].value
  hexToRgb01,
  patchShaderConfigDefaults,
  useShaderPanel,
  PanelOverlay,
  useDragHandle,
  createR3FBinding,
} from "@tjcages/panels/shader"
```

`createWebGLAdapter({ fields, mapping?, prefix?: "u_", colorAs?: "rgb01" | "rgb255", toggleAs?: "int" | "bool" })`

`createR3FAdapter({ uniforms, fields, mapping?, prefix?: "u_" })` —
color/vec2 slots with `.set` are mutated in place.

Skips `section` / `action` / `presets`. Other types pass through as
raw values — keep adapter field lists to slider/color/toggle/select/vec2
(toggle-group passthrough is fine).

Adapters + `hexToRgb01` + `patchShaderConfigDefaults` **stay live in
production**.

---

## Production / `/dev`

Bundlers resolving the `production` condition get `index.prod.js`
(~5 KB no-op):

- `usePanel` / `useShaderPanel` → local state seeded from `defaults`.
  No panel, no registry, no persistence I/O.
- Shader adapters stay functional.
- Overlay / drag / capture / UI components stub to no-ops / `null`.
- Animation clock runs on real time (pause is a no-op).

Force the full panel in any environment:

```ts
import { usePanel } from "@tjcages/panels/dev"
```

Do not use `/dev` in app code you ship unless you mean it.

---

## Custom shells (optional)

Prefer `usePanel`. If you must own the mount:

- `autoMount: false` + `<PanelRoot/>`
- or `<FloatingPanel float />` + `renderPanelField` for a fully custom
  shell

Exported controls match the field types (`ControlSlider`,
`ControlCollection`, `ControlReference`, …) plus shell pieces
(`ToolShell`, `ToolPanel`, `PanelHeaderSelect`, `PanelCloseButton`)
and extras that are **not** schema fields: `ControlTextInput`,
`ControlTextarea`, `ControlSearchField`, `ControlDisclosure`,
`ControlHint`, `ControlReadout`, `ControlOptionList`,
`ControlAnimation`.
