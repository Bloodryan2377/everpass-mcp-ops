# When to use each piece of the stack

Default rule: prefer an installed skill over reinventing the workflow in a freeform prompt.

## Daily EverPass mapping

| Job | Use |
|-----|-----|
| Multi-file codebase or dashboard folder into Claude | **Repomix** (`npx repomix --compress`) then attach output |
| PDF / Word / Excel / PowerPoint create-edit-analyze | **Official skills** `pdf` `docx` `xlsx` `pptx` |
| Partner deck / one-pager HTML quality | **frontend-design** + existing presentation rules |
| Contract / research pack already in NotebookLM | **notebooklm** skill (source-grounded, no re-paste) |
| Partner outreach email sequence | **marketing** `cold-email` / `emails` |
| Launch of a new product surface or affiliate program | **marketing** `launch` + `copywriting` |
| Content that should appear in AI answers | **marketing** `ai-seo` |
| Competitive / alternative partner pages | **marketing** `competitors` / `competitor-profiling` |
| CRO on partner-facing pages | **marketing** `cro` / `signup` skills |
| Security or code review pass | **ECC** security / code-reviewer agents |
| TDD or cleanup pass on scripts | **ECC** tdd / refactor skills |
| New MCP server design | **mcp-builder** (official) |
| New custom skill for a repeated EverPass SOP | **skill-creator** + self-improvement loop |
| Obsidian vault notes / bases / canvas | **obsidian** skills (after vault path set) |
| Prototype multi-step agent with RAG UI | **Flowise** (light) or **Dify** (production-ish) |
| Sensitive deal corpus chat offline | **Onyx** (self-hosted, only when needed) |

## Claude Code invocation patterns

### Repomix before a big ask

```powershell
cd "C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\EVERPASS TOOLS\Dashboard"
npx repomix --compress
```

Then: “Using the repomix output, audit X / implement Y.”

### Document skills

Just ask for the deliverable (e.g. “build an xlsx model of the deal terms”). Claude should auto-load `xlsx` / `pdf` / etc. If it does not, `@` mention the skill or say “use the pdf skill.”

### Marketing skills

Front-load product context once (product-marketing foundation skill), then:

- “Use cold-email skill for DAZN BD intro”
- “Use launch skill for EverPass partner portal v2”
- “Use ai-seo skill on this public FAQ draft”

### NotebookLM

“Using notebooklm skill, query notebook [name] for [question] and draft the EverPass brief with citations.”

### ECC agents

Delegate: “Use code-reviewer agent on the last diff” / “Use security-reviewer on this PowerShell automation.”

## What not to do

- Do not enable every ECC MCP at once (context window death).
- Do not bulk-install every Awesome Claude Skills entry.
- Do not leave Dify/Flowise/Onyx running 24/7 unless there is a standing use case.
- Do not disable EverPass dashboard validation or Desktop protect hooks to “make installs easier.”
- Do not overwrite `~/.claude/skills/watch`.

## Context window hygiene

- Keep MCPs configured but mostly disabled; enable per session.
- Skills are cheap at scan time (~100 tokens metadata); full load only when triggered.
- Prefer Repomix compression over dumping entire trees into chat.
- Prefer NotebookLM skill over pasting long contract PDFs into the prompt.
