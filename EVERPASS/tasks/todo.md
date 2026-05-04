# EVERPASS — Active Workstreams

Small set of currently-active workstreams. **Not** a full task dump — see `EVERPASS TOOLS/To Do List Tracker.xlsx` (and the `anthropic-skills:tracker-update` skill) for the canonical task list.

When an item ships, archive it to the bottom under `## Shipped` with the date. When it stalls > 14 days, move to `## Holding` with the reason.

Last refreshed: 2026-05-04

---

## Active

### 1. MS365 MCP / Outlook session-stable path
- **Status:** MCP installed, tools NOT session-stable (audit R-04 follow-up).
- **Goal:** Restore Outlook → partner-insights flow that was retired 2026-04-26 (DEV intake trio).
- **Next action:** Confirm whether the on-demand skill path is the right shape, or wait for MCP stability fix from MS.
- **Blocker:** Tool surface drops between sessions. No reliable Outlook MCP today.

### 2. Per-partner state.json (audit R-02)
- **Status:** Open.
- **Goal:** Centralized per-property state store as defined by central property state doctrine (2026-04-23 binding).
- **Next action:** Define schema; pilot on 3 properties before fan-out.

### 3. Plaud watcher scheduling (audit R-03)
- **Status:** Open.
- **Goal:** Move Plaud meeting recorder ingestion from manual to scheduled.
- **Next action:** Wire `MeetingPipeline/process_plaud_meeting.py` into Task Scheduler with same pattern as `EverPass Ask Watcher`.

### 4. Contract Master → Dashboard wiring
- **Status:** Deferred (separate session).
- **Goal:** Surface Contract Master.xlsx state in the dashboard HTML.
- **Next action:** Decide whether to read the JSON exports or query the xlsx directly. Keep markdown as upstream regardless.

### 5. NotebookLM partner sweep — failing-partner triage
- **Status:** Recurring weekly. Latest entry 2026-04-27 (BravesVision, `zero_sources`).
- **Goal:** Drive failing-partner count to 0 each week.
- **Next action:** Diagnose `zero_sources` for BravesVision (likely OneDrive linkage drop). Re-attach via Sources panel, do not re-upload.

---

## Holding

(none right now)

---

## Shipped

- 2026-04-26 — Phase 1C: Partner Insights bridge (`sync-partner-insights.py`), 7→38/38 coverage
- 2026-04-26 — Phase 1B: DEV intake trio retired (R-04)
- 2026-04-26 — Full pipeline refresh (35 partners, wiki-updates rebuilt)
- 2026-04-23 — Go/No-Go deck 4-slide format locked
- 2026-04-21 — Daily update module (cockpit `#daily-update`)
- 2026-04-20 — LG fully onboarded; NP-001 procedure locked
