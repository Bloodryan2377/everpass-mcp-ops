#!/usr/bin/env python3
"""Ingest market-intel insight notes into the EverPass user-facing chain.

This is the engine that ties an insight note (a human-readable market-intel
markdown file under ``data/insights/``) into the live mobile cockpit feed.
Running it propagates each note's declared **bridge signal** and optional
**partner todo** into ``data/mobile/mobile-cockpit.json`` and keeps the feed
manifest + the insights index in sync.

Design goals
------------
- **Idempotent.** Re-running with no new notes is a no-op: entries are keyed by
  a stable ``intel_key`` (signals) and todo ``id`` and upserted in place, never
  duplicated. Freshness timestamps are only bumped when content actually
  changes, so the chain's ``generated_at`` reflects the last *real* intel
  change rather than the last time the job ran.
- **Self-describing notes.** Each note declares exactly what to inject via a
  fenced ```epc-chain``` JSON block, so the engine never has to guess structure
  from prose. ``produced_at`` and the note ``web_link`` are filled from the
  note's YAML frontmatter / path.
- **Harness-neutral.** Plain Python + stdlib (+ PyYAML for frontmatter). The
  Claude-Code wrapper that runs it automatically lives separately
  (``scripts/sync-insights-to-chain.sh`` + ``.claude/settings.json`` hooks).

Usage
-----
    python ingest_market_intel.py --all            # scan data/insights/*.md
    python ingest_market_intel.py note1.md note2.md # ingest specific notes
    python ingest_market_intel.py --all --check     # dry-run; rc=1 if drift
    python ingest_market_intel.py --all --now ISO   # pin timestamp (tests)

Exit codes: 0 = clean (applied, or already in sync) · 1 = drift found under
``--check`` · 2 = setup/parse error.
"""
from __future__ import annotations

import argparse
import datetime as _dt
import json
import os
import re
import sys
from pathlib import Path

try:
    import yaml  # PyYAML — frontmatter only
except Exception as exc:  # pragma: no cover - environment guard
    print(f"ingest_market_intel: PyYAML required ({exc})", file=sys.stderr)
    sys.exit(2)

# --- Repo layout -----------------------------------------------------------
# Paths default to the repo layout but are overridable via env vars so the
# engine can run against an isolated fixture tree (used by the test suite).
REPO = Path(__file__).resolve().parents[1]


def _path(env: str, *default: str) -> Path:
    v = os.environ.get(env)
    return Path(v) if v else REPO.joinpath(*default)


INSIGHTS_DIR = _path("EPC_INSIGHTS_DIR", "data", "insights")
COCKPIT = _path("EPC_COCKPIT", "data", "mobile", "mobile-cockpit.json")
FEED_INDEX = _path("EPC_FEED_INDEX", "data", "mobile", "mobile-feed-index.json")
INSIGHTS_INDEX = INSIGHTS_DIR / "_index.md"

_CHAIN_BLOCK = re.compile(r"```epc-chain\s*\n(.*?)\n```", re.DOTALL)
_FRONTMATTER = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def _now_iso(override: str | None) -> str:
    if override:
        return override
    return _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, data: dict) -> None:
    # 2-space indent + trailing newline to match the existing feed files.
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


class NoteError(ValueError):
    pass


def parse_note(path: Path) -> dict:
    """Parse one insight note into a normalized chain payload.

    Returns a dict with keys: intel_key, signal (dict), todo (dict|None),
    produced_at, web_link, note_name.
    """
    text = path.read_text(encoding="utf-8")

    fm_match = _FRONTMATTER.match(text)
    fm = {}
    if fm_match:
        fm = yaml.safe_load(fm_match.group(1)) or {}

    block = _CHAIN_BLOCK.search(text)
    if not block:
        raise NoteError(f"{path.name}: no ```epc-chain``` block found")
    try:
        chain = json.loads(block.group(1))
    except json.JSONDecodeError as exc:
        raise NoteError(f"{path.name}: epc-chain block is not valid JSON ({exc})")

    intel_key = chain.get("intel_key")
    if not intel_key:
        raise NoteError(f"{path.name}: epc-chain block missing 'intel_key'")
    signal = chain.get("signal")
    if not isinstance(signal, dict) or not signal.get("title"):
        raise NoteError(f"{path.name}: epc-chain block missing signal.title")

    produced_at = chain.get("produced_at") or fm.get("produced_at")
    if hasattr(produced_at, "isoformat"):  # yaml may parse to datetime
        produced_at = produced_at.isoformat().replace("+00:00", "Z")
    if chain.get("web_link"):
        web_link = chain["web_link"]
    else:
        try:
            web_link = str(path.relative_to(REPO)).replace("\\", "/")
        except ValueError:  # note lives outside the repo (e.g. fixture tree)
            web_link = path.name

    expires_at = chain.get("expires_at")
    if hasattr(expires_at, "isoformat"):
        expires_at = expires_at.isoformat().replace("+00:00", "Z")
    status = str(chain.get("status") or fm.get("status") or "active").lower()

    return {
        "intel_key": str(intel_key),
        "signal": signal,
        "todo": chain.get("todo"),
        "critical": chain.get("critical"),
        "produced_at": produced_at,
        "web_link": web_link,
        "note_name": path.name,
        "status": status,
        "expires_at": expires_at,
    }


