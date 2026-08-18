import type { CSSProperties } from "react"
import {
  usePanel,
  type PanelCollectionItem,
  type PanelField,
} from "@tjcages/panels"

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
      {
        type: "slider",
        key: "weight",
        label: "Weight",
        min: 0.1,
        max: 4,
        step: 0.1,
      },
    ] as unknown as PanelField<PanelCollectionItem>[],
  },
]

const METRICS = [
  { id: "cpu", label: "CPU", value: 54 },
  { id: "memory", label: "Memory", value: 71 },
  { id: "errors", label: "Error rate", value: 88 },
] as const

type Tone = "ok" | "warning" | "critical"

function toneFor(value: number, kpis: Kpis): Tone {
  if (value >= kpis.critical) return "critical"
  if (value >= kpis.warning) return "warning"
  return "ok"
}

function sampleBars(series: Series, range: Chart["range"]): number[] {
  const n = range === "24h" ? 12 : range === "7d" ? 7 : 10
  return Array.from({ length: n }, (_, i) => {
    const wave = Math.abs(Math.sin((i + 1) * (0.55 + series.weight * 0.4)))
    return Math.round((0.28 + wave * 0.62) * 100)
  })
}

function rangeLabel(range: Chart["range"]): string {
  switch (range) {
    case "24h":
      return "Last 24 hours"
    case "7d":
      return "Last 7 days"
    case "30d":
      return "Last 30 days"
    default: {
      const _exhaustive: never = range
      return _exhaustive
    }
  }
}

export function DashboardDemo() {
  const [kpis] = usePanel({
    id: "kpis",
    title: "KPIs",
    defaults: KPI_DEFAULTS,
    fields: KPI_FIELDS,
    defaultTheme: "dark",
    defaultOpen: true,
    scrollTo: "#kpis",
    onSelect: () => {
      document.getElementById("kpis")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    },
  })

  const [chart] = usePanel({
    id: "chart",
    title: "Chart",
    defaults: CHART_DEFAULTS,
    fields: CHART_FIELDS,
    scrollTo: "#chart",
    onSelect: () => {
      document.getElementById("chart")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    },
  })

  const visible = chart.series.filter((s) => s.visible)

  return (
    <div
      className="page dashboard-page"
      style={
        {
          "--kpi-accent": kpis.accent,
        } as CSSProperties
      }
    >
      <section id="kpis" className="dash-section">
        <header className="page-head">
          <p className="page-kicker">Mock page</p>
          <h2>KPIs</h2>
          <p className="page-lede">
            Warning {kpis.warning} · Critical {kpis.critical}. Header switcher
            jumps between this block and the chart.
          </p>
        </header>
        <div className={kpis.stacked ? "kpi-grid stacked" : "kpi-grid"}>
          {METRICS.map((metric) => {
            const tone = toneFor(metric.value, kpis)
            return (
              <article key={metric.id} className="card kpi-card" data-tone={tone}>
                <p className="muted">{metric.label}</p>
                <p className="kpi-value">
                  {metric.value}
                  <span>%</span>
                </p>
                <div className="kpi-track">
                  <span
                    className="kpi-fill"
                    style={{ width: `${metric.value}%` }}
                  />
                  <i className="kpi-mark" style={{ left: `${kpis.warning}%` }} />
                  <i
                    className="kpi-mark crit"
                    style={{ left: `${kpis.critical}%` }}
                  />
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section id="chart" className="dash-section">
        <header className="page-head">
          <p className="page-kicker">{rangeLabel(chart.range)}</p>
          <h2>Series</h2>
        </header>
        <div className="card chart-card">
          {visible.length === 0 ? (
            <p className="muted">No visible series</p>
          ) : (
            <div className="chart">
              {visible.map((series) => (
                <div key={series.id} className="chart-row">
                  <div className="chart-bars">
                    {sampleBars(series, chart.range).map((h, i) => (
                      <span
                        key={`${series.id}-${i}`}
                        style={{
                          height: `${h}%`,
                          background: series.color,
                          opacity: Math.min(1, 0.35 + series.weight * 0.25),
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {chart.showLegend ? (
            <ul className="legend">
              {visible.map((series) => (
                <li key={series.id}>
                  <i style={{ background: series.color }} />
                  {series.id}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    </div>
  )
}
