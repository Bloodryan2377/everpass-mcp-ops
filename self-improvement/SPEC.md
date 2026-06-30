# Self-Improvement Loop — Spec

A small, durable loop that lets the operating system improve itself: skills,
hooks, `CLAUDE.md` rules, SOPs, and scripts. The point is that improvements
**compound** instead of being re-discovered each session, and that they can't be
applied silently — every high-impact change is reviewed.

## States

```
            propose                review                 (manual)
  idea  ───────────────▶  PENDING ─────────────▶ LOGGED ───────────▶ applied
                          (queue.json)   approve/reject  (log.jsonl)   to repo
```

- **PENDING** — in `queue.json`, awaiting human review.
- **LOGGED** — resolved (approved or rejected) and appended to `log.jsonl`.
- **applied** — the actual edit to skill/hook/CLAUDE.md/etc. A deliberate,
  separate step. The loop records the *decision*; it never edits your repo for you.

## Impact classes & review policy (binding)

| Impact | Auto-approve? | Meaning |
|---|---|---|
| `HIGH` | **Never** | Changes governance, hooks, source-of-truth rules, anything user-facing or hard to reverse. Always human-reviewed. |
| `MED`  | Only if `config.json` allows | Skill tweaks, SOP refinements, non-load-bearing scripts. |
| `LOW`  | Only if `config.json` allows | Wording, comments, log hygiene. |

`HIGH` is excluded from auto-approval **in code** (`auto_approves()`), not just by
config — config can only ever *widen* approval for `MED`/`LOW`. Default config is
empty, so out of the box **everything queues for review**.

## Components

| File | Role |
|---|---|
| `self-improve.sh` | Engine CLI — `propose` / `list` / `resolve` / `status` / `log`. |
| `self-improve-status.sh` | Stop-hook wrapper — silent when clean, surfaces pending at session end. |
| `settings.stop-hook.json` | Snippet to register the Stop hook in `settings.json`. |
| `config.json` | Auto-approve policy (impacts + title patterns). |
| `queue.json` | Pending review queue (source of truth for "needs review"). |
| `log.jsonl` | Append-only record of every resolved proposal. |
| `SKILL.md` | The behavior that drives proposing improvements during a session. |

## Why a Stop hook closes the loop

Without it, the queue depends on someone remembering to run `list`. The Stop hook
runs `status --hook` at every session end: clean → silent; pending → prints the
items and the resolve command. The queue therefore cannot rot unnoticed, and no
separate scheduler/cron is required.

## Invariants

1. `HIGH` never auto-approves.
2. `resolve` is non-destructive to your repo — it only moves queue → log.
3. IDs are monotonic (`SI-NNNN`), unique across queue **and** log.
4. The Stop hook always exits 0 — it never blocks session stop.
5. Data files self-bootstrap if missing, so the module is safe to copy anywhere.