def build_signal(payload: dict) -> dict:
    """Construct the bridge_signals entry from a note payload."""
    s = payload["signal"]
    return {
        "intel_key": payload["intel_key"],
        "title": s["title"],
        "summary": s.get("summary", ""),
        "key_points": list(s.get("key_points", [])),
        "confidence": s.get("confidence", "medium"),
        "produced_at": payload["produced_at"] or "",
        "source": s.get("source", "market-intel"),
        "partner": s.get("partner", ""),
        "ryan_owes_response": bool(s.get("ryan_owes_response", False)),
        "web_link": payload["web_link"],
    }


def upsert_signal(cockpit: dict, new_sig: dict) -> bool:
    """Insert or update a bridge signal. Returns True if cockpit changed.

    Match priority: existing ``intel_key`` → exact ``title`` (adopts the key on
    a pre-existing manually-added entry). New signals are inserted in
    produced_at-descending order so the newest intel leads the cockpit.
    """
    signals = cockpit.setdefault("bridge_signals", [])
    key = new_sig["intel_key"]
    idx = None
    for i, s in enumerate(signals):
        # Primary match is intel_key. Title is only a fallback for adopting a
        # pre-existing *un-keyed* (legacy / manually-added) entry — never a
        # signal that already carries a different key, so two notes that happen
        # to share a title can't hijack each other.
        if s.get("intel_key") == key:
            idx = i
            break
        if not s.get("intel_key") and s.get("title") == new_sig["title"]:
            idx = i
            break
    if idx is not None:
        if signals[idx] == new_sig:
            return False
        signals[idx] = new_sig
        return True
    # Insert sorted by produced_at desc (string ISO sorts correctly).
    insert_at = len(signals)
    for i, s in enumerate(signals):
        if new_sig["produced_at"] > str(s.get("produced_at", "")):
            insert_at = i
            break
    signals.insert(insert_at, new_sig)
    return True


def upsert_todo(cockpit: dict, todo: dict) -> str:
    """Insert or update a partner todo by ``id``.

    Returns "new", "updated", or "unchanged". Note that ``items`` is a capped
    *preview* of the cockpit's partner-todo set, while ``total`` is the full
    system-wide count — so the caller increments ``total`` only on "new", never
    by resetting it to ``len(items)`` (which would clobber the real count).
    """
    block = cockpit.setdefault("partner_todos", {})
    items = block.setdefault("items", [])
    tid = todo.get("id")
    if not tid:
        raise NoteError("todo present but missing 'id'")
    normalized = {
        "id": tid,
        "partner": todo.get("partner", ""),
        "category": todo.get("category", "Other"),
        "text": todo.get("text", ""),
        "due": todo.get("due"),
        "priority_hint": todo.get("priority_hint", "normal"),
    }
    for i, t in enumerate(items):
        if t.get("id") == tid:
            if t == normalized:
                return "unchanged"
            items[i] = normalized
            return "updated"
    # New todo: surface it near the top of the preview with the other intel.
    items.insert(0, normalized)
    return "new"


def upsert_critical(cockpit: dict, crit: dict) -> str:
    """Insert or update a morning-brief critical item by ``title``.

    Returns "new", "updated", or "unchanged". Unlike partner_todos, the morning
    brief's ``critical_count`` equals ``len(critical)``, so the caller recomputes
    it directly. ``position`` ("top"|"bottom", default "bottom") controls where a
    new item lands — monitor-only market intel defaults to the bottom so it does
    not outrank genuine same-day deadlines.
    """
    mb = cockpit.get("morning_brief")
    if not isinstance(mb, dict):
        raise NoteError("critical declared but cockpit has no morning_brief")
    items = mb.setdefault("critical", [])
    title = crit.get("title")
    if not title:
        raise NoteError("critical present but missing 'title'")
    normalized = {"title": title, "body": crit.get("body", "")}
    for i, c in enumerate(items):
        if c.get("title") == title:
            if c == normalized:
                return "unchanged"
            items[i] = normalized
            return "updated"
    if crit.get("position") == "top":
        items.insert(0, normalized)
    else:
        items.append(normalized)
    return "new"


