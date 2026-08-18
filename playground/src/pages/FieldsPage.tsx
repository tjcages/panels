import { usePanel, type PanelField } from "@tjcages/panels"
import { DocsPage } from "./DocsPage"

type Demo = {
  speed: number
  tint: string
  trails: boolean
  mode: "orbit" | "drift"
  offset: [number, number]
}

const DEFAULTS: Demo = {
  speed: 1.2,
  tint: "#ff5e1f",
  trails: true,
  mode: "orbit",
  offset: [0.2, -0.1],
}

const FIELDS: PanelField<Demo>[] = [
  { type: "section", title: "Motion" },
  { type: "slider", key: "speed", label: "Speed", min: 0, max: 4, step: 0.01 },
  {
    type: "vec2",
    key: "offset",
    label: "Offset",
    min: -1,
    max: 1,
    step: 0.01,
  },
  { type: "section", title: "Look" },
  { type: "color", key: "tint", label: "Tint" },
  { type: "toggle", key: "trails", label: "Trails" },
  {
    type: "toggle-group",
    key: "mode",
    label: "Mode",
    options: [
      { value: "orbit", label: "Orbit" },
      { value: "drift", label: "Drift" },
    ],
  },
]

export function FieldsPage() {
  const [demo] = usePanel({
    id: "fields-demo",
    title: "Fields",
    defaults: DEFAULTS,
    fields: FIELDS,
    defaultOpen: true,
  })

  return (
    <DocsPage
      kicker="Docs"
      title="Field types"
      lede="Each field maps a key in your config to a control. Prefer an explicit fields array; omit it to infer sliders, colors, toggles, vec2s, and collections."
    >
      <div
        className="fields-preview"
        style={{
          ["--tint" as string]: demo.tint,
          ["--speed" as string]: String(demo.speed),
        }}
        data-trails={demo.trails ? "on" : "off"}
        data-mode={demo.mode}
      >
        <span
          className="fields-orb"
          style={{
            transform: `translate(${demo.offset[0] * 40}px, ${demo.offset[1] * 40}px)`,
          }}
        />
        <p className="muted">
          {demo.mode} · {demo.speed.toFixed(2)} · trails {demo.trails ? "on" : "off"}
        </p>
      </div>
      <table className="docs-table">
        <thead>
          <tr>
            <th>type</th>
            <th>value</th>
            <th>use</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>slider</td>
            <td>number</td>
            <td>ranged scalar</td>
          </tr>
          <tr>
            <td>color</td>
            <td>hex string</td>
            <td>swatch + popover</td>
          </tr>
          <tr>
            <td>toggle</td>
            <td>boolean</td>
            <td>on / off</td>
          </tr>
          <tr>
            <td>toggle-group</td>
            <td>string / number</td>
            <td>small closed set</td>
          </tr>
          <tr>
            <td>select</td>
            <td>string / number</td>
            <td>dropdown</td>
          </tr>
          <tr>
            <td>vec2</td>
            <td>[x, y]</td>
            <td>offset, direction</td>
          </tr>
          <tr>
            <td>collection / reference</td>
            <td>items / ids</td>
            <td>managed lists</td>
          </tr>
          <tr>
            <td>gradient-stops / stripe-table</td>
            <td>stops / rows</td>
            <td>palettes</td>
          </tr>
          <tr>
            <td>section / presets / action</td>
            <td>—</td>
            <td>structure, not values</td>
          </tr>
        </tbody>
      </table>
      <p className="muted">
        There is no <code>type: &quot;text&quot;</code> field. Nested objects and
        non-hex strings are skipped by inference.
      </p>
    </DocsPage>
  )
}
