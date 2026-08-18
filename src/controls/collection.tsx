"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type {
  AnyRenderableField,
  RenderFieldContext,
  RenderedField,
} from "../panel/render-field"
import { renderPanelField } from "../panel/render-field"
import type { PanelCollectionField, PanelCollectionItem } from "../types"
import { PanelCloseButton } from "./close-button"

/** Turn a plural-ish label into a singular for the default add button. */
function singular(label: string): string {
  if (/ies$/i.test(label)) return label.replace(/ies$/i, "y")
  if (/ses$/i.test(label)) return label.replace(/es$/i, "")
  if (/s$/i.test(label)) return label.replace(/s$/i, "")
  return label
}

let idCounter = 0
/** Stable unique id — `crypto.randomUUID()` with a counter fallback. */
function makeId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID()
    }
  } catch {
    /* fall through */
  }
  idCounter += 1
  return `item-${Date.now().toString(36)}-${idCounter}`
}

export interface ControlCollectionProps {
  field: PanelCollectionField<Record<string, unknown>, PanelCollectionItem>
  items: PanelCollectionItem[]
  onChange: (next: PanelCollectionItem[]) => void
  /** Render context threaded from the panel — root state lives here. */
  renderContext: RenderFieldContext
  /** Fires with the open item's id (or null). Single-open only. */
  onSelect?: (id: string | null) => void
  /**
   * Controlled selected / open item id (single-open). `undefined` = uncontrolled
   * (internal open state). `null` closes. Opening a row still fires `onSelect`;
   * an external `selectedId` opens that row.
   */
  selectedId?: string | null
  className?: string
}

/**
 * A managed list of items. Header (label + count + Add), one disclosure row
 * per item; expanding a row renders that item's `itemFields` recursively
 * through the shared field renderer. Rows support remove, drag-to-reorder,
 * and single-open selection (the open row IS the selection).
 */
