# Claude Code Ops Update Prompt — Always Use Best Available Stack Tool

Paste everything below the line into Claude Code (Windows). Run after the productivity stack is installed (or re-run anytime to refresh operating procedure).

---

## PROMPT START

You are updating my Claude Code operating system so every session **automatically selects and uses the best available tool** from the productivity stack + existing EverPass skills. This is not a one-time install — you are writing durable rules, memory, and a router that fire on every task.

### Non-negotiables

- Preserve all existing EverPass HARD rules (paths, 12h freshness, email drafts-only, Existing Deal block, Desktop ban, autonomous mode, commit+push definition of done).
- Preserve `/watch`, self-improve, dashboard validators, Desktop protect hooks.
- Do not enable every MCP. Keep context healthy.
- Windows paths. PowerShell first.
- Commit + push all durable changes to `C:\Users\ryan\code\everpass-mcp-ops` and mirror live rules into `C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\` as appropriate.
- GitHub: `Bloodryan2377/everpass-mcp-ops`.

### What “best available” means

On **every user request**, before freestyling:

1. **Classify the job** (one primary class from the router table).
2. **Inventory what is installed** under `$env:USERPROFILE\.claude\skills`, agents, ECC, MCPs, and EverPass skills.
3. **Pick the highest-ranked available tool** for that class (prefer installed skill/agent over ad-hoc prompt).
4. **Announce the pick in one short line** (e.g. `Router: notebooklm + pdf → partner research brief`).
5. **Execute with that tool**; if it fails, fall back one rank and log the miss for self-improve.
6. **Never invent a workflow** that an installed skill already owns.

If two tools tie, prefer: EverPass-specific skill > official Anthropic skill > marketing/ECC skill > generic reasoning.

---

## Phase A — Discover current surface

```powershell
$ErrorActionPreference = 'Continue'
Write-Host "=== SKILLS ==="
Get-ChildItem "$env:USERPROFILE\.claude\skills" -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name
Write-Host "=== AGENTS ==="
Get-ChildItem "$env:USERPROFILE\.claude\agents" -Directory,$env:USERPROFILE\.claude\agents -ErrorAction SilentlyContinue | Select-Object Name
Get-ChildItem "$env:USERPROFILE\.claude\agents" -ErrorAction SilentlyContinue | Select-Object Name
Write-Host "=== RULES ==="
Get-ChildItem "$env:USERPROFILE\.claude\rules" -ErrorAction SilentlyContinue | Select-Object Name
Write-Host "=== REPOMIX ==="
repomix --version 2>$null
Write-Host "=== SETTINGS HOOKS present? ==="
Select-String -Path "$env:USERPROFILE\.claude\settings.json" -Pattern "PostToolUse|PreToolUse|watch|dashboard" -ErrorAction SilentlyContinue | Select-Object -First 20
```

Also read:

- `C:\Users\ryan\code\everpass-mcp-ops\EVERPASS\CLAUDE.md` (especially section 8 skills map)
- `C:\Users\ryan\code\everpass-mcp-ops\claude-productivity-stack\INVENTORY.md`
- `C:\Users\ryan\code\everpass-mcp-ops\claude-productivity-stack\USAGE.md`
- Existing `.claude/rules/*` under EVERPASS

Build an actual **Installed Capability Matrix** (name → path → available yes/no) and save it to:

`everpass-mcp-ops/claude-productivity-stack/CAPABILITY-MATRIX.md`

Update it whenever install state changes.

---

## Phase B — Write the durable Tool Router (source of truth)

Create/overwrite these files (content must match the system below):

### B1. Rule file (auto-loaded)

**Path (tracking repo + live mirror):**

- `everpass-mcp-ops/EVERPASS/.claude/rules/productivity-stack.md`
- Live: `C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\.claude\rules\productivity-stack.md`

Use frontmatter so it loads broadly:

```yaml
---
name: productivity-stack
description: Always route tasks to the best installed skill/tool from the Claude productivity stack + EverPass skills. Applies to all EverPass work.
paths:
  - "**/*"
