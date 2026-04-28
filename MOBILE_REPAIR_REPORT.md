# MOBILE_REPAIR_REPORT

**Target:** `https://dashboard.everpasspipeline.com/mobile/`
**Branch:** `claude/fix-mobile-dashboard-route-16kIE`
**Date:** 2026-04-28

## 1. Issue observed

User report: the `/mobile/` route on the EverPass Pipeline dashboard is not
working properly. No specific symptom (blank page, 404, redirect loop, JS
error, layout break) was supplied; the task expected this workstation to host
the dashboard source so the failure could be reproduced locally.

## 2. Root cause (of why no code fix was applied here)

**The EverPass dashboard codebase is not present on this workstation, and the
live host is not reachable from this sandbox.** A code-level repair cannot be
authored from this environment. Specifically:

- The only repository on the box is `/home/user/everpass-mcp-ops` — a
  docs-only ops tracker for the MCP / Zapier / GitHub wiring. It contains
  three files (`README.md`, `MCP_SETUP.md`, `TODO.md`) and **no application
  source, no `package.json`, no framework config, no routes, no `mobile`
  directory, no build pipeline.**
- Filesystem search across `/` for any frontend project artifact
  (`package.json`, `next.config*`, `vite.config*`, `vercel.json`,
  `netlify.toml`, `nginx.conf`, `*.tsx`, `*.jsx`, `*.svelte`, `*.vue`, or any
  directory named `src` / `pages` / `app` / `routes` / `components` outside
  `/usr` and `/opt`) returned **zero matches**.
- Full-text search across `/` for the strings `everpasspipeline` and
  `EverPass Pipeline` returned **zero matches** outside this docs repo.
- The GitHub account `Bloodryan2377` (the only account this session is
  authorized against) lists exactly **one** repository: `everpass-mcp-ops`.
  No `dashboard`, `mobile`, `cockpit`, `operator`, or sibling product repo
  exists on that account.
- The live URL `https://dashboard.everpasspipeline.com/mobile/` (and the bare
  root `https://dashboard.everpasspipeline.com/`) returns
  `HTTP/2 403 host_not_allowed` from the sandbox proxy
  (`x-deny-reason: host_not_allowed`). This means:
    1. I cannot reproduce the failure end-to-end against the live site.
    2. I cannot inspect the served HTML, asset paths, viewport meta, JS
       bundle URLs, redirect chain, or auth behavior.
    3. I cannot diff hosted routing config against any local build, because
       there is no local build.

There is therefore nothing to edit, lint, typecheck, build, or screenshot.
Producing a "fix" without the source would be invented work and was not done.

## 3. Files changed

- **Added:** `MOBILE_REPAIR_REPORT.md` (this file).

No application source was touched, because no application source exists in
this environment.

## 4. Validation performed

- `git status` clean before write; current branch confirmed
  `claude/fix-mobile-dashboard-route-16kIE`.
- `ls -la /home/user/everpass-mcp-ops` → docs-only repo confirmed.
- `find / -maxdepth 5 -name package.json` → only `/opt/nvm/package.json`
  (Node tooling, not a project).
- `find / -maxdepth 6 -type d -name "src|pages|app|routes|components"`
  (excluding `node_modules`, `/.cache/`, `/usr`, `/opt`) → no matches.
- `find / -type f -name "*.tsx|*.jsx|*.svelte|*.vue"`
  (excluding `node_modules`) → no matches.
- `grep -rIl "everpasspipeline"` and `grep -rIl "EverPass Pipeline"` over
  `/` (excluding `/proc`, `/.cache`) → no matches.
- `mcp__github__search_repositories user:Bloodryan2377` → 1 repo
  (`everpass-mcp-ops`), confirmed contains only the three doc files.
- `curl -i https://dashboard.everpasspipeline.com/mobile/` →
  `HTTP/2 403`, body `Host not in allowlist`,
  header `x-deny-reason: host_not_allowed`.
- `curl -i https://dashboard.everpasspipeline.com/` → same 403.

## 5. Remaining risk

- The live `/mobile/` route remains in whatever broken state the user
  observed. **No production change has been made and none was attempted.**
- Because the failure mode was not characterized (blank page vs. 404 vs.
  redirect vs. JS error vs. layout break vs. API failure), even a future
  repair attempt should start with a precise symptom capture (screenshot +
  devtools console + network tab HAR) before any code edit.

## 6. Exact next deployment step

No deployment is pending. To make this task executable, one of the
following needs to happen — in roughly increasing order of effort:

1. **Point me at the dashboard repo.** Provide the GitHub org/repo (or
   git URL) for the EverPass Pipeline dashboard and grant the GitHub MCP
   tools access to it. I will then clone it into this workstation, find
   `/mobile/`, reproduce, fix, and report.
2. **Clone the dashboard repo into this workstation manually** at e.g.
   `/home/user/everpass-dashboard` and re-run this task. The search
   heuristics in the task brief will find it on the next pass.
3. **Allowlist `dashboard.everpasspipeline.com`** on the sandbox egress
   proxy so I can probe the live route directly (HTML, headers, asset
   paths, redirects, viewport meta, JS bundle URLs, error responses).
   Combined with #1 or #2 this lets me reproduce the failure against
   both the deployed bundle and the source.
4. **Capture the failing symptom** on a real iPhone / iPad / desktop
   devtools-emulated mobile viewport (390x844, 430x932, 768x1024,
   1024x1366) and paste the screenshot + console output + network HAR
   into the next task. Even without code access this would let me
   isolate routing vs. asset vs. CSS vs. auth vs. API as the failure
   class before code is opened.

Until at least #1 or #2 lands, the actionable path on this branch ends
here. This file is the deliverable for that handoff.

---

## Path to this report

`/home/user/everpass-mcp-ops/MOBILE_REPAIR_REPORT.md`
(repo: `Bloodryan2377/everpass-mcp-ops`, branch
`claude/fix-mobile-dashboard-route-16kIE`)
