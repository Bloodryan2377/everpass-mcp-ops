# SELF-IMPROVE — START HERE

This is the one file to open when you sit down to finish wiring the
self-improvement LOOP into your live Claude Code. It is **two things at once**:

1. **Run-it-yourself** — copy-paste commands for your box (below).
2. **A cold-start handoff** — paste the "Prompt for a new Claude session" block
   into a fresh Claude Code session and it will do the whole thing for you.

Everything is already built, tested, and committed on branch
`claude/agent-self-improvement-loop-gtvk0b` (PR #2). What's left is **local
install + two decisions only you can make.**

---

## A. Run it yourself (≈2 minutes, Git Bash on Windows)

```bash
# 1. Get the branch
cd /c/Users/ryan/code/everpass-mcp-ops        # your local clone path
git fetch origin claude/agent-self-improvement-loop-gtvk0b
git checkout claude/agent-self-improvement-loop-gtvk0b
git pull origin claude/agent-self-improvement-loop-gtvk0b

# 2. Prove the engine is healthy (expect: SELFTEST PASSED)
python skills/self-improve/self_improve.py selftest

# 3. Preview the install — changes nothing
python skills/self-improve/install.py --dry-run

# 4. Apply it: copies the skill into ~/.claude/skills/, merges the Stop +
#    SessionStart hooks into ~/.claude/settings.json (your other hooks untouched),
#    appends the trigger block to ~/.claude/CLAUDE.md. Backs up before editing.
python skills/self-improve/install.py

# 5. Restart Claude Code (or start a new session) so the hooks + trigger load.
```

That's the install. The two **decisions** below are optional but recommended.

---

## B. Two decisions only you can make

### B1. Add the 5 practitioner video links (1 minute)
`skills/self-improve/MASTERS.md` cites "5 practitioner videos (incl. Austin
Marchese's LOOP)" as the golden source but has a **placeholder** for the actual
links. Paste the 5 titles/URLs into the "Primary source" section so the
provenance is concrete. (I won't fabricate links.)

### B2. Resolve the 2 held proposals
`skills/self-improve/REVIEW-QUEUE.md` holds two **HIGH** (behavior-changing)
self-improvements the LOOP refused to self-apply:

- **#1** Persist the review queue outside git-ignored `_state` so remote/ephemeral
  runs don't lose proposals on teardown.
- **#2** Add a `learn` subcommand for one-line session retros.

Approve, reject, or ask Claude to implement them:

```bash
python skills/self-improve/self_improve.py decide --id <id> --action approve
# ids are listed in REVIEW-QUEUE.md
```

---

## C. Prompt for a new Claude session (the handoff)

Open Claude Code in this repo and paste this verbatim:

> Read `SELF-IMPROVE-START-HERE.md` and `skills/self-improve/HANDOFF-2026-06-29-self-improvement-loop.md`,
> then finish wiring the self-improvement LOOP for me. Specifically:
>
> 1. Run `python skills/self-improve/self_improve.py selftest` and confirm it passes.
>    If it fails, stop and show me the failure.
> 2. Run `python skills/self-improve/install.py --dry-run`, show me the plan, then
>    run `python skills/self-improve/install.py` to sync into my live `~/.claude`.
>    Confirm the Stop + SessionStart hooks and the trigger block landed, and that
>    my existing hooks/settings were preserved (it backs up first).
> 3. Ask me for the 5 practitioner video titles/links and write them into
>    `skills/self-improve/MASTERS.md` (replace the placeholder). Do not invent links.
> 4. Walk me through the two HIGH proposals in `skills/self-improve/REVIEW-QUEUE.md`
>    one at a time. For each, get my explicit approve/reject. These are HIGH — do
>    NOT implement either without my approval. On approval, implement it, route the
>    change through the LOOP, extend the `selftest` to cover it, re-run `selftest`,
>    and commit.
> 5. After any code change: re-run `selftest`, commit on a branch (not `main`), and
>    push. Open/Update PR #2 if needed.
>
> Rules: the LOOP's core invariant is that HIGH changes never self-apply and you
> never run `approve-always` on my behalf — blessing a class is my call. Keep
> runtime `_state/` out of git. If anything is ambiguous, ask me before acting.

---

## D. What you already have (context)

| Piece | File |
|---|---|
| Triage engine + selftest | `skills/self-improve/self_improve.py` |
| When-to-fire + usage | `skills/self-improve/SKILL.md` |
| Full design + invariants | `skills/self-improve/SELF-IMPROVE-SPEC.md` |
| Cold-start context | `skills/self-improve/HANDOFF-2026-06-29-self-improvement-loop.md` |
| One-command installer | `skills/self-improve/install.py` |
| Masters provenance | `skills/self-improve/MASTERS.md` (needs your 5 links) |
| Captured recipes | `skills/self-improve/LESSONS.md` |
| Held HIGH proposals | `skills/self-improve/REVIEW-QUEUE.md` (needs your decisions) |
| Stop / SessionStart hooks | `hooks/stop-snippet.json`, `hooks/sessionStart-snippet.json` |
| MOTION-LAYER (approved v1) | `EVERPASS TOOLS/Presentations/MOTION-LAYER.md` + `.claude/rules/motion-layer.md` |
| Worked motion example | `EVERPASS TOOLS/Presentations/motion-layer-reference-explainer.html` |

The LOOP in one line: proposed self-changes are triaged by risk — **LOW**
(doc/gotcha/example) applies now + logs to `changelog.md`; **HIGH** (skill
behavior / new skill / hook / rule / permission / delete) waits in
`review-<date>.md` for your sign-off; `approve-always` blesses a class. Defaults
empty = safe.
