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
  - `install.py` — one-command sync repo → live `~/.claude` (see "Install" below).
  - `MASTERS.md` — skill-from-masters provenance (videos primary + web corrob.).
  - `_state/` — runtime state (git-ignored).
- **Design carry-over draft:** `EVERPASS TOOLS/Presentations/MOTION-LAYER.md`
  (held in the LOOP review queue for sign-off).
  - Hook snippets live one level up in `hooks/`: `stop-snippet.json`,
    `sessionStart-snippet.json`.
- **Live runtime:** `~/.claude/skills/self-improve/` on the Windows box. Per
  `OPERATOR-NOTES.md`, the repo is source of truth, `~/.claude` is the runtime —
  edit in the repo, then sync out.

## Install (repo → live ~/.claude)

Run on the box with the live `~/.claude` (Git Bash on Windows). The repo mirror
is canonical; this pushes it into the runtime in one step:

```bash
cd /path/to/everpass-mcp-ops
git pull
python skills/self-improve/install.py --dry-run   # preview
python skills/self-improve/install.py             # apply
```

It copies the skill files into `~/.claude/skills/self-improve/`, merges the Stop
+ SessionStart hook snippets into `~/.claude/settings.json` (leaving your other
hooks untouched), and appends the trigger block to `~/.claude/CLAUDE.md`.
Idempotent (re-run = update in place, no duplication) and backs up
`settings.json` / `CLAUDE.md` before editing. Restart Claude Code afterward to
load the hooks. **This is the manual step a remote/ephemeral agent cannot do for
you** — the live `~/.claude` is on your machine, unreachable from a cloud
container.

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
  MOTION-LAYER for explainers — see the two carry-over items below).

## Carry-over: MOTION-LAYER (design docs)

**What:** Make MOTION-LAYER an explicit, named layer in the design-system docs,
the way `ep-design-system` is already the single source of truth for static
brand and `firecrawl` is the named tool for brand-scrape. MOTION-LAYER is the
animation/explainer layer — the conventions for explainer video and motion
(timing, easing, build order, how an explainer is assembled on top of the static
design system).

**Why it's carried over:** In this session it was only referenced in passing as
"MOTION-LAYER for explainers." It is not yet written down as a first-class layer
in the design-system docs, so it isn't discoverable or enforceable the way the
static layer is. The risk is drift: explainers get built ad hoc instead of
against a named, versioned motion spec.

**Status (2026-06-30): DRAFTED + routed through the LOOP.** Draft lives at
`EVERPASS TOOLS/Presentations/MOTION-LAYER.md` — names the layer, positions it on
top of `ep-design-system`, encodes restrained-motion conventions (reconciled with
the "avoid heavy animation" house style), with numeric defaults flagged
_(proposed)_. Routed as category `rule` → **HIGH → held in `review-<date>.md` for
Ryan's sign-off** (it is not yet canon).

**Next action:** Ryan reviews the proposed motion defaults + open questions at the
bottom of the draft, then `self_improve.py decide --id <id> --action approve`
(or supply canonical motion tokens from `ep-design-system` and re-draft). On
approval, consider promoting it to a path-scoped rule under `.claude/rules/`.

## Carry-over: skill-from-masters pass (formal)

**What:** `skill-from-masters` is the pattern of building/refining a skill by
studying how expert practitioners actually do the task, rather than from a
generic web search. The formal pass for the self-improve skill was **not** run
in its default form.

**Why it's carried over / what was substituted:** Instead of the skill's default
web-search-the-masters step, this session substituted **5 real practitioner
videos** (incl. Austin Marchese's LOOP). That substitution is deliberately
*stronger*, not a shortcut: the videos carry real failure cases from real
practitioners — the two failure modes this LOOP refuses (full autonomy → drift;
review-everything → unsustainable) came straight from them — which a web search
would not surface as vividly. The open item is to run the **formal**
skill-from-masters pass and reconcile it against what the videos already taught,
so the provenance is captured in the skill itself.

**Status (2026-06-30): DONE.** Formal pass run and recorded in `MASTERS.md`:
videos cited as primary/golden source; a June-2026 web pass corroborates the
design from independent sources (it did **not** surface "Austin Marchese" by
name, so the videos stay primary). Net-new guidance — naming the three memory
types (semantic/episodic/working) — was the only divergence; folded in via the
LOOP as a `doc` (LOW → auto-applied to `SELF-IMPROVE-SPEC.md`). **Zero behavior
(HIGH) changes** — masters and corroboration agree.

**Next action:** Drop the 5 concrete video titles/links into `MASTERS.md` (they
were referenced abstractly; that file has a placeholder for them).

## Open / optional next steps

1. ~~**Stop-hook** to surface pending-review count at session end.~~ **Done** —
   `hooks/stop-snippet.json` + `self_improve.py stop-hook`. Installed by
   `install.py`.
2. ~~**Periodic guard** that warns when review items age past N days.~~ **Done**
   — `hooks/sessionStart-snippet.json` + `self_improve.py guard --max-age-days N`
   (default 7). Installed by `install.py`.
3. ~~**MOTION-LAYER** note in the design docs.~~ **Drafted + held for sign-off**
   — `EVERPASS TOOLS/Presentations/MOTION-LAYER.md`. See "Carry-over: MOTION-LAYER".
4. ~~Formal **skill-from-masters** pass.~~ **Done** — `MASTERS.md`. See
   "Carry-over: skill-from-masters". (Only follow-up: paste the 5 video links in.)

## Try it

> "improve the watch skill to do X"

Watch it triage: low-risk lands in `changelog.md`; anything that edits behavior
lands in `review-<date>.md` for your sign-off.
