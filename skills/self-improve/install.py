#!/usr/bin/env python3
"""install.py — sync the self-improve LOOP from this repo into a live ~/.claude.

Does the whole "manual step" in one command, on the machine where you run it:

  1. Copy the skill files  -> <home>/.claude/skills/self-improve/
  2. Merge the Stop + SessionStart hook snippets into <home>/.claude/settings.json
     (without disturbing your other hooks)
  3. Append the trigger block to <home>/.claude/CLAUDE.md

Safe to re-run: every step is idempotent and keyed on a stable marker, so a
second run updates in place instead of duplicating. settings.json and CLAUDE.md
are backed up (.bak-<date>) before they're touched. Nothing outside <home>/.claude
is modified.

Usage (on the box with the live ~/.claude — e.g. Git Bash on Windows):

    cd /path/to/everpass-mcp-ops
    git pull
    python skills/self-improve/install.py            # do it
    python skills/self-improve/install.py --dry-run   # show what it would do
    python skills/self-improve/install.py --home /custom/home

This file is dependency-free (stdlib only) and host-agnostic.
"""

from __future__ import annotations

import argparse
import datetime
import json
import os
import shutil
import sys
from pathlib import Path

SKILL_SRC = Path(__file__).resolve().parent          # skills/self-improve/
REPO_ROOT = SKILL_SRC.parents[1]                      # repo root
HOOKS_DIR = REPO_ROOT / "hooks"

# Which hook snippet maps to which settings.json event key.
HOOK_SNIPPETS = {
    "Stop": HOOKS_DIR / "stop-snippet.json",
    "SessionStart": HOOKS_DIR / "sessionStart-snippet.json",
}

TRIGGER_BEGIN = "<!-- BEGIN self-improve trigger (managed by install.py) -->"
TRIGGER_END = "<!-- END self-improve trigger -->"

# Files copied into the live skill dir. Runtime state and tooling stay behind.
COPY_EXCLUDE = {".gitignore", "install.py", "__pycache__"}


def _stamp() -> str:
    return datetime.date.today().isoformat()


def _backup(path: Path, log):
    if path.exists():
        bak = path.with_suffix(path.suffix + f".bak-{_stamp()}")
        shutil.copy2(path, bak)
        log(f"  backed up {path.name} -> {bak.name}")


def copy_skill(home: Path, dry: bool, log) -> None:
    dest = home / ".claude" / "skills" / "self-improve"
    log(f"[1/3] skill files -> {dest}")
    if not dry:
        dest.mkdir(parents=True, exist_ok=True)
    for item in sorted(SKILL_SRC.iterdir()):
        if item.name in COPY_EXCLUDE or item.is_dir():
            continue
        log(f"  copy {item.name}")
        if not dry:
            shutil.copy2(item, dest / item.name)


def _extract_trigger_block() -> str:
    """Pull the fenced ```markdown block out of CLAUDE-TRIGGER-snippet.md."""
    src = SKILL_SRC / "CLAUDE-TRIGGER-snippet.md"
    lines = src.read_text().splitlines()
    out, inside = [], False
    for ln in lines:
        if ln.strip().startswith("```markdown"):
            inside = True
            continue
        if inside and ln.strip() == "```":
            break
        if inside:
            out.append(ln)
    return "\n".join(out).strip()


def merge_hooks(home: Path, dry: bool, log) -> None:
    settings = home / ".claude" / "settings.json"
    log(f"[2/3] hooks -> {settings}")
    data = {}
    if settings.exists():
        try:
            data = json.loads(settings.read_text())
        except json.JSONDecodeError:
            log("  !! settings.json is not valid JSON — refusing to touch it. "
                "Fix it and re-run, or paste the snippets manually.")
            return
    hooks = data.setdefault("hooks", {})

    for event, snippet_path in HOOK_SNIPPETS.items():
        groups = json.loads(snippet_path.read_text())
        bucket = hooks.setdefault(event, [])
        for group in groups:
            marker = group.get("_comment", "")[:60]
            # Idempotent: replace any existing group with the same comment marker.
            existing = next(
                (i for i, g in enumerate(bucket)
                 if g.get("_comment", "")[:60] == marker), None)
            if existing is not None:
                bucket[existing] = group
                log(f"  update {event} hook ({marker.split(':')[0]})")
            else:
                bucket.append(group)
                log(f"  add    {event} hook ({marker.split(':')[0]})")

    if not dry:
        settings.parent.mkdir(parents=True, exist_ok=True)
        _backup(settings, log)
        settings.write_text(json.dumps(data, indent=2) + "\n")


def append_trigger(home: Path, dry: bool, log) -> None:
    claude_md = home / ".claude" / "CLAUDE.md"
    log(f"[3/3] trigger block -> {claude_md}")
    block = _extract_trigger_block()
    if not block:
        log("  !! could not extract trigger block from CLAUDE-TRIGGER-snippet.md; skipping")
        return
    managed = f"{TRIGGER_BEGIN}\n{block}\n{TRIGGER_END}\n"

    text = claude_md.read_text() if claude_md.exists() else ""
    if TRIGGER_BEGIN in text and TRIGGER_END in text:
        pre = text[:text.index(TRIGGER_BEGIN)]
        post = text[text.index(TRIGGER_END) + len(TRIGGER_END):].lstrip("\n")
        new = pre.rstrip("\n") + "\n\n" + managed + ("\n" + post if post else "")
        log("  update existing managed trigger block")
    else:
        sep = "" if text == "" else ("\n" if text.endswith("\n") else "\n\n")
        new = text + sep + ("\n" if text else "") + managed
        log("  append trigger block")

    if not dry:
        claude_md.parent.mkdir(parents=True, exist_ok=True)
        _backup(claude_md, log)
        claude_md.write_text(new)


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description="install the self-improve LOOP into ~/.claude")
    p.add_argument("--home", default=os.path.expanduser("~"),
                   help="home dir containing .claude (default: current user's home)")
    p.add_argument("--dry-run", action="store_true", help="show actions, change nothing")
    args = p.parse_args(argv)

    home = Path(args.home)
    dry = args.dry_run
    out = []
    log = out.append

    log(f"self-improve installer — home={home}{'  (DRY RUN)' if dry else ''}")
    log("")
    copy_skill(home, dry, log)
    log("")
    merge_hooks(home, dry, log)
    log("")
    append_trigger(home, dry, log)
    log("")
    if dry:
        log("DRY RUN complete — nothing was changed. Re-run without --dry-run to apply.")
    else:
        log("Done. Restart Claude Code (or start a new session) to load the hooks + trigger.")
    print("\n".join(out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
