# Self-Improvement Loop

A self-sustaining loop for improving the operating system itself — skills, hooks,
`CLAUDE.md` rules, SOPs, scripts — so lessons **compound** across sessions instead
of being re-learned. Every high-impact change is human-reviewed; the review queue
can't rot because a Stop hook surfaces it at session end.

This repo (`everpass-mcp-ops`) is the human-readable mirror of the live Claude
Code config; this module is the mirrored source for the loop. Deploy `*.sh` +
data files to the ops box and register the Stop hook from `settings.stop-hook.json`.

## Quick start

```bash
# Propose an improvement (HIGH always queues for review)
self-improvement/self-improve.sh propose --impact HIGH \
  --title "Tighten freshness gate on mobile feeds" \
  --detail "12h rule missed two JSON feeds; add them to the enforcer manifest."

# See what's pending
self-improvement/self-improve.sh list

# Resolve after review
self-improvement/self-improve.sh resolve SI-0001 --approve --note "ship it"

# Session-end status (what the Stop hook runs; silent when clean)
self-improvement/self-improve.sh status --hook

# Recent decisions
self-improvement/self-improve.sh log -n 10
```

## Files

| File | Role |
|---|---|
| `self-improve.sh` | Engine: `propose` / `list` / `resolve` / `status` / `log`. |
| `self-improve-status.sh` | Stop-hook wrapper (silent when queue clean). |
| `settings.stop-hook.json` | Snippet to merge into `settings.json` `hooks`. |
| `config.json` | Auto-approve policy (default empty → everything reviews). |
| `queue.json` | Pending review queue. |
| `log.jsonl` | Append-only decision log. |
| `SPEC.md` | States, impact classes, invariants. |
| `SKILL.md` | The behavior that drives proposing improvements. |

## Registering the Stop hook

1. Back up `settings.json`.
2. Merge the `Stop` array from `settings.stop-hook.json` into the `hooks` object,
   adjusting the absolute path to where this module lives on disk.
3. Validate: `jq . settings.json` (must parse).

See [`SPEC.md`](SPEC.md) for the full design and invariants.
