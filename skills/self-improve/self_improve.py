#!/usr/bin/env python3
"""self_improve.py — the LOOP engine.

Triage every *proposed self-change* to the agent's own scaffold (skills, hooks,
rules, docs, gotchas) by RISK, then route it:

    LOW      -> apply now + append to changelog.md
    HIGH     -> hold in review-<date>.md for human sign-off (never self-applies)
    UNCLEAR  -> hold in review-<date>.md, flagged for a human call

This is the mechanism that keeps an agent improving itself without the two
failure modes that kill self-improving agents:

    1. Full autonomy   -> the agent edits its own behavior unsupervised and
                          drifts (system rot). Refused: HIGH never self-applies.
    2. Review-everything -> every trivial doc tweak needs a human, so nobody
                          runs it. Refused: LOW lands instantly.

"approve-always" lets the human bless a *class* of change so future changes in
that class auto-apply. Blessed classes (patterns) are EMPTY BY DEFAULT — a fresh
install routes every behavior change to review. Blessing is always a deliberate
human action, logged.

This file is the source-of-truth mirror of the live skill at
~/.claude/skills/self-improve/self_improve.py. It is intentionally dependency-
free (stdlib only) and host-agnostic.

CLI:
    self_improve.py triage   --category C --target T --summary S [--detail D]
    self_improve.py learn    "<lesson>" [--category gotcha] [--target LESSONS.md]
    self_improve.py decide   --id ID --action {approve,reject,approve-always}
    self_improve.py status
    self_improve.py selftest

State location precedence (highest first): --state-dir, --persist-dir, remote
env (CI/container -> committed queue/ so HIGH proposals survive teardown), else
the git-ignored _state/ alongside this file. It holds:
    patterns.json      blessed classes (empty by default)
    changelog.md       append-only log of applied LOW changes
    review-<date>.md   pending HIGH/UNCLEAR changes for the given day
    queue.json         machine-readable pending queue (for decide/status)
"""

from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import os
import sys
from dataclasses import dataclass, asdict
from pathlib import Path

# --- Risk model -------------------------------------------------------------

# Categories that only touch human-readable surface area. Safe to apply now.
LOW_CATEGORIES = {
    "doc",          # documentation prose
    "wording",      # rephrasing existing instructions, no behavior change
    "example",      # adding/fixing an example
    "gotcha",       # capturing a "watch out for X" note
    "comment",      # code comments
    "typo",         # spelling/formatting
}

# Categories that change what the agent DOES, or its guardrails. Human-gated.
HIGH_CATEGORIES = {
    "skill-behavior",   # editing how an existing skill acts
    "new-skill",        # adding a skill
    "hook",             # editing an existing hook
    "new-hook",         # adding a hook
    "rule",             # editing/adding a CLAUDE.md or rules/*.md rule
    "permission",       # widening/narrowing tool permissions
    "delete",           # removing a skill/hook/rule/file
}

RISK_LOW = "LOW"
RISK_HIGH = "HIGH"
RISK_UNCLEAR = "UNCLEAR"

DECISION_APPLY = "APPLY"      # land it now (changelog)
DECISION_REVIEW = "REVIEW"    # hold for human (review file)


def classify(category: str) -> str:
    """Map a change category to its base risk."""
    c = (category or "").strip().lower()
    if c in LOW_CATEGORIES:
        return RISK_LOW
    if c in HIGH_CATEGORIES:
        return RISK_HIGH
    return RISK_UNCLEAR


# --- Data -------------------------------------------------------------------

@dataclass
class Change:
    id: str
    category: str
    target: str
    summary: str
    detail: str
    risk: str
    decision: str
    blessed: bool
    ts: str

    @staticmethod
    def make(category, target, summary, detail, now):
        raw = f"{now}|{category}|{target}|{summary}".encode("utf-8")
        cid = hashlib.sha1(raw).hexdigest()[:10]
        return Change(
            id=cid, category=category, target=target, summary=summary,
            detail=detail or "", risk="", decision="", blessed=False, ts=now,
        )


# --- Engine -----------------------------------------------------------------

