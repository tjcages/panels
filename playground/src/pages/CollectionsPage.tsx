import { DashboardDemo } from "../demos/DashboardDemo"
import { DocsPage } from "./DocsPage"

export function CollectionsPage() {
  return (
    <DocsPage
      kicker="Docs"
      title="Collections"
      lede="A collection is an array of items with stable id strings. The open disclosure is the selection. References store those ids."
    >
      <ul className="docs-list">
        <li>
          Items must carry <code>id: string</code>. <code>newItem()</code> may
          omit it; the control assigns one.
        </li>
        <li>
          Nest any field type in <code>itemFields</code>.{" "}
          <code>reference</code> fields resolve sibling collections on{" "}
          <strong>root</strong> state, not the item.
        </li>
        <li>
          <code>usePanel.onSelect</code> is target navigation (header switcher),
          not row select. Canvas ↔ row uses{" "}
          <code>selectPanelCollectionItem</code> / overlay{" "}
          <code>panelId</code> + <code>collectionKey</code> + <code>itemId</code>.
        </li>
      </ul>
      <DashboardDemo />
    </DocsPage>
  )
}
