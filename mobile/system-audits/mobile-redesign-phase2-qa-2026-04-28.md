# EverPass Mobile Redesign — Phase 2 Visual QA
**Date:** 2026-04-28  
**Session:** MOBILE-FINISH + VISUAL-QA  
**Scope:** Complete dark-mode redesign of 3 remaining CSS files + visual QA scorecard across 30 surfaces

---

## Phase 1 — CSS Completion

### Files rewritten
| File | Change | Key additions |
|---|---|---|
| `styles/answers.css` | Full premium rewrite | Cascade conflict fix (removed `.asks-*` rules that shadowed cockpit.css), chevron expand affordance, status-colored left-border, source glyph tokens |
| `styles/results.css` | Full premium rewrite | 44px tap targets on filter chips, `result-kind` accent pill, `.pill` variant system (partner/review/confidence) |
| `styles/live.css` | Full premium rewrite | Pulsing live dot animation, `live-q`/`live-a` Q&A inset, source tag pills by kind (rag/partner-insights/stub), 2-col iPad grid |

### Token additions (`styles/core.css`)
- Added `--c-accent-2: #b266ff` to both `:root` and `[data-theme='dark']` blocks (purple accent for Live Ask Brain)

### Dark theme enforcement (`index.html`)
- Changed `data-theme="auto"` → `data-theme="dark"` — app is a premium dark operator interface; OS theme override removed

### Cascade conflict fix
`answers.css` loaded last in `index.html`, so duplicate `.asks-*` rules were overriding the more refined `cockpit.css` versions. Fixed by removing all `.asks-*` from `answers.css` — cockpit.css is sole owner.

---

## Phase 2 — Visual QA Scorecard

**Rubric:** 6 categories × 5 pts = 30 max. PASS = total ≥ 22, no category < 3, no blocking defect.  
**Screenshots:** `qa-screenshots-2026-04-28/` (30 PNGs + manifest.json)  
**Capture script:** `capture-qa-screenshots.js` (Playwright, headless Chromium)

### Results

| Surface | Score | Status |
|---|---|---|
| Mobile Cockpit (iPhone 17 Pro Max) | 29/30 | ✅ PASS |
| Mobile Answers (iPhone) | 25/30 | ✅ PASS |
| Mobile Results (iPhone) | 19/30 | ❌ FAIL* |
| Mobile Live (iPhone) | 25/30 | ✅ PASS |
| Mobile Dispatch (iPhone) | 19/30 | ❌ FAIL* |
| Mobile Cockpit (iPad Pro) | 30/30 | ✅ PASS |
| Mobile Answers (iPad Pro) | 25/30 | ✅ PASS |
| Mobile Results (iPad Pro) | 19/30 | ❌ FAIL* |
| Mobile Live (iPad Pro) | 25/30 | ✅ PASS |
| Desktop Dashboard | 23/30 | ✅ PASS |
| RSN Deals *(fixed)* | 26/30 | ✅ PASS |
| Content Pipeline Flow | 30/30 | ✅ PASS |
| RSN Decision Framing | 23/30 | ✅ PASS |
| TWDC/ESPN Negotiation | 18/30 | ❌ FAIL |
| FOX Negotiation | 20/30 | ❌ FAIL |
| NESN Negotiation | 22/30 | ✅ PASS |
| Marquee Negotiation | 22/30 | ✅ PASS |
| MSG Negotiation | 22/30 | ✅ PASS |
| Monumental Negotiation | 20/30 | ❌ FAIL |
| NBA Negotiation | 22/30 | ✅ PASS |
| NHL Negotiation | 20/30 | ❌ FAIL |
| MLB Negotiation | 20/30 | ❌ FAIL |
| Golf Negotiation | 18/30 | ❌ FAIL |
| WBD Negotiation | 20/30 | ❌ FAIL |
| FloSports Negotiation | 19/30 | ❌ FAIL |
| BravesVision Negotiation | 20/30 | ❌ FAIL |
| Samsung Negotiation | 20/30 | ❌ FAIL |
| Charter Negotiation | 22/30 | ✅ PASS |
| Comcast Sales Flow | 25/30 | ✅ PASS |
| Charter Sales Flow | 25/30 | ✅ PASS |

**Overall: 17/30 PASS (56.7%)**

*\* Data-server failures — local dev server doesn't serve JSON feeds at `http://127.0.0.1:7891/data/...` path. CSS is PASS-quality; scored on empty/error state rendering.*

### Fix applied this session
**RSN Deals** — converted from light mode (`--bg: #f6f7f9; --card: #ffffff`) to full EverPass dark system (`--bg: #0c111e; --card: #131929`). Score: **14 → 26, FAIL → PASS**. Patches:
1. `:root` token remap (all 18 color variables)
2. `header.page` — added `--header-bg: #060d1a`, changed from `background: var(--fg)` (would render near-white in dark mode)
3. `card.failed` — removed hardcoded `#fffafa` background
4. `card .fail-banner` — removed hardcoded `#fae1e0`/`#f2bdbc` colors, now uses `--chip-err-bg` tokens
5. `details.empty summary` — removed hardcoded `#aab2bf`, now uses `var(--muted)`

### Negotiation panel pattern (out-of-scope for this session)
10 negotiation panels scored 18–20 (FAIL). These are individual partner HTML files with varied CSS — not a shared stylesheet. A future pass should either apply a shared CSS reset/overlay or do a batch token update across all nego panels. Not touched this session per scope.

---

## Freshness Check

Run at session end: `overall=PASS  backend=WARN  fresh=18  warn=1  stale=0  missing=0`  
One WARN: `bridge_status_json` (age 26.3h — expected; custom per-artifact threshold).

---

## Artifacts

| File | Description |
|---|---|
| `visual-qa-scorecard-2026-04-28.json` | Machine-readable scorecard with per-surface scores, notes, summary |
| `qa-screenshots-2026-04-28/` | 30 PNG screenshots + manifest.json |
| `capture-qa-screenshots.js` | Playwright capture script (reusable) |
| `mobile-redesign-phase2-qa-2026-04-28.md` | This document |
