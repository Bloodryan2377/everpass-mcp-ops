# Claude Code — ONE PASTE FULL SETUP

**Use this file only.** It replaces running install + ops prompts separately.

Copy everything from `## PROMPT START` through `## PROMPT END` into Claude Code on your Windows machine.

---

## PROMPT START

You are doing a **single end-to-end setup** of my Claude Code productivity stack + always-on best-tool router + session banner + verification audit.

Maximize impact. Minimize risk. Prefer merge over replace. Be idempotent (safe to re-run).

### Who / where

- **User:** Ryan Blood (EverPass)
- **OS:** Windows 11
- **Claude home:** `C:\Users\ryan\.claude\`
- **Ops repo (pull latest first):** `C:\Users\ryan\code\everpass-mcp-ops` → `https://github.com/Bloodryan2377/everpass-mcp-ops`
- **EverPass live root:** `C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\`

### Preserve (HARD — never clobber)

- `~\.claude\skills\watch\`
- Dashboard PostToolUse JS validator in `settings.json`
- Desktop protect / archive hooks
- Existing Deal PreToolUse blocks
- self-improvement Stop hook if present
- Zapier / GitHub / Higgsfield MCP wiring
- All EverPass `CLAUDE.md` HARD rules (paths, 12h freshness, email drafts-only, no Desktop writes)

### Autonomy

Edit freely: `.md` `.ps1` `.py` `.js` `.json` under `.claude`, ops repo, and EVERPASS rules. Pause only if you would delete data, overwrite canonical dashboard HTML, or strip existing hooks.

### Definition of done

1. Stack skills installed (or confirmed present)
2. `best-tool-router` deployed to `C:\Users\ryan\.claude\skills\best-tool-router\`
3. `productivity-stack` rule live under EVERPASS `.claude\rules\`
4. SessionStart banner **merged** into `settings.json` (not replaced)
5. Capability matrix filled with real yes/no
6. **Audit suite passed** (see Phase 6) with results written to repo
7. Commit + push ops repo
8. Final report with Router dry-runs + audit table

---

# Phase 0 — Pull + preflight + backup

```powershell
$ErrorActionPreference = 'Stop'
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$Claude = "$env:USERPROFILE\.claude"
$Skills = "$Claude\skills"
$Settings = "$Claude\settings.json"
$Ops = "C:\Users\ryan\code\everpass-mcp-ops"
$Live = "C:\Users\ryan\OneDrive - EverPass Media\EVERPASS"
$Cache = "$Claude\_install-cache\full-setup-$ts"

New-Item -ItemType Directory -Force -Path $Cache, $Skills | Out-Null

# Ops repo
if (Test-Path $Ops) {
  cd $Ops; git fetch origin; git pull --ff-only origin main
} else {
  git clone https://github.com/Bloodryan2377/everpass-mcp-ops.git $Ops
  cd $Ops
}

# Backup settings BEFORE any merge
if (Test-Path $Settings) {
  Copy-Item $Settings "$Settings.bak-full-setup-$ts"
  Write-Host "settings backup: $Settings.bak-full-setup-$ts"
}

