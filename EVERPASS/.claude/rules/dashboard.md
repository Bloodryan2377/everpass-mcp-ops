---
name: dashboard
description: Path-scoped rules for the EverPass dashboard, cockpit, and supporting JSON feeds. Auto-loaded when editing dashboard files.
paths:
  - "EVERPASS TOOLS/Dashboard/**"
  - "EVERPASS TOOLS/**/dashboard*"
  - "EVERPASS TOOLS/Daily SOP/wiki-updates.json"
  - "EVERPASS TOOLS/AI Related/health/freshness-status.json"
---

# Dashboard Edit Rules

## Live file is authoritative
`Dashboard\EverPass Media _ Content Pipeline Decision-Making Dashboard.html` is the single source of truth. Manual edits ALWAYS win.

**Why:** Confirmed by Ryan 2026-04-12 — there is no point in live work if it can be overwritten by automation. Architectural rule, not preference.

**How to apply:**
1. **Backup follows live.** Sync `.bak` to current live file before any pipeline run. Drift detection is informational only — never block work.
2. **Merge-only injection.** Auto-pipeline and scheduled tasks may only ADD new entries (IDs not already present). If an entry ID already exists, skip. If `goNoGoData` / `economicsData` / `negotiationData` field has a non-empty value, do not overwrite.
3. Scope: ALL skills, ALL scheduled tasks, ALL sessions. No exceptions without explicit interactive Ryan approval.

## Router menu (mandatory in interactive mode)
Before any dashboard change in an interactive session, present this exact format:

```
Before I make the dashboard update, which command should I apply?

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

Reply with the command to use, and include the property slug if needed.
```

**Autonomy override:** if the session/task prompt contains explicit autonomous-execution instruction, skip the menu, log `Execution mode: autonomous; router bypassed via precedence rule`, infer the command, state it in one line, execute.

## JS validation gate (non-negotiable)
After any dashboard injection that touches the `pipelineIntelligence` array:
1. Extract all `<script>` blocks; run `node --check` on each.
2. Verify each entry has `{ ... details: [ ... ] }` fully closed, entries comma-separated, only the final entry before `];` omits trailing comma.
3. Never restore from `.bak` without syntax-checking the backup first — backup can itself be corrupted.

**Origin:** 2026-04-10 incident — premature `];` and missing closers broke all property card clicks; the bug was also in the .bak.

## Splice safety
- Splice at smallest unit (card, row, partner block). Never at file level.
- For `embeddedSubPages` base64 inserts: work in raw bytes with CRLF endings; locate by finding `var embeddedSubPages = {` ... `};`. Never regex the full file.

## Backups
Pre-destructive snapshots go to `Dashboard - Backups\` with timestamp.
