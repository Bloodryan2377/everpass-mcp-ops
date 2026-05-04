# Operator Notes — Claude / Antigravity Operating Layer

Short, current, operational. Updated 2026-05-04.

## Canonical local root

`C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\`

Never write to `C:\Users\ryan\Desktop\` or `C:\Users\ryan\OneDrive\EVERPASS\` (personal,
unused). Stop/SessionStart hooks auto-archive Desktop leakage to
`_archive/desktop-sweep/`.

## Tracking repo

`Bloodryan2377/everpass-mcp-ops` (this repo). Local clone: `C:\Users\ryan\code\everpass-mcp-ops`.
Mirrors the reusable Claude Code scaffold for the EverPass workspace plus the dashboard
JS-validation wrapper. Source of truth for the scaffold; the live OneDrive tree is the
runtime.

## What is now live

- **Dashboard JS validator wrapper:** `EVERPASS TOOLS/Dashboard/.claude/validate-dashboard-js.sh`.
  Invoked by the global PostToolUse `Edit|Write` hook in `~/.claude/settings.json` whenever
  a write touches `Pipeline Decision-Making Dashboard`. Calls the canonical validator under
  `EVERPASS TOOLS/Dashboard/_support/tooling/.claude/validate-dashboard-js.sh`.
- **Dashboard path:** canonical = `EVERPASS TOOLS/Dashboard/`. The legacy `EVERPASS/Dashboard/`
  path is dead. All active rule, hook, doc, skill, and verifier references have been moved.
- **Project-local hooks** (`EVERPASS/.claude/settings.local.json`, dashboard tooling
  `settings.local.json`) point at the canonical wrapper.
- **Drift checks** (`check-dashboard-drift.sh`, `check-embedded-drift.sh`,
  `dashboard-drift-check` skill) all reference the canonical path.

## Three layers — what is what

1. **Reusable core instructions** (this repo): `EVERPASS/CLAUDE.md`,
   `EVERPASS/.claude/rules/*.md`, `EVERPASS/EVERPASS TOOLS/Dashboard/CLAUDE.md`,
   `EVERPASS/EVERPASS TOOLS/Presentations/CLAUDE.md`, `EVERPASS/tasks/*`. Tool-agnostic.
   Reuse verbatim across Claude Code, Antigravity, Cursor, etc.
2. **Claude-specific wrappers** (this repo + live tree): `hooks/preToolUse-snippet.json`,
   live `~/.claude/settings.json` PostToolUse + PreToolUse hooks, the dashboard JS-validation
   wrapper. Coupled to Claude Code's hook contract and `$CLAUDE_TOOL_INPUT` envelope.
3. **Future Antigravity wrappers** (not in repo yet): when Ryan adopts Antigravity, mirror
   the layer-1 instruction set unchanged, then port layer-2 wrappers to whatever Antigravity's
   pre/post-tool surface is. Keep layer 1 untouched during the port.

## Do not touch casually

- `~/.claude/settings.json` — global Claude Code config; one bad edit kills hooks.
- `~/.claude/hooks/protect-icons-and-archive.sh` — Desktop guard. Removal requires explicit
  instruction.
- `EVERPASS TOOLS/Dashboard/.claude/validate-dashboard-js.sh` — wrapper invoked by the global
  PostToolUse hook on every dashboard write. Path is hardcoded in the hook.
- `EVERPASS TOOLS/Dashboard/_support/tooling/.claude/validate-dashboard-js.sh` — canonical
  validator that the wrapper delegates to.
- `EVERPASS/.claude/CLAUDE.md`, `EVERPASS/.claude/rules/automation.md` — least-privilege
  scheduled-task write surfaces; out-of-band edits silently widen automation scope.
- `EVERPASS TOOLS/Dashboard/_support/docs/{PATHS.md,OPERATING-GUIDE.md,CLAUDE.md}` —
  authoritative dashboard governance.
- Any `.bak*` / `_archive/**` file — historical, untouchable, do not "fix" stale paths inside.

## Verification one-liners

```bash
# Live validation
bash "C:/Users/ryan/OneDrive - EverPass Media/EVERPASS/EVERPASS TOOLS/Dashboard/.claude/validate-dashboard-js.sh"

# Stale-path scan (active infra only — should return zero hits outside .bak/_archive/recent-memory/morning-brief/system-audits)
# Run from EVERPASS root and visually filter archive/log noise.

# Freshness gate (12h rule)
python "C:/Users/ryan/OneDrive - EverPass Media/EVERPASS/EVERPASS TOOLS/Scripts/freshness_enforcer.py"
```