# --- Lifecycle: retire / expiry -------------------------------------------

def effective_state(payload: dict, now: str) -> str:
    """Resolve a note's lifecycle state: 'active', 'retired', or 'expired'.

    A note is retired when it declares ``status: retired``; expired when its
    ``expires_at`` is at or before ``now`` (ISO-Z strings compare lexically).
    Both retired and expired notes have their cockpit entries removed.
    """
    if payload.get("status") == "retired":
        return "retired"
    exp = payload.get("expires_at")
    if exp and str(now) >= str(exp):
        return "expired"
    return "active"


def remove_signal(cockpit: dict, intel_key: str) -> bool:
    signals = cockpit.get("bridge_signals", [])
    for i, s in enumerate(signals):
        if s.get("intel_key") == intel_key:
            del signals[i]
            return True
    return False


def remove_todo(cockpit: dict, tid: str) -> bool:
    """Remove a partner todo by id; decrement ``total`` if it was present."""
    block = cockpit.get("partner_todos", {})
    items = block.get("items", [])
    for i, t in enumerate(items):
        if t.get("id") == tid:
            del items[i]
            block["total"] = max(0, int(block.get("total", 0)) - 1)
            return True
    return False


def remove_critical(cockpit: dict, title: str) -> bool:
    items = cockpit.get("morning_brief", {}).get("critical", [])
    for i, c in enumerate(items):
        if c.get("title") == title:
            del items[i]
            return True
    return False


def rebuild_insights_index(notes: list[dict], now: str = "") -> str:
    lines = [
        "# insights · _index",
        "",
        "_Human-readable market-intel / insight notes captured into the EverPass chain._",
        "_Tier: **insight** · Path: `data/insights`_",
        "",
        "Each note is a structured market-intel artifact (schema `epc-market-intel/v1`)",
        "carrying a fenced ```epc-chain``` block. `scripts/ingest_market_intel.py` reads",
        "that block and upserts the note's signal (and any partner todo) into the live",
        "cockpit feed [`../mobile/mobile-cockpit.json`](../mobile/mobile-cockpit.json).",
        "",
        "## Notes",
    ]
    for n in sorted(notes, key=lambda x: x["note_name"], reverse=True):
        title = n["signal"]["title"].replace("[market-intel] ", "")
        state = effective_state(n, now) if now else n.get("status", "active")
        tag = "" if state == "active" else f" · **{state}**"
        lines.append(f"- [{n['note_name']}]({n['note_name']}) · {title}{tag}")
    return "\n".join(lines) + "\n"