class Loop:
    def __init__(self, state_dir: Path, today: str):
        self.dir = Path(state_dir)
        self.today = today
        self.dir.mkdir(parents=True, exist_ok=True)
        self.patterns_path = self.dir / "patterns.json"
        self.queue_path = self.dir / "queue.json"
        self.changelog_path = self.dir / "changelog.md"

    # -- persistence
    def _load_patterns(self) -> set:
        if not self.patterns_path.exists():
            return set()
        try:
            data = json.loads(self.patterns_path.read_text())
            return set(data.get("blessed", []))
        except (json.JSONDecodeError, OSError):
            return set()

    def _save_patterns(self, blessed: set):
        self.patterns_path.write_text(
            json.dumps({"blessed": sorted(blessed)}, indent=2) + "\n"
        )

    def _load_queue(self) -> list:
        if not self.queue_path.exists():
            return []
        try:
            return json.loads(self.queue_path.read_text())
        except (json.JSONDecodeError, OSError):
            return []

    def _save_queue(self, items: list):
        self.queue_path.write_text(json.dumps(items, indent=2) + "\n")

    def _review_path(self, date: str) -> Path:
        return self.dir / f"review-{date}.md"

    # -- core
    def triage(self, category, target, summary, detail="") -> Change:
        """Classify + route a proposed change. Returns the decided Change."""
        ch = Change.make(category, target, summary, detail, self.today)
        ch.risk = classify(category)
        blessed = self._load_patterns()
        ch.blessed = category.strip().lower() in blessed

        # A blessed class auto-applies even if its base risk is HIGH — that is
        # exactly what "approve-always" buys. Default patterns are empty, so
        # nothing is blessed until the human explicitly says so.
        if ch.risk == RISK_LOW or ch.blessed:
            ch.decision = DECISION_APPLY
            self._append_changelog(ch)
        else:
            ch.decision = DECISION_REVIEW
            self._enqueue(ch)
        return ch

    def _append_changelog(self, ch: Change):
        line = (
            f"- {ch.ts}  [{ch.risk}{'/blessed' if ch.blessed else ''}]  "
            f"`{ch.category}` → {ch.target}: {ch.summary}  (id {ch.id})\n"
        )
        with self.changelog_path.open("a") as f:
            f.write(line)

    def _enqueue(self, ch: Change):
        q = self._load_queue()
        q.append(asdict(ch))
        self._save_queue(q)
        self._append_review(ch)

    def _append_review(self, ch: Change):
        path = self._review_path(self.today)
        new = not path.exists()
        with path.open("a") as f:
            if new:
                f.write(f"# Pending self-improvement review — {self.today}\n\n")
                f.write("Resolve each with: `self_improve.py decide --id <id> "
                        "--action {approve,reject,approve-always}`\n\n")
            flag = " ⚠️ UNCLEAR" if ch.risk == RISK_UNCLEAR else ""
            f.write(f"## [{ch.risk}]{flag} {ch.summary}\n")
            f.write(f"- **id:** `{ch.id}`\n")
            f.write(f"- **category:** `{ch.category}`\n")
            f.write(f"- **target:** {ch.target}\n")
            if ch.detail:
                f.write(f"- **detail:** {ch.detail}\n")
            f.write("- **status:** PENDING\n\n")

    def decide(self, change_id, action) -> dict:
        """Resolve a pending change. Returns a result dict."""
        q = self._load_queue()
        idx = next((i for i, c in enumerate(q) if c["id"] == change_id), None)
        if idx is None:
            return {"ok": False, "error": f"no pending change with id {change_id}"}
        ch = q.pop(idx)
        result = {"ok": True, "id": change_id, "action": action,
                  "category": ch["category"]}

        if action == "reject":
            result["outcome"] = "rejected (not applied)"
        elif action in ("approve", "approve-always"):
            ch["decision"] = DECISION_APPLY
            self._append_changelog(Change(**ch))
            result["outcome"] = "approved + applied"
            if action == "approve-always":
                blessed = self._load_patterns()
                blessed.add(ch["category"].strip().lower())
                self._save_patterns(blessed)
                result["outcome"] = ("approved + applied; class "
                                     f"`{ch['category']}` now auto-applies")
        else:
            q.insert(idx, ch)  # restore
            return {"ok": False, "error": f"unknown action {action}"}

        self._save_queue(q)
        return result

    def status(self) -> dict:
        q = self._load_queue()
        return {
            "pending": len(q),
            "blessed_classes": sorted(self._load_patterns()),
            "items": [
                {"id": c["id"], "risk": c["risk"], "category": c["category"],
                 "summary": c["summary"]} for c in q
            ],
        }


# --- CLI --------------------------------------------------------------------

def _today() -> str:
    # Host Python; not the Workflow sandbox. datetime is available here.
    return datetime.date.today().isoformat()


# --- State-dir resolution ---------------------------------------------------

