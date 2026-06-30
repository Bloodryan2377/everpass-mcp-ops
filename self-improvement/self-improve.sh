#!/usr/bin/env bash
# self-improve.sh — EverPass self-improvement loop engine.
#
# A small, dependency-light (bash + jq) queue manager for proposed improvements
# to the operating system itself: skills, hooks, CLAUDE.md rules, SOPs, scripts.
# The loop is: propose -> review -> apply (log). HIGH-impact proposals ALWAYS
# require human review; lower-impact ones may auto-approve if config allows.
#
# Data files (resolved relative to this script, so the module is portable):
#   queue.json   — pending proposals awaiting review        (JSON array)
#   log.jsonl    — append-only record of resolved proposals (one JSON/line)
#   config.json  — auto-approve policy                       (JSON object)
#
# Usage:
#   self-improve.sh propose --impact HIGH|MED|LOW --title "..." [--detail "..."]
#   self-improve.sh list
#   self-improve.sh resolve <id> --approve|--reject [--note "..."]
#   self-improve.sh status [--hook]
#   self-improve.sh log [-n N]
#
# Exit codes:
#   0 — success / clean
#   1 — pending items exist (status), or a handled user error
#   2 — environment/setup error (missing jq, unreadable data)
#
# Design rules (binding):
#   - HIGH impact NEVER auto-approves, regardless of config. Every HIGH change
#     is reviewed by a human before it is recorded as applied.
#   - The queue is the single source of truth for "what still needs review".
#   - Nothing is destructive: resolve moves an item from queue -> log, it never
#     edits your repo. Applying the actual change is a separate, deliberate step.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QUEUE="$SCRIPT_DIR/queue.json"
LOG="$SCRIPT_DIR/log.jsonl"
CONFIG="$SCRIPT_DIR/config.json"

die()  { echo "self-improve: $*" >&2; exit 2; }
warn() { echo "self-improve: $*" >&2; }

command -v jq >/dev/null 2>&1 || die "jq not found in PATH"

# Bootstrap data files if absent (idempotent, safe to re-run).
[ -f "$QUEUE" ]  || echo "[]" > "$QUEUE"
[ -f "$LOG" ]    || : > "$LOG"
[ -f "$CONFIG" ] || echo '{"auto_approve_impacts":[],"auto_approve_title_patterns":[]}' > "$CONFIG"

now_utc() { date -u +%Y-%m-%dT%H:%M:%SZ; }

# Next id = max numeric suffix across queue + log, + 1, zero-padded to 4.
next_id() {
  local maxq maxl max
  maxq=$(jq -r '[.[].id | ltrimstr("SI-") | tonumber] | max // 0' "$QUEUE" 2>/dev/null || echo 0)
  maxl=$(jq -rs '[.[].id | ltrimstr("SI-") | tonumber] | max // 0' "$LOG" 2>/dev/null || echo 0)
  max=$(( maxq > maxl ? maxq : maxl ))
  printf "SI-%04d" "$(( max + 1 ))"
}

# Does this proposal qualify for auto-approval? HIGH is always "no".
auto_approves() {
  local impact="$1" title="$2"
  [ "$impact" = "HIGH" ] && return 1
  if jq -e --arg i "$impact" '.auto_approve_impacts | index($i)' "$CONFIG" >/dev/null 2>&1; then
    return 0
  fi
  # title pattern match (case-insensitive substring)
  local lt; lt=$(printf '%s' "$title" | tr '[:upper:]' '[:lower:]')
  while IFS= read -r pat; do
    [ -z "$pat" ] && continue
    local lp; lp=$(printf '%s' "$pat" | tr '[:upper:]' '[:lower:]')
    case "$lt" in *"$lp"*) return 0;; esac
  done < <(jq -r '.auto_approve_title_patterns[]?' "$CONFIG")
  return 1
}

append_log() { # compact one-line JSON
  jq -c -n "$@" >> "$LOG"
}

