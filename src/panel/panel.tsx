"use client"

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { ControlAnimation } from "../controls/animation-controls"
import { ControlExport } from "../controls/export-controls"
import { ControlQuickActions } from "../controls/quick-actions"
import { ControlSection } from "../controls/section"
import { renderPanelField, type AnyRenderableField } from "./render-field"
import type { PanelPrompt } from "../prompts"
import { FloatingPanel } from "./floating-panel"
import {
  clearPersistedPanelValues,
  clearPersistedPanelSections,
  hasPersistedPanelValues,
  loadPersistedPanelSections,
  loadPersistedPanelValues,
  persistPanelSections,
  persistPanelValues,
} from "../persist"
import type { PanelTheme } from "../hooks/use-theme"
import {
  getPanelCollectionSelection,
  selectPanelCollectionItem,
  subscribePanelCollectionSelection,
  type PanelCollectionSelection,
} from "../store"
import type { PanelField, PanelSide } from "../types"

/** Empty default — the AI-prompt rail is opt-in (shaders use `useShaderPanel`). */
const EMPTY_PROMPTS: readonly PanelPrompt[] = []
const EMPTY_COLLECTION_SELECTION: PanelCollectionSelection = Object.freeze({})

export type PanelWriteResult = { ok: boolean; message: string }