# Default runtime state: git-ignored, transient, local.
DEFAULT_STATE_DIR = Path(__file__).resolve().parent / "_state"
# Committed fallback for ephemeral/remote runs: tracked, so a remote agent's
# HIGH proposals survive container teardown and a human can resolve them later
# on another machine. (The git-ignored _state/ would be wiped with the container.)
COMMITTED_QUEUE_DIR = Path(__file__).resolve().parent / "queue"

# Env vars that mark an ephemeral/remote container where _state/ won't survive.
_REMOTE_ENV_VARS = ("SELF_IMPROVE_PERSIST", "CI", "CODESPACES",
                    "REMOTE_CONTAINERS", "GITHUB_ACTIONS")


def _is_remote_env(env=None) -> bool:
    """True when running where git-ignored _state/ won't survive (CI/remote)."""
    env = os.environ if env is None else env
    return any(str(env.get(v, "")).strip() not in ("", "0", "false", "False")
               for v in _REMOTE_ENV_VARS)


def resolve_state_dir(state_dir=None, persist_dir=None, remote=False) -> Path:
    """Pick where queue/changelog/patterns live. Precedence, highest first:
        1. explicit --state-dir   (caller knows exactly where)
        2. explicit --persist-dir (caller wants the committed path)
        3. remote env -> COMMITTED_QUEUE_DIR (survives teardown)
        4. default _state/        (local, git-ignored, transient)
    Kept a pure function so the precedence is selftest-able.
    """
    if state_dir:
        return Path(state_dir)
    if persist_dir:
        return Path(persist_dir)
    if remote:
        return COMMITTED_QUEUE_DIR
    return DEFAULT_STATE_DIR


def main(argv=None):
    p = argparse.ArgumentParser(description="self-improvement LOOP engine")
    p.add_argument("--state-dir", default=None,
                   help="explicit state dir (overrides --persist-dir and env detection)")
    p.add_argument("--persist-dir", default=None,
                   help="committed dir for queue/changelog so remote runs survive teardown")
    p.add_argument("--date", default=None, help="override 'today' (YYYY-MM-DD)")
    sub = p.add_subparsers(dest="cmd", required=True)

    t = sub.add_parser("triage", help="classify + route a proposed change")
    t.add_argument("--category", required=True)
    t.add_argument("--target", required=True)
    t.add_argument("--summary", required=True)
    t.add_argument("--detail", default="")

    ln = sub.add_parser("learn", help="capture a session lesson (sugar over triage)")
    ln.add_argument("lesson", help='the lesson, e.g. "watch out for X"')
    ln.add_argument("--category", default="gotcha",
                    help="risk category (default: gotcha -> LOW, applies now)")
    ln.add_argument("--target", default="LESSONS.md")
    ln.add_argument("--detail", default="")

    d = sub.add_parser("decide", help="resolve a pending change")
    d.add_argument("--id", required=True, dest="change_id")
    d.add_argument("--action", required=True,
                   choices=["approve", "reject", "approve-always"])

    sub.add_parser("status", help="show pending queue + blessed classes")
    sub.add_parser("selftest", help="run the built-in end-to-end test")
    sub.add_parser("stop-hook", help="emit Stop-hook JSON: surface pending-review count")
    g = sub.add_parser("guard", help="emit hook JSON: warn when review items go stale")
    g.add_argument("--max-age-days", type=int, default=7,
                   help="flag review items unresolved this many days (default 7)")

    args = p.parse_args(argv)
    today = args.date or _today()

    if args.cmd == "selftest":
        return _selftest()

    state = resolve_state_dir(args.state_dir, args.persist_dir, _is_remote_env())

    if args.cmd == "stop-hook":
        return _stop_hook(state)

    if args.cmd == "guard":
        return _guard(state, args.max_age_days, today)

    loop = Loop(state, today)

    if args.cmd in ("triage", "learn"):
        summary = args.summary if args.cmd == "triage" else args.lesson
        ch = loop.triage(args.category, args.target, summary, args.detail)
        print(json.dumps({
            "id": ch.id, "risk": ch.risk, "decision": ch.decision,
            "blessed": ch.blessed,
            "routed_to": "changelog.md" if ch.decision == DECISION_APPLY
                         else f"review-{today}.md",
        }, indent=2))
    elif args.cmd == "decide":
        print(json.dumps(loop.decide(args.change_id, args.action), indent=2))
    elif args.cmd == "status":
        print(json.dumps(loop.status(), indent=2))
    return 0


# --- Stop hook --------------------------------------------------------------

