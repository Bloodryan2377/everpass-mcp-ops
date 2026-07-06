# DESIGN.md: How EverPass Looks

Layer-1 core instruction (tool-agnostic). Read before building or extending any EverPass
HTML surface: decks, presentations, panels. Routing lives in `CLAUDE.md` section 11; this
file holds visual identity, not rules.

**Canonical token source: the Gold Standard presentation baseline** (locked 2026-06-10),
`EVERPASS TOOLS/Weekly Outputs/library/goldstandard/GOLD-STANDARD-CLAUDE-CODE.md`, master
artifact `weekly-execs-goldstandard-alt-2026-06-08.html` in the same folder. That document
is the full spec (archetypes, slide architecture, print fidelity, FABLE 5 narrative
layer); this file carries the identity core so layer-1 consumers do not re-derive it.

## Decision record

Resolved by Ryan, 2026-07-06. An earlier draft of this file extracted tokens from
`everpass-presentation-shell.html` (DAZN dark-glass). The Gold Standard's own header
declares that shell LEGACY and itself the only EverPass deck standard, and the shell's
last edit (2026-04-21) predates the Gold Standard lock (2026-06-10). The shell tokens are
therefore historical, kept in the appendix below for reading old decks only. Do not use
them for new work. Historical shells (YTTV ALTERNATE, DAZN LEGACY) are usable only when
Ryan explicitly names them.

## Tokens (copy `:root` verbatim, never re-derive)

```css
:root{
  --bg:#0A0F14; --slate:#111A17; --slate2:#0d1511;
  --panel:rgba(245,247,246,.04); --panel2:rgba(245,247,246,.06);
  --border:rgba(245,247,246,.085); --border2:rgba(245,247,246,.16);
  --text:#F5F7F6; --muted:rgba(245,247,246,.74); --dim:rgba(245,247,246,.46);
  --accent:#2FA5B0; --accent-deep:#14614A; --gold:#F5D547;
  --green:#34D399; --amber:#FBBF24; --red:#F87171;
  /* function-team colors (tags) */
  --t-product:#22D3EE; --t-mkt:#A78BFA; --t-sales:#34D399; --t-fin:#FBBF24; --t-exec:#FCD34D;
}
```

Body background is two radial gradients over the base, never flat:

```css
background:
  radial-gradient(1100px 640px at 82% -8%,rgba(47,165,176,.14),transparent 60%),
  radial-gradient(900px 600px at -8% 108%,rgba(20,97,74,.18),transparent 58%),
  var(--bg);
```

Core color rules:

- **Accent is teal `#2FA5B0`.** Gold `#F5D547` is the secondary highlight (gates, asks,
  hard walls). Headline gradient: `linear-gradient(100deg,var(--accent),var(--gold))`
  clipped to text.
- RAG status dots: green/gold/red with glow (`box-shadow:0 0 8px`); the amber position
  uses `--gold`, not `--amber`, in RAG pills.
- Reference tokens (`var(--accent)`); never hardcode a hex inline. If a value is not in
  the `:root` block, it does not belong on an EverPass surface.

## Typography

- One family: Inter (`"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,...`),
  `letter-spacing:-.005em` body, `line-height:1.5`.
- Scale anchors: eyebrow 12px uppercase `.24em` weight 750 in `--accent`; slide title
  32px weight 820; cover h1 64px weight 840; card h3 16.5px weight 800; body 13px;
  tags 10px uppercase. Floor: nothing non-decorative below 11px.
- Headlines take heavy weights (780 to 840); the weight is the gravitas. Never 600.

## Principles

1. **Token discipline.** One tight palette, one type scale, identical on every surface.
2. **Editorial slide-head.** Eyebrow + heavy headline + accent-to-gold gradient bar +
   tabular slide index (`02 / 06`).
3. **Dense archetypes, reused not improvised.** Gantt calendar, c3/c4 cards, appendix
   tables, next-steps table (full definitions in the Gold Standard spec).
4. **Dark canvas, quiet chrome.** Near-black background, off-white text, muted secondary
   for anything that is not the point; color marks the point, never the page.
5. **Print fidelity.** Animated elements forced to final visible state under
   `@media print`, fixed 1280x720 pages.

## Scope

This file governs presentation decks and deck-like HTML surfaces. Dashboard and cockpit
surfaces are built from different files and may carry their own token sets.

<!-- NEEDS RYAN INPUT: if the dashboard/cockpit surfaces are meant to share this exact
     token set, say so here and point to where they currently diverge (if they do) so a
     future session can reconcile rather than silently forking the palette again. If they
     are intentionally separate design languages (deck vs. operational surface), say that
     instead. Either answer is fine; the gap is not knowing which. -->

<!-- NEEDS RYAN INPUT: iconography and logo-placement rules for HTML surfaces. The Gold
     Standard has no icon system beyond its status dots and tags; this is a real gap if
     one is wanted, not an omission from this extraction. -->

<!-- NEEDS RYAN INPUT: a broader motion/animation doctrine for non-deck surfaces (the
     runtime has MOTION-LAYER.md in ep-design-system; whether it should be mirrored here
     as layer-1 is Ryan's call). -->

---

## Appendix: legacy shell tokens (superseded 2026-06-10, do not use for new decks)

Source: `everpass-presentation-shell.html:17-26` (DAZN dark-glass, LEGACY). Kept only for
reading or minimally editing decks built on that shell.

| Token | Value | Used for |
|-|-|-|
| `--bg` | `#0b0f14` | Page/deck background |
| `--fg` | `#f4f6f8` | Primary text |
| `--muted` | `#8a94a6` | Secondary text, eyebrows, footer, labels |
| `--accent` | `#d4af37` | Gold: bullets, brand dot, two-col subheads, active states |
| `--line` | `rgba(244,246,248,0.08)` | Hairline borders |
| `--panel` | `rgba(255,255,255,0.04)` | Subtle card/chrome background |
| `--serif` | `Georgia, 'Source Serif Pro', serif` | Titles, section heads only |
| `--sans` | system sans stack | Everything else |

Legacy interaction conventions (shell only): arrow-key slide nav, `P` presenter view via
`BroadcastChannel`, 1px dash bullets in the accent color.