export function Panel<T extends Record<string, unknown>>({
  id,
  title,
  titleSlot,
  side = "right",
  open,
  onClose,
  onOpen,
  values,
  defaults,
  fields,
  onChange,
  onWriteConfig,
  writeLabel = "Write config file",
  shortcutHint = false,
  prompts = EMPTY_PROMPTS,
  persist = true,
  defaultTheme,
  themeStorageKey,
  showThemeToggle,
  actionHandlers,
  container,
  inline = false,
  peek,
  showAnimation = true,
  showExport = true,
  onSelect,
}: {
  /** Used as the localStorage key (`shader-dev:<id>`) when `persist` is true. */
  id?: string
  title: string
  /** Which side of the viewport the panel docks to. Default `"right"`. */
  side?: PanelSide
  /** Rendered next to the title — used by PanelRoot for the multi-shader switcher. */
  titleSlot?: React.ReactNode
  open: boolean
  onClose: () => void
  /** Open the panel — used by the edge-hover peek preview. */
  onOpen?: () => void
  values: T
  defaults: T
  fields: PanelField<T>[]
  onChange: (next: T) => void
  onWriteConfig?: (values: T) => Promise<PanelWriteResult>
  writeLabel?: string
  shortcutHint?: boolean
  /** AI-prompt rail at the top of the panel. Pass `[]` to hide. */
  prompts?: ReadonlyArray<PanelPrompt>
  /** Persist values to `localStorage["shader-dev:<id>"]`. Requires `id`. Default true. */
  persist?: boolean
  defaultTheme?: PanelTheme
  /** sessionStorage key for the header theme toggle. */
  themeStorageKey?: string
  /** Show the light/dark toggle in the panel header. Default true. */
  showThemeToggle?: boolean
  /** Handlers for `type: "action"` fields, keyed by `actionId`. */
  actionHandlers?: Record<string, () => void>
  /** Portal target for the floating shell. Ignored when `inline` is true. */
  container?: HTMLElement | null
  /** Render in-place instead of portaling to body. */
  inline?: boolean
  /** Edge-hover peek preview while collapsed. Defaults to false when inline. */
  peek?: boolean
  /** Show the shader animation clock block. Default true. */
  showAnimation?: boolean
  /** Show canvas PNG/video export in the actions footer. Default true. */
  showExport?: boolean
  /**
   * Fires with the open item's id (or null) of a `collection` field. The
   * collection key is the first argument. Used by canvas overlays to highlight
   * the selected item and vice-versa.
   */
  onSelect?: (collectionKey: string, id: string | null) => void
}) {
  const [writing, setWriting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState("")
  const [pasteError, setPasteError] = useState<string | null>(null)
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>({})
  const pasteTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  const collectionSelection = useSyncExternalStore(
    subscribePanelCollectionSelection,
    () => (id ? getPanelCollectionSelection(id) : EMPTY_COLLECTION_SELECTION),
    () => EMPTY_COLLECTION_SELECTION,
  )

  const handleCollectionSelect = useCallback(
    (collectionKey: string, itemId: string | null) => {
      if (id) selectPanelCollectionItem(id, collectionKey, itemId)
      onSelect?.(collectionKey, itemId)
    },
    [id, onSelect],
  )

  // Focus + scroll-into-view when the paste sheet opens. Wait until the open
  // transition has progressed (~half the 280ms duration) so the textarea has
  // measurable height — browsers skip focus on zero-rendered-size elements.
  useEffect(() => {
    if (!pasteOpen) return
    const id = window.setTimeout(() => {
      const el = pasteTextareaRef.current
      if (!el) return
      el.focus({ preventScroll: true })
      el.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, 150)
    return () => window.clearTimeout(id)
  }, [pasteOpen])

  // Image values (object URLs) are excluded from persistence, modified
  // detection, and Copy JSON — an object URL is dead after reload, and a
  // data URL would blow the localStorage quota.
  const imageKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const f of fields) {
      if (f.type === "image") keys.add(f.key)
    }
    return keys
  }, [fields])

  // Collection `migrate` hooks, keyed by the collection field's key. Applied
  // to that key's array after the persistence merge on load (OFF-137) — for
  // versioned item-shape changes.
  const collectionMigrations = useMemo(() => {
    const out = new Map<string, (items: { id: string }[]) => { id: string }[]>()
    for (const f of fields) {
      if (f.type === "collection" && f.migrate) {
        out.set(f.key, f.migrate as (i: { id: string }[]) => { id: string }[])
      }
    }
    return out
  }, [fields])

  const stripImages = useCallback(
    (obj: Record<string, unknown>): Record<string, unknown> => {
      if (imageKeys.size === 0) return obj
      const out = { ...obj }
      for (const k of imageKeys) delete out[k]
      return out
    },
    [imageKeys],
  )

  // Detect "modified" by comparing serialized snapshots. Flat configs are
  // cheap and the rendered indicator only flips on real change.
  const valuesJson = useMemo(
    () => JSON.stringify(stripImages(values)),
    [values, stripImages],
  )
  const defaultsJson = useMemo(
    () => JSON.stringify(stripImages(defaults)),
    [defaults, stripImages],
  )
  const isModified = valuesJson !== defaultsJson

  const persistKey = persist && id ? id : null
  /** Section expand/collapse always persists when `id` is set — even if `persist: false`. */
  const sectionsKey = id ?? null

  // Auto-hydrate from localStorage on first mount for this id — push saved
  // values back through onChange. This makes persistence "just work" without
  // the consumer wiring `loadPersistedPanelValues` into its useState
  // initializer (that path still works and avoids the one-frame flash).
  const liveRef = useRef({ onChange, defaults, values, valuesJson, stripImages })
  liveRef.current = { onChange, defaults, values, valuesJson, stripImages }
  const hydratedIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!persistKey) return
    if (hydratedIdRef.current === persistKey) return
    hydratedIdRef.current = persistKey
    if (!hasPersistedPanelValues(persistKey)) return
    const live = liveRef.current
    const saved = loadPersistedPanelValues(persistKey, live.defaults)
    // Image keys are never persisted — keep whatever the app currently holds
    // (a consumer may have set an object URL before hydration ran).
    for (const k of imageKeys) {
      if (k in live.values) {
        ;(saved as Record<string, unknown>)[k] = live.values[k]
      }
    }
    // Apply collection migrations to any restored arrays (versioned shapes).
    for (const [k, migrate] of collectionMigrations) {
      const arr = (saved as Record<string, unknown>)[k]
      if (Array.isArray(arr)) {
        ;(saved as Record<string, unknown>)[k] = migrate(
          arr as { id: string }[],
        )
      }
    }
    if (JSON.stringify(live.stripImages(saved)) !== live.valuesJson) {
      live.onChange(saved as T)
    }
  }, [persistKey, imageKeys, collectionMigrations])

  // Write to localStorage whenever values change (debounce-free — these are
  // tiny blobs and the user is hand-tweaking).
  const skipNextPersistRef = useRef(true)
  useEffect(() => {
    if (!persistKey) return
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false
      return
    }
    if (isModified) {
      persistPanelValues(persistKey, JSON.parse(valuesJson) as T)
    } else {
      clearPersistedPanelValues(persistKey)
    }
  }, [persistKey, valuesJson, isModified])

  // Hydrate section expand/collapse from localStorage on first mount for this id.
  const sectionHydratedIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!sectionsKey) return
    if (sectionHydratedIdRef.current === sectionsKey) return
    sectionHydratedIdRef.current = sectionsKey
    setSectionOpen(loadPersistedPanelSections(sectionsKey))
  }, [sectionsKey])

  const setSectionOpenState = useCallback((title: string, open: boolean) => {
    setSectionOpen((prev) => ({ ...prev, [title]: open }))
  }, [])

  const skipNextSectionPersistRef = useRef(true)
  useEffect(() => {
    if (!sectionsKey) return
    if (skipNextSectionPersistRef.current) {
      skipNextSectionPersistRef.current = false
      return
    }
    persistPanelSections(sectionsKey, sectionOpen)
  }, [sectionsKey, sectionOpen])

  const resetAll = useCallback(() => {
    onChange({ ...defaults })
    if (persistKey) clearPersistedPanelValues(persistKey)
    if (sectionsKey) clearPersistedPanelSections(sectionsKey)
    setSectionOpen({})
    setStatus(null)
  }, [defaults, onChange, persistKey, sectionsKey])

  const handleApplyPaste = useCallback(() => {
    try {
      const parsed = JSON.parse(pasteText) as Partial<T>
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Expected a JSON object")
      }
      const next = { ...values }
      let applied = 0
      for (const key of Object.keys(defaults) as (keyof T)[]) {
        if (key in parsed && (parsed as Record<string, unknown>)[key as string] !== undefined) {
          next[key] = (parsed as Record<string, unknown>)[key as string] as T[typeof key]
          applied += 1
        }
      }
      if (applied === 0) {
        throw new Error("No known keys found")
      }
      onChange(next)
      setPasteOpen(false)
      setPasteText("")
      setPasteError(null)
      setStatus(`Applied ${applied} key${applied === 1 ? "" : "s"}`)
      setTimeout(() => setStatus(null), 2000)
    } catch (err) {
      setPasteError(err instanceof Error ? err.message : "Invalid JSON")
    }
  }, [defaults, onChange, pasteText, values])

  const configJson = useMemo(
    () => JSON.stringify(stripImages(values), null, 2),
    [values, stripImages],
  )

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(configJson)
    setStatus("Copied JSON to clipboard")
    setTimeout(() => setStatus(null), 2000)
  }, [configJson])

  const handleWrite = useCallback(async () => {
    if (!onWriteConfig) return
    setWriting(true)
    setStatus(null)
    try {
      const result = await onWriteConfig(values)
      setStatus(result.message)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Write failed")
    } finally {
      setWriting(false)
    }
  }, [onWriteConfig, values])

  const resetKeys = useCallback(
    (keys: ReadonlyArray<keyof T & string>) => {
      const next = { ...values }
      for (const k of keys) {
        next[k] = defaults[k]
      }
      onChange(next)
    },
    [defaults, onChange, values],
  )

  const sections = useMemo(() => {
    const out: {
      title: string
      children: ReactNode[]
      keys: (keyof T & string)[]
    }[] = []
    let current: {
      title: string
      children: ReactNode[]
      keys: (keyof T & string)[]
    } | null = null

    const ensureCurrent = () => {
      if (!current) {
        current = { title: "Parameters", children: [], keys: [] }
        out.push(current)
      }
      return current
    }

    const rootValues = values as Record<string, unknown>
    const setRootValues = (next: Record<string, unknown>) => onChange(next as T)

    for (const field of fields) {
      if (field.type === "section") {
        current = { title: field.title, children: [], keys: [] }
        out.push(current)
        continue
      }

      const rendered = renderPanelField(field as AnyRenderableField, {
        values: rootValues,
        setValues: setRootValues,
        rootValues,
        setRootValues,
        actionHandlers,
        onCollectionSelect: handleCollectionSelect,
        collectionSelection: id ? collectionSelection : undefined,
      })
      if (!rendered) continue

      const group = ensureCurrent()
      group.children.push(
        <div key={rendered.reactKey} className="panel-field">
          {rendered.node}
        </div>,
      )
      // Track scalar keys for section-level reset. Field types with a `key`
      // (everything except section/action/presets) opt into reset.
      if ("key" in field) group.keys.push(field.key)
    }

    return out
  }, [actionHandlers, collectionSelection, fields, handleCollectionSelect, id, onChange, values])

  const resolvedPeek = peek ?? !inline

  return (
    <FloatingPanel
      side={side}
      collapsed={!open}
      onToggle={onClose}
      onOpen={onOpen}
      title={title}
      titleSlot={titleSlot}
      defaultTheme={defaultTheme}
      themeStorageKey={themeStorageKey}
      showThemeToggle={showThemeToggle}
      container={container}
      inline={inline}
      peek={resolvedPeek}
    >
      <div className="panel-fields">
        {showAnimation ? <ControlAnimation /> : null}

        {prompts.length > 0 ? (
          <ControlQuickActions prompts={prompts} shaderName={title} />
        ) : null}

        {shortcutHint ? (
          <div className="panel-shortcut-hint">
            <kbd>⌘⌥D</kbd> to toggle · <kbd>⌘⇧`</kbd> / <kbd>⌘⇧D</kbd> also work
          </div>
        ) : null}

        {sections.map((section) => (
          <ControlSection
            key={section.title}
            title={section.title}
            open={sectionOpen[section.title] ?? true}
            onOpenChange={(open) => setSectionOpenState(section.title, open)}
            onReset={
              section.keys.length > 0
                ? () => resetKeys(section.keys)
                : undefined
            }
          >
            {section.children}
          </ControlSection>
        ))}

        <div className="panel-actions">
          {showExport ? <ControlExport name={title} /> : null}

          <button type="button" onClick={resetAll} className="panel-action-btn">
            Reset to defaults
          </button>
          <button type="button" onClick={handleCopy} className="panel-action-btn">
            Copy JSON
          </button>
          <button
            type="button"
            onClick={() => {
              setPasteOpen((v) => !v)
              setPasteError(null)
            }}
            className="panel-action-btn"
            aria-expanded={pasteOpen}
          >
            {pasteOpen ? "Cancel paste" : "Paste JSON"}
          </button>

          <div
            className="panel-collapse"
            data-panel-open={persistKey && isModified ? "true" : "false"}
            aria-hidden={!(persistKey && isModified)}
          >
            <div className="panel-collapse-inner">
              <div className="panel-saved-indicator" aria-live="polite">
                <span className="panel-saved-dot" /> Edits saved locally
              </div>
            </div>
          </div>

          <div
            className="panel-collapse"
            data-panel-open={pasteOpen ? "true" : "false"}
            aria-hidden={!pasteOpen}
          >
            <div className="panel-collapse-inner">
              <div className="panel-paste">
                <textarea
                  ref={pasteTextareaRef}
                  className="panel-paste-textarea"
                  value={pasteText}
                  onChange={(e) => {
                    setPasteText(e.target.value)
                    if (pasteError) setPasteError(null)
                  }}
                  placeholder='{ "speed": 1.0, "bgColor": "#ff0000" }'
                  spellCheck={false}
                  rows={5}
                />
                {pasteError ? (
                  <div className="panel-paste-error">{pasteError}</div>
                ) : null}
                <button
                  type="button"
                  onClick={handleApplyPaste}
                  disabled={pasteText.trim().length === 0}
                  className="panel-action-btn"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {onWriteConfig ? (
            <button
              type="button"
              disabled={writing}
              onClick={() => void handleWrite()}
              className="panel-action-btn"
            >
              {writing ? "Writing…" : writeLabel}
            </button>
          ) : null}
          {status ? <div className="panel-status">{status}</div> : null}
        </div>
      </div>
    </FloatingPanel>
  )
}
