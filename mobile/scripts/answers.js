/* ============================================================
   EverPass Mobile Command Center — Answers Panel
   Renders the Ask & Answer surface from mobile-answers.json.
   Read-only view: list of asks with status + answer snippet.
   Tap an item to expand and see the full answer summary + paths.
   ============================================================ */
(function (global) {
  'use strict';
  const { fetchFeed, escapeHtml, el, relTime } = global.EPMCData;

  // Storage keys must mirror cockpit.js. The composer pushes optimistic
  // entries here; we merge them at render time and clear once the bridge
  // has produced a real Ask record with a matching correlation_id.
  const COMPOSER_PREFILL_KEY  = 'epmcc.cockpit-ask.prefill.v1';
  const OPTIMISTIC_ASKS_KEY   = 'epmcc.optimistic-asks.v1';
  const OPTIMISTIC_ASKS_TTL_MS = 7 * 24 * 3600 * 1000;

  const STATUS_KIND = {
    answered: 'ok',
    pending: 'warn',
    failed: 'danger',
    expired: 'warn',
  };

  // Glyphs are intentionally text-only (no emoji) to render consistently on
  // iOS Safari home-screen PWAs and reduce font fallback flicker.
  // - mic   = on-device dictation / freeform CLI ("dict")
  // - mail  = email-paste (manual or auto)
  // - mtg   = meeting bridge emit (Plaud / Fireflies-driven)
  // - mob   = mobile dispatch tap
  // - dot   = unknown / catch-all
  const SOURCE_GLYPH = {
    'cockpit-ask':      { glyph: 'ASK', label: 'cockpit Ask composer' },
    'cockpit-ask-live': { glyph: 'BRN', label: 'Live Ask Brain' },
    'mobile-dispatch':  { glyph: 'MOB', label: 'mobile dispatch' },
    'freeform-cli':     { glyph: 'MIC', label: 'mic / freeform CLI' },
    'manual-email':     { glyph: 'EML', label: 'email paste' },
    'bridge-emit':      { glyph: 'MTG', label: 'meeting bridge' },
    'unknown':          { glyph: '...', label: 'unknown source' },
  };
  function sourceGlyph(source) {
    return SOURCE_GLYPH[source] || SOURCE_GLYPH.unknown;
  }

  // Pretty pipeline names for the detail view ("plaud" -> "Plaud").
  const PIPELINE_LABELS = {
    'chatgpt-bridge':              'ChatGPT bridge',
    'plaud':                       'Plaud',
    'mobile-dispatch':             'Mobile Dispatch',
    'cockpit-ask':                 'Cockpit Ask',
    'live-ask-brain':              'Live Ask Brain',
    'ask-cli':                     'Ask CLI',
    'outlook-to-partner-insights': 'Outlook -> Partner Insights',
  };
  function pipelineLabel(p) { return PIPELINE_LABELS[p] || p; }

  // ---- Optimistic Asks (pushed by the cockpit composer) -------------------
  // The cockpit Ask composer writes an entry to localStorage immediately on
  // submit so the user sees their Ask thread without waiting for the bridge.
  // We merge those entries with the real feed, dedupe by correlation_id, and
  // expire stale ones.
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
  function mergeOptimistic(items) {
    // Drop optimistic entries the bridge has already absorbed; keep + prepend
    // the rest as `pending` Ask threads with `_optimistic: true`.
    const knownCorr = new Set();
    (items || []).forEach((it) => {
      if (it && it.request_correlation_id) knownCorr.add(it.request_correlation_id);
      if (it && it.answer_correlation_id)  knownCorr.add(it.answer_correlation_id);
    });
    const optimistic = loadOptimisticAsks();
    const surviving = optimistic.filter((e) => !knownCorr.has(e.correlation_id));
    if (surviving.length !== optimistic.length) saveOptimisticAsks(surviving);
    if (!surviving.length) return items || [];
    const synthetic = surviving.map((e) => {
      const isLiveBrain = e.composer_mode === 'live-brain' || e.kind === 'live-ask-brain';
      const source = isLiveBrain ? 'cockpit-ask-live' : 'cockpit-ask';
      const pipelines = isLiveBrain
        ? ['cockpit-ask', 'live-ask-brain', 'chatgpt-bridge']
        : ['cockpit-ask', 'chatgpt-bridge'];
      return {
        id: e.id || `optimistic-${e.correlation_id}`,
        created_at: e.created_at,
        answered_at: null,
        source,
        status: 'pending',
        kind: e.kind || 'freeform-research',
        kind_label: e.kind_label || (isLiveBrain ? 'Live Ask Brain' : 'Freeform Research'),
        partner: null,
        priority: 'normal',
        desired_output: isLiveBrain ? (e.desired_output || null) : null,
        question_snippet: (e.question_snippet || e.raw_text || '').slice(0, 240),
        answer_snippet: '',
        answer_kind: null,
        answer_filename: null,
        request_filename: e.filename || null,
        request_correlation_id: e.correlation_id,
        answer_correlation_id: null,
        pipelines_invoked: pipelines,
        bridge_request_ids: e.filename ? [e.filename] : [],
        bridge_answer_filenames: [],
        _optimistic: true,
      };
    });
    return synthetic.concat(items || []);
  }

  function fullTimestamp(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch (_) { return iso; }
  }

  function summaryStrip(summary) {
    const wrap = el('div', { class: 'answers-summary-strip', attrs: { 'aria-live': 'polite' } });
    const c = (summary && summary.counts) || {};
    const total = (summary && summary.total) || 0;
    const last = (summary && summary.last_answered_at) || null;

    const chip = (label, value, kind) => {
      const node = el('span', { class: `chip chip-${kind || ''}`.trim() });
      node.appendChild(el('strong', { text: String(value) }));
      node.appendChild(el('span', { text: ' ' + label }));
      return node;
    };

    wrap.appendChild(chip('total', total));
    wrap.appendChild(chip('answered', c.answered || 0, 'ok'));
    wrap.appendChild(chip('pending', c.pending || 0, c.pending ? 'warn' : ''));
    if (c.failed) wrap.appendChild(chip('failed', c.failed, 'danger'));
    if (c.expired) wrap.appendChild(chip('expired', c.expired, 'warn'));
    if (last) {
      const node = el('span', { class: 'chip chip-meta' });
      node.appendChild(el('span', { text: 'last answered ' + relTime(last) }));
      wrap.appendChild(node);
    }
    return wrap;
  }

  function statusBadge(status) {
    const kind = STATUS_KIND[status] || '';
    return el('span', { class: `answers-status ${kind}`.trim(), text: status });
  }

  function sourceTag(source) {
    if (!source) return null;
    const g = sourceGlyph(source);
    const node = el('span', { class: 'answers-source', attrs: { title: g.label } });
    node.appendChild(el('span', { class: 'answers-source-glyph', text: g.glyph }));
    node.appendChild(el('span', { class: 'answers-source-text', text: source.replace(/-/g, ' ') }));
    return node;
  }

  function partnerTag(partner) {
    if (!partner) return null;
    return el('span', { class: 'answers-partner', text: partner });
  }

  function priorityTag(priority) {
    if (!priority || priority === 'normal') return null;
    return el('span', { class: `answers-priority pri-${priority}`, text: priority });
  }

  function renderItem(item) {
    const li = el('li', {
      class: 'answers-item',
      attrs: {
        'data-id': item.id,
        'data-status': item.status,
        'data-source': item.source || 'unknown',
        'tabindex': '0',
        'role': 'button',
        'aria-expanded': 'false',
      },
    });

    const head = el('div', { class: 'answers-head' });
    const titleBits = [];
    if (item.kind_label || item.kind) titleBits.push(item.kind_label || item.kind);
    if (item.partner) titleBits.push(item.partner);
    if (titleBits.length === 0) titleBits.push('Ask');
    head.appendChild(el('div', { class: 'answers-title', text: titleBits.join(' · ') }));

    const meta = el('div', { class: 'answers-meta' });
    meta.appendChild(statusBadge(item.status));
    const src = sourceTag(item.source);
    if (src) meta.appendChild(src);
    const part = partnerTag(item.partner);
    if (part) meta.appendChild(part);
    const pri = priorityTag(item.priority);
    if (pri) meta.appendChild(pri);
    // Live Ask Brain: surface the requested output shape (wiki vs email).
    if (item.desired_output) {
      const tag = el('span', {
        class: 'answers-desired-output',
        text: item.desired_output === 'reply-email' ? 'reply-email' : 'wiki-note',
      });
      meta.appendChild(tag);
    }
    const ts = item.answered_at || item.created_at;
    if (ts) {
      meta.appendChild(el('span', {
        class: 'answers-time',
        text: relTime(ts),
        attrs: { title: fullTimestamp(ts) },
      }));
    }
    head.appendChild(meta);
    li.appendChild(head);

    if (item.question_snippet) {
      li.appendChild(el('div', { class: 'answers-question', text: item.question_snippet }));
    }
    if (item.answer_snippet) {
      li.appendChild(el('div', { class: 'answers-answer', text: item.answer_snippet }));
    }
    if (!item.answer_snippet && item.status === 'pending') {
      const pendingMsg = item._optimistic
        ? 'Just submitted from the cockpit. Still working - the answer will appear after the next bridge drain.'
        : 'Still working... awaiting bridge processing. Next drain will produce the answer.';
      li.appendChild(el('div', { class: 'answers-pending-note', text: pendingMsg }));
    }
    if (!item.answer_snippet && item.status === 'failed') {
      li.appendChild(el('div', { class: 'answers-pending-note', text: 'Bridge rejected this Ask. Check ChatGPT_Outbox/_rejected/.' }));
    }
    if (item._optimistic) {
      li.classList.add('answers-item-optimistic');
    }

    // Detail block (hidden by default; expand on click/Enter).
    const detail = renderDetail(item);
    li.appendChild(detail);

    // Tap handler: toggle the detail block.
    const toggle = (ev) => {
      // Don't capture clicks on links inside the detail block.
      if (ev && ev.target && ev.target.closest('a')) return;
      const isOpen = li.getAttribute('aria-expanded') === 'true';
      li.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    };
    li.addEventListener('click', toggle);
    li.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        toggle(ev);
      }
    });

    return li;
  }

  function renderDetail(item) {
    const wrap = el('div', { class: 'answers-detail' });

    // Full question (if longer than the snippet showed).
    if (item.question_snippet) {
      wrap.appendChild(el('div', { class: 'answers-detail-label', text: 'Question' }));
      wrap.appendChild(el('div', { class: 'answers-detail-question', text: item.question_snippet }));
    }

    // Full answer summary.
    if (item.answer_snippet) {
      wrap.appendChild(el('div', { class: 'answers-detail-label', text: 'Answer' }));
      wrap.appendChild(el('div', { class: 'answers-detail-answer', text: item.answer_snippet }));
    }

    // Pipelines invoked.
    const pipelines = (item.pipelines_invoked || []).filter(Boolean);
    if (pipelines.length) {
      wrap.appendChild(el('div', { class: 'answers-detail-label', text: 'Pipelines' }));
      const row = el('div', { class: 'answers-detail-pipelines' });
      pipelines.forEach((p) => row.appendChild(el('span', { class: 'pipeline-chip', text: pipelineLabel(p) })));
      wrap.appendChild(row);
    }

    // Timestamps row.
    const tsRow = el('div', { class: 'answers-detail-times' });
    if (item.created_at) {
      tsRow.appendChild(el('div', {
        class: 'answers-detail-time',
        html: '<span class="label">Created:</span> '
              + escapeHtml(fullTimestamp(item.created_at))
              + ' <span class="rel">(' + escapeHtml(relTime(item.created_at)) + ')</span>',
      }));
    }
    if (item.answered_at) {
      tsRow.appendChild(el('div', {
        class: 'answers-detail-time',
        html: '<span class="label">Answered:</span> '
              + escapeHtml(fullTimestamp(item.answered_at))
              + ' <span class="rel">(' + escapeHtml(relTime(item.answered_at)) + ')</span>',
      }));
    }
    if (tsRow.childElementCount) wrap.appendChild(tsRow);

    // Bridge artifact filenames (audit trail).
    const reqs = (item.bridge_request_ids || []).filter(Boolean);
    const anss = (item.bridge_answer_filenames || []).filter(Boolean);
    if (reqs.length || anss.length) {
      wrap.appendChild(el('div', { class: 'answers-detail-label', text: 'Bridge artifacts' }));
      const files = el('div', { class: 'answers-files' });
      reqs.forEach((f) => files.appendChild(el('span', { class: 'answers-file', text: 'req: ' + f })));
      anss.forEach((f) => files.appendChild(el('span', { class: 'answers-file answers-file-out', text: 'ans: ' + f })));
      wrap.appendChild(files);
    } else if (item.request_filename || item.answer_filename) {
      // Backwards-compat for older feeds without bridge_*_ids arrays.
      wrap.appendChild(el('div', { class: 'answers-detail-label', text: 'Bridge artifacts' }));
      const files = el('div', { class: 'answers-files' });
      if (item.request_filename) files.appendChild(el('span', { class: 'answers-file', text: 'req: ' + item.request_filename }));
      if (item.answer_filename) files.appendChild(el('span', { class: 'answers-file answers-file-out', text: 'ans: ' + item.answer_filename }));
      wrap.appendChild(files);
    }

    // Ask follow-up: prefills the dashboard composer with a quoted reference to
    // this Ask, then routes the user to the dashboard. Uses sessionStorage so
    // the prefill survives the hash-change navigation but doesn't persist.
    const followupRow = el('div', { class: 'answers-detail-followup' });
    const btn = el('a', {
      class: 'answers-followup-btn',
      attrs: { href: '#/dashboard', role: 'button' },
      text: 'Ask follow-up',
    });
    btn.addEventListener('click', (ev) => {
      // Don't let the row toggle eat the navigation.
      ev.stopPropagation();
      const refId = item.id || 'ask';
      const q = (item.question_snippet || '').trim();
      const a = (item.answer_snippet || '').trim();
      const lines = [`Follow-up to ${refId}:`, ''];
      if (q) lines.push('> ' + q.replace(/\n+/g, ' '));
      if (a) lines.push(...['', '(prior answer)', '> ' + a.replace(/\n+/g, ' ')]);
      lines.push('', '');
      try { sessionStorage.setItem(COMPOSER_PREFILL_KEY, lines.join('\n')); } catch (_) { /* ignore */ }
    });
    followupRow.appendChild(btn);
    wrap.appendChild(followupRow);

    return wrap;
  }

  function emptyState(message) {
    const wrap = el('div', { class: 'answers-empty' });
    wrap.appendChild(el('div', { class: 'answers-empty-title', text: 'No Ask threads yet' }));
    wrap.appendChild(el('div', { class: 'answers-empty-body', text: message || 'Type or paste anything into the Ask composer on the Dashboard tab. Threads appear here immediately and update once the bridge produces an answer.' }));
    return wrap;
  }

  function errorState(message) {
    const wrap = el('div', { class: 'answers-error' });
    wrap.appendChild(el('div', { class: 'answers-empty-title', text: 'Could not load answers feed' }));
    wrap.appendChild(el('div', { class: 'answers-empty-body', text: String(message || '') }));
    wrap.appendChild(el('div', { class: 'answers-empty-hint', text: 'Run `python AI Related/ask/ask_router.py --build` from the workstation to refresh.' }));
    return wrap;
  }

  function sectionTitle(label, meta) {
    const node = el('div', { class: 'section-title' });
    node.appendChild(el('span', { text: label }));
    if (meta) node.appendChild(el('span', { class: 'meta', text: meta }));
    return node;
  }

  async function render(view) {
    view.innerHTML = '<div class="state-loading"><span class="spinner"></span> loading answers…</div>';

    const payload = await fetchFeed('answers');

    view.innerHTML = '';

    if (payload && payload.__error) {
      view.appendChild(errorState(payload.__error));
      return;
    }

    const summary = payload && payload.summary;
    const rawItems = (payload && Array.isArray(payload.items)) ? payload.items : [];
    // Merge optimistic Asks (from the cockpit composer) so a freshly-submitted
    // Ask appears as a thread immediately, well before the bridge has run.
    const items = mergeOptimistic(rawItems);

    view.appendChild(sectionTitle('Ask threads', payload && payload.generated_at ? `as of ${relTime(payload.generated_at)}` : ''));
    view.appendChild(summaryStrip(summary));

    if (items.length === 0) {
      view.appendChild(emptyState());
      return;
    }

    const list = el('ul', { class: 'answers-list', attrs: { id: 'answers-list' } });
    items.forEach((it) => list.appendChild(renderItem(it)));
    view.appendChild(list);

    // Footer hint with refresh affordance.
    const hint = el('div', { class: 'answers-foot-hint', text: 'Pull to refresh after submitting a new Ask. Optimistic threads from this device clear once the bridge produces a real record.' });
    view.appendChild(hint);
  }

  global.EPMCAnswers = { render };
})(window);
