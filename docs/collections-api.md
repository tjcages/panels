# Collections & references — design

Status: **shipped** (Phase 3, OFF-133–137). Two field types turn the panel from "one flat config" into "config + managed lists of items, each editable, that can reference each other." This is the region-earth POI/caption model, made declarative.

## The shape

State can now hold arrays of items alongside scalars:

```ts
type Config = {
  // scalars, as before
  ambient: number
  // a managed collection — an array of items, each with an id
  pois: POI[]
  captions: Caption[]
}
type POI = { id: string; lat: number; lon: number; icon: string; group?: string }
type Caption = { id: string; poiId: string; text: string; side: "left" | "right" }
```

Items **must carry a stable `id: string`**. The collection auto-assigns one on add if `newItem()` omits it. `id` is what React keys, reorder, selection, and references use.

## `collection` field

```ts
type PanelCollectionField<T, Item extends { id: string }> = {
  type: "collection"
  key: keyof T & string                 // T[key] is Item[]
  label: string
  itemFields: PanelField<Item>[] | ((item: Item, index: number) => PanelField<Item>[])
  itemLabel?: (item: Item, index: number) => string   // row title; default `${label} ${i+1}`
  newItem?: () => Omit<Item, "id"> | Item              // "Add" factory; omit → no add button
  addLabel?: string                     // default `Add ${singular(label)}`
  min?: number                          // block remove below this count
  max?: number                          // block add above this count
  reorderable?: boolean                 // default true (drag handle)
  description?: string
}
```

Rendering (new `ControlCollection` component):
- A header row (`label`, count, and the Add button when `newItem` is set).
- One **`ControlDisclosure` row per item**, titled via `itemLabel`. Expanding a row renders that item's `itemFields` **recursively through the existing field renderer**, bound to `item[i]` — edits call back to replace `state[key][i]`. This reuse is the whole point: every existing control (slider, select, text, color, …) works inside an item with zero new code.
- Row affordances: remove (✕, respects `min`), drag handle to reorder (respects `reorderable`), and the disclosure caret.
- `itemFields` as a function supports **per-item / per-type schemas** (OFF-134) — e.g. return different fields based on `item.kind`.

**Selection (OFF-135):** the open disclosure *is* the selection. The collection also exposes the open item's `id` via an optional `onSelect?(id | null)` on the panel, so Phase 4 (canvas overlay) can highlight the selected item and vice-versa. Single-open by default; `multiOpen?: true` to allow several.

## `reference` field

Used inside `itemFields` (or at top level) to point at an item in another collection:

```ts
type PanelReferenceField<T> = {
  type: "reference"
  key: keyof T & string          // value is a string id, or string[] if `multiple`
  label: string
  collection: keyof T & string   // the sibling collection key to choose from
  multiple?: boolean             // default false
  optionLabel?: (item) => string // how each choice reads; default itemLabel/`id`
  placeholder?: string           // shown when unset
  description?: string
}
```

Rendering (reuses `ControlOptionList` + a `ControlReadout`):
- Shows the current target's label (or `placeholder`).
- Clicking opens a **linking picker** — the scrollable option list of the referenced collection's items. Picking sets the id(s). This is region-earth's captions↔POIs "linking mode", generic and declarative — no bespoke state machine.
- Resolving the label needs access to sibling collections, so the reference renderer receives the **root state**, not just the item.

## Persistence (OFF-137)

Collections are just arrays on the state object, so the existing localStorage persistence already round-trips them (the whole state is serialized, and `loadPersistedPanelValues` restores any key present in `defaults`). References are just ids in state — they persist for free. **What to verify/add:** (1) items keep stable `id`s across reload (they're stored, so yes); (2) the merge logic preserves array items whose shape grew (don't drop unknown item keys); (3) a `migrate?` hook on the collection for versioned item-shape changes, matching region-earth's `-v3` session migration. Only (2)/(3) are new work.

## Renderer changes

- `types.ts`: add `PanelCollectionField` + `PanelReferenceField` to the `PanelField<T>` union.
- `panel.tsx`: two new cases in the field switch. Factor the per-field render into a reusable function so the collection can call it for `itemFields` (recursion). The reference case gets the root state + a setter.
- New `src/controls/collection.tsx` (`ControlCollection`); reference UI can live there or in `src/controls/reference.tsx`.
- No store changes — collections live in the same registration `state`/`values`.

## Out of scope (later phases)

- Canvas overlay binding to the selected item (Phase 4, OFF-138–140).
- Auto-inferring a `collection` field from an `object[]` in state (Phase 6, OFF-143).
