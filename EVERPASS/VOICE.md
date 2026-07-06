# VOICE.md — How EverPass Content Sounds

Layer-1 core instruction (tool-agnostic). Read for ANY content-creation task: decks,
briefs, partner communications, dashboard narrative, email drafts. This file compiles the
voice rules already scattered across the workspace into one canonical reference — the HARD
rules below remain owned by their source files; pointers are given, wording is not forked.

---

## Hard constraints (owned elsewhere, restated for one-stop reading)

| Rule | Source of truth |
|---|---|
| No individual names in external-facing content — team/function (Sales, Content, Legal) + brand (Disney, ESPN, NBCU) only. Strip at the projection step, not in source files. | `CLAUDE.md` §5, `.claude/rules/partner-insights.md` |
| Never send email. Drafts only; Ryan is sole sender. | `CLAUDE.md` §5 |
| Full-sentence takeaway slide titles where appropriate. | `EVERPASS TOOLS/Presentations/CLAUDE.md` |
| Clarity over jargon; write for the actual audience; concise unless told otherwise. | `EVERPASS TOOLS/Presentations/CLAUDE.md` |

## Register by audience tier (see AUDIENCE.md for the tiers)

**Tier 1 — Internal ops (Ryan, future operators, Claude sessions):**
Terse, technical, imperative. Bullets over prose. State the rule, the why in one line, the
how in numbered steps. Model: `tasks/lessons.md` entries — `Rule / Why / How to apply`.
Dates in ISO. Paths in backticks. No motivational filler.

**Tier 2 — Internal mixed-expertise (meetings, onboarding, exec reviews):**
Clean narrative with one idea per unit. Full-sentence takeaway headlines that survive
being read without the speaker. Talk-track bullets that support natural speech — not a
script. Assume intelligence, not context.

**Tier 3 — External partner-facing (decks, briefs, published dashboards):**
Brand-level and function-level only — never individuals. Executive clarity: the
recommendation up front, the support behind it. Nothing that requires apology or caveat
later; if a number might be stale, it carries its date.

## Words and patterns

**Prefer:** concrete numbers with dates · named brands · "recommendation:" ·
one-line answers followed by support · active voice · "as of <date>"

**Never (derived from documented anti-patterns):**
- Filler superlatives that read as generic AI copy ("game-changing", "cutting-edge",
  "seamless", "revolutionize", "unlock")
- Dense walls of text where a table or three bullets would do
- Hedged non-answers ("it depends" without following with what it depends on)
- Individual names in anything Tier 3
- Undated claims about fast-moving deal state

**Ryan's never-use list (documented across standing feedback, compiled 2026-07-06):**
- Em dashes in authored text: absolute ban; comma, period, colon, or parentheses instead.
- AI-fingerprint vocabulary beyond the superlatives above: supercharge, delve, elevate,
  robust, leverage-as-verb in external copy.
- AI openers/closers: "Certainly", "Great question", "Happy to", "I hope this helps",
  "Let me know if", "Feel free to".
- Filler hedges: just, really, basically, actually, simply.
- Splashy/hype tone anywhere: plain executive voice always.
- Emoji in deliverables.
- His coined terms (Ruthless Sequencing, Invasion Currency, Event Stack) are exact:
  never altered, never paraphrased.
- Internal exec emails are the one place polish is WRONG: keep his real-time hedging
  ("I believe", "I think"); authentic thinking-out-loud beats finished prose there.

<!-- NEEDS RYAN INPUT (still open): preferred sign-offs and openers for partner email
     drafts, if you have standing ones. -->

## Sentence mechanics

- Lead with the point; qualify after.
- One thought per sentence in Tier 3; compound sentences acceptable in Tier 1.
- Numbers as digits, not words. Percentages, dates, and dollar figures always explicit.
- Questions to the reader only when a decision is genuinely theirs to make.