def ingest(note_paths: list[Path], now: str, check: bool) -> int:
    payloads = [parse_note(p) for p in note_paths]
    if not payloads:
        print("ingest_market_intel: no insight notes found; nothing to do")
        return 0

    cockpit = _read_json(COCKPIT)
    feed_index = _read_json(FEED_INDEX)

    before = json.dumps(_chain_fingerprint(cockpit), sort_keys=True)

    new_todos = 0
    touched_critical = False
    retired = []  # (note_name, state) for active->removed transitions
    for p in payloads:
        state = effective_state(p, now)
        if state == "active":
            upsert_signal(cockpit, build_signal(p))
            if p.get("todo"):
                if upsert_todo(cockpit, p["todo"]) == "new":
                    new_todos += 1
            if p.get("critical"):
                upsert_critical(cockpit, p["critical"])
                touched_critical = True
        else:
            # Retired or expired: pull the note's entries back out of the chain.
            remove_signal(cockpit, p["intel_key"])
            if p.get("todo", {}).get("id"):
                remove_todo(cockpit, p["todo"]["id"])
            if p.get("critical", {}).get("title"):
                remove_critical(cockpit, p["critical"]["title"])
                touched_critical = True
            retired.append((p["note_name"], state))

    # ``total`` is the full system-wide count (items is only a capped preview),
    # so bump it by the number of genuinely new todos rather than resetting it.
    # (Removals decrement ``total`` inline in remove_todo.)
    if new_todos:
        block = cockpit.setdefault("partner_todos", {})
        block["total"] = int(block.get("total", 0)) + new_todos

    # ``critical_count`` mirrors the critical list length — recompute directly.
    if touched_critical:
        mb = cockpit.get("morning_brief", {})
        mb["critical_count"] = len(mb.get("critical", []))

    after = json.dumps(_chain_fingerprint(cockpit), sort_keys=True)
    changed = before != after

    # Insights index is regenerated deterministically from the notes present.
    new_index = rebuild_insights_index(payloads, now)
    index_changed = (not INSIGHTS_INDEX.exists()) or INSIGHTS_INDEX.read_text(encoding="utf-8") != new_index

    if not changed and not index_changed:
        print("ingest_market_intel: chain already in sync (no changes)")
        return 0

    if check:
        what = []
        if changed:
            what.append("cockpit signals/todos")
        if index_changed:
            what.append("insights index")
        print(f"ingest_market_intel: DRIFT — would update {', '.join(what)} (run without --check to apply)")
        return 1

    if changed:
        cockpit["generated_at"] = now
        if "partner_todos" in cockpit:
            cockpit["partner_todos"]["last_extracted_at"] = now
        fresh = cockpit.setdefault("freshness", {})
        fresh["cockpit_data_mtime"] = now
        fresh["bridge_cache_mtime"] = now
        _write_json(COCKPIT, cockpit)

        # Keep the feed manifest's cockpit entry honest about the refresh.
        feed_index["generated_at"] = now
        for feed in feed_index.get("feeds", []):
            if feed.get("name") == "mobile-cockpit.json":
                feed["generated_at"] = now
        _write_json(FEED_INDEX, feed_index)

    if index_changed:
        INSIGHTS_INDEX.write_text(new_index, encoding="utf-8")

    retired_note = ""
    if retired:
        retired_note = " · retired/expired: " + ", ".join(f"{n} ({s})" for n, s in retired)
    print(
        f"ingest_market_intel: applied {len(payloads)} note(s) → cockpit "
        f"({len(cockpit.get('bridge_signals', []))} signals, "
        f"{cockpit.get('partner_todos', {}).get('total', 0)} todos, "
        f"{cockpit.get('morning_brief', {}).get('critical_count', 0)} critical) @ {now}{retired_note}"
    )
    return 0


def _chain_fingerprint(cockpit: dict) -> dict:
    """The content we treat as meaningful for change detection (no timestamps)."""
    return {
        "bridge_signals": cockpit.get("bridge_signals", []),
        "partner_todos_items": cockpit.get("partner_todos", {}).get("items", []),
        "critical": cockpit.get("morning_brief", {}).get("critical", []),
    }


def discover_notes() -> list[Path]:
    if not INSIGHTS_DIR.exists():
        return []
    return sorted(p for p in INSIGHTS_DIR.glob("*.md") if p.name != "_index.md")


def list_registry(now: str) -> int:
    """Print every insight note with its lifecycle state and chain presence."""
    paths = discover_notes()
    if not paths:
        print("ingest_market_intel: no insight notes found")
        return 0
    cockpit = _read_json(COCKPIT) if COCKPIT.exists() else {}
    live_keys = {s.get("intel_key") for s in cockpit.get("bridge_signals", [])}
    print(f"{'STATE':<9} {'IN-CHAIN':<9} {'INTEL_KEY':<34} PRODUCED_AT")
    for p in paths:
        try:
            note = parse_note(p)
        except NoteError as exc:
            print(f"{'ERROR':<9} {'?':<9} {p.name}: {exc}")
            continue
        state = effective_state(note, now)
        in_chain = "yes" if note["intel_key"] in live_keys else "no"
        print(f"{state:<9} {in_chain:<9} {note['intel_key']:<34} {note.get('produced_at') or '-'}")
    return 0


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="Ingest market-intel insight notes into the EverPass chain.")
    ap.add_argument("notes", nargs="*", help="Specific note paths (default: --all)")
    ap.add_argument("--all", action="store_true", help="Scan data/insights/*.md")
    ap.add_argument("--check", action="store_true", help="Dry-run; exit 1 if the chain would change")
    ap.add_argument("--list", action="store_true", dest="list_", help="List notes with lifecycle state + chain presence; no writes")
    ap.add_argument("--now", default=None, help="Override timestamp (ISO 8601 Z); default = current UTC")
    args = ap.parse_args(argv)

    if args.list_:
        return list_registry(_now_iso(args.now))

    if args.notes:
        paths = [Path(n) if Path(n).is_absolute() else (REPO / n) for n in args.notes]
    elif args.all:
        paths = discover_notes()
    else:
        ap.error("pass note paths or --all")
        return 2

    for p in paths:
        if not p.exists():
            print(f"ingest_market_intel: note not found: {p}", file=sys.stderr)
            return 2

    try:
        return ingest(paths, now=_now_iso(args.now), check=args.check)
    except NoteError as exc:
        print(f"ingest_market_intel: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
