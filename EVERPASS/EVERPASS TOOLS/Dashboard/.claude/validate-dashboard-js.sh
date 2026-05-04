#!/usr/bin/env bash
# validate-dashboard-js.sh (wrapper)
# Thin defensive wrapper invoked by the global PostToolUse hook
# (matcher: Edit|Write, when input mentions "Pipeline Decision-Making Dashboard").
#
# Delegates to the canonical validator at:
#   _support/tooling/.claude/validate-dashboard-js.sh
#
# Behavior:
#   - If canonical script + dashboard HTML both exist -> run canonical, propagate exit code.
#   - If canonical script missing -> emit info and exit 0 (do not break the edit chain).
#   - If dashboard HTML missing  -> emit info and exit 0 (nothing to validate).
#
# Exit 0: pass / not-applicable
# Exit 1: canonical reported a structural failure (the only blocking case)

CANON="C:/Users/ryan/OneDrive - EverPass Media/EVERPASS/EVERPASS TOOLS/Dashboard/_support/tooling/.claude/validate-dashboard-js.sh"
DASH="C:/Users/ryan/OneDrive - EverPass Media/EVERPASS/EVERPASS TOOLS/Dashboard/EverPass Media _ Content Pipeline Decision-Making Dashboard.html"

if [ ! -f "$DASH" ]; then
  echo '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"Dashboard JS validator skipped: dashboard HTML not found at expected path."}}'
  exit 0
fi

if [ ! -f "$CANON" ]; then
  echo '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"Dashboard JS validator skipped: canonical script not configured."}}'
  exit 0
fi

DASHBOARD_HTML="$DASH" bash "$CANON"
exit $?
