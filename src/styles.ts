/**
 * Self-contained CSS for the shader-dev panel.
 *
 * Themes via CSS custom properties on `[data-panel]`. Consumers override
 * any variable in their own stylesheet to recolor without re-implementing.
 *
 * Class names are all `.panel-*` prefixed so they cannot collide with host app
 * styles even when the panel portals into `document.body`.
 */

export const PANEL_STYLE_ID = "shader-dev-styles"

export const PANEL_CSS = `
[data-panel] {
  --panel-bg: rgba(13, 13, 16, 0.95);
  --panel-border: rgba(255, 255, 255, 0.16);
  --panel-text: #ffffff;
  --panel-text-muted: rgba(255, 255, 255, 0.72);
  --panel-surface: rgba(255, 255, 255, 0.05);
  --panel-surface-active: rgba(255, 255, 255, 0.15);
  --panel-toggle-hover: var(--panel-surface-active);
  --panel-surface-idle-fill: rgba(255, 255, 255, 0.11);
  --panel-hash: rgba(255, 255, 255, 0.15);
  --panel-handle: #ffffff;
  --panel-label: rgba(255, 255, 255, 0.7);
  --panel-label-active: #ffffff;
  --panel-divider: rgba(255, 255, 255, 0.06);
  --panel-muted-icon: rgba(255, 255, 255, 0.4);
  --panel-swatch-border: rgba(255, 255, 255, 0.2);
  --panel-kbd-bg: rgba(255, 255, 255, 0.1);
  --panel-action-bg: rgba(255, 255, 255, 0.05);
  --panel-action-bg-hover: rgba(255, 255, 255, 0.1);
  --panel-action-text: rgba(255, 255, 255, 0.72);
  --panel-action-text-hover: #ffffff;
  --panel-danger: #f87171;
  --panel-danger-hover: #fca5a5;
  --panel-header-border: rgba(255, 255, 255, 0.096);
  --panel-close-icon: rgba(255, 255, 255, 0.72);
  --panel-close-icon-hover: #ffffff;
  --panel-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
}

[data-panel][data-panel-theme="light"] {
  --panel-bg: rgba(255, 255, 255, 0.95);
  --panel-border: #d1d5db;
  --panel-text: #111827;
  --panel-text-muted: #4b5563;
  --panel-surface: #f3f4f6;
  --panel-surface-active: #d1d5db;
  --panel-toggle-hover: rgba(17, 24, 39, 0.04);
  --panel-surface-idle-fill: #e5e7eb;
  --panel-hash: #d1d5db;
  --panel-handle: #111827;
  --panel-label: #374151;
  --panel-label-active: #111827;
  --panel-divider: #e5e7eb;
  --panel-muted-icon: #9ca3af;
  --panel-swatch-border: #d1d5db;
  --panel-kbd-bg: #e5e7eb;
  --panel-action-bg: #f3f4f6;
  --panel-action-bg-hover: #e5e7eb;
  --panel-action-text: #374151;
  --panel-action-text-hover: #111827;
  --panel-danger: #dc2626;
  --panel-danger-hover: #b91c1c;
  --panel-header-border: #e5e7eb;
  --panel-close-icon: #6b7280;
  --panel-close-icon-hover: #111827;
}

[data-panel],
[data-panel] *,
[data-panel] *::before,
[data-panel] *::after {
  box-sizing: border-box;
}

/* Chrome elements shouldn't be selectable — labels, titles, buttons. Only
   inputs and the prompt code block opt back in via the override below. */
[data-panel] {
  -webkit-user-select: none;
  user-select: none;
}
[data-panel] input,
[data-panel] textarea,
[data-panel] .panel-prompt-pre,
[data-panel] .panel-paste-textarea,
[data-panel] .panel-text-input,
[data-panel] .panel-textarea-input,
[data-panel] .panel-search-input {
  -webkit-user-select: text;
  user-select: text;
}

[data-panel] button:not([class]) {
  background: transparent;
  border: 0;
  padding: 0;
  margin: 0;
  font-family: inherit;
  /* Intentionally NOT inheriting font-size — leaves component classes free to
     set their own without losing to specificity. */
  color: inherit;
  cursor: pointer;
}

/* All panel chrome buttons carry panel-* classes — zero host-app borders
   (Tailwind preflight, browser defaults, etc.) before component styles apply. */
[data-panel] button[class*="panel-"] {
  border: 0;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  box-shadow: none;
}

[data-panel] input,
[data-panel] select,
[data-panel] textarea {
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
  color: inherit;
  border: 0;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  box-shadow: none;
}

[data-panel] input.panel-color-text {
  font-family: inherit;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  color: var(--panel-label);
}

.panel-floating {
  pointer-events: auto;
  position: fixed;
  top: 16px;
  bottom: 16px;
  z-index: 9999;
  display: flex;
  width: 280px;
  flex-direction: column;
  opacity: 1;
  filter: blur(0);
  transition-property: transform, opacity, filter;
  transition-duration: 280ms, 200ms, 200ms;
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1), ease-in, ease-in;
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.panel-floating[data-panel-side="left"] { left: 16px; }
.panel-floating[data-panel-side="right"] { right: 16px; }
.panel-floating[data-panel-collapsed="true"][data-panel-side="left"] { transform: translateX(calc(-100% - 16px)); }
.panel-floating[data-panel-collapsed="true"][data-panel-side="right"] { transform: translateX(calc(100% + 16px)); }
.panel-floating[data-panel-collapsed="true"]:not([data-panel-peek="true"]) {
  opacity: 0;
  filter: blur(4px);
  pointer-events: none;
}

/* Peek preview — a scaled-down sliver slides in when the viewport edge is
   hovered while collapsed. Overrides the fully-hidden collapsed transform. */
.panel-floating[data-panel-collapsed="true"][data-panel-peek="true"] { cursor: pointer; }
.panel-floating[data-panel-collapsed="true"][data-panel-peek="true"][data-panel-side="right"] {
  transform: translateX(calc(100% - 56px)) scale(0.9);
  transform-origin: right center;
  opacity: 1;
  filter: blur(0);
  pointer-events: auto;
}
.panel-floating[data-panel-collapsed="true"][data-panel-peek="true"][data-panel-side="left"] {
  transform: translateX(calc(-100% + 56px)) scale(0.9);
  transform-origin: left center;
  opacity: 1;
  filter: blur(0);
  pointer-events: auto;
}

/* ── Free-float mode ──────────────────────────────────────────────────────
   The drag hook owns left/top inline; the stylesheet stops animating the
   frame so gestures never fight a transition. Collapse hides instantly —
   the hook plays the scale-up entrance when the panel surfaces. */
.panel-floating[data-panel-float="true"] {
  bottom: auto;
  max-height: calc(100dvh - 32px);
  transition: none;
}
.panel-floating[data-panel-float="true"][data-panel-collapsed="true"] {
  display: none;
}
.panel-floating[data-panel-float="true"] .panel-panel-header {
  cursor: grab;
  touch-action: none;
}

/* Invisible resize hit areas, inset so the rounded frame stays clean. */
.panel-resize {
  position: absolute;
  z-index: 1000;
  touch-action: none;
}
.panel-resize-n, .panel-resize-s {
  right: 12px;
  left: 12px;
  height: 5px;
  cursor: ns-resize;
}
.panel-resize-e, .panel-resize-w {
  top: 12px;
  bottom: 12px;
  width: 5px;
  cursor: ew-resize;
}
.panel-resize-n { top: 0; }
.panel-resize-s { bottom: 0; }
.panel-resize-e { right: 0; }
.panel-resize-w { left: 0; }
.panel-resize-ne, .panel-resize-nw, .panel-resize-se, .panel-resize-sw {
  width: 12px;
  height: 12px;
}
.panel-resize-ne { top: 0; right: 0; cursor: nesw-resize; }
.panel-resize-nw { top: 0; left: 0; cursor: nwse-resize; }
.panel-resize-se { right: 0; bottom: 0; cursor: nwse-resize; }
.panel-resize-sw { bottom: 0; left: 0; cursor: nesw-resize; }

/* Hovering an edge handle shows a light pill inside that edge. */
.panel-resize-n::after, .panel-resize-s::after,
.panel-resize-e::after, .panel-resize-w::after {
  content: "";
  position: absolute;
  border-radius: 999px;
  background: var(--panel-text-muted);
  opacity: 0;
  transform: scale(0.4);
  transition:
    opacity 140ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 220ms cubic-bezier(0.35, 1.55, 0.65, 1);
}
.panel-resize-e::after, .panel-resize-w::after {
  top: 50%;
  width: 3px;
  height: 28px;
  margin-top: -14px;
}
.panel-resize-n::after, .panel-resize-s::after {
  left: 50%;
  width: 28px;
  height: 3px;
  margin-left: -14px;
}
.panel-resize-w::after { left: 7px; }
.panel-resize-e::after { right: 7px; }
.panel-resize-n::after { top: 7px; }
.panel-resize-s::after { bottom: 7px; }
.panel-resize-n:hover::after, .panel-resize-s:hover::after,
.panel-resize-e:hover::after, .panel-resize-w:hover::after {
  opacity: 1;
  transform: scale(1);
}

/* Snap hint: a pill OUTSIDE the panel on the side it will dock to, armed
   via data-snap-x / data-snap-y while dragging near a viewport edge. */
.panel-snap-hint {
  pointer-events: none;
  position: absolute;
  z-index: 1001;
  border-radius: 999px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  opacity: 0;
  transition:
    opacity 140ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 220ms cubic-bezier(0.35, 1.55, 0.65, 1);
}
.panel-snap-hint-left, .panel-snap-hint-right {
  top: 50%;
  width: 4px;
  height: 28px;
  transform: translateY(-50%) scale(0.4);
}
.panel-snap-hint-top, .panel-snap-hint-bottom {
  left: 50%;
  width: 28px;
  height: 4px;
  transform: translateX(-50%) scale(0.4);
}
.panel-snap-hint-left { left: -9px; }
.panel-snap-hint-right { right: -9px; }
.panel-snap-hint-top { top: -9px; }
.panel-snap-hint-bottom { bottom: -9px; }
[data-snap-x="left"] .panel-snap-hint-left,
[data-snap-x="right"] .panel-snap-hint-right {
  opacity: 1;
  transform: translateY(-50%) scale(1);
}
[data-snap-y="top"] .panel-snap-hint-top,
[data-snap-y="bottom"] .panel-snap-hint-bottom {
  opacity: 1;
  transform: translateX(-50%) scale(1);
}
@media (prefers-reduced-motion: reduce) {
  .panel-floating { transition: none; }
  .panel-resize::after, .panel-snap-hint { transition: none; }
  .panel-floating[data-panel-collapsed="true"]:not([data-panel-peek="true"]) {
    opacity: 0;
    filter: none;
  }
  .panel-panel,
  .panel-floating[data-panel-collapsed="true"]:not([data-panel-peek="true"]) .panel-panel {
    transition: none;
    opacity: 1;
    transform: none;
  }
}

.panel-panel {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  color: var(--panel-text);
  box-shadow: var(--panel-shadow);
  opacity: 1;
  transform: translateY(0) scale(1);
  transition-property: opacity, transform;
  transition-duration: 220ms;
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}
.panel-floating[data-panel-collapsed="true"]:not([data-panel-peek="true"]) .panel-panel {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
  transition-timing-function: ease-in;
  transition-duration: 180ms;
}

/* Invisible hover/click strip pinned to the viewport edge — reveals the peek
   (and reopens on click) while the panel is collapsed. */
.panel-edge-sensor {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 24px;
  z-index: 9998;
  cursor: pointer;
}
.panel-edge-sensor[data-panel-side="right"] { right: 0; }
.panel-edge-sensor[data-panel-side="left"] { left: 0; }
.panel-edge-sensor[data-panel-inline="true"] { display: none; }

/* Inline panels (ToolShell) use absolute positioning within the overlay. */
.panel-floating[data-panel-inline="true"] {
  position: absolute;
  z-index: 20;
}

/* Transparent click-catcher over the peeking panel — any click opens it fully
   instead of hitting a control in the scaled-down preview. */
.panel-peek-catch {
  position: absolute;
  inset: 0;
  z-index: 3;
  border-radius: 14px;
  background: transparent;
  cursor: pointer;
}

.panel-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--panel-header-border);
  padding: 10px 12px 6px 12px;
}
.panel-panel-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}
.panel-panel-title {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.panel-panel-header-end {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
}
/* Header variant of the toggle group — compact, icon-only, non-growing. */
.panel-toggle-group.panel-theme-toggle {
  width: auto;
  padding: 0;
}
.panel-toggle-group.panel-theme-toggle .panel-toggle-group-track {
  gap: 2px;
  padding: 2px;
}
[data-panel] .panel-toggle-group.panel-theme-toggle .panel-toggle-group-btn {
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  padding: 0;
}
.panel-switcher {
  appearance: none;
  -webkit-appearance: none;
  border: 1px solid var(--panel-border);
  background: var(--panel-surface);
  color: var(--panel-text);
  border-radius: 6px;
  padding: 2px 22px 2px 8px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  cursor: pointer;
  background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%);
  background-position: calc(100% - 11px) 50%, calc(100% - 7px) 50%;
  background-size: 4px 4px, 4px 4px;
  background-repeat: no-repeat;
  max-width: 110px;
  text-overflow: ellipsis;
  overflow: hidden;
}
.panel-switcher:focus { outline: 2px solid var(--panel-handle); outline-offset: 1px; }

.panel-close-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  color: var(--panel-close-icon);
  transition-property: color, scale;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}
.panel-close-btn::before {
  content: "";
  position: absolute;
  inset: -10px;
}
.panel-close-btn:active {
  scale: 0.96;
}
.panel-close-btn:hover { color: var(--panel-close-icon-hover); }
.panel-close-btn svg { width: 16px; height: 16px; }

.panel-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.panel-panel-body::-webkit-scrollbar { display: none; }

.panel-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 8px;
}

/* Animation transport — pinned at the top of the panel body. */
.panel-animation {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 10px;
  margin-bottom: 2px;
  border-bottom: 1px solid var(--panel-divider);
}
.panel-animation-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--panel-text-muted);
  padding: 0 2px;
}
.panel-animation-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
[data-panel] .panel-animation-btn {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--panel-action-text);
  background: var(--panel-action-bg);
  transition: background-color 150ms ease, color 150ms ease;
}
[data-panel] .panel-animation-btn svg {
  width: 14px;
  height: 14px;
}
[data-panel] .panel-animation-btn:hover {
  background: var(--panel-action-bg-hover);
  color: var(--panel-action-text-hover);
}
[data-panel] .panel-animation-btn-primary {
  width: 36px;
  background: var(--panel-surface-active);
  color: var(--panel-label-active);
}
[data-panel] .panel-animation-btn-primary:hover {
  background: var(--panel-handle);
  color: #ffffff;
}
[data-panel] .panel-animation-btn-reset {
  margin-left: auto;
}
.panel-animation-time {
  flex: 1;
  min-width: 0;
  padding: 0 6px;
  font-family: inherit;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--panel-text-muted);
  text-align: center;
}

.panel-shortcut-hint {
  font-size: 12px;
  color: var(--panel-text-muted);
}
.panel-shortcut-hint kbd {
  border-radius: 4px;
  padding: 0 4px;
  font-family: inherit;
  background: var(--panel-kbd-bg);
}

.panel-actions {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 1px solid var(--panel-divider);
  padding-top: 12px;
}

.panel-export-format-row {
  display: flex;
  gap: 6px;
}
.panel-export-format-row .panel-action-btn {
  flex: 1;
  min-width: 0;
}

/* Scoped under [data-panel] to beat the global button reset on
   specificity — otherwise the always-on light gray fill loses. */
[data-panel] .panel-action-btn {
  width: 100%;
  height: 36px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  background: var(--panel-action-bg);
  color: var(--panel-action-text);
  transition-property: background-color, color, scale;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}
[data-panel] .panel-action-btn:active:not(:disabled) {
  scale: 0.96;
}
[data-panel] .panel-action-btn:hover:not(.panel-action-btn-primary):not(:disabled) {
  background: var(--panel-action-bg-hover);
  color: var(--panel-action-text-hover);
}
[data-panel] .panel-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
[data-panel] .panel-action-btn-primary {
  background: var(--panel-handle);
  color: var(--panel-bg);
  border-color: transparent;
}
[data-panel] .panel-action-btn-primary:hover:not(:disabled) {
  background: var(--panel-handle);
  filter: brightness(1.08);
  color: var(--panel-bg);
}
[data-panel] .panel-action-btn-destructive {
  background: color-mix(in srgb, var(--panel-danger) 10%, var(--panel-action-bg));
  color: var(--panel-danger);
}
[data-panel] .panel-action-btn-destructive:hover:not(:disabled) {
  background: color-mix(in srgb, var(--panel-danger) 16%, var(--panel-action-bg-hover));
  color: var(--panel-danger-hover);
}

.panel-action-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.panel-action-group .panel-action-field {
  min-width: 0;
}
.panel-action-group .panel-action-btn {
  width: 100%;
  padding-left: 8px;
  padding-right: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.panel-action-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.panel-status {
  padding: 0 4px;
  font-size: 12px;
  color: var(--panel-text-muted);
}

/* Export group — pinned at the top of the actions block, separated from the
   JSON/reset buttons by a hairline divider. */
.panel-export {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 12px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--panel-divider);
}
.panel-export-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--panel-text-muted);
  padding: 0 2px;
}
.panel-export-row {
  display: flex;
  gap: 6px;
}
.panel-export-row .panel-action-btn {
  flex: 1;
}
.panel-export-hint {
  font-size: 11px;
  line-height: 1.35;
  color: var(--panel-text-muted);
  padding: 0 2px;
}
.panel-export-gif {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px solid var(--panel-divider);
}
.panel-export-gif-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--panel-text-muted);
  padding: 0 2px;
}
.panel-export-gif-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 3px;
  border-radius: 8px;
  background: var(--panel-surface);
}
[data-panel] .panel-export-gif-row .panel-export-res-btn {
  flex: 1 1 0;
  min-width: 0;
}

/* Segmented resolution selector for the hi-res PNG. */
.panel-export-res-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.panel-export-res {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 3px;
  border-radius: 8px;
  background: var(--panel-surface);
}
[data-panel] .panel-export-res-screen .panel-export-res-btn,
[data-panel] .panel-export-res-print .panel-export-res-btn {
  flex: 1 1 0;
  min-width: 0;
}
[data-panel] .panel-export-res-btn {
  min-width: 2.75rem;
  height: 26px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  color: var(--panel-text-muted);
  transition: background-color 150ms ease, color 150ms ease;
}
[data-panel] .panel-export-res-btn:hover {
  color: var(--panel-action-text-hover);
}
[data-panel] .panel-export-res-active,
[data-panel] .panel-export-res-active:hover {
  background: var(--panel-surface-active);
  color: var(--panel-label-active);
}
[data-panel] .panel-export-rec,
[data-panel] .panel-export-rec:hover {
  background: #e5484d;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.panel-export-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #ffffff;
  animation: panel-export-pulse 1s ease-in-out infinite;
}
@keyframes panel-export-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}
@media (prefers-reduced-motion: reduce) {
  .panel-export-dot { animation: none; }
}

/* Auto-height animation via CSS Grid: parent transitions
   grid-template-rows between 0fr and 1fr, child clips overflow. */
.panel-collapse {
  display: grid;
  grid-template-rows: 0fr;
  overflow: hidden;
  transition: grid-template-rows 280ms cubic-bezier(0.32, 0.72, 0, 1);
}
.panel-collapse[data-panel-open="true"] {
  grid-template-rows: 1fr;
  overflow: visible;
}
.panel-collapse-inner {
  /* Vertical clipping only — height animation still collapses, but horizontal
     overshoot (slider overscroll spring, toggle row full-bleed hover) is not
     cropped. inset(-16px 0) regressed toggle hovers (white side gutters). */
  clip-path: inset(0 -9999px);
  min-height: 0;
  min-width: 0;
  opacity: 0;
  transition: opacity 200ms ease;
}
.panel-collapse[data-panel-open="true"] > .panel-collapse-inner {
  opacity: 1;
  transition: opacity 200ms ease 80ms;
}

.panel-saved-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 4px 4px 2px;
  font-size: 11px;
  font-weight: 500;
  color: var(--panel-text-muted);
}
.panel-saved-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 2px color-mix(in srgb, #22c55e 20%, transparent);
  flex-shrink: 0;
}

.panel-paste {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0;
}
/* Scoped under [data-panel] to beat the global textarea reset on
   specificity — otherwise the explicit small font-size loses. */
[data-panel] .panel-paste-textarea {
  width: 100%;
  min-height: 96px;
  resize: vertical;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--panel-bg);
  color: var(--panel-text);
  border: 1px solid var(--panel-border);
  font-family: inherit;
  font-size: 10px;
  line-height: 1.5;
  outline: none;
  transition: border-color 150ms ease;
}
[data-panel] .panel-paste-textarea:focus {
  border-color: var(--panel-handle);
}
[data-panel] .panel-paste-textarea::placeholder {
  color: var(--panel-muted-icon);
}
.panel-paste-error {
  padding: 0 4px;
  font-size: 11px;
  color: #ef4444;
}

.panel-empty {
  pointer-events: auto;
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9998;
  max-width: 280px;
  border-radius: 8px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  color: var(--panel-text-muted);
  padding: 12px;
  font-size: 13px;
  box-shadow: var(--panel-shadow);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
.panel-empty-close {
  margin-top: 8px;
  display: block;
  width: 100%;
  border-radius: 8px;
  padding: 8px 12px;
  background: var(--panel-action-bg);
  color: var(--panel-text);
  font-size: 13px;
}
.panel-empty-close:hover { background: var(--panel-action-bg-hover); }

.panel-section {
  border-top: 1px solid var(--panel-divider);
}
.panel-section:first-child { border-top: 0; }
.panel-section-header {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 4px;
  padding: 12px 0 8px;
}
.panel-section:first-child .panel-section-header { padding-top: 2px; }
.panel-section-button {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  height: 20px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--panel-text-muted);
  text-align: left;
}
.panel-section-button:hover { color: var(--panel-label-active); }
.panel-section-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.panel-section-caret-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  color: var(--panel-muted-icon);
  flex-shrink: 0;
  transition: color 150ms ease, background-color 150ms ease;
}
.panel-section-caret-btn:hover { color: var(--panel-label-active); background: var(--panel-surface); }
.panel-section-caret {
  width: 12px;
  height: 12px;
  transition: transform 200ms ease;
}
.panel-section[data-panel-open="true"] .panel-section-caret { transform: rotate(180deg); }
.panel-section-reset {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  color: var(--panel-muted-icon);
  opacity: 0;
  transition: opacity 150ms ease, color 150ms ease, background-color 150ms ease;
  flex-shrink: 0;
}
.panel-section-reset svg { width: 12px; height: 12px; }
.panel-section-header:hover .panel-section-reset,
.panel-section-reset:focus-visible { opacity: 1; }
.panel-section-reset:hover {
  color: var(--panel-label-active);
  background: var(--panel-surface);
}
.panel-section-children {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 10px;
  overflow: visible;
}

.panel-field {
  min-width: 0;
  overflow: visible;
}

.panel-field-description {
  font-size: 10.5px;
  line-height: 1.35;
  color: var(--panel-label-muted);
  padding: 4px 4px 2px;
  letter-spacing: 0.01em;
}

[data-panel] .panel-slider {
  position: relative;
  height: 36px;
  width: 100%;
  margin: 0;
  overflow: visible;
  transition: transform 220ms cubic-bezier(0.34, 1.16, 0.64, 1);
}
[data-panel] .panel-slider[data-panel-state="hover"] { transform: scale(1.01); }
[data-panel] .panel-slider[data-panel-state="drag"] { transform: scale(1.018); }

.panel-slider-overscroll {
  position: absolute;
  inset: 0;
  transform: scaleX(var(--panel-os-scale, 1));
  transform-origin: var(--panel-os-origin, 50% 50%);
}
.panel-slider-overscroll[data-panel-release="true"] {
  transition: transform 320ms cubic-bezier(0.34, 1.16, 0.64, 1);
}
@media (prefers-reduced-motion: reduce) {
  .panel-slider-overscroll[data-panel-release="true"] { transition: none; }
  [data-panel] .panel-slider { transition: none; }
}

.panel-slider-track {
  position: absolute;
  inset: 0;
  cursor: pointer;
  user-select: none;
  overflow: hidden;
  touch-action: none;
  border-radius: 8px;
  background: var(--panel-surface);
}

.panel-slider-hash-row {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.panel-slider-hash {
  position: absolute;
  top: 50%;
  height: 8px;
  width: 1px;
  transform: translateY(-50%);
  border-radius: 999px;
  background: transparent;
  transition: background-color 200ms ease;
}
.panel-slider[data-panel-state="hover"] .panel-slider-hash,
.panel-slider[data-panel-state="drag"] .panel-slider-hash { background: var(--panel-hash); }

.panel-slider-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: var(--panel-fill-pct, 0%);
  pointer-events: none;
  background: var(--panel-surface-idle-fill);
  transition: background-color 150ms ease, width 220ms cubic-bezier(0.2, 0, 0, 1);
}
.panel-slider[data-panel-state="drag"] .panel-slider-fill {
  transition: background-color 150ms ease, width 0ms;
  background: var(--panel-surface-active);
}
.panel-slider[data-panel-state="hover"] .panel-slider-fill { background: var(--panel-surface-active); }

.panel-slider-handle {
  position: absolute;
  top: 50%;
  height: 20px;
  width: 3px;
  left: var(--panel-handle-left, 0%);
  border-radius: 999px;
  pointer-events: none;
  background: var(--panel-handle);
  opacity: 0;
  transform: translate(-1.5px, -50%) scaleY(1);
  transform-origin: center center;
  transition:
    opacity 200ms cubic-bezier(0.32, 0.72, 0, 1),
    transform 200ms cubic-bezier(0.32, 0.72, 0, 1),
    left 220ms cubic-bezier(0.2, 0, 0, 1);
}
.panel-slider[data-panel-state="hover"] .panel-slider-handle { opacity: 0.5; }
.panel-slider[data-panel-state="drag"] .panel-slider-handle {
  opacity: 0.9;
  transform: translate(-1.5px, -50%) scaleY(1.3);
  transition:
    opacity 200ms cubic-bezier(0.32, 0.72, 0, 1),
    transform 200ms cubic-bezier(0.32, 0.72, 0, 1),
    left 0ms;
}

.panel-slider-label {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--panel-label);
}
.panel-slider-value {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-family: inherit;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  font-weight: 500;
  color: var(--panel-label);
  transition: color 150ms ease;
}
.panel-slider[data-panel-state="hover"] .panel-slider-value,
.panel-slider[data-panel-state="drag"] .panel-slider-value { color: var(--panel-label-active); }

.panel-color {
  display: flex;
  height: 36px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 8px;
  padding: 0 12px;
  background: var(--panel-surface);
}
.panel-color-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--panel-label);
}
.panel-color-right {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}
.panel-color-text {
  width: 7ch;
  background: transparent;
  border: 0;
  outline: 0;
  text-align: right;
  font-family: inherit;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  font-weight: 500;
  color: var(--panel-label);
  text-transform: uppercase;
}
.panel-color-swatch {
  height: 20px;
  width: 20px;
  flex-shrink: 0;
  border-radius: 4px;
  border: 1px solid var(--panel-swatch-border);
  transition: transform 150ms ease;
}
.panel-color-swatch:hover { transform: scale(1.1); }
/* Sized + positioned over the swatch (not 0x0) so showPicker()/click() has a
   real anchor rect — pickers anchor to the input's position. */
.panel-color-native {
  position: absolute;
  right: 0;
  top: 50%;
  margin-top: -10px;
  height: 20px;
  width: 20px;
  opacity: 0;
  pointer-events: none;
}

.panel-path {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.panel-path-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.panel-path-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--panel-label);
}
.panel-path-head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.panel-path-count {
  font-size: 11px;
  color: var(--panel-muted-icon);
  font-family: inherit;
  font-variant-numeric: tabular-nums;
}
[data-panel] .panel-path-clear {
  font-size: 11px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid var(--panel-border);
  background: var(--panel-action-bg);
  color: var(--panel-action-text);
  cursor: pointer;
  transition: background-color 150ms cubic-bezier(0.22, 1, 0.36, 1);
}
[data-panel] .panel-path-clear:hover {
  background: var(--panel-action-bg-hover);
  color: var(--panel-action-text-hover);
}
.panel-path-pad {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  border: 1px solid var(--panel-border);
  background: var(--panel-surface);
  touch-action: none;
  cursor: crosshair;
  overflow: visible;
}
.panel-path-bg {
  fill: transparent;
  cursor: crosshair;
}
.panel-path-grid {
  stroke: var(--panel-divider);
  stroke-width: 0.5;
}
.panel-path-frame {
  fill: none;
  stroke: var(--panel-border);
  stroke-width: 0.5;
}
.panel-path-line {
  fill: none;
  stroke: var(--panel-handle);
  stroke-width: 1;
  stroke-linejoin: round;
  stroke-linecap: round;
  opacity: 0.55;
}
.panel-path-line-close {
  stroke: var(--panel-handle);
  stroke-width: 0.8;
  stroke-dasharray: 2 2;
  opacity: 0.3;
}
.panel-path-anchor circle {
  fill: none;
  stroke: var(--panel-handle);
  stroke-width: 1;
  opacity: 0.7;
}
.panel-path-anchor.is-draggable {
  cursor: grab;
}
.panel-path-anchor.is-draggable .panel-path-point-hit {
  cursor: grab;
}
.panel-path-anchor.is-draggable:active {
  cursor: grabbing;
}
.panel-path-anchor.is-selected circle:not(.panel-path-point-hit) {
  stroke-width: 1.4;
  opacity: 1;
}
.panel-path-anchor .panel-path-anchor-dot {
  fill: var(--panel-handle);
  stroke: none;
  opacity: 0.9;
}
.panel-path-point {
  cursor: grab;
}
.panel-path-point:active {
  cursor: grabbing;
}
.panel-path-point-hit {
  fill: transparent;
}
.panel-path-point-ring {
  fill: var(--panel-bg);
  stroke: var(--panel-handle);
  stroke-width: 1.2;
  transition: r 120ms cubic-bezier(0.22, 1, 0.36, 1);
}
.panel-path-point.is-selected .panel-path-point-ring {
  fill: var(--panel-handle);
}
.panel-path-point-num {
  fill: var(--panel-label);
  font-size: 3.4px;
  font-family: inherit;
  font-variant-numeric: tabular-nums;
  text-anchor: middle;
  pointer-events: none;
  user-select: none;
}
.panel-path-point.is-selected .panel-path-point-num {
  fill: var(--panel-bg);
}
.panel-path-selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  color: var(--panel-text-muted);
  font-family: inherit;
  font-variant-numeric: tabular-nums;
}
[data-panel] .panel-path-remove {
  font-size: 11px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid var(--panel-border);
  background: var(--panel-action-bg);
  color: var(--panel-action-text);
  cursor: pointer;
  transition: background-color 150ms cubic-bezier(0.22, 1, 0.36, 1);
}
[data-panel] .panel-path-remove:hover {
  background: var(--panel-action-bg-hover);
  color: var(--panel-action-text-hover);
}
.panel-path-hint {
  font-size: 10.5px;
  color: var(--panel-muted-icon);
  text-align: center;
}

.panel-image {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.panel-image-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.panel-image-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--panel-label);
}
.panel-image-upload {
  font-size: 11px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 6px;
  border: 1px solid var(--panel-border);
  background: var(--panel-action-bg);
  color: var(--panel-action-text);
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease;
}
.panel-image-upload:hover {
  background: var(--panel-action-bg-hover);
  color: var(--panel-action-text-hover);
}
.panel-image-frame {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 48px;
  border-radius: 8px;
  border: 1px solid var(--panel-border);
  background: var(--panel-surface);
  overflow: hidden;
  transition: border-color 150ms ease, background-color 150ms ease;
}
.panel-image-frame[data-panel-interactive="true"] { cursor: pointer; }
.panel-image-frame[data-panel-interactive="true"]:hover,
.panel-image-frame[data-panel-drag="true"] {
  border-color: var(--panel-handle);
  background: var(--panel-surface-active);
}
.panel-image-preview {
  display: block;
  width: 75%;
  height: auto;
  border-radius: 4px;
}
.panel-image-empty {
  font-size: 11px;
  color: var(--panel-muted-icon);
  padding: 14px 0;
}
.panel-image-native {
  position: absolute;
  height: 0;
  width: 0;
  opacity: 0;
  pointer-events: none;
}

/* Scoped under [data-panel] so it beats the global button reset
   (which zeroes padding/background). The negative margin + matching padding
   full-bleeds the hover highlight ~8px past the label on each side, so the
   label stays aligned with the other rows but the highlight never touches its
   left edge. */
[data-panel] .panel-toggle {
  display: flex;
  height: 36px;
  width: calc(100% + 16px);
  margin: 0 -8px;
  align-items: center;
  justify-content: space-between;
  border-radius: 8px;
  padding: 0 8px;
  background: transparent;
  transition: background-color 150ms cubic-bezier(0.22, 1, 0.36, 1);
}
[data-panel] .panel-toggle:hover { background: var(--panel-toggle-hover); }
.panel-toggle-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--panel-label);
}
.panel-toggle-track {
  position: relative;
  width: 28px;
  height: 16px;
  border-radius: 999px;
  background: var(--panel-surface-idle-fill);
  transition: background-color 200ms cubic-bezier(0.32, 0.72, 0, 1);
  flex-shrink: 0;
}
.panel-toggle[data-panel-on="true"] .panel-toggle-track {
  background: var(--panel-handle);
}
.panel-toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--panel-bg);
  transition: transform 220ms cubic-bezier(0.34, 1.16, 0.64, 1);
}
.panel-toggle[data-panel-on="false"] .panel-toggle-thumb {
  background: var(--panel-handle);
}
.panel-toggle[data-panel-on="true"] .panel-toggle-thumb {
  transform: translateX(12px);
}

/* Segmented single-select — optional label, then option buttons sharing a
   surface track. Selected uses the panel surface tokens, not a heavy fill. */
.panel-toggle-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 4px 0;
}
.panel-toggle-group-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--panel-label);
  line-height: 1.35;
  padding: 0 2px;
}
.panel-toggle-group-track {
  display: flex;
  align-items: stretch;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  background: var(--panel-surface);
}
[data-panel] .panel-toggle-group-btn {
  display: inline-flex;
  flex: 1 1 0;
  min-width: 0;
  height: 28px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 6px;
  padding: 0 10px;
  color: var(--panel-text-muted);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: color 150ms cubic-bezier(0.22, 1, 0.36, 1),
    background-color 150ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 150ms cubic-bezier(0.22, 1, 0.36, 1);
}
.panel-toggle-group-icon {
  display: inline-flex;
  flex-shrink: 0;
}
.panel-toggle-group-icon svg {
  width: 14px;
  height: 14px;
  display: block;
}
.panel-toggle-group-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
[data-panel] .panel-toggle-group-btn:hover {
  color: var(--panel-action-text-hover);
  background: var(--panel-toggle-hover);
}
[data-panel] .panel-toggle-group-btn:focus-visible {
  outline: 2px solid var(--panel-handle);
  outline-offset: -2px;
}
[data-panel] .panel-toggle-group-btn[data-panel-active="true"] {
  background: var(--panel-surface-active);
  color: var(--panel-label-active);
}
[data-panel] .panel-toggle-group-btn:active { transform: scale(0.98); }
@media (prefers-reduced-motion: reduce) {
  [data-panel] .panel-toggle-group-btn { transition: none; }
  [data-panel] .panel-toggle-group-btn:active { transform: none; }
}

.panel-select {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: transparent;
}
.panel-select[data-panel-layout="inline"] {
  min-height: 36px;
  height: 36px;
  border-radius: 8px;
  padding: 0 12px;
  background: var(--panel-surface);
  transition: background-color 150ms cubic-bezier(0.22, 1, 0.36, 1);
}
[data-panel] .panel-select[data-panel-layout="inline"]:hover {
  background: var(--panel-surface-active);
}
.panel-select[data-panel-layout="stacked"] {
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  min-height: 0;
  height: auto;
  padding: 0;
  background: transparent;
}
.panel-select-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--panel-label);
  min-width: 0;
  line-height: 1.35;
}
.panel-select[data-panel-layout="stacked"] .panel-select-label {
  white-space: normal;
}
.panel-select[data-panel-layout="inline"] .panel-select-label {
  flex: 1 1 auto;
  white-space: normal;
}
[data-panel] .panel-select-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-shrink: 0;
  border: 0;
  outline: 0;
  background: var(--panel-surface);
  color: var(--panel-label);
  font-family: inherit;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  font-weight: 500;
  line-height: normal;
  cursor: pointer;
  height: 36px;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  overflow: visible;
  transition: color 150ms cubic-bezier(0.22, 1, 0.36, 1),
    background-color 150ms cubic-bezier(0.22, 1, 0.36, 1);
}
.panel-select[data-panel-layout="stacked"] .panel-select-btn {
  align-self: stretch;
  width: 100%;
  max-width: none;
  justify-content: space-between;
}
.panel-select[data-panel-layout="inline"] .panel-select-btn {
  align-self: center;
  flex: 1 1 auto;
  max-width: none;
  height: 100%;
  justify-content: flex-end;
  padding: 0;
  background: transparent;
  border-radius: 0;
}
.panel-select[data-panel-layout="inline"] .panel-select-btn:hover,
.panel-select[data-panel-layout="inline"] .panel-select-btn:focus-visible {
  background: transparent;
}
/* Ellipsis horizontally only — vertical overflow clips descenders in custom fonts. */
.panel-select-value {
  min-width: 0;
  overflow-x: hidden;
  overflow-y: visible;
  white-space: nowrap;
  text-overflow: ellipsis;
  line-height: 1.35;
}
[data-panel] .panel-select-btn:hover {
  color: var(--panel-label-active);
  background: var(--panel-surface-active);
}
[data-panel] .panel-select-btn:focus-visible {
  color: var(--panel-label-active);
  background: var(--panel-surface-active);
  outline: 2px solid var(--panel-handle);
  outline-offset: 1px;
}
[data-panel] .panel-select-btn:active { transform: none; }
.panel-select[data-panel-layout="stacked"] .panel-select-btn:active {
  transform: none;
}
.panel-select-chevron {
  width: 14px;
  height: 14px;
  opacity: 0.6;
  flex-shrink: 0;
}
.panel-select-layer {
  position: fixed;
  inset: 0;
  z-index: 10000;
  pointer-events: none;
}
.panel-select-menu {
  pointer-events: auto;
  overflow-y: auto;
  padding: 4px;
  border-radius: 10px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.2);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  animation: panel-menu-in 160ms cubic-bezier(0.22, 1, 0.36, 1);
}
.panel-select-menu[data-panel-up="true"] {
  animation-name: panel-menu-in-up;
}
@keyframes panel-menu-in {
  from {
    opacity: 0;
    transform: translate(-100%, 0) translateY(-4px);
    filter: blur(2px);
  }
  to {
    opacity: 1;
    transform: translate(-100%, 0) translateY(0);
    filter: blur(0);
  }
}
@keyframes panel-menu-in-up {
  from {
    opacity: 0;
    transform: translate(-100%, -100%) translateY(4px);
    filter: blur(2px);
  }
  to {
    opacity: 1;
    transform: translate(-100%, -100%) translateY(0);
    filter: blur(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .panel-select-menu { animation: none; }
}
[data-panel] .panel-select-option {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 0;
  background: transparent;
  color: var(--panel-label);
  font-family: inherit;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  text-align: left;
  white-space: nowrap;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 120ms cubic-bezier(0.22, 1, 0.36, 1),
    color 120ms cubic-bezier(0.22, 1, 0.36, 1);
}
[data-panel] .panel-select-option[data-panel-active="true"] {
  background: var(--panel-surface-active);
  color: var(--panel-label-active);
}
[data-panel] .panel-select-option[aria-selected="true"] {
  color: var(--panel-text);
}
.panel-select-check {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  opacity: 0.9;
}

.panel-prompt {
  display: flex;
  flex-direction: column;
}
/* Bumped under [data-panel] so it ties the button reset on specificity
   and wins on source order — the reset sets padding: 0 globally. */
[data-panel] .panel-prompt-toggle {
  display: flex;
  height: 36px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 12px;
  border-radius: 8px;
  background: var(--panel-surface);
  color: var(--panel-label);
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  transition: color 150ms ease;
}
[data-panel] .panel-prompt-toggle:hover,
.panel-prompt[data-panel-open="true"] .panel-prompt-toggle {
  color: var(--panel-label-active);
}
.panel-prompt-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.panel-prompt-caret {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  color: var(--panel-muted-icon);
  transition: transform 200ms ease;
}
.panel-prompt[data-panel-open="true"] .panel-prompt-caret { transform: rotate(180deg); }

.panel-prompt-preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px 0 2px;
}
.panel-prompt-desc {
  font-size: 11px;
  color: var(--panel-text-muted);
  line-height: 1.4;
  padding: 0 4px;
}
.panel-prompt-code-wrap {
  position: relative;
}
.panel-prompt-pre {
  margin: 0;
  padding: 10px 12px 22px;
  background: var(--panel-bg);
  color: var(--panel-text);
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  font-family: inherit;
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 140px;
  overflow-y: auto;
  scrollbar-width: thin;
  -webkit-mask-image: linear-gradient(to bottom, black calc(100% - 22px), transparent);
  mask-image: linear-gradient(to bottom, black calc(100% - 22px), transparent);
}
.panel-prompt-pre::-webkit-scrollbar { width: 6px; }
.panel-prompt-pre::-webkit-scrollbar-thumb { background: var(--panel-surface-active); border-radius: 999px; }
/* Scoped under [data-panel] to beat the global button reset
   (background: transparent) on specificity — otherwise the button is
   transparent and the prompt text shows through behind the icon. The text
   field (--panel-bg) is ~95% opaque, so stack two copies → ~99.8% opaque, same hue. */
[data-panel] .panel-prompt-copy {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(var(--panel-bg), var(--panel-bg)),
    linear-gradient(var(--panel-bg), var(--panel-bg));
  color: var(--panel-label);
  border: 1px solid var(--panel-border);
  transition: color 150ms ease, transform 200ms cubic-bezier(0.34, 1.16, 0.64, 1);
}
.panel-prompt-copy svg { width: 14px; height: 14px; }
[data-panel] .panel-prompt-copy:hover {
  /* Subtle surface tint over the opaque base. */
  background:
    linear-gradient(var(--panel-surface), var(--panel-surface)),
    linear-gradient(var(--panel-bg), var(--panel-bg)),
    linear-gradient(var(--panel-bg), var(--panel-bg));
  color: var(--panel-label-active);
  transform: scale(1.05);
}

.panel-vec2 {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.panel-vec2-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--panel-label);
  padding: 0 12px;
}
.panel-vec2-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

/* ── Preset selector ──────────────────────────────────────────────────────── */
.panel-presets {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 12px 2px;
}
.panel-presets-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--panel-label);
}
[data-panel] .panel-preset-select {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  height: 36px;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  padding: 0 28px 0 12px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  color: var(--panel-label);
  background:
    linear-gradient(45deg, transparent 50%, var(--panel-muted-icon) 50%),
    linear-gradient(135deg, var(--panel-muted-icon) 50%, transparent 50%),
    var(--panel-surface);
  background-position: calc(100% - 14px) 50%, calc(100% - 10px) 50%, 0 0;
  background-size: 4px 4px, 4px 4px, auto;
  background-repeat: no-repeat;
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease;
}
[data-panel] .panel-preset-select:hover {
  color: var(--panel-label-active);
  background-color: var(--panel-surface-active);
}
[data-panel] .panel-preset-select:focus-visible {
  outline: 2px solid var(--panel-handle);
  outline-offset: 1px;
}

/* ── ToolShell layout ───────────────────────────────────────────────────── */
.panel-tool-shell {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.panel-tool-viewport {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.panel-tool-overlay {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 20;
  transition: opacity 500ms ease;
}
.panel-tool-overlay[data-panel-ui-visible="false"] {
  opacity: 0;
}
.panel-tool-topbar {
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  padding-bottom: 16px;
  transition: padding 300ms ease;
}
.panel-tool-topbar > * {
  pointer-events: auto;
}
.panel-tool-panels {
  pointer-events: none;
  position: absolute;
  inset: 0;
}

.panel-panel-toggle {
  pointer-events: auto;
  position: absolute;
  bottom: 20px;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  color: var(--panel-text-muted);
  box-shadow: var(--panel-shadow);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: left 300ms ease, right 300ms ease, background 150ms ease, color 150ms ease;
}
.panel-panel-toggle:hover {
  background: var(--panel-surface);
  color: var(--panel-text);
}
.panel-panel-toggle-icon {
  width: 16px;
  height: 16px;
  transition: transform 300ms ease;
}

/* ── Canvas overlay projector (OFF-138) ──────────────────────────────────── */
/* A single layer pinned over the canvas. Click-through by default so it never
   eats canvas pointer events; individual overlay items opt back in if needed.
   overflow: visible so items projected near the edges are not clipped. */
.panel-overlay-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: visible;
}
/* Each projected node. Positioned via transform only (translate → the screen
   point, then -50%/-50% to center). will-change hints the compositor; no
   layout-thrashing properties are ever written. */
.panel-overlay-item {
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform;
}

.panel-eye-toggle {
  pointer-events: auto;
  position: absolute;
  bottom: 20px;
  left: 50%;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  color: var(--panel-text-muted);
  box-shadow: var(--panel-shadow);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transform: translateX(-50%);
  transition: background 150ms ease, color 500ms ease, opacity 500ms ease;
}
.panel-eye-toggle[data-panel-visible="false"] {
  color: color-mix(in srgb, var(--panel-text-muted) 30%, transparent);
}
.panel-eye-toggle:hover {
  background: var(--panel-surface);
  color: var(--panel-text);
}
.panel-eye-toggle svg {
  width: 16px;
  height: 16px;
}

/* ── Disclosure rows (POI / caption editors) ─────────────────────────────── */
.panel-disclosure {
  display: flex;
  flex-direction: column;
}
.panel-disclosure[data-panel-open="true"] {
  margin-bottom: 10px;
}
.panel-disclosure[data-panel-dimmed="true"] {
  opacity: 0.38;
  pointer-events: none;
}
.panel-disclosure[data-panel-highlight="true"] .panel-disclosure-toggle {
  box-shadow: inset 0 0 0 1px var(--panel-handle);
  color: var(--panel-label-active);
}
[data-panel] .panel-disclosure-toggle {
  display: flex;
  height: 36px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 12px;
  border-radius: 8px;
  background: var(--panel-surface);
  color: var(--panel-label);
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  transition: color 150ms ease, background-color 150ms ease;
}
[data-panel] .panel-disclosure-toggle:hover,
.panel-disclosure[data-panel-open="true"] .panel-disclosure-toggle {
  color: var(--panel-label-active);
  background: var(--panel-surface-active);
}
.panel-disclosure-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.panel-disclosure-caret {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  color: var(--panel-muted-icon);
  transition: transform 200ms ease;
}
.panel-disclosure[data-panel-open="true"] .panel-disclosure-caret {
  transform: rotate(180deg);
}
.panel-disclosure-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px 0 14px;
}
/* Nested editors — damp hover scale so sliders don't spill past inset padding. */
[data-panel] .panel-disclosure-body .panel-slider,
[data-panel] .panel-vec2-row .panel-slider {
  width: 100%;
  margin: 0;
}
[data-panel] .panel-disclosure-body .panel-slider[data-panel-state="hover"],
[data-panel] .panel-vec2-row .panel-slider[data-panel-state="hover"] {
  transform: none;
}
[data-panel] .panel-disclosure-body .panel-slider[data-panel-state="drag"],
[data-panel] .panel-vec2-row .panel-slider[data-panel-state="drag"] {
  transform: scale(1.008);
}
[data-panel] .panel-disclosure-body .panel-toggle {
  width: 100%;
  margin: 0;
}

/* ── Collection ──────────────────────────────────────────────────────────── */
.panel-collection {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.panel-collection-header {
  display: flex;
  height: 36px;
  align-items: center;
  gap: 8px;
}
.panel-collection-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--panel-label);
}
.panel-collection-count {
  display: inline-flex;
  min-width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--panel-surface);
  font-size: 11px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--panel-text-muted);
}
[data-panel] .panel-collection-add {
  margin-left: auto;
  height: 28px;
  padding: 0 12px;
  border-radius: 8px;
  background: var(--panel-action-bg);
  color: var(--panel-action-text);
  font-size: 12px;
  font-weight: 500;
  transition: background-color 150ms cubic-bezier(0.22, 1, 0.36, 1),
    color 150ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 120ms cubic-bezier(0.22, 1, 0.36, 1);
}
[data-panel] .panel-collection-add:hover:not(:disabled) {
  background: var(--panel-action-bg-hover);
  color: var(--panel-action-text-hover);
}
[data-panel] .panel-collection-add:active:not(:disabled) {
  transform: scale(0.98);
}
[data-panel] .panel-collection-add:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.panel-collection-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.panel-collection-empty {
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--panel-surface);
  font-size: 11px;
  color: var(--panel-text-muted);
}
.panel-collection-row {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  transition: opacity 150ms cubic-bezier(0.22, 1, 0.36, 1);
}
.panel-collection-row[data-panel-dragging="true"] {
  opacity: 0.5;
}
.panel-collection-row[data-panel-dragover="true"] {
  box-shadow: inset 0 0 0 1px var(--panel-handle);
}
.panel-collection-row-head {
  display: flex;
  height: 36px;
  align-items: center;
  gap: 4px;
  border-radius: 8px;
  background: var(--panel-surface);
  padding: 0 4px 0 6px;
  transition: background-color 150ms cubic-bezier(0.22, 1, 0.36, 1);
}
.panel-collection-row[data-panel-open="true"] .panel-collection-row-head {
  background: var(--panel-surface-active);
}
.panel-collection-drag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: var(--panel-muted-icon);
  cursor: grab;
}
.panel-collection-drag:active {
  cursor: grabbing;
}
.panel-collection-drag svg {
  width: 14px;
  height: 14px;
}
[data-panel] .panel-collection-row-toggle {
  display: flex;
  flex: 1;
  min-width: 0;
  height: 36px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 4px;
  background: transparent;
  color: var(--panel-label);
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  transition: color 150ms cubic-bezier(0.22, 1, 0.36, 1);
}
[data-panel] .panel-collection-row-toggle:hover,
.panel-collection-row[data-panel-open="true"] .panel-collection-row-toggle {
  color: var(--panel-label-active);
}
.panel-collection-row-label {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.panel-collection-caret {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  color: var(--panel-muted-icon);
  transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
}
.panel-collection-row[data-panel-open="true"] .panel-collection-caret {
  transform: rotate(180deg);
}
[data-panel] .panel-collection-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--panel-muted-icon);
  transition: color 150ms cubic-bezier(0.22, 1, 0.36, 1),
    background-color 150ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 120ms cubic-bezier(0.22, 1, 0.36, 1);
}
[data-panel] .panel-collection-remove:hover:not(:disabled) {
  color: var(--panel-danger);
  background: var(--panel-surface);
}
[data-panel] .panel-collection-remove:active:not(:disabled) {
  transform: scale(0.98);
}
[data-panel] .panel-collection-remove:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.panel-collection-remove svg {
  width: 13px;
  height: 13px;
}
.panel-collection-row-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px 12px;
}

/* ── Reference ───────────────────────────────────────────────────────────── */
.panel-reference {
  display: flex;
  flex-direction: column;
}
[data-panel] .panel-reference-trigger {
  display: block;
  width: 100%;
  padding: 0;
  background: transparent;
  text-align: left;
  transition: transform 120ms cubic-bezier(0.22, 1, 0.36, 1);
}
[data-panel] .panel-reference-trigger:active {
  transform: scale(0.98);
}
[data-panel] .panel-reference-trigger .panel-readout {
  transition: background-color 150ms cubic-bezier(0.22, 1, 0.36, 1);
}
[data-panel] .panel-reference-trigger:hover .panel-readout {
  background: var(--panel-surface-active);
}
.panel-reference-picker {
  padding-top: 6px;
}

@media (prefers-reduced-motion: reduce) {
  .panel-collection-add,
  .panel-collection-remove,
  .panel-collection-caret,
  .panel-collection-row,
  .panel-collection-row-head,
  .panel-collection-row-toggle,
  .panel-reference-trigger,
  .panel-reference-trigger .panel-readout {
    transition: none;
  }
}

/* ── Text input ──────────────────────────────────────────────────────────── */
.panel-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.panel-text[data-panel-layout="inline"] {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  background: var(--panel-surface);
}
.panel-text-label,
.panel-search-label,
.panel-textarea-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--panel-label);
  padding: 0;
  line-height: 1.35;
}
.panel-text[data-panel-layout="inline"] .panel-text-label {
  padding: 0;
  flex-shrink: 0;
}
[data-panel] .panel-text-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  background: var(--panel-surface);
  color: var(--panel-label);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  transition: background-color 150ms ease, color 150ms ease;
}
.panel-text[data-panel-layout="inline"] .panel-text-input {
  flex: 1;
  min-width: 0;
  padding: 0;
  height: 100%;
  background: transparent;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.panel-text[data-panel-layout="inline"] .panel-text-input:focus {
  background: transparent;
}
[data-panel] .panel-text-input[data-panel-mono="true"] {
  font-family: inherit;
  font-variant-numeric: tabular-nums;
  font-size: 12px;
}
[data-panel] .panel-text-input:focus {
  color: var(--panel-label-active);
  background: var(--panel-surface-active);
}
[data-panel] .panel-text-input::placeholder {
  color: var(--panel-muted-icon);
  text-transform: none;
}

/* ── Textarea ────────────────────────────────────────────────────────────── */
.panel-textarea {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
[data-panel] .panel-textarea-input {
  width: 100%;
  min-height: 72px;
  resize: vertical;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--panel-surface);
  color: var(--panel-label);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.45;
  outline: none;
  transition: background-color 150ms ease, color 150ms ease;
}
[data-panel] .panel-textarea-input:focus {
  color: var(--panel-label-active);
  background: var(--panel-surface-active);
}
[data-panel] .panel-textarea-input::placeholder {
  color: var(--panel-muted-icon);
}

.panel-search {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.panel-search-row {
  display: flex;
  align-items: stretch;
  gap: 6px;
}
[data-panel] .panel-search-input {
  flex: 1;
  min-width: 0;
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  background: var(--panel-surface);
  color: var(--panel-label);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  transition: background-color 150ms ease, color 150ms ease;
}
[data-panel] .panel-search-input:focus {
  color: var(--panel-label-active);
  background: var(--panel-surface-active);
}
[data-panel] .panel-search-input::placeholder {
  color: var(--panel-muted-icon);
}
[data-panel] .panel-search-btn {
  flex-shrink: 0;
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  background: var(--panel-action-bg);
  color: var(--panel-action-text);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
  transition: background-color 150ms ease, color 150ms ease, transform 120ms ease;
}
[data-panel] .panel-search-btn:hover:not(:disabled) {
  background: var(--panel-action-bg-hover);
  color: var(--panel-action-text-hover);
}
[data-panel] .panel-search-btn:active:not(:disabled) {
  transform: scale(0.98);
}
[data-panel] .panel-search-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.panel-search-error {
  padding: 0 12px;
  font-size: 11px;
  line-height: 1.35;
  color: #ef4444;
}

/* ── Readout row ─────────────────────────────────────────────────────────── */
.panel-readout {
  display: flex;
  min-height: 36px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--panel-surface);
}
.panel-readout-label {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--panel-label);
}
.panel-readout-value {
  min-width: 0;
  font-size: 12px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--panel-text-muted);
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Option list (search results, pickers) ───────────────────────────────── */
.panel-option-list-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.panel-option-list-title {
  padding: 0 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--panel-text-muted);
}
.panel-option-list {
  display: flex;
  max-height: 168px;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  scrollbar-width: thin;
}
.panel-option-list::-webkit-scrollbar {
  width: 6px;
}
.panel-option-list::-webkit-scrollbar-thumb {
  background: var(--panel-surface-active);
  border-radius: 999px;
}
[data-panel] .panel-option-item {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 8px 10px;
  border-radius: 6px;
  background: transparent;
  color: var(--panel-label);
  text-align: left;
  transition: background-color 120ms ease, color 120ms ease;
}
[data-panel] .panel-option-item:hover:not(:disabled) {
  background: var(--panel-surface);
  color: var(--panel-label-active);
}
[data-panel] .panel-option-item:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.panel-option-item-label {
  width: 100%;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  color: inherit;
}
.panel-option-item-desc {
  width: 100%;
  font-size: 10.5px;
  line-height: 1.35;
  color: var(--panel-text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.panel-option-empty {
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--panel-surface);
  font-size: 11px;
  line-height: 1.35;
  color: var(--panel-text-muted);
}

/* ── Hint copy ───────────────────────────────────────────────────────────── */
.panel-hint {
  margin: 0;
  padding: 0 12px 2px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--panel-text-muted);
}
`
