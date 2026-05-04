#!/usr/bin/env bash
# scan-stale-paths.sh — EverPass active-infrastructure stale-path scanner.
#
# Usage:
#   ./scripts/scan-stale-paths.sh                    # default: scan for "EVERPASS/Dashboard/"
#   ./scripts/scan-stale-paths.sh "pattern1" "..."   # add extra fixed-string patterns
#
# Exit codes:
#   0 — clean (no stale paths found in active infra)
#   1 — stale paths detected (file:line matches printed)
#   2 — environment/setup error (no grep/find, missing roots, etc.)
#
# Scope (active infra only — NOT session history, NOT memory, NOT archives):
#   ~/.claude/CLAUDE.md, settings.json, settings.local.json
#   ~/.claude/hooks/**
#   ~/.claude/skills/**/{SKILL.md,*.sh,*.json}
#   EVERPASS/.claude/**
#   EVERPASS/**/CLAUDE.md
#   EVERPASS/**/settings*.json
#   EVERPASS/**/*.{sh,ps1,cmd}
#
# Excluded (historical / archive / log noise):
#   ~/.claude/{plans,projects,todos,shell-snapshots,statsig,memory,ide,sessions,locks}/
#   *.bak*, *.baseline-*, _archive/**, recent-memory.md, morning-brief*,
#   nightly-pipeline-report*, system-audits/**, *.jsonl, node_modules/**, __pycache__/**
#
# Why find+grep, not grep -r --include: GNU grep 3.0 (shipped with Git Bash) has a
# bug where mixing --exclude with --include silently disables --include, matching
# every file. find-based enumeration is unaffected.

set -u

EVERPASS_ROOT="${EVERPASS_ROOT:-/c/Users/ryan/OneDrive - EverPass Media/EVERPASS}"
CLAUDE_HOME="${CLAUDE_HOME:-$HOME/.claude}"

for cmd in grep find; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "scan-stale-paths.sh: $cmd not found in PATH" >&2
    exit 2
  fi
done

PATTERNS=("EVERPASS/Dashboard/")
if [ "$#" -gt 0 ]; then
  PATTERNS=("$@")
fi

EXCLUDE_DIR_NAMES=(
  _archive system-audits node_modules .git
  plans projects todos shell-snapshots statsig memory ide sessions locks
  __pycache__ morning-briefs nightly-pipeline-reports
  skill-snapshot iteration-1
)

EXCLUDE_NAME_GLOBS=(
  '*.bak' '*.bak.*' '*.bak-*' '*.baseline-*'
  '*.jsonl' '*.pyc' '*.pyo'
  'recent-memory.md' 'morning-brief*' 'nightly-pipeline-report*'
)

# Build a `find` predicate set: (-type f -name X -o -name Y ...) -prune dirs -print.
# We accumulate -name args via process-substitution to keep the script readable.
build_find() {
  local target="$1"; shift
  local includes=("$@")  # filename globs to MATCH (e.g. CLAUDE.md, *.sh)

  local args=("$target")

  # Prune excluded directories.
  args+=(\()
  local first=1
  for d in "${EXCLUDE_DIR_NAMES[@]}"; do
    [ $first -eq 1 ] && first=0 || args+=(-o)
    args+=(-type d -name "$d")
  done
  args+=(\) -prune -o)

  # Match files: not excluded by name, matching at least one include glob.
  args+=(-type f)
  for g in "${EXCLUDE_NAME_GLOBS[@]}"; do
    args+=(! -name "$g")
  done

  if [ "${#includes[@]}" -gt 0 ]; then
    args+=(\()
    local fi=1
    for g in "${includes[@]}"; do
      [ $fi -eq 1 ] && fi=0 || args+=(-o)
      args+=(-name "$g")
    done
    args+=(\))
  fi

  args+=(-print0)
  find "${args[@]}"
}

HITS=$(mktemp)
trap 'rm -f "$HITS"' EXIT

scan_files() {
  # Emits hits to $HITS.
  local pattern="$1"; shift
  local target="$1"; shift
  [ -e "$target" ] || return 0
  local includes=("$@")
  build_find "$target" "${includes[@]}" 2>/dev/null \
    | xargs -0 -r grep -nHsFI -e "$pattern" >> "$HITS" 2>/dev/null || true
}

scan_one_file() {
  local pattern="$1"; shift
  local f="$1"
  [ -f "$f" ] || return 0
  grep -nHsFI -e "$pattern" "$f" >> "$HITS" 2>/dev/null || true
}

if [ ! -d "$CLAUDE_HOME" ] && [ ! -d "$EVERPASS_ROOT" ]; then
  echo "scan-stale-paths.sh: no search targets exist (CLAUDE_HOME=$CLAUDE_HOME, EVERPASS_ROOT=$EVERPASS_ROOT)" >&2
  exit 2
fi

for pattern in "${PATTERNS[@]}"; do
  scan_one_file "$pattern" "$CLAUDE_HOME/CLAUDE.md"
  scan_one_file "$pattern" "$CLAUDE_HOME/settings.json"
  scan_one_file "$pattern" "$CLAUDE_HOME/settings.local.json"

  scan_files "$pattern" "$CLAUDE_HOME/hooks"
  scan_files "$pattern" "$CLAUDE_HOME/skills" 'SKILL.md' '*.sh' '*.json'

  scan_files "$pattern" "$EVERPASS_ROOT/.claude"

  scan_files "$pattern" "$EVERPASS_ROOT" 'CLAUDE.md'
  scan_files "$pattern" "$EVERPASS_ROOT" 'settings.json' 'settings.local.json'
  scan_files "$pattern" "$EVERPASS_ROOT" '*.sh' '*.ps1' '*.cmd'
done

if [ -s "$HITS" ]; then
  echo "✗ Stale paths detected:"
  sort -u "$HITS"
  exit 1
fi

echo "✓ No stale paths found"
exit 0
