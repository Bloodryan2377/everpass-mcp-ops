# insights · _index

_Human-readable market-intel / insight notes captured into the EverPass chain._
_Tier: **insight** · Path: `data/insights`_

Each note is a structured market-intel artifact (schema `epc-market-intel/v1`)
carrying a fenced ```epc-chain``` block. `scripts/ingest_market_intel.py` reads
that block and upserts the note's signal (and any partner todo) into the live
cockpit feed [`../mobile/mobile-cockpit.json`](../mobile/mobile-cockpit.json).

## Notes
- [2026-06-30-market-intel-dish-dbs-chapter-11.md](2026-06-30-market-intel-dish-dbs-chapter-11.md) · Dish DBS (Dish Network / Sling TV parent) preparing Chapter 11
