"use client"

import { cn } from "../lib/cn"
import { ColorPopover, type ColorLibraryGroup } from "./color-popover"

export interface ControlColorInputProps {
  label: string
  value: string
  onChange: (v: string) => void
  /** Named swatch groups for the popover's Library tab; picker-only when absent. */
  library?: ColorLibraryGroup[]
  className?: string
}

export function ControlColorInput({
  label,
  value,
  onChange,
  library,
  className,
}: ControlColorInputProps) {
  return (
    <div className={cn("panel-color", className)}>
      <span className="panel-color-label">{label}</span>
      <div className="panel-color-right">
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => onChange(e.target.value)}
          className="panel-color-text"
        />
        <ColorPopover
          color={value}
          onChange={onChange}
          library={library}
          ariaLabel={`Pick color for ${label}`}
          triggerClassName="panel-color-swatch"
          triggerStyle={{ background: value }}
        />
      </div>
    </div>
  )
}
