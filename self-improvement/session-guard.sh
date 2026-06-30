#!/usr/bin/env bash
# session-guard.sh — detect overlapping active sessions on this branch.
#
# Problem: the same repo can be driven from more than one place at once — a
# Claude Code web session (ephemeral container) and a local session, for
# example. Two sessions editing/pushing the same branch step on each other.
# This guard makes the overlap visible BEFORE you start working.
#
# Coordination point is the git remote (the only thing both sessions share):
# the active session writes a small lock file (`.active-session.json`) and
# pushes it; other sessions fetch and read it.
#
# Usage:
#   session-guard.sh check                 # warn if another session is active (run at startup)
#   session-guard.sh acquire [id]          # claim the branch for this session (commits + pushes)
#   session-guard.sh release [id]          # release the claim (commits + pushes)
#   session-guard.sh heartbeat [id]        # refresh your lock's timestamp (long sessions)
#   session-guard.sh whoami                # print this session's id
#
# A session that stays active longer than the TTL (default 45m) would otherwise
# look "stale" to others and could be taken over. Call `heartbeat` periodically
# (e.g. from a SessionStart/periodic step) to keep your claim fresh.
#
# id defaults to $CLAUDE_CODE_SESSION_ID, else "$(hostname)-$$".
#
# Exit codes:
#   0 — clean (no overlap) / success
#   1 — overlap detected, or refused (acquire while another session is active)
#   2 — environment/setup error
#
# Freshness: a lock older than SESSION_GUARD_TTL_MIN (default 45) is treated as
# stale (the other session probably died without releasing) and does NOT block.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCK="$SCRIPT_DIR/.active-session.json"
LOCK_REL="self-improvement/.active-session.json"
TTL_MIN="${SESSION_GUARD_TTL_MIN:-45}"

die()  { echo "session-guard: $*" >&2; exit 2; }
command -v jq  >/dev/null 2>&1 || die "jq not found"
command -v git >/dev/null 2>&1 || die "git not found"

cd "$SCRIPT_DIR" || die "cannot cd to module dir"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "not a git work tree"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
NOW_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
SELF_ID="${CLAUDE_CODE_SESSION_ID:-$(hostname)-$$}"

now_epoch()  { date -u +%s; }
to_epoch()   { date -u -d "$1" +%s 2>/dev/null || echo 0; }

# Fetch the remote copy of the branch (best effort) and emit the remote lock JSON.
remote_lock() {
  git fetch -q origin "$BRANCH" 2>/dev/null || true
  git show "origin/$BRANCH:$LOCK_REL" 2>/dev/null || echo '{}'
}

# Is the remote branch ahead of local HEAD? (another session pushed)
remote_ahead() {
  git rev-list --count "HEAD..origin/$BRANCH" 2>/dev/null || echo 0
}

cmd_check() {
  local lock; lock="$(remote_lock)"
  local ahead; ahead="$(remote_ahead)"
  local state id host hb
  state="$(jq -r '.state // "released"' <<<"$lock" 2>/dev/null || echo released)"
  id="$(jq -r '.session_id // ""' <<<"$lock" 2>/dev/null || echo "")"
  host="$(jq -r '.host // "?"' <<<"$lock" 2>/dev/null || echo "?")"
  hb="$(jq -r '.heartbeat_utc // ""' <<<"$lock" 2>/dev/null || echo "")"

  local overlap=0
  if [ "$state" = "active" ] && [ -n "$id" ] && [ "$id" != "$SELF_ID" ]; then
    local age=$(( ( $(now_epoch) - $(to_epoch "$hb") ) / 60 ))
    if [ "$age" -le "$TTL_MIN" ]; then
      overlap=1
      echo "⚠️  OVERLAP: another session is active on '$BRANCH'."
      echo "    session_id : $id"
      echo "    host       : $host"
      echo "    heartbeat  : $hb  (${age} min ago, TTL ${TTL_MIN}m)"
      echo "    → Coordinate before editing/pushing. To take over after confirming"
      echo "      the other session is done:  session-guard.sh acquire"
    else
      echo "ℹ️  Stale lock from '$id' on '$BRANCH' (${age} min old > ${TTL_MIN}m TTL) — ignoring."
    fi
  fi

  if [ "${ahead:-0}" -gt 0 ]; then
    echo "ℹ️  origin/$BRANCH is $ahead commit(s) ahead of your local HEAD — run: git pull origin $BRANCH"
  fi

  if [ "$overlap" = "0" ]; then
    [ "${ahead:-0}" -gt 0 ] || echo "✓ No active overlapping session on '$BRANCH'. Clear to work."
    return 0
  fi
  return 1
}

write_lock_and_push() { # $1=state $2=id
  local state="$1" id="$2"
  jq -n --arg id "$id" --arg host "$(hostname)" --arg br "$BRANCH" \
        --arg acq "$NOW_UTC" --arg hb "$NOW_UTC" --arg st "$state" \
    '{session_id:$id,host:$host,branch:$br,acquired_utc:$acq,heartbeat_utc:$hb,state:$st}' > "$LOCK"
  git add "$LOCK"
  git commit -q -m "[session-guard] $state $BRANCH by $id" -m "Session-guard coordination marker (not application code)." || {
    echo "session-guard: nothing to commit (lock unchanged)"; return 0; }
  local i
  for i in 1 2 3 4; do
    git push -q -u origin "$BRANCH" && return 0
    sleep $((2**i))
  done
  echo "session-guard: push failed after retries — commit is local only" >&2
  return 0
}

cmd_acquire() {
  local id="${1:-$SELF_ID}"
  if ! cmd_check >/dev/null 2>&1; then
    echo "session-guard: refusing to acquire — another session is active. Run 'check' to see who, coordinate, then re-run with that session released."
    cmd_check || true
    exit 1
  fi
  write_lock_and_push "active" "$id"
  echo "✓ Acquired '$BRANCH' for session $id."
}

cmd_release() {
  local id="${1:-$SELF_ID}"
  write_lock_and_push "released" "$id"
  echo "✓ Released '$BRANCH' (was held by $id)."
}

cmd_heartbeat() {
  local id="${1:-$SELF_ID}"
  local lock state holder
  lock="$(remote_lock)"
  state="$(jq -r '.state // "released"' <<<"$lock" 2>/dev/null || echo released)"
  holder="$(jq -r '.session_id // ""' <<<"$lock" 2>/dev/null || echo "")"
  if [ "$state" = "active" ] && [ "$holder" = "$id" ]; then
    write_lock_and_push "active" "$id"
    echo "✓ Heartbeat refreshed for $id on '$BRANCH'."
  else
    echo "session-guard: not holding the lock (state=$state, holder=${holder:-none}) — nothing to refresh."
  fi
}

case "${1:-}" in
  check)   cmd_check;;
  acquire) shift || true; cmd_acquire "$@";;
  release)   shift || true; cmd_release "$@";;
  heartbeat) shift || true; cmd_heartbeat "$@";;
  whoami)  echo "$SELF_ID";;
  ""|-h|--help|help) sed -n '2,30p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//';;
  *) die "unknown subcommand '$1' (check|acquire|release|heartbeat|whoami)";;
esac
