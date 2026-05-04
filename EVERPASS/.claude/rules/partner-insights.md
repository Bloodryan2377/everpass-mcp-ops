---
name: partner-insights
description: Path-scoped rules for partner insights files. Auto-loaded when editing any *insights*.md under Content Partnerships.
paths:
  - "CONTENT PARTNERSHIPS/**/*insights*.md"
  - "Content Partnerships/**/*insights*.md"
---

# Partner Insights — Edit Rules

These rules govern any partner intelligence file under `CONTENT PARTNERSHIPS/<group>/<partner>/`. They override generic doc conventions when in conflict.

## Source of truth
- The on-disk insights file is the **single source of truth** for the partner. Dashboard cards, daily briefs, wiki, and `wiki-updates.json` are projections of it — never the other way around.
- Folder path determines category/group. Disagreement with the dashboard means the dashboard is wrong; never relocate the folder unless Ryan explicitly says so.
- Use the `anthropic-skills:partner-insights` skill for create/update. Triggers: "add partner insight", "log a meeting note", "update partner file".

## Entry format (canonical)
Every new entry is appended to the bottom of the file with this header:

```
[YYYY-MM-DD] [TYPE] One-line subject
Source: <person-or-doc>
```

`TYPE` ∈ `MEETING | EMAIL | DOC | DEAL | NOTE | DECISION | RISK`. Use `[EMAIL]` for items piped via `outlook-to-partner-insights` or `gmail-to-partner-insights`. Use `[DOC]` for new contracts/term sheets.

## No individual names in external-facing content
- Internal entries may reference individuals by name.
- Anything that flows downstream into external surfaces (decks, exec briefs, dashboard narrative bundles, daily-brief external versions) must use **team or function** (Sales, Content, Legal) and **company/brand** (Disney, ESPN, NBCU). Strip individual names at the projection step, not in the source file.

## Frontmatter `updated` field
- Maintain YAML frontmatter `updated:` to today's date (max = today). Do not push milestone or future dates into `updated`.
- Never use filesystem mtime as the timestamp.

## Idempotent bridge
- After any edit, the Phase 1C bridge (`sync-partner-insights.py`) must be re-run to mirror to canonical `Partner Insights/`. Bridge is reversible and idempotent — re-running is safe.
- 38/38 partner coverage as of 2026-04-26. New properties require `[NEW PROPERTY]` auth before dashboard injection.

## Privacy / PII
- Salaries, personal contact info, individual performance assessments stay out of insights files unless explicitly required for the deal. If included, mark with `INTERNAL ONLY` on the entry header.

## Email-sourced entries (HARD)
- Claude **never sends email**. Outlook/Gmail integration is read-only into insights files. Always stop at draft.

## Companion artifacts
- After meaningful change, also rebuild `wiki-updates.json` via `build-wiki-updates.py` so the cockpit `#daily-update` panel reflects the new state.
- Cockpit three-layer sync doctrine (CS-001): "up to date" = dashboard + partner wiki + daily brief synced for every property touched.
