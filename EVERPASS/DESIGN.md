# DESIGN.md — How EverPass Looks

Layer-1 core instruction (tool-agnostic). Read before building or extending any EverPass
HTML surface — decks, presentations, panels. Routing lives in `CLAUDE.md` §11 — this file
holds visual identity, not rules.

Tokens below are extracted verbatim from the live, approved shell — not invented. Source:
`EVERPASS TOOLS/Tools/Presentations/everpass-presentation-shell.html` (the canonical copy;
`WEEKLY OUTPUTS/library/shells/` holds a dated historical mirror, `_premove-backup-*/`
folders hold pre-reorg backups — neither is the source of truth). No design tokens existed
in this repo before this file; if a value below can't be traced to that source, it is
marked `NEEDS RYAN INPUT`, never guessed.

---

## Token source status: flagged, not resolved (NEEDS RYAN INPUT)

Auditing this file against `GOLD-STANDARD-CLAUDE-CODE.md` (the locked, 2026-06-10
presentation baseline; canonical copy at `EVERPASS TOOLS/WEEKLY OUTPUTS/library/
goldstandard/GOLD-STANDARD-CLAUDE-CODE.md`) surfaced a conflict this file does not
resolve on its own:

- **Gold Standard's own header states:** "Supersedes the YTTV
  `everpass-presentation-goldstandard.html` (now ALTERNATE) and the DAZN dark-glass
  `everpass-presentation-shell.html` (now LEGACY)." (GOLD-STANDARD-CLAUDE-CODE.md, line 5)
- **The two token sets differ:** bg `#0A0F14` (Gold Standard) vs. `#0b0f14` (shell, near
  identical); accent is teal `#2FA5B0` in Gold Standard, with gold `#F5D547` as a
  *secondary* highlight, vs. this file's single gold `#d4af37` accent and no second
  accent at all; typography is Inter (one family) in Gold Standard vs. this file's
  two-typeface system (Georgia/Source Serif titles, system sans body).
- **The shell file's mtime is 2026-04-21,** before the Gold Standard lock date
  (2026-06-10): consistent with an earlier iteration Gold Standard superseded, not a
  deliberately separate surface.

This reads as the shell tokens being stale, not a second legitimate surface (the shell is
a named, superseded predecessor of the same surface type, presentation decks, not a
different surface like dashboard/cockpit). Flagging rather than swapping the palette out
during an unattended overnight run.

**Ryan, pick one:**
1. Point this file at the Gold Standard tokens (section 1 of GOLD-STANDARD-CLAUDE-CODE.md)
   as canonical for EverPass presentation decks, and relabel the table below "shell
   tokens: historical, superseded 2026-06-10, do not use for new decks."
2. Say so if `everpass-presentation-shell.html` is still intentionally in active use for
   something Gold Standard doesn't cover, and this file should keep tracking it as a live
   (if secondary) surface.

Either answer is fine: the gap is not knowing which, not the tokens themselves.

## Principles (derived from the shell, not aspirational)

1. **Dark canvas, quiet chrome.** Near-black background, off-white text, a muted
   secondary color for anything that isn't the point. Buttons and counters stay
   low-contrast until touched (`.chrome button:hover`).
2. **Serif states, sans supports.** Georgia/Source Serif carries titles and section
   heads only; the system sans stack runs body copy, labels, and UI chrome. Two
   typefaces, two jobs — never mixed within one role.
3. **Gold marks the point, not the page.** The accent color appears on dash-bullets,
   two-column subheads, the brand dot, and active state — never as a background wash
   or a large surface.
4. **Labels shout quietly.** Eyebrows, footer text, and presenter meta share one
   convention: small, uppercase, wide letter-spacing (`.14em`–`.22em`), muted color.
   It reads as a system, not a one-off style choice.
5. **Responsive by `clamp()`, not by breakpoint.** Title and body sizes scale
   continuously with viewport via `clamp()` rather than jumping at fixed breakpoints.
   This assumes a fullscreen, single-viewport deck context (see Scope below).

## Tokens

Source: `everpass-presentation-shell.html:17-26` (`:root` block).

| Token | Value | Used for |
|---|---|---|
| `--bg` | `#0b0f14` | Page/deck background |
| `--fg` | `#f4f6f8` | Primary text |
| `--muted` | `#8a94a6` | Secondary text, eyebrows, footer, labels |
| `--accent` | `#d4af37` | Gold — bullets, brand dot, two-col subheads, active states |
| `--line` | `rgba(244,246,248,0.08)` | Hairline borders (footer rule, card borders) |
| `--panel` | `rgba(255,255,255,0.04)` | Subtle card/chrome background |
| `--serif` | `Georgia, 'Source Serif Pro', serif` | Titles, section heads only |
| `--sans` | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` | Everything else |

Other recurring values (not CSS custom properties, but consistent across the file):

| Value | Where (line) | Used for |
|---|---|---|
| `.5rem` radius | `91` | Buttons |
| `.75rem` radius | `114` | Panels (presenter view current/next cards) |
| `.28s ease` | `43` | Slide-to-slide opacity transition |
| `.14em`–`.22em` letter-spacing | `47, 81, 94, 111, 117` | Uppercase labels (eyebrow, footer, counter, presenter meta) |
| `clamp(2.6rem,6.2vw,5.4rem)` | `51` | H1 title size |
| `clamp(2rem,4.2vw,3.4rem)` | `56` | H2 title size |
| `clamp(1.05rem,1.5vw,1.3rem)` | `60` | Body/lede size |

## Interaction conventions

- Navigation: `←`/`→` between slides, `P` opens presenter view, `Esc` closes it
  (`everpass-presentation-shell.html:13`).
- Presenter view syncs to the audience-facing deck via `BroadcastChannel`; speaker
  notes never render on the audience-facing side (`everpass-presentation-shell.html:14`).
- List bullets are a 1px dash in the accent color, not a bullet glyph
  (`everpass-presentation-shell.html:70-73`) — consistent with "gold marks the point."

## Scope — what this file does and doesn't cover

This file documents the **presentation shell** specifically. Other EverPass HTML
surfaces (dashboard, cockpit) are built from different files and may carry their own
token sets.

<!-- NEEDS RYAN INPUT: if the dashboard/cockpit surfaces are meant to share this exact
     token set, say so here and point to where they currently diverge (if they do) so a
     future session can reconcile rather than silently forking the palette again. If they
     are intentionally separate design languages (deck vs. operational surface), say that
     instead — either answer is fine, the gap is not knowing which. -->

<!-- NEEDS RYAN INPUT: iconography and logo-placement rules for HTML surfaces. The shell
     itself has no icon system (just the brand dot and dash-bullet above) — this is a real
     gap if one is wanted, not an omission from this extraction. -->

<!-- NEEDS RYAN INPUT: a broader motion/animation doctrine beyond the single slide-fade
     transition above, if one exists or is wanted for non-deck surfaces. -->
