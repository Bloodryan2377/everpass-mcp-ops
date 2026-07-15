# Capability matrix

Last refreshed: **2026-07-15** (template — re-scan on Windows after install).

Fill `Installed` with `yes` / `no` / `partial` from the live machine. Claude Code should rewrite this file during the ops-update prompt.

## CLI / platforms

| Capability | Check | Installed | Notes |
|------------|-------|-----------|-------|
| Repomix | `repomix --version` | unknown | P0 |
| Docker | `docker info` | unknown | required for Dify/Onyx |
| Flowise | `npx flowise` / docker | unknown | P2 optional |
| Dify | docker compose | unknown | P2 optional |
| Onyx | docker | unknown | P2 optional |

## Skills (`%USERPROFILE%\.claude\skills`)

| Skill | Source | Installed | Primary job classes |
|-------|--------|-----------|---------------------|
| watch | EverPass custom | preserve | VIDEO_WATCH |
| best-tool-router | everpass-mcp-ops | deploy | GENERIC / multi-domain |
| pdf | anthropics/skills | unknown | DOC_PDF |
| docx | anthropics/skills | unknown | DOC_DOCX |
| xlsx | anthropics/skills | unknown | DOC_XLSX |
| pptx | anthropics/skills | unknown | DOC_PPTX |
| frontend-design | anthropics/skills | unknown | PRESENTATION_HTML support |
| mcp-builder | anthropics/skills | unknown | MCP_BUILD |
| skill-creator | anthropics/skills | unknown | NEW_SKILL |
| notebooklm | PleasePrompto | unknown | NOTEBOOK_RESEARCH |
| copywriting | marketingskills | unknown | MARKETING_COPY |
| copy-editing | marketingskills | unknown | MARKETING_COPY |
| cold-email | marketingskills | unknown | OUTREACH |
| emails | marketingskills | unknown | OUTREACH |
| launch | marketingskills | unknown | LAUNCH_GTM |
| ai-seo | marketingskills | unknown | AI_SEO |
| cro | marketingskills | unknown | CRO |
| competitors | marketingskills | unknown | COMPETITIVE |
| product-marketing | marketingskills | unknown | LAUNCH_GTM foundation |
| obsidian-* | kepano/obsidian-skills | unknown | OBSIDIAN |
| (ECC skills…) | affaan-m/ECC | unknown | CODE_REVIEW, SECURITY, TDD, … |

## EverPass domain skills (project)

| Skill | Installed | Job classes |
|-------|-----------|-------------|
| everpass-presentation | expected | PRESENTATION_HTML |
| partner-insights | expected | PARTNER_INSIGHT |
| contract-redline / ep-redline | expected | DOC_DOCX_REDLINE |
| agreement-revision | expected | CONTRACT_LONGFORM |
| deal-term-sheet | expected | DEAL_TERMS |
| negotiation-brief | expected | DEAL_TERMS |
| notebook-lm-sweep | expected | NOTEBOOK_SWEEP |
| full-pipeline-refresh | expected | PIPELINE |
| pipeline-dashboard-update | expected | DASHBOARD |
| meeting-prep | expected | MEETING_PREP |
| self-improve | expected | SESSION_LEARN |

## ECC agents (`%USERPROFILE%\.claude\agents`)

| Agent | Installed | Job classes |
|-------|-----------|-------------|
| code-reviewer | unknown | CODE_REVIEW |
| security-reviewer | unknown | SECURITY_REVIEW |
| (others from ECC) | unknown | TDD_TEST, REFACTOR_CLEAN, … |

## MCP (enabled this session — keep small)

| MCP | Configured | Enabled | Notes |
|-----|------------|---------|-------|
| Zapier (Gmail EverPass, Sheets, Dropbox, Webhooks) | yes | yes | existing |
| GitHub | yes | yes | existing |
| Higgsfield | yes | as needed | generation |
| ECC-suggested extras | inventory only | default no | enable max 3 after review |

## Router health

| Check | Status |
|-------|--------|
| Rule `EVERPASS/.claude/rules/productivity-stack.md` present | yes (repo) — mirror live on install |
| CLAUDE.md section 8 / 8b updated | pending live mirror |
| `best-tool-router` skill in `~/.claude/skills` | pending deploy |
| Session banner hook | optional |

## Refresh command (Windows)

```powershell
Get-ChildItem "$env:USERPROFILE\.claude\skills" -Directory | Select-Object -ExpandProperty Name
Get-ChildItem "$env:USERPROFILE\.claude\agents" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name
repomix --version
```
