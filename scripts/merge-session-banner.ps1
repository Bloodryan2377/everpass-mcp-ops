#Requires -Version 5.1
<#
.SYNOPSIS
  Safely merge SessionStart stack banner into Claude Code settings.json.
.DESCRIPTION
  - Backs up settings.json
  - Adds SessionStart hook for stack-session-banner.ps1 if missing
  - Never removes existing hooks (PostToolUse, PreToolUse, Stop, etc.)
  - Idempotent: re-run is a no-op if banner already present
#>

[CmdletBinding()]
param(
  [string]$SettingsPath = (Join-Path $env:USERPROFILE '.claude\settings.json'),
  [string]$BannerScript = 'C:\Users\ryan\code\everpass-mcp-ops\scripts\stack-session-banner.ps1',
  [string]$OpsRepo = 'C:\Users\ryan\code\everpass-mcp-ops'
)

$ErrorActionPreference = 'Stop'

# Prefer ops repo script if present
$repoBanner = Join-Path $OpsRepo 'scripts\stack-session-banner.ps1'
if (Test-Path -LiteralPath $repoBanner) {
  $BannerScript = $repoBanner
}

if (-not (Test-Path -LiteralPath $BannerScript)) {
  throw "Banner script not found: $BannerScript"
}

$claudeDir = Split-Path -Parent $SettingsPath
if (-not (Test-Path -LiteralPath $claudeDir)) {
  New-Item -ItemType Directory -Force -Path $claudeDir | Out-Null
}

$ts = Get-Date -Format 'yyyyMMdd-HHmmss'

if (-not (Test-Path -LiteralPath $SettingsPath)) {
  $initial = @{ hooks = @{} } | ConvertTo-Json -Depth 20
  Set-Content -LiteralPath $SettingsPath -Value $initial -Encoding UTF8
  Write-Host "Created empty settings.json"
}

$bak = "$SettingsPath.bak-stack-banner-$ts"
Copy-Item -LiteralPath $SettingsPath -Destination $bak -Force
Write-Host "Backup: $bak"

$raw = Get-Content -LiteralPath $SettingsPath -Raw -Encoding UTF8
# Detect if banner already referenced
if ($raw -match 'stack-session-banner\.ps1') {
  Write-Host "SKIP: stack-session-banner.ps1 already referenced in settings.json"
  exit 0
}

# Prefer Python for reliable JSON merge (handles nested hooks)
$py = @'
import json, sys, os
settings_path = sys.argv[1]
banner_script = sys.argv[2]
with open(settings_path, "r", encoding="utf-8") as f:
    data = json.load(f)
if not isinstance(data, dict):
    data = {}
hooks = data.setdefault("hooks", {})
if not isinstance(hooks, dict):
    hooks = {}
    data["hooks"] = hooks
ss = hooks.setdefault("SessionStart", [])
if not isinstance(ss, list):
    ss = []
    hooks["SessionStart"] = ss
# skip if already present
blob = json.dumps(ss)
if "stack-session-banner.ps1" in blob:
    print("SKIP: already present")
    sys.exit(0)
entry = {
    "matcher": "",
    "hooks": [
        {
            "type": "command",
            "command": f'powershell -NoProfile -ExecutionPolicy Bypass -File "{banner_script}"'
        }
    ]
}
ss.append(entry)
with open(settings_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
print("MERGED: SessionStart stack banner")
'@

$pyFile = Join-Path $env:TEMP "merge-session-banner-$ts.py"
Set-Content -LiteralPath $pyFile -Value $py -Encoding UTF8
try {
  python $pyFile $SettingsPath $BannerScript
  if ($LASTEXITCODE -ne 0) { throw "python merge failed rc=$LASTEXITCODE" }
} finally {
  Remove-Item -LiteralPath $pyFile -Force -ErrorAction SilentlyContinue
}

# Validate JSON
$validatePy = @'
import json, sys
json.load(open(sys.argv[1], encoding="utf-8"))
print("JSON valid")
'@
$validateFile = Join-Path $env:TEMP "validate-settings-$ts.py"
Set-Content -LiteralPath $validateFile -Value $validatePy -Encoding UTF8
try {
  python $validateFile $SettingsPath
} finally {
  Remove-Item -LiteralPath $validateFile -Force -ErrorAction SilentlyContinue
}

Write-Host "Done. Existing hooks preserved. Backup at $bak"