---
```

Full body must include:

#### HARD: Router-first procedure

At the start of every non-trivial request (anything beyond a one-line factual answer):

1. Classify → 2. Select best available → 3. State pick → 4. Execute → 5. Log outcome if tool missing/failed.

#### Job class → ranked tools

| Job class | Signals (examples) | Ranked tools (use first installed) | Fallback |
|-----------|--------------------|--------------------------------------|----------|
| FULL_CONTEXT_PACK | whole repo, multi-folder audit, “understand this codebase”, multi-model handoff | `repomix` CLI → attach output | selective `@` files |
| DOC_PDF | PDF create/edit/extract/merge | skill `pdf` | ad-hoc with warning |
| DOC_DOCX | Word, redlines, comments | EverPass `contract-redline` / `ep-redline` → `docx` | `docx` only |
| DOC_XLSX | models, forecasts, deal economics sheets | `xlsx` → EverPass negotiation-brief patterns | raw CSV |
| DOC_PPTX | PowerPoint | `pptx` → EverPass presentation skill for HTML decks | `everpass-presentation` HTML path preferred for EverPass |
| PRESENTATION_HTML | deck, slides, partner presentation | `everpass-presentation` + presentation rules → `frontend-design` | pptx only if asked |
| NOTEBOOK_RESEARCH | NotebookLM, source-grounded research, “from my notebooks” | `notebooklm` skill → `notebook-lm-sweep` for weekly pass | manual paste (discouraged) |
| PARTNER_INSIGHT | partner meeting, insight note | `partner-insights` | notebooklm |
| DEAL_TERMS | term sheet, LOI, deal economics | `deal-term-sheet` / `negotiation-brief` | xlsx + md |
| CONTRACT_LONGFORM | long agreement md | `agreement-revision` | docx skill |
| MARKETING_COPY | landing, one-pager copy, rewrite | marketing `copywriting` / `copy-editing` | freestyle |
| OUTREACH | cold email, BD sequence | marketing `cold-email` / `emails` | draft-only gmail via MCP |
| LAUNCH_GTM | launch plan, GTM | marketing `launch` + `product-marketing` | freestyle |
| AI_SEO | appear in AI answers, AEO | marketing `ai-seo` | freestyle |
| CRO | conversion, signup flow | marketing `cro` / signup skills | freestyle |
| COMPETITIVE | competitor / alternative pages | marketing `competitors` / `competitor-profiling` | research freestyle |
| CODE_REVIEW | review PR/diff, quality | ECC `code-reviewer` agent | manual review |
| SECURITY_REVIEW | vuln, secrets, auth | ECC security agent/skill | manual checklist |
| TDD_TEST | tests, coverage | ECC tdd / e2e skills | manual tests |
| REFACTOR_CLEAN | dead code, cleanup | ECC refactor-clean | manual |
| MCP_BUILD | new MCP server | official `mcp-builder` | freestyle |
| NEW_SKILL | repeated SOP → skill | official `skill-creator` + self-improve | write SKILL.md manually |
| DASHBOARD | pipeline dashboard update | EverPass dashboard skills + dashboard rules + JS validator hooks | never skip validator |
| PIPELINE | full refresh, freshness | `full-pipeline-refresh` + freshness_enforcer | partial refresh |
| MEETING_PREP | meeting prep | `meeting-prep` | partner-insights |
| VIDEO_WATCH | video/audio process | `/watch` skill | ffmpeg manual |
| OBSIDIAN | vault notes, wikilinks, bases | obsidian skills | plain md |
| PRIVATE_RAG | sensitive corpus chat, airgap | Onyx if running | NotebookLM / local files |
| VISUAL_AGENT_FLOW | multi-step agent prototype UI | Flowise then Dify | Claude Code multi-agent |
| SESSION_LEARN | improve yourself, friction | `self-improve` | notes only |
| GENERIC | unclear | ask one clarifying question OR default to best EverPass skill match | deep reasoning |

#### Selection algorithm (binding)

```
function pick(job_class):
  for tool in ranked_tools[job_class]:
    if installed(tool) and healthy(tool): return tool
  return fallback[job_class]
