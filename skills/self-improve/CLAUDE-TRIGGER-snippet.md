# CLAUDE.md trigger snippet — self-improve LOOP

Paste this block into the global `~/.claude/CLAUDE.md` (Claude-specific layer 2;
see `OPERATOR-NOTES.md` "Three layers"). It wires the trigger that fires the
`self-improve` skill. The skill itself is tool-agnostic (layer 1) and lives at
`skills/self-improve/` in this repo, mirrored to `~/.claude/skills/self-improve/`.

```markdown
## Self-improvement LOOP (binding)

When ANY of these happen, invoke the `self-improve` skill to triage the change —
do not silently fix-and-forget:

- You **hand-fixed** something the scaffold should have handled (wrong path,
  missing guard, stale instruction).
- The **user corrected you**.
- You did the **same task a second time** (the repeat is the signal it should be
  captured).
- You **self-critiqued** mid-task.
- The user said **"improve the <X> skill"**, "capture this", "remember this
  gotcha", or "add a rule".

The skill classifies the change by risk and routes it:
- **LOW** (doc/wording/example/gotcha/comment/typo) → applies now + `changelog.md`.
- **HIGH** (skill-behavior/new-skill/hook/rule/permission/delete) → held in
  `review-<date>.md` for your sign-off; it NEVER self-applies.
- **UNCLEAR** → held in review, flagged.

You resolve held items with `approve` / `reject` / `approve-always`. Never bless
a class (`approve-always`) on the agent's behalf — that is always Ryan's call.
```

## Do-not-drift note

The single most important property: **HIGH changes never self-apply, and the
agent never runs `approve-always` itself.** Blessing a behavior class is a human
grant. If you ever find the agent blessing classes autonomously, that is the
drift failure mode — stop and clear `patterns.json`.
