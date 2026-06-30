# EverPass MCP & Claude Code Operations

## Overview

This repo is the central place to track the Claude Code MCP + Zapier + GitHub wiring that powers my EverPass workflows. It captures:

- Which MCP servers and actions are connected.
- How email is scoped so automations only touch EverPass traffic.
- Repeatable sanity-check procedures for each integration.
- Next-step ideas for end-to-end workflows.

The code of record is the live Claude Code config on my Windows box; this repo is the human-readable mirror.

## Current environment

- **Claude Code on Windows**, configured with user-scoped environment variables (e.g., `GITHUB_PERSONAL_ACCESS_TOKEN`).
- **Zapier MCP server** with 4 apps / 11 actions enabled:
  - Webhooks (GET, POST)
  - Dropbox (file, find, list, shared_link)
  - Google Sheets (add_row, update_row)
  - Gmail (message + draft, scoped to `label:"EverPass"`)
- **GitHub plugin** using a classic PAT stored in `GITHUB_PERSONAL_ACCESS_TOKEN` (scopes: `repo`, `read:user`).

## How email is scoped

- Outlook `rblood@everpass.com` forwards relevant mail into Gmail.
- A Gmail filter labels EverPass messages using `to:@everpass.com` and applies the label `EverPass`.
- All MCP email operations (read, draft, reply) are constrained to `label:"EverPass"` — they never see non-EverPass mail.

## Sanity check procedures

These are the lightweight end-to-end checks I run after any MCP or credential change:

- **Webhooks:** fire a Zapier Webhooks GET and POST against a known test endpoint; confirm 2xx and payload round-trip.
- **Dropbox:** `list` the top-level folder, `find` a known file, fetch metadata, generate a `shared_link`, confirm URL resolves.
- **Google Sheets:** `add_row` to `EverPass – MCP Logs` → `Sheet1` (headers `date | event | status`), then `update_row` on the same row; confirm both mutations land.
- **Gmail:** search within `label:"EverPass"`, open a message, create a draft reply, confirm the draft appears in Gmail UI.

## Insights → chain pipeline (market intel)

Market-intelligence items (e.g. a competitor/distributor news item) are captured
as **insight notes** under `data/insights/` and propagated into the live mobile
cockpit feed automatically — no hand-editing of the JSON feeds.

- **Insight note** — `data/insights/<date>-market-intel-<slug>.md`. Human-readable
  market-intel note (`epc-market-intel/v1`) carrying a fenced ` ```epc-chain ` JSON
  block that declares the cockpit **bridge signal** and optional **partner todo**
  the note should surface, keyed by a stable `intel_key`.
- **Engine** — `scripts/ingest_market_intel.py`. Reads the notes and upserts their
  signal/todo into `data/mobile/mobile-cockpit.json`, syncs the feed manifest, and
  regenerates `data/insights/_index.md`. **Idempotent**: entries are keyed, never
  duplicated, and freshness timestamps (`generated_at`, cockpit/bridge mtimes) are
  bumped only when content actually changes. `partner_todos.total` (the full
  system-wide count) is incremented per genuinely-new todo, never reset to the
  capped preview length.
  - `python scripts/ingest_market_intel.py --all` — apply
  - `python scripts/ingest_market_intel.py --all --check` — dry-run (rc=1 on drift)
- **Wrapper** — `scripts/sync-insights-to-chain.sh`. Forgiving entry point (used
  by hand and by the optional hooks); always exits 0 so it can't block a session
  or an edit.
- **Auto tie-in (optional, operator-installed)** — a **SessionStart** hook (sync
  on every session open) plus a **PostToolUse** hook (re-sync whenever an
  `Edit`/`Write` touches `data/insights/`), both just calling the wrapper. Because
  these are auto-executing startup config, they are **not** committed as active
  config — the operator adds them to the project's Claude Code `settings.json`
  deliberately (Layer-2 wrapper), the same way `hooks/preToolUse-snippet.json` is
  mirrored into `~/.claude/settings.json`.

- **Scaffolder** — `scripts/new_insight.py`. Renders a complete, correctly-structured
  insight note (frontmatter + body + `epc-chain` block) from a compact JSON spec, so
  neither the operator nor Claude hand-writes the machine block, then runs the ingest:
  - `python scripts/new_insight.py --from-json spec.json` (or `--from-json -` for stdin)
  - derives `intel_key`/`todo.id`/critical title from the spec; `--no-sync` to write only.

To add new market intel: either run the scaffolder with a spec, or drop a note in
`data/insights/` by hand (copy an existing one and edit the `epc-chain` block), then
run `bash scripts/sync-insights-to-chain.sh` — or, with the optional hooks installed,
the sync fires automatically on save.

See [MCP_SETUP.md](MCP_SETUP.md) for the detailed technical layout and [TODO.md](TODO.md) for the next-step backlog.
