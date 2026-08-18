/**
 * Persisted open/closed state for in-control drawers (e.g. the stripe table's
 * Colors drawer), keyed by a caller-chosen id. Survives reloads via
 * localStorage; storage failures are silently ignored.
 */

const CONTROL_DRAWER_STATE_KEY = "tjcages-panels-control-drawers-v1"

type ControlDrawerState = Record<string, boolean>

function readControlDrawerState(): ControlDrawerState {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(CONTROL_DRAWER_STATE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object"
      ? (parsed as ControlDrawerState)
      : {}
  } catch {
    return {}
  }
}

function writeControlDrawerState(state: ControlDrawerState): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(CONTROL_DRAWER_STATE_KEY, JSON.stringify(state))
  } catch {
    /* ignore storage errors */
  }
}

export function loadControlDrawerOpen(id: string, defaultOpen = false): boolean {
  const state = readControlDrawerState()
  return typeof state[id] === "boolean" ? state[id] : defaultOpen
}

export function saveControlDrawerOpen(id: string, open: boolean): void {
  const state = readControlDrawerState()
  state[id] = open
  writeControlDrawerState(state)
}
