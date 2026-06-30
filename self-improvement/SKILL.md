# Skill: self-improve

**Trigger:** End of any substantive session, or whenever you notice friction that
a change to a skill, hook, `CLAUDE.md` rule, SOP, or script would remove. Also
when the user says "improve yourself", "what did you learn", "log that lesson",
or "self-improve".

**Goal:** Turn a lesson from this session into a reviewable proposal so the fix
compounds instead of being re-discovered next time.

## Procedure

1. **Spot the improvement.** A repeated correction, a missing guardrail, a stale
   path, a step that should be automated, a rule that was ambiguous. One concrete
   change per proposal.

2. **Classify impact** (see `SPEC.md`):
   - `HIGH` — governance, hooks, source-of-truth rules, user-facing surfaces, or
     anything hard to reverse. *Always reviewed.*
   - `MED` — skill/SOP refinements, non-load-bearing scripts.
   - `LOW` — wording, comments, hygiene.

3. **Propose** (does not edit anything — just queues the decision):
   ```bash
   self-improvement/self-improve.sh propose \
     --impact HIGH \
     --title "Block external share of _archive/ paths" \
     --detail "Session leaked an archived deck into a draft share. Add path guard."
   ```
   `MED`/`LOW` may auto-approve if `config.json` allows; `HIGH` always queues.

4. **Review.** Show the user `self-improve.sh list`. For each item:
   ```bash
   self-improvement/self-improve.sh resolve SI-0001 --approve --note "agreed"
   self-improvement/self-improve.sh resolve SI-0002 --reject  --note "too broad"
   ```

5. **Apply approved changes** as a separate, deliberate edit to the real file
   (the skill, hook, `CLAUDE.md`, etc.). The loop logged the decision; you make
   the edit. Reference the `SI-NNNN` id in your commit message.

6. **Leave the queue clean.** The Stop hook will remind you at session end if you
   didn't. A clean queue is the steady state.

## Don't

- Don't auto-approve `HIGH` — the engine won't let you, don't try to route around it.
- Don't bundle five changes into one proposal — one reviewable change each.
- Don't treat "logged" as "applied". Logging records intent; the edit is real work.
