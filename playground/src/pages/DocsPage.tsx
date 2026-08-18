import type { ReactNode } from "react"

type DocsPageProps = {
  kicker: string
  title: string
  lede: string
  children: ReactNode
}

export function DocsPage({ kicker, title, lede, children }: DocsPageProps) {
  return (
    <article className="page docs-page">
      <header className="page-head">
        <p className="page-kicker">{kicker}</p>
        <h2>{title}</h2>
        <p className="page-lede">{lede}</p>
      </header>
      <div className="docs-body">{children}</div>
    </article>
  )
}
