# TODO

Backlog of next-step workflow ideas for the EverPass MCP stack. The "Source coverage" block is prioritized — those gaps are the documented reason the cockpit goes stale (see `DASHBOARD_SOURCES.md`). Everything below it is unordered.

## Source coverage (priority — close the gaps that cause cockpit drift)

- [ ] **Outlook bridge audit.** Verify Outlook (`rblood@everpass.com`) → Gmail forward → filter `to:@everpass.com` → label `EverPass` end-to-end. Confirm the filter matches forwarded copies even when the original sender is not `@everpass.com` (the Harris Hoffberg / WBD failure mode). If not, fix the filter or add a sender-side rule.
- [ ] **OneDrive MCP wiring.** No OneDrive read path exists today. Pick an approach (Microsoft Graph MCP, a Zapier OneDrive bridge, or a OneDrive → Dropbox sync of the canonical folders) and wire it. Update `DASHBOARD_SOURCES.md` row 7 from `gap` to `wired`/`bridged` once verified.
- [ ] **Contract Master path pin.** Locate the canonical Contract Master workbook, document its exact path in `DASHBOARD_SOURCES.md` row 10, then wire (likely follows the OneDrive task).
- [ ] **Deal Brain path pin.** Same as Contract Master — locate, pin in row 11, wire.
- [ ] **Obsidian vault ingest.** Decide whether to (a) sync the vault to a wired surface (Dropbox or wired OneDrive) or (b) export-on-change to Gmail under `EverPass`. Update row 8.
- [ ] **NotebookLM signal capture.** No public API. Establish a manual-but-disciplined export route (paste digest into Gmail `EverPass` label, or into a tracked Dropbox doc) so signal stops dying inside NotebookLM. Update row 9 verification step.
- [ ] **Identify the cockpit renderer.** The Mobile Command Center UI is not produced by this repo (`DASHBOARD_SOURCES.md` row 12). Find the system rendering it and what storage it polls; pin that storage to a wired surface, or stop treating cockpit dates as ground truth.

## End-to-end workflows

- [ ] **Thread → log → draft**: summarize the latest `label:"EverPass"` Gmail thread → append a row to `EverPass – MCP Logs` (`date | event | status`) → optionally draft a reply in Gmail. Single command, one confirmation at the draft step.
- [ ] **Dropbox drop → log**: watch for new files in a designated Dropbox folder, generate a `shared_link`, log `date | event=file_added | status=link_generated` with the URL.
- [ ] **Weekly digest**: roll up the week's `EverPass – MCP Logs` rows into a plain-text digest; post via Webhooks POST to wherever I want it surfaced.

## GitHub-based SOPs

- [ ] Add an `sops/` directory with one markdown file per recurring task (sanity checks, credential rotation, adding a Zapier action). Link them from README.
- [ ] Add a `scripts/` directory for any small helper scripts (e.g., PAT rotation checklist, Gmail label audit).
- [ ] Keep a `CHANGELOG.md` anchored to MCP config changes so I can diff the stack over time.

## Meeting-notes → issue flow

- [ ] Take structured meeting notes (standard template) and convert them into GitHub issues in this repo: one issue per action item, labels for owner + due date, body containing the decision context.
- [ ] Consider a thin wrapper so the flow runs as a single Claude Code command from a notes file.

## Hygiene

- [ ] Decide whether to re-enable Superhuman Mail MCP (default: no).
- [ ] Document the PAT rotation cadence and expiry.
- [ ] Audit Gmail filter coverage periodically — confirm no `@everpass.com` mail is escaping the `EverPass` label.
