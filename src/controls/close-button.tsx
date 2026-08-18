"use client"

import { cn } from "../lib/cn"

export interface PanelCloseButtonProps {
  onClick: () => void
  ariaLabel: string
  /** md = 22px header size (default); sm = 18px for dense rows. */
  size?: "md" | "sm"
  disabled?: boolean
  className?: string
  title?: string
}

/**
 * The one X/close/remove control for the whole panel. Every dismiss affordance
 * — header close, stripe/collection/gradient row removes, field clears —
 * renders this so they share the header button's exact treatment (transparent,
 * 4px radius, hover surface, active press, generous hit area). Layout
 * (justify-self, flex placement) rides on `className` at the call site; the
 * look never forks.
 */
export function PanelCloseButton({
  onClick,
  ariaLabel,
  size = "md",
  disabled,
  className,
  title,
}: PanelCloseButtonProps) {
  return (
    <button
      type="button"
      className={cn("panel-close-btn", className)}
      data-panel-size={size}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      onClick={onClick}
    >
      <PanelCloseIcon />
    </button>
  )
}

export function PanelCloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}
