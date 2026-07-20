# EverPass MCP & Claude Code Operations

## Overview

This repo is the central place to track the Claude Code MCP + Zapier + GitHub wiring that powers my EverPass workflows. It captures:

- Which MCP servers and actions are connected.
- How email is scoped so automations only touch EverPass traffic.
- Repeatable sanity-check procedures for each integration.
- Next-step ideas for end-to-end workflows.
- Claude Code productivity stack inventory and install prompt (skills, ECC, Repomix, marketing, NotebookLM). See [claude-productivity-stack/](claude-productivity-stack/).

### Claude productivity stack (quick links)

**Primary (use this):** [ONE PASTE full setup](claude-productivity-stack/CLAUDE-CODE-ONE-PASTE-SETUP.md) — install + router + `best-tool-router` deploy + SessionStart banner merge + audit in a single Claude Code paste.

- [install-stack.ps1](claude-productivity-stack/install-stack.ps1) — idempotent Windows installer (also deploys router + merges banner)
- [merge-session-banner.ps1](scripts/merge-session-banner.ps1) — safe `settings.json` SessionStart merge
- [sessionStart-stack-banner.json](hooks/sessionStart-stack-banner.json) — merge snippet reference
- [AUDIT-RESULTS.md](claude-productivity-stack/AUDIT-RESULTS.md) — post-setup verification table
- [Inventory](claude-productivity-stack/INVENTORY.md) · [Usage](claude-productivity-stack/USAGE.md) · [Capability matrix](claude-productivity-stack/CAPABILITY-MATRIX.md)
- Legacy split prompts (superseded by one-paste): [install](claude-productivity-stack/CLAUDE-CODE-INSTALL-PROMPT.md) · [ops](claude-productivity-stack/CLAUDE-CODE-OPS-UPDATE-PROMPT.md)

**Note:** Article list item “Everything Claude Code” is now canonical as [affaan-m/ECC](https://github.com/affaan-m/ECC). Install only from official ECC sources.

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

See [MCP_SETUP.md](MCP_SETUP.md) for the detailed technical layout and [TODO.md](TODO.md) for the next-step backlog.
