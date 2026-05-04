# CHANGELOG

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
