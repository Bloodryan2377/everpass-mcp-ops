# EverPass MCP & Claude Code Operations

## Overview

This repo is the central place to track the Claude Code MCP + Zapier + GitHub wiring that powers my EverPass workflows. It captures:

- Which MCP servers and actions are connected.
- How email is scoped so automations only touch EverPass traffic.
- Repeatable sanity-check procedures for each integration.
- Next-step ideas for end-to-end workflows.

The code of record is the live Claude Code config on my Windows box; this repo is the human-readable mirror.

## Refresh contract (read first)

If you are about to ask for, run, or claim a "full refresh":

- The canonical inventory of every cockpit / dashboard data source — wired, bridged, manual, or gap — is in [DASHBOARD_SOURCES.md](DASHBOARD_SOURCES.md). If a source is not in that file, it is not in the refresh.
- The rules for what "refresh" actually means, the required per-source report block, and the diagnostic for stale cockpit cards are in [REFRESH_CONTRACT.md](REFRESH_CONTRACT.md). Claude is bound by it; the user is empowered to call violations.

These two files exist because past "full refresh" claims masked invisible surfaces (Outlook bridge, OneDrive, Obsidian, NotebookLM, Contract Master, Deal Brain) and the cockpit drifted while reports said "up to date."

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

See [MCP_SETUP.md](MCP_SETUP.md) for the detailed technical layout, [DASHBOARD_SOURCES.md](DASHBOARD_SOURCES.md) for the canonical source inventory, [REFRESH_CONTRACT.md](REFRESH_CONTRACT.md) for the refresh rules, and [TODO.md](TODO.md) for the next-step backlog.
