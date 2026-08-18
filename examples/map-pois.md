# Map + POIs

A collection of pins on an R3F map / globe: add / remove / reorder in the panel, DOM overlays pinned to scene positions, click-to-select, optional drag-to-move. Two-way select is **not** `usePanel({ onSelect })` — that callback is header-switcher target navigation.

**Edit:** the map/scene component (e.g. `src/map/Globe.tsx`) plus a small pin child rendered inside `<Canvas>`. Peers: `three`, `@react-three/fiber`.

```tsx
import { Canvas } from "@react-three/fiber"
import { usePanel, type PanelField } from "@tjcages/panels"
import {
  PanelClock,
  PanelOverlay,
  useDragHandle,
} from "@tjcages/panels/shader"

type Group = { id: string; color: string }
type Poi = {
  id: string
  lon: number
  lat: number
  visible: boolean
  groupId: string
}
type Caption = { id: string; poiId: string; side: "left" | "right"; offset: number }

type Config = {
  pois: Poi[]
  groups: Group[]
  captions: Caption[]
}

const DEFAULTS: Config = {
  groups: [{ id: "cities", color: "#ff5e1f" }],
  pois: [{ id: "nyc", lon: -74, lat: 40.7, visible: true, groupId: "cities" }],
  captions: [{ id: "nyc-label", poiId: "nyc", side: "left", offset: 12 }],
}

const FIELDS: PanelField<Config>[] = [
  {
    type: "collection",
    key: "groups",
    label: "Groups",
    itemLabel: (g) => g.id,
    newItem: () => ({ color: "#888888" }),
    itemFields: [{ type: "color", key: "color", label: "Color" }],
  },
  {
    type: "collection",
    key: "pois",
    label: "POIs",
    itemLabel: (p) => p.id,
    newItem: () => ({ lon: 0, lat: 0, visible: true, groupId: "cities" }),
    min: 1,
    itemFields: [
      { type: "section", title: "Position" },
      { type: "slider", key: "lon", label: "Lon", min: -180, max: 180, step: 0.1 },
      { type: "slider", key: "lat", label: "Lat", min: -90, max: 90, step: 0.1 },
      { type: "toggle", key: "visible", label: "Visible" },
      // `collection` names a ROOT key. Nested itemFields need a cast today.
      {
        type: "reference",
        key: "groupId",
        label: "Group",
        collection: "groups",
      },
    ] as PanelField<Poi>[],
  },
  {
    type: "collection",
    key: "captions",
    label: "Captions",
    itemLabel: (c) => c.id,
    newItem: () => ({ poiId: "nyc", side: "left" as const, offset: 8 }),
    itemFields: [
      {
        type: "reference",
        key: "poiId",
        label: "POI",
        collection: "pois",
      },
      {
        type: "select",
        key: "side",
        label: "Side",
        options: [
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
        ],
      },
      { type: "slider", key: "offset", label: "Offset", min: 0, max: 48, step: 1 },
    ] as PanelField<Caption>[],
  },
]

export function Globe() {
  const [config, setConfig] = usePanel({
    id: "globe",
    title: "Globe",
    defaults: DEFAULTS,
    fields: FIELDS,
  })

  return (
    <Canvas frameloop="demand">
      <PanelClock />
      {config.pois.map((poi) => (
        <PoiPin key={poi.id} poi={poi} config={config} setConfig={setConfig} />
      ))}
    </Canvas>
  )
}

function PoiPin({
  poi,
  config,
  setConfig,
}: {
  poi: Poi
  config: Config
  setConfig: (next: Config) => void
}) {
  const group = config.groups.find((g) => g.id === poi.groupId)
  const drag = useDragHandle({
    anchor: [poi.lon, poi.lat, 0],
    surface: { radius: 1 }, // globe; omit for a camera-facing origin plane
    onDrag: (world) => {
      setConfig({
        ...config,
        pois: config.pois.map((p) =>
          p.id === poi.id ? { ...p, lon: world[0], lat: world[1] } : p,
        ),
      })
    },
  })

  return (
    <PanelOverlay
      anchor={[poi.lon, poi.lat, 0]}
      visible={poi.visible}
      panelId="globe"
      collectionKey="pois"
      itemId={poi.id}
    >
      <div
        {...drag.handleProps}
        style={{
          ...drag.handleProps.style,
          width: 12,
          height: 12,
          borderRadius: 99,
          background: group?.color ?? "#888",
        }}
      />
    </PanelOverlay>
  )
}
```

- Items **must** have `id: string`. If `newItem()` omits it, the collection assigns one.
- `itemFields` nest the same `PanelField` union (sliders, colors, references, sections).
- `reference` resolves sibling collections from **root** state, not the item.
- `<PanelOverlay>` renders **inside** `<Canvas>`. `panelId` + `collectionKey` + `itemId` (or `select={{ panelId, collectionKey, itemId }}`) writes the selection store on click; the matching row opens. Selected overlays get `data-panel-selected="true"`.
- Spread `drag.handleProps` on the handle (sets `pointer-events: auto` on a `pointer-events: none` layer).
- There is no `type: "text"` field — skip names, or title rows with `itemLabel`.
- Do not pass `collection` / `reference` through `createWebGLAdapter` / `createR3FAdapter`.

Persists to `panels:globe` (ids + edits round-trip; image keys would not).

**Production:** overlays render `children` inline (no projection); `useDragHandle` returns inert handlers.

**Verify:** add a POI; edit lat; reload (id + value stick); click a pin → that row opens; drag writes lon/lat; pause freezes the clock but not overlay tracking as the camera moves.
