# EVERPASS — Workspace Root Rules

This is the **EverPass workspace root**. Auto-loaded by Claude Code (and any successor harness, e.g. Antigravity) for every session whose CWD is anywhere under `C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\`.

These rules are **EverPass-wide constants** — they apply regardless of subtree. Subtree-specific rules live in nested `CLAUDE.md` files (Dashboard, Content Partnerships, Presentations, etc.) and in path-scoped rule files under `.claude/rules/`.

---

## 1. Canonical paths (HARD)

- **Workspace root:** `C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\`
- **NEVER** write to `C:\Users\ryan\OneDrive\EVERPASS\` (legacy personal OneDrive, unused).
- **NEVER** treat `C:\Users\ryan\Desktop` as a project root or scaffold target. No new files there. Files that leak there are auto-archived to `_archive/desktop-sweep/` by Stop/SessionStart hooks.
- New files default to a meaningful EVERPASS subtree, never to `_archive/...` unless explicitly archival.

## 2. 12-hour freshness rule (HARD)

Nothing in the EverPass user-facing chain — desktop cockpit, mobile cockpit, dashboard, every JSON/CSV feed those surfaces depend on — may be older than **12 hours** without being **visibly marked stale** to the user.

- Enforcer: `EVERPASS TOOLS\Scripts\freshness_enforcer.py`. Exit codes: 0 PASS, 1 WARN, 2 FAIL.
- Status file: `EVERPASS TOOLS\AI Related\health\freshness-status.json` (source of truth for cockpit freshness chips).
- Thresholds: ≤6h fresh (green), 6–12h amber, >12h red. Per-artifact thresholds supported via `fresh_max_hours`/`stale_min_hours`; user-facing artifacts auto-clamped to the global 6h/12h.
- Sessions that touch the chain end with `python ".../freshness_enforcer.py"` and verify `overall=PASS`. If it doesn't, fix the failing leg or file a concrete next-action.

## 3. Source-of-truth model

- **OneDrive on disk = canonical.** NotebookLM, Google Drive, dashboard HTML, Obsidian vault, and Contract Master JSON are all **projections**.
- **Folder path** beats dashboard framing for partner category. Dashboard wrong → fix the dashboard, never move the folder.
- **Manual override always wins** over automation. The cockpit three-layer doctrine (CS-001) requires dashboard + partner wiki + daily brief synced for every property touched.
- **Email** is the primary "latest insight" stream; OneDrive docs are formal status; HTML surfaces are projections.

## 4. Update classification (UC-001, binding)

Before touching anything in EVERPASS, classify the update into one of six classes:

- **SYS-1, SYS-2** — system/infrastructure changes
- **OP-1..OP-4** — operational changes (partner, deal, dashboard, governance)

Each class has a defined source of truth, edit surface, and propagation path. Canonical reference: `EVERPASS TOOLS/Dashboard/_support/docs/governance/update-classification.md` (when present).

## 5. Communication rules (HARD)

- **Claude never sends email.** Drafts only, always. `--draft` flag on every gws gmail action. Ryan is sole sender.
- **No individual names in external-facing content.** Decks, exec briefs, dashboard narrative bundles, daily-brief external versions: use team/function (Sales, Content, Legal) and brand (Disney, ESPN, NBCU). Internal wiki/sync-logs/daily-briefs may use individuals.
- **External shares of HTML** go through Netlify (`dashboard.everpasspipeline.com`), not SharePoint links.

## 6. Autonomous execution (default mode)

- Driver mode: end-to-end execution, no confirmation pauses, automate routines fully. One focused clarifying question max per turn.
- Standing edit auth across `.md`, `.html`, `.txt`, `.ps1`, `.py`, `.js`, `.json` plus `.claude/**` and the EVERPASS tree.
- Log errors and continue; surface blockers at the end, not mid-task.
- **Definition of done (HARD, self-improve SI-0001/SI-0002):** Never report work as shipped/verified/done until `git log origin/<branch>` confirms it is committed *and* pushed. Remote/web containers are ephemeral and get reclaimed — commit + push, or install on the real box, before treating any system (hooks, skills, modules) as live. On-disk-in-a-container ≠ durable.

## 7. Existing Deal protection (HARD)

- Files under any path containing `Existing Deal` are fully executed agreements. PreToolUse hook **blocks** Edit/Write on these. Override requires explicit interactive Ryan approval.

## 8. Skills auto-trigger map

| Trigger | Skill |
|---|---|
| Deck / slides / presentation | `everpass-presentation` |
| Partner insight / meeting note | `anthropic-skills:partner-insights` |
| Contract redline (.docx) | `anthropic-skills:contract-redline` or `ep-redline` |
| Long-form contract (.md) | `anthropic-skills:agreement-revision` |
| Term sheet / LOI | `anthropic-skills:deal-term-sheet` |
| Deal economics analysis | `anthropic-skills:negotiation-brief` |
| NotebookLM sweep | `notebook-lm-sweep` |
| Pipeline refresh | `full-pipeline-refresh` |
| Dashboard update | `anthropic-skills:pipeline-dashboard-update` |
| Dashboard framing | `dashboard-framing-updates` |
| Meeting prep | `anthropic-skills:meeting-prep` |
| Session-end / "improve yourself" / "log that lesson" | `self-improve` (see `everpass-mcp-ops/self-improvement/SKILL.md`) |

## 9. Pipeline state (current)

- **Last full refresh:** 2026-04-26. 35 partners refreshed. 38/38 partner insights bridge coverage (Phase 1C, post-FUBO retirement).
- **Wiki updates:** `EVERPASS TOOLS/Daily SOP/wiki-updates.json` (44 entities / 3 groups). Rebuild via `build-wiki-updates.py` after partner insights changes.
- **32 non-dashboard properties** captured during refresh need `[NEW PROPERTY]` auth before injection.
- **Most time-sensitive (as of 2026-04-26):** Samsung CTV May 20 launch; Charter Best Offer promo expired 2026-04-27.

## 10. Navigation defaults

- Prefer high-level maps and knowledge graphs before reading lots of raw files. If `graphify-out/wiki/index.md` exists, treat it as the canonical starting point.
- Use `graphify query/explain/path` before broad Read/Grep/Glob across the tree.
- If no graph exists, say so and recommend `graphify .` or `graphify update .` rather than silently fanning out reads.

## 11. Subtree CLAUDE.md / rule files

When the CWD or edit target falls under one of these subtrees, the nested file applies in addition to this one:

- `CONTENT PARTNERSHIPS/CLAUDE.md` — partner insights doctrine, folder=truth
- `EVERPASS TOOLS/Dashboard/CLAUDE.md` — cockpit + dashboard rules
- `EVERPASS TOOLS/Presentations/CLAUDE.md` — presentation factory (already canonical)

Path-scoped rule files (auto-loaded when matching files are touched) live at `.claude/rules/`:

- `partner-insights.md`, `contracts.md`, `dashboard.md`, `presentations.md`, `legal-redline.md`, `notebook-lm.md`

### Layer-1 identity files (selective-load)

Four tool-agnostic identity files live at the EVERPASS root. Each states its own trigger
in its header — this table exists so a session can route to the right file(s) without
opening all four. Load only what the task needs, not the whole set every time:

| File | Load when |
|---|---|
| `SOUL.md` | Producing external-facing narrative, positioning, or any artifact that speaks *as* EverPass rather than merely *about* a task. |
| `VOICE.md` | Any content-creation task: decks, briefs, partner communications, dashboard narrative, email drafts. |
| `AUDIENCE.md` | Creating any artifact with a reader other than the current session: decks, briefs, partner drafts, dashboard narrative. Name the tier first. |
| `DESIGN.md` | Building or extending any EverPass HTML surface: decks, presentations, panels. |

These four are layer-1 (identity/voice/audience/visual — tool-agnostic, reusable across
Claude Code/Antigravity/etc.), distinct from this file and `.claude/rules/*`, which are
layer-1 *rules*. A task can need one, several, or none of the four; a routine dashboard
data edit needs none of them.

## 12. Tasks scaffold

- `tasks/todo.md` — small set (3–5) of active workstreams. Not a full TASKS.md dump.
- `tasks/lessons.md` — recent correction patterns only (3–5 most recent). Promote to a global memory file when a pattern is durable.
