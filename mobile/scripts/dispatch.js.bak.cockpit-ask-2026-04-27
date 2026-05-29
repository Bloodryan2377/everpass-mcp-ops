/* ============================================================
   EverPass Mobile Command Center — Dispatch Panel
   Generates valid epc-chatgpt-bridge/request/v1 artifacts and
   ships them to the local OneDrive-synced ChatGPT_Inbox via:
     1) navigator.share with file (iOS Web Share)         ← primary on iPhone
     2) clipboard write of full markdown                  ← universal fallback
     3) anchor download of .md                            ← desktop fallback
   ============================================================ */
(function (global) {
  'use strict';
  const { fetchFeed, escapeHtml, el, relTime } = global.EPMCData;

  const RECENT_KEY = 'epmcc.recent.v1';
  const STATE_KEY = 'epmcc.dispatch.lastForm.v1';
  const MAX_RECENT = 12;

  let options = null;
  let formState = {
    kind: 'partner-intel-pull',
    partner: '',
    time_window: '',
    priority: 'normal',
    instruction: '',
    constraints: '',
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) Object.assign(formState, JSON.parse(raw));
    } catch (e) { /* ignore */ }
  }
  function persistState() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(formState)); } catch (e) { /* ignore */ }
  }

  function loadRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (e) { return []; }
  }
  function pushRecent(entry) {
    const list = loadRecent();
    list.unshift(entry);
    while (list.length > MAX_RECENT) list.pop();
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  }
  function updateRecentStatus(correlation_id, status) {
    const list = loadRecent();
    const idx = list.findIndex((r) => r.correlation_id === correlation_id);
    if (idx >= 0) {
      list[idx].status = status;
      list[idx].status_at = new Date().toISOString();
      localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    }
  }

  function shortHex(n) {
    const bytes = new Uint8Array(n);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, n);
  }

  function todayIsoDate() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function buildRequest(state) {
    const kind = state.kind;
    const kindDef = (options?.request_kinds || []).find((k) => k.id === kind) || {};
    const ts = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    const expires = new Date(Date.now() + 48 * 3600 * 1000).toISOString().replace(/\.\d+Z$/, 'Z');
    const slugBase = (kindDef.needs_partner && state.partner)
      ? state.partner
      : (kind.replace('-pull', '').replace('-research', 'research'));
    const slug = String(slugBase).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'request';
    const correlation_id = `cl-${todayIsoDate().replaceAll('-', '')}-${slug}-${shortHex(6)}`;
    const filename = `${todayIsoDate()}-${kind}-${slug}.md`;

    const fm = [
      'schema: epc-chatgpt-bridge/request/v1',
      `request_kind: ${kind}`,
      `requested_at: ${ts}`,
      'requested_by: claude-code',
      `correlation_id: ${correlation_id}`,
      `target_artifact_kind: ${kindDef.target_artifact_kind || ''}`,
      `expected_target_skill: ${kindDef.expected_target_skill || ''}`,
      `priority: ${state.priority || 'normal'}`,
      `expires_at: ${expires}`,
    ];
    if (kindDef.needs_partner && state.partner) fm.push(`partner: ${state.partner}`);
    if (state.time_window) fm.push(`time_window: ${state.time_window}`);
    fm.push('source: epmcc/mobile-command-center/v1');

    const constraints = (state.constraints || '').split('\n').map((s) => s.trim()).filter(Boolean);
    const constraintsBlock = constraints.length
      ? '\n## Constraints\n' + constraints.map((c) => `- ${c}`).join('\n') + '\n'
      : '';

    const titleBits = [];
    if (kindDef.label) titleBits.push(kindDef.label);
    if (state.partner) titleBits.push(state.partner);
    titleBits.push('mobile dispatch');
    const heading = titleBits.join(' — ');

    const body = `\n# ${heading}\n\n## Instruction\n${(state.instruction || '').trim() || '(no instruction provided)'}\n${constraintsBlock}\n## Routing\n- correlation_id: \`${correlation_id}\`\n- expected outbox correlation_id: \`${correlation_id.replace(/^cl-/, 'cg-')}\`\n- expected target skill: \`${kindDef.expected_target_skill || ''}\`\n- expected artifact kind: \`${kindDef.target_artifact_kind || ''}\`\n`;

    const markdown = `---\n${fm.join('\n')}\n---\n${body}`;

    return { markdown, filename, correlation_id, kind, partner: state.partner || null };
  }

  function validate(state) {
    const errs = [];
    const kindDef = (options?.request_kinds || []).find((k) => k.id === state.kind);
    if (!kindDef) errs.push('Choose a request kind.');
    else {
      if (kindDef.needs_partner && !state.partner) errs.push('This request kind requires a partner.');
    }
    if (!state.instruction || state.instruction.trim().length < 8) {
      errs.push('Add an instruction (at least one sentence).');
    }
    return errs;
  }

  function showToast(text, kind) {
    const t = document.getElementById('toast');
    t.textContent = text;
    t.dataset.kind = kind || 'info';
    t.hidden = false;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.hidden = true; }, 3500);
  }

  async function shareRequest(req) {
    if (!('share' in navigator)) return { ok: false, reason: 'web-share-unsupported' };
    try {
      const file = new File([req.markdown], req.filename, { type: 'text/markdown' });
      const data = {
        files: [file],
        title: req.filename,
        text: 'Save into OneDrive\\EVERPASS\\EVERPASS TOOLS\\AI Related\\ChatGPT_Inbox\\',
      };
      if ('canShare' in navigator && !navigator.canShare(data)) {
        return { ok: false, reason: 'cannot-share-files' };
      }
      await navigator.share(data);
      return { ok: true };
    } catch (err) {
      if (err && err.name === 'AbortError') return { ok: false, reason: 'aborted' };
      return { ok: false, reason: err.message || String(err) };
    }
  }

  async function copyRequest(req) {
    try {
      await navigator.clipboard.writeText(req.markdown);
      return { ok: true };
    } catch (err) {
      return { ok: false, reason: err.message || String(err) };
    }
  }

  function downloadRequest(req) {
    const blob = new Blob([req.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = req.filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 200);
    return { ok: true };
  }

  function renderKindGrid(view) {
    const grid = el('div', { class: 'kind-grid', attrs: { role: 'radiogroup', 'aria-label': 'Request kind' } });
    (options?.request_kinds || []).forEach((k) => {
      const btn = el('button', {
        class: 'kind-card',
        attrs: { type: 'button', role: 'radio', 'aria-pressed': formState.kind === k.id ? 'true' : 'false', 'data-kind': k.id },
        on: { click: () => {
          formState.kind = k.id;
          if (k.default_window) formState.time_window = k.default_window;
          persistState();
          renderForm(view);
        } },
      });
      btn.appendChild(el('span', { class: 'kind-title', text: k.label }));
      btn.appendChild(el('span', { class: 'kind-sub', text: k.description }));
      grid.appendChild(btn);
    });
    return grid;
  }

  function renderForm(view) {
    stopMic();
    view.innerHTML = '';
    const inboxHint = el('div', { class: 'inbox-hint' });
    inboxHint.innerHTML = `Submissions queue into <code>${escapeHtml(options?.inbox_path_hint || 'ChatGPT_Inbox\\\\')}</code>. The next bridge drain (manual or 8:55 AM cron) processes them locally.`;
    view.appendChild(inboxHint);

    view.appendChild(sectionTitle('Choose request kind'));
    view.appendChild(renderKindGrid(view));

    const card = el('div', { class: 'card' });
    const form = el('div', { class: 'form-grid' });

    const kindDef = (options?.request_kinds || []).find((k) => k.id === formState.kind);

    if (kindDef?.needs_partner) {
      const row = el('div', { class: 'form-row' });
      row.appendChild(el('label', { attrs: { for: 'f-partner' }, text: 'Partner' }));
      const select = el('select', { attrs: { id: 'f-partner' }, on: {
        change: (e) => { formState.partner = e.target.value; persistState(); refreshPreview(); },
      } });
      select.appendChild(el('option', { attrs: { value: '' }, text: '— pick a partner —' }));
      const groups = {};
      (options.partners || []).forEach((p) => {
        const tk = p.type_label || 'Other';
        if (!groups[tk]) groups[tk] = [];
        groups[tk].push(p);
      });
      Object.entries(groups).forEach(([label, list]) => {
        const og = el('optgroup', { attrs: { label } });
        list.forEach((p) => {
          const opt = el('option', { attrs: { value: p.id, selected: formState.partner === p.id ? 'selected' : null }, text: p.title });
          og.appendChild(opt);
        });
        select.appendChild(og);
      });
      row.appendChild(select);
      form.appendChild(row);
    }

    const winRow = el('div', { class: 'form-row' });
    winRow.appendChild(el('label', { attrs: { for: 'f-window' }, text: 'Time window (optional)' }));
    winRow.appendChild(el('input', {
      attrs: { id: 'f-window', type: 'text', value: formState.time_window || '', placeholder: kindDef?.default_window || 'last 14 days' },
      on: { input: (e) => { formState.time_window = e.target.value; persistState(); refreshPreview(); } },
    }));
    form.appendChild(winRow);

    const priRow = el('div', { class: 'form-row' });
    priRow.appendChild(el('label', { attrs: { for: 'f-priority' }, text: 'Priority' }));
    const priSelect = el('select', { attrs: { id: 'f-priority' }, on: {
      change: (e) => { formState.priority = e.target.value; persistState(); refreshPreview(); },
    } });
    (options?.priority_levels || ['high','normal','low']).forEach((p) => {
      priSelect.appendChild(el('option', { attrs: { value: p, selected: formState.priority === p ? 'selected' : null }, text: p }));
    });
    priRow.appendChild(priSelect);
    form.appendChild(priRow);

    const instrRow = el('div', { class: 'form-row' });
    const labelRow = el('div', { class: 'label-row' });
    labelRow.appendChild(el('label', { attrs: { for: 'f-instruction' }, text: 'Instruction' }));
    const micBtn = el('button', {
      class: 'mic-btn',
      attrs: { type: 'button', id: 'f-mic-btn', 'aria-label': 'Dictate instruction', 'aria-pressed': 'false', title: 'Dictate (tap to start/stop)' },
    });
    micBtn.appendChild(el('span', { class: 'mic-icon', attrs: { 'aria-hidden': 'true' }, text: '🎙️' }));
    labelRow.appendChild(micBtn);
    instrRow.appendChild(labelRow);
    const instrTa = el('textarea', {
      attrs: { id: 'f-instruction', placeholder: 'Ryan-voice ask. What do you want Claude to produce?' },
      on: { input: (e) => { formState.instruction = e.target.value; persistState(); refreshPreview(); } },
    });
    instrTa.value = formState.instruction || '';
    instrRow.appendChild(instrTa);
    const micStatus = el('div', { class: 'mic-status', attrs: { id: 'f-mic-status', role: 'status', 'aria-live': 'polite' } });
    instrRow.appendChild(micStatus);
    instrRow.appendChild(el('div', { class: 'hint', text: 'Aggressive compression, no em dashes, semicolons preferred.' }));
    form.appendChild(instrRow);
    wireMic(micBtn, instrTa, micStatus);

    const conRow = el('div', { class: 'form-row' });
    conRow.appendChild(el('label', { attrs: { for: 'f-constraints' }, text: 'Constraints (one per line, optional)' }));
    const conTa = el('textarea', {
      attrs: { id: 'f-constraints', placeholder: 'No PII beyond Partner Insights\nIf nothing material, produce a 1-paragraph "no material movement" artifact' },
      on: { input: (e) => { formState.constraints = e.target.value; persistState(); refreshPreview(); } },
    });
    conTa.value = formState.constraints || '';
    conRow.appendChild(conTa);
    form.appendChild(conRow);

    card.appendChild(form);
    view.appendChild(card);

    view.appendChild(sectionTitle('Preview'));
    const preview = el('div', { class: 'preview', attrs: { id: 'request-preview', 'aria-live': 'polite' } });
    view.appendChild(preview);

    const actions = el('div', { class: 'dispatch-actions' });
    actions.appendChild(el('button', { class: 'btn btn-primary btn-block', attrs: { type: 'button', id: 'btn-share' }, text: 'Save to OneDrive (Share)' }));
    actions.appendChild(el('button', { class: 'btn btn-block', attrs: { type: 'button', id: 'btn-copy' }, text: 'Copy markdown' }));
    actions.appendChild(el('button', { class: 'btn btn-ghost btn-block', attrs: { type: 'button', id: 'btn-download' }, text: 'Download .md' }));
    view.appendChild(actions);

    document.getElementById('btn-share').addEventListener('click', onSubmit('share'));
    document.getElementById('btn-copy').addEventListener('click', onSubmit('copy'));
    document.getElementById('btn-download').addEventListener('click', onSubmit('download'));

    view.appendChild(sectionTitle('Recent submissions (this device)'));
    view.appendChild(renderRecent());

    refreshPreview();
  }

  // ---- Web Speech API mic input ----
  // Safari note (as of iOS 17+): Safari supports webkitSpeechRecognition but
  // requires user-initiated start, returns interim results inconsistently, and
  // auto-stops after a short silence. We only commit on `final` results to
  // avoid overwriting interim text the user later edits manually. Chrome on
  // Android works the same. Firefox: unsupported as of writing — button hides.
  let micRec = null;
  let micActive = false;

  function getSpeechRecognitionCtor() {
    return global.SpeechRecognition || global.webkitSpeechRecognition || null;
  }

  function setMicStatus(statusEl, text, kind) {
    if (!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.dataset.kind = kind || '';
  }

  function appendDictation(textarea, chunk) {
    if (!chunk) return;
    const trimmed = chunk.trim();
    if (!trimmed) return;
    const cur = textarea.value || '';
    const sep = cur.length === 0 ? '' : (/\s$/.test(cur) ? '' : ' ');
    textarea.value = cur + sep + trimmed;
    // fire input so existing handler persists state + refreshes preview
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function stopMic() {
    if (micRec && micActive) {
      try { micRec.stop(); } catch (e) { /* ignore */ }
    }
    micActive = false;
  }

  function wireMic(btn, textarea, statusEl) {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      btn.hidden = true;
      btn.disabled = true;
      setMicStatus(statusEl, 'Voice input unavailable in this browser.', 'warn');
      return;
    }
    btn.addEventListener('click', () => {
      if (micActive) { stopMic(); return; }
      try {
        micRec = new Ctor();
      } catch (err) {
        setMicStatus(statusEl, 'Mic init failed: ' + (err.message || err), 'error');
        return;
      }
      micRec.lang = (navigator.language || 'en-US');
      micRec.continuous = true;
      micRec.interimResults = true;
      micRec.maxAlternatives = 1;

      micRec.onstart = () => {
        micActive = true;
        btn.setAttribute('aria-pressed', 'true');
        btn.classList.add('mic-active');
        setMicStatus(statusEl, 'Listening… tap mic again to stop.', 'live');
      };
      micRec.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) appendDictation(textarea, r[0]?.transcript || '');
        }
      };
      micRec.onerror = (e) => {
        const code = e.error || 'unknown';
        const msg = code === 'not-allowed'
          ? 'Microphone permission denied.'
          : code === 'no-speech'
            ? 'No speech detected.'
            : 'Mic error: ' + code;
        setMicStatus(statusEl, msg, 'error');
      };
      micRec.onend = () => {
        micActive = false;
        btn.setAttribute('aria-pressed', 'false');
        btn.classList.remove('mic-active');
        // Only clear status if no error message was set in this session.
        if (statusEl && statusEl.dataset.kind === 'live') {
          setMicStatus(statusEl, 'Stopped.', '');
        }
      };
      try {
        micRec.start();
      } catch (err) {
        setMicStatus(statusEl, 'Could not start mic: ' + (err.message || err), 'error');
      }
    });
  }

  function refreshPreview() {
    const preview = document.getElementById('request-preview');
    if (!preview) return;
    try {
      const req = buildRequest(formState);
      preview.textContent = `${req.filename}\n\n${req.markdown}`;
    } catch (err) {
      preview.textContent = 'preview error: ' + err.message;
    }
  }

  function onSubmit(mode) {
    return async () => {
      const errs = validate(formState);
      if (errs.length) { showToast(errs[0], 'error'); return; }
      const req = buildRequest(formState);
      const recentEntry = {
        correlation_id: req.correlation_id,
        filename: req.filename,
        kind: req.kind,
        partner: req.partner,
        submitted_at: new Date().toISOString(),
        mode,
        status: 'pending',
      };
      pushRecent(recentEntry);

      let result;
      if (mode === 'share') {
        result = await shareRequest(req);
        if (!result.ok && result.reason === 'web-share-unsupported') {
          // fall back to download silently with toast
          result = downloadRequest(req);
          updateRecentStatus(req.correlation_id, 'downloaded');
          showToast('Web Share not available; downloaded instead.', 'info');
          renderRecentInto();
          return;
        }
        if (!result.ok && result.reason === 'aborted') {
          updateRecentStatus(req.correlation_id, 'cancelled');
          showToast('Share cancelled.', 'info');
          renderRecentInto();
          return;
        }
        if (!result.ok) {
          updateRecentStatus(req.correlation_id, 'error');
          showToast('Share failed: ' + result.reason, 'error');
          renderRecentInto();
          return;
        }
        updateRecentStatus(req.correlation_id, 'shared');
        showToast('Shared. Save into ChatGPT_Inbox folder.', 'success');
      } else if (mode === 'copy') {
        result = await copyRequest(req);
        if (!result.ok) { updateRecentStatus(req.correlation_id, 'error'); showToast('Copy failed: ' + result.reason, 'error'); renderRecentInto(); return; }
        updateRecentStatus(req.correlation_id, 'copied');
        showToast('Markdown copied. Paste into ChatGPT_Inbox.', 'success');
      } else if (mode === 'download') {
        downloadRequest(req);
        updateRecentStatus(req.correlation_id, 'downloaded');
        showToast('Downloaded ' + req.filename, 'success');
      }
      renderRecentInto();
    };
  }

  function renderRecent() {
    const list = el('ul', { class: 'recent-list', attrs: { id: 'recent-list' } });
    const recent = loadRecent();
    if (!recent.length) {
      const empty = el('li', { class: 'state-empty', text: 'No submissions yet from this device.' });
      list.appendChild(empty);
      return list;
    }
    recent.forEach((r) => {
      const li = el('li', { class: 'recent-item' });
      li.appendChild(el('div', { class: 'recent-title', text: `${r.kind}${r.partner ? ' · ' + r.partner : ''}` }));
      li.appendChild(el('div', { class: `recent-status ${r.status || ''}`, text: r.status || 'pending' }));
      li.appendChild(el('div', { class: 'recent-id', text: r.correlation_id }));
      li.appendChild(el('div', { class: 'recent-time', text: r.submitted_at ? relTime(r.submitted_at) : '' }));
      list.appendChild(li);
    });
    return list;
  }

  function renderRecentInto() {
    const old = document.getElementById('recent-list');
    if (!old) return;
    const fresh = renderRecent();
    old.replaceWith(fresh);
  }

  function sectionTitle(label, meta) {
    const node = el('div', { class: 'section-title' });
    node.appendChild(el('span', { text: label }));
    if (meta) node.appendChild(el('span', { class: 'meta', text: meta }));
    return node;
  }

  function parseHashParams(hash) {
    const i = hash.indexOf('?');
    if (i === -1) return {};
    const out = {};
    new URLSearchParams(hash.slice(i + 1)).forEach((v, k) => { out[k] = v; });
    return out;
  }

  async function render(view) {
    loadState();
    view.innerHTML = '<div class="state-loading"><span class="spinner"></span> loading dispatch…</div>';
    options = await fetchFeed('options');
    if (options?.__error) {
      view.innerHTML = '';
      view.appendChild(el('div', { class: 'card state-error', text: 'Could not load dispatch options: ' + options.__error }));
      return;
    }
    const hashParams = parseHashParams(location.hash);
    if (hashParams.kind && (options.request_kinds || []).some((k) => k.id === hashParams.kind)) {
      formState.kind = hashParams.kind;
      const def = options.request_kinds.find((k) => k.id === hashParams.kind);
      if (def?.default_window && !formState.time_window) formState.time_window = def.default_window;
      persistState();
    }
    renderForm(view);
  }

  global.EPMCDispatch = { render, _build: buildRequest };
})(window);
