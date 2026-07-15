# Claude Code Productivity Stack — Inventory

Source article: [10 GitHub Repos for Claude Code That Turn It Into a Productivity Machine](https://virtualuncle.com/github-repos-claude-code-productivity-2026/) (Virtual Uncle, Apr 2026; reviewed Jul 15, 2026).

This folder tracks the stack for Ryan’s Windows Claude Code environment and EverPass workflows. Live runtime config remains on the Windows box; this repo is the human-readable mirror.

## Status legend

- **P0** — install immediately (Claude-native, high leverage)
- **P1** — install soon (selective / needs vault path)
- **P2** — optional heavy platforms (Docker); stage docs, start only when needed

## Verified upstream (Jul 2026)

| # | Name | Canonical URL | Approx stars | Type | Priority | Role in EverPass outputs |
|---|------|---------------|--------------|------|----------|---------------------------|
| 1 | Repomix | https://github.com/yamadashy/repomix | 27k | CLI | P0 | Pack multi-file codebases/docs into one AI context file before audits, refactors, multi-model handoffs |
| 2 | ECC (Everything Claude Code) | https://github.com/affaan-m/ECC | 230k | Harness: skills, agents, hooks, rules, MCP configs | P0 | Professional agent system: review, TDD, security, research agents; rules library. **Renamed from everything-claude-code** |
| 3 | Dify | https://github.com/langgenius/dify | 149k | Visual AI platform (Docker) | P2 | Multi-step production agents / RAG apps when Claude Code alone is not the right surface |
| 4 | Flowise | https://github.com/FlowiseAI/Flowise | 55k | Drag-drop agent builder | P2 | Fast prototype of LLM+docs+chat flows (lighter than Dify) |
| 5 | Onyx | https://github.com/onyx-dot-app/onyx | 31k | Self-hosted private chat + RAG | P2 | Sensitive deal/docs chat that should not leave local infra |
| 6 | Claude Skills (official) | https://github.com/anthropics/skills | 161k | Official SKILL.md set | P0 | Correct pdf/docx/xlsx/pptx handling; skill-creator; frontend-design; mcp-builder |
| 7 | Awesome Claude Skills | https://github.com/travisvn/awesome-claude-skills | 14k | Curated catalog | P1 | Browse + selective install only; skills can execute code |
| 8 | Obsidian Skills | https://github.com/kepano/obsidian-skills | 42k | Vault skills | P1 | If/when vault path is set — wikilinks, bases, canvas, CLI |
| 9 | NotebookLM Skill | https://github.com/PleasePrompto/notebooklm-skill | 7k | NotebookLM bridge | P0 | Source-grounded answers from existing NotebookLM research packs |
| 10 | Marketing Skills | https://github.com/coreyhaines31/marketingskills | 40k | 23+ marketing skills | P0 | Partner GTM, copy, cold email, launch, AI-SEO, CRO, competitive pages |

## Already present (do not clobber)

| Asset | Location | Notes |
|-------|----------|-------|
| `/watch` skill | `~/.claude/skills/watch/` | ffmpeg/yt-dlp/Whisper video pipeline |
| Self-improvement | `everpass-mcp-ops/self-improvement/` | proposal queue + stop hook |
| EverPass rules | `EVERPASS/.claude/rules/*` | contracts, dashboard, legal-redline, presentations, etc. |
| Dashboard JS validator | Dashboard `.claude` + global PostToolUse hook | path-sensitive |
| Desktop protect hooks | `~/.claude/hooks/` + settings.json | do not remove |
| MCP | Zapier (Gmail scoped EverPass, Sheets, Dropbox, Webhooks), GitHub, Higgsfield | keep tool count controlled |

## Install locations (Windows)

```
C:\Users\ryan\.claude\skills\          # global skills
C:\Users\ryan\.claude\agents\          # ECC agents if installed
C:\Users\ryan\.claude\rules\           # optional global rules (merge carefully)
C:\Users\ryan\.claude\settings.json    # hooks — always backup before merge
C:\Users\ryan\code\everpass-mcp-ops\   # this tracking repo
```

## Security

- Skills can run code in Claude’s environment. Install only from the repos above unless explicitly expanded.
- ECC: official sources only (`affaan-m/ECC`, npm `ecc-universal` / `ecc-agentshield`, plugin `ecc@ecc`, ecc.tools).
- Awesome Claude Skills: catalog first, install individually after reading each `SKILL.md`.
- Prefer under 10 enabled MCPs / under ~80 tools active to protect context window.

## Related files

- **[CLAUDE-CODE-ONE-PASTE-SETUP.md](./CLAUDE-CODE-ONE-PASTE-SETUP.md)** — single paste: install + ops + deploy router + banner merge + audit
- [AUDIT-RESULTS.md](./AUDIT-RESULTS.md) — verification gate after setup
- [USAGE.md](./USAGE.md) — when to use each tool
- [INSIGHTS.md](./INSIGHTS.md) — operational lessons + miss log
- [CAPABILITY-MATRIX.md](./CAPABILITY-MATRIX.md) — live install inventory
- [install-stack.ps1](./install-stack.ps1) — idempotent Windows installer (P0/P1 + router + banner)
- [skills/best-tool-router/SKILL.md](./skills/best-tool-router/SKILL.md) — router skill (deployed to `~/.claude/skills`)
- Rule: `EVERPASS/.claude/rules/productivity-stack.md`
- Banner merge: `scripts/merge-session-banner.ps1` · snippet `hooks/sessionStart-stack-banner.json`
- Legacy (optional): [install-only](./CLAUDE-CODE-INSTALL-PROMPT.md) · [ops-only](./CLAUDE-CODE-OPS-UPDATE-PROMPT.md)
