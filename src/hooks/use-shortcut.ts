"use client"

import { useEffect } from "react"
import type { PanelSide } from "../types"

export const PANEL_TOGGLE_EVENT = "cf-shader-dev-toggle"
const PANEL_OPEN_KEY = "cf-accent-shader-dev-open"
const PANEL_OPEN_LEFT_KEY = "cf-accent-shader-dev-open-left"

function openKeyForSide(side: PanelSide): string {
  return side === "left" ? PANEL_OPEN_LEFT_KEY : PANEL_OPEN_KEY
}

export function readPanelOpenFlag(side: PanelSide = "right"): boolean {
  try {
    return sessionStorage.getItem(openKeyForSide(side)) === "true"
  } catch {
    return false
  }
}

export function writePanelOpenFlag(
  open: boolean,
  side: PanelSide = "right",
): void {
  try {
    sessionStorage.setItem(openKeyForSide(side), open ? "true" : "false")
  } catch {
    /* ignore */
  }
}

/**
 * Seed the open flag from an app-provided default the first time it's read this
 * session. If the user has already toggled the panel (flag present), their
 * choice wins. Returns the effective open state. Call synchronously before the
 * panel's first render to avoid an open/close flash.
 */
export function initPanelOpenFlag(
  defaultOpen: boolean,
  side: PanelSide = "right",
): boolean {
  try {
    const key = openKeyForSide(side)
    const raw = sessionStorage.getItem(key)
    if (raw === null) {
      sessionStorage.setItem(key, defaultOpen ? "true" : "false")
      return defaultOpen
    }
    return raw === "true"
  } catch {
    return defaultOpen
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return true
  }
  return target.isContentEditable
}

function isKeyD(e: KeyboardEvent): boolean {
  return e.key === "d" || e.key === "D" || e.code === "KeyD"
}

/**
 * Toggle shader dev UI.
 * - ⌘⌥D / Ctrl+Alt+D (primary)
 * - ⌘⇧D / Ctrl+Shift+D (Chrome on Mac may steal this for "Bookmark all tabs")
 */
export function usePanelShortcut(onToggle: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return

      const mod = e.metaKey || e.ctrlKey
      if (!mod || !isKeyD(e)) return

      const primary = e.shiftKey && !e.altKey
      const fallback = e.altKey && !e.shiftKey
      if (!primary && !fallback) return

      e.preventDefault()
      e.stopImmediatePropagation()
      onToggle()
    }

    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [enabled, onToggle])
}

/** Dispatch from layout bridge; persists open state for late-hydrating shader islands. */
export function dispatchPanelToggle(side: PanelSide = "right"): void {
  writePanelOpenFlag(!readPanelOpenFlag(side), side)
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(PANEL_TOGGLE_EVENT, { detail: { side } }))
}
