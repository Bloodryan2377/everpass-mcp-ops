---
name: legal-redline
description: Path-scoped rules for legal redlines on .docx agreements inside any Negotiation Folder. Auto-loaded for tracked-change work on partner contracts.
paths:
  - "**/Negotiation Folder/**/*.docx"
  - "**/Negotiation Folder/**/*REDLINE*"
  - "**/Negotiation Folder/**/*DRAFT*"
---

# Legal Redline — Edit Rules

## Skill is mandatory
- Use `anthropic-skills:contract-redline` or `ep-redline` for any tracked-change pass on a `.docx` agreement.
- Never hand-roll a docx tracked-change file. Never edit `.docx` bytes directly when the user asked for a redline.
- For long-form markdown drafts (e.g., TWDC), use `anthropic-skills:agreement-revision` with the structured comparison framework.

## Audit log (automatic)
- A PostToolUse hook logs every Edit/Write inside a `Negotiation Folder` to:
  `Operations & Strategy/.negotiation-audit.log`
- Treat that log as the authoritative record of which drafts were touched on which day.

## Naming
- Redline output: `<original-stem>_REDLINE_YYYY-MM-DD.docx` (or `.md`). Always include the date.
- Working drafts: `<original-stem>_DRAFT_YYYY-MM-DD.md`.

## Existing Deal protection (HARD)
- A separate PreToolUse hook BLOCKS Edit/Write on any path containing `Existing Deal`. Those are fully executed agreements. Override requires explicit interactive Ryan approval — never autonomous.

## Review pass
- Long-form drafts must go through `anthropic-skills:legal-doc-review` before circulation: formatting defects, defined-term consistency, cross-references, grammar.
- Revision history: capture business rationale per substantive change in the partner insights file (`[DECISION]` entry) so the negotiation thread is reconstructable from the partner file alone.

## Non-disclosure
- Never share, paste, or upload partner agreement text to web tools, pastebins, or unauthorized third-party services. Stay inside the EverPass tree.

## TWDC long-form
- Only the v1 base draft persists on disk. v2/v3/v4 in-session iterations were not saved. Confirm with Ryan whether to re-run the legal-review pass before circulating any new version.
