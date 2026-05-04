# Content Partnerships — Subtree Rules

Auto-loaded for any session whose CWD is under `CONTENT PARTNERSHIPS/`. Stacks on top of the EVERPASS root `CLAUDE.md`.

## Folder structure (canonical)

```
CONTENT PARTNERSHIPS/
  Broadcast Streaming Networks/
    DISNEY/
      Negotiation Folder/
      Existing Deal/         ← protected (PreToolUse block)
      <partner>_insights.md  ← upstream source of truth
    NBCU/
    ESPN/
    ...
  Sports Leagues/
  RSN/
  DTC Apps/
  ...
```

## Folder path = source of truth (HARD)

The on-disk folder path determines the partner's category and group. Dashboard, daily brief, NotebookLM, and the wiki are projections.

- Dashboard says "X is in DTC" but folder says `Sports Leagues/X/` → fix the dashboard. **Never** move the folder unless Ryan explicitly says so.
- Recategorization is a Ryan-only operation. Claude flags the discrepancy and stops.

## Partner insights — primary artifact

Every partner has one canonical `*_insights.md` (or similar) file inside the partner folder. That file is the single source of truth for the partner. See `.claude/rules/partner-insights.md` for the path-scoped edit rules.

- Append new entries to the bottom with the canonical header: `[YYYY-MM-DD] [TYPE] subject`.
- Skill: `anthropic-skills:partner-insights` for create/update.
- Skill: `gmail-to-partner-insights` / `outlook-to-partner-insights` for piping email threads.

## Bridge to canonical Partner Insights

After any insights edit, run `sync-partner-insights.py` to mirror to the canonical `Partner Insights/` directory. The bridge is idempotent and reversible. Coverage 38/38 as of 2026-04-26.

Source-limited partners (no automated extraction): `fanduel`. Update by hand.

## Negotiation Folder — audit logged

Every Edit/Write inside any `Negotiation Folder/` is logged automatically to `Operations & Strategy/.negotiation-audit.log`. See `.claude/rules/legal-redline.md` for the redline workflow.

## Existing Deal — protected

`Existing Deal/` paths contain fully executed agreements. **PreToolUse hook blocks Edit/Write.** Override = explicit interactive Ryan approval only.

## New partners — NP-001

Onboarding a new partner follows the locked NP-001 procedure at:
`EVERPASS TOOLS/Dashboard/_support/docs/governance/new-partner-onboarding.md`

LG completed this procedure 2026-04-20. Future partners (NASCAR, Red Bull, etc.) MUST follow NP-001.

## RSN deals

The RSN Deals page has a frozen v1 contract pipeline. Do not edit Skills A/B/C, `adjudicate.py`, staging JSON, or RSN Deals page files without explicit new-scope. Operator flow: drop JSON in `staging/` → re-run build.

## TWDC long-form

Disney master agreement: only v1 base draft (`..._DRAFT_2026-04-24.md`) persists on disk. v2/v3/v4 in-session iterations were not saved. Confirm with Ryan whether to re-run legal-review pass before circulating.
