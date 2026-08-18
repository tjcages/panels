"use client"

import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import type { PanelSide } from "../types"
import { Panel } from "./panel"
import {
  getActivePanelForSide,
  getActivePanelIdForSide,
  getPanelRegistrations,
  getPanelRegistrationsForSide,
  getPanelRevision,
  setActivePanel,
  subscribePanelRegistration,
} from "../store"
import { PanelHeaderSelect } from "./header-select"
import { installPanelKeyboard } from "../hooks/keyboard"
import { useInjectPanelStyles } from "../hooks/use-inject-styles"
import {
  initPanelOpenFlag,
  readPanelOpenFlag,
  PANEL_TOGGLE_EVENT,
  writePanelOpenFlag,
} from "../hooks/use-shortcut"
import {
  usePanelTheme,
  type PanelTheme,
} from "../hooks/use-theme"

function subscribeSideOpen(side: PanelSide, listener: () => void): () => void {
  const onToggle = () => listener()
  window.addEventListener(PANEL_TOGGLE_EVENT, onToggle)
  return () => window.removeEventListener(PANEL_TOGGLE_EVENT, onToggle)
}

function getSideOpenSnapshot(side: PanelSide): boolean {
  return readPanelOpenFlag(side)
}

function useSideOpen(side: PanelSide): boolean {
  const subscribe = useCallback(
    (listener: () => void) => subscribeSideOpen(side, listener),
    [side],
  )
  return useSyncExternalStore(
    subscribe,
    () => getSideOpenSnapshot(side),
    () => false,
  )
}

// Only one root renders the panel — whether mounted explicitly via
// <PanelRoot/> or auto-injected by usePanel. The first to claim wins;
// extras render null so you never get two panels.
let primaryClaimed = false

/**
 * Mounts once in the app layout. Owns the keyboard shortcut + renders whichever
 * shader is currently active on each side. Shaders register themselves on
 * hydrate via `registerPanel({ id, title, side, values, defaults, fields, onChange })`.
 *
 * When 2+ shaders are registered on the same side, a switcher appears in that
 * panel's header.
 */
export function PanelRoot({
  emptyMessage = "No shader registered on this page.",
  defaultTheme,
  themeStorageKey,
  defaultLeftOpen = false,
  defaultRightOpen,
  showThemeToggle = true,
}: {
  emptyMessage?: string
  /** Initial theme when no user override + no `html.dark` are set. Falls back to OS preference if omitted. */
  defaultTheme?: PanelTheme
  /** sessionStorage key for the header theme toggle. */
  themeStorageKey?: string
  /** Initial open state for the left panel this session. Default false. */
  defaultLeftOpen?: boolean
  /** Initial open state for the right panel. Defaults to closed unless seeded by `usePanel({ defaultOpen: true })`. */
  defaultRightOpen?: boolean
  /** Show the sun/moon theme toggle in the left panel header. Default true. */
  showThemeToggle?: boolean
} = {}) {
  const [isPrimary, setIsPrimary] = useState(false)
  useEffect(() => {
    if (primaryClaimed) return
    primaryClaimed = true
    setIsPrimary(true)
    initPanelOpenFlag(defaultLeftOpen, "left")
    if (defaultRightOpen !== undefined) {
      initPanelOpenFlag(defaultRightOpen, "right")
    }
    return () => {
      primaryClaimed = false
    }
  }, [defaultLeftOpen, defaultRightOpen])

  useInjectPanelStyles()
  const theme = usePanelTheme(defaultTheme)
  const leftOpen = useSideOpen("left")
  const rightOpen = useSideOpen("right")

  useSyncExternalStore(
    subscribePanelRegistration,
    getPanelRevision,
    () => 0,
  )

  const leftRegistration = getActivePanelForSide("left")
  const rightRegistration = getActivePanelForSide("right")
  const leftRegistrations = getPanelRegistrationsForSide("left")
  const rightRegistrations = getPanelRegistrationsForSide("right")

  useEffect(() => installPanelKeyboard(), [])

  const setSideOpen = useCallback((side: PanelSide, next: boolean) => {
    writePanelOpenFlag(next, side)
    window.dispatchEvent(new CustomEvent(PANEL_TOGGLE_EVENT, { detail: { side } }))
  }, [])

  if (!isPrimary) return null

  const hasAnyRegistration = leftRegistration ?? rightRegistration
  const anyOpen = leftOpen || rightOpen

  if (!hasAnyRegistration) {
    return anyOpen ? (
      <div data-panel="" data-panel-theme={theme} className="panel-empty">
        {emptyMessage}
        <button
          type="button"
          className="panel-empty-close"
          onClick={() => {
            setSideOpen("left", false)
            setSideOpen("right", false)
          }}
        >
          Close
        </button>
      </div>
    ) : null
  }

  return (
    <>
      {leftRegistration ? (
        <RegisteredSidePanel
          side="left"
          registration={leftRegistration}
          activeId={getActivePanelIdForSide("left")}
          allRegistrations={leftRegistrations}
          open={leftOpen}
          onClose={() => setSideOpen("left", false)}
          onOpen={() => setSideOpen("left", true)}
          defaultTheme={defaultTheme}
          themeStorageKey={themeStorageKey}
          showThemeToggle={showThemeToggle}
        />
      ) : null}
      {rightRegistration ? (
        <RegisteredSidePanel
          side="right"
          registration={rightRegistration}
          activeId={getActivePanelIdForSide("right")}
          allRegistrations={rightRegistrations}
          open={rightOpen}
          onClose={() => setSideOpen("right", false)}
          onOpen={() => setSideOpen("right", true)}
          defaultTheme={defaultTheme}
          themeStorageKey={themeStorageKey}
          showThemeToggle={false}
        />
      ) : null}
    </>
  )
}

