#!/usr/bin/env bash
# self-improve-status.sh — Stop-hook surface for the self-improvement loop.
#
# Registered as a Claude Code `Stop` hook (see settings.stop-hook.json). It runs
# at session end and is SILENT when the review queue is clean. When proposals are
# pending, it prints them plus the resolve command so the queue can't quietly rot
# between sessions — no separate scheduler needed.
#
# It is a thin wrapper around `self-improve.sh status --hook`; all queue logic
# lives in the engine. Always exits 0 so it never blocks session stop.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/self-improve.sh" status --hook || true
exit 0
