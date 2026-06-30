# SELF-IMPROVE-SPEC — design of the LOOP

Status: implemented + tested (`self_improve.py selftest` passes).
Origin: Austin Marchese's "LOOP" pattern for self-improving agents.

## Problem

An agent that can edit its own scaffold (skills, hooks, rules, docs) is the only
kind that compounds. But two naive designs both fail:

- **Full autonomy** — let the agent apply every self-edit. The agent's behavior
  drifts; guardrails get quietly relaxed; the system rots. Unrecoverable because
  nobody is watching the changes that matter.
- **Review-everything** — make a human approve every self-edit. Correct but
  unsustainable: a typo fix shouldn't need a sign-off, so in practice the loop
  is never run and the agent never improves.

## Design: triage by risk

Every proposed self-change is classified into one of three risk bands, and the
band decides the route. The whole system is this table plus an escape hatch.

### Risk bands

- **LOW** — touches only human-readable surface area; cannot change behavior.
  `doc`, `wording`, `example`, `gotcha`, `comment`, `typo`.
  → **Apply now**, append to `changelog.md`.

- **HIGH** — changes what the agent *does* or its guardrails.
  `skill-behavior`, `new-skill`, `hook`, `new-hook`, `rule`, `permission`,
  `delete`. → **Hold** in `review-<date>.md`. Never self-applies.

- **UNCLEAR** — anything uncategorized. → Hold in review, flagged ⚠️ so a human
  decides which band it really is.

### Escape hatch: approve-always (blessing)

When the human resolves a HIGH/UNCLEAR item they choose:

- `approve` — apply this one item now (changelog), leave the class gated.
- `reject` — drop it, apply nothing.
- `approve-always` — apply it **and** bless the whole *category* so future
  changes of that category auto-apply (they route like LOW).

Blessing is how the agent earns trust incrementally, but only by an explicit
human grant. **`patterns.json` (the blessed set) is empty by default** — a fresh
install gates every behavior change. Blessing is scoped: blessing
`skill-behavior` does **not** bless `rule`.

## State

All under `_state/` (git-ignored; runtime, not source):

| File | Role |
|------|------|
| `patterns.json` | `{"blessed": [...]}` — blessed categories. Empty by default. |
| `changelog.md` | Append-only log of every applied (LOW or blessed) change. |
| `review-<date>.md` | Human-readable pending queue for a given day. |
| `queue.json` | Machine-readable pending queue (drives `decide`/`status`). |

## Lifecycle

```
proposed change ──► triage(category) ──► classify()
                                          │
              LOW or blessed ────────────►├─► APPLY → changelog.md
                                          │
              HIGH / UNCLEAR ────────────►└─► REVIEW → review-<date>.md + queue.json
                                                          │
                                          decide(id, action)
                                          ├─ approve         → changelog.md
                                          ├─ reject          → dropped
                                          └─ approve-always  → changelog.md + bless category
```

## Invariants (asserted by `selftest`)

1. Fresh install blesses nothing.
2. LOW applies immediately and hits the changelog.
3. HIGH (`skill-behavior`) holds for review and never self-applies — this is the
   exact drift the dogfood run caught and the system exists to stop.
4. UNCLEAR holds for review, flagged.
5. `reject` removes only the rejected item; applies nothing.
6. `approve-always` blesses the class; the next same-class change auto-applies.
7. Blessing is scoped — blessing one HIGH class leaves the others gated.

## The dogfood catch (real bug, 2026-06-29)

The first smoke test blessed `skill-behavior` as part of setup, which would have
let skill edits self-apply — precisely the drift the loop exists to prevent. It
was cleared and the invariant "HIGH routes to review unless explicitly blessed"
was added to `selftest` (invariants 3, 6, 7) so the regression can't return
silently. Defaults-empty is the safety property; the test guards it.

## Built since v1

- **Stop-hook** (`hooks/stop-snippet.json`) — surfaces the pending-review count
  at session end so a rotting queue is visible. Read-only and non-blocking:
  emits a `systemMessage` when items are pending, `{}` otherwise. Engine entry
  point: `self_improve.py stop-hook` (covered by `selftest` invariants 8–9 —
  never creates state, always surfaces a pending count).

## Open / optional (not yet built)

- **Periodic guard** that warns when `review-<date>.md` items age past N days.
- A formal "skill-from-masters" pass (currently substituted by studying real
  practitioner videos — stronger failure-case coverage than a web search).
