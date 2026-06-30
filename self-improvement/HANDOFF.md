# HANDOFF — Self-Improvement Loop (2026-06-30)

Paste this file into a fresh local session to pick up cleanly.

## TL;DR

The self-improvement loop is **built, tested, dogfooded, committed, and pushed**
on branch `claude/self-improvement-loop-complete-3b7s3k` (PR **#4**, ready for
review, `mergeable_state: clean`). One decision is open: **merge into `main`**.

> A prior session reported this as "shipped + verified" but had committed
> nothing — the branch equaled `main` and no files existed. That is the lesson
> now encoded as rule SI-0001. Verify everything below with `git log` against
> `origin`, don't take this note's word for it.

## ⚠️ FIRST STEPS in the local session (do these before editing anything)

```bash
git fetch origin claude/self-improvement-loop-complete-3b7s3k
git checkout claude/self-improvement-loop-complete-3b7s3k
git pull origin claude/self-improvement-loop-complete-3b7s3k

# Overlap guard — is another session (e.g. the web session) still active?
self-improvement/session-guard.sh check
```

`check` reads a lock file (`self-improvement/.active-session.json`) that active
sessions push to the remote. **Expect it to WARN** at first: the web session
that wrote this handoff registers itself as active. That is the guard working.

To take this branch over locally, once the web session is confirmed done
(tell it to `unsubscribe` / stand down, or just confirm it's idle):

```bash
self-improvement/session-guard.sh acquire     # claims the branch for this session
# ... work ...
self-improvement/session-guard.sh release      # when you stop
```

A lock older than 45 min (`SESSION_GUARD_TTL_MIN`) is treated as stale and does
not block — so a dead session can't wedge the branch.

## What exists (verify on disk)

```
self-improvement/
  self-improve.sh          engine: propose / list / resolve / status / log
  self-improve-status.sh   Stop-hook wrapper (silent when queue clean)
  session-guard.sh         overlap guard: check / acquire / release / whoami
  settings.stop-hook.json  snippet to register the Stop hook in settings.json
  config.json              auto-approve policy (empty -> everything reviews)
  queue.json               pending review queue (clean)
  log.jsonl                decision log — holds SI-0001 (HIGH) + SI-0002 (MED)
  .active-session.json     session-guard lock
  SPEC.md / SKILL.md / README.md / HANDOFF.md
EVERPASS/CLAUDE.md         §8 skills-map row + §6 "Definition of done" (HARD)
CHANGELOG.md               2026-06-30 entry
```

## Open decision

- **Merge PR #4 into `main`?** It's clean and ready. The web session is holding
  on this — say "merge" there, or merge locally:
  `gh pr merge 4 --squash --delete-branch` (or the GitHub UI).

## To activate the Stop hook on THIS (local) box — the one durable step left

1. Back up `settings.json`.
2. Merge the `Stop` array from `self-improvement/settings.stop-hook.json` into the
   `hooks` object of your Claude Code `settings.json`. Fix the absolute path to
   point at *this machine's* `self-improve-status.sh`.
3. Validate: `jq . settings.json` must parse.

After that, every session end runs `self-improve.sh status --hook`: silent when
the queue is clean, surfaces pending proposals otherwise.

## Operating the loop (quick ref)

```bash
self-improvement/self-improve.sh propose --impact HIGH --title "..." --detail "..."
self-improvement/self-improve.sh list
self-improvement/self-improve.sh resolve SI-0003 --approve --note "..."
self-improvement/self-improve.sh log -n 10
```

HIGH always queues for human review (enforced in code). `resolve` only logs the
decision — applying the real edit is a separate step; reference the `SI-NNNN` id
in the commit. Then **commit + push** (rule SI-0001).

## Local-box cleanup requested (web session can't reach C:\)

Ryan asked to get `C:\Users\ryan\Desktop\.playwright-mcp` off the desktop. The
web session runs in a remote Linux container and cannot touch the local `C:\`
drive, so do this in the local session. Per `EVERPASS/CLAUDE.md`, desktop leaks
are normally archived, not hard-deleted — but `.playwright-mcp` is a Playwright
MCP working/output dir (tool cache), safe to remove:

```powershell
# delete it
Remove-Item -Recurse -Force "C:\Users\ryan\Desktop\.playwright-mcp"
# …or, to follow the archive-don't-delete doctrine:
Move-Item "C:\Users\ryan\Desktop\.playwright-mcp" `
  "C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\_archive\desktop-sweep\"
```

## State of the web session that wrote this

- Subscribed to PR #4 activity; hourly self check-in armed (auto-expires 7 days).
- Registered as active in `.active-session.json` — that's what your `check` trips on.
- It will not merge `main` without an explicit "merge". Stand it down by telling
  it to `unsubscribe`, or just let the container go idle and the lock go stale.
