# Claude Code Install Prompt — Productivity Stack (Virtual Uncle 10 + EverPass)

Copy everything below the line into Claude Code on your Windows box.

---

## PROMPT START

You are installing and wiring the open-source Claude Code productivity stack on my Windows machine. Work autonomously. Prefer PowerShell. Do not break existing EverPass automation.

### Operator context (do not ignore)

- **User:** Ryan Blood, CCO / Business Ops at EverPass
- **OS:** Windows 11
- **Claude Code home:** `C:\Users\ryan\.claude\`
- **EverPass workspace root (runtime):** `C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\`
- **Tracking repo (source of truth for scaffold):** `C:\Users\ryan\code\everpass-mcp-ops` → `https://github.com/Bloodryan2377/everpass-mcp-ops`
- **GitHub user:** `Bloodryan2377`
- **Existing skills/hooks to PRESERVE (never overwrite blindly):**
  - `~/.claude/skills/watch/` (`/watch` video skill)
  - `self-improvement/` skill + stop-hook in everpass-mcp-ops
  - Global hooks in `~/.claude/settings.json` (PostToolUse dashboard JS validator, Desktop protect/archive)
  - `EVERPASS/.claude/rules/*`, dashboard validators, CLAUDE.md tree
  - Zapier MCP + GitHub MCP + Higgsfield MCP wiring documented in everpass-mcp-ops
- **Autonomy:** free to create/edit `.md`, `.html`, `.txt`, `.ps1`, `.py`, `.js`, configs under `.claude` and the tracking repo. Pause only if you would delete data, overwrite canonical dashboard HTML, or change behavior of protected hooks.

### Goals

1. Install every **Claude-native skill/tool** from the Virtual Uncle list that improves daily Claude Code output.
2. Stage (but do not force-run) the three **heavyweight platforms** (Dify, Flowise, Onyx) as optional Docker stacks.
3. Document what was installed, how to use it, and how it maps to EverPass workflows.
4. Commit inventory + install script + usage guide to `Bloodryan2377/everpass-mcp-ops` under `claude-productivity-stack/`.
5. Produce a post-install smoke-test report.

### Source list (verified live GitHub, Jul 2026)

| # | Name | Repo | Type | Priority | Install mode |
|---|------|------|------|----------|--------------|
| 1 | Repomix | https://github.com/yamadashy/repomix | CLI tool | P0 | global npm / npx |
| 2 | ECC (was Everything Claude Code) | https://github.com/affaan-m/ECC | full harness (skills/agents/hooks/rules) | P0 | official Windows installer |
| 3 | Dify | https://github.com/langgenius/dify | visual AI platform (Docker) | P2 optional | docker compose only if Docker Desktop present |
| 4 | Flowise | https://github.com/FlowiseAI/Flowise | drag-drop agent builder | P2 optional | npm/npx or Docker |
| 5 | Onyx | https://github.com/onyx-dot-app/onyx | self-hosted private chat | P2 optional | Docker install script only if Docker present |
| 6 | Claude Skills (official) | https://github.com/anthropics/skills | document/design/dev skills | P0 | clone + copy into `~/.claude/skills` |
| 7 | Awesome Claude Skills | https://github.com/travisvn/awesome-claude-skills | curated catalog | P1 | marketplace add + selective install |
| 8 | Obsidian Skills | https://github.com/kepano/obsidian-skills | vault integration | P1 | marketplace or clone |
| 9 | NotebookLM Skill | https://github.com/PleasePrompto/notebooklm-skill | NotebookLM bridge | P0 | clone into skills (Ryan uses NotebookLM heavily) |
| 10 | Marketing Skills | https://github.com/coreyhaines31/marketingskills | 23+ marketing workflows | P0 | `npx skills add` full suite |

**Important rename:** article lists `affaan-m/everything-claude-code` — live canonical repo is **`affaan-m/ECC`** (install only from github.com/affaan-m/ECC or npm `ecc-universal`).

### Hard rules

