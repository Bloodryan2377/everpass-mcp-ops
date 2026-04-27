# Refresh Contract

**Hard rule:** the phrases "full refresh", "full chain refresh", "full pipeline refresh", or "everything is up to date" must not be used — by Claude or by any human running the loop — unless every `wired` and `bridged` source in `DASHBOARD_SOURCES.md` has been verified in the current session and an explicit per-source report has been produced. Every `gap` and `manual` source must be named in the report, not silently omitted.

This document binds Claude as strictly as it binds humans. If Claude claims a refresh without producing the report below, the user is correct to call it out.

## What counts as a real refresh

For each row in `DASHBOARD_SOURCES.md` with status `wired` or `bridged`:

1. Run the listed verification step.
2. Capture: source name, action taken, pass/fail, latest item or timestamp seen.
3. Append one row to `EverPass – MCP Logs` (`date | event | status`); `event` must include the source name and `status` must be `pass` or `fail`. The log row is the only independent audit trail — skipping it invalidates the refresh.

For each row with status `manual` or `gap`:

1. State explicitly that the source was **not** refreshed and why.
2. Do not silently omit it. The whole point is that gaps are visible, not invisible.

## Required output format

Any reply that asserts a refresh — partial or full — must end with this exact block:

```
REFRESH REPORT — <ISO date>
  wired/bridged:
    - <source>: pass | fail — <latest item, count, or timestamp>
    ...
  not refreshed (manual/gap):
    - <source>: <reason>
    ...
  net staleness risk: <one sentence about what could still be stale>
```

If any wired/bridged source is `fail`, that fact must be surfaced **before** any narrative summary, not buried.

## Anti-patterns

The following have all happened in past sessions and are the reason this contract exists:

- Saying "everything is up to date" without the report block.
- Treating a Gmail-only sweep as a full refresh. Gmail is one source out of many.
- Claiming Outlook is covered without verifying the Outlook → Gmail → label bridge end-to-end.
- Claiming OneDrive / Obsidian / NotebookLM / Contract Master / Deal Brain content is covered. Per `DASHBOARD_SOURCES.md` they are gaps until wired.
- Skipping the `EverPass – MCP Logs` append.
- Reporting cockpit dates as ground truth. The cockpit is a downstream snapshot; verify against the actual source.

## Cockpit-staleness diagnostic

When a card on the Mobile Command Center cockpit looks wrong (e.g., "WBD rate card overdue 15 days" when an updated rate has been received and acknowledged):

1. Identify which source in `DASHBOARD_SOURCES.md` should hold the fresh signal. If none, the update lives in a gap and the cockpit cannot have known.
2. For each candidate source, run its verification step and locate the actual latest item.
3. Compare to the cockpit's claim:
   - Source fresher than cockpit → cockpit is reading a stale upstream snapshot. Escalate to whoever owns the cockpit feed (the renderer in `DASHBOARD_SOURCES.md` row 12 — currently unknown).
   - Source equally stale → the update never landed in any wired surface. It is in a gap (Outlook bridge broken, OneDrive, Obsidian, NotebookLM, Contract Master, Deal Brain). Name the gap in the report.
4. Open or update a TODO entry if the gap is structural, not a one-off.

## How to call this out

If a Claude reply claims a refresh without the `REFRESH REPORT` block, or omits any `wired`/`bridged` source from the block, reply: **"refresh contract violation — re-run with full report."** No further explanation is required from the user. The contract is the contract.
