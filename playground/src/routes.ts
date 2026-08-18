export const ROUTES = [
  { id: "playground", path: "/", label: "Playground" },
  { id: "install", path: "/install", label: "Install" },
  { id: "fields", path: "/fields", label: "Fields" },
  { id: "collections", path: "/collections", label: "Collections" },
  { id: "overlay", path: "/overlay", label: "Overlay" },
  { id: "export", path: "/export", label: "Export" },
  { id: "theming", path: "/theming", label: "Theming" },
] as const

export type RouteId = (typeof ROUTES)[number]["id"]

export function hashToRoute(hash: string): RouteId {
  const path = hash.replace(/^#/, "") || "/"
  const match = ROUTES.find((route) => route.path === path)
  return match?.id ?? "playground"
}

export function routeToHash(id: RouteId): string {
  const route = ROUTES.find((item) => item.id === id)
  return `#${route?.path ?? "/"}`
}
