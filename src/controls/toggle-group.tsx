"use client"

import type { ReactNode } from "react"
import { cn } from "../lib/cn"

export type ControlToggleGroupOption = {
  value: string | number
  /** Text label. Omit when using an icon-only option. */
  label?: string
  /** Icon node rendered in place of (or alongside) the label. */
  icon?: ReactNode
}

export interface ControlToggleGroupProps {
  /** Optional heading rendered above the segmented control. */
  label?: string
  value: string | number
  options: ReadonlyArray<ControlToggleGroupOption>
  onChange: (v: string | number) => void
  className?: string
}

/**
 * Segmented single-select control: an optional label, then N option buttons
 * sharing one track. Each option is text, an icon, or both. The selected value
 * is highlighted with the panel's surface/accent tokens (not a heavy fill).
 */
export function ControlToggleGroup({
  label,
  value,
  options,
  onChange,
  className,
}: ControlToggleGroupProps) {
  return (
    <div className={cn("panel-toggle-group", className)}>
      {label ? <span className="panel-toggle-group-label">{label}</span> : null}
      <div
        className="panel-toggle-group-track"
        role="group"
        aria-label={label}
      >
        {options.map((o) => {
          const isSelected = String(o.value) === String(value)
          return (
            <button
              key={String(o.value)}
              type="button"
              className="panel-toggle-group-btn"
              data-panel-active={isSelected ? "true" : "false"}
              aria-pressed={isSelected}
              aria-label={o.label ?? String(o.value)}
              title={o.label}
              onClick={() => onChange(o.value)}
            >
              {o.icon ? (
                <span className="panel-toggle-group-icon" aria-hidden="true">
                  {o.icon}
                </span>
              ) : null}
              {o.label ? (
                <span className="panel-toggle-group-text">{o.label}</span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
