"""
Mirror mobile shell from dashboard-deploy to everpass-mcp-ops.
Idempotent — safe to re-run.
Skips data/mobile/ (already populated by build-mobile-data) and any system-audits cruft.
"""
import os
import shutil
import sys

SRC = r"C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\EVERPASS TOOLS\Dashboard\dashboard-deploy\mobile"
DST = r"C:\Users\ryan\Projects\everpass-mcp-ops\mobile"

IGNORE_NAMES = {"system-audits"}
IGNORE_SUFFIXES = (".bak",)
IGNORE_PATTERNS = (".bak.",)


def ignore(directory, names):
    skip = []
    for n in names:
        if n in IGNORE_NAMES:
            skip.append(n)
            continue
        if any(p in n for p in IGNORE_PATTERNS):
            skip.append(n)
            continue
        if n.endswith(IGNORE_SUFFIXES):
            skip.append(n)
            continue
    return skip


def main():
    if not os.path.isdir(SRC):
        print(f"ERROR: source missing: {SRC}", file=sys.stderr)
        sys.exit(2)

    print(f"SRC={SRC}")
    print(f"DST={DST}")
    shutil.copytree(SRC, DST, dirs_exist_ok=True, ignore=ignore)

    # Sanity report
    expected = ["index.html", "manifest.webmanifest", "sw.js"]
    missing = [f for f in expected if not os.path.isfile(os.path.join(DST, f))]
    if missing:
        print("ERROR: missing after copy:", missing, file=sys.stderr)
        sys.exit(3)

    print("MIRROR_DONE")


if __name__ == "__main__":
    main()
