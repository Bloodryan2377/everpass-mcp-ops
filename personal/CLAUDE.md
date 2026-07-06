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
3. **Filled answers are local-only by default (decided by Ryan, 2026-07-06).** The
   scaffold with `NEEDS RYAN INPUT` placeholders is what lives in this repo. Once Ryan
   fills real answers into `SOUL.md`, `VOICE.md`, `AUDIENCE.md`, or `DESIGN.md`, those
   filled versions stay on his machine and are NEVER committed or pushed unless Ryan
   explicitly approves that specific commit. A session that finds filled content in
   these files treats it as uncommittable working state: exclude it from staging
   (`git add` everything else by path, never `git add -A` in this directory) and say so
   in the session report. Rule 5's committed-and-pushed definition of done applies to
   the scaffold and rules here, not to filled personal answers.
4. **Never treat `C:\Users\ryan\Desktop` as a project root or scaffold target.** Carried
   over unchanged from `EVERPASS/CLAUDE.md` section 1: this is about Ryan's own
   workspace hygiene, not EverPass governance, so it applies here too.
5. **Definition of done: committed and pushed.** On-disk-only or container-only work is
   not done. Verify with `git log origin/<branch>` before treating anything in this
   directory as shipped. Carried over unchanged from `EVERPASS/CLAUDE.md` section 6,
   because it describes how Ryan works, not an EverPass-specific process.
