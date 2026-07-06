# personal/ — Privacy Gate (HARD)

Auto-loaded for any session whose CWD is anywhere under this `personal/` directory.

This directory holds Ryan's personal (non-EverPass-business) identity material — the
individual behind the company, not the company. It exists so a future personal-voice or
personal-brand exercise doesn't get built by fabricating answers — the same failure mode
`EVERPASS/SOUL.md` avoids with its `NEEDS RYAN INPUT` markers.

## Rules (HARD)

1. **Never surface `personal/` content in EverPass-business or external-facing output**
   unless Ryan explicitly asks for it in that specific request. Personal identity and
   EverPass identity (`EVERPASS/SOUL.md`, `VOICE.md`, `AUDIENCE.md`) are separate by
   design — do not blend them silently.
2. **Never fabricate an answer to fill a placeholder.** Every `NEEDS RYAN INPUT` marker
   in `SOUL.md`, `VOICE.md`, `AUDIENCE.md`, or `DESIGN.md` (this directory) stays exactly
   as-is until Ryan answers it directly. An invented answer is worse than a visible gap.
3. **Committed-to-repo vs. local-only is not yet decided.** This scaffold ships with
   placeholders only — nothing sensitive yet. Before real answers go into those files,
   Ryan should decide whether completed answers get committed to this repo like
   everything else, or kept local/gitignored. Default to asking, not assuming, when that
   moment comes.
4. **Never treat `C:\Users\ryan\Desktop` as a project root or scaffold target.** Carried
   over unchanged from `EVERPASS/CLAUDE.md` section 1: this is about Ryan's own
   workspace hygiene, not EverPass governance, so it applies here too.
5. **Definition of done: committed and pushed.** On-disk-only or container-only work is
   not done. Verify with `git log origin/<branch>` before treating anything in this
   directory as shipped. Carried over unchanged from `EVERPASS/CLAUDE.md` section 6,
   because it describes how Ryan works, not an EverPass-specific process.
