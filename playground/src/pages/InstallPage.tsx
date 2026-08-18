import { DocsPage } from "./DocsPage"

export function InstallPage() {
  return (
    <DocsPage
      kicker="Docs"
      title="Install"
      lede="One package. The panel compiles out of production. Agents can set themselves up from the files that ship on npm."
    >
      <section className="docs-block">
        <h3>Hosted</h3>
        <p>
          This site lives at{" "}
          <a href="https://offbr.co/tools/panels/docs/">
            offbr.co/tools/panels/docs
          </a>
          . Package card:{" "}
          <a href="https://offbr.co/tools/panels">offbr.co/tools/panels</a>.
          Agent brief:{" "}
          <a href="https://offbr.co/tools/panels/installation">
            /tools/panels/installation
          </a>
          .
        </p>
      </section>
      <section className="docs-block">
        <h3>Package</h3>
        <pre>{`npm install @tjcages/panels`}</pre>
        <p>
          Import from <code>@tjcages/panels</code>, not <code>/dev</code>. Peers
          are <code>react</code> and <code>react-dom</code>. Add{" "}
          <code>three</code> + <code>@react-three/fiber</code> only if you import{" "}
          <code>@tjcages/panels/shader</code> overlay or drag helpers.
        </p>
      </section>
      <section className="docs-block">
        <h3>Agent setup</h3>
        <pre>{`npx @tjcages/panels setup`}</pre>
        <p>
          Copies <code>skills/panels</code> into{" "}
          <code>.agents/skills/panels</code> and{" "}
          <code>.cursor/skills/panels</code>. Pass <code>--claude</code> to also
          write <code>.claude/skills/panels</code>. There is no postinstall.
        </p>
        <pre>{`npx skills add tjcages/panels --skill panels

# Claude Code
/plugin marketplace add tjcages/panels
/plugin install panels@tjcages-panels

# Cursor plugin (this repo)
# .cursor-plugin/plugin.json — submit at cursor.com/marketplace/publish

# Agent brief
# https://offbr.co/tools/panels/installation`}</pre>
      </section>
      <section className="docs-block">
        <h3>One hook</h3>
        <pre>{`const [config] = usePanel({
  id: "particles",
  title: "Particles",
  defaults,
  fields,
})`}</pre>
        <p>
          No <code>{"<PanelRoot/>"}</code>. Toggle with ⌘⌥D / Ctrl+Alt+D. Persist
          key is <code>panels:&lt;id&gt;</code>. Paste{" "}
          <code>SETUP_PROMPT.md</code> from the package for the full wiring
          checklist.
        </p>
      </section>
    </DocsPage>
  )
}
