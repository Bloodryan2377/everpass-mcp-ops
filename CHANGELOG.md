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
