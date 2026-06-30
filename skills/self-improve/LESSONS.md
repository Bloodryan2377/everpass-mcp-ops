# LESSONS — reusable recipes the LOOP captured

Low-risk lessons from building and dogfooding this system, routed through the
LOOP as `gotcha`/`doc` (LOW → applied immediately). These are operational
recipes; behavior changes live separately in `REVIEW-QUEUE.md` (held for sign-off).

## 1. Recipe: add a read-only surfacing hook

When adding a hook that surfaces state at a lifecycle point (Stop, SessionStart),
follow the `stop-hook` / `guard` template — three parts, in this order:

1. **Engine subcommand** that prints the hook JSON contract (`{"systemMessage": …}`
   when there's something to say, `{}` otherwise). It MUST be **read-only**
   (never create the state dir), **exception-safe** (a broken hook must not wedge
   shutdown — wrap in try/except and fall back to `{}`), and side-effect free.
2. **`hooks/<event>-snippet.json`** wrapper that guards on the script existing
   (`[ -f "$SI" ]`) and falls back to `{}` — matches the repo's `_comment` +
   `shell: bash` convention.
3. **selftest invariants**: quiet on unused state + does-not-create-state + fires
   on real state. (See invariants 8–12.)

## 2. Recipe: render-verify HTML without the Playwright npm package

The Playwright **module** may be absent even though the Chromium **binary** is
present under `/opt/pw-browsers`. To verify a page actually renders, drive the
binary directly — no install:

```bash
CHROME=$(find /opt/pw-browsers -type f -name chrome | head -1)
"$CHROME" --headless --no-sandbox --disable-gpu --hide-scrollbars \
  --window-size=1280,720 --virtual-time-budget=1500 \
  --screenshot=out.png "file://$PWD/page.html"
```

- The `dbus` ERROR lines are harmless headless noise.
- To screenshot a **JS-driven end state**, seed the script's state variable
  (e.g. `sed 's/var cur = -1;/var cur = 99;/'`) — injecting `.shown` classes
  doesn't work if the script re-derives state on load and overwrites them.

## 3. Gotcha: a remote agent cannot reach the live runtime

A cloud/ephemeral session's `~/.claude` is the container's, **not** the user's
machine. Consequences, learned the hard way this session:

- Don't try to edit the live runtime — **ship an idempotent installer**
  (`install.py`) and commit it to the mirror repo. The user runs it on their box.
- Runtime state (`_state/`) is **git-ignored**, so anything an ephemeral agent
  must hand back (pending review items, proposals) has to be written to a
  **committed** path, or it vanishes on teardown. (This gap is also
  `REVIEW-QUEUE.md` proposal #1 — fix the engine, not just the symptom.)

## 4. Gotcha: route even meta/self-build work through the LOOP

Building the LOOP is still subject to the LOOP. This session dogfooded it:
`MOTION-LAYER` went `rule → review → approved`; the masters net-new went
`doc → changelog`; the reference explainer went `example → applied`. Don't
bypass the triage just because the change is to the scaffold itself — bypassing
is the drift failure mode wearing a clever hat.
