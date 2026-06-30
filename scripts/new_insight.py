#!/usr/bin/env python3
"""Scaffold a market-intel insight note from a small JSON spec.

Removes the last manual step in the insights → chain pipeline: instead of
hand-writing a note's frontmatter + body + ``epc-chain`` block, you provide a
compact JSON spec (the synthesized facts/implications + the cockpit signal) and
this renders a complete, correctly-structured note under ``data/insights/`` —
then (by default) runs ``ingest_market_intel.py`` so it lands in the cockpit.

Typical use (the synthesis — TL;DR, facts, implications — is done by whoever
reads the article; this just enforces structure and wiring):

    python scripts/new_insight.py --from-json spec.json
    cat spec.json | python scripts/new_insight.py --from-json -      # stdin
    python scripts/new_insight.py --from-json spec.json --no-sync     # write only

Spec shape (only ``slug``, ``partner``, ``title_short``, ``tldr`` required)::

    {
      "slug": "fox-fubo-merger",
      "produced_at": "2026-06-30T17:00:00Z",   # default: now (UTC)
      "partner": "Fox",
      "category": "Broadcast",                  # default: Other
      "confidence": "high",                     # default: medium
      "source": "WSJ — ...",
      "title_short": "Fox to acquire Fubo",
      "tldr": "One-paragraph EverPass-framed summary.",
      "facts": ["...", "..."],
      "implications": ["...", "..."],
      "posture": ["...", "..."],
      "sources": ["...", "..."],
      "signal": { "summary": "...", "key_points": ["..."] },   # required-ish
      "todo":     { "category": "...", "text": "...",          # optional
                    "priority_hint": "high", "due": null },
      "critical": { "body": "...", "position": "bottom",        # optional
                    "title": "..." }                            # title auto-derived if omitted
    }

Derived automatically: filename ``<date>-market-intel-<slug>.md``;
``intel_key = slug``; ``signal.title = "[market-intel] <title_short>"``;
``todo.id = intel:<partner-slug>:<slug>``; critical title from partner +
title_short when not supplied. Exit: 0 ok · 2 bad spec / refusing to overwrite.
"""
from __future__ import annotations

import argparse
import datetime as _dt
import json
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
INSIGHTS_DIR = REPO / "data" / "insights"
ENGINE = Path(__file__).resolve().parent / "ingest_market_intel.py"


def _slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", str(s).lower()).strip("-") or "unknown"


def _now_iso() -> str:
    return _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _bullets(items) -> str:
    return "\n".join(f"- {x}" for x in (items or [])) or "- (none)"


def _numbered(items) -> str:
    return "\n".join(f"{i}. {x}" for i, x in enumerate(items or [], 1)) or "(none)"


def render_note(spec: dict) -> tuple[str, str]:
    """Return (filename, markdown). Raises ValueError on missing required fields."""
    for req in ("slug", "partner", "title_short", "tldr"):
        if not spec.get(req):
            raise ValueError(f"spec missing required field: {req}")

    slug = _slugify(spec["slug"])
    produced_at = spec.get("produced_at") or _now_iso()
    date = produced_at[:10]
    partner = spec["partner"]
    category = spec.get("category", "Other")
    confidence = spec.get("confidence", "medium")
    source = spec.get("source", "")
    title_short = spec["title_short"]
    filename = f"{date}-market-intel-{slug}.md"

    sig = dict(spec.get("signal") or {})
    signal = {
        "title": f"[market-intel] {title_short}",
        "summary": sig.get("summary", spec["tldr"]),
        "key_points": list(sig.get("key_points", [])),
        "confidence": confidence,
        "source": "market-intel",
        "partner": partner,
        "ryan_owes_response": bool(sig.get("ryan_owes_response", False)),
    }
    chain = {"intel_key": slug, "produced_at": produced_at, "signal": signal}

    if spec.get("todo"):
        t = spec["todo"]
        chain["todo"] = {
            "id": t.get("id") or f"intel:{_slugify(partner)}:{slug}",
            "partner": partner,
            "category": t.get("category", category),
            "text": t.get("text", ""),
            "due": t.get("due"),
            "priority_hint": t.get("priority_hint", "normal"),
        }
    if spec.get("critical"):
        c = spec["critical"]
        chain["critical"] = {
            "title": c.get("title") or f"{partner.upper()} — {title_short} (market intel · monitor-only)",
            "body": c.get("body", ""),
            "position": c.get("position", "bottom"),
        }

    fm = {
        "schema": "epc-market-intel/v1",
        "kind": "market-intel",
        "produced_at": produced_at,
        "partner": partner,
        "category": category,
        "confidence": confidence,
        "source": source,
        "ryan_owes_response": False,
    }
    fm_lines = "\n".join(f"{k}: {json.dumps(v) if isinstance(v, str) and ':' in v else v}" for k, v in fm.items())

    chain_json = json.dumps(chain, indent=2, ensure_ascii=False)
    md = f"""---
{fm_lines}
---

# Market Intel — {title_short}

## TL;DR
{spec['tldr']}

## What happened (facts)
{_bullets(spec.get('facts'))}

## EverPass implications
{_numbered(spec.get('implications'))}

## Recommended posture
{_bullets(spec.get('posture'))}

## As of
{date}. {('Source: ' + source) if source else ''} Monitor/strategic intel.

## Sources
{_bullets(spec.get('sources'))}

<!--
Machine block: read by scripts/ingest_market_intel.py to propagate this note
into the live cockpit chain. Keyed by intel_key (+ todo id + critical title) so
re-ingestion is idempotent.
-->
```epc-chain
{chain_json}
```
"""
    return filename, md


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="Scaffold a market-intel insight note from a JSON spec.")
    ap.add_argument("--from-json", required=True, help="Path to a JSON spec, or '-' for stdin")
    ap.add_argument("--no-sync", action="store_true", help="Write the note but do not run the ingest")
    ap.add_argument("--force", action="store_true", help="Overwrite an existing note with the same name")
    args = ap.parse_args(argv)

    try:
        raw = sys.stdin.read() if args.from_json == "-" else Path(args.from_json).read_text(encoding="utf-8")
        spec = json.loads(raw)
    except (OSError, json.JSONDecodeError) as exc:
        print(f"new_insight: could not read spec ({exc})", file=sys.stderr)
        return 2

    try:
        filename, md = render_note(spec)
    except ValueError as exc:
        print(f"new_insight: {exc}", file=sys.stderr)
        return 2

    INSIGHTS_DIR.mkdir(parents=True, exist_ok=True)
    out = INSIGHTS_DIR / filename
    if out.exists() and not args.force:
        print(f"new_insight: {out.relative_to(REPO)} already exists (use --force to overwrite)", file=sys.stderr)
        return 2
    out.write_text(md, encoding="utf-8")
    print(f"new_insight: wrote {out.relative_to(REPO)}")

    if args.no_sync:
        print("new_insight: --no-sync; run scripts/sync-insights-to-chain.sh to ingest")
        return 0

    # A script-written file does not trigger the PostToolUse hook (that fires on
    # the Claude Edit/Write tools), so run the ingest directly here.
    py = sys.executable or "python3"
    rc = subprocess.call([py, str(ENGINE), str(out)])
    return 0 if rc == 0 else 0  # ingest drift/errors must not fail note creation


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