```

- `installed` = path exists under `~/.claude/skills|agents` or CLI on PATH or EverPass skill registered.
- `healthy` = not disabled; for MCP, enabled this session; for Docker tools, daemon up.
- Multi-class requests: pick primary class by user intent; chain secondary tools only if needed (max 3 tools per request unless user asks for a full pipeline).

#### Announcement format (always)

```
Router: <job_class> → <tool1>[ + <tool2>] (fallback avoided: <x>)
```

One line. Then do the work.

#### Anti-patterns (HARD)

- Do not freestyle PDF/DOCX/XLSX/PPTX if official skills are installed.
- Do not paste long NotebookLM sources into chat if `notebooklm` skill is installed.
- Do not dump 50 files into context if Repomix can pack them.
- Do not write marketing copy without marketing skills when installed.
- Do not disable EverPass hooks to “simplify” routing.
- Do not mass-enable ECC MCPs.
- Claude never sends email — outreach tools draft only.

---

### B2. Expand EVERPASS/CLAUDE.md section 8

Update **Skills auto-trigger map** in:

- `everpass-mcp-ops/EVERPASS/CLAUDE.md`
- Live mirror `EVERPASS/CLAUDE.md`

Keep existing rows. Add/merge:

| Trigger | Skill / tool |
|---------|----------------|
| Whole-repo / multi-file context pack | `repomix` then analyze |
| PDF | `pdf` |
| Word (generic) | `docx` |
| Excel / model | `xlsx` |
| PowerPoint | `pptx` |
| Frontend visual quality | `frontend-design` |
| New MCP | `mcp-builder` |
| Create a skill | `skill-creator` |
| NotebookLM programmatic / Q&A | `notebooklm` |
| Marketing copy | `copywriting` / `copy-editing` |
| Cold email / sequences | `cold-email` / `emails` |
| Launch / GTM | `launch` |
| AI search visibility | `ai-seo` |
| CRO | `cro` |
| Competitor pages | `competitors` / `competitor-profiling` |
| Code review agent | ECC `code-reviewer` |
| Security agent | ECC security reviewer |
| Obsidian vault | `obsidian-*` skills |
| Stack routing / “best tool” | rule `productivity-stack` (always on) |

Add a short new subsection **8b. Best-available rule**:

> Before executing, run the productivity-stack router. Prefer installed skills over improvised prompts. State `Router: …` once, then execute.

---

### B3. Global user memory / CLAUDE preference snippet

If `C:\Users\ryan\.claude\CLAUDE.md` or user memory files exist, append a concise block (do not delete existing content):

```markdown
## Productivity stack (always on)

- Use the EverPass `productivity-stack` router on every non-trivial task.
- Prefer installed skills (official docs, marketing, notebooklm, ECC agents, EverPass domain skills, repomix) over freestyle.
- Announce pick: `Router: <class> → <tool>`.
- Inventory: `everpass-mcp-ops/claude-productivity-stack/CAPABILITY-MATRIX.md`.
- Self-improve when a tool was missing, wrong, or bypassed without reason.
```

---

### B4. SessionStart insight hook (optional but preferred)

If a SessionStart hook can run safely without breaking existing hooks, add a **lightweight** reminder that only prints:

```
[stack] Router active. Skills: N installed. Repomix: yes/no. NotebookLM skill: yes/no.
```

Implement via a small PowerShell script:

`everpass-mcp-ops/scripts/stack-session-banner.ps1`

And document the exact JSON snippet for `~/.claude/settings.json` SessionStart — **merge**, do not replace file. If merge risk is high, skip hook and rely on the rule file + CLAUDE.md only; note that in the report.

---

### B5. Self-improve integration

Update or add note in self-improvement skill/docs:

When you notice:

- freestyled a job that had a skill,
- skill missing that would have helped,
- wrong tool picked,
- Repomix would have saved tokens,

→ queue a `self-improve` proposal (MED/HIGH as appropriate), title like `Router miss: used freestyle instead of xlsx`.

---

### B6. Skill: `best-tool-router` (thin orchestrator)

Create:

`$env:USERPROFILE\.claude\skills\best-tool-router\SKILL.md`

And mirror under `everpass-mcp-ops/claude-productivity-stack/skills/best-tool-router/SKILL.md`.

```markdown
---
name: best-tool-router
description: Route any task to the best installed Claude skill, ECC agent, CLI tool, or EverPass skill. Use at session start, when the user says "use the best tool", or whenever work spans multiple possible skills.
---

