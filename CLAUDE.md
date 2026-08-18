# shader-panel — agent instructions

Floating dev panel for tweaking shader uniforms live (WebGL / Three.js / R3F). Published on npm at v1.0.0; compiles out of prod builds. Read `README.md` first. Note: this repo was previously named `shader-dev` — the package and repo are `shader-panel`.

## Linear tracking (non-negotiable)

Every agent, every session. Linear: **team "Off-brand"**, **project "shader-panel"** (the Linear project keeps this name until the rename lands).

**Tracking goal: relaunch as "Panels" (`@tjcages/panels`) — generalize from a shader tool into a control panel for any React tool, then launch.** Roadmap runs across 8 phase milestones:
`Phase 1 · Vision & rename` → `Phase 2 · General core` → `Phase 3 · Item collections & linking` → `Phase 4 · Canvas + overlay binding` → `Phase 5 · Export & capture` → `Phase 6 · Auto-UI & install` → `Phase 7 · Distribution & docs` → `Phase 8 · Launch`.
Historical shipped releases live in `Releases 0.4.0 → 1.2.0` (done). No module labels (phase-level granularity). Version line resets to a fresh 0.x, 1.0 at the Phase 8 launch.

- **Search before creating.** Never duplicate a tracked item.
- **Non-trivial work gets an issue**, filed when identified, in the right phase milestone.
- **Every issue gets a milestone.**
- **Lifecycle is real.** `Backlog` → `In Progress` at start → `Done` only when shipped. Mid-work session end → leave `In Progress` + comment.
- **Keep CHANGELOG.md and Linear in agreement.**
- **Writing style — plain titles, structured bodies.** Titles ≤8 words, plain outcome language, no code identifiers or feature dumps (`v1.1.0 — Two-panel layouts`, not `… ToolShell, dual panels, presets`). Descriptions lead with one plain sentence, then a structured block — checklist for in-progress (`- [x]`/`- [ ]`), table for comparisons, tight bullets for a release. Technical depth is welcome *inside* the structure. Attach screenshots instead of describing visuals.
- **Wire real dependencies** (`blockedBy`) for genuine sequencing.
- **Close the loop before ending a session.**
- **Use Linear's generated branch names** (`ty/off-N-slug`).

## Notifications, decisions & progress (how you pull Ty in)

Ty drives the work from the Claude app and does **not** push the code — agents do. So Linear is not where the conversation happens; it's the **async record + decision queue**. The job here is to reach Ty *exactly when he's needed and never otherwise*. Default to silence; earn every notification.

**Identity is the gate.** Notifications only reach Ty if the agent acts under a Linear identity **distinct from Ty's** — Linear never notifies you about your own actions. If the agent's Linear token is Ty's own, assign/mention is a silent no-op and the queue below only works as a *pull* (saved views), not a *push*. Prefer a dedicated agent identity so assign + `@ty` actually notify. If you can't tell which identity you're on, say so rather than assuming the ping landed.

**A decision → a `Decision` issue (never buried in chat only).** When you hit a fork you can't resolve from the repo, the plan, or a sensible default, do **not** silently pick and move on. Keep it **absurdly concise** — Ty should be able to answer from the title plus a glance, no codebase needed:
- **Title** = the question itself, plain and instantly understandable (`Which package scope for the beta?`). No jargon, no code identifiers.
- **Options** = a short list, usually 2–3, each a clear one-line label. Add a sentence of detail under an option *only* when the label can't carry it — that's where any depth goes.
- **Recommendation** — if you have one, state it outright (`← recommend`). Don't hedge, don't bury it.
- **Tradeoffs** — name a real one in a few words when it exists; skip the pros/cons scaffold when it doesn't. Never manufacture symmetry or pad it out.
- **Label** `Decision`, **assignee** `@ty`, **priority** Urgent if it blocks active work; wire `blockedBy` to whatever's stalled.
- Ty answers in the Claude app; the **agent** then records the call as a ≤3-line comment, drops the `Decision` label, and clears the block. The issue is the durable trace — never make Ty reconstruct a decision from chat scrollback.

Shape it like this — nothing more:
```
Which package scope for the beta?          [Decision · @ty · blocks OFF-149]

- @tjcages/panels — scoped to your npm handle, zero name-conflict risk.  ← recommend
- panels — cleaner, but the unscoped name is likely taken.
- @panels/core — room for a family later, more to publish now.

Blocks the README rewrite + docs site until locked.
```

**A visual/subjective sign-off → a `Needs review` issue.** Work that's *done* but needs Ty's eyes (a look, a feel-test, a taste call — not a fork) gets label `Needs review`, assignee `@ty`, and a **screenshot attached** (a still or short clip; an image beats a paragraph). This is a sign-off, not a question.

**Progress → project status updates, phase-grained.** Post a status update at real milestone moments only — a phase closes, a batch ships, or health changes (`atRisk`/`offTrack` the moment it's true, said in chat too). Changelog voice, structured, links not prose. This feed is Ty's "what's happening" glance; do **not** spam it per issue. Routine `Backlog → In Progress → Done` is the ambient signal, not a notification.

**What must NOT reach Ty:** routine lifecycle moves, normal implementation, anything with a sensible default, anything you can verify yourself. Only genuine forks (`Decision`) and review sign-offs (`Needs review`) are his to action — that's why his `My Issues` stays lean and trustworthy.
