#!/usr/bin/env python3
"""Regression tests for the insights → chain ingestion engine.

Runs ``scripts/ingest_market_intel.py`` as a subprocess against an isolated
fixture tree (via the EPC_* path env vars), so the real ``data/`` feeds are
never touched. Pure stdlib ``unittest`` — no pytest dependency.

    python -m unittest tests.test_insights_pipeline -v
    python tests/test_insights_pipeline.py

Locks the engine's load-bearing invariants: insert, idempotency, --check exit
codes, partner_todos.total NOT reset to the capped-preview length, critical_count
recompute, newest-first signal ordering, and the retire / expiry lifecycle.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ENGINE = REPO / "scripts" / "ingest_market_intel.py"
NOW = "2026-06-30T12:00:00Z"


def _base_cockpit() -> dict:
    # total=100 but only one preview item — exercises the "don't reset total to
    # len(items)" invariant hard.
    return {
        "schema": "epc-mobile-cockpit/v1",
        "generated_at": "2026-01-01T00:00:00Z",
        "morning_brief": {
            "available": True,
            "date": "2026-01-01",
            "critical_count": 2,
            "critical": [
                {"title": "EXISTING DEADLINE A", "body": ""},
                {"title": "EXISTING DEADLINE B", "body": ""},
            ],
        },
        "partner_todos": {
            "total": 100,
            "items": [
                {"id": "existing:1", "partner": "X", "category": "Y", "text": "t",
                 "due": None, "priority_hint": "high"},
            ],
            "last_extracted_at": "2026-01-01T00:00:00Z",
        },
        "bridge_signals": [
            {"intel_key": "old", "title": "old signal", "produced_at": "2026-01-01T00:00:00Z"},
        ],
        "freshness": {
            "cockpit_data_mtime": "2026-01-01T00:00:00Z",
            "bridge_cache_mtime": "2026-01-01T00:00:00Z",
            "meetings_today_mtime": "2026-01-01T00:00:00Z",
        },
    }


def _base_feed_index() -> dict:
    return {
        "schema": "epc-mobile-feed-index/v1",
        "generated_at": "2026-01-01T00:00:00Z",
        "feeds": [
            {"name": "mobile-cockpit.json", "url": "./mobile-cockpit.json",
             "schema": "epc-mobile-cockpit/v1", "generated_at": "2026-01-01T00:00:00Z"},
        ],
    }


def _note(chain: dict, title_short="Test item", tldr="tldr") -> str:
    return (
        "---\n"
        "schema: epc-market-intel/v1\n"
        "kind: market-intel\n"
        f"produced_at: {chain.get('produced_at', NOW)}\n"
        "partner: TestCo\n"
        "---\n\n"
        f"# Market Intel — {title_short}\n\n## TL;DR\n{tldr}\n\n"
        "```epc-chain\n" + json.dumps(chain, indent=2) + "\n```\n"
    )


class PipelineTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="epc-test-"))
        self.cockpit = self.tmp / "mobile-cockpit.json"
        self.feed = self.tmp / "mobile-feed-index.json"
        self.insights = self.tmp / "insights"
        self.insights.mkdir()
        self.cockpit.write_text(json.dumps(_base_cockpit()), encoding="utf-8")
        self.feed.write_text(json.dumps(_base_feed_index()), encoding="utf-8")

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    # -- helpers ----------------------------------------------------------
    def run_engine(self, *args):
        env = {
            **os.environ,
            "EPC_COCKPIT": str(self.cockpit),
            "EPC_FEED_INDEX": str(self.feed),
            "EPC_INSIGHTS_DIR": str(self.insights),
        }
        return subprocess.run(
            [sys.executable, str(ENGINE), "--all", "--now", NOW, *args],
            env=env, capture_output=True, text=True,
        )

    def write_note(self, name, chain, **kw):
        (self.insights / name).write_text(_note(chain, **kw), encoding="utf-8")

    def read_cockpit(self):
        return json.loads(self.cockpit.read_text(encoding="utf-8"))

    def signal_keys(self):
        return [s.get("intel_key") for s in self.read_cockpit()["bridge_signals"]]

    def todo_ids(self):
        return [t["id"] for t in self.read_cockpit()["partner_todos"]["items"]]

    def critical_titles(self):
        return [c["title"] for c in self.read_cockpit()["morning_brief"]["critical"]]

    def full_chain(self, key="t1", produced="2026-06-30T10:00:00Z", **extra):
        c = {
            "intel_key": key,
            "produced_at": produced,
            "signal": {"title": f"[market-intel] {key}", "summary": "s", "key_points": ["a"]},
            "todo": {"id": f"intel:testco:{key}", "partner": "TestCo",
                     "category": "Y", "text": "todo", "due": None, "priority_hint": "high"},
            "critical": {"title": f"{key.upper()} CRITICAL", "body": "b", "position": "bottom"},
        }
        c.update(extra)
        return c

    # -- tests ------------------------------------------------------------
    def test_insert_signal_todo_critical(self):
        self.write_note("a.md", self.full_chain("t1"))
        r = self.run_engine()
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("t1", self.signal_keys())
        self.assertIn("intel:testco:t1", self.todo_ids())
        self.assertIn("T1 CRITICAL", self.critical_titles())

    def test_total_not_reset_to_preview_length(self):
        self.write_note("a.md", self.full_chain("t1"))
        self.run_engine()
        ck = self.read_cockpit()
        # base total 100 + one new todo = 101 (NOT len(items)=2)
        self.assertEqual(ck["partner_todos"]["total"], 101)

    def test_critical_count_recomputed(self):
        self.write_note("a.md", self.full_chain("t1"))
        self.run_engine()
        ck = self.read_cockpit()
        self.assertEqual(ck["morning_brief"]["critical_count"], 3)
        self.assertEqual(ck["morning_brief"]["critical_count"], len(ck["morning_brief"]["critical"]))

    def test_idempotent(self):
        self.write_note("a.md", self.full_chain("t1"))
        self.run_engine()
        after_first = self.cockpit.read_text(encoding="utf-8")
        r2 = self.run_engine()
        self.assertIn("already in sync", r2.stdout)
        self.assertEqual(after_first, self.cockpit.read_text(encoding="utf-8"))

    def test_check_exit_codes(self):
        self.write_note("a.md", self.full_chain("t1"))
        drift = self.run_engine("--check")
        self.assertEqual(drift.returncode, 1)  # would change
        self.run_engine()  # apply
        clean = self.run_engine("--check")
        self.assertEqual(clean.returncode, 0)  # in sync

    def test_newest_signal_leads(self):
        self.write_note("old.md", self.full_chain("told", produced="2026-06-10T00:00:00Z"))
        self.write_note("new.md", self.full_chain("tnew", produced="2026-06-29T00:00:00Z"))
        self.run_engine()
        keys = self.signal_keys()
        self.assertLess(keys.index("tnew"), keys.index("told"))  # newest first
        self.assertLess(keys.index("told"), keys.index("old"))   # both above the seed

    def test_retire_removes_and_decrements_total(self):
        self.write_note("a.md", self.full_chain("t1"))
        self.run_engine()
        self.assertEqual(self.read_cockpit()["partner_todos"]["total"], 101)
        # Flip to retired and re-run.
        self.write_note("a.md", self.full_chain("t1", status="retired"))
        self.run_engine()
        ck = self.read_cockpit()
        self.assertNotIn("t1", self.signal_keys())
        self.assertNotIn("intel:testco:t1", self.todo_ids())
        self.assertNotIn("T1 CRITICAL", self.critical_titles())
        self.assertEqual(ck["partner_todos"]["total"], 100)  # decremented back
        self.assertEqual(ck["morning_brief"]["critical_count"], 2)

    def test_expiry_removes_when_now_past(self):
        self.write_note("a.md", self.full_chain("t1", expires_at="2026-07-15T00:00:00Z"))
        self.run_engine()  # NOW=6/30 < expiry -> active
        self.assertIn("t1", self.signal_keys())
        # Re-run with a clock past the expiry.
        env = {**os.environ, "EPC_COCKPIT": str(self.cockpit),
               "EPC_FEED_INDEX": str(self.feed), "EPC_INSIGHTS_DIR": str(self.insights)}
        subprocess.run([sys.executable, str(ENGINE), "--all", "--now", "2026-08-01T00:00:00Z"],
                       env=env, capture_output=True, text=True)
        self.assertNotIn("t1", self.signal_keys())
        self.assertEqual(self.read_cockpit()["partner_todos"]["total"], 100)

    def test_list_mode_runs(self):
        self.write_note("a.md", self.full_chain("t1"))
        r = self.run_engine("--list")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("t1", r.stdout)

    def test_same_title_different_keys_coexist(self):
        ch1 = self.full_chain("k1")
        ch1["signal"]["title"] = "[market-intel] Shared Headline"
        ch2 = self.full_chain("k2")
        ch2["signal"]["title"] = "[market-intel] Shared Headline"
        self.write_note("a.md", ch1)
        self.write_note("b.md", ch2)
        self.run_engine()
        keys = self.signal_keys()
        self.assertIn("k1", keys)  # neither hijacks the other despite same title
        self.assertIn("k2", keys)

    def test_validate_passes_clean(self):
        self.write_note("a.md", self.full_chain("t1"))
        self.write_note("b.md", self.full_chain("t2"))
        r = self.run_engine("--validate")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("validate OK", r.stdout)

    def test_validate_catches_duplicate_intel_key(self):
        # Two notes, same intel_key but different filenames.
        self.write_note("a.md", self.full_chain("dup"))
        ch = self.full_chain("dup")
        ch["todo"]["id"] = "intel:testco:other"  # avoid masking with a todo dup
        ch["critical"]["title"] = "OTHER CRITICAL"
        self.write_note("b.md", ch)
        r = self.run_engine("--validate")
        self.assertEqual(r.returncode, 2)
        self.assertIn("duplicate intel_key", r.stderr)

    def test_ignore_expiry_keeps_item_active(self):
        # Past expiry, but --ignore-expiry must treat it as active (CI determinism).
        self.write_note("a.md", self.full_chain("t1", expires_at="2026-01-01T00:00:00Z"))
        self.run_engine("--ignore-expiry")
        self.assertIn("t1", self.signal_keys())
        # And a --check --ignore-expiry on the now-synced chain is clean.
        clean = self.run_engine("--check", "--ignore-expiry")
        self.assertEqual(clean.returncode, 0, clean.stdout)

    def test_list_flags_soon_expiry(self):
        self.write_note("a.md", self.full_chain("t1", expires_at="2026-07-05T00:00:00Z"))
        r = self.run_engine("--list")  # NOW=6/30 → 5 days out → "soon"
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("soon", r.stdout)

    def test_adopts_legacy_unkeyed_signal_by_title(self):
        # Seed an un-keyed (legacy / hand-added) signal sharing the note's title.
        ck = _base_cockpit()
        ck["bridge_signals"].insert(0, {"title": "[market-intel] t1", "summary": "legacy"})
        self.cockpit.write_text(json.dumps(ck), encoding="utf-8")
        self.write_note("a.md", self.full_chain("t1"))
        self.run_engine()
        titles = [s.get("title") for s in self.read_cockpit()["bridge_signals"]]
        self.assertEqual(titles.count("[market-intel] t1"), 1)  # adopted in place, no dup
        self.assertIn("t1", self.signal_keys())


if __name__ == "__main__":
    unittest.main()
