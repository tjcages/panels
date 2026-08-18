import { useState } from "react"
import { DashboardDemo } from "./demos/DashboardDemo"
import { SettingsDemo } from "./demos/SettingsDemo"

type DemoId = "settings" | "dashboard"

const DEMOS: { id: DemoId; label: string }[] = [
  { id: "settings", label: "Settings" },
  { id: "dashboard", label: "Dashboard" },
]

export function App() {
  const [demo, setDemo] = useState<DemoId>("settings")

  return (
    <div className="app">
      <header className="chrome">
        <div className="chrome-brand">
          <p className="chrome-kicker">@tjcages/panels</p>
          <h1>Playground</h1>
        </div>
        <nav className="tabs" aria-label="Demo">
          {DEMOS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="tab"
              aria-pressed={demo === item.id}
              onClick={() => setDemo(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <p className="chrome-hint">
          Toggle the panel with <kbd>⌘⌥D</kbd> / <kbd>Ctrl+Alt+D</kbd>
        </p>
      </header>
      <div className="stage">{renderDemo(demo)}</div>
    </div>
  )
}

function renderDemo(demo: DemoId) {
  switch (demo) {
    case "settings":
      return <SettingsDemo />
    case "dashboard":
      return <DashboardDemo />
    default: {
      const _exhaustive: never = demo
      return _exhaustive
    }
  }
}
