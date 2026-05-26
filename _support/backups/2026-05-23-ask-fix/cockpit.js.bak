/* ============================================================
   EverPass Mobile Command Center — Cockpit surface
   ============================================================ */
(function (global) {
  'use strict';
  const { fetchFeed, escapeHtml, el, relTime, freshnessLabel } = global.EPMCData;

  // ---- Ask composer storage keys (kept in sync with answers.js) ----
  const COMPOSER_DRAFT_KEY    = 'epmcc.cockpit-ask.draft.v1';
  const COMPOSER_PREFILL_KEY  = 'epmcc.cockpit-ask.prefill.v1';
  const COMPOSER_MODE_KEY     = 'epmcc.cockpit-ask.mode.v1'; // 'standard' | 'live-brain'
  const OPTIMISTIC_ASKS_KEY   = 'epmcc.optimistic-asks.v1';
  const OPTIMISTIC_ASKS_TTL_MS = 7 * 24 * 3600 * 1000;

  // Live Ask Brain usage logging — fire one /_log/live-ask submit event
  // whenever the composer submits in live-brain mode. Same loopback bridge
  // as Daily S logging (cockpit-server.py on :8787). Failures silent — must
  // never block the underlying submit. Added 2026-04-27.
  const LA_LOG_URL = 'http://127.0.0.1:8787/_log/live-ask';
  const LA_SESSION_KEY = 'epmcc.live-ask.session.v1';
  function laSessionId() {
    try {
      let v = sessionStorage.getItem(LA_SESSION_KEY);
      if (!v) {
        if (window.crypto && crypto.randomUUID) {
          v = 'la-m-' + crypto.randomUUID().slice(0, 8);
        } else {
          v = 'la-m-' + Math.random().toString(36).slice(2, 10);
        }
        sessionStorage.setItem(LA_SESSION_KEY, v);
      }
      return v;
    } catch (_) {
      return 'la-m-' + Math.random().toString(36).slice(2, 10);
    }
  }
  function logLiveAskSubmit(payload) {
    try {
      const body = JSON.stringify(payload);
      const blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
      let sent = false;
      try { if (navigator.sendBeacon) sent = navigator.sendBeacon(LA_LOG_URL, blob); }
      catch (_) { sent = false; }
      if (!sent) {
        try {
          fetch(LA_LOG_URL, {
            method: 'POST', mode: 'cors', keepalive: true,
            headers: { 'Content-Type': 'text/plain' },
            body,
          }).catch(() => {});
        } catch (_) {}
      }
    } catch (_) { /* silent */ }
  }

  function loadComposerMode() {
    try {
      const v = localStorage.getItem(COMPOSER_MODE_KEY);
      return v === 'live-brain' ? 'live-brain' : 'standard';
    } catch (_) { return 'standard'; }
  }
  function saveComposerMode(mode) {
    try { localStorage.setItem(COMPOSER_MODE_KEY, mode); } catch (_) { /* ignore */ }
  }

  // ---- Tiny utilities for the composer (mirrors dispatch.js intentionally;
  //      keeping them inline avoids ordering coupling with the Dispatch tab) --
  function shortHex(n) {
    const bytes = new Uint8Array(n);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, n);
  }
  function todayIsoDate() { return new Date().toISOString().slice(0, 10); }
  function toIsoZ(d) { return new Date(d || Date.now()).toISOString().replace(/\.\d+Z$/, 'Z'); }

  // Heuristic: does this paste look like an Outlook email thread?
  // Match if at least 2 of From:/Sent:/To:/Subject:/"On ... wrote:" appear near top.
  function looksLikeEmailPaste(text) {
    if (!text) return false;
    const head = text.split(/\r?\n/).slice(0, 12).join('\n');
    let hits = 0;
    if (/^From:\s+\S/im.test(head))    hits++;
    if (/^Sent:\s+\S/im.test(head))    hits++;
    if (/^To:\s+\S/im.test(head))      hits++;
    if (/^Subject:\s+\S/im.test(head)) hits++;
    if (/^On\s+.+?\s+wrote:/im.test(text)) hits++;
    return hits >= 2;
  }

  // Mirror ask_router._normalize_text well enough for preview/snippet purposes.
  function stripEmailHeaders(raw) {
    let t = (raw || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // Strip top-of-thread Outlook header block (From/Sent/To/Cc/Subject).
    t = t.replace(/^\s*(?:From:[^\n]*\n(?:Sent:[^\n]*\n)?(?:To:[^\n]*\n)?(?:Cc:[^\n]*\n)?Subject:[^\n]*\n+)/i, '');
    // Trim quoted-reply chains.
    t = t.split(/\n[-]{2,}\s*Original Message\s*[-]{2,}\n/i)[0];
    t = t.split(/\n+On\s+.+?\s+wrote:\s*\n/)[0];
    return t.trim();
  }

  function loadOptimisticAsks() {
    try {
      const raw = localStorage.getItem(OPTIMISTIC_ASKS_KEY) || '[]';
      const list = JSON.parse(raw);
      const cutoff = Date.now() - OPTIMISTIC_ASKS_TTL_MS;
      return list.filter((e) => {
        const t = new Date(e.created_at || 0).getTime();
        return Number.isFinite(t) && t >= cutoff;
      });
    } catch (_) { return []; }
  }
  function saveOptimisticAsks(list) {
    try { localStorage.setItem(OPTIMISTIC_ASKS_KEY, JSON.stringify(list || [])); } catch (_) { /* ignore */ }
  }
  function pushOptimisticAsk(entry) {
    const list = loadOptimisticAsks();
    list.unshift(entry);
    while (list.length > 25) list.pop();
    saveOptimisticAsks(list);
  }

  function buildAskMarkdown({ text, isEmail, mode }) {
    const ts = toIsoZ();
    const expires = toIsoZ(Date.now() + 48 * 3600 * 1000);
    const today = todayIsoDate();
    const isLiveBrain = mode === 'live-brain';

    let kind, target_artifact_kind, target_skill, slug, sourceLabel, kindLabel;
    if (isLiveBrain) {
      kind = 'live-ask-brain';
      target_artifact_kind = 'live-ask-brain';
      target_skill = 'everpass-live-ask-brain';
      slug = 'cockpit-ask-live';
      sourceLabel = 'epmcc/cockpit-ask-live/v1';
      kindLabel = isEmail ? 'Live Ask Brain (email)' : 'Live Ask Brain';
    } else if (isEmail) {
      kind = 'email-paste-research';
      target_artifact_kind = 'email-paste-research';
      target_skill = 'outlook-to-partner-insights';
      slug = 'email';
      sourceLabel = 'epmcc/cockpit-ask/v1';
      kindLabel = 'Email Paste Research';
    } else {
      kind = 'freeform-research';
      target_artifact_kind = 'freeform-research';
      target_skill = 'research-scout';
      slug = 'cockpit-ask';
      sourceLabel = 'epmcc/cockpit-ask/v1';
      kindLabel = 'Freeform Research';
    }
    const correlation_id = `cl-${today.replaceAll('-', '')}-${slug}-${shortHex(6)}`;
    const filename = `${today}-${kind}-${slug}-${shortHex(4)}.md`;

    const desiredOutput = isLiveBrain ? (isEmail ? 'reply-email' : 'wiki-note') : null;
    const fm = [
      'schema: epc-chatgpt-bridge/request/v1',
      `request_kind: ${kind}`,
      `requested_at: ${ts}`,
      'requested_by: claude-code',
      `correlation_id: ${correlation_id}`,
      `target_artifact_kind: ${target_artifact_kind}`,
      `expected_target_skill: ${target_skill}`,
      'priority: normal',
      `expires_at: ${expires}`,
      `source: ${sourceLabel}`,
    ];
    if (isLiveBrain) {
      // Hint to the Live Ask Brain prompt about preferred output shape.
      // The prompt may still infer otherwise; this is just a steer.
      fm.push(`desired_output: ${desiredOutput}`);
    }

    let instruction;
    let constraintsBlock = '';
    if (isLiveBrain) {
      const inputLabel = isEmail
        ? '**Pasted email (Outlook headers will be stripped by the prompt):**'
        : '**Question:**';
      const cleaned = isEmail ? (stripEmailHeaders(text) || text.trim()) : text.trim();
      const lines = [
        '**Mode:** Live Ask Brain (NotebookLM-style; clarify-then-route-then-answer).',
        '',
        inputLabel,
        '',
        cleaned,
        '',
        '**Output preference:** ' + (isEmail ? 'reply-email' : 'wiki-note') + ' (Live Ask Brain may infer otherwise).',
      ];
      instruction = lines.join('\n');
      constraintsBlock = [
        '',
        '## Constraints',
        '- Follow the **Live Ask Brain** system prompt exactly. Run the canonical 3-question contract (HARD CAP 3, MIN 0): Q1 TYPE (deal / economics / industry / reply-email), Q2 CONTEXT (partner + property / topic / recipient), Q3 SHAPE (wiki-note vs short-internal-summary for deal/econ/industry; posture protective/conditional/defer for reply-email).',
        '- Skip any question whose answer is already clearly stated in the Ask text above. If all three slots are inferred, ask zero questions and announce the inference before answering.',
        '- Route to Deal Brain (contracts), Economics Brain (financials), Research Brain (web), or Reply Email per the resolved type.',
        '- Ground all EverPass-deal claims in `DATA_EXPORTS\\contract_master_manifest.json` / `deal_brain_summary.json` / `financials_full_normalized.csv` via `AI Related/ask/contracts_snapshot_helper.py`. If snapshot is stale per `is_fresh()`, say so explicitly in the As of section.',
        '- Output ONE artifact in the matching template: wiki-note (full Obsidian-style: TL;DR / Position / Key terms / Negotiation posture / As of / Open questions / Sources), short-internal-summary (1-3 paragraphs, no headers, "As of" line at end), or reply-email (Subject + posture-tuned body).',
        '- Cite real file paths and dated web URLs in the Sources block; never fabricate.',
        '',
      ].join('\n');
    } else if (isEmail) {
      const subjMatch = text.match(/^Subject:\s*(.+?)\s*$/im);
      const subject = subjMatch ? subjMatch[1].trim() : null;
      const cleaned = stripEmailHeaders(text) || text.trim();
      const lines = [];
      if (subject) lines.push(`**Email subject:** ${subject}`);
      lines.push('');
      lines.push('**Cleaned email body (Outlook headers stripped):**');
      lines.push('');
      lines.push(cleaned);
      lines.push('');
      lines.push('**What I want you to do:**');
      lines.push('Surface what is asked, what is new, and what is blocked. Cite specifics from the body. Note any partner names or deal IDs referenced.');
      instruction = lines.join('\n');
      constraintsBlock = '\n## Constraints\n- Extract: who/when/what-is-asked/what-blocks. No invented facts.\n- If a partner name is identifiable, prefer that partner\'s Insights file as ground truth.\n- Output 1-paragraph Summary + 3-5 Key points + Action items.\n';
    } else {
      instruction = text.trim();
    }

    const heading = isLiveBrain
      ? `Live Ask Brain — cockpit-ask${isEmail ? ' (email reply)' : ''}`
      : (isEmail ? 'Email Paste Research — cockpit-ask' : 'Freeform Research — cockpit-ask');
    const body = `\n# ${heading}\n\n## Instruction\n${instruction || '(no instruction provided)'}\n${constraintsBlock}\n## Routing\n- correlation_id: \`${correlation_id}\`\n- expected outbox correlation_id: \`${correlation_id.replace(/^cl-/, 'cg-')}\`\n- expected target skill: \`${target_skill}\`\n- expected artifact kind: \`${target_artifact_kind}\`\n`;

    const markdown = `---\n${fm.join('\n')}\n---\n${body}`;
    return {
      markdown, filename, correlation_id, kind, kindLabel,
      mode: isLiveBrain ? 'live-brain' : 'standard',
      desired_output: desiredOutput,
    };
  }

  async function shareMarkdown(req) {
    if (!('share' in navigator)) return false;
    try {
      const file = new File([req.markdown], req.filename, { type: 'text/markdown' });
      const data = {
        files: [file],
        title: req.filename,
        text: 'Save to Files -> Ask_Drop (watcher promotes to ChatGPT_Inbox).',
      };
      if ('canShare' in navigator && !navigator.canShare(data)) return false;
      await navigator.share(data);
      return true;
    } catch (err) {
      if (err && err.name === 'AbortError') return 'aborted';
      return false;
    }
  }
  async function copyMarkdown(req) {
    try { await navigator.clipboard.writeText(req.markdown); return true; }
    catch (_) { return false; }
  }
  function downloadMarkdown(req) {
    const blob = new Blob([req.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = req.filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 200);
  }

  function showToast(text, kind) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = text;
    t.dataset.kind = kind || 'info';
    t.hidden = false;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.hidden = true; }, 3500);
  }

  function statusChips(status) {
    const chips = [];
    if (!status) return chips;
    if (status.__error) {
      chips.push({ kind: 'danger', text: 'data feed error' });
      return chips;
    }
    const b = status.bridge || {};
    chips.push({
      kind: b.last_run_status === 'success' ? 'ok' : (b.last_run_status === 'unknown' ? 'warn' : 'danger'),
      text: `bridge ${b.last_run_status || 'unknown'}`,
    });
    chips.push({ kind: 'info', text: `inbox ${b.counts?.inbox_pending ?? 0}` });
    chips.push({
      kind: b.counts?.rejected_outstanding ? 'danger' : 'ok',
      text: `rejected ${b.counts?.rejected_outstanding ?? 0}`,
    });
    const m = status.morning || {};
    chips.push({
      kind: m.overall_status === 'success' ? 'ok' : 'warn',
      text: `morning ${m.overall_status || 'unknown'}${m.run_date ? ' · ' + m.run_date : ''}`,
    });
    return chips;
  }

  // Mirror of the desktop cockpit freshness chip (everpass-daily-cockpit-v2.html).
  // Reads the same freshness-status.json shape (mirrored into
  // data/mobile/freshness-status.json by Scripts/freshness_enforcer.py).
  // Verdict: PASS=green, WARN=amber, FAIL=red, missing/error=warn.
  // Tap = toast with per-source detail.
  function freshnessChip(freshness) {
    if (!freshness || freshness.__error) {
      return { kind: 'warn', text: 'freshness ?', detail: 'freshness-status.json not readable — is EverPass Freshness Enforcer scheduled task running?' };
    }
    const totals = freshness.totals || {};
    const fresh = totals.fresh | 0;
    const warn  = totals.warn  | 0;
    const stale = totals.stale | 0;
    const miss  = totals.missing | 0;
    const n = fresh + warn + stale + miss;
    const verdict = freshness.overall || '?';
    const red   = freshness.user_facing_red   || [];
    const amber = freshness.user_facing_amber || [];
    let kind, text;
    if (verdict === 'PASS') {
      kind = 'ok';
      text = `fresh ${fresh}/${n}`;
    } else if (verdict === 'WARN') {
      kind = 'warn';
      text = `amber ${(amber.length || warn)}/${n}`;
    } else {
      kind = 'danger';
      text = `STALE ${(red.length || stale)}/${n}`;
    }
    // Non-user-facing artifacts (watcher heartbeats, manual-only bridge state)
    // are reported separately so a backend hiccup does not flap the chip color,
    // but we still surface them in the toast detail for the operator.
    const bRed     = freshness.backend_facing_red   || [];
    const bAmber   = freshness.backend_facing_amber || [];
    const bVerdict = freshness.backend_overall || 'PASS';
    const detailLines = [
      `Chain freshness: ${verdict} (user-facing) — ${fresh} fresh / ${warn} warn / ${stale} stale / ${miss} missing`,
      `Rule: ${freshness.rule || 'user-facing artifacts must be <= 12h old'}`,
    ];
    if (red.length)   detailLines.push(`STALE: ${red.join(', ')}`);
    if (amber.length) detailLines.push(`amber: ${amber.join(', ')}`);
    if (bVerdict !== 'PASS' || bRed.length || bAmber.length) {
      const parts = [`Backend: ${bVerdict}`];
      if (bRed.length)   parts.push(`stale: ${bRed.join(', ')}`);
      if (bAmber.length) parts.push(`amber: ${bAmber.join(', ')}`);
      detailLines.push(parts.join(' · '));
    }
    if (freshness.generated_at) detailLines.push(`generated ${relTime(freshness.generated_at)}`);
    return { kind, text, detail: detailLines.join('\n') };
  }

  function renderStatusStrip(status, freshness) {
    const strip = document.getElementById('status-strip');
    strip.innerHTML = '';

    // 2026-05-08 GUARDRAIL: dedicated mobile-data freshness pill leads. Reads
    // mobile-cockpit.json.generated_at directly so a stale build pipeline
    // surfaces RED here even when the chain-wide freshness chip is GREEN.
    // Spec: GREEN <2h / AMBER 2-12h / RED >24h.
    const cockpitCache = global.EPMCData.getCached('cockpit');
    const mf = global.EPMCData.mobileDataFreshness(cockpitCache);
    const mchip = el('span', {
      class: `chip dot ${mf.kind}`,
      text: mf.text,
      attrs: { title: mf.title, 'aria-label': 'Mobile data freshness: ' + mf.title },
    });
    strip.appendChild(mchip);

    // Freshness chip — chain-wide signal that mirrors the desktop topbar chip.
    const f = freshnessChip(freshness);
    const fchip = el('span', {
      class: `chip dot ${f.kind}`,
      text: f.text,
      attrs: { title: f.detail, role: 'button', tabindex: '0', 'aria-label': 'Chain freshness: tap for detail' },
    });
    fchip.style.cursor = 'pointer';
    const showDetail = () => showToast(f.detail, f.kind === 'danger' ? 'error' : (f.kind === 'warn' ? 'info' : 'success'));
    fchip.addEventListener('click', showDetail);
    fchip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showDetail(); }
    });
    strip.appendChild(fchip);

    statusChips(status).forEach((c) => {
      strip.appendChild(el('span', { class: `chip dot ${c.kind}`, text: c.text }));
    });
  }

  function renderHero(cockpit, status) {
    const wrap = el('section', { class: 'hero', attrs: { 'aria-labelledby': 'hero-title' } });
    const title = el('h1', { attrs: { id: 'hero-title' }, text: 'Today' });
    const sub = el('div', { class: 'hero-sub' });
    const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    sub.textContent = `${date} · cockpit data ${freshnessLabel(cockpit?.generated_at).label}`;
    wrap.appendChild(title);
    wrap.appendChild(sub);

    const row = el('div', { class: 'hero-row' });
    const stats = [
      { label: 'Critical now', value: cockpit?.morning_brief?.critical_count ?? '—' },
      { label: 'Active deals', value: cockpit?.deals?.length ?? '—' },
      { label: 'Outbox today', value: status?.bridge?.counts?.archived_today ?? '—' },
      { label: 'Inbox pending', value: status?.bridge?.counts?.inbox_pending ?? '—' },
    ];
    stats.forEach((s) => {
      const stat = el('div', { class: 'hero-stat' });
      stat.appendChild(el('span', { class: 'label', text: s.label }));
      stat.appendChild(el('span', { class: 'value', text: String(s.value) }));
      row.appendChild(stat);
    });
    wrap.appendChild(row);
    return wrap;
  }

  function renderAskComposer() {
    const wrap = el('section', { class: 'ask-composer', attrs: { 'aria-labelledby': 'ask-composer-title' } });

    const head = el('div', { class: 'ask-composer-head' });
    head.appendChild(el('h2', { attrs: { id: 'ask-composer-title' }, class: 'ask-composer-title', text: 'Ask anything' }));
    head.appendChild(el('p', { class: 'ask-composer-sub', text: 'Type a question or paste an email. Answers thread into the Answers tab.' }));
    wrap.appendChild(head);

    const card = el('div', { class: 'card ask-composer-card' });

    // ---- Mode segmented control: Standard Ask vs Live Ask Brain ------------
    // Standard = one-shot freeform/email-paste (existing behavior).
    // Live Brain = NotebookLM-style; the Live Ask Brain prompt asks 1-3
    //              clarifying questions, routes to Deal/Econ/Research/Email,
    //              and emits a wiki-note or reply-email artifact.
    let composerMode = loadComposerMode();
    const modeWrap = el('div', {
      class: 'ask-composer-mode',
      attrs: { role: 'tablist', 'aria-label': 'Ask mode', id: 'ask-composer-mode' },
    });
    const modeBtnStandard = el('button', {
      class: 'ask-mode-btn' + (composerMode === 'standard' ? ' is-active' : ''),
      attrs: {
        type: 'button', role: 'tab',
        'data-mode': 'standard',
        'aria-selected': composerMode === 'standard' ? 'true' : 'false',
        id: 'ask-composer-mode-standard',
      },
      text: 'Standard Ask',
    });
    const modeBtnLive = el('button', {
      class: 'ask-mode-btn' + (composerMode === 'live-brain' ? ' is-active' : ''),
      attrs: {
        type: 'button', role: 'tab',
        'data-mode': 'live-brain',
        'aria-selected': composerMode === 'live-brain' ? 'true' : 'false',
        id: 'ask-composer-mode-live',
      },
      text: 'Live Ask Brain',
    });
    modeWrap.appendChild(modeBtnStandard);
    modeWrap.appendChild(modeBtnLive);
    card.appendChild(modeWrap);

    const modeNote = el('div', {
      class: 'ask-composer-mode-note',
      attrs: { id: 'ask-composer-mode-note', 'aria-live': 'polite' },
    });
    const updateModeNote = () => {
      modeNote.innerHTML = '';
      if (composerMode === 'live-brain') {
        const strong = el('strong', { text: 'Live Ask Brain' });
        modeNote.appendChild(strong);
        modeNote.appendChild(el('span', {
          text: ' — NotebookLM over EverPass Deal/Econ/Research brains. Asks you 1–3 clarifying questions, then returns a wiki note or reply email with sources.',
        }));
      } else {
        const strong = el('strong', { text: 'Standard Ask' });
        modeNote.appendChild(strong);
        modeNote.appendChild(el('span', {
          text: ' — one-shot freeform or email paste. No clarifying questions; bridge synthesizes a partner-intel-shaped artifact.',
        }));
      }
    };
    card.appendChild(modeNote);
    updateModeNote();

    const setMode = (m) => {
      composerMode = (m === 'live-brain') ? 'live-brain' : 'standard';
      saveComposerMode(composerMode);
      [modeBtnStandard, modeBtnLive].forEach((b) => {
        const active = b.dataset.mode === composerMode;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      updateModeNote();
    };
    modeBtnStandard.addEventListener('click', () => setMode('standard'));
    modeBtnLive.addEventListener('click',     () => setMode('live-brain'));

    const ta = el('textarea', {
      class: 'ask-composer-input',
      attrs: {
        id: 'ask-composer-input',
        rows: '4',
        placeholder: 'Ask anything... you can also paste an email here.',
        'aria-label': 'Ask question',
      },
    });

    // Prefill priority: session "follow-up" stash beats saved draft.
    let prefill = '';
    try {
      const fromFollowup = sessionStorage.getItem(COMPOSER_PREFILL_KEY) || '';
      if (fromFollowup) {
        prefill = fromFollowup;
        sessionStorage.removeItem(COMPOSER_PREFILL_KEY);
      } else {
        prefill = localStorage.getItem(COMPOSER_DRAFT_KEY) || '';
      }
    } catch (_) { /* ignore */ }
    ta.value = prefill;

    const meta = el('div', { class: 'ask-composer-meta', attrs: { id: 'ask-composer-meta', 'aria-live': 'polite' } });

    const updateMeta = () => {
      const text = ta.value || '';
      const trimmed = text.trim();
      const isEmail = looksLikeEmailPaste(text);
      meta.innerHTML = '';
      if (!trimmed) {
        meta.appendChild(el('span', { class: 'ask-composer-hint', text: 'Type or paste, then tap Ask.' }));
        return;
      }
      const chip = el('span', { class: `ask-composer-chip ${isEmail ? 'is-email' : ''}` });
      chip.appendChild(el('strong', { text: isEmail ? 'Email paste detected' : 'Freeform ask' }));
      chip.appendChild(el('span', { text: ` · ${trimmed.length} chars` }));
      meta.appendChild(chip);
      if (isEmail) {
        meta.appendChild(el('span', { class: 'ask-composer-hint', text: 'Outlook headers will be stripped before send.' }));
      }
    };

    ta.addEventListener('input', () => {
      try { localStorage.setItem(COMPOSER_DRAFT_KEY, ta.value || ''); } catch (_) { /* ignore */ }
      updateMeta();
    });

    card.appendChild(ta);
    card.appendChild(meta);

    const actions = el('div', { class: 'ask-composer-actions' });
    const btnAsk      = el('button', { class: 'btn btn-primary ask-composer-btn-primary', attrs: { type: 'button', id: 'ask-composer-submit' }, text: 'Ask' });
    const btnCopy     = el('button', { class: 'btn btn-ghost ask-composer-btn',           attrs: { type: 'button', id: 'ask-composer-copy' },     text: 'Copy' });
    const btnDownload = el('button', { class: 'btn btn-ghost ask-composer-btn',           attrs: { type: 'button', id: 'ask-composer-download' }, text: 'Download' });
    actions.appendChild(btnAsk);
    actions.appendChild(btnCopy);
    actions.appendChild(btnDownload);
    card.appendChild(actions);

    const submit = async (mode) => {
      const text = ta.value || '';
      const trimmed = text.trim();
      if (trimmed.length < 4) {
        showToast('Type at least a few words to Ask.', 'error');
        ta.focus();
        return;
      }
      const isEmail = looksLikeEmailPaste(text);
      const req = buildAskMarkdown({ text, isEmail, mode: composerMode });
      const snippetSource = isEmail ? (stripEmailHeaders(text) || trimmed) : trimmed;
      const optimistic = {
        id: `optimistic-${req.correlation_id}`,
        correlation_id: req.correlation_id,
        created_at: new Date().toISOString(),
        kind: req.kind,
        kind_label: req.kindLabel || (isEmail ? 'Email Paste Research' : 'Freeform Research'),
        question_snippet: snippetSource.slice(0, 240),
        raw_text: trimmed.slice(0, 4000),
        delivery_mode: mode,
        filename: req.filename,
        // Live Ask Brain marker so the Answers tab can render `BRN` glyph and
        // a "live ask brain" pipeline chip optimistically.
        composer_mode: req.mode,
        desired_output: req.desired_output || null,
        _optimistic: true,
      };
      pushOptimisticAsk(optimistic);
      try { localStorage.removeItem(COMPOSER_DRAFT_KEY); } catch (_) { /* ignore */ }

      // Fire one usage event per Live Ask Brain submit. Standard-mode Asks
      // are not Live Ask Brain and are intentionally not logged here.
      if (req.mode === 'live-brain') {
        logLiveAskSubmit({
          schema: 'epc-live-ask-usage/v1',
          ts: new Date().toISOString(),
          surface: 'mobile',
          action: 'submit',
          request_kind: req.kind,
          desired_output: req.desired_output || 'unknown',
          // Type/partner/property_hint can't be inferred reliably client-side
          // before the brain prompt classifies — record what is known.
          type: isEmail ? 'reply-email' : 'unknown',
          partner: 'unknown',
          property_hint: 'unknown',
          source: 'cockpit-ask-live',
          session_id: laSessionId(),
          correlation_id: req.correlation_id,
        });
      }

      if (mode === 'share') {
        const ok = await shareMarkdown(req);
        if (ok === 'aborted') {
          showToast('Share cancelled.', 'info');
          return;
        }
        if (!ok) {
          downloadMarkdown(req);
          showToast('Web Share unavailable; downloaded instead. Drop into Ask_Drop or ChatGPT_Inbox.', 'info');
        } else {
          showToast('Asked. Save to Files -> Ask_Drop; watcher promotes it.', 'success');
        }
      } else if (mode === 'copy') {
        const ok = await copyMarkdown(req);
        if (!ok) { showToast('Copy failed.', 'error'); return; }
        showToast('Markdown copied. Drop into Ask_Drop; watcher promotes it.', 'success');
      } else if (mode === 'download') {
        downloadMarkdown(req);
        showToast('Downloaded ' + req.filename + '. Drop into Ask_Drop; the watcher promotes it.', 'success');
      }
      ta.value = '';
      updateMeta();
    };

    btnAsk.addEventListener('click',      () => submit('share'));
    btnCopy.addEventListener('click',     () => submit('copy'));
    btnDownload.addEventListener('click', () => submit('download'));

    wrap.appendChild(card);

    const foot = el('div', { class: 'ask-composer-foot' });
    foot.appendChild(el('span', { text: 'Ask is the front door. Answers thread into the ' }));
    foot.appendChild(el('a', { class: 'ask-composer-foot-link', attrs: { href: '#/answers' }, text: 'Answers tab' }));
    foot.appendChild(el('span', { text: '. On iPhone: tap Ask → Save to Files → Ask_Drop. The EverPass Ask Watcher (06:00 daily, plus on demand) promotes it to ChatGPT_Inbox. Standard Ask = one-shot synthesis. Live Ask Brain = NotebookLM over Deal/Econ/Research with 1–3 clarifying questions before answering.' }));
    wrap.appendChild(foot);

    setTimeout(updateMeta, 0);
    return wrap;
  }

  function renderQuickActions() {
    const wrap = el('section', { class: 'quick-actions' });
    const actions = [
      { href: '#/dispatch?kind=partner-intel-pull', title: 'Partner intel', sub: 'Pull recent signals' },
      { href: '#/dispatch?kind=morning-brief-pull', title: 'Morning supp.', sub: 'Overnight signals' },
      { href: '#/dispatch?kind=meeting-summary-pull', title: 'Meeting summary', sub: 'Action items' },
      { href: '#/results', title: 'Latest results', sub: 'Outbox archive' },
    ];
    actions.forEach((a) => {
      const link = el('a', { class: 'quick-action', attrs: { href: a.href } });
      link.appendChild(el('span', { class: 'qa-title', text: a.title }));
      link.appendChild(el('span', { class: 'qa-sub', text: a.sub }));
      wrap.appendChild(link);
    });
    return wrap;
  }

  function renderCritical(cockpit) {
    const items = cockpit?.morning_brief?.critical || [];
    const wrap = document.createDocumentFragment();
    wrap.appendChild(sectionTitle('Critical now', cockpit?.morning_brief?.date ? `brief ${cockpit.morning_brief.date}` : ''));
    if (!items.length) {
      wrap.appendChild(el('div', { class: 'card state-empty', text: 'No critical items in current brief.' }));
      return wrap;
    }
    const list = el('ul', { class: 'critical-list' });
    items.forEach((c) => {
      const li = el('li', { class: 'crit-item' });
      li.appendChild(el('div', { class: 'crit-title', text: c.title || '' }));
      li.appendChild(el('div', { class: 'crit-body', text: c.body || '' }));
      list.appendChild(li);
    });
    wrap.appendChild(list);
    return wrap;
  }

  // Mines the freshness payload for the contracts snapshot artifact and
  // returns a small "as of Xh ago" label, so the Active deals section can
  // surface its true age (mtime/generated_at of contract_master_manifest_json)
  // instead of looking like it's tied to cockpit-data freshness. Additive
  // 2026-04-27. Rollback = drop this helper + the renderDeals usage below.
  function contractsAsOfLabel(freshness) {
    if (!freshness || freshness.__error) return null;
    const arts = freshness.artifacts || [];
    let src = null;
    for (let i = 0; i < arts.length; i++) {
      if (arts[i].key === 'contract_master_manifest_json') { src = arts[i]; break; }
      if (arts[i].key === 'contract_master_data_json' && !src) src = arts[i];
    }
    if (!src) return null;
    const post = src.post || {};
    const h = post.age_hours;
    let age;
    if (h == null) age = '?';
    else if (h < 1) age = Math.round(h * 60) + 'm';
    else if (h < 24) age = h.toFixed(1) + 'h';
    else age = (h / 24).toFixed(1) + 'd';
    return { text: `Contracts as of ${age} · ${post.status || '?'}`, status: post.status || '?' };
  }

  function renderDeals(cockpit, freshness) {
    const items = cockpit?.deals || [];
    const wrap = document.createDocumentFragment();
    wrap.appendChild(sectionTitle('Active deals', `${items.length} tracked`));
    // "Contracts as of ..." subtitle (additive 2026-04-27). Rollback = remove this block.
    const asof = contractsAsOfLabel(freshness);
    if (asof) {
      const sub = el('div', { class: 'deal-asof', text: asof.text });
      sub.style.fontSize = '0.78rem';
      sub.style.opacity = '0.7';
      sub.style.marginTop = '-2px';
      sub.style.marginBottom = '6px';
      if (asof.status === 'stale' || asof.status === 'missing') sub.style.color = '#ff6b6b';
      else if (asof.status === 'warn') sub.style.color = '#f4b84a';
      sub.title = 'Tier 0 contracts snapshot. 12h staleness rule via freshness_enforcer.';
      wrap.appendChild(sub);
    }
    if (!items.length) {
      wrap.appendChild(el('div', { class: 'card state-empty', text: 'No active deal rows extracted.' }));
      return wrap;
    }
    const list = el('ul', { class: 'deal-list' });
    items.slice(0, 14).forEach((d) => {
      const li = el('li', { class: 'deal-item' });
      li.appendChild(el('div', { class: 'deal-partner', text: d.partner }));
      li.appendChild(el('div', { class: 'deal-state', text: d.state || '' }));
      li.appendChild(el('div', { class: 'deal-action', text: d.next_action || '' }));
      if (d.deadline) li.appendChild(el('div', { class: 'deal-deadline', text: 'Deadline: ' + d.deadline }));
      list.appendChild(li);
    });
    wrap.appendChild(list);
    return wrap;
  }

  function renderSignals(cockpit) {
    const items = cockpit?.bridge_signals || [];
    const wrap = document.createDocumentFragment();
    wrap.appendChild(sectionTitle('Bridge signals', items.length ? `${items.length} recent` : 'none'));
    if (!items.length) {
      wrap.appendChild(el('div', { class: 'card state-empty', text: 'No recent bridge signals in cache.' }));
      return wrap;
    }
    const list = el('ul', { class: 'signal-list' });
    items.forEach((s) => {
      const li = el('li', { class: 'signal-item' });
      li.appendChild(el('div', { class: 'signal-title', text: s.title || '' }));
      if (s.summary) li.appendChild(el('div', { class: 'signal-summary', text: s.summary }));
      if (s.key_points && s.key_points.length) {
        const ul = el('ul', { class: 'signal-bullets' });
        s.key_points.slice(0, 5).forEach((kp) => ul.appendChild(el('li', { text: kp })));
        li.appendChild(ul);
      }
      const meta = el('div', { class: 'signal-meta' });
      meta.appendChild(el('span', { text: s.confidence ? `confidence ${s.confidence}` : '' }));
      meta.appendChild(el('span', { text: s.produced_at ? relTime(s.produced_at) : '' }));
      li.appendChild(meta);
      list.appendChild(li);
    });
    wrap.appendChild(list);
    return wrap;
  }

  function renderAsks(cockpit) {
    const wrap = document.createDocumentFragment();
    const asks = cockpit?.asks;
    if (!asks || !asks.available) return wrap;
    const counts = asks.counts || {};
    const counts24 = asks.counts_24h || {};
    const hasErrors = (counts.failed || 0) > 0 || (counts24.failed || 0) > 0;
    const hasPending = (counts.pending || 0) > 0;
    const titleMeta = asks.last_answered_at
      ? `last answered ${relTime(asks.last_answered_at)}`
      : 'no answers yet';
    wrap.appendChild(sectionTitle('Ask & Answer', titleMeta));
    const cardClasses = ['card', 'asks-tile'];
    if (hasErrors) cardClasses.push('asks-tile-has-errors');
    else if (hasPending) cardClasses.push('asks-tile-has-pending');
    const card = el('div', { class: cardClasses.join(' ') });

    // Primary 24h row: "today" view — what Ryan most cares about glancing at.
    const row24 = el('div', { class: 'asks-row asks-row-24h' });
    const stat = (label, value, kind) => {
      const node = el('div', { class: `asks-stat asks-stat-${kind || ''}`.trim() });
      node.appendChild(el('div', { class: 'asks-stat-value', text: String(value) }));
      node.appendChild(el('div', { class: 'asks-stat-label', text: label }));
      return node;
    };
    row24.appendChild(stat('done 24h', counts24.answered || 0, (counts24.answered || 0) > 0 ? 'ok' : ''));
    row24.appendChild(stat('pending 24h', counts24.pending || 0, (counts24.pending || 0) > 0 ? 'warn' : ''));
    if ((counts24.failed || 0) > 0) {
      row24.appendChild(stat('errors 24h', counts24.failed || 0, 'danger'));
    }
    card.appendChild(row24);

    // Subtle error banner when something needs human attention.
    if (hasErrors) {
      const warn = el('div', { class: 'asks-warning' });
      warn.appendChild(el('span', { class: 'asks-warning-icon', text: '!' }));
      warn.appendChild(el('span', { text: `${counts.failed || 0} ask(s) errored - check ChatGPT_Outbox/_rejected/` }));
      card.appendChild(warn);
    }

    // All-time row (small, secondary).
    const rowAll = el('div', { class: 'asks-row asks-row-all' });
    rowAll.appendChild(stat('total', asks.total || 0));
    rowAll.appendChild(stat('done', counts.answered || 0, 'ok'));
    rowAll.appendChild(stat('pending', counts.pending || 0, counts.pending ? 'warn' : ''));
    if (counts.failed) rowAll.appendChild(stat('failed', counts.failed, 'danger'));
    if (counts.expired) rowAll.appendChild(stat('expired', counts.expired, 'warn'));
    card.appendChild(rowAll);

    const link = el('a', { class: 'asks-cta', attrs: { href: '#/answers' }, text: 'Open Answers tab >' });
    card.appendChild(link);

    wrap.appendChild(card);
    return wrap;
  }

  function renderTodos(cockpit) {
    const todos = cockpit?.partner_todos?.items || [];
    const wrap = document.createDocumentFragment();
    wrap.appendChild(sectionTitle('Partner todos', cockpit?.partner_todos?.total ? `${cockpit.partner_todos.total} total` : ''));
    if (!todos.length) {
      wrap.appendChild(el('div', { class: 'card state-empty', text: 'No partner todos extracted.' }));
      return wrap;
    }
    const list = el('ul', { class: 'todo-list' });
    todos.forEach((t) => {
      const li = el('li', { class: 'todo-item' });
      li.appendChild(el('div', { class: 'todo-partner', text: t.partner || '?' }));
      li.appendChild(el('div', { class: 'todo-text', text: t.text || '' }));
      const metaBits = [];
      if (t.category) metaBits.push(t.category);
      if (t.due) metaBits.push('due ' + t.due);
      if (metaBits.length) li.appendChild(el('div', { class: 'todo-meta', text: metaBits.join(' · ') }));
      list.appendChild(li);
    });
    wrap.appendChild(list);
    return wrap;
  }

  function renderHealth(status) {
    const wrap = document.createDocumentFragment();
    wrap.appendChild(sectionTitle('Runtime health', status?.generated_at ? `as of ${relTime(status.generated_at)}` : ''));
    if (!status || status.__error) {
      wrap.appendChild(el('div', { class: 'card state-error', text: status?.__error || 'No status feed available.' }));
      return wrap;
    }
    const grid = el('div', { class: 'health-grid' });
    const sv = status.selfverify || {};
    const svKind = sv.overall === 'PASS' ? 'ok' : (sv.overall === 'WARN' ? 'warn' : (sv.overall === 'FAIL' ? 'err' : 'warn'));
    const svValue = sv.report_present
      ? `${sv.overall} (${sv.counts?.pass ?? 0}P/${sv.counts?.warn ?? 0}W/${sv.counts?.fail ?? 0}F)`
      : 'no report';
    const items = [
      { label: 'Bridge run', value: status.bridge?.last_run_status || 'unknown', kind: status.bridge?.last_run_status === 'success' ? 'ok' : 'warn' },
      { label: 'Morning', value: status.morning?.overall_status || 'unknown', kind: status.morning?.overall_status === 'success' ? 'ok' : 'warn' },
      { label: 'Cockpit', value: status.morning?.cockpit_status || '—', kind: status.morning?.cockpit_status === 'success' ? 'ok' : 'warn' },
      { label: 'Drive sync', value: status.morning?.drive_mirror_status || '—', kind: status.morning?.drive_mirror_status === 'success' ? 'ok' : 'warn' },
      { label: 'NotebookLM', value: status.morning?.notebooklm_status || '—', kind: status.morning?.notebooklm_status === 'success' ? 'ok' : 'warn' },
      { label: 'Self-verify', value: svValue, kind: svKind },
      { label: 'Last artifact', value: status.bridge?.last_artifact || '—', kind: 'ok' },
    ];
    items.forEach((i) => {
      const card = el('div', { class: `health-item ${i.kind}` });
      card.appendChild(el('span', { class: 'label', text: i.label }));
      card.appendChild(el('span', { class: 'value', text: i.value }));
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function renderMeetings(cockpit) {
    const today = cockpit?.meetings?.today || {};
    const tomorrow = cockpit?.meetings?.tomorrow || {};
    const wrap = document.createDocumentFragment();
    wrap.appendChild(sectionTitle('Meetings'));

    const card = el('div', { class: 'card' });
    const todayBlock = el('div');
    todayBlock.appendChild(el('div', { class: 'subtle', html: `<strong>Today</strong> · ${escapeHtml(today.date || '—')}` }));
    if (!today.available || !today.items?.length) {
      todayBlock.appendChild(el('div', { class: 'meeting-empty', text: 'No meetings on file for today.' }));
    } else {
      const ul = el('ul', { class: 'todo-list' });
      today.items.forEach((m) => {
        const li = el('li', { class: 'todo-item' });
        li.appendChild(el('div', { class: 'todo-partner', text: (m.start || '').slice(11, 16) }));
        li.appendChild(el('div', { class: 'todo-text', text: m.summary || '(untitled)' }));
        ul.appendChild(li);
      });
      todayBlock.appendChild(ul);
    }
    card.appendChild(todayBlock);

    const tomorrowBlock = el('div', { attrs: { style: 'margin-top:14px' } });
    tomorrowBlock.appendChild(el('div', { class: 'subtle', html: `<strong>Tomorrow</strong> · ${escapeHtml(tomorrow.date || '—')}` }));
    if (!tomorrow.available || !tomorrow.items?.length) {
      tomorrowBlock.appendChild(el('div', { class: 'meeting-empty', text: 'No meetings on file for tomorrow.' }));
    } else {
      const ul = el('ul', { class: 'todo-list' });
      tomorrow.items.forEach((m) => {
        const li = el('li', { class: 'todo-item' });
        li.appendChild(el('div', { class: 'todo-partner', text: (m.start || '').slice(11, 16) }));
        li.appendChild(el('div', { class: 'todo-text', text: m.summary || '(untitled)' }));
        ul.appendChild(li);
      });
      tomorrowBlock.appendChild(ul);
    }
    card.appendChild(tomorrowBlock);

    wrap.appendChild(card);
    return wrap;
  }

  function sectionTitle(label, meta) {
    const node = el('div', { class: 'section-title' });
    node.appendChild(el('span', { text: label }));
    if (meta) node.appendChild(el('span', { class: 'meta', text: meta }));
    return node;
  }

  async function render(view) {
    view.innerHTML = '<div class="state-loading"><span class="spinner"></span> loading cockpit…</div>';
    const [cockpit, status, freshness] = await Promise.all([
      fetchFeed('cockpit'),
      fetchFeed('status'),
      fetchFeed('freshness'),
    ]);
    renderStatusStrip(status, freshness);
    view.innerHTML = '';

    if (cockpit?.__error) {
      view.appendChild(el('div', { class: 'card state-error', text: 'Could not load cockpit feed: ' + cockpit.__error }));
    }
    view.appendChild(renderHero(cockpit, status));
    view.appendChild(renderAskComposer());
    view.appendChild(renderQuickActions());
    view.appendChild(renderCritical(cockpit));
    view.appendChild(renderMeetings(cockpit));
    view.appendChild(renderDeals(cockpit, freshness));
    view.appendChild(renderSignals(cockpit));
    view.appendChild(renderAsks(cockpit));
    view.appendChild(renderTodos(cockpit));
    view.appendChild(renderHealth(status));

    const foot = el('div', { class: 'faint', attrs: { style: 'text-align:center;font-size:11px;margin:14px 0 4px' } });
    foot.textContent = `Cockpit data generated ${cockpit?.generated_at ? relTime(cockpit.generated_at) : 'unknown'} · status ${status?.generated_at ? relTime(status.generated_at) : 'unknown'}`;
    view.appendChild(foot);
  }

  global.EPMCCockpit = { render };
})(window);
