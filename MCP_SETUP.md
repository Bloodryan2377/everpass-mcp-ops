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

## Known cosmetic issue

The Claude Code auto-update banner sometimes shows an "update available" notice when the installed version already matches the latest npm release. This is cosmetic — verify with `npm view @anthropic-ai/claude-code version` against the installed version before chasing it.