1. **Never** delete or replace existing `watch`, EverPass rules, dashboard validators, or `~/.claude/settings.json` wholesale. Merge only.
2. **Never** install skill code you cannot inspect. After clone, list each skill’s `SKILL.md` name + description before enabling.
3. Prefer **global** install under `C:\Users\ryan\.claude\` so all projects benefit; also mirror inventory into everpass-mcp-ops.
4. For ECC: use official installer (`install.ps1` or plugin path). Do not use third-party mirrors.
5. Skills execute code — only install from the 10 repos above unless I explicitly expand the list.
6. If Docker Desktop is not running, skip Dify/Flowise/Onyx runtime and document as “staged, not running.”
7. Keep MCP tool count under control: do not enable every MCP from ECC blindly. Inventory them; enable only ones that complement Zapier/GitHub/Higgsfield already in use.
8. Windows paths: use `$env:USERPROFILE\.claude` not `~/.claude` in scripts.
9. After install, run smoke tests (below) and write results to the tracking repo.
10. Commit + push to `Bloodryan2377/everpass-mcp-ops` when done (private/public as-is; do not change visibility).

---

## Phase 0 — Preflight

```powershell
$ErrorActionPreference = 'Stop'
Write-Host "=== PREFLIGHT ==="
node -v
npm -v
git --version
claude --version 2>$null
docker --version 2>$null
Test-Path "$env:USERPROFILE\.claude"
Test-Path "$env:USERPROFILE\.claude\skills"
Test-Path "$env:USERPROFILE\.claude\settings.json"
Test-Path "C:\Users\ryan\code\everpass-mcp-ops"
Get-ChildItem "$env:USERPROFILE\.claude\skills" -ErrorAction SilentlyContinue | Select-Object Name
# Backup settings before any merge
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item "$env:USERPROFILE\.claude\settings.json" "$env:USERPROFILE\.claude\settings.json.bak-$ts" -ErrorAction SilentlyContinue
```

Create work dir:

```powershell
$Stack = "$env:USERPROFILE\.claude\_install-cache\productivity-stack-$ts"
New-Item -ItemType Directory -Force -Path $Stack | Out-Null
cd $Stack
```

---

## Phase 1 — P0 installs (always)

### 1A. Repomix (CLI)

```powershell
npm install -g repomix
repomix --version
# Smoke: pack the tracking repo
cd C:\Users\ryan\code\everpass-mcp-ops
npx repomix --compress
# Expect repomix-output.xml (or similar). Move sample to stack docs if useful, then clean large artifacts.
```

**When to use:** before large refactors, multi-file audits, handoffs to other models, packing partner decks/code folders for Claude context.

### 1B. Official Anthropic skills

```powershell
cd $Stack
git clone --depth 1 https://github.com/anthropics/skills.git anthropics-skills
$dst = "$env:USERPROFILE\.claude\skills"
New-Item -ItemType Directory -Force -Path $dst | Out-Null
# Install high-value document + builder skills (skip experimental art unless wanted)
$want = @('pdf','docx','xlsx','pptx','frontend-design','mcp-builder','skill-creator','doc-coauthoring','webapp-testing','internal-comms','brand-guidelines','theme-factory','web-artifacts-builder')
foreach ($s in $want) {
  $src = Join-Path $Stack "anthropics-skills\skills\$s"
  if (Test-Path $src) {
    $target = Join-Path $dst $s
    if (Test-Path $target) { Write-Host "SKIP exists: $s" } else { Copy-Item -Recurse $src $target; Write-Host "INSTALLED: $s" }
  }
}
```

### 1C. Marketing Skills (full suite)

```powershell
cd $Stack
# Preferred modern installer
npx skills add coreyhaines31/marketingskills
# If npx skills fails, fallback:
# git clone --depth 1 https://github.com/coreyhaines31/marketingskills.git
# robocopy marketingskills\skills $env:USERPROFILE\.claude\skills /E /XO
```

**EverPass mapping:** use for partner one-pagers, launch strategy, cold outreach to distributors, AI-SEO for public content, competitive partner pages, email sequences to affiliates.

### 1D. NotebookLM skill

```powershell
$nl = "$env:USERPROFILE\.claude\skills\notebooklm"
if (-not (Test-Path $nl)) {
  git clone --depth 1 https://github.com/PleasePrompto/notebooklm-skill.git $nl
}
# Read its README and install any Python deps it requires (browser automation / auth).
# Document first-run auth steps in the inventory file.
```

**EverPass mapping:** contracts, deal books, research packs already in NotebookLM → Claude Code synthesis without re-pasting.

### 1E. ECC (Everything Claude Code → ECC)

```powershell
cd $Stack
git clone --depth 1 https://github.com/affaan-m/ECC.git ECC
cd ECC
# Official Windows path
powershell -ExecutionPolicy Bypass -File .\install.ps1
# If installer is interactive, choose:
# - skills + agents + useful rules for python/typescript/markdown
# - DO NOT overwrite existing ~/.claude/settings.json hooks without merge
# - DO NOT disable existing watch skill
```

After ECC install:

1. Diff `settings.json` against `.bak-$ts` — re-merge EverPass PostToolUse / PreToolUse hooks if installer overwrote them.
2. List new skills/agents under `~/.claude/skills` and `~/.claude/agents`.
3. From ECC `mcp-configs`, **inventory only** — enable zero new MCPs by default. Propose a shortlist (max 3) for later approval.

If plugin path preferred:

```
/plugin marketplace add affaan-m/ECC
/plugin install ecc@ecc
```

(Run inside Claude Code if CLI plugin commands are available.)

---

## Phase 2 — P1 installs

### 2A. Obsidian Skills

```powershell
# Prefer marketplace inside Claude Code:
# /plugin marketplace add kepano/obsidian-skills
# /plugin install obsidian@obsidian-skills
# Fallback:
npx skills add https://github.com/kepano/obsidian-skills
# Or:
# git clone --depth 1 https://github.com/kepano/obsidian-skills.git $env:USERPROFILE\.claude\skills\obsidian-skills
```

Only wire vault paths if an Obsidian vault path is known; otherwise install skills and document “vault path TBD.”

### 2B. Awesome Claude Skills (catalog, selective)

```powershell
cd $Stack
git clone --depth 1 https://github.com/travisvn/awesome-claude-skills.git awesome-claude-skills
# Do NOT mass-install every community skill.
# Write a curated shortlist of 5–10 skills relevant to:
#   sports media partnerships, contract analysis, financial modeling,
#   PowerShell automation, dashboard/HTML, research, security review
# Install only that shortlist after reading each SKILL.md.
```

Inside Claude Code if supported:

```
/plugin marketplace add travisvn/awesome-claude-skills
```

Then install individually after review — never bulk-trust.

---

## Phase 3 — P2 optional platforms (Docker)

```powershell
$dockerOk = $false
try { docker info | Out-Null; $dockerOk = $true } catch { $dockerOk = $false }

