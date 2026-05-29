---
audit: mobile-premium-redesign
date: 2026-04-28
status: COMPLETE
devices_tested: [iPhone 17 Pro Max (430×932), iPad Pro 12.9" (1024×1366)]
---

# EverPass Mobile Premium Redesign — Audit

## Files Changed

| File | Type | Notes |
|---|---|---|
| `styles/core.css` | Full rewrite | New token system, topbar, tabbar, breakpoints |
| `styles/cockpit.css` | Full rewrite | Hero, ask-composer, deals, asks-tile CSS, iPad 2-col |
| `styles/dispatch.css` | Full rewrite | Kind cards, form, recent items, inbox-hint |
| `index.html` | Structural refinement | Title, tab icons, brand-title shortened |

No JS changes. No data/feed changes. All canonical data architecture intact.

---

## Mobile Design System Now in Place

### Palette
- Background: `#0c111e` — deep charcoal-navy (not pure black)
- Elevated 1: `#131929` — first-layer cards
- Elevated 2: `#1a2440` — second-layer, pressed states
- Elevated 3: `#1e2d52` — hero gradient, deep surfaces
- Primary text: `#eef3ff` — cool off-white
- Secondary: `#8899b8` — muted blue-gray
- Tertiary: `#4a5878` — faint labels, metadata
- Accent: `#22d3ee` — teal/cyan (shifted from blue for distinctiveness)
- Accent strong: `#0891b2` — pressed/shadow states
- Accent dim: `rgba(34,211,238,0.10)` — glow fills
- Success / Warn / Danger: unchanged (#34d399 / #fbbf24 / #f87171)

### Typography
- Hero title (`h1`): 28px / 800 weight (36px tablet, 42px iPad Pro)
- Hero stats value: 30px / 800 (36px tablet, 40px iPad Pro)
- Card titles / composer label: 18px / 700
- Body: 15px / 400 (bumped from 13px)
- Chip / meta: 11px / 500–700

### Spacing
- Card padding: 20px (up from 16px), 24px on iPad Pro
- Section title margin-top: 26px (up from 18px)
- Main content padding: 20px / 28px / 36px (phone / tablet / iPad Pro)
- Card gap in lists: 10px
- Hero padding: 24px / 32px / 36px (phone / tablet / iPad Pro)

### Radius
- Cards: `--r-lg: 20px` (up from 14px)
- Hero, ask-composer card: `--r-xl: 26px`
- Bottom sheets: `--r-2xl: 36px`

### Touch Targets
- `--tap: 50px` (up from 44px; above iOS HIG minimum)

### Topbar
- Reduced height: `calc(84px + safe-top)` (down from 120px)
- Glassmorphic: `backdrop-filter: blur(20px) saturate(180%)`
- Brand mark teal glow: `box-shadow: 0 0 14px rgba(34,211,238,0.22)`
- Status chips: compact `4px 9px` padding, 6px dot (down from 8px)

### Tabbar
- Height: `calc(68px + safe-bottom)`
- Active tab: teal accent 2px pill indicator at top, `color: var(--c-accent)`
- Inactive: `color: var(--c-fg-faint)` (improved contrast)

### Cards
- Accent-bordered ask-composer: `border: 1px solid var(--c-accent-strong)` + outer glow ring
- Deal items: teal left-border accent stripe (`border-left: 3px solid var(--c-accent-strong)`)
- Crit items: red left-border stripe (unchanged, now with shadow)
- `--c-shadow-sm` on all list items for depth

### Asks Tile
- Previously had zero CSS (cockpit.js rendered it but no matching selectors)
- Now has full `.asks-tile`, `.asks-row`, `.asks-stat`, `.asks-warning`, `.asks-cta` rules

---

## Breakpoints

| Width | Layout |
|---|---|
| < 480px | Ask composer actions: 1-column stack |
| ≥ 480px | Ask composer actions: 1fr auto auto (Ask primary + Copy + Download) |
| ≥ 768px | Tabbar hidden; main max-width 920px; hero 4-col stats; quick-actions 4-col; health-grid 4-col |
| ≥ 1024px | Main max-width 1280px; cockpit `columns: 2` with hero+ask spanning all; card/list `break-inside: avoid` |

---

## Devices / Viewports Verified

| Device | Viewport | Result |
|---|---|---|
| iPhone 17 Pro Max | 430×932 | ✅ Hero + Ask composer fill first viewport; tabbar premium; dark navy correct |
| iPad Pro 12.9" | 1024×1366 | ✅ Two-column CSS columns layout; hero/ask span full; 4-col stat/quick-action rows; no tabbar |

---

## Visual Improvements Confirmed

- Deep charcoal-navy background vs. prior `#0b1220` (slightly richer)
- Teal/cyan accent replaces stock sky-blue — more distinctive for premium media brand
- Hero "Today" title: 28px → 42px (iPad Pro), stat values: 18px → 40px (iPad Pro)
- Ask composer elevated to hero-level with accent border ring + drop shadow
- Hero glow: radial accent gradient top-left atmosphere effect
- All cards: 20px padding (was 16px), 20px radius (was 14px)
- Section titles: better tracking (1.2px), more top margin (26px)
- Tabbar active indicator: 2px teal pill replaces simple color change
- Deal items: teal left stripe, state rendered as inline chip
- Asks tile: full styling applied for first time

---

## What Was Verified

- [x] No JS files modified; all class names preserved
- [x] No data feed, JSON, or Python script touched
- [x] Freshness enforcer chain unaffected
- [x] Light theme override preserved in all three CSS files
- [x] `prefers-reduced-motion` respected
- [x] All existing CSS class names retained (no breakage risk)
- [x] `--tap: 50px` ≥ iOS HIG 44px minimum
- [x] Safe-area insets applied: top, bottom, left, right
- [x] iPad CSS columns two-col layout verified with break-inside rules

---

## Remaining Visual Debt

| Item | Priority | Notes |
|---|---|---|
| `answers.css` not redesigned | Medium | Secondary tab; functional but not premium-styled |
| `results.css` not redesigned | Low | Archive view, rarely primary |
| `live.css` not redesigned | Low | Live Q&A; rarely used |
| Quick-action labels are JS-hardcoded | Medium | "Partner intel" etc. don't match hero IA (Ask/Deal Brain/$$ Brain) — needs JS change if labels are to change |
| `data-theme="auto"` follows OS | Low | If always-dark is desired, change HTML attr to `dark` |
| Ask button on iPhone slightly below fold | Low | Scrolls in immediately; not a blocking issue |
| Quick-action cards wrap text on iPad | Low | "Morning supp." wraps; could min-width clamp labels |
| No skeleton/shimmer loading states | Medium | Empty dashes show during load; shimmer would feel more premium |

---

## Manual Commands to Preview

```bash
# Start local preview server
cd "C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\EVERPASS TOOLS\Dashboard\dashboard-deploy\mobile"
python -m http.server 7891

# Open in browser
start http://127.0.0.1:7891/
```

To force dark mode in browser: open DevTools → Rendering → Emulate CSS media: prefers-color-scheme dark.

Or add `?` and run `document.documentElement.setAttribute('data-theme','dark')` in console.

---

## Best Next Autonomous Step

Redesign `answers.css` to match the premium token system — it's the most-used secondary tab and currently unstyled relative to the new design language. Priority selectors: `.answers-list`, `.answer-item`, `.answer-head`, `.answer-body`, `.answer-meta`.
