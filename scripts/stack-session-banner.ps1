#Requires -Version 5.1
<#
.SYNOPSIS
  Lightweight SessionStart banner for Claude Code productivity stack.
.DESCRIPTION
  Prints skill counts and key tool presence. Safe to run as a SessionStart hook.
  Does not modify any files.
#>

$ErrorActionPreference = 'SilentlyContinue'
$skillsDir = Join-Path $env:USERPROFILE '.claude\skills'
$n = 0
if (Test-Path -LiteralPath $skillsDir) {
  $n = @(Get-ChildItem -LiteralPath $skillsDir -Directory).Count
}
$repomix = 'no'
try {
  $null = Get-Command repomix -ErrorAction Stop
  $repomix = 'yes'
} catch {}
$nl = if (Test-Path (Join-Path $skillsDir 'notebooklm')) { 'yes' } else { 'no' }
$watch = if (Test-Path (Join-Path $skillsDir 'watch')) { 'yes' } else { 'no' }
$router = if (Test-Path (Join-Path $skillsDir 'best-tool-router')) { 'yes' } else { 'no' }

Write-Host "[stack] Router active. Skills: $n | Repomix: $repomix | NotebookLM: $nl | watch: $watch | best-tool-router: $router"
