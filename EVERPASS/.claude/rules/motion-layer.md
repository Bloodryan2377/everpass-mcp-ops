---
name: motion-layer
description: Path-scoped rules for EverPass explainer motion. Auto-loaded when working on decks/explainers under EVERPASS TOOLS. Governs how things move; ep-design-system still owns static color/type/layout.
paths:
  - "EVERPASS TOOLS/Presentations/**"
  - "EVERPASS TOOLS/*.html"
---

# MOTION-LAYER — Edit Rules

These rules ride on top of `EVERPASS TOOLS/Presentations/MOTION-LAYER.md` (the
full spec) and `presentations.md` — they encode the few sharp motion constraints
that matter most. MOTION-LAYER governs **motion only**; `ep-design-system` remains
the single source of truth for static color, type, and layout and wins on any
conflict.

## First principle (HARD)
Motion is **restrained, purposeful, executive-clean** — it must direct attention
or show change. Decoration-only motion is forbidden. This does not relax the
house style ("avoid heavy animation"); it operationalizes it.

## Accepted v1 defaults
- Transitions 200–300ms, ease-out (`cubic-bezier(0.2, 0, 0, 1)`).
- Reveals = fade + small (≤8px) translate. No zoom/spin/bounce/slide-across.
- One primary element animating at a time; build top→bottom, left→right.
- No ambient/idle/loop motion behind content.
- Honor `prefers-reduced-motion` → collapse to the static composition.

## Build order (HARD)
Compose each slide statically against `ep-design-system` and confirm it reads
with **zero** motion *before* layering MOTION-LAYER reveals on top — one
purposeful build per beat of the talk track.

## Anti-patterns
- Parallax, particle/gradient drift, decorative animation.
- More than one primary element moving at once.
- Motion that doesn't advance the narrative, or that breaks viewport-fit /
  forces scrolling inside a slide.
- External animation libraries (dependency-light rule) unless Ryan approves.

## Changes go through the LOOP
Tune motion values or conventions via a self-improve LOOP `rule` change, not by
editing canon ad hoc. Full spec + rationale: `Presentations/MOTION-LAYER.md`.
