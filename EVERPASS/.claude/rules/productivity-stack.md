---
name: productivity-stack
description: Always route tasks to the best installed skill/tool from the Claude productivity stack + EverPass skills. Applies to all EverPass work.
paths:
  - "**/*"
---

# Productivity stack — best-available router (HARD)

This rule is **always on** for EverPass work. It does not replace other HARD rules (paths, freshness, email drafts-only, Existing Deal, Desktop ban). It chooses **how** work is done.

## Router-first procedure

On every non-trivial request (anything beyond a one-line factual answer):

1. **Classify** the job (primary class from the table below).
2. **Select** the first **installed + healthy** tool in rank order.
3. **Announce** one line: `Router: <job_class> → <tool>[ + <support>]`.
4. **Execute** with that tool (do not freestyle a job an installed skill owns).
5. **Fallback** one rank if the tool fails; if you freestyled or missed a better tool, queue `self-improve`.

Prefer: **EverPass domain skill → official Anthropic skill → marketing / ECC skill → CLI (repomix) → freestyle.**

Max **3** tools chained per request unless the user asks for a full pipeline.

## Job class → ranked tools

| Job class | Signals | Ranked tools (first installed wins) | Fallback |
|-----------|---------|--------------------------------------|----------|
| FULL_CONTEXT_PACK | whole repo, multi-folder audit, handoff pack | `repomix` then analyze | selective file `@` |
| DOC_PDF | PDF create/edit/extract | `pdf` | ad-hoc + warn |
| DOC_DOCX | Word generic | `docx` | ad-hoc + warn |
| DOC_DOCX_REDLINE | contract redline | `contract-redline` / `ep-redline` → `docx` | `docx` |
| DOC_XLSX | models, deal sheets | `xlsx` | CSV + warn |
| DOC_PPTX | PowerPoint | `pptx` | HTML deck path |
| PRESENTATION_HTML | deck, slides, partner presentation | `everpass-presentation` + presentation rules → `frontend-design` | `pptx` if asked |
| NOTEBOOK_RESEARCH | NotebookLM Q&A, source-grounded | `notebooklm` | paste (discouraged) |
| NOTEBOOK_SWEEP | weekly notebook sweep | `notebook-lm-sweep` | manual |
| PARTNER_INSIGHT | partner meeting / insight | `partner-insights` | `notebooklm` |
| DEAL_TERMS | term sheet, LOI, economics | `deal-term-sheet` / `negotiation-brief` | `xlsx` + md |
| CONTRACT_LONGFORM | long agreement .md | `agreement-revision` | `docx` |
| MARKETING_COPY | landing/one-pager copy | `copywriting` / `copy-editing` | freestyle |
| OUTREACH | cold email, sequences | `cold-email` / `emails` (draft only) | Gmail MCP draft |
| LAUNCH_GTM | launch, GTM | `launch` + `product-marketing` | freestyle |
| AI_SEO | AI-answer visibility / AEO | `ai-seo` | freestyle |
| CRO | conversion optimization | `cro` / signup skills | freestyle |
| COMPETITIVE | competitor / alternative pages | `competitors` / `competitor-profiling` | research freestyle |
| CODE_REVIEW | review diff/PR | ECC `code-reviewer` | manual |
| SECURITY_REVIEW | security, secrets, auth | ECC security agent/skill | checklist |
| TDD_TEST | tests, coverage | ECC tdd / e2e | manual tests |
| REFACTOR_CLEAN | dead code cleanup | ECC refactor-clean | manual |
| MCP_BUILD | new MCP server | `mcp-builder` | freestyle |
| NEW_SKILL | repeated SOP → skill | `skill-creator` + `self-improve` | hand-written SKILL.md |
| DASHBOARD | pipeline dashboard | EverPass dashboard skills + dashboard rules + JS validator | never skip validator |
| PIPELINE | full refresh / freshness | `full-pipeline-refresh` + freshness_enforcer | partial |
| MEETING_PREP | meeting prep | `meeting-prep` | `partner-insights` |
| VIDEO_WATCH | video/audio process | `/watch` | ffmpeg manual |
| OBSIDIAN | vault, wikilinks, bases | `obsidian-*` skills | plain md |
| PRIVATE_RAG | sensitive local corpus | Onyx if running | NotebookLM / files |
| VISUAL_AGENT_FLOW | multi-step agent UI | Flowise → Dify | Claude subagents |
| SESSION_LEARN | improve yourself / friction | `self-improve` | notes only |
| GENERIC | unclear | one clarifying question OR closest EverPass skill | deep reasoning |

## Selection algorithm

```
for tool in ranked_tools[job_class]:
  if installed(tool) and healthy(tool): use it
use fallback
```

- **installed** = under `~/.claude/skills` or `~/.claude/agents`, or EverPass skill registered, or CLI on PATH.
- **healthy** = not disabled; MCP enabled this session if required; Docker up for Flowise/Dify/Onyx.
- Capability inventory: `everpass-mcp-ops/claude-productivity-stack/CAPABILITY-MATRIX.md` (refresh when installs change).

## Announcement format

```
Router: <job_class> → <tool1>[ + <tool2>]
```

Then execute. No essay.

## Anti-patterns (HARD)

- Do not freestyle PDF/DOCX/XLSX/PPTX when those skills are installed.
- Do not paste long NotebookLM sources when `notebooklm` is installed.
- Do not dump dozens of files when `repomix` can pack them.
- Do not write external marketing copy without marketing skills when installed — still apply EverPass comms HARD rules (no individual names externally; drafts only for email).
- Do not disable dashboard validation or Desktop protect hooks.
- Do not mass-enable ECC MCPs (context window).
- Claude **never** sends email.

## Stack references

- Inventory: `claude-productivity-stack/INVENTORY.md`
- Usage: `claude-productivity-stack/USAGE.md`
- Insights: `claude-productivity-stack/INSIGHTS.md`
- Install prompt: `claude-productivity-stack/CLAUDE-CODE-INSTALL-PROMPT.md`
- Ops update prompt: `claude-productivity-stack/CLAUDE-CODE-OPS-UPDATE-PROMPT.md`
