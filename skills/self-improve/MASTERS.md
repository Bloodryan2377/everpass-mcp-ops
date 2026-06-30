# skill-from-masters — provenance for the self-improve LOOP

The formal "skill-from-masters" pass: build/refine a skill by studying how expert
practitioners actually do the task, and record where the design came from.

## Primary source (golden set): practitioner videos

The LOOP's design is taken from **5 real practitioner videos** (incl. Austin
Marchese's "LOOP"), supplied by Ryan. These are the primary source and outrank
the web corroboration below, because they carry **real failure cases from real
practitioners** — which is exactly what a generic web search under-surfaces.

The two failure modes the LOOP refuses came straight from those videos:

1. **Full autonomy → drift.** An agent that applies its own behavior changes
   unsupervised quietly relaxes its guardrails and rots. → LOOP refuses it: HIGH
   changes never self-apply.
2. **Review-everything → unsustainable.** Gating every trivial doc tweak on a
   human means the loop never runs. → LOOP refuses it: LOW changes land instantly.

And the core mechanism — **triage by risk**, with an **approve-always** escape
hatch to bless a class once trust is earned — is the practitioners' answer to
threading between those two modes.

> Action for whoever holds the golden set: drop the 5 video titles/links here so
> the citation is concrete. They were referenced abstractly in the handoff; this
> file is where they belong.

## Web corroboration (secondary)

A formal web pass (June 2026) corroborates the same shape from independent
sources, but did **not** surface "Austin Marchese" by name — so the videos remain
the cited primary source, not the web. Convergent findings:

- A dedicated learnings store the agent writes to in real time (unexpected
  failures, user corrections, missing capabilities), referenced before big tasks
  and promoted to durable memory once a lesson sticks. Matches our
  `changelog.md` + review queue + `patterns.json` blessing.
- Memory typed into **semantic** (reusable rules/patterns), **episodic** (a
  specific failure/debug session), and **working** (current context). Our LOW
  `gotcha`/`doc` captures map to semantic; the review items are episodic until
  blessed.
- Extract experience → abstract into a pattern → update the skill with new
  checklist items / anti-patterns / quality rules. This is precisely the LOOP's
  triage → apply/hold step.

Sources:
- [Self-Improving Coding Agents — addyosmani.com](https://addyosmani.com/blog/self-improving-agents/)
- [How to Build a Self-Improving AI Agent That Learns From Its Own Mistakes — MindStudio](https://www.mindstudio.ai/blog/self-improving-ai-agent-feedback-loop)
- [Recursive Self-Improvement: Building a Self-Improving Agent with Claude Code — David R. Oliver](https://medium.com/@davidroliver/recursive-self-improvement-building-a-self-improving-agent-with-claude-code-d2d2ae941282)
- [kayba-ai/recursive-improve — GitHub](https://github.com/kayba-ai/recursive-improve)
- [Self-improving learning loop feature request — anthropics/claude-code#57830](https://github.com/anthropics/claude-code/issues/57830)

## Net-new from the formal pass (folded in via the LOOP)

The web pass surfaced one framing worth adopting as a low-risk doc/gotcha (it
auto-applies — see `changelog.md`):

- **Name the three memory types explicitly** (semantic / episodic / working) when
  describing what the LOOP captures, so the mental model matches the broader
  practitioner vocabulary. Captured as category `doc`.

Nothing in the web pass contradicted the video-derived design. No behavior
(HIGH) changes resulted — the masters and the corroboration agree, which is the
outcome you want from this pass.

## How this pass was run

- Primary: study the 5 practitioner videos (golden set, Ryan-supplied).
- Secondary: formal web search to check for divergence/net-new.
- Reconcile: diff the two; fold net-new in through the LOOP at the right risk
  level (here: one `doc` item, auto-applied; zero behavior changes).
- Cite: videos primary, web secondary, provenance recorded in this file.
