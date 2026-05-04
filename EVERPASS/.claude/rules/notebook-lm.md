---
name: notebook-lm
description: Path-scoped rules for NotebookLM-related artifacts (sweep outputs, per-partner notebook configs, Playwright capture).
paths:
  - "**/NotebookLM*/**"
  - "**/notebooklm*/**"
  - "EVERPASS TOOLS/NotebookLM/**"
---

# NotebookLM — Edit Rules

## Mirror, not source
- NotebookLM is a **mirror** for retrieval and research, not a source of truth. OneDrive is canonical; NotebookLM (and Google Drive) reflect.
- Never edit a NotebookLM-derived file as if it were upstream. Fix the source on OneDrive, then refresh the notebook.

## Sweep skill
- Use `notebook-lm-sweep` for the weekly "what's changed or unresolved" pass over every partner notebook. Each response saved as `.txt` under the partner's NotebookLM folder.
- Resume log: `~/.claude/projects/.../memory/notebook_lm_sweep_resume_YYYY-MM-DD.md`. Latest sweep entry: 2026-04-27 (BravesVision, diag=zero_sources).
- Failing partners go to the resume log as `partner | diagnostic_code | timestamp`. Don't retry blindly — read the resume log first.

## Playwright capture rules (DOM doctrine)
When automating chat-message capture from `notebooklm.google.com`:

- Chat pane root = `<chat-panel>`. Scope all message selectors to that container — never query the whole document.
- Completion marker = the last `chat-message:has(chat-actions)`. **Never** use a generic "Copy" button or `[aria-label*="Copy" i]` — those belong to source/code-copy controls.
- Real feedback aria-labels: `"Rate response as *"` (NOT thumbs-up/down strings).
- `chat-message` virtualizes — never anchor on index count.
- Prefer a single scoped DOM pass (`evaluate()` on chat pane root, or chained locator) over repeated global `.count()` calls.
- Override only if Ryan explicitly says "override the DOM selection doctrine".

## Browser hygiene
- Isolated profile + headless + explicit teardown. Never blanket-kill `chrome.exe`. Bounded runs only.
- Prefer the Playwright CLI (`playwright` Bash command) over the MCP plugin tools when scripting.

## Source diagnostics
- `zero_sources` failures usually mean the notebook lost its OneDrive linkage. Re-attach via the notebook's Sources panel rather than re-uploading.
- Don't auto-create new notebooks — clarify with Ryan first; partner notebook list is governed.

## Skill chain
- Use `notebooklm` skill (full programmatic API) for create/list/source operations beyond the web UI's surface.
