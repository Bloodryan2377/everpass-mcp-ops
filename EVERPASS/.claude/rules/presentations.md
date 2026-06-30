---
name: presentations
description: Path-scoped rules for the EverPass presentation factory. Auto-loaded when working under EVERPASS TOOLS/Presentations.
paths:
  - "EVERPASS TOOLS/Presentations/**"
  - "EVERPASS TOOLS/*.html"
---

# Presentations — Edit Rules

These rules ride on top of the comprehensive `EVERPASS TOOLS/Presentations/CLAUDE.md` and the `everpass-presentation` skill — they encode the few sharp constraints that matter most.

## Skill auto-trigger (HARD)
Any deck/slides/presentation request for EverPass MUST invoke `everpass-presentation`
(`~/.claude/skills/everpass-presentation/`). No raw HTML hand-rolling, no scratch templates.

## Approved shell only
- Base every new deck on:
  `EVERPASS TOOLS/Presentations/everpass-presentation-shell.html`
- Preserve presenter view (`P` key), notes pane, navigation, next-slide preview, and elapsed timer unless Ryan explicitly says redesign.

## Output location
- Finished decks save to `EVERPASS TOOLS/<descriptive-name>.html`. Never to Desktop, never to `EVERPASS TOOLS/Presentations/` (that folder is the shell + scaffolding only).
- File naming: lowercase, hyphenated, descriptive. Never `final.html`, `test2.html`, `deck.html`.

## Anti-patterns
- No heavy animation, busy backgrounds, dense text, generic "AI deck" layouts.
  Any motion/explainer work follows `motion-layer.md` (restrained motion only).
- No scrolling inside slides. Viewport-fit always.
- No external dependencies that break in restricted browser contexts.

## External-facing decks
- Strip individual names. Use team/function (Sales, Content, Legal) and brand (Disney, ESPN, NBCU). See `partner-insights.md` rule.
- Default deliverable is a single self-contained `.html`. Avoid multi-file dependencies.

## Go/No-Go decks
4-slide format (locked 2026-04-23). 47 properties total; presenter pop-out required.
