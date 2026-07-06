# Promotion Process: Scaffold -> Runtime CLAUDE.md

Proposed per SI-0006 (approved by Ryan 2026-07-06: "Promotion process to runtime
CLAUDE.md to be proposed as a doc in this repo, applied only on Ryan's explicit go.").
This is a proposal, not yet an enforced or automated process. It describes how
promotion should work; nothing in this repo currently runs it automatically.

## The gap this closes

`OPERATOR-NOTES.md` frames this repo as the scaffold and the OneDrive tree
(`C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\CLAUDE.md`) as the runtime, but never
defined how a change moves from one to the other. Confirmed drift as of 2026-07-06, in
both directions, not just one:

- The scaffold (`EVERPASS/CLAUDE.md` in this repo) has a "Layer-1 identity files
  (selective-load)" section 11 subsection (SOUL/VOICE/AUDIENCE/DESIGN routing) that the
  runtime file does not have.
- The runtime file has a "section 13, Agent coding principles (Karpathy behavioral
  rules)" section that this repo's `EVERPASS/CLAUDE.md` does not have.

Neither file has been the sole source of truth in practice. They have simply diverged
because nothing ever synced them.

## Process (proposed)

1. **Diff, don't copy.** Any session preparing a promotion runs a diff between this
   repo's `EVERPASS/CLAUDE.md` (or whichever layer-1 file is being promoted) and the
   runtime file at `C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\CLAUDE.md`.
   Promotion is never a blind overwrite in either direction: the runtime file may have
   accumulated its own changes (see the section 13 example above) that the scaffold has
   not picked up either.
2. **Present the diff itself, not a summary of it.** Show Ryan the actual added/
   removed/changed lines, not a prose description. This carries over the standing
   Meticulous Document Editor and Verify-Never-Assume rules: don't paraphrase a change
   Ryan needs to see verbatim.
3. **Ryan approves per-hunk, not per-file.** A promotion may be "yes to the layer-1
   routing table, no to something else in the same diff." Default to asking, not
   batching everything together.
4. **Apply only the approved hunks** to the runtime file, as a normal targeted edit.
   This is a live file Ryan works from daily; no wholesale regeneration.
5. **Verify post-apply.** Re-read the runtime section that changed and confirm it
   matches what was approved, not just that the write succeeded.
6. **Log it.** One line in this repo (a commit message is enough; no separate ledger
   unless a durable promotion log turns out to be wanted) naming what was promoted and
   when, so the next promotion's diff starts from a known baseline.
7. **Never touch runtime as a side effect of unrelated scaffold work.** Promotion is
   always its own explicit step, triggered by Ryan asking for it or by a self-improve
   proposal he approves. Never bundled into a commit whose main purpose is something
   else.

## What this does not do

- Does not make promotion automatic. No hook, script, or scheduled task should apply
  runtime changes without Ryan's explicit go per promotion, per the SI-0006 decision
  note.
- Does not resolve the current drift by itself. The two confirmed gaps above (layer-1
  routing missing from runtime; Karpathy principles missing from scaffold) stay open
  until Ryan runs this process on them. Flagged here, not applied.

## Threshold (decided 2026-07-06)

Every promotion goes through the full per-hunk-approval process, regardless of size.
There is no auto-apply-and-tell-after threshold. The runtime file is a live, daily-use
HARD-rule surface; this mirrors the standing self-improve doctrine, where HIGH-risk
classes never self-apply and only Ryan can bless a class for future auto-apply
(`approve-always`). If promotion volume ever makes per-hunk approval a real burden,
Ryan can bless a narrow class (for example: non-HARD, additive-only, single-section)
at that point; do not propose or assume one before he does.