# Best Tool Router

## When to load
- User says: best tool, route this, use the stack, optimize tooling
- Task is multi-domain or ambiguous
- Before large deliverables

## Procedure
1. Read `claude-productivity-stack/CAPABILITY-MATRIX.md` (refresh if stale > 7 days or install changed).
2. Classify job class per `EVERPASS/.claude/rules/productivity-stack.md`.
3. Select first installed tool in rank order.
4. Print `Router: …` line.
5. Invoke that skill/agent/CLI; chain at most 2 supporting tools.
6. If preferred tool missing, install-from-stack only if user asked to install; else fallback + self-improve proposal.

## Never
- Bypass EverPass HARD rules
- Send email
- Bulk-enable MCPs
```

---

## Phase C — Insights / memory corpus

Create:

`everpass-mcp-ops/claude-productivity-stack/INSIGHTS.md`

Seed with operational insights:

1. Document skills beat prompt-only Office generation for fidelity.
2. Repomix before multi-file dashboard work reduces missed dependencies.
3. NotebookLM skill > paste for contract/research packs already in notebooks.
4. Marketing skills for external narrative; EverPass SOUL/VOICE for brand constraints — apply EverPass comms HARD rules on top of marketing skills.
5. ECC agents for review/security; EverPass skills for domain deals/dashboard.
6. Context window: few MCPs enabled; many skills installed is OK (metadata cheap).
7. Docker platforms (Flowise/Dify/Onyx) are overflow valves, not daily defaults.

Also add a memory note path Claude Code uses if present (e.g. project memory):

`Router default ON as of YYYY-MM-DD. Capability matrix at everpass-mcp-ops/claude-productivity-stack/CAPABILITY-MATRIX.md.`

---

## Phase D — Wire “every time” behavior into daily SOP

Add a short section to Daily SOP or OPERATOR-NOTES:

**Start of substantive work:** router line required.
**End of session:** if any router miss, self-improve propose.

---

## Phase E — Validation

1. Dry-run 8 hypothetical tasks; print router picks only (no full execution):

   - “Redline this partner MSA docx”
   - “Pack the dashboard folder and find JS drift risk”
   - “Draft a cold email sequence for a new distributor”
   - “Pull answers from the NFL notebook in NotebookLM”
   - “Build an xlsx of deal scenarios”
   - “Review this PowerShell automation for security”
   - “Update pipeline dashboard after Charter note”
   - “/watch this game clip and summarize”

2. Confirm each pick matches the table and an installed tool when available.

3. Confirm `productivity-stack.md` exists live + in repo.

4. Confirm section 8/8b updated in CLAUDE.md.

5. Commit + push:

```powershell
cd C:\Users\ryan\code\everpass-mcp-ops
git add EVERPASS/CLAUDE.md EVERPASS/.claude/rules/productivity-stack.md claude-productivity-stack scripts
git commit -m "feat: always-on best-tool router for productivity stack"
git push origin main
```

---

## Phase F — Report back

Return:

1. Files written (paths)
2. Capability matrix summary (counts)
3. Hook merge status (done / skipped + why)
4. Eight dry-run router picks
5. Commit SHA + URL
6. One-screen “how Claude will behave tomorrow morning”

## PROMPT END
