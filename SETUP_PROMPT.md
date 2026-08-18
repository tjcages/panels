# Setup prompt

Open the file with the thing you want to control — a shader, a canvas, a
simulation, a config object, anything — in Cursor / Claude Code / Copilot and
paste the prompt below. It finds the tweakable values, builds the panel fields,
wires up `usePanel`, and verifies that editing works and (for multi-target
setups) that the switcher navigates.

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

6. Don't add other dependencies and don't change the visual output.

7. VERIFY before finishing, and report the results:
   - Editing works: dragging a slider / toggling a field actually changes the
     thing on screen (the value flows through to the render).
   - Persistence: reload keeps my edits (usePanel persists to localStorage).
   - For multi-target: selecting each target in the header switcher scrolls to
     its section (scrollTo) or navigates to its page (onSelect), and the panel
     then shows that target's own fields.
   Report which values you exposed vs skipped, and each target's id + how it
   navigates.
```

Once it's wired up, toggle the panel with **⌘⌥D** (**Ctrl+Alt+D**).
