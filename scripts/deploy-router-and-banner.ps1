#Requires -Version 5.1
# Minimal: deploy best-tool-router + merge SessionStart banner only. Pure ASCII.
$ErrorActionPreference = 'Stop'
$OpsRepo = if ($PSScriptRoot) { Split-Path -Parent $PSScriptRoot } else { 'C:\Users\ryan\code\everpass-mcp-ops' }
$Skills = Join-Path $env:USERPROFILE '.claude\skills'
$routerSrc = Join-Path $OpsRepo 'claude-productivity-stack\skills\best-tool-router\SKILL.md'
$routerDst = Join-Path $Skills 'best-tool-router'
if (-not (Test-Path -LiteralPath $routerSrc)) { throw "Missing $routerSrc" }
New-Item -ItemType Directory -Force -Path $routerDst | Out-Null
Copy-Item -Force -LiteralPath $routerSrc -Destination (Join-Path $routerDst 'SKILL.md')
Write-Host "DEPLOYED best-tool-router -> $routerDst"

$merge = Join-Path $OpsRepo 'scripts\merge-session-banner.ps1'
if (Test-Path -LiteralPath $merge) {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $merge
} else {
  Write-Host "WARN missing merge-session-banner.ps1"
}

# live rule mirror
$liveRules = 'C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\.claude\rules'
$ruleSrc = Join-Path $OpsRepo 'EVERPASS\.claude\rules\productivity-stack.md'
if (Test-Path -LiteralPath $ruleSrc) {
  New-Item -ItemType Directory -Force -Path $liveRules | Out-Null
  Copy-Item -Force -LiteralPath $ruleSrc -Destination (Join-Path $liveRules 'productivity-stack.md')
  Write-Host "MIRRORED productivity-stack rule -> $liveRules"
}

Write-Host '--- confirm ---'
Write-Host ('best-tool-router: ' + (Test-Path (Join-Path $routerDst 'SKILL.md')))
$settings = Join-Path $env:USERPROFILE '.claude\settings.json'
if (Test-Path $settings) {
  Select-String -Path $settings -Pattern 'stack-session-banner' | ForEach-Object { $_.Line }
}
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $OpsRepo 'scripts\stack-session-banner.ps1')
