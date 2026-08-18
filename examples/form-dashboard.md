# Form / dashboard

Tune a dashboard page: KPI thresholds, chart series, layout flags. Two `usePanel` calls on the same side get a header switcher; `scrollTo` jumps to the section. `onSelect` is for **routing** (target navigation), not row clicks.

**Edit:** the dashboard page (e.g. `src/pages/Dashboard.tsx`) and the chart/KPI components that consume `config`. No shader peers.

There is no `type: "text"` field — use select / toggle / slider / color / collection. Drive labels from `itemLabel` or your own UI.

```tsx
import type { CSSProperties } from "react"
import { usePanel, type PanelField } from "@tjcages/panels"

type Series = { id: string; color: string; visible: boolean; weight: number }

type Kpis = {
  warning: number
  critical: number
  accent: string
  stacked: boolean
}

type Chart = {
  series: Series[]
  showLegend: boolean
  range: "24h" | "7d" | "30d"
}

const KPI_DEFAULTS: Kpis = {
  warning: 60,
  critical: 85,
  accent: "#ff5e1f",
  stacked: false,
}

const KPI_FIELDS: PanelField<Kpis>[] = [
  { type: "section", title: "Thresholds" },
  { type: "slider", key: "warning", label: "Warning", min: 0, max: 100, step: 1 },
  { type: "slider", key: "critical", label: "Critical", min: 0, max: 100, step: 1 },
  { type: "color", key: "accent", label: "Accent" },
  { type: "toggle", key: "stacked", label: "Stacked layout" },
]

const CHART_DEFAULTS: Chart = {
  showLegend: true,
  range: "7d",
  series: [
    { id: "alpha", color: "#4cc9f0", visible: true, weight: 1 },
    { id: "beta", color: "#f72585", visible: true, weight: 1 },
  ],
}

const CHART_FIELDS: PanelField<Chart>[] = [
  {
    type: "select",
    key: "range",
    label: "Range",
    options: [
      { value: "24h", label: "24 hours" },
      { value: "7d", label: "7 days" },
      { value: "30d", label: "30 days" },
    ],
  },
  { type: "toggle", key: "showLegend", label: "Legend" },
  {
    type: "collection",
    key: "series",
    label: "Series",
    itemLabel: (s) => s.id,
    min: 1,
    max: 8,
    newItem: () => ({ color: "#888888", visible: true, weight: 1 }),
    itemFields: [
      { type: "color", key: "color", label: "Color" },
      { type: "toggle", key: "visible", label: "Visible" },
      { type: "slider", key: "weight", label: "Weight", min: 0.1, max: 4, step: 0.1 },
    ],
  },
]

export function DashboardPage() {
  const [kpis] = usePanel({
    id: "kpis",
    title: "KPIs",
    defaults: KPI_DEFAULTS,
    fields: KPI_FIELDS,
    scrollTo: "#kpis",
  })

  const [chart] = usePanel({
    id: "chart",
    title: "Chart",
    defaults: CHART_DEFAULTS,
    fields: CHART_FIELDS,
    scrollTo: "#chart",
    // Target navigation only — e.g. a routed settings page:
    // onSelect: () => router.push("/dashboard/chart"),
  })

  return (
    <main>
      <section
        id="kpis"
        style={
          {
            "--kpi-accent": kpis.accent,
            "--kpi-warn": kpis.warning,
            "--kpi-crit": kpis.critical,
          } as CSSProperties
        }
      >
        {/* feed kpis.warning / kpis.critical into the gauge */}
      </section>
      <section id="chart">
        {chart.series
          .filter((s) => s.visible)
          .map((s) => (
            <span key={s.id} style={{ color: s.color, opacity: s.weight }} />
          ))}
      </section>
    </main>
  )
}
```

Persists to `panels:kpis` and `panels:chart` (two targets, two keys).

Same-page sections → `scrollTo`. Cross-route pages → `onSelect` (fires after the target becomes active, after `scrollTo`). Do not use `onSelect` to open a collection row.

**Production:** both hooks collapse to local state; the page still renders with `defaults`.

**Verify:** drag Warning → the gauge updates; pick Chart in the header switcher → `#chart` scrolls into view and the panel shows series fields; add a series, reload, the id and color stick.
