# Setup prompt

Open the file with the thing you want to control — a shader, a canvas, a
simulation, a config object, anything — in Cursor / Claude Code / Copilot and
paste the prompt below. It finds the tweakable values, builds the panel fields,
wires up `usePanel`, and verifies that editing works and (for multi-target
setups) that the switcher navigates.

Steps 1–7 are the simple case. Steps 8–10 run only when the open file has
item lists, a canvas overlay, or a custom export path — skip them otherwise.

```text
Add @tjcages/panels to my open file so I can tune its values live.

1. Find what should be tunable. This can be ANY React state — shader uniforms,
   canvas params, a physics step's constants, layout/transform numbers, a
   dashboard's thresholds, or a plain config object. Skip values driven at
   runtime (elapsed time, resolution, pointer, camera matrices). Use each
   value's current JS value as its default.

2. In the component, add:
   - a DEFAULTS object with those values
   - a FIELDS array typed PanelField<Config>[]:
       number         → { type: "slider", min, max, step }
       "#rrggbb"      → { type: "color" }
       [x, y]         → { type: "vec2", min, max, step }
       boolean        → { type: "toggle" }
       string enum    → { type: "select", options: [{ value, label }] }
     Infer sensible min/max/step from each default's magnitude.
     Group related fields under { type: "section", title }.
     Write the FIELDS list explicitly (an explicit list always wins over
     inference). Omit only if the defaults are already the whole schema.

3. Replace the hardcoded config with one hook call:
       const [config] = usePanel({
         id: "<unique-id>",
         title: "<Display name>",
         defaults: DEFAULTS,
         fields: FIELDS,
       })
   The hook owns the state, registers the target, and injects the panel — no
   <PanelRoot/> and no extra files. Feed `config` wherever the values belong.

4. If I want to control MORE THAN ONE thing (multiple shaders, several
   sections, or different pages), call usePanel once per target with a
   distinct id/title. A switcher appears automatically in the panel header.
   Give each target a way to reach it so selecting it in the switcher goes
   there:
       usePanel({
         id: "hero", title: "Hero",
         defaults, fields,
         scrollTo: "#hero",          // scrolls this selector into view, or
         onSelect: () => router.push("/hero"),  // route with my own router
       })
   Use scrollTo for same-page sections and onSelect for navigation/routing.

5. For shaders, push `config` to the GPU with the adapters instead of a
   hand-rolled mapping (import from "@tjcages/panels/shader"):
   - WebGL / ShaderMount: const toUniforms = createWebGLAdapter({ fields: FIELDS });
     then mount.setUniforms(toUniforms(config)) in a useEffect([config]).
   - R3F: const apply = useMemo(() => createR3FAdapter({ uniforms, fields: FIELDS }), [uniforms]);
     then apply(config) in a useEffect([config, apply]).
   For non-shaders, just use `config` directly.
   Adapters only map slider / color / toggle / select / vec2 / toggle-group.
   Do not pass collection / reference / image / path / gradient-stops /
   stripe-table fields through them.

6. Don't add other dependencies and don't change the visual output.
   Don't wrap the production UI in ToolShell / PanelRoot / extra chrome —
   usePanel auto-injects the panel. Import from "@tjcages/panels" (not
   "/dev") so production builds compile to the no-op.

7. VERIFY before finishing, and report the results:
   - Editing works: dragging a slider / toggling a field actually changes the
     thing on screen (the value flows through to the render).
   - Persistence: reload keeps my edits (usePanel persists to localStorage).
   - For multi-target: selecting each target in the header switcher scrolls to
     its section (scrollTo) or navigates to its page (onSelect), and the panel
     then shows that target's own fields.
   Report which values you exposed vs skipped, and each target's id + how it
   navigates.

   --- optional, only if the open file needs them ---

8. ONLY IF the config holds arrays of items (POIs, captions, layers, lights)
   that should be add / remove / reorder / edit:
   - Store them as Item[] on the config. Every item MUST have a stable
     `id: string`. On add, omit id and the collection assigns one.
   - Add a collection field. Nest the per-item schema in `itemFields`
     (array, or a function of the item for per-type schemas). Use
     `{ type: "section", title }` inside itemFields the same way as at
     the top level.
   - Point at a sibling collection with `{ type: "reference", key, label,
     collection: "<siblingKey>" }` (`multiple: true` → string[] of ids).
   - usePanel({ onSelect }) is NOT collection selection — it fires when
     this *target* is picked in the header switcher. Canvas ↔ row
     binding: pass panelId + collectionKey + itemId (or select) on
     PanelOverlay; clicking the overlay opens that row.
   Verify: add an item, edit a nested field, reload (ids + edits stick),
   pick a reference target.

9. ONLY IF a canvas / R3F scene should pin DOM over scene objects, or
   drag a handle to write a position:
   - Renderer-agnostic (from "@tjcages/panels"): createOverlayProjector
     (binding, { container }) then projector.register({ id, getWorld, node }).
     Binding needs project(world) → { x, y, visible } | null and onFrame.
   - R3F (from "@tjcages/panels/shader"), render INSIDE <Canvas>:
       <PanelOverlay anchor={object3D | [x,y,z]} visible>
         <Pin />
       </PanelOverlay>
     Drag: const drag = useDragHandle({ anchor: item.pos, onDrag: (p) =>
       setItem({ ...item, pos: p }), surface }) then spread
       drag.handleProps on the handle (opts back into pointer-events).
   - Drive your loop with usePanelFrame(({ time, delta }) => …) so
     play/pause/step honor the panel clock (delta is 0 while paused).
     R3F demand canvases: render <PanelClock /> inside <Canvas>.
   - Two-way selection: on PanelOverlay pass panelId, collectionKey,
     itemId (or select={{ panelId, collectionKey, itemId }}). Click
     selects; selected overlays get data-panel-selected="true".
   Verify: overlay stays pinned while the camera moves; drag writes the
     item field; clicking the overlay opens the matching collection
     row; pause freezes the shader but not overlay tracking;
     production still compiles (overlay no-ops).

10. ONLY IF the host must supply hi-res stills / GIF / video the panel
    export footer can drive. Names are still shader-prefixed — use them
    as exported. From "@tjcages/panels", in a useEffect, register and
    return the unsubscribe:
      registerShaderCapture(({ maxEdge }) => Promise<Blob>)
      registerShaderGifExport(({ durationSec, fps, maxEdge, onProgress }) =>
        Promise<Blob>)
      registerShaderVideoExport(() => Promise<{ stop: () => Promise<Blob> }>)
      registerShaderRecordCanvas(() => HTMLCanvasElement | null)
      registerShaderRecordPrepare(() => Promise<void>)
      registerShaderRecordFrame(() => void | Promise<void>)
    If nothing is registered, the panel falls back to the largest
    <canvas> on the page at screen resolution. Unregister on unmount.
    Verify: PNG download works; if you registered capture, it is used
    (not the screen-res fallback).
```

Field catalog, overlay, and capture signatures: `AGENTS.md` in this package.
Shorter copy: `llms.txt`. Toggle the panel with **⌘⌥D** (**Ctrl+Alt+D**).
