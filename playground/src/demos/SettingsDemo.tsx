import { usePanel, type PanelField } from "@tjcages/panels"

type Settings = {
  theme: "light" | "dark"
  density: "compact" | "regular"
  volume: number
  reducedMotion: boolean
  debug: boolean
}

const DEFAULTS: Settings = {
  theme: "dark",
  density: "regular",
  volume: 0.8,
  reducedMotion: false,
  debug: false,
}

const FIELDS: PanelField<Settings>[] = [
  { type: "section", title: "Appearance" },
  {
    type: "toggle-group",
    key: "theme",
    label: "Theme",
    options: [
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
    ],
  },
  {
    type: "select",
    key: "density",
    label: "Density",
    options: [
      { value: "compact", label: "Compact" },
      { value: "regular", label: "Regular" },
    ],
  },
  { type: "section", title: "Behavior" },
  { type: "slider", key: "volume", label: "Volume", min: 0, max: 1, step: 0.01 },
  { type: "toggle", key: "reducedMotion", label: "Reduced motion" },
  { type: "toggle", key: "debug", label: "Debug" },
  {
    type: "presets",
    label: "Presets",
    presets: [
      { label: "Quiet", values: { volume: 0.2, reducedMotion: true } },
      { label: "Reset", values: () => DEFAULTS },
    ],
  },
]

export function SettingsDemo() {
  const [settings] = usePanel({
    id: "settings",
    title: "Settings",
    defaults: DEFAULTS,
    fields: FIELDS,
    defaultTheme: "dark",
    side: "right",
    defaultOpen: true,
    onWriteConfig: async (values) => {
      void values
      return { ok: true, message: "Saved" }
    },
    writeLabel: "Save",
    onSelect: () => {
      document.getElementById("settings-page")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    },
  })

  const volumePct = Math.round(settings.volume * 100)

  return (
    <article
      id="settings-page"
      className="page settings-page"
      data-theme={settings.theme}
      data-density={settings.density}
      data-debug={settings.debug ? "true" : "false"}
    >
      <header className="page-head">
        <p className="page-kicker">Mock page</p>
        <h2>Workspace</h2>
        <p className="page-lede">
          Theme, density, and volume drive this surface. Quiet preset drops
          volume and enables reduced motion.
        </p>
      </header>

      <div className="settings-grid">
        <section className="card">
          <h3>Playback</h3>
          <p className="muted">Volume {volumePct}%</p>
          <div
            className="volume"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={volumePct}
            aria-label="Volume"
          >
            <span style={{ width: `${volumePct}%` }} />
          </div>
        </section>

        <section className="card">
          <h3>Motion</h3>
          <p className="muted">
            {settings.reducedMotion ? "Reduced motion on" : "Pulse live"}
          </p>
          <span
            className={
              settings.reducedMotion ? "pulse pulse-static" : "pulse"
            }
            aria-hidden="true"
          />
        </section>

        <section className="card">
          <h3>Density</h3>
          <p className="muted">
            {settings.density === "compact"
              ? "Tight padding and gaps"
              : "Regular spacing"}
          </p>
          <div className="density-rows">
            <span />
            <span />
            <span />
          </div>
        </section>
      </div>

      {settings.debug ? (
        <pre className="debug-dump">{JSON.stringify(settings, null, 2)}</pre>
      ) : null}
    </article>
  )
}