cmd_propose() {
  local impact="" title="" detail=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --impact) impact="${2:-}"; shift 2;;
      --title)  title="${2:-}";  shift 2;;
      --detail) detail="${2:-}"; shift 2;;
      *) die "propose: unknown arg '$1'";;
    esac
  done
  [ -n "$impact" ] || die "propose: --impact required (HIGH|MED|LOW)"
  [ -n "$title" ]  || die "propose: --title required"
  case "$impact" in HIGH|MED|LOW) ;; *) die "propose: impact must be HIGH, MED, or LOW";; esac

  local id ts; id=$(next_id); ts=$(now_utc)

  if auto_approves "$impact" "$title"; then
    append_log --arg id "$id" --arg tp "$ts" --arg tr "$ts" --arg im "$impact" \
      --arg ti "$title" --arg de "$detail" --arg dc "approved" --arg nt "auto-approved by config" \
      '{id:$id,ts_proposed:$tp,ts_resolved:$tr,impact:$im,title:$ti,detail:$de,decision:$dc,note:$nt}'
    echo "$id auto-approved (impact=$impact) — logged."
    return 0
  fi

  local tmp; tmp=$(mktemp)
  jq --arg id "$id" --arg ts "$ts" --arg im "$impact" --arg ti "$title" --arg de "$detail" \
    '. += [{id:$id,ts:$ts,impact:$im,title:$ti,detail:$de,status:"pending"}]' "$QUEUE" > "$tmp"
  mv "$tmp" "$QUEUE"
  echo "$id queued for review (impact=$impact). Resolve with: self-improve.sh resolve $id --approve|--reject"
}

cmd_list() {
  local n; n=$(jq 'length' "$QUEUE")
  if [ "$n" = "0" ]; then echo "Review queue is clean — 0 pending."; return 0; fi
  echo "Pending review ($n):"
  jq -r '.[] | "  \(.id)  [\(.impact)]  \(.title)\n        \(.detail // "" | if . == "" then "(no detail)" else . end)"' "$QUEUE"
}

cmd_resolve() {
  local id="${1:-}"; shift || true
  [ -n "$id" ] || die "resolve: <id> required"
  local decision="" note=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --approve) decision="approved"; shift;;
      --reject)  decision="rejected"; shift;;
      --note)    note="${2:-}"; shift 2;;
      *) die "resolve: unknown arg '$1'";;
    esac
  done
  [ -n "$decision" ] || die "resolve: --approve or --reject required"

  local item; item=$(jq -c --arg id "$id" '.[] | select(.id==$id)' "$QUEUE")
  [ -n "$item" ] || { warn "resolve: id '$id' not found in queue"; exit 1; }

  local ts; ts=$(now_utc)
  printf '%s' "$item" | jq -c --arg tr "$ts" --arg dc "$decision" --arg nt "$note" \
    '{id:.id,ts_proposed:.ts,ts_resolved:$tr,impact:.impact,title:.title,detail:.detail,decision:$dc,note:$nt}' >> "$LOG"

  local tmp; tmp=$(mktemp)
  jq --arg id "$id" 'map(select(.id != $id))' "$QUEUE" > "$tmp"
  mv "$tmp" "$QUEUE"
  echo "$id $decision and moved to log."
}

cmd_status() {
  local hook=0
  [ "${1:-}" = "--hook" ] && hook=1
  local n; n=$(jq 'length' "$QUEUE")
  if [ "$n" = "0" ]; then
    [ "$hook" = "1" ] || echo "Self-improvement queue clean — nothing to review."
    exit 0
  fi
  # Pending items exist — surface them.
  echo "[self-improve] $n improvement(s) awaiting review before this session ends:"
  jq -r '.[] | "  \(.id)  [\(.impact)]  \(.title)"' "$QUEUE"
  echo "  Resolve: self-improvement/self-improve.sh resolve <id> --approve|--reject [--note \"...\"]"
  exit 1
}

cmd_log() {
  local n=10
  [ "${1:-}" = "-n" ] && { n="${2:-10}"; }
  if [ ! -s "$LOG" ]; then echo "Log is empty."; return 0; fi
  jq -rs --argjson n "$n" '.[-$n:][] | "\(.ts_resolved)  \(.id)  [\(.impact)]  \(.decision | ascii_upcase)  \(.title)"' "$LOG"
}

main() {
  local sub="${1:-}"; shift || true
  case "$sub" in
    propose) cmd_propose "$@";;
    list)    cmd_list "$@";;
    resolve) cmd_resolve "$@";;
    status)  cmd_status "$@";;
    log)     cmd_log "$@";;
    ""|-h|--help|help)
      sed -n '2,40p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//';;
    *) die "unknown subcommand '$sub' (try: propose|list|resolve|status|log)";;
  esac
}

main "$@"
