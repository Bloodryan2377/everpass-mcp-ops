# EVERPASS — Recent Correction Patterns

A small rolling buffer (3–5 most recent) of corrections that haven't yet earned promotion to a global feedback memory. Once a pattern is durable and crosses sessions, move it to `~/.claude/projects/.../memory/feedback_*.md` and remove it here.

Format: `YYYY-MM-DD — short title — what to do / what not to do — why`.

Last refreshed: 2026-05-04

---

## Active lessons

### 1. 2026-04-25 — Protect Desktop icons + archive tree
- **Rule:** PreToolUse hook `protect-icons-and-archive.sh` (matcher `Edit|Write|Bash|PowerShell`) blocks tool-level writes that would touch icons, shortcuts, `desktop.ini`, or the `_archive/` tree.
- **Why:** Second icon-loss incident on 2026-04-25 prompted the lockdown.
- **How to apply:** If a write fails because of this hook, **stop**. Don't try to bypass. Surface it to Ryan as an explicit override request.

### 2. 2026-04-26 — Outlook DEV intake retired
- **Rule:** Drop folders for `Outlook→Zapier DEV` are archived to `_archive/intake-dev-deprecated-2026-04-26/`. Watchers + `dev_watch_all.py` marked DEPRECATED. Schema dirs preserved for the eventual MS365 MCP migration.
- **Why:** Phase 1B audit (R-04). Zaps still live in Zapier UI but write to non-existent paths.
- **How to apply:** Don't reference the old DEV intake paths. Use `outlook-to-partner-insights` skill manually. MS365 MCP migration deferred until tools become session-stable.

### 3. 2026-04-23 — Frontmatter `updated` cap
- **Rule:** YAML frontmatter `updated:` field is the only timestamp Claude writes. Cap at today. Never use filesystem mtime. Never auto-populate milestone/future dates.
- **Why:** Drift between mtime and content age was misleading the freshness chip.
- **How to apply:** When updating an insights file, set `updated: <today>`. When the user says "mark this for next Thursday," put that in the body, not in frontmatter.

### 4. 2026-04-26 — ChatGPT bridge v3 = local synthesis
- **Rule:** Claude Code is the synthesis runtime for the ChatGPT bridge. ChatGPT/Zapier are NOT in the default loop. Custom GPT path is DEPRECATED (Custom GPTs in EverPass Product Enterprise tenant lack Apps connector access).
- **Why:** Verified live 2026-04-26.
- **How to apply:** Use `chatgpt-inbox-process-local` for synthesis. Daily drain task `chatgpt-bridge-daily-drain` runs 8:55 AM. Don't try to roundtrip via ChatGPT.

### 5. 2026-04-19 — RAG retrieval gate
- **Rule:** Retrieval marker is PRESENT (as of 2026-04-19); query CLI = `python -m rag_anything.query` from install root. Four skills may invoke Channel 5.
- **Why:** Initial install was non-functional; the marker was added when smoke tests passed.
- **How to apply:** Before invoking RAG retrieval, confirm marker still present. If absent, do not silently fall back to global search — surface it.

---

## Promoted (moved to global feedback memory)

- Cockpit-first rule → `feedback_cockpit_first.md`
- Folder=truth → `feedback_folder_path_source_of_truth.md`
- No individual names externally → `feedback_no_individual_names_external.md`
- Never send email → `feedback_never_send_email.md`
- Autonomous execution default → `feedback_autonomous_execution_default.md`
- Knowledge-graph-first navigation → `feedback_knowledge_graph_first.md`
- Desktop CWD policy → `feedback_desktop_cwd_policy.md`
