"use client"

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

export interface PanelHeaderSelectOption {
  value: string
  label: string
}

export interface PanelHeaderSelectProps {
  value: string
  options: ReadonlyArray<PanelHeaderSelectOption>
  onChange: (value: string) => void
  ariaLabel?: string
}

const TYPEAHEAD_RESET_MS = 500

/**
 * Custom header switcher dropdown (replaces the native `.panel-switcher`
 * <select>). Closed, the trigger fits its current label; open, it animates
 * its width (180ms, house ease) to match the menu, which renders
 * inline-absolute inside the header so it shares the panel's stacking.
 *
 * Roving aria-activedescendant listbox: focus stays on the trigger;
 * ArrowUp/Down wrap, Home/End jump, first-letter type-ahead, Enter commits,
 * Escape closes without committing (and never reaches panel-level handlers).
 */
export function PanelHeaderSelect({
  value,
  options,
  onChange,
  ariaLabel,
}: PanelHeaderSelectProps) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const sizerRef = useRef<HTMLSpanElement>(null)
  const typeahead = useRef({ buffer: "", at: 0 })
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [width, setWidth] = useState<number | null>(null)

  const selectedIndex = options.findIndex((o) => o.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined

  // Trigger width: the hidden sizer mirrors the trigger's natural (fit)
  // width; while open the trigger animates out to the menu's width instead.
  // Always an explicit px value so the CSS width transition can run.
  useLayoutEffect(() => {
    const sizer = sizerRef.current
    if (!sizer) return
    const fit = Math.ceil(sizer.getBoundingClientRect().width)
    const menu = open ? menuRef.current : null
    setWidth(
      menu ? Math.max(fit, Math.ceil(menu.getBoundingClientRect().width)) : fit,
    )
  }, [open, value, options])

  const openMenu = () => {
    setActive(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }

  const commit = (index: number) => {
    const opt = options[index]
    setOpen(false)
    if (opt && opt.value !== value) onChange(opt.value)
  }

  // Outside click closes.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    window.addEventListener("pointerdown", onPointerDown, true)
    return () => window.removeEventListener("pointerdown", onPointerDown, true)
  }, [open])

  // Keep the active option in view while keyboard-navigating.
  useLayoutEffect(() => {
    if (!open) return
    menuRef.current
      ?.querySelector<HTMLElement>(`[data-panel-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [open, active])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault()
        openMenu()
      }
      return
    }
    switch (e.key) {
      case "Escape":
        // Never bubbles to panel-level Escape handlers from an open menu.
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        return
      case "ArrowDown":
        e.preventDefault()
        setActive((a) => (a + 1) % options.length)
        return
      case "ArrowUp":
        e.preventDefault()
        setActive((a) => (a - 1 + options.length) % options.length)
        return
      case "Home":
        e.preventDefault()
        setActive(0)
        return
      case "End":
        e.preventDefault()
        setActive(options.length - 1)
        return
      case "Enter":
        e.preventDefault()
        commit(active)
        return
      case "Tab":
        setOpen(false)
        return
    }
    // Type-ahead by first letters.
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault()
      const now = Date.now()
      const t = typeahead.current
      t.buffer = now - t.at > TYPEAHEAD_RESET_MS ? e.key : t.buffer + e.key
      t.at = now
      const query = t.buffer.toLowerCase()
      const from = query.length === 1 ? active + 1 : active
      for (let step = 0; step < options.length; step++) {
        const i = (from + step) % options.length
        if (options[i].label.toLowerCase().startsWith(query)) {
          setActive(i)
          return
        }
      }
    }
  }

  const triggerContent = (
    <>
      <span className="panel-hselect-value">{selected?.label ?? "—"}</span>
      <ChevronIcon />
    </>
  )

  return (
    <div ref={rootRef} className="panel-hselect">
      <button
        type="button"
        className="panel-hselect-trigger"
        style={width != null ? { width } : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-controls={open ? `${id}-listbox` : undefined}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
      >
        {triggerContent}
      </button>
      <span
        ref={sizerRef}
        aria-hidden="true"
        className="panel-hselect-trigger panel-hselect-sizer"
      >
        {triggerContent}
      </span>
      {open ? (
        <div
          ref={menuRef}
          id={`${id}-listbox`}
          role="listbox"
          aria-label={ariaLabel}
          className="panel-hselect-menu"
        >
          {options.map((o, i) => {
            const isSelected = o.value === value
            return (
              <button
                key={o.value}
                id={`${id}-opt-${i}`}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={isSelected}
                data-panel-index={i}
                data-panel-active={i === active ? "true" : "false"}
                className="panel-hselect-option"
                onMouseEnter={() => setActive(i)}
                // Focus stays on the trigger (roving activedescendant).
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => commit(i)}
              >
                <span>{o.label}</span>
                {isSelected ? <CheckIcon /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function ChevronIcon() {
  return (
    <svg
      className="panel-hselect-chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      className="panel-hselect-check"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}