Write-Host "node $(node -v) npm $(npm -v) git $(git --version)"
repomix --version 2>$null
docker info 2>$null | Select-Object -First 1
Write-Host "Existing skills:"; Get-ChildItem $Skills -Directory -ErrorAction SilentlyContinue | ForEach-Object Name
```

If `watch` skill exists, record PRESERVE OK and never touch it.

---

# Phase 1 — Install P0 stack (skip-if-exists)

Prefer the repo script if present:

```powershell
cd $Ops
powershell -NoProfile -ExecutionPolicy Bypass -File .\claude-productivity-stack\install-stack.ps1
```

If that script is missing or fails mid-way, do the following **manually (idempotent)**:

### 1A. Repomix

```powershell
npm install -g repomix
repomix --version
```

### 1B. Official Anthropic skills

```powershell
cd $Cache
git clone --depth 1 https://github.com/anthropics/skills.git anthropics-skills
$want = @('pdf','docx','xlsx','pptx','frontend-design','mcp-builder','skill-creator','doc-coauthoring','webapp-testing','internal-comms','brand-guidelines','theme-factory','web-artifacts-builder','claude-api')
foreach ($s in $want) {
  $src = Join-Path $Cache "anthropics-skills\skills\$s"
  $dst = Join-Path $Skills $s
  if ((Test-Path $src) -and -not (Test-Path $dst)) { Copy-Item -Recurse $src $dst; "INSTALLED $s" }
  elseif (Test-Path $dst) { "SKIP $s" }
}
```

### 1C. Marketing skills

```powershell
cd $Cache
npx --yes skills add coreyhaines31/marketingskills
# fallback if needed: clone coreyhaines31/marketingskills and copy skills/* into $Skills only if missing
```

### 1D. NotebookLM skill

```powershell
$nl = Join-Path $Skills 'notebooklm'
if (-not (Test-Path $nl)) {
  git clone --depth 1 https://github.com/PleasePrompto/notebooklm-skill.git $nl
}
# Note first-run auth deps from its README into CAPABILITY-MATRIX notes
```

### 1E. ECC (official only — affaan-m/ECC)

```powershell
cd $Cache
if (-not (Test-Path ECC)) { git clone --depth 1 https://github.com/affaan-m/ECC.git ECC }
cd ECC
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

After ECC:

- Diff `$Settings` vs backup
- **Re-merge** any EverPass hooks ECC may have dropped (dashboard PostToolUse, Desktop protect, Existing Deal, self-improve Stop)
- Do **not** enable every ECC MCP — inventory only; leave existing Zapier/GitHub/Higgsfield as-is
- Confirm `watch` still exists

### 1F. Obsidian skills (lightweight — install skills only)

```powershell
npx --yes skills add https://github.com/kepano/obsidian-skills
# if vault path unknown, leave path TBD in matrix — do not invent vault location
```

### 1G. Awesome Claude Skills — catalog only

```powershell
cd $Cache
git clone --depth 1 https://github.com/travisvn/awesome-claude-skills.git awesome-claude-skills
# DO NOT bulk-install. Write 5–8 recommended names into CAPABILITY-MATRIX notes for later.
```

### 1H. Docker platforms — stage only (no 24/7 services)

If Docker is running, document start commands for Flowise / Dify / Onyx in CAPABILITY-MATRIX as **staged-not-running**. Do **not** leave containers running unless already running for another reason. Daily path stays Claude Code + skills.

---

# Phase 2 — Deploy best-tool-router + rules (always)

### 2A. Deploy skill to global Claude skills

```powershell
$src = Join-Path $Ops 'claude-productivity-stack\skills\best-tool-router'
$dst = Join-Path $Skills 'best-tool-router'
New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item -Force (Join-Path $src 'SKILL.md') (Join-Path $dst 'SKILL.md')
# Verify
Get-Content (Join-Path $dst 'SKILL.md') -TotalCount 5
```

### 2B. Live EverPass productivity-stack rule

```powershell
$ruleSrc = Join-Path $Ops 'EVERPASS\.claude\rules\productivity-stack.md'
$ruleDstDir = Join-Path $Live '.claude\rules'
New-Item -ItemType Directory -Force -Path $ruleDstDir | Out-Null
Copy-Item -Force $ruleSrc (Join-Path $ruleDstDir 'productivity-stack.md')
# Also ensure ops repo copy is current (already in repo)
```

### 2C. Sync EVERPASS/CLAUDE.md section 8 / 8b

If live `EVERPASS\CLAUDE.md` lacks section **8b. Best-available rule**, merge from ops repo `EVERPASS\CLAUDE.md` (skills map expansion + 8b). Do not delete other live-only pipeline state in section 9+.

### 2D. User-level memory blurb

If `C:\Users\ryan\.claude\CLAUDE.md` exists, append (once — skip if "Productivity stack (always on)" already present):

```markdown
## Productivity stack (always on)

- Use the EverPass productivity-stack router on every non-trivial task.
- Prefer installed skills over freestyle. Announce: `Router: <class> → <tool>`.
- Inventory: everpass-mcp-ops/claude-productivity-stack/CAPABILITY-MATRIX.md
- On router miss, queue self-improve.
```

---

# Phase 3 — SessionStart banner merge into settings.json

**MERGE only. Never replace settings.json.**

```powershell
cd $Ops
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\merge-session-banner.ps1
```

Verify:

```powershell
Select-String -Path $Settings -Pattern 'stack-session-banner|SessionStart|PostToolUse|PreToolUse|validate-dashboard|protect' 
# Must still see dashboard/protect hooks if they were there before
# Must see stack-session-banner.ps1
python -c "import json; json.load(open(r'$Settings', encoding='utf-8')); print('settings.json OK')"
```

If merge script fails, manually merge using `hooks/sessionStart-stack-banner.json` pattern: append one SessionStart entry pointing at:

`powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\ryan\code\everpass-mcp-ops\scripts\stack-session-banner.ps1"`

Run banner once now:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$Ops\scripts\stack-session-banner.ps1"
```

Expected line like: `[stack] Router active. Skills: N | Repomix: yes|no | ...`

---

# Phase 4 — Capability matrix (real scan)

Rewrite `claude-productivity-stack/CAPABILITY-MATRIX.md` with actual yes/no from disk for every skill/agent/CLI. Date-stamp today. Count:

- skills total
- P0 document skills present (pdf/docx/xlsx/pptx)
- marketing skills count
- notebooklm / best-tool-router / watch
- ECC agents if any
- settings: SessionStart banner yes/no; EverPass hooks still present yes/no

---

# Phase 5 — Insights seed

Ensure `INSIGHTS.md` exists. Append one line to miss log if any install skipped.

---

# Phase 6 — QUICK AUDIT (required — prove it works)

Write results to `claude-productivity-stack/AUDIT-RESULTS.md`.

## 6A. Filesystem audit (automated)

| ID | Check | Pass criteria |
|----|-------|---------------|
| FS-01 | `best-tool-router/SKILL.md` in `~\.claude\skills` | exists |
| FS-02 | `pdf` `docx` `xlsx` `pptx` skills | all four exist |
| FS-03 | `notebooklm` skill | exists |
| FS-04 | ≥8 marketing skills | count ≥ 8 |
| FS-05 | `watch` still present | exists (if it did pre-run) |
| FS-06 | live `EVERPASS\.claude\rules\productivity-stack.md` | exists |
| FS-07 | `repomix` on PATH | version prints |
| FS-08 | settings.json valid JSON | python/json load OK |
| FS-09 | settings contains `stack-session-banner` | match |
| FS-10 | settings still has dashboard or protect hook signals if backup had them | no regression |
| FS-11 | banner script runs | prints `[stack] Router active` |
| FS-12 | ops repo CLAUDE.md has section 8b | match `Best-available` |

Run as a single PowerShell auditor and record PASS/FAIL per row.

## 6B. Router dry-run audit (reasoning — no side effects)

For each task below, output **only** the router line you would use (class → tool), based on installed matrix. Mark PASS if the chosen tool is installed; FAIL if you'd pick a missing tool or freestyle when a skill exists.

| ID | User task | Expected class (approx) | Your Router line | Pass? |
|----|-----------|-------------------------|------------------|-------|
| R-01 | Redline this partner MSA .docx | DOC_DOCX_REDLINE | | |
| R-02 | Pack the Dashboard folder and find JS risk | FULL_CONTEXT_PACK | | |
| R-03 | Draft cold email sequence for a new distributor | OUTREACH | | |
| R-04 | Answer from my NFL NotebookLM notebook | NOTEBOOK_RESEARCH | | |
| R-05 | Build xlsx deal scenarios | DOC_XLSX | | |
| R-06 | Security-review this PowerShell automation | SECURITY_REVIEW | | |
| R-07 | Update pipeline dashboard after Charter note | DASHBOARD | | |
| R-08 | /watch this clip and summarize | VIDEO_WATCH | | |
| R-09 | Write launch plan for partner portal v2 | LAUNCH_GTM | | |
| R-10 | Create a PDF one-pager from this brief | DOC_PDF | | |
| R-11 | Ambiguous: "make this better for partners" | GENERIC / best-tool-router | | |
| R-12 | Improve yourself — we freestyled xlsx last time | SESSION_LEARN | | |

## 6C. Behavioral smoke (light execution)

| ID | Action | Pass criteria |
|----|--------|---------------|
| B-01 | `npx repomix --compress` in ops repo (or small subfolder) | output file created; delete large artifact after or gitignore |
| B-02 | Read first 20 lines of `pdf/SKILL.md` and `copywriting/SKILL.md` if present | files readable |
| B-03 | Ask yourself (no user): "list skills for pdf and marketing" from disk listing | names match matrix |
| B-04 | Confirm email rule still HARD in CLAUDE.md | "never sends email" / drafts only still present |

## 6D. Negative-impact guardrails

| ID | Check | Pass criteria |
|----|-------|---------------|
| N-01 | Backup settings exists | file present |
| N-02 | No deletion of watch | present if pre-existing |
| N-03 | MCP enablement not massively expanded | no bulk-enable of ECC MCPs |
| N-04 | Docker platforms not left newly running | no unexpected new containers from this run |
| N-05 | Existing Deal / Desktop rules still in CLAUDE.md | present |

**Audit gate:** Setup is successful only if FS-* all PASS (or justified SKIP), R-* ≥10/12 PASS, B-* all PASS, N-* all PASS.

If audit fails, fix and re-audit before claiming done.

---

# Phase 7 — Commit + push

```powershell
cd $Ops
git add claude-productivity-stack EVERPASS/.claude/rules/productivity-stack.md EVERPASS/CLAUDE.md hooks scripts README.md TODO.md
git status
git commit -m "chore: full stack setup results + audit (router, banner, skills)"
git push origin main
git log -1 --oneline
git rev-parse HEAD
```

If live EVERPASS tree is not the git repo, still keep ops repo as source of truth for rules/scripts; live only needs the mirrored rule file.

---

# Phase 8 — Final report (required format)

```
## Setup complete

### Installed / deployed
- ...

### settings.json
- backup path:
- SessionStart banner: merged | skipped
- EverPass hooks intact: yes/no

### Capability counts
- skills: N
- document skills: ...
- marketing: N
- repomix / notebooklm / best-tool-router / watch: ...

### Audit summary
- FS: x/12 PASS
- Router dry-run: x/12 PASS
- Behavioral: x/4 PASS
- Negative guards: x/5 PASS
- Full table: claude-productivity-stack/AUDIT-RESULTS.md

### Router samples (paste 4)
Router: ...
...

### How to use tomorrow
1. Work under EVERPASS — productivity-stack rule auto-loads
2. Expect `Router: …` on non-trivial tasks
3. Session start prints [stack] banner
4. Re-run this one-paste anytime (idempotent)

### Commit
- SHA:
- URL:
```

## PROMPT END

---

## After you paste

Restart Claude Code once so SessionStart and new skills are picked up. First message in a new session should show the `[stack]` banner if hooks loaded.
