# CHANGELOG

## 2026-06-30 — CI + validation + expiry surfacing (gap-fill)

### Added
- `.github/workflows/insights-pipeline.yml` — CI on every push/PR touching the
  pipeline: unit tests, `--validate`, and a deterministic `--all --check
  --ignore-expiry` (proves the committed cockpit is in sync with the notes).
- `--validate` — read-only structural check across all notes; flags duplicate
  `intel_key` / todo `id` / critical title (which ingest would otherwise resolve
  silently by last-writer-wins) and parse failures. Exit 2 on any problem.
- `--ignore-expiry` — treat non-retired notes as active regardless of
  `expires_at`, so the CI drift check is independent of wall-clock and never
  flakes as items age out.
- `--list` now shows an EXPIRES column and flags items expired or expiring within
  14 days, with a "run a sync to age them out" hint.

### Tests
- Suite now 15 cases: added validate-clean, validate-catches-duplicate-key,
  ignore-expiry-keeps-active, and list-flags-soon-expiry.

### Verification
- `python -m unittest discover -s tests` → 15 passed.
- Real chain: `--validate` OK (2 notes, no collisions); `--all --check
  --ignore-expiry` clean; `--list` shows both items active with expiry dates.

---

## 2026-06-30 — Evolve the system: lifecycle, registry, tests, bug fix

Makes the insights → chain pipeline production-grade: intel can now leave the
chain, there's a registry view, a regression suite, and a latent signal-collision
bug is fixed.

### Lifecycle (retire / expiry)
- `ingest_market_intel.py` — a note's `epc-chain` block may declare
  `status: "retired"` or `expires_at: "<ISO-Z>"`. Retired/expired notes have their
  signal (by `intel_key`), todo (by `id`, decrementing `total`), and critical (by
  title, recomputing `critical_count`) **removed** from the cockpit. Because the
  SessionStart hook runs `--all`, expired intel ages out automatically.
- Live notes given sunsets: Dish `expires_at` 2026-07-21, NBCU 2026-09-30.

### Registry + testability
- `--list` mode: prints each note's lifecycle state and whether it's in the chain.
- Engine paths are now overridable via `EPC_COCKPIT` / `EPC_FEED_INDEX` /
  `EPC_INSIGHTS_DIR` env vars so it can run against an isolated fixture tree.
- `tests/test_insights_pipeline.py` — 11-case stdlib `unittest` suite (subprocess
  against a temp tree). Covers insert, idempotency, `--check` exit codes, `total`
  not reset to preview length, `critical_count` recompute, newest-first ordering,
  retire, expiry, title-collision coexistence, and legacy un-keyed adoption.
  Run: `python -m unittest discover -s tests`.

### Bug fix
- `upsert_signal` title-fallback now only adopts a pre-existing **un-keyed**
  (legacy/manual) signal — never one that already carries a different `intel_key`.
  Previously two notes sharing a signal title could silently overwrite each other.
  Caught by the new test suite; the Dish reconciliation path still works.

### Verification
- `python -m unittest discover -s tests` → 11 passed.
- Real chain still `--check` clean after the refactor (no behavior change for the
  existing Dish/NBCU items); `--list` shows both active / in-chain.

---

## 2026-06-30 — Insight-note scaffolder (article → note)

Closes the last manual step in the pipeline: instead of hand-writing a note's
frontmatter + body + `epc-chain` block, render it from a compact JSON spec.

### Added
- `scripts/new_insight.py` — takes a JSON spec (`--from-json FILE|-`), renders a
  complete `epc-market-intel/v1` note under `data/insights/` (standard sections +
  the `epc-chain` machine block), and runs the ingest by default (`--no-sync` to
  skip; `--force` to overwrite). Derives `intel_key` from the slug, `todo.id` from
  `intel:<partner>:<slug>`, and the critical title from partner + headline when not
  supplied. Required spec fields: `slug`, `partner`, `title_short`, `tldr`.

### Verified
- Throwaway spec → valid note (frontmatter + chain parse; derived ids correct) →
  ingested into the cockpit (signal + todo + critical) → smoke artifacts removed,
  chain back in sync.

---

## 2026-06-30 — Critical-item support + NBCUniversal spinoff intel

