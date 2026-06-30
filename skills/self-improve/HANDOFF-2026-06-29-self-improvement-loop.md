# HANDOFF — agent self-improvement LOOP (2026-06-29)

Cold-start context for whoever (human or agent) picks this up next.

## TL;DR

Built an agent-wide **self-improvement LOOP**: every proposed change to the
agent's own scaffold is triaged by risk — low-risk lands now + is logged,
anything that changes behavior waits for human sign-off, and the human can
`approve-always` to bless a class so it auto-applies next time. Defaults are
empty = safe. Tested end-to-end; dogfooding caught and fixed a real drift bug.

## Where it lives

- **Repo mirror (source of truth):** `skills/self-improve/` in
  `Bloodryan2377/everpass-mcp-ops`.
  - `self_improve.py` — the triage engine + built-in `selftest`.
  - `SKILL.md` — when-to-fire + usage.
  - `SELF-IMPROVE-SPEC.md` — full design, invariants, the dogfood catch.
  - `CLAUDE-TRIGGER-snippet.md` — paste-in block for global `~/.claude/CLAUDE.md`.
  - `_state/` — runtime state (git-ignored).
- **Live runtime:** `~/.claude/skills/self-improve/` on the Windows box. Per
  `OPERATOR-NOTES.md`, the repo is source of truth, `~/.claude` is the runtime —
  edit in the repo, then sync out.

## How it works (the LOOP)

| Risk | Categories | Route |
|------|-----------|-------|
| LOW | doc, wording, example, gotcha, comment, typo | apply now + `changelog.md` |
| HIGH | skill-behavior, new-skill, hook, new-hook, rule, permission, delete | hold in `review-<date>.md` for sign-off |
| UNCLEAR | anything else | hold in review, flagged ⚠️ |

Resolve held items: `approve` / `reject` / `approve-always` (blesses the class).
`approve-always` writes the category into `patterns.json`; from then on that
class routes like LOW. `patterns.json` is empty by default.

The two failure modes it refuses: **full autonomy** (drift) and
**review-everything** (unsustainable).

## How it's wired

- **Trigger** belongs in global `~/.claude/CLAUDE.md` — fires on a hand-fix, a
  user correction, doing a task twice, a self-critique, or "improve this skill."
  See `CLAUDE-TRIGGER-snippet.md`.
- Skill is registered + discoverable once the dir is under `~/.claude/skills/`.

## Proof it works (and the honest catch)

`python3 self_improve.py selftest` passes. During the first smoke test,
`skill-behavior` got blessed as part of setup — which would have let skill edits
self-apply, the exact drift the system exists to stop. Cleared it; re-verified
HIGH routes to review; added invariants 3/6/7 to `selftest` so the regression
can't return silently. Patterns empty by default = safe.

## Related skill work (same session)

- **watch** skill upgraded (clone preserved): compounding "second-brain" loop —
  named use-cases (hook teardown, screen-recording debug, creator study),
  default focused-window capture on recordings >10min.
- **Video/design lessons** captured; they mostly reinforce existing scaffold
  (ep-design-system as single source of truth, firecrawl for brand-scrape,
  MOTION-LAYER for explainers).

## Open / optional next steps

1. ~~**Stop-hook** to surface pending-review count at session end.~~ **Done** —
   `hooks/stop-snippet.json` + `self_improve.py stop-hook`. Paste under the
   `Stop` key in `~/.claude/settings.json` on the live box.
2. ~~**Periodic guard** that warns when review items age past N days.~~ **Done**
   — `hooks/sessionStart-snippet.json` + `self_improve.py guard --max-age-days N`
   (default 7). Paste under the `SessionStart` key in `~/.claude/settings.json`.
3. Explicit **MOTION-LAYER** note in the design docs.
4. A formal **skill-from-masters** pass (currently substituted by 5 real
   practitioner videos — golden + real failure cases, stronger than web search).

## Try it

> "improve the watch skill to do X"

Watch it triage: low-risk lands in `changelog.md`; anything that edits behavior
lands in `review-<date>.md` for your sign-off.
