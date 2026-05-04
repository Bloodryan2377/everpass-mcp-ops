---
name: contracts
description: Path-scoped rules for contract markdowns and the Contract Master workbook. Auto-loaded when editing _contracts_md* trees or any Contract Master file.
paths:
  - "**/_contracts_md*/**"
  - "**/Contract Master*"
  - "EVERPASS TOOLS/contract-master-*.json"
---

# Contracts & Contract Master — Edit Rules

## Source-of-truth model
- **Standalone markdowns** under `*/_contracts_md*/` are the **sole upstream source**. 54 files as of 2026-04-25 audit.
- **`Contract Master.xlsx`** is the canonical deal brain (3-table relational, 5 sheets, 77 rows). Built from the markdowns by the `contract-master` skill.
- **`EVERPASS TOOLS/contract-master-*.json`** are derived JSON exports. Read-only as outputs.
- Dashboard HTML wiring of the Contract Master is **deferred** — do not couple to it without Ryan's explicit go-ahead.

## Edit precedence
1. Markdown is upstream. Edit the markdown first.
2. Re-run `contract-master` skill audit to refresh xlsx + JSON exports.
3. Never hand-edit the xlsx as the primary action. Hand edits to xlsx must be back-propagated to the markdown by hand or flagged for the next audit.

## Audit gate
- Run the Contract Master audit before any external/exec-facing share of contract counts, expirations, or economics. Last passing audit: 2026-04-25.

## Existing Deal folder protection
- Files under any path containing `Existing Deal` are fully executed agreements. PreToolUse hook blocks Edit/Write on these — only proceed with Ryan's explicit interactive approval.

## Negotiation Folder audit trail
- Any Edit/Write inside a `Negotiation Folder` is logged automatically to `Operations & Strategy/.negotiation-audit.log` by a PostToolUse hook. Treat the log as authoritative for "did I touch this draft today".

## Redlines
- Redlines on `.docx` agreements use the `anthropic-skills:contract-redline` or `ep-redline` skill. Never hand-roll a tracked-change file.
- Redline output naming: keep the original filename and append `_REDLINE_YYYY-MM-DD` before the extension.

## Drafts
- Working drafts: keep in the partner's `Negotiation Folder/` with `_DRAFT_YYYY-MM-DD.md` suffix.
- Long-form master agreements (e.g., TWDC) are markdown-first; only convert to .docx for circulation, and only after legal-review pass.
