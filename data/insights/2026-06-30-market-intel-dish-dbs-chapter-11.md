---
schema: epc-market-intel/v1
kind: market-intel
produced_at: 2026-06-30T14:00:00Z
partner: Dish
category: Distribution
confidence: high
source: Press (The Desk / Matthew Keys, 2026-06-29) — citing Wall Street Journal
ryan_owes_response: false
tags: [pay-tv, distribution, counterparty-risk, echostar, sling, boost-mobile]
---

# Market Intel — Dish DBS (Dish Network / Sling TV parent) preparing Chapter 11

## TL;DR
Dish DBS — the Echostar subsidiary that owns Dish Network, Sling TV, and Boost
Mobile — is preparing a **Chapter 11 bankruptcy filing that could be announced as
soon as this week** (reported 2026-06-29 by The Desk, citing the Wall Street
Journal). For EverPass this is a **counterparty-solvency flag on the open Dish
Business partnership exploration**, not a closed door: Boost Mobile and the pay-TV
distribution footprint persist through a restructuring, but commercial terms,
timeline, and decision authority on the Dish side are now uncertain.

## What happened (facts from the report)
- **Chapter 11 imminent.** WSJ reports the filing could come "as soon as this
  week." Several law firms have been retained to advise Dish DBS.
- **Debt / liquidity trigger.** Dish DBS earlier this month said it would **miss
  an on-time debt repayment due June 1**, citing FCC scrutiny of its network
  build-out.
- **Spectrum sales under duress.** Echostar sold wireless licenses to **AT&T and
  SpaceX** last year; the company later characterized the sales as made "under
  duress." (FCC Chairman Brendan Carr has been a vocal SpaceX supporter.)
- **Subscriber erosion.** Dish DBS lost **366,000 pay-TV customers in Q1 2026**
  (vs. 381,000 a year earlier); ~**6.6M pay-TV subscribers** remain — ahead of
  Hulu + Live TV and Fubo (non-consolidated), behind Charter, Comcast, DIRECTV,
  and YouTube TV.
- **Prior rescue failed.** The 2024 Dish–DIRECTV merger was called off within two
  months after Dish could not secure creditor agreement to restructure debt.
- **Scope of Dish DBS.** Pay TV (Dish Network, Sling TV) **plus Boost Mobile**
  wireless, all under Echostar Corporation.

## EverPass implications
1. **Open exploration is now a distressed-counterparty exploration.** The cockpit
   already carries the intel item *"Day-1 Dish Partnership Exploration Held —
   Charter-Parallel Model Receptive"* (attendees Andy, Kate [Dish]; Ryan Blood,
   Alex Kaplan [EP]; Sling Orange commercialization path closed by Dish). A
   Chapter 11 filing changes the risk profile of any packaging/commercial deal:
   contracts entered pre-petition can be assumed or rejected by the debtor, and
   any deal economics are subject to the restructuring.
2. **Don't anchor on Sling for commercial distribution.** Sling Orange
   commercialization was already closed by Dish; bankruptcy reinforces that
   EverPass should not build a commercial-venue distribution plan around Sling.
3. **Boost Mobile is the durable asset.** If there is a forward path with the
   Dish org, it is more likely to run through the parts of the business that
   survive restructuring intact (wireless / Boost) than the pay-TV unit in
   distress.
4. **Competitive read-through.** Continued pay-TV consolidation/distress (Dish
   after the failed DIRECTV merger) strengthens the case for EverPass's
   distributor-agnostic commercial model and for prioritizing the solvent
   distribution partners already in flight (Charter, Comcast, DIRECTV — note
   DIRECTV's own open C&D — YouTube TV, Samsung/LG CTV).

## Recommended posture
- **Hold, do not advance, the Dish Business exploration** until the filing posts
  and the debtor's intentions on the commercial/packaging track are visible.
- **No EverPass commercial commitment or term exchange** with Dish that would
  create a pre-petition claim or obligation in the interim.
- **Re-confirm the Dish-side decision owners** post-filing (Andy / Kate authority
  may change under restructuring governance).
- Treat as **monitor-only market intel**; revisit when (a) the petition is filed
  and (b) a first-day motions / contract-assumption picture emerges.

## As of
2026-06-30. Source dated 2026-06-29 (pre-filing reporting). No EverPass action
owed; this note exists to flag counterparty risk on the existing Dish thread.

## Sources
- The Desk — "Dish Network, Sling TV parent company prepares bankruptcy filing,"
  Matthew Keys, 2026-06-29 (citing The Wall Street Journal).
- EverPass cockpit intel: `intel:dish:day-1-dish-partnership-exploration-held-charter-parallel-mod`.

<!--
Machine block: read by scripts/ingest_market_intel.py to propagate this note
into the live cockpit chain (data/mobile/mobile-cockpit.json). Keyed by
intel_key + todo id so re-ingestion is idempotent. Edit this block to change
how the note surfaces on the cockpit; produced_at/web_link are taken from the
frontmatter / file path.
-->
```epc-chain
{
  "intel_key": "dish-dbs-chapter-11",
  "produced_at": "2026-06-30T14:00:00Z",
  "signal": {
    "title": "[market-intel] Dish DBS (Dish Network / Sling TV parent) preparing Chapter 11",
    "summary": "WSJ (via The Desk, 6/29): Dish DBS — Echostar's pay-TV + Boost Mobile subsidiary — is preparing a Chapter 11 filing as soon as this week after missing a June 1 debt repayment amid FCC build-out scrutiny. Counterparty flag on the open Dish Business partnership exploration: hold, do not advance, until the petition posts and the debtor's commercial/packaging intentions are visible.",
    "key_points": [
      "Chapter 11 imminent; law firms retained",
      "Missed June 1 debt repayment",
      "Q1 lost 366k pay-TV subs; ~6.6M remain",
      "Counterparty risk on Dish exploration",
      "Sling Orange commercial path already closed by Dish"
    ],
    "confidence": "high",
    "source": "market-intel",
    "partner": "Dish",
    "ryan_owes_response": false
  },
  "todo": {
    "id": "intel:dish:dbs-preparing-chapter-11-counterparty-risk-on-exploration",
    "partner": "Dish",
    "category": "Distribution",
    "text": "COUNTERPARTY RISK — Dish DBS preparing Chapter 11 (WSJ via The Desk 6/29; filing as soon as this week after missed June 1 debt repayment). Hold, do not advance, the Dish Business partnership exploration until the petition posts and the debtor's commercial/packaging intentions and decision owners are clear. No pre-petition commitments or term exchange. Monitor-only. See data/insights/2026-06-30-market-intel-dish-dbs-chapter-11.md.",
    "due": null,
    "priority_hint": "high"
  },
  "critical": {
    "title": "DISH DBS — CHAPTER 11 WATCH (market intel · monitor-only)",
    "body": "WSJ via The Desk (6/29): Dish DBS — parent of Dish Network, Sling TV, and Boost Mobile — preparing a Chapter 11 filing as soon as this week after a missed June 1 debt repayment. Counterparty flag on the open Dish Business partnership exploration: hold / do not advance; no pre-petition commitments. No same-day action owed — monitor for the petition + first-day motions.",
    "position": "bottom"
  }
}
```
