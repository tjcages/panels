import { useEffect } from "react"
import { usePanel, type PanelField } from "@tjcages/panels"
import { DocsPage } from "./DocsPage"

type Theme = { bg: string; surface: string; accent: string }

const DEFAULTS: Theme = {
  bg: "#1c1c1c",
  surface: "#2a2a2a",
  accent: "#ff5e1f",
}

const FIELDS: PanelField<Theme>[] = [
  { type: "color", key: "bg", label: "Background" },
  { type: "color", key: "surface", label: "Surface" },
  { type: "color", key: "accent", label: "Accent" },
]

export function ThemingPage() {
  const [theme] = usePanel({
    id: "theming",
    title: "Theming",
    defaults: DEFAULTS,
    fields: FIELDS,
    defaultOpen: true,
    defaultTheme: "dark",
  })

  useEffect(() => {
    const style = document.createElement("style")
    style.setAttribute("data-playground-theme", "")
    style.textContent = `[data-panel] {
  --panel-bg: ${theme.bg};
  --panel-surface: ${theme.surface};
  --panel-surface-active: ${theme.surface};
  --panel-action-bg: ${theme.surface};
}`
    document.head.appendChild(style)
    return () => {
      style.remove()
    }
  }, [theme.bg, theme.surface])

  return (
    <DocsPage
      kicker="Docs"
      title="Theming"
      lede="Override --panel-* CSS custom properties on [data-panel]. Dark and light ship built-in. This page writes three of them live."
    >
      <div className="theme-swatches">
        <span style={{ background: theme.bg }} />
        <span style={{ background: theme.surface }} />
        <span style={{ background: theme.accent }} />
      </div>
      <pre>{`[data-panel] {
  --panel-bg: ${theme.bg};
  --panel-surface: ${theme.surface};
}

[data-panel][data-panel-theme="light"] { /* light tokens */ }`}</pre>
      <p className="muted">
        Pass <code>defaultTheme: &quot;light&quot; | &quot;dark&quot;</code> on{" "}
        <code>usePanel</code>. Reduced motion is honored on{" "}
        <code>[data-panel]</code>.
      </p>
    </DocsPage>
  )
}
