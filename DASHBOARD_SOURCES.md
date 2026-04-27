# Dashboard / Cockpit Data Sources

Canonical inventory of every source that feeds the Mobile Command Center cockpit and the EverPass dashboard. **If a source is not listed here, it is not in the refresh.** Update this file whenever a source is added, moved, retired, or rewired.

## Status legend

- `wired` — MCP reads it directly via a documented action.
- `bridged` — MCP reads it indirectly through a forward or sync; the bridge itself must be verified each refresh.
- `manual` — no programmatic read path; relies on human export or a future integration.
- `gap` — known invisible to MCP; explicitly out of scope for current refresh.

## Sources

| # | Source | Location | Status | MCP path | Verification step |
|---|---|---|---|---|---|
| 1 | Outlook (`rblood@everpass.com`) | Microsoft 365 | bridged | Outlook auto-forward → Gmail filter on `to:@everpass.com` → label `EverPass` → Gmail MCP | Send a probe to `rblood@everpass.com` from a non-`@everpass.com` address; confirm it appears in Gmail under `label:"EverPass"` within 5 min. If not, the forward or filter is broken. |
| 2 | Gmail (`label:"EverPass"`) | Gmail | wired | Gmail MCP, scoped to the label | `search label:"EverPass" newer_than:2d` returns expected count; open one thread end-to-end. |
| 3 | Zapier MCP server | Zapier | wired | 4 apps / 11 actions (see `MCP_SETUP.md`) | Run the sanity-check loop in `README.md`. |
| 4 | Dropbox | Dropbox | wired | Dropbox MCP (`file`, `find`, `list`, `shared_link`) | `list` top folder; `find` a known file; resolve a `shared_link`. |
| 5 | Google Sheets — `EverPass – MCP Logs` | Google Sheets | wired | Sheets MCP, append-only `Sheet1` (`date | event | status`) | `add_row` then `update_row` smoke test. |
| 6 | GitHub — `bloodryan2377/everpass-mcp-ops` | GitHub | wired | GitHub MCP plugin | `list_commits` returns the latest commit on `main` and on the active branch. |
| 7 | OneDrive (source contracts, master files, working folders) | OneDrive | **gap** | none — no OneDrive MCP wired | N/A. See TODO: source coverage. |
| 8 | Obsidian vault | OneDrive sync (or local) | **gap** | none — even when files reach OneDrive, OneDrive itself is a gap | N/A. See TODO: source coverage. |
| 9 | NotebookLM | Google NotebookLM | manual | no public API; manual export only | Manual: paste relevant signal into Gmail (`EverPass` label) or a Dropbox doc to bring it into scope. |
| 10 | Contract Master workbook | TBD — locate canonical path | **gap** | none until path is pinned and source is wired | N/A. Pin path, then wire. |
| 11 | Deal Brain | TBD — locate canonical path | **gap** | none until path is pinned and source is wired | N/A. Pin path, then wire. |
| 12 | Mobile Command Center cockpit (the rendering itself) | Unknown system | unknown | not produced by this repo | Identify the renderer and what storage it polls before claiming any refresh affects it. |

## Why the cockpit goes stale

The cockpit shown in the iOS screenshot is **not rendered by this repo**. It reads from some upstream snapshot. Until that snapshot is pinned to one of the wired surfaces above (or sources 7/8/10/11 are wired), updates that arrive only in OneDrive / Obsidian / Contract Master / Deal Brain / NotebookLM are invisible to MCP and the cockpit can drift even when MCP runs cleanly.

## Adding a source

1. Add a row to the table with status `gap` and a placeholder MCP path.
2. Open or update a TODO entry under "Source coverage" describing the wiring work.
3. Once wired, flip the row to `wired` or `bridged` and fill in the verification step.
4. Commit the change in the same PR as the wiring.
