# Dashboard — Subtree Rules

Auto-loaded for any session whose CWD is under `EVERPASS TOOLS/Dashboard/`. Stacks on top of the EVERPASS root `CLAUDE.md`. The path-scoped `.claude/rules/dashboard.md` covers the same ground at file-touch level — both apply.

## Live file is authoritative

`EVERPASS TOOLS/Dashboard/EverPass Media _ Content Pipeline Decision-Making Dashboard.html` is the single source of truth for the dashboard. **Manual edits ALWAYS win.**

- Confirmed 2026-04-12 — there is no point in live work if it can be overwritten by automation. Architectural rule, not preference.
- Backup follows live: sync `.bak` to current live file before any pipeline run. Drift detection is informational only — never block work.
- Auto-pipeline + scheduled tasks may only **ADD** new entries (IDs not already present). If an entry ID already exists, skip. If `goNoGoData` / `economicsData` / `negotiationData` has a non-empty value, do not overwrite.
- Scope: ALL skills, ALL scheduled tasks, ALL sessions. No exceptions without explicit interactive Ryan approval.

## Router menu (interactive sessions only)

Before any dashboard change in an interactive session, present the router menu:

```
Suggested command: /<best-guess>
Scope I infer: <single-property / multi-property / global>
Property: <slug or not yet specified>

Available commands:
- /prop-setup
- /econ-refresh
- /contract-update
- /negotiation-update
- /gtm-update
- /prop-cleanup
- /multi-prop
- /global-update
```

**Autonomy override:** if the prompt contains explicit autonomous-execution instruction, skip the menu, log `Execution mode: autonomous; router bypassed via precedence rule`, infer the command, state it in one line, execute.

## JS validation gate (HARD)

After any injection that touches the `pipelineIntelligence` array:

1. Extract all `<script>` blocks; run `node --check` on each.
2. Verify each entry has `{ ... details: [ ... ] }` fully closed, entries comma-separated, only the final entry before `];` omits trailing comma.
3. **Never restore from `.bak` without syntax-checking the backup first** — the backup can itself be corrupted (2026-04-10 incident).

A PostToolUse hook runs `Dashboard/.claude/validate-dashboard-js.sh` automatically after any Edit/Write that mentions "Pipeline Decision-Making Dashboard".

## Splice safety

- Splice at smallest unit (card, row, partner block). Never at file level.
- For `embeddedSubPages` base64 inserts: work in raw bytes with CRLF endings; locate by finding `var embeddedSubPages = {` ... `};`. Never regex the full file.

## Backups

- Pre-destructive snapshots → `Dashboard - Backups/` with timestamp.
- PreToolUse hooks auto-create `.bak` for the live dashboard, the Pipeline Flow HTML, and any `Dashboard Info/` file before edit.

## Cockpit projections

The cockpit (desktop + mobile) reads three feeds — all must stay in sync (CS-001):

1. The dashboard HTML (this file).
2. `EVERPASS TOOLS/Daily SOP/wiki-updates.json` (44 entities / 3 groups). Rebuild via `build-wiki-updates.py`.
3. The daily brief markdown (under `Operations & Strategy/`).

"Up to date" = all three synced for every property touched. Weekly full-refresh required.

## Freshness

- 12-hour freshness rule applies to this whole subtree (see root CLAUDE.md §2).
- Cockpit `as of` badge reads `EVERPASS TOOLS/AI Related/health/freshness-status.json`.
- Run `python ".../Scripts/freshness_enforcer.py"` after any chain edit. Verify `overall=PASS` before ending the session.

## Skill chain

- Update from a markdown file → `anthropic-skills:pipeline-dashboard-update`
- Narrative framing change → `dashboard-framing-updates`
- Build interactive deal/sales tools → `anthropic-skills:negotiation-panel` or `anthropic-skills:sales-flow-tool`
