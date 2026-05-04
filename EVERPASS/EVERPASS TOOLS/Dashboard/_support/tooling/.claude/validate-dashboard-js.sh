#!/usr/bin/env bash
# validate-dashboard-js.sh
# Post-edit structural integrity check for the pipeline dashboard.
# Catches the class of error where an Edit/Write operation breaks a JS
# data array (premature close, orphan syntax, missing comma, etc.)
# and also catches unterminated string literals and other parse errors
# via Node.js --check on every <script> block.
#
# Validates 21 load-bearing data structures (6 primary + 15 supporting).
# See DATA_STRUCTURES array below for the full list.
#
# Called automatically by the PostToolUse hook after any Edit/Write to
# the dashboard HTML file.
#
# Exit 0: all checks pass
# Exit 1: structural error detected (block the edit chain)

DASH="${DASHBOARD_HTML:-C:/Users/ryan/OneDrive - EverPass Media/EVERPASS/EVERPASS TOOLS/Dashboard/EverPass Media _ Content Pipeline Decision-Making Dashboard.html}"

if [ ! -f "$DASH" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

ERRORS=""

# ── Check 1: No premature array closes (];; or similar artifacts) ──
DOUBLE_SEMI=$(grep -n '];;' "$DASH" 2>/dev/null)
if [ -n "$DOUBLE_SEMI" ]; then
  ERRORS="${ERRORS}CRITICAL: Premature array close detected (];;) at: $(echo "$DOUBLE_SEMI" | head -1)\n"
fi

# ── Check 2a: Primary "Big 6" — existence + bare-closing validation ──
# These are top-level declarations with bare }; or ]; on their own line.
# They have been the source of real corruption incidents (April 2026).
# Each entry: "variableName|declarationPattern|isArray"
# isArray=1 means we look for bare ]; as closing; isArray=0 means };
PRIMARY_STRUCTURES=(
  "pipelineIntelligence|const pipelineIntelligence\s*=|1"
  "goNoGoData|const goNoGoData\s*=|0"
  "economicsData|const economicsData\s*=|0"
  "negotiationData|const negotiationData\s*=|0"
  "launchReadinessData|const launchReadinessData\s*=|0"
  "pipelineState|const pipelineState\s*=|0"
)

for ENTRY in "${PRIMARY_STRUCTURES[@]}"; do
  IFS='|' read -r NAME PATTERN IS_ARRAY <<< "$ENTRY"

  START_LINE=$(grep -n "$PATTERN" "$DASH" 2>/dev/null | head -1 | cut -d: -f1)
  if [ -z "$START_LINE" ]; then
    ERRORS="${ERRORS}CRITICAL: Data declaration missing: $NAME\n"
    continue
  fi

  if [ "$IS_ARRAY" = "1" ]; then
    CLOSE_LINE=$(awk -v start="$START_LINE" 'NR > start && /^\];$/ { print NR; exit }' "$DASH" 2>/dev/null)
    CLOSE_CHAR="];"
  else
    CLOSE_LINE=$(awk -v start="$START_LINE" 'NR > start && /^\};$/ { print NR; exit }' "$DASH" 2>/dev/null)
    CLOSE_CHAR="};"
  fi

  if [ -z "$CLOSE_LINE" ]; then
    ERRORS="${ERRORS}CRITICAL: $NAME (line $START_LINE) has no closing $CLOSE_CHAR\n"
    continue
  fi

  # Check for suspicious bare ]; inside array bodies (not at the closing line)
  if [ "$IS_ARRAY" = "1" ]; then
    INNER_CLOSE=$(awk -v start="$START_LINE" -v end="$CLOSE_LINE" \
      'NR > start && NR < end && /^\];$/ { print NR": "$0 }' "$DASH" 2>/dev/null)
    if [ -n "$INNER_CLOSE" ]; then
      ERRORS="${ERRORS}CRITICAL: Suspicious bare ]; inside $NAME array body at: $(echo "$INNER_CLOSE" | head -1)\n"
    fi
  fi
done

# ── Check 2b: Supporting load-bearing structures — existence check ──
# These are declared inside functions or at varying indent levels, so
# bare-closing validation would produce false positives. Node --check
# (Check 6) catches actual syntax errors in these structures. This
# check ensures they haven't been accidentally deleted.
# Added 2026-04-11 during architecture refresh.
SUPPORTING_STRUCTURES=(
  "salesFlowData|const salesFlowData\s*="
  "datasets|const datasets\s*="
  "decisionOptions|const decisionOptions\s*="
  "resultData|const resultData\s*="
  "DEPARTMENTS|const DEPARTMENTS\s*="
  "RACI_ROLES|const RACI_ROLES\s*="
  "workstreamOutputs|const workstreamOutputs\s*="
  "pipelinePropPickerMeta|const pipelinePropPickerMeta\s*="
  "propertyLabels|const propertyLabels\s*="
  "PHASES|const PHASES\s*="
  "stakeholders|const stakeholders\s*="
  "handAuthoredSlides|var handAuthoredSlides\s*="
  "propertyBreakevenParams|var propertyBreakevenParams\s*="
  "embeddedSubPages|var embeddedSubPages\s*="
  "deliverableTracking|const deliverableTracking\s*="
)

for ENTRY in "${SUPPORTING_STRUCTURES[@]}"; do
  IFS='|' read -r NAME PATTERN <<< "$ENTRY"

  if ! grep -q "$PATTERN" "$DASH" 2>/dev/null; then
    ERRORS="${ERRORS}CRITICAL: Supporting data structure missing: $NAME\n"
  fi
done

# ── Check 3: Validate critical function definitions exist after data arrays ──
for FUNC in "function selectProperty" "function selectPropertyDetail" "function renderPropertySummaryV2" "function showPanel" "function escHtml"; do
  if ! grep -q "$FUNC" "$DASH" 2>/dev/null; then
    ERRORS="${ERRORS}CRITICAL: Missing function definition: $FUNC\n"
  fi
done

# ── Check 4: Bracket imbalance heuristic ──
# CSS attribute selectors like [type="text"] create inherent imbalance, so
# threshold is set high enough to avoid false positives but still catch
# catastrophic array breaks (which typically shift the balance by 50+).
OPEN_BRACKETS=$(grep -o '\[' "$DASH" | wc -l)
CLOSE_BRACKETS=$(grep -o '\]' "$DASH" | wc -l)
BRACKET_DIFF=$((OPEN_BRACKETS - CLOSE_BRACKETS))
if [ "$BRACKET_DIFF" -gt 25 ] || [ "$BRACKET_DIFF" -lt -25 ]; then
  ERRORS="${ERRORS}WARNING: Bracket imbalance detected (open=$OPEN_BRACKETS, close=$CLOSE_BRACKETS, diff=$BRACKET_DIFF). Possible broken array.\n"
fi

# ── Check 5: The DOMContentLoaded block exists and isn't truncated ──
if ! grep -q "document.addEventListener.*DOMContentLoaded" "$DASH" 2>/dev/null; then
  ERRORS="${ERRORS}CRITICAL: DOMContentLoaded handler missing or broken.\n"
fi

# ── Check 6: Node.js syntax check on every <script> block ──
# Catches unterminated string literals, unexpected tokens, and other
# parse errors that grep-based checks cannot detect.
if command -v node &>/dev/null; then
  TMPDIR_JS=$(mktemp -d 2>/dev/null || echo "/tmp/dashboard_validate_$$")
  mkdir -p "$TMPDIR_JS" 2>/dev/null

  # Extract each <script> block to a temp file and run node --check
  BLOCK_IDX=0
  node -e "
    const fs = require('fs');
    const html = fs.readFileSync(process.argv[1], 'utf8');
    const re = /<script[^>]*>([\s\S]*?)<\/script>/g;
    let m, idx = 0;
    while ((m = re.exec(html)) !== null) {
      const content = m[1];
      if (content.trim().length > 0) {
        fs.writeFileSync(process.argv[2] + '/block_' + idx + '.js', content, 'utf8');
        idx++;
      }
    }
    console.log(idx);
  " "$DASH" "$TMPDIR_JS" 2>/dev/null | read BLOCK_COUNT

  # If node extraction failed, count files directly
  if [ -z "$BLOCK_COUNT" ]; then
    BLOCK_COUNT=$(ls "$TMPDIR_JS"/block_*.js 2>/dev/null | wc -l)
  fi

  for JSFILE in "$TMPDIR_JS"/block_*.js; do
    [ -f "$JSFILE" ] || continue
    BLOCK_NAME=$(basename "$JSFILE" .js)
    CHECK_OUTPUT=$(node --check "$JSFILE" 2>&1)
    if [ $? -ne 0 ]; then
      # Extract the error line for a useful message
      ERR_LINE=$(echo "$CHECK_OUTPUT" | grep -m1 "SyntaxError:" | head -1)
      ERR_LOC=$(echo "$CHECK_OUTPUT" | grep -m1 "\.js:" | head -1 | sed 's|.*/||')
      ERRORS="${ERRORS}CRITICAL: JS parse error in script ${BLOCK_NAME}: ${ERR_LINE:-unknown error} (${ERR_LOC:-unknown location})\n"
    fi
  done

  rm -rf "$TMPDIR_JS" 2>/dev/null
fi

# ── Report ──
if [ -n "$ERRORS" ]; then
  # Format for hook output
  ESCAPED=$(echo -e "$ERRORS" | sed 's/"/\\"/g' | tr '\n' ' ')
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUse\",\"additionalContext\":\"DASHBOARD INTEGRITY FAILURE: ${ESCAPED}The edit may have broken the dashboard. Check the .bak file and compare. Do NOT proceed with further edits until this is resolved.\"}}"
  exit 1
else
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUse\",\"additionalContext\":\"Dashboard JS integrity check passed (syntax + structure + data arrays).\"}}"
  exit 0
fi
