# REVIEW-QUEUE — HIGH proposals awaiting Ryan's sign-off

These are behavior-changing self-improvements the LOOP triaged to **HIGH** during
the 2026-06-30 dogfood session. They are **not applied** — HIGH never self-applies.

> **Why this file exists (and isn't `_state/review-<date>.md`):** this session
> ran in an ephemeral remote container where `_state/` is git-ignored and gets
> wiped on teardown — so the engine's normal review queue would lose these. This
> committed file is the durable hand-off. (Proposal #1 below is to fix that gap
> in the engine itself, so future remote runs don't need this manual step.)

Resolve each on your box after `install.py`, or tell me to proceed:

```bash
python3 skills/self-improve/self_improve.py status        # re-triage locally if desired
# then, per item:
python3 skills/self-improve/self_improve.py decide --id <id> --action {approve,reject,approve-always}
```

---

## Proposal #1 — persist the review queue outside git-ignored `_state`
- **id (this session):** `b6b44f91e6`
- **category:** `skill-behavior` (HIGH)
- **target:** `self_improve.py`
- **What:** When running in an ephemeral/remote environment, write the review
  queue (and changelog) to a **committed** path rather than git-ignored `_state/`,
  so HIGH proposals raised by a remote agent survive container teardown.
- **Why:** Gap found this session — a remote LOOP run's review items vanish with
  the container. The whole point of the review queue is that a human resolves it
  later; "later" often means a different machine/session.
- **Sketch:** add `--persist-dir` (or detect `CI`/remote env) that points the
  queue + changelog at a tracked location (e.g. `skills/self-improve/queue/`);
  keep `patterns.json` blessing rules unchanged; ensure the path is NOT in
  `.gitignore`. Add a selftest invariant that a persisted queue round-trips.
- **Risk note:** changes where state lives + adds env-detection → review, not
  auto. Confirm the committed path and whether to auto-detect remote vs. require
  the flag.

## Proposal #2 — add a `learn` subcommand (session-retro sugar)
- **id (this session):** `23dca55f27`
- **category:** `new-skill` (HIGH)
- **target:** `self_improve.py`
- **What:** A `learn` subcommand that captures a session lesson and triages it in
  one step — sugar over `triage`, to make end-of-session retros a one-liner and
  encourage the habit.
- **Why:** This session's "evolve the system" pass was done by hand-stringing
  several `triage` calls. A single `learn "<lesson>" [--category gotcha]` lowers
  the friction so the LOOP actually gets run at the end of real work.
- **Sketch:** `learn` defaults category to `gotcha`, target to `LESSONS.md`,
  prints the routed decision; everything else flows through existing `triage`.
- **Risk note:** new user-facing behavior/command surface → review. Cheap and
  additive; likely a quick approve, but it's your call (and a candidate for
  `approve-always` on the `new-skill` class if you want future sugar to land
  faster — though blessing `new-skill` widens auto-apply, so probably not).