function RegisteredSidePanel({
  side,
  registration,
  activeId,
  allRegistrations,
  open,
  onClose,
  onOpen,
  defaultTheme,
  themeStorageKey,
  showThemeToggle,
}: {
  side: PanelSide
  registration: NonNullable<ReturnType<typeof getActivePanelForSide>>
  activeId: string | null
  allRegistrations: ReturnType<typeof getPanelRegistrationsForSide>
  open: boolean
  onClose: () => void
  onOpen: () => void
  defaultTheme?: PanelTheme
  themeStorageKey?: string
  showThemeToggle?: boolean
}) {
  const switcher =
    allRegistrations.length > 1 ? (
      <PanelSwitcher activeId={activeId} registrations={allRegistrations} />
    ) : null

  return (
    <Panel
      id={registration.id}
      side={side}
      title={registration.title}
      titleSlot={switcher}
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      values={registration.values}
      defaults={registration.defaults}
      fields={registration.fields}
      onChange={registration.onChange}
      onWriteConfig={registration.onWriteConfig}
      writeLabel={registration.writeLabel}
      prompts={registration.prompts}
      persist={registration.persist}
      defaultTheme={defaultTheme}
      themeStorageKey={themeStorageKey}
      showThemeToggle={showThemeToggle}
      actionHandlers={registration.actionHandlers}
    />
  )
}

/**
 * The custom dropdown that switches between registered targets. Selecting a
 * target makes it active, then takes you to it: its `scrollTo` selector is
 * scrolled into view (reduced-motion aware) and its `onSelect` runs — so a
 * multi-target panel navigates to the right section or page on its own.
 */
function PanelSwitcher({
  activeId,
  registrations,
}: {
  activeId: string | null
  registrations: ReadonlyArray<{ id: string; title: string }>
}) {
  const handleSelect = useCallback((id: string) => {
    setActivePanel(id)
    const reg = getPanelRegistrations().get(id)
    if (!reg) return
    if (reg.scrollTo && typeof document !== "undefined") {
      const target = document.querySelector(reg.scrollTo)
      if (target) {
        const reduce =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        target.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          block: "start",
        })
      }
    }
    reg.onSelect?.()
  }, [])

  return (
    <PanelHeaderSelect
      ariaLabel="Active panel"
      value={activeId ?? ""}
      options={registrations.map((reg) => ({
        value: reg.id,
        label: reg.title,
      }))}
      onChange={handleSelect}
    />
  )
}
