# EverPass Recovery / Refresh Runbook (post-pause resume)

**Purpose.** Bring the EverPass chain back to `CURRENT` after the intentional pause.
As of the last captured state the Command Center reads **NOT CURRENT** (freshness=WARN,
intel=WARN, chain=WARN) and the last **full extraction is 2026-06-19 (STALE, ~28d)**.

**Where this runs.** On Ryan's Windows box, under the live runtime tree
`C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\`, driven by the local Claude Code /
Fable control plane (`~/.claude/control-plane/control_plane.py`). It does **not** run from
this tracking repo — this repo is the human-readable scaffold/mirror; the runtime scripts,
dashboard HTML, and Command Center live only in the OneDrive tree.

**Why it isn't executed here.** This audit environment has no access to Ryan's Windows
machine, the OneDrive tree, the EverPass mailbox, or the refresh scripts
(`EVERPASS TOOLS/Scripts/*.py`). Live-state verification cannot be fabricated. Paste the
batches below into the local control plane, one at a time, and stop at each gate.

---

## Guardrails (read before Batch 0 — these bind every batch)

- **Scope lock.** Resume **EverPass only**. Do **NOT** touch StayTurn. Do **NOT** resume
  unrelated global/other-project tasks. Do **NOT** publish or send any communication —
  drafts only (CLAUDE.md §5: *Claude never sends email; Ryan is sole sender*).
- **Conflict order (top wins), from the system map:**
  `Outlook > EverPass on-disk current files > chain_anchor.json > econ_canon.json > memory/context`.
  When sources disagree, the higher one wins; never overwrite a higher source from a lower one.
- **Control-plane unlock rule (map §"Session front door", EVL-122).** Negotiation / contract /
  exec_status **mutations** unlock **ONLY** via Traded Legal Documents / Negotiation Folder /
  Outlook reads / `traded_position_check.py`. `chain_anchor.json`, `econ_canon.json`,
  NotebookLM, request packets, and memory are **LEAD-ONLY** and never unlock a mutation.
- **Manual override always wins** over automation. Auto-pipeline may only **ADD** entries with
  new IDs; never overwrite a non-empty `goNoGoData` / `economicsData` / `negotiationData`.
- **RETIRED — do not resurrect:** the Winston **weekly** exec deck
  (`Weekly Outputs/recurring/weekly` + `weekly.everpasspipeline.com`). It is retired from the
  live chain; files/site are left in place, no teardown. The **touchbase** deck and the
  **weekly-execs** brief (`execs.everpasspipeline.com`) are SEPARATE and remain live.
- **Naming:** `cockpit` / `Daily Cockpit` / `Mission Control` / `command surface` / `v3` all
  refer to the **LIVE Command Center** (`command-center-v2.html`). Never flag it as retired.
  The only retired `cockpit` is the four dormant files
  (`everpass-daily-cockpit.html`, `everpass-cockpit.html`, `cockpit.cmd`, `Run-Cockpit-Refresh.cmd`).
  `cockpit-data.json` / `cockpit-state.json` / `cockpit-tiles` are Command Center INTERNALS —
  do not remove them.
- **Ask budget:** keep each batch **under 40 discrete asks** in the control-plane ledger.
  Every batch ends with a hard STOP + report gate so Ryan re-authorizes before the next one.
- **Definition of done (CLAUDE.md §6, SI-0001/0002):** never report a leg as done until it is
  verified on disk / on origin. On-disk-in-a-container ≠ durable.
- **Rollback:** control plane fails open on internal error; `bash ~/.claude/control-plane/rollback.sh`.
  All refresh scripts below are re-runnable; the dashboard auto-`.bak`s before edits.

---

## Batch 0 — Preflight (read-only, ~8 asks). No mutations.

Goal: confirm it is safe to refresh and capture the baseline. Nothing here writes.

1. Confirm OneDrive process is running and the network is reachable (the `pre-pipeline-refresh`
   PreToolUse hook blocks a refresh otherwise — do not bypass it; fix the precondition).
2. `cd` to `C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\EVERPASS TOOLS`.
3. Read `Cockpit\command-center-status.json` — record `status`, feeds fresh/total, guards.
4. Read `AI Related\health\freshness-status.json` — record `overall`, and the names of any
   `stale`/`red` artifacts (expected: 1 stale as of last map run).
5. If the system map may be stale, regenerate it read-only-style and re-read:
   `python Scripts\build_system_map.py` (regenerates `EVERPASS-SYSTEM-MAP.md`; it edits only
   the generated map, not the chain).
6. Confirm no StayTurn path/session is in scope for this control-plane session.
7. **STOP. Report:** current Command Center status line, freshness `overall`, fresh/total feed
   count, the exact name(s) of stale/WARN feeds, and the last full-extraction date. Do not
   proceed to Batch 1 without Ryan's go.

**Abort if:** OneDrive not running, network unreachable, or the map/status files
are missing — report and stop; do not force a refresh.

---

## Batch 1 — Deterministic core refresh (~10 asks). Re-runnable, reversible.

These are the deterministic (non-LLM) legs named in the Command Center remediation text.
Run in order; each is idempotent and safe to re-run.

> **HARD GATE (Batch 1 blocker) — correct EverPass Outlook mailbox pull.** Because Outlook is
> the top of the conflict order (`Outlook > on-disk current files > chain_anchor > econ_canon >
> memory`) and email is the primary "latest insight" stream (CLAUDE.md §4), Batch 1 may not
> proceed until a fresh pull from the **correct EverPass mailbox** (`rblood@everpass.com`,
> scoped to `label:"EverPass"`) has been confirmed. Verify you are pulling the actual EverPass
> mailbox, not a wrong/stale connected account. If the correct mailbox cannot be confirmed as
> pulled, **STOP** and report — do not run the deterministic legs against a chain that Outlook
> has not refreshed.
>
> **Status recorded during this audit (2026-07-17):** the Computer-connected Outlook returned
> **zero post-2026-07-10 emails**. Because that pull produced no new mail, **no email resync was
> performed or claimed here** — the mailbox freshness gate is therefore **not yet satisfied** and
> must be re-run on the live box against the correct EverPass mailbox before Batch 1 continues.

1. **Confirm the Outlook hard gate above is satisfied** (correct EverPass mailbox pulled). If
   the only available pull is the zero-post-2026-07-10 result noted above, stop and escalate —
   do not substitute memory/anchor/canon for the missing mail.
2. Sync the dashboard `.bak` to the current live file (backup-follows-live rule) before any
   pipeline touch.
3. `python Scripts\freshness_enforcer.py` — capture the baseline verdict (exit 0 PASS / 1 WARN
   / 2 FAIL).
4. `python Scripts\build_contract_snapshots.py` — clears the `contract-summary (stale)` leg.
5. `python Scripts\build_command_center.py` — Gate-2 Step-8 conductor; rebuilds the Command
   Center feeds and clears `guard:freshness=WARN` / `guard:intel=WARN` for the deterministic feeds.
6. `python Scripts\freshness_enforcer.py` — re-run to re-evaluate after the rebuild.
7. Re-read `Cockpit\command-center-status.json`; confirm the status line moved toward `CURRENT`
   and note which feeds are still not fresh (these are the heavy/LLM feeds handled in Batch 2).
8. **STOP. Report:** whether the Outlook mailbox gate was satisfied (and from which mailbox),
   before/after freshness `overall`, fresh/total count, and the remaining non-fresh feed names.
   If `freshness_enforcer.py` returns FAIL (rc=2), report the failing leg and stop — do not
   paper over a FAIL.

**Note:** if a `contract`/`negotiation`/`exec_status` figure is what the rebuild wants to
change, that mutation only unlocks via the control-plane sources above — do not let a
deterministic rebuild write a traded figure sourced from memory/anchor/canon.

---

## Batch 2 — Heavy / LLM feeds (~12 asks). Source-gated.

Only the feeds `freshness_enforcer.py` still names as stale/WARN after Batch 1. As of the last
map run this is a small set (fresh=37/38, one stale; intel_drift=WARN). Refresh each **through
its owning script/skill**, not by hand:

1. Re-read the freshness report; list the exact remaining stale/WARN feed(s) and their owning
   builder (e.g. `full-pipeline-refresh` skill for partner intel; `build_viewership_node.py` if
   the viewership node is due on its 35-day cadence).
2. For each remaining feed, run its owning builder. For partner-intel / negotiation / contract
   content, **honor the unlock rule**: read from Outlook / Traded Legal Documents / Negotiation
   Folder / `traded_position_check.py` only — `chain_anchor.json` / `econ_canon.json` /
   NotebookLM / memory are lead-only and must not drive a mutation.
3. Do **not** batch-refresh everything; touch only feeds actually flagged, to stay under the
   ask budget and avoid re-deriving fresh data.
4. `python Scripts\freshness_enforcer.py` — target `overall=PASS`.
5. **STOP. Report:** each feed refreshed, its source of truth, and the new freshness verdict.
   If any negotiation/contract figure could not be unlocked from an authoritative source, leave
   it unchanged and flag it — do not fabricate.

---

## Batch 3 — Chain verify + Command Center CURRENT (~8 asks).

1. `python Scripts\build_command_center.py` — final rebuild once all feeds are fresh.
2. `python Scripts\freshness_enforcer.py` — confirm `overall=PASS` (report it explicitly, per
   the map's "run it after any chain change; report overall=PASS").
3. Re-read `Cockpit\command-center-status.json`; confirm the header reads **CURRENT** (not
   `NOT CURRENT`) and the full-extraction date is today, not 2026-06-19.
4. If the control-plane close hook produces receipts (`control-plane/state/<session>/`), let it
   run; capture ask dispositions.
5. Optional mirror: if this refresh changed any *scaffold* file that this tracking repo mirrors
   (it normally does not — refresh only writes runtime feeds), commit + push it here per the
   promotion process (`PROMOTION-PROCESS.md`) — per-hunk approval, never a blind copy.
6. **STOP. Report:** final `overall=PASS`, Command Center = CURRENT, full-extraction date, and
   whether any figure was left flagged/unresolved.

---

## Weekly-Update tab / dashboard question

**Is it addressable in this repo? No.** The dashboard product
(`EVERPASS TOOLS\Dashboard\EverPass Media _ Content Pipeline Decision-Making Dashboard.html`)
and its `Weekly Update` tab live only in the OneDrive runtime tree; this repo tracks the
dashboard *rules* (`EVERPASS/.claude/rules/dashboard.md`, `Dashboard/CLAUDE.md`) and the JS
validator, not the HTML. So the tab cannot be fixed from here — it is a local, runtime edit.

If, on the live box, the dashboard's **Weekly Update** tab is actually broken (blank/stale — as
the captured screenshot suggests), treat it as a `DASHBOARD` job under the router, **not** a
weekly-deck task:

- The retired surface is the **Winston weekly exec deck** (`weekly.everpasspipeline.com`). The
  dashboard's in-page **Weekly Update** tab is a different thing and is part of the live
  dashboard product — clarify with Ryan which one he means before acting.
- Route via `anthropic-skills:pipeline-dashboard-update` (+ `dashboard-framing-updates` for
  narrative). **Manual edits win**; splice at the smallest unit; never regex the whole file.
- **JS validation gate is HARD:** after any edit touching `pipelineIntelligence`, run
  `node --check` on every `<script>` block (the PostToolUse validator wrapper does this
  automatically). Never restore from `.bak` without syntax-checking the backup first.
- Re-publish only via Netlify (site `4da21bd2-5a53-49dc-949d-65bfa36d7b87`,
  `dashboard.everpasspipeline.com`) after `freshness_enforcer.py` passes. No SharePoint links,
  no sends — Ryan publishes.
- **Do not** re-enable `weekly.everpasspipeline.com` or move the weekly deck back into the live
  chain unless Ryan explicitly asks (the map keeps it retired-but-reversible).

---

## What is NOT in scope (leave alone)

- StayTurn — anything, any path, any session.
- Sending email or publishing externally — drafts only; Ryan is sole sender/publisher.
- The retired weekly deck and the four dormant cockpit files.
- SI-0005 (the pending HIGH self-improvement item about storing the session lock in git) — it
  stays queued for Ryan's review; do not self-resolve it.
