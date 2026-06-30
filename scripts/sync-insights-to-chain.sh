#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# sync-insights-to-chain.sh
#
# Thin, forgiving wrapper around scripts/ingest_market_intel.py. Propagates
# every market-intel insight note under data/insights/ into the live cockpit
# chain (data/mobile/mobile-cockpit.json + feed manifest + insights index).
#
# This is the script the Claude Code hooks call (SessionStart + PostToolUse on
# data/insights writes) and the one to run by hand:
#
#     bash scripts/sync-insights-to-chain.sh           # apply
#     bash scripts/sync-insights-to-chain.sh --check    # dry-run (rc=1 on drift)
#
# Degrades gracefully on purpose: it must NEVER fail a session start or block
# an edit just because the engine couldn't run. Always exits 0; the engine's
# own output (and any error) is surfaced on stderr.
# ---------------------------------------------------------------------------
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ENGINE="$SCRIPT_DIR/ingest_market_intel.py"

PY="$(command -v python3 || command -v python || true)"
if [ -z "$PY" ]; then
  echo "sync-insights-to-chain: python not found on PATH; skipping" >&2
  exit 0
fi
if [ ! -f "$ENGINE" ]; then
  echo "sync-insights-to-chain: engine missing at $ENGINE; skipping" >&2
  exit 0
fi

# Pass through any extra args (e.g. --check, --now ISO).
"$PY" "$ENGINE" --all "$@" || echo "sync-insights-to-chain: engine returned non-zero (see above); not blocking" >&2
exit 0
