---
name: best-tool-router
description: Route any task to the best installed Claude skill, ECC agent, CLI tool, or EverPass skill. Use at session start for ambiguous work, when the user says "use the best tool" / "route this" / "use the stack", or before large multi-domain deliverables.
---

# Best Tool Router

## When to load

- User says: best tool, route this, use the stack, optimize tooling, pick the right skill
- Task spans multiple domains (e.g. research + deck + email)
- Before large deliverables when the default path is unclear

## Procedure

1. Read capability inventory:
   - `claude-productivity-stack/CAPABILITY-MATRIX.md` in everpass-mcp-ops
   - If missing or older than 7 days, rescan `~/.claude/skills`, `~/.claude/agents`, and CLIs (`repomix`, docker).
2. Classify **one primary** job class using `EVERPASS/.claude/rules/productivity-stack.md`.
3. Walk the ranked tool list; pick first installed + healthy.
4. Print exactly one line:
   ```
   Router: <job_class> → <tool>[ + <support>]
   ```
5. Load/invoke that skill or agent. Chain at most two supporting tools.
6. If the preferred tool is missing:
   - Do **not** silent-install unless the user asked to install.
   - Use fallback.
   - Queue `self-improve` with title `Router miss: <class> needed <tool>`.

## EverPass constraints (never override)

- Email = drafts only
- No individual names in external-facing content
- Existing Deal paths blocked without explicit approval
- Dashboard writes go through JS validator hooks
- OneDrive EverPass tree is canonical; NotebookLM is a mirror

## Related

- Full router table: `EVERPASS/.claude/rules/productivity-stack.md`
- Usage cheat sheet: `claude-productivity-stack/USAGE.md`
- Insights: `claude-productivity-stack/INSIGHTS.md`