def _stop_hook(state_dir: Path) -> int:
    """Emit the Claude Code Stop-hook JSON contract, surfacing the pending
    self-improvement review count to the user at session end.

    Read-only: must NOT create the state dir or touch state — a session that
    never used the LOOP should produce a clean no-op `{}` and leave no trace.
    Prints `{"systemMessage": ...}` (shown to the user, does not block stop)
    when items are pending; `{}` otherwise. Never raises: a broken hook must
    not wedge session shutdown.
    """
    try:
        queue_path = Path(state_dir) / "queue.json"
        if not queue_path.exists():
            print("{}")
            return 0
        items = json.loads(queue_path.read_text())
        n = len(items)
        if n == 0:
            print("{}")
            return 0
        risks = {}
        for c in items:
            risks[c.get("risk", "?")] = risks.get(c.get("risk", "?"), 0) + 1
        breakdown = ", ".join(f"{k} {v}" for k, v in sorted(risks.items()))
        oldest = items[0].get("summary", "")
        msg = (
            f"⏳ self-improve: {n} change(s) awaiting your review ({breakdown}). "
            f"Oldest: \"{oldest}\". "
            f"Resolve with `self_improve.py status` then "
            f"`self_improve.py decide --id <id> --action {{approve,reject,approve-always}}`."
        )
        print(json.dumps({"systemMessage": msg}))
    except Exception:
        # A surfacing hook must never block shutdown on its own failure.
        print("{}")
    return 0


# --- Periodic guard ---------------------------------------------------------

def _guard(state_dir: Path, max_age_days: int, today_str: str) -> int:
    """Emit Stop/SessionStart-hook JSON warning when review items have gone
    stale — held longer than `max_age_days` without a decision. A pending queue
    that nobody resolves is its own failure mode; this makes the rot loud.

    Read-only and exception-safe, like the stop-hook: `{}` when nothing is
    overdue, `{"systemMessage": ...}` when something is.
    """
    try:
        queue_path = Path(state_dir) / "queue.json"
        if not queue_path.exists():
            print("{}")
            return 0
        items = json.loads(queue_path.read_text())
        try:
            today = datetime.date.fromisoformat(today_str)
        except ValueError:
            print("{}")
            return 0
        overdue = []
        for c in items:
            try:
                age = (today - datetime.date.fromisoformat(c.get("ts", ""))).days
            except ValueError:
                continue
            if age >= max_age_days:
                overdue.append((age, c))
        if not overdue:
            print("{}")
            return 0
        overdue.sort(key=lambda t: -t[0])
        oldest_age, oldest = overdue[0]
        msg = (
            f"🚨 self-improve: {len(overdue)} review item(s) overdue "
            f"(≥{max_age_days}d unresolved). Oldest is {oldest_age}d: "
            f"\"{oldest.get('summary', '')}\" (id {oldest.get('id', '?')}). "
            f"Resolve or reject with `self_improve.py decide`."
        )
        print(json.dumps({"systemMessage": msg}))
    except Exception:
        print("{}")
    return 0


# --- Self-test (dogfood) ----------------------------------------------------