Extends the insights → chain pipeline to surface intel in the cockpit's
**Critical now** section, and adds a second market-intel item (NBCUniversal).

### Engine
- `scripts/ingest_market_intel.py` — notes may now declare a `critical` object in
  their `epc-chain` block (`title`, `body`, `position` top|bottom). The engine
  upserts it into `morning_brief.critical` (keyed by title, idempotent) and
  recomputes `critical_count = len(critical)`. `position` defaults to **bottom**
  so monitor-only market intel surfaces without outranking genuine same-day
  deadlines. Change-detection fingerprint extended to include the critical list.

### Intel added
- `data/insights/2026-06-30-market-intel-nbcuniversal-comcast-spinoff.md` (new) —
  WSJ (Joe Flint): Comcast splitting in two, spinning off NBCUniversal next year
  under Mike Cavanagh; widely seen as the next acquisition target. Captured as a
  content-rights counterparty/ownership-continuity signal on a core EverPass
  partner (Peacock/NBCSN exclusives), plus a near-term commercial opening.
  Carries signal + partner todo + critical item.
- `data/insights/2026-06-30-market-intel-dish-dbs-chapter-11.md` — added a
  `critical` block (DISH DBS CHAPTER 11 WATCH).

### Result in cockpit
- `morning_brief.critical` 9 → 11 (Dish + NBCU appended, tagged "market intel ·
  monitor-only"); `critical_count` 9 → 11.
- `bridge_signals` 11 → 12 (NBCU leads by recency); `partner_todos.total`
  178 → 179.

### Verification
- `--check` drift → apply → idempotent re-apply (no-op) → `--check` clean.
- JSON valid; insights index regenerated with both notes.

---

## 2026-06-30 — Automated insights → chain pipeline

Turns the one-off Dish market-intel injection into a repeatable, automatic
pipeline so market intelligence ties into the cockpit chain without hand-editing
the JSON feeds.

### Added
| File | Purpose |
|---|---|
| `scripts/ingest_market_intel.py` | **Engine.** Reads insight notes under `data/insights/` (frontmatter + a fenced ` ```epc-chain ` JSON block) and upserts each note's bridge signal + optional partner todo into `data/mobile/mobile-cockpit.json`; syncs the feed manifest; regenerates the insights index. Idempotent (keyed by `intel_key` / todo `id`); freshness timestamps bumped only on real content change; `partner_todos.total` incremented per new todo (never reset to the capped preview length). Modes: `--all`, explicit paths, `--check` (dry-run, rc=1 on drift), `--now` (pin timestamp). |
| `scripts/sync-insights-to-chain.sh` | **Wrapper.** Forgiving entry point used by hand and by the optional hooks; always exits 0 so it never blocks a session start or an edit. |

**Auto tie-in (operator-installed, not committed):** a SessionStart hook (sync on
session open) + a PostToolUse `Edit|Write` hook (re-sync when `data/insights/`
changes), both calling the wrapper. Because these are auto-executing startup
config, they are intentionally not committed as active config — install them into
the project's Claude Code `settings.json` deliberately, the way
`hooks/preToolUse-snippet.json` is mirrored into `~/.claude/settings.json`. (Until
then, run the wrapper by hand after dropping a note.)

### Changed
- `data/insights/2026-06-30-market-intel-dish-dbs-chapter-11.md` — added the
  self-describing `epc-chain` block so the engine manages the note's cockpit
  entries; the existing manually-injected signal was reconciled in place (stamped
  with `intel_key: dish-dbs-chapter-11`) rather than duplicated.
- `data/insights/_index.md` — now regenerated by the engine.
- `README.md` — documents the insights → chain pipeline.

### Verification
- `--check` reports drift before apply, clean (rc=0) after; second apply is a
  no-op (idempotent).
- End-to-end smoke test (throwaway note): signal injected and sorted to the front
  by `produced_at`, todo added, `total` bumped by exactly 1; smoke artifacts then
  removed, leaving the Dish-only state (11 signals / total 178). `--check` clean.
- `python3 -c "json.load(...)"` on cockpit + feed-index + hook snippet → valid.

---

## 2026-06-30 — Chain + system update: market intel (Dish DBS Chapter 11)

Market-info update to the user-facing chain. Source: The Desk (Matthew Keys,
2026-06-29), citing the Wall Street Journal — **Dish DBS (parent of Dish Network,
Sling TV, and Boost Mobile, a subsidiary of Echostar) is preparing a Chapter 11
filing as soon as this week** after missing a June 1 debt repayment amid FCC
build-out scrutiny. EverPass already carries an open *Dish Business partnership
exploration* intel thread, so this is captured as a **counterparty-solvency flag**,
not a closed door.

### Changes
| File | Change |
|---|---|
| `data/insights/2026-06-30-market-intel-dish-dbs-chapter-11.md` | **New** structured market-intel note (`epc-market-intel/v1`): facts, EverPass implications, recommended posture (hold/do-not-advance the Dish exploration; no pre-petition commitments; monitor-only), and sources. |
| `data/insights/_index.md` | **New** index for the human-readable insight notes folder. |
| `data/mobile/mobile-cockpit.json` | Prepended a `market-intel` **bridge_signal** for the Dish Chapter 11 news; added a Dish **partner_todo** (`intel:dish:dbs-preparing-chapter-11-counterparty-risk-on-exploration`, category Distribution, priority high); bumped `partner_todos.total` 177→178; refreshed `generated_at`, `partner_todos.last_extracted_at`, and `freshness.{cockpit_data_mtime,bridge_cache_mtime}` to 2026-06-30. |
| `data/mobile/mobile-feed-index.json` | Synced the `mobile-cockpit.json` manifest entry `generated_at` to the refreshed feed. |

### Behavior
- Mobile cockpit home surface now renders the Dish bankruptcy as the newest
  **Bridge signal** (`renderSignals` reads title/summary/key_points/confidence/
  produced_at) and as a high-priority **Dish partner todo** (`renderTodos`),
  routing to the Dish partner view.
- The insight note is the canonical human-readable artifact; the cockpit entries
  link back to it via `web_link` / todo text.

### Verification
- `python3 -c "json.load(...)"` on `mobile-cockpit.json` and `mobile-feed-index.json` → valid.
- Confirmed: bridge_signals[0] = Dish Chapter 11 signal; 2 Dish todos present;
  `partner_todos.total` = 178; `generated_at` = 2026-06-30.

### Scope note
Only feeds actually touched were re-timestamped (cockpit + its manifest entry).
Subsystem timestamps not regenerated by this update (meetings, morning brief,
asks, status) were left unchanged so the chain reflects true freshness rather
than a blanket bump.

---

## 2026-05-04 — Dashboard JS validator wrapper + canonical path fix

Resolves a noisy hook target identified after the verification pass: the global PostToolUse hook (`matcher: Edit|Write`, trigger phrase "Pipeline Decision-Making Dashboard") referenced `EVERPASS TOOLS/Dashboard/.claude/validate-dashboard-js.sh`, which did not exist. The canonical validator lives at `_support/tooling/.claude/validate-dashboard-js.sh` and additionally hard-coded a stale `EVERPASS/Dashboard/...` path (missing the `EVERPASS TOOLS/` segment), so it silently no-op'd against the live HTML.

### Changes
| File | Change |
|---|---|
| `EVERPASS TOOLS/Dashboard/.claude/validate-dashboard-js.sh` | **New** thin defensive wrapper at the path the hook expects. Delegates to the canonical script when present, exits 0 cleanly otherwise (no false failures). |
| `EVERPASS TOOLS/Dashboard/_support/tooling/.claude/validate-dashboard-js.sh` | Replaced hard-coded stale `DASH=` with `${DASHBOARD_HTML:-<correct EVERPASS TOOLS path>}` so the wrapper can pass the live path and the script also works standalone. |

### Behavior
- Hook trigger → wrapper runs → canonical validator exec'd against the live dashboard → 7,825-byte JS+structure check (21 load-bearing arrays + Node `--check` per `<script>` block).
- Live dashboard validates clean (`rc=0`, "Dashboard JS integrity check passed").
- Wrapper degrades gracefully: missing dashboard HTML or missing canonical script → emits info context and exits 0 instead of failing the edit chain.

### Verification
- `python -c "json.load(open('~/.claude/settings.json'))"` → settings.json valid
- `bash .../Dashboard/.claude/validate-dashboard-js.sh` → rc=0, integrity check passed
- Both files mirrored to this tracking repo

---

## 2026-05-04 — Claude Code infrastructure scaffold

Audit-reviewed implementation of path-scoped rules + per-subtree CLAUDE.md hierarchy + tasks scaffold + operational hooks. Platform-neutral; forward-compatible with Antigravity.

### Added — Path-scoped rule files (`EVERPASS/.claude/rules/`)
All use `paths:` frontmatter (per current Claude Code documentation; equivalent to Cursor's `globs:`).

| File | Paths matched | Purpose |
|---|---|---|
| `partner-insights.md` | `CONTENT PARTNERSHIPS/**/*insights*.md` | Partner intelligence file edit doctrine |
| `contracts.md` | `**/_contracts_md*/**`, `**/Contract Master*` | Contract markdown + xlsx workbook rules |
| `dashboard.md` | `EVERPASS TOOLS/Dashboard/**` | Dashboard HTML + JS validation gate (existing content preserved + frontmatter prepended) |
| `presentations.md` | `EVERPASS TOOLS/Presentations/**` | Presentation factory (skill auto-trigger, shell enforcement) |
| `legal-redline.md` | `**/Negotiation Folder/**/*.docx` | Tracked-change redline workflow |
| `notebook-lm.md` | `**/NotebookLM*/**` | Sweep skill + Playwright DOM doctrine |

### Added — CLAUDE.md hierarchy
| File | Scope |
|---|---|
| `EVERPASS/CLAUDE.md` | Workspace-wide constants: 12h freshness, OneDrive canonical, source-of-truth model, UC-001, skill auto-trigger map, current pipeline state |
| `EVERPASS/CONTENT PARTNERSHIPS/CLAUDE.md` | Folder=truth doctrine, partner insights primary artifact, NP-001 onboarding, Existing Deal protection |
| `EVERPASS/EVERPASS TOOLS/Dashboard/CLAUDE.md` | Live file authoritative, router menu, JS validation gate, splice safety, cockpit projections |
| `EVERPASS/EVERPASS TOOLS/Presentations/CLAUDE.md` | Pre-existing — preserved untouched (already canonical, comprehensive) |

### Added — Tasks scaffold
| File | Purpose |
|---|---|
| `EVERPASS/tasks/todo.md` | 5 active workstreams (MS365 MCP, per-partner state.json, Plaud watcher, Contract Master wiring, NotebookLM sweep) — NOT a full TASKS.md dump |
| `EVERPASS/tasks/lessons.md` | 5 most recent correction patterns — promoted to global feedback memory when durable |

### Added — Operational hooks (`~/.claude/settings.json`, PreToolUse)
| Hook | Matcher | Behavior |
|---|---|---|
| `pre-pipeline-refresh` | `Bash\|PowerShell` | When command matches `pipeline.*refresh`: blocks if OneDrive process not running OR network unreachable |
| `pre-dashboard-publish` | `Bash\|PowerShell` | When command matches `\bpublish\b\|\bdeploy\b\|netlify deploy`: runs `freshness_enforcer.py`; blocks on rc=2 (FAIL) |
| `pre-external-share` | `Bash\|PowerShell\|Edit\|Write` | When command suggests share/upload AND target path contains `_archive/` or `DRAFT[_ -]`: blocks |

### Backup created
- `~/.claude/settings.json.bak.2026-05-04-preCCInfra` (pre-modification snapshot of the global settings file)

### Forward compatibility
- All rule files use `paths:` (same shape as Cursor / Antigravity globs).
- All CLAUDE.md files are plain markdown with no Claude-Code-specific syntax beyond the file location convention.
- Hook commands are bash (forward-portable to any harness that runs shell commands).
- The repo at `Bloodryan2377/everpass-mcp-ops` mirrors the `EVERPASS/` scaffold; it is the canonical reference, not the live workspace.

---

## 2026-05-04 — Post-implementation verification + path-drift fixes

Verification sweep run against live OneDrive workspace. All scaffold targets present and loading-eligible. Three pre-existing hook-path drift issues (all consequences of the same `EVERPASS/Dashboard/` → `EVERPASS TOOLS/Dashboard/` correction the rollout already applied to CLAUDE.md hierarchy) discovered and patched.

### Verification results
- **Filesystem placement:** PASS — all 6 rule files, 4 CLAUDE.md files, both `tasks/` files exist at intended paths (`CONTENT PARTNERSHIPS/`, `EVERPASS TOOLS/Dashboard/`, `EVERPASS TOOLS/Presentations/`).
- **Rule frontmatter:** PASS — every rule file has valid `paths:` frontmatter; all globs match real folders (one dead glob fixed, see below).
- **Hooks JSON validity:** PASS — `settings.json` parses; backup `settings.json.bak.2026-05-04-preCCInfra` intact.
- **3 new PreToolUse hooks:** PASS — `pre-pipeline-refresh`, `pre-dashboard-publish` (`freshness_enforcer.py` confirmed at `EVERPASS TOOLS/Scripts/freshness_enforcer.py`), `pre-external-share` all present, exactly once, attached to intended matchers.

### Surgical fixes applied
1. `~/.claude/settings.json` — 4 stale path references (pre-existing, unrelated to the new 3 hooks but exposed by verification):
   - PostToolUse Edit|Write Negotiation-Folder audit log: `Desktop/EVERPASS/Operations & Strategy` → `OneDrive/EVERPASS/Operations & Strategy` (Desktop write violated `feedback_desktop_cwd_policy`).
   - PostToolUse Edit|Write JS-validation hook: `EVERPASS/Dashboard/.claude/validate-dashboard-js.sh` → `EVERPASS TOOLS/Dashboard/.claude/validate-dashboard-js.sh`.
   - PreToolUse Edit|Write dashboard backup: `EVERPASS/Dashboard/EverPass Media _ Content Pipeline Decision-Making Dashboard.html` → `EVERPASS TOOLS/Dashboard/...`.
   - PreToolUse Edit|Write Pipeline Flow backup: `EVERPASS/Dashboard/EverPass Content Pipeline Flow.html` (+ `Dashboard Info/...bak`) → `EVERPASS TOOLS/Dashboard/...`.
2. `EVERPASS/.claude/rules/notebook-lm.md` (live + repo) — dead third glob `EVERPASS TOOLS/AI Related/NotebookLM*/**` replaced with real path `EVERPASS TOOLS/NotebookLM/**`. (Globs 1 + 2 were already covering it; cleanup only.)

### Re-validation
- `python -c "json.load(...)"` on patched `settings.json`: PASS.
- `grep -c "EVERPASS/Dashboard"` post-patch: 0 matches.
- `grep -c "Desktop/EVERPASS"` post-patch: 0 matches.

### Outstanding hardening (single best next step)
- `EVERPASS TOOLS/Dashboard/.claude/validate-dashboard-js.sh` does not exist. The PostToolUse hook now points at the right path, but the script itself is missing — the hook will silently exit non-zero on every dashboard edit. Either (a) create the validator script (run `node --check` on each `<script>` block in the dashboard HTML), or (b) gate the hook with `[ -f "$VALIDATOR" ] && bash "$VALIDATOR"` so it no-ops cleanly when absent. Treating this as the highest-leverage next hardening step.

### Antigravity-readiness audit (minimal)
Reusable across any harness that respects file-location-based rule loading (Antigravity, Cursor, future):
- `EVERPASS/.claude/rules/*.md` — frontmatter `paths:` is the portable contract.
- `EVERPASS/CLAUDE.md` and the per-subtree `CLAUDE.md` files — plain markdown, no harness-specific tags.
- `EVERPASS/tasks/todo.md`, `EVERPASS/tasks/lessons.md` — plain markdown.

Claude-Code-specific (would need re-shimming for an Antigravity wrapper layer):
- `~/.claude/settings.json` hook entries (PreToolUse / PostToolUse / matcher syntax).
- The bash-command shape of the 3 new gates (pipeline refresh, dashboard publish, external share) — logic is harness-neutral but the wiring is not.

Forward path: when wrapping with Antigravity, port the 3 new hooks as Antigravity-equivalent pre-action gates; leave the rule files and CLAUDE.md hierarchy untouched.
