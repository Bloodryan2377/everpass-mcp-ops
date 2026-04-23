# TODO

Backlog of next-step workflow ideas for the EverPass MCP stack. Unordered — promote to a dated plan when picked up.

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
