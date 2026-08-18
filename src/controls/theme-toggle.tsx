"use client"

import { cn } from "../lib/cn"
import { ControlToggleGroup } from "./toggle-group"
import {
  applyPanelTheme,
  usePanelTheme,
  type PanelTheme,
} from "../hooks/use-theme"

export interface ControlThemeToggleProps {
  className?: string
  /** sessionStorage key for persisting the user's choice. */
  storageKey?: string
}

export function ControlThemeToggle({
  className,
  storageKey,
}: ControlThemeToggleProps) {
  const theme = usePanelTheme()

  return (
    <ControlToggleGroup
      className={cn("panel-theme-toggle", className)}
      value={theme}
      onChange={(v) => applyPanelTheme(v as PanelTheme, storageKey)}
      options={[
        { value: "light", icon: <SunIcon /> },
        { value: "dark", icon: <MoonIcon /> },
      ]}
    />
  )
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="4" strokeWidth="2" />
      <path
        strokeWidth="2"
        strokeLinecap="round"
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      />
    </svg>
  )
}
