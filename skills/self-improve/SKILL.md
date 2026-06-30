---
name: self-improve
description: >-
  The self-improvement LOOP. Invoke whenever you hand-fix something the agent
  should have known, the user corrects you, you do the same task a second time,
  you self-critique, or the user says "improve this skill / capture this /
  remember this gotcha." Triages every proposed change to the agent's own
  scaffold (skills, hooks, rules, docs) by risk: low-risk lands now, anything
  that changes behavior waits for sign-off.
---

# self-improve — the LOOP

This skill is how the agent gets better at its own job over time without going
off the rails. It is a faithful implementation of Austin Marchese's "LOOP"
pattern: a proposed self-change is **triaged by risk**, then routed.

## When to fire

Trigger this skill when any of these happen:

- You **hand-fixed** something the scaffold should have handled (a wrong path, a
  missing guard, a stale instruction).
- The **user corrected you** ("no, do it this way", "you forgot X").
- You did the **same task a second time** — the second time is the signal it
  should be a skill or a documented step.
- You **self-critiqued** mid-task ("I should have checked freshness first").
- The user explicitly says **"improve the <X> skill to do Y"**, "capture this",
  "remember this gotcha", "add a rule".

## What it does

For each proposed change, classify a **category** and let the engine route it:

| Risk | Categories | Route |
|------|-----------|-------|
| **LOW** | `doc` `wording` `example` `gotcha` `comment` `typo` | **Applies now** + logged to `changelog.md` |
| **HIGH** | `skill-behavior` `new-skill` `hook` `new-hook` `rule` `permission` `delete` | **Held in `review-<date>.md`** for sign-off — never self-applies |
| **UNCLEAR** | anything else | Held in review, flagged ⚠️ for a human call |

The human resolves HIGH/UNCLEAR items with `approve`, `reject`, or
`approve-always`. **`approve-always`** blesses that *class* so future changes in
it auto-apply — the agent learns where it's trusted, one explicit grant at a
time. Blessed classes start **empty**: a fresh install gates every behavior
change.

## The two failure modes it refuses

1. **Full autonomy** — agent edits its own behavior unsupervised → drift / rot.
   *Refused:* HIGH never self-applies.
2. **Review-everything** — every trivial doc tweak needs a human → nobody runs
   it. *Refused:* LOW lands instantly.

## Usage

```bash
# Propose a change (the agent calls this when a trigger fires):
python3 self_improve.py triage \
  --category gotcha --target "watch/SKILL.md" \
  --summary "default to focused-window capture on recordings >10min"

# A skill-behavior change is held for you instead:
python3 self_improve.py triage \
  --category skill-behavior --target "watch/SKILL.md" \
  --summary "auto-stop recording at 5min"   # -> review-<date>.md

# You resolve pending items:
python3 self_improve.py status
python3 self_improve.py decide --id <id> --action approve
python3 self_improve.py decide --id <id> --action reject
python3 self_improve.py decide --id <id> --action approve-always   # bless the class

# Dogfood the whole loop:
python3 self_improve.py selftest
```

State lives under `_state/` (git-ignored): `patterns.json` (blessed classes),
`changelog.md` (applied LOW changes), `review-<date>.md` (pending), `queue.json`.

## Mirror note

This is the **repo mirror** of the live skill at
`~/.claude/skills/self-improve/`. Per `OPERATOR-NOTES.md` the repo is the
source of truth for the scaffold; the live `~/.claude` tree is the runtime.
Edit here, then sync to `~/.claude/skills/self-improve/`.

See `SELF-IMPROVE-SPEC.md` for the full design and `HANDOFF-2026-06-29-self-improvement-loop.md`
for cold-start context.
