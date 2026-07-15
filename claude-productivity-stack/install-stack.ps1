#Requires -Version 5.1
<#
.SYNOPSIS
  Idempotent P0/P1 install for Claude Code productivity stack (Windows).

.DESCRIPTION
  Installs Repomix, official Anthropic skills, marketing skills, NotebookLM skill,
  Obsidian skills (optional), ECC, best-tool-router, and SessionStart banner merge.
  Does NOT overwrite existing skills or EverPass hooks. Does NOT start Docker platforms by default.

.NOTES
  Run from elevated or normal user PowerShell:
    powershell -ExecutionPolicy Bypass -File .\install-stack.ps1
  Optional switches:
    -SkipEcc          Skip ECC clone/install
    -SkipMarketing    Skip marketing skills
    -WithObsidian     Install Obsidian skills
    -WithAwesomeClone Clone awesome-claude-skills catalog only (no mass install)
    -SkipBannerMerge   Do not merge SessionStart banner into settings.json
    -OpsRepo           Path to everpass-mcp-ops clone (default Windows path)
#>

[CmdletBinding()]
param(
  [switch]$SkipEcc,
  [switch]$SkipMarketing,
  [switch]$WithObsidian,
  [switch]$WithAwesomeClone,
  [switch]$SkipBannerMerge,
  [string]$OpsRepo = 'C:\Users\ryan\code\everpass-mcp-ops'
)

$ErrorActionPreference = 'Stop'
$ClaudeHome = Join-Path $env:USERPROFILE '.claude'
$SkillsDir  = Join-Path $ClaudeHome 'skills'
$Ts         = Get-Date -Format 'yyyyMMdd-HHmmss'
$Cache      = Join-Path $ClaudeHome "_install-cache\productivity-stack-$Ts"
$Log        = Join-Path $Cache 'install.log'

function Write-Log {
  param([string]$Message)
  $line = "[{0}] {1}" -f (Get-Date -Format 'u'), $Message
  Write-Host $line
  Add-Content -Path $Log -Value $line
}

function Ensure-Dir {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
  }
}

function Copy-SkillIfMissing {
  param(
    [string]$Source,
    [string]$Name
  )
  $target = Join-Path $SkillsDir $Name
  if (Test-Path -LiteralPath $target) {
    Write-Log "SKIP skill exists: $Name"
    return
  }
  if (-not (Test-Path -LiteralPath $Source)) {
    Write-Log "MISS source for skill: $Name ($Source)"
    return
  }
  Copy-Item -Recurse -Force $Source $target
  Write-Log "INSTALLED skill: $Name"
}

Ensure-Dir $Cache
Ensure-Dir $SkillsDir
New-Item -ItemType File -Force -Path $Log | Out-Null
Write-Log "=== Claude productivity stack install start ==="
Write-Log "Claude home: $ClaudeHome"
Write-Log "Cache: $Cache"

# Backup settings.json
$settings = Join-Path $ClaudeHome 'settings.json'
if (Test-Path -LiteralPath $settings) {
  $bak = "$settings.bak-$Ts"
  Copy-Item -LiteralPath $settings -Destination $bak
  Write-Log "Backed up settings.json -> $bak"
} else {
  Write-Log "No settings.json found (ok on fresh install)"
}

# Preserve check: watch skill
$watch = Join-Path $SkillsDir 'watch'
if (Test-Path -LiteralPath $watch) {
  Write-Log "PRESERVE ok: watch skill present"
} else {
  Write-Log "NOTE: watch skill not found (not installed by this script)"
}

# --- Preflight ---
foreach ($cmd in @('git','node','npm')) {
  $v = & $cmd --version 2>$null
  Write-Log "preflight $cmd : $v"
}

# --- Repomix ---
try {
  npm install -g repomix 2>&1 | Out-String | ForEach-Object { Write-Log $_.TrimEnd() }
  $rv = & repomix --version 2>$null
  Write-Log "Repomix version: $rv"
} catch {
  Write-Log "WARN Repomix install issue: $_"
}

# --- Official Anthropic skills ---
$anthro = Join-Path $Cache 'anthropics-skills'
if (-not (Test-Path -LiteralPath $anthro)) {
  git clone --depth 1 https://github.com/anthropics/skills.git $anthro
}
$wantOfficial = @(
  'pdf','docx','xlsx','pptx','frontend-design','mcp-builder','skill-creator',
  'doc-coauthoring','webapp-testing','internal-comms','brand-guidelines',
  'theme-factory','web-artifacts-builder','claude-api'
)
foreach ($s in $wantOfficial) {
  Copy-SkillIfMissing -Source (Join-Path $anthro "skills\$s") -Name $s
}

# --- Marketing skills ---
if (-not $SkipMarketing) {
  Push-Location $Cache
  try {
    Write-Log "Installing marketing skills via npx skills add..."
    npx --yes skills add coreyhaines31/marketingskills 2>&1 | Out-String | ForEach-Object { Write-Log $_.TrimEnd() }
  } catch {
    Write-Log "npx skills add failed, fallback clone: $_"
    $mkt = Join-Path $Cache 'marketingskills'
    if (-not (Test-Path -LiteralPath $mkt)) {
      git clone --depth 1 https://github.com/coreyhaines31/marketingskills.git $mkt
    }
    $mktSkills = Join-Path $mkt 'skills'
    if (Test-Path -LiteralPath $mktSkills) {
      Get-ChildItem -Directory $mktSkills | ForEach-Object {
        Copy-SkillIfMissing -Source $_.FullName -Name $_.Name
      }
    }
  } finally {
    Pop-Location
  }
}

