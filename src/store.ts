import type { PanelPrompt } from "./prompts"
import type { PanelField, PanelSide, PanelWriteResult } from "./types"

export type PanelState = Record<string, unknown>

export type PanelRegistration<T extends PanelState = PanelState> = {
  id: string
  title: string
  /** Which side of the viewport the panel docks to. Default `"right"`. */
  side?: PanelSide
  values: T
  defaults: T
  fields: PanelField<T>[]
  onChange: (next: T) => void
  onWriteConfig?: (values: T) => Promise<PanelWriteResult>
  writeLabel?: string
  /**
   * Override the default AI-prompt rail at the top of the panel. Pass `[]`
   * to hide it entirely. Omit to use the built-in `DEFAULT_PANEL_PROMPTS`.
   */
  prompts?: ReadonlyArray<PanelPrompt>
  /**
   * Persist uniform values to `localStorage["panels:<id>"]`. Defaults to
   * `true`. Section expand/collapse is always persisted when `id` is set,
   * even if `persist: false` (so hosts can use their own value storage).
   */
  persist?: boolean
  /** Handlers for `type: "action"` fields, keyed by `actionId`. */
  actionHandlers?: Record<string, () => void>
  /**
   * Where this target lives, so picking it in the switcher takes you there.
   * `scrollTo` scrolls a selector into view (reduced-motion aware); `onSelect`
   * runs anything (route with your own router, focus a canvas, etc.). Both
   * fire after the target becomes active — `scrollTo` first, then `onSelect`.
   */
  scrollTo?: string
  onSelect?: () => void
}

const registrations = new Map<string, PanelRegistration>()
let activeLeftId: string | null = null
let activeRightId: string | null = null
let lastRegisteredId: string | null = null
const listeners = new Set<() => void>()
let snapshotRevision = 0

/**
 * One selected item id per collection, keyed by panel id then collection
 * field key. Distinct from `PanelRegistration.onSelect` (target navigation).
 */
export type PanelCollectionSelection = Readonly<Record<string, string | null>>

const EMPTY_COLLECTION_SELECTION: PanelCollectionSelection = Object.freeze({})

const collectionSelections = new Map<string, Map<string, string | null>>()
const collectionSelectionListeners = new Set<() => void>()
/** Per-panel snapshot cache — rebuilt only when THAT panel's selection changes. */
const collectionSelectionSnapshots = new Map<string, PanelCollectionSelection>()

function notifyCollectionSelection(): void {
  for (const listener of collectionSelectionListeners) listener()
}

function registrationSide(reg: PanelRegistration): PanelSide {
  return reg.side ?? "right"
}

function notify(): void {
  snapshotRevision += 1
  for (const listener of listeners) listener()
}

function promoteActiveForSide(side: PanelSide): void {
  const remaining = Array.from(registrations.values()).filter(
    (reg) => registrationSide(reg) === side,
  )
  const nextId = remaining.length ? remaining[remaining.length - 1].id : null
  if (side === "left") activeLeftId = nextId
  else activeRightId = nextId
}

/**
 * Register (or replace) a shader with the dev panel.
 *
 * Returns an unregister function — store it as the effect cleanup:
 * ```tsx
 * useEffect(() => registerPanel({...}), [config])
 * ```
 *
 * Passing `null` is a legacy no-arg cleanup: it removes the most recently
 * registered shader. Prefer returning the cleanup function or calling
 * `unregisterPanel(id)` explicitly.
 */
export function registerPanel<T extends PanelState>(
  next: PanelRegistration<T> | null,
): () => void {
  if (next === null) {
    if (lastRegisteredId !== null) {
      unregisterPanel(lastRegisteredId)
    }
    return () => {}
  }

  const reg = next as PanelRegistration
  const side = registrationSide(reg)
  registrations.set(reg.id, reg)
  lastRegisteredId = reg.id

  if (side === "left") {
    if (activeLeftId === null || !registrations.has(activeLeftId)) {
      activeLeftId = reg.id
    }
  } else if (activeRightId === null || !registrations.has(activeRightId)) {
    activeRightId = reg.id
  }

  notify()
  return () => unregisterPanel(reg.id)
}