if ($dockerOk) {
  # FLOWISE (lightest)
  # npm install -g flowise
  # Start later with: npx flowise start  → http://localhost:3000

  # DIFY (heavier)
  # git clone https://github.com/langgenius/dify.git
  # cd dify\docker; copy .env.example .env; docker compose up -d

  # ONYX (private ChatGPT)
  # Use official install.sh via WSL or documented Windows Docker path only if stable
} else {
  Write-Host "Docker not available — stage docs only for Dify/Flowise/Onyx"
}
```

Default for EverPass: **do not leave these running 24/7**. Document start/stop commands. Prefer Claude Code + existing MCPs for daily work; use Flowise/Dify for multi-step visual agent prototypes; use Onyx only if we need air-gapped RAG over sensitive deal docs.

---

## Phase 4 — EverPass integration layer

Create/update in tracking repo `C:\Users\ryan\code\everpass-mcp-ops\claude-productivity-stack\`:

1. **`INVENTORY.md`** — every installed skill/agent/tool with path, source repo, version/commit, purpose, EverPass use cases.
2. **`USAGE.md`** — when to invoke each (cheat sheet).
3. **`install-stack.ps1`** — idempotent reinstall script (skip-if-exists).
4. **`SMOKE-TEST.md`** — results of tests below.
5. **`MCP-CANDIDATES.md`** — ECC MCP configs reviewed, recommended enable/disable.
6. Update root **`README.md`** with a short link to this folder.
7. Update **`TODO.md`** with follow-ups (Docker platforms, Obsidian vault path, selective awesome skills).

Also add a small skill or rule file:

`EVERPASS/.claude/rules/productivity-stack.md` (in tracking repo + live tree if present):

```markdown
# Productivity stack defaults
- Prefer installed skills (pdf/docx/xlsx/pptx, marketing-*, notebooklm, ECC agents) over ad-hoc reinventing.
- Before large multi-file analysis, run `npx repomix --compress` and attach output.
- For NotebookLM-backed research packs, use notebooklm skill instead of pasting docs.
- For partner/GTM copy, load marketing skills (copywriting, cold-email, launch, ai-seo).
- Never disable EverPass hooks for dashboard validation or Desktop protection.
```

---

## Phase 5 — Smoke tests

Run and log pass/fail:

| Test | Command / action | Pass criteria |
|------|------------------|---------------|
| Repomix | `npx repomix --compress` in everpass-mcp-ops | output file generated |
| Official skills | list `~\.claude\skills\pdf` etc. | SKILL.md present |
| Marketing | list marketing skill dirs | ≥10 skills present |
| NotebookLM | skill dir + README install notes | present |
| ECC | agents or skills from ECC present | at least rules/skills landed |
| Settings integrity | compare settings.json to backup | EverPass hooks still present |
| Watch skill | `Test-Path ~\.claude\skills\watch` | still exists |
| Claude discovery | restart Claude Code, ask “list available skills related to pdf and marketing” | skills recognized |

---

## Phase 6 — Git commit

```powershell
cd C:\Users\ryan\code\everpass-mcp-ops
git checkout main
git pull
# add claude-productivity-stack/*
git add claude-productivity-stack README.md TODO.md
git commit -m "Add Claude Code productivity stack inventory and install script (Virtual Uncle 10)"
git push origin main
```

---

## Phase 7 — Final report to me

Return a concise report with:

1. Installed (paths)
2. Skipped + why
3. Settings.json merge notes
4. Smoke test table
5. Top 10 ways this improves EverPass daily work
6. Recommended next 3 enablements (e.g. Flowise weekend, specific awesome skills, MCP shortlist)
7. Commit SHA + GitHub URL

### Output quality bar

- Idempotent installs (safe to re-run)
- No emoji in committed docs
- Windows PowerShell first-class
- Security: only trusted sources; note that skills can execute code
- Align with existing self-improvement loop (propose HIGH-impact hook changes via self-improve, don’t silent-overwrite)

## PROMPT END
