# @tjcages/panels — installation guide for a coding agent

You were pointed at this URL and told to implement it. This page is the whole
brief: install the package, wire `usePanel`, verify. You do not need to read
the source or ask for more instructions before starting.

Live docs: https://offbr.co/tools/panels/docs/
Package card: https://offbr.co/tools/panels

**What to control.** If the user named a file, shader, canvas, or config, use
that and nothing else. If they said nothing — the normal case when all they
pasted was this link — open the component that owns the tweakable values on the
landing view, stop there, and tell them what you picked.

## The panel

One hook owns the state, injects a floating panel, and returns a `useState`-style
tuple. Edits persist to `localStorage` (`panels:<id>`). Production builds compile
the UI out to a ~5 KB no-op. Toggle with ⌘⌥D / Ctrl+Alt+D.

## Step 1 — install

```bash
npm install @tjcages/panels
```

**Do not** add tweakpane, leva, dat.gui, or another control-panel library. This
package replaces them. **Do not** wrap production UI in `ToolShell` / `PanelRoot`.
Import from `@tjcages/panels`, not `/dev`.

Optional, so later agents find the skill in-repo:

```bash
npx @tjcages/panels setup
```

## Step 2 — wire it up

Open the file that owns the values. Then:

1. Find what should be tunable. Skip values driven at runtime (elapsed time,
   resolution, pointer, camera matrices). Use each value's current JS value as
   its default.
2. Add a `DEFAULTS` object and a `FIELDS` array typed `PanelField<Config>[]`:
   - number → `{ type: "slider", min, max, step }`
   - `"#rrggbb"` → `{ type: "color" }`
   - `[x, y]` → `{ type: "vec2", min, max, step }`
   - boolean → `{ type: "toggle" }`
   - string enum → `{ type: "select", options: [{ value, label }] }`
   Infer min/max/step from each default's magnitude. Group related fields under
   `{ type: "section", title }`. Write `FIELDS` explicitly.
3. Replace the hardcoded config:

```ts
const [config] = usePanel({
  id: "<unique-id>",
  title: "<Display name>",
  defaults: DEFAULTS,
  fields: FIELDS,
})
```

The hook injects the panel. Feed `config` wherever the values belong.

4. More than one target: call `usePanel` once per target with a distinct
   `id`/`title`. Give each a `scrollTo` (same-page) or `onSelect` (your router).
   `usePanel({ onSelect })` is target navigation, not collection-row selection.
5. Shaders: push `config` with `createWebGLAdapter` / `createR3FAdapter` from
   `@tjcages/panels/shader`. Adapters map slider / color / toggle / select /
   vec2 / toggle-group only.
6. Don't add other dependencies and don't change the visual output.

Full paste-in checklist: `SETUP_PROMPT.md` in the package (steps 8–10 only if
the file has item lists, a canvas overlay, or a custom export path). Field
catalog: `AGENTS.md`.

## Step 3 — verify

- Editing a control changes the thing on screen.
- Reload keeps edits (`persist: false` to opt out).
- Multi-target: the header switcher scrolls or routes, then shows that target's
  fields.

Report which values you exposed vs skipped, and each target's `id` + how it
navigates.