/** Remove a registration by id. No-op if id isn't registered. */
export function unregisterPanel(id: string): void {
  const reg = registrations.get(id)
  const had = registrations.delete(id)
  if (!had || !reg) return
  if (lastRegisteredId === id) lastRegisteredId = null
  const side = registrationSide(reg)
  if (side === "left" && activeLeftId === id) promoteActiveForSide("left")
  if (side === "right" && activeRightId === id) promoteActiveForSide("right")
  notify()
  collectionSelectionSnapshots.delete(id)
  if (collectionSelections.delete(id)) {
    notifyCollectionSelection()
  }
}

/** Switch which registered shader the panel shows on the given side. */
export function setActivePanel(id: string): void {
  const reg = registrations.get(id)
  if (!reg) return
  const side = registrationSide(reg)
  if (side === "left") {
    if (activeLeftId === id) return
    activeLeftId = id
  } else {
    if (activeRightId === id) return
    activeRightId = id
  }
  notify()
}

export function getActivePanelId(): string | null {
  return activeRightId ?? activeLeftId
}

export function getActivePanelIdForSide(
  side: PanelSide,
): string | null {
  return side === "left" ? activeLeftId : activeRightId
}

export function getActivePanel(): PanelRegistration | null {
  if (activeRightId) return registrations.get(activeRightId) ?? null
  if (activeLeftId) return registrations.get(activeLeftId) ?? null
  return null
}

export function getActivePanelForSide(
  side: PanelSide,
): PanelRegistration | null {
  const id = getActivePanelIdForSide(side)
  return id ? (registrations.get(id) ?? null) : null
}

/** Snapshot of the registration map. */
export function getPanelRegistrations(): ReadonlyMap<
  string,
  PanelRegistration
> {
  return registrations
}

export function getPanelRegistrationsForSide(
  side: PanelSide,
): PanelRegistration[] {
  return Array.from(registrations.values()).filter(
    (reg) => registrationSide(reg) === side,
  )
}

/**
 * Monotonically incrementing counter — useful as a `useSyncExternalStore`
 * snapshot when you want to subscribe to "anything changed", not a specific
 * registration.
 */
export function getPanelRevision(): number {
  return snapshotRevision
}

/** @deprecated Use `getActivePanel` */
export function getPanelRegistration(): PanelRegistration | null {
  return getActivePanel()
}

export function subscribePanelRegistration(
  listener: () => void,
): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Set the selected item for one collection on a panel. `itemId: null` clears.
 * One selected id per collection — writing a new id replaces the previous.
 */
export function selectPanelCollectionItem(
  panelId: string,
  collectionKey: string,
  itemId: string | null,
): void {
  let forPanel = collectionSelections.get(panelId)
  const previous = forPanel?.get(collectionKey) ?? null
  if (previous === itemId) return

  if (itemId === null) {
    if (!forPanel) return
    forPanel.delete(collectionKey)
    if (forPanel.size === 0) collectionSelections.delete(panelId)
  } else {
    if (!forPanel) {
      forPanel = new Map()
      collectionSelections.set(panelId, forPanel)
    }
    forPanel.set(collectionKey, itemId)
  }
  collectionSelectionSnapshots.delete(panelId)
  notifyCollectionSelection()
}

/**
 * Selected item ids for every collection on `panelId`. Missing keys mean
 * nothing is selected. Snapshot is referentially stable until this panel's
 * selection changes (safe for `useSyncExternalStore`).
 */
export function getPanelCollectionSelection(
  panelId: string,
): PanelCollectionSelection {
  const cached = collectionSelectionSnapshots.get(panelId)
  if (cached) return cached
  const forPanel = collectionSelections.get(panelId)
  const snapshot: PanelCollectionSelection =
    !forPanel || forPanel.size === 0
      ? EMPTY_COLLECTION_SELECTION
      : Object.freeze(Object.fromEntries(forPanel))
  collectionSelectionSnapshots.set(panelId, snapshot)
  return snapshot
}

export function subscribePanelCollectionSelection(
  listener: () => void,
): () => void {
  collectionSelectionListeners.add(listener)
  return () => {
    collectionSelectionListeners.delete(listener)
  }
}