# --- NotebookLM ---
$nl = Join-Path $SkillsDir 'notebooklm'
if (-not (Test-Path -LiteralPath $nl)) {
  git clone --depth 1 https://github.com/PleasePrompto/notebooklm-skill.git $nl
  Write-Log "INSTALLED skill: notebooklm (read its README for auth/deps)"
} else {
  Write-Log "SKIP skill exists: notebooklm"
}

# --- Obsidian (optional) ---
if ($WithObsidian) {
  Push-Location $Cache
  try {
    npx --yes skills add https://github.com/kepano/obsidian-skills 2>&1 | Out-String | ForEach-Object { Write-Log $_.TrimEnd() }
  } catch {
    $obs = Join-Path $SkillsDir 'obsidian-skills'
    if (-not (Test-Path -LiteralPath $obs)) {
      git clone --depth 1 https://github.com/kepano/obsidian-skills.git $obs
      Write-Log "INSTALLED skill tree: obsidian-skills"
    }
  } finally {
    Pop-Location
  }
}

# --- Awesome catalog only ---
if ($WithAwesomeClone) {
  $aw = Join-Path $Cache 'awesome-claude-skills'
  if (-not (Test-Path -LiteralPath $aw)) {
    git clone --depth 1 https://github.com/travisvn/awesome-claude-skills.git $aw
  }
  Write-Log "Cloned awesome-claude-skills catalog to $aw (no mass install)"
}

# --- ECC ---
if (-not $SkipEcc) {
  $ecc = Join-Path $Cache 'ECC'
  if (-not (Test-Path -LiteralPath $ecc)) {
    git clone --depth 1 https://github.com/affaan-m/ECC.git $ecc
  }
  $eccInstall = Join-Path $ecc 'install.ps1'
  if (Test-Path -LiteralPath $eccInstall) {
    Write-Log "Running ECC install.ps1 (merge carefully if it touches settings.json)"
    try {
      & powershell -ExecutionPolicy Bypass -File $eccInstall 2>&1 | Out-String | ForEach-Object { Write-Log $_.TrimEnd() }
    } catch {
      Write-Log "WARN ECC installer: $_ — run manually: $eccInstall"
    }
  } else {
    Write-Log "WARN ECC install.ps1 not found"
  }
  Write-Log "After ECC: re-check settings.json hooks vs backup $settings.bak-$Ts"
}


# --- best-tool-router deploy ---
$scriptDir = $PSScriptRoot
if (-not $scriptDir) { $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path }
$routerSrc = Join-Path $OpsRepo 'claude-productivity-stack\skills\best-tool-router\SKILL.md'
$routerSrcAlt = Join-Path $scriptDir 'skills\best-tool-router\SKILL.md'
if (-not (Test-Path -LiteralPath $routerSrc) -and (Test-Path -LiteralPath $routerSrcAlt)) {
  $routerSrc = $routerSrcAlt
}
$routerDstDir = Join-Path $SkillsDir 'best-tool-router'
if (Test-Path -LiteralPath $routerSrc) {
  New-Item -ItemType Directory -Force -Path $routerDstDir | Out-Null
  Copy-Item -Force -LiteralPath $routerSrc -Destination (Join-Path $routerDstDir 'SKILL.md')
  Write-Log "DEPLOYED best-tool-router -> $routerDstDir"
} else {
  Write-Log "WARN best-tool-router SKILL.md not found at $routerSrc"
}

# --- SessionStart banner merge ---
if (-not $SkipBannerMerge) {
  $mergeScript = Join-Path $OpsRepo 'scripts\merge-session-banner.ps1'
  $mergeAlt = Join-Path (Split-Path $scriptDir -Parent) 'scripts\merge-session-banner.ps1'
  if (-not (Test-Path -LiteralPath $mergeScript) -and (Test-Path -LiteralPath $mergeAlt)) {
    $mergeScript = $mergeAlt
  }
  if (Test-Path -LiteralPath $mergeScript) {
    Write-Log "Merging SessionStart stack banner via $mergeScript"
    try {
      & powershell -NoProfile -ExecutionPolicy Bypass -File $mergeScript 2>&1 | Out-String | ForEach-Object { Write-Log $_.TrimEnd() }
    } catch {
      Write-Log "WARN banner merge: $_"
    }
  } else {
    Write-Log "WARN merge-session-banner.ps1 not found"
  }
}

# --- Summary ---
Write-Log "=== Skills now under $SkillsDir ==="
Get-ChildItem -Directory $SkillsDir -ErrorAction SilentlyContinue | ForEach-Object {
  Write-Log ("  - " + $_.Name)
}

Write-Log "=== DONE ==="
Write-Log "Next: restart Claude Code; run ONE-PASTE audit or open CLAUDE-CODE-ONE-PASTE-SETUP.md Phase 6"
Write-Host ""
Write-Host "Log: $Log"
Write-Host "If ECC touched settings.json, merge EverPass hooks back from backup."
