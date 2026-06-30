# MOTION-LAYER — EverPass explainer & motion conventions

> **Status: APPROVED v1 (2026-06-30).** Signed off by Ryan via the self-improve
> LOOP (category `rule`) and promoted to a path-scoped rule
> (`EVERPASS/.claude/rules/motion-layer.md`). The static design system
> (`ep-design-system`) remains the single source of truth for color, type, and
> layout; MOTION-LAYER sits **on top of it** and governs only how things move.
> The numeric values below are the **accepted v1 defaults** — tune them later via
> another LOOP `rule` change, or replace with canonical motion tokens if
> `ep-design-system` grows them.

## Why this layer exists

EverPass has a named single source of truth for the **static** brand
(`ep-design-system`) and a named tool for brand-scrape (`firecrawl`). Motion —
explainer video, build-on reveals, transitions — had no named layer, so
explainers risked being built ad hoc and drifting from house style. MOTION-LAYER
names it so motion is versioned and enforceable the same way the static layer is.

## First principle: motion inherits the house style

The presentation house style is explicit (`Presentations/CLAUDE.md`): *super
clean, minimal, polished*; **avoid heavy animation, busy backgrounds, unnecessary
decoration.** MOTION-LAYER does not relax that — it operationalizes it. Motion is
**restrained, purposeful, and executive-clean**. Every animation must earn its
place by directing attention or showing change; decoration-only motion is an
anti-pattern.

## Where MOTION-LAYER applies

- **Explainers** (the primary use case): short narrated/auto-advancing pieces
  that teach one idea — built on top of, not instead of, the presentation shell.
- **Build-on reveals** inside live decks (progressive disclosure of a list, a
  diagram assembling step by step).
- **Slide/section transitions** in the approved shell.

It does **not** govern static slide composition (that's `ep-design-system`) or
the presenter-view / navigation machinery (that's the approved shell).

## Conventions (proposed defaults — confirm)

| Aspect | Proposed default | Rationale |
|---|---|---|
| Transition duration | 200–300ms _(v1)_ | Fast enough to feel crisp, not flashy. |
| Easing | ease-out / `cubic-bezier(0.2, 0, 0, 1)` _(v1)_ | Decelerate-in reads as polished, not bouncy. |
| Build order | top-to-bottom, left-to-right, one element at a time | Matches reading order; supports the talk track. |
| Reveal style | fade + small (≤8px) translate _(v1)_ | Subtle; no zoom/spin/slide-across. |
| Simultaneous motion | ≤1 primary moving element at a time | Avoids busy, AI-deck feel. |
| Loop/idle motion | none by default | No ambient animation behind content. |
| Respect reduced-motion | honor `prefers-reduced-motion` → no transforms | Accessibility + meeting-room safety. |

## Anti-patterns (hard)

- Heavy/decorative animation, parallax, particle/gradient drift behind content.
- Spin, bounce, zoom-in title reveals, slide-across-screen transitions.
- More than one primary element animating at once.
- Motion that runs without advancing the narrative (eye-candy).
- Animation that breaks viewport-fit or forces scrolling inside a slide.

## How an explainer is assembled (build order)

1. Start from the approved presentation shell (`everpass-presentation-shell.html`)
   — preserve presenter view, navigation, notes.
2. Compose each slide statically against `ep-design-system` first; confirm it
   reads with **zero** motion.
3. Layer MOTION-LAYER reveals on top — one purposeful build per beat of the talk
   track, using the proposed defaults above.
4. Verify `prefers-reduced-motion` collapses cleanly to the static composition.
5. Keep it a single self-contained `.html`; no external animation libraries
   unless Ryan approves (dependency-light rule).

## Relationship to the other named layers

- `ep-design-system` — static single source of truth (color/type/layout). **Wins
  on any conflict.**
- `firecrawl` — brand-scrape input.
- **MOTION-LAYER** — this doc. The motion layer on top of the static system.

## Follow-ups (post-approval)

- Tune the v1 durations/easing/translate values if live use suggests it, or
  replace them with canonical motion tokens if `ep-design-system` grows them —
  route either as a LOOP `rule` change.
- Decide whether MOTION-LAYER ships with a minimal reference explainer built on
  the approved shell (recommended, so the conventions have a worked example).
- ✅ Promoted to a path-scoped rule (`EVERPASS/.claude/rules/motion-layer.md`),
  so it auto-loads when explainers/decks are edited.
