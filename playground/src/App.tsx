import { useEffect, useState } from "react"
import { DashboardDemo } from "./demos/DashboardDemo"
import { SettingsDemo } from "./demos/SettingsDemo"
import { CollectionsPage } from "./pages/CollectionsPage"
import { ExportPage } from "./pages/ExportPage"
import { FieldsPage } from "./pages/FieldsPage"
import { InstallPage } from "./pages/InstallPage"
import { OverlayPage } from "./pages/OverlayPage"
import { ThemingPage } from "./pages/ThemingPage"
import {
  ROUTES,
  hashToRoute,
  routeToHash,
  type RouteId,
} from "./routes"

type DemoId = "settings" | "dashboard"

const DEMOS: { id: DemoId; label: string }[] = [
  { id: "settings", label: "Settings" },
  { id: "dashboard", label: "Dashboard" },
]

export function App() {
  const [route, setRoute] = useState<RouteId>(() =>
    hashToRoute(window.location.hash),
  )
  const [demo, setDemo] = useState<DemoId>("settings")

  useEffect(() => {
    const onHash = () => setRoute(hashToRoute(window.location.hash))
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  return (
    <div className="app">
      <header className="chrome">
        <div className="chrome-brand">
          <p className="chrome-kicker">@tjcages/panels</p>
          <h1>Docs + playground</h1>
        </div>
        <nav className="tabs" aria-label="Docs">
          {ROUTES.map((item) => (
            <a
              key={item.id}
              className="tab"
              href={routeToHash(item.id)}
              aria-current={route === item.id ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
        {route === "playground" ? (
          <nav className="tabs demo-tabs" aria-label="Demo">
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
        ) : null}
        <p className="chrome-hint">
          Toggle the panel with <kbd>⌘⌥D</kbd> / <kbd>Ctrl+Alt+D</kbd>
        </p>
      </header>
      <div className="stage">{renderRoute(route, demo)}</div>
    </div>
  )
}

function renderRoute(route: RouteId, demo: DemoId) {
  switch (route) {
    case "playground":
      return renderDemo(demo)
    case "install":
      return <InstallPage />
    case "fields":
      return <FieldsPage />
    case "collections":
      return <CollectionsPage />
    case "overlay":
      return <OverlayPage />
    case "export":
      return <ExportPage />
    case "theming":
      return <ThemingPage />
    default: {
      const _exhaustive: never = route
      return _exhaustive
    }
  }
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