def _selftest() -> int:
    """End-to-end test in a throwaway temp dir. Mirrors the real lifecycle and
    asserts the two refused failure modes stay refused."""
    import tempfile, shutil

    tmp = Path(tempfile.mkdtemp(prefix="self-improve-selftest-"))
    fails = []
    try:
        loop = Loop(tmp, "2026-06-30")

        # 1. Default state is safe: no blessed classes.
        assert loop.status()["blessed_classes"] == [], "fresh install must bless nothing"

        # 2. LOW applies immediately.
        low = loop.triage("gotcha", "watch/SKILL.md", "note: focus >10min")
        assert low.decision == DECISION_APPLY, "LOW must apply"
        assert (tmp / "changelog.md").exists(), "LOW must hit changelog"

        # 3. HIGH (skill-behavior) routes to review — NOT applied. This is the
        #    exact drift the dogfood caught: skill edits must never self-apply.
        high = loop.triage("skill-behavior", "watch/SKILL.md", "auto-stop at 5min")
        assert high.decision == DECISION_REVIEW, "HIGH must hold for review"
        assert loop.status()["pending"] == 1, "HIGH must enqueue"
        assert (tmp / "review-2026-06-30.md").exists(), "HIGH must hit review file"

        # 4. UNCLEAR routes to review, flagged.
        unclear = loop.triage("mystery", "??", "do something novel")
        assert unclear.risk == RISK_UNCLEAR and unclear.decision == DECISION_REVIEW

        # 5. reject removes from queue, applies nothing.
        r = loop.decide(high.id, "reject")
        assert r["ok"] and "rejected" in r["outcome"]
        assert loop.status()["pending"] == 1, "only the rejected item leaves"

        # 6. approve-always blesses the class -> next same-class change auto-applies.
        skill2 = loop.triage("skill-behavior", "watch/SKILL.md", "add use-case")
        assert skill2.decision == DECISION_REVIEW, "still gated before blessing"
        ok = loop.decide(skill2.id, "approve-always")
        assert "auto-applies" in ok["outcome"]
        assert "skill-behavior" in loop.status()["blessed_classes"]
        skill3 = loop.triage("skill-behavior", "watch/SKILL.md", "add another")
        assert skill3.decision == DECISION_APPLY and skill3.blessed, \
            "blessed class must now auto-apply"

        # 7. Blessing is explicit + scoped: a DIFFERENT high class is still gated.
        rule = loop.triage("rule", "CLAUDE.md", "add a hard rule")
        assert rule.decision == DECISION_REVIEW, "blessing one class must not bless others"

        # 8. Stop-hook is read-only and never creates state. An unused state dir
        #    yields a clean no-op and leaves no trace.
        unused = Path(tmp) / "never_used"
        import io, contextlib
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            _stop_hook(unused)
        assert buf.getvalue().strip() == "{}", "stop-hook on unused state must be {}"
        assert not unused.exists(), "stop-hook must not create the state dir"

        # 9. Stop-hook surfaces a systemMessage when items are pending.
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            _stop_hook(tmp)   # has pending items (rule, unclear) from above
        out = json.loads(buf.getvalue())
        assert "systemMessage" in out and "awaiting your review" in out["systemMessage"], \
            "stop-hook must surface pending count"

        # 10. Guard is quiet when nothing is overdue (items dated 'today').
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            _guard(tmp, 7, "2026-06-30")
        assert buf.getvalue().strip() == "{}", "guard must be quiet before items age out"

        # 11. Guard fires once items pass the age threshold.
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            _guard(tmp, 7, "2026-07-15")   # items are 15d old > 7d
        out = json.loads(buf.getvalue())
        assert "systemMessage" in out and "overdue" in out["systemMessage"], \
            "guard must warn on stale review items"

        # 12. Guard is read-only: never creates an unused state dir.
        unused2 = Path(tmp) / "never_used_2"
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            _guard(unused2, 7, "2026-07-15")
        assert buf.getvalue().strip() == "{}" and not unused2.exists(), \
            "guard must not create state"

        # 13. Proposal #1: state-dir precedence is correct, and a persisted
        #     queue round-trips across Loop instances — the whole point is that
        #     a remote agent's HIGH item outlives the container that raised it.
        assert _is_remote_env({"CI": "true"}) is True, "CI marks remote"
        assert _is_remote_env({}) is False, "no env marks local"
        assert _is_remote_env({"CI": "0"}) is False, "falsey env is not remote"
        assert resolve_state_dir("/x", "/y", True) == Path("/x"), "explicit state-dir wins"
        assert resolve_state_dir(None, "/y", True) == Path("/y"), "persist-dir beats env"
        assert resolve_state_dir(None, None, True) == COMMITTED_QUEUE_DIR, "remote -> committed"
        assert resolve_state_dir(None, None, False) == DEFAULT_STATE_DIR, "local -> _state"
        persist = Path(tmp) / "committed_queue"
        held = Loop(persist, "2026-06-30").triage("rule", "CLAUDE.md", "persisted HIGH item")
        assert held.decision == DECISION_REVIEW, "HIGH still gated in persisted dir"
        reopened = Loop(persist, "2026-06-30")   # fresh instance, same dir
        assert any(c["id"] == held.id for c in reopened._load_queue()), \
            "persisted queue must round-trip across instances"

        # 14. Proposal #2: a `learn` call (gotcha default) auto-applies like any
        #     LOW change — the one-liner retro lands without gating.
        lesson = loop.triage("gotcha", "LESSONS.md", "learned: isolate worktrees")
        assert lesson.decision == DECISION_APPLY, "learn (gotcha) must apply"

    except AssertionError as e:
        fails.append(str(e))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    if fails:
        print("SELFTEST FAILED:")
        for f in fails:
            print("  -", f)
        return 1
    print("SELFTEST PASSED — LOW applies, HIGH/UNCLEAR gated, "
          "approve-always blesses scoped, defaults empty.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
