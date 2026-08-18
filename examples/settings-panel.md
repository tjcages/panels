# Settings panel

A single settings target: theme, density, flags, presets. Explicit `fields` shown; omitting `fields` would infer sliders / colors / toggles / vec2 / collections from `defaults` (non-hex strings and nested objects are skipped).

**Edit:** the settings page or shell (e.g. `src/pages/Settings.tsx` or `src/app/layout.tsx` if the flags wrap the tree).

```tsx
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

export function SettingsPage() {
  const [settings] = usePanel({
    id: "settings",
    title: "Settings",
    defaults: DEFAULTS,
    fields: FIELDS,
    defaultTheme: "dark",
    side: "right",
    // persist: false, // values stay in memory; section open/close still persists
    onWriteConfig: async (values) => {
      // Host save — optional. The panel already wrote localStorage.
      void values
      return { ok: true, message: "Saved" }
    },
    writeLabel: "Save",
  })

  return (
    <div data-theme={settings.theme} data-density={settings.density}>
      {/* apply settings.volume / settings.reducedMotion / settings.debug */}
    </div>
  )
}
```

Persists to `panels:settings` unless `persist: false`.

- `defaultTheme` seeds the panel chrome the first time this target auto-mounts; `settings.theme` is your **app** theme.
- `side: "left" | "right"` (default `"right"`). Two-plus targets on the same side share a header switcher.
- For a routed settings section, pass `onSelect: () => router.push("/settings")` — that is target navigation, not a collection select.
- `onWriteConfig` is a host save button, not persistence itself. Persistence is `localStorage` `panels:<id>`.
- Do not wrap the page in `ToolShell` / `PanelRoot`. Import from `@tjcages/panels`, not `/dev`.

**Production:** the hook returns `defaults`-seeded local state; no panel, no persist I/O. Keep reading `settings` in the page so prod still has a config object.

**Verify:** flip Theme → the page `data-theme` changes; Quiet preset drops volume; reload restores the last edit from `panels:settings`.