export function ControlCollection({
  field,
  items,
  onChange,
  renderContext,
  onSelect,
  selectedId,
  className,
}: ControlCollectionProps) {
  const multiOpen = field.multiOpen ?? false
  const reorderable = field.reorderable ?? true
  const canRemove = items.length > (field.min ?? 0)
  const canAdd =
    field.newItem != null &&
    (field.max == null || items.length < field.max)

  // Selection / open state. Single-open by default: one id, or null.
  // `selectedId !== undefined` is the controlled path (canvas ↔ panel binding).
  const isControlled = selectedId !== undefined
  const [internalOpenIds, setOpenIds] = useState<Set<string>>(
    () => (selectedId ? new Set([selectedId]) : new Set()),
  )
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const liveOnSelect = useRef(onSelect)
  liveOnSelect.current = onSelect

  const openIds =
    isControlled && !multiOpen
      ? selectedId
        ? new Set([selectedId])
        : new Set<string>()
      : internalOpenIds

  // Controlled + multiOpen: an external selectedId still opens that row
  // without closing the others.
  useEffect(() => {
    if (!isControlled || !multiOpen) return
    if (!selectedId) return
    setOpenIds((prev) => {
      if (prev.has(selectedId)) return prev
      const next = new Set(prev)
      next.add(selectedId)
      return next
    })
  }, [isControlled, multiOpen, selectedId])

  const setOpen = useCallback(
    (id: string, open: boolean) => {
      if (multiOpen) {
        setOpenIds((prev) => {
          const next = new Set(prev)
          if (open) next.add(id)
          else next.delete(id)
          return next
        })
        if (open) liveOnSelect.current?.(id)
        else if (selectedId === id) liveOnSelect.current?.(null)
        return
      }
      liveOnSelect.current?.(open ? id : null)
      if (!isControlled) {
        setOpenIds(open ? new Set([id]) : new Set())
      }
    },
    [isControlled, multiOpen, selectedId],
  )

  const replaceItem = useCallback(
    (index: number, nextItem: PanelCollectionItem) => {
      const next = items.slice()
      next[index] = nextItem
      onChange(next)
    },
    [items, onChange],
  )

  const removeItem = useCallback(
    (index: number) => {
      const removed = items[index]
      const next = items.slice()
      next.splice(index, 1)
      onChange(next)
      if (removed) setOpen(removed.id, false)
    },
    [items, onChange, setOpen],
  )

  const addItem = useCallback(() => {
    if (!field.newItem) return
    const made = field.newItem() as PanelCollectionItem
    const item: PanelCollectionItem =
      made && typeof made.id === "string" && made.id
        ? made
        : { ...made, id: makeId() }
    onChange([...items, item])
    // Open the freshly-added row (also becomes the selection).
    setOpen(item.id, true)
  }, [field, items, onChange, setOpen])

  const moveItem = useCallback(
    (from: number, to: number) => {
      if (from === to || from < 0 || to < 0) return
      const next = items.slice()
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      onChange(next)
    },
    [items, onChange],
  )

  return (
    <div className={`panel-collection${className ? ` ${className}` : ""}`}>
      <div className="panel-collection-header">
        <span className="panel-collection-title">{field.label}</span>
        <span className="panel-collection-count">{items.length}</span>
        {field.newItem ? (
          <button
            type="button"
            className="panel-collection-add"
            disabled={!canAdd}
            onClick={addItem}
          >
            {field.addLabel ?? `Add ${singular(field.label)}`}
          </button>
        ) : null}
      </div>

      {field.description ? (
        <div className="panel-field-description">{field.description}</div>
      ) : null}

      <div className="panel-collection-items">
        {items.map((item, index) => {
          const open = openIds.has(item.id)
          const selected =
            selectedId !== undefined
              ? selectedId === item.id
              : open && !multiOpen
          const title = field.itemLabel
            ? field.itemLabel(item, index)
            : `${field.label} ${index + 1}`

          const itemFields =
            typeof field.itemFields === "function"
              ? field.itemFields(item, index)
              : field.itemFields

          const setItem = (next: Record<string, unknown>) =>
            replaceItem(index, next as PanelCollectionItem)

          const rendered: RenderedField[] = []
          if (open) {
            for (const f of itemFields) {
              if (f.type === "section") continue
              const out = renderPanelField(f as AnyRenderableField, {
                ...renderContext,
                values: item as Record<string, unknown>,
                setValues: setItem,
              })
              if (out) rendered.push(out)
            }
          }

          return (
            <div
              key={item.id}
              className="panel-collection-row"
              data-panel-open={open ? "true" : "false"}
              data-panel-selected={selected ? "true" : "false"}
              data-panel-dragging={dragIndex === index ? "true" : "false"}
              data-panel-dragover={overIndex === index ? "true" : "false"}
              onDragOver={
                reorderable && dragIndex != null
                  ? (e) => {
                      e.preventDefault()
                      setOverIndex(index)
                    }
                  : undefined
              }
              onDrop={
                reorderable && dragIndex != null
                  ? (e) => {
                      e.preventDefault()
                      moveItem(dragIndex, index)
                      setDragIndex(null)
                      setOverIndex(null)
                    }
                  : undefined
              }
            >
              <div className="panel-collection-row-head">
                {reorderable ? (
                  <span
                    className="panel-collection-drag"
                    role="button"
                    tabIndex={-1}
                    aria-label="Drag to reorder"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move"
                      setDragIndex(index)
                    }}
                    onDragEnd={() => {
                      setDragIndex(null)
                      setOverIndex(null)
                    }}
                  >
                    <DragIcon />
                  </span>
                ) : null}

                <button
                  type="button"
                  className="panel-collection-row-toggle"
                  aria-expanded={open}
                  onClick={() => setOpen(item.id, !open)}
                >
                  <span className="panel-collection-row-label">{title}</span>
                  <CaretIcon />
                </button>

                <PanelCloseButton
                  className="panel-collection-remove"
                  ariaLabel="Remove"
                  size="sm"
                  disabled={!canRemove}
                  onClick={() => removeItem(index)}
                />
              </div>

              <div
                className="panel-collapse"
                data-panel-open={open ? "true" : "false"}
                aria-hidden={!open}
              >
                <div className="panel-collapse-inner">
                  <div className="panel-collection-row-body">
                    {rendered.map((r) => (
                      <div key={r.reactKey} className="panel-field">
                        {r.node}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {items.length === 0 ? (
          <div className="panel-collection-empty">No items</div>
        ) : null}
      </div>
    </div>
  )
}

function CaretIcon() {
  return (
    <svg
      className="panel-collection-caret"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function DragIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="6" r="1.4" />
      <circle cx="15" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" />
      <circle cx="15" cy="18" r="1.4" />
    </svg>
  )
}
