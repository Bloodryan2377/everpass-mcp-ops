# MCP_SETUP

Technical notes on the current Claude Code MCP wiring.

## Zapier MCP server — 4 apps / 11 actions

| App           | Actions                                    | Count |
| ------------- | ------------------------------------------ | ----- |
| Webhooks      | GET, POST                                  | 2     |
| Dropbox       | file, find, list, shared_link              | 4     |
| Google Sheets | add_row, update_row                        | 2     |
| Gmail         | message, draft (scoped `label:"EverPass"`) | 3     |

Total: **11 actions** across **4 apps**.

### Google Sheets — `EverPass – MCP Logs`

- Spreadsheet name: **EverPass – MCP Logs**
- Tab: `Sheet1`
- Headers (row 1): `date | event | status`
- Purpose: append-only log of MCP-driven events so I can diff the automation trail independently of Gmail / Dropbox state.

### Gmail scoping

All Gmail MCP actions are constrained to `label:"EverPass"`. The label is applied by a Gmail filter on `to:@everpass.com`, which catches both native `@everpass.com` mail and anything forwarded from Outlook `rblood@everpass.com`. MCP never sees non-EverPass threads.

### Superhuman Mail MCP

**Intentionally disabled / removed.** Gmail (scoped by label) is the single mail surface for MCP. Do not re-enable Superhuman MCP without a deliberate decision.

## GitHub plugin

- Endpoint: `https://api.githubcopilot.com/mcp/`
- Auth: classic PAT in env var `GITHUB_PERSONAL_ACCESS_TOKEN`
- Required scopes: `repo`, `read:user`
- Install scope: user-level (Windows env var), not project-local

## Higgsfield MCP server — AI generation (image / video / audio / 3D / sites / games)

Connected MCP server for AI generation. Tools are namespaced `mcp__<higgsfield-server-id>__*`
(server id rotates per install; check the live tool list rather than hardcoding it here).

| Category | Tools |
|---|---|
| Core generation | `generate_image`, `generate_video`, `generate_audio`, `generate_3d` |
| Model routing | `models_explore` (call with `action:'recommend'` when the right model isn't obvious) |
| Edit existing asset (prefer over re-generating) | `upscale_image` / `upscale_video`, `outpaint_image`, `reframe`, `remove_background`, `motion_control` |
| Templated multi-step video (explainer, ad, UGC, podcast, etc.) | `get_workflow_instructions` (no-arg call first for the catalog, then by name) + `get_workflow_bundle_file` for bundled assets |
| Analysis | `virality_predictor` (engagement/attention/hook-strength/retention scoring), `video_analysis_create`/`status`/`jobs` |
| Voice | `create_voice`, `create_voice_from_confirmed_audio`, `voice_change`, `dubbing` |
| Publishing | `create_website`/`deploy_website`/`publish_website`; `deploy_game`/`publish_game` |
| Account | `show_plans_and_credits`, `balance`, `transactions`, `list_workspaces`/`select_workspace` |

**Local-media caveat:** remote MCP tools cannot read a file the user attached in Claude
chat. For local photo/video/audio input, use `media_upload_widget` (Apps-UI-capable
clients) or `media_upload` / `media_import_url` — never ask the user to attach it in chat.

### Operator checklist

- [ ] Confirm the server shows connected before relying on it (tool list has a live
      `mcp__<id>__*` block for Higgsfield, not just this doc).
- [ ] Run `models_explore(action:'recommend')` before `generate_*` if the right model isn't
      already obvious from the ask.
- [ ] For a refinement of existing output, use the matching edit tool (upscale / outpaint /
      reframe / remove_background / motion_control) instead of regenerating from scratch.
- [ ] For any templated video ask (explainer, ad, UGC, podcast, etc.), call
      `get_workflow_instructions` with no args to see the current catalog before assuming a
      workflow exists or guessing which one fits.
- [ ] Check `show_plans_and_credits` / `balance` before a generation batch that could burn
      meaningful credit.
- [ ] Per the premium-creative-tool rule: on a request that calls for premium/cinematic/
      motion-first output, attempt generation before falling back to CSS/SVG-only motion —
      if it fails, report the specific blocker (auth, credits, tool error) rather than
      silently downgrading.
- [ ] Local files the user wants generated from: use `media_upload_widget`, don't ask them
      to attach it in chat.

## Known cosmetic issue

The Claude Code auto-update banner sometimes shows an "update available" notice when the installed version already matches the latest npm release. This is cosmetic — verify with `npm view @anthropic-ai/claude-code version` against the installed version before chasing it.
