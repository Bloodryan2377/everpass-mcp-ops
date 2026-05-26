/* ============================================================
   EverPass Mobile Command Center — List / Detail sub-views
   Added 2026-05-26 (fix P2/P3/P4).
   Hash routes:
     #/list/critical  — full critical-now list
     #/list/deals     — full active-deals list
     #/list/outbox    — outbox-today summary (stub)
     #/list/inbox     — inbox-pending summary (stub)
     #/partner/<slug> — partner detail (todos + signals + insights stub)
     #/health/<slug>  — runtime health detail for a subsystem
   Renders into the existing cockpit view container so navigation stays
   inside the Cockpit tab (no new tab needed). Back = browser back.
   ============================================================ */
(function (global) {
  'use strict';
  const D = global.EPMCData;
  if (!D) return;
  const { fetchFeed, escapeHtml, el, relTime } = D;

  function parseHash() {
    const raw = (location.hash || '').replace(/^#\/?/, '');
    const parts = raw.split('?')[0].split('/').filter(Boolean);
    return parts; // e.g. ['list','critical'] or ['partner','espn']
  }

  function isListRoute() {
    const p = parseHash();
    return p[0] === 'list' || p[0] === 'partner' || p[0] === 'health';
  }

  function backLink() {
    const a = el('a', {
      class: 'list-back',
      attrs: { href: '#/cockpit', 'aria-label': 'Back to Cockpit' },
      text: '← Back to Cockpit',
    });
    return a;
  }

  function title(text, meta) {
    const node = el('div', { class: 'list-title' });
    node.appendChild(el('h2', { text }));
    if (meta) node.appendChild(el('div', { class: 'list-meta', text: meta }));
    return node;
  }

  function empty(msg) {
    return el('div', { class: 'card state-empty', text: msg });
  }

  async function render(view) {
    const parts = parseHash();
    const kind = parts[0];
    const arg = parts[1] || '';
    view.innerHTML = '<div class="state-loading"><span class="spinner"></span> loading…</div>';

    const [cockpit, status] = await Promise.all([
      fetchFeed('cockpit'),
      fetchFeed('status'),
    ]);
    view.innerHTML = '';
    view.appendChild(backLink());

    if (kind === 'list') {
      if (arg === 'critical') return renderCritical(view, cockpit);
      if (arg === 'deals')    return renderDeals(view, cockpit);
      if (arg === 'outbox')   return renderOutbox(view, status);
      if (arg === 'inbox')    return renderInbox(view, status);
      view.appendChild(title('Unknown list'));
      view.appendChild(empty('No such list: ' + arg));
      return;
    }
    if (kind === 'partner') return renderPartner(view, cockpit, arg);
    if (kind === 'health')  return renderHealth(view, status, arg);
    view.appendChild(empty('Unknown route.'));
  }

  function renderCritical(view, cockpit) {
    const items = cockpit?.morning_brief?.critical || [];
    view.appendChild(title('Critical now', cockpit?.morning_brief?.date ? `Brief ${cockpit.morning_brief.date}` : ''));
    if (!items.length) { view.appendChild(empty('No critical items in current brief.')); return; }
    const ul = el('ul', { class: 'critical-list list-stretch' });
    items.forEach((c) => {
      const li = el('li', { class: 'crit-item' });
      li.appendChild(el('div', { class: 'crit-title', text: c.title || '' }));
      li.appendChild(el('div', { class: 'crit-body',  text: c.body  || '' }));
      if (c.partner) li.appendChild(el('div', { class: 'todo-meta', text: 'Partner: ' + c.partner }));
      if (c.due)     li.appendChild(el('div', { class: 'todo-meta', text: 'Due: ' + c.due }));
      ul.appendChild(li);
    });
    view.appendChild(ul);
  }

  function renderDeals(view, cockpit) {
    const items = cockpit?.deals || [];
    view.appendChild(title('Active deals', `${items.length} tracked`));
    if (!items.length) { view.appendChild(empty('No active deal rows extracted.')); return; }
    const ul = el('ul', { class: 'deal-list list-stretch' });
    items.forEach((d) => {
      const slug = String(d.partner || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
      const li = el('li', { class: 'deal-item deal-item-link', attrs: { role: 'link', tabindex: '0' } });
      li.appendChild(el('div', { class: 'deal-partner', text: d.partner }));
      li.appendChild(el('div', { class: 'deal-state',   text: d.state || '' }));
      li.appendChild(el('div', { class: 'deal-action',  text: d.next_action || '' }));
      if (d.deadline) li.appendChild(el('div', { class: 'deal-deadline', text: 'Deadline: ' + d.deadline }));
      const go = () => { location.hash = '#/partner/' + slug; };
      li.addEventListener('click', go);
      li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      ul.appendChild(li);
    });
    view.appendChild(ul);
  }

  function renderOutbox(view, status) {
    const c = status?.bridge?.counts || {};
    view.appendChild(title('Outbox today', `${c.archived_today ?? 0} archived`));
    const card = el('div', { class: 'card' });
    card.appendChild(el('div', { class: 'subtle', text: 'Bridge run: ' + (status?.bridge?.last_run_status || 'unknown') }));
    card.appendChild(el('div', { class: 'subtle', text: 'Last artifact: ' + (status?.bridge?.last_artifact || '—') }));
    card.appendChild(el('div', { class: 'subtle', text: 'Last processed: ' + (status?.bridge?.last_processed_at ? relTime(status.bridge.last_processed_at) : '—') }));
    view.appendChild(card);
    view.appendChild(empty('Full outbox archive lives in #/results. Detail view coming soon.'));
  }

  function renderInbox(view, status) {
    const c = status?.bridge?.counts || {};
    view.appendChild(title('Inbox pending', `${c.inbox_pending ?? 0} pending`));
    const card = el('div', { class: 'card' });
    card.appendChild(el('div', { class: 'subtle', text: 'Rejected outstanding: ' + (c.rejected_outstanding ?? 0) }));
    card.appendChild(el('div', { class: 'subtle', text: 'Bridge run: ' + (status?.bridge?.last_run_status || 'unknown') }));
    view.appendChild(card);
    view.appendChild(empty('Full inbox view coming soon. Tap Dispatch to send new asks.'));
  }

  function renderPartner(view, cockpit, slug) {
    const todos = (cockpit?.partner_todos?.items || []).filter((t) => {
      const s = String(t.partner || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return s === slug;
    });
    const deals = (cockpit?.deals || []).filter((d) => {
      const s = String(d.partner || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return s === slug;
    });
    const signals = (cockpit?.bridge_signals || []).filter((s) => {
      const v = String(s.partner || s.title || '').toLowerCase();
      return v.indexOf(slug.replace(/-/g, ' ')) >= 0;
    });
    const partnerName = (todos[0]?.partner) || (deals[0]?.partner) || slug;
    view.appendChild(title(partnerName, 'Partner detail'));

    if (deals.length) {
      view.appendChild(el('div', { class: 'section-title', text: 'Deals' }));
      const ul = el('ul', { class: 'deal-list list-stretch' });
      deals.forEach((d) => {
        const li = el('li', { class: 'deal-item' });
        li.appendChild(el('div', { class: 'deal-state',  text: d.state || '' }));
        li.appendChild(el('div', { class: 'deal-action', text: d.next_action || '' }));
        if (d.deadline) li.appendChild(el('div', { class: 'deal-deadline', text: 'Deadline: ' + d.deadline }));
        ul.appendChild(li);
      });
      view.appendChild(ul);
    }

    view.appendChild(el('div', { class: 'section-title', text: 'Todos' }));
    if (!todos.length) view.appendChild(empty('No partner todos for ' + escapeHtml(partnerName) + '.'));
    else {
      const ul = el('ul', { class: 'todo-list list-stretch' });
      todos.forEach((t) => {
        const li = el('li', { class: 'todo-item' });
        li.appendChild(el('div', { class: 'todo-text', text: t.text || '' }));
        const meta = [];
        if (t.category) meta.push(t.category);
        if (t.due) meta.push('due ' + t.due);
        if (meta.length) li.appendChild(el('div', { class: 'todo-meta', text: meta.join(' · ') }));
        ul.appendChild(li);
      });
      view.appendChild(ul);
    }

    if (signals.length) {
      view.appendChild(el('div', { class: 'section-title', text: 'Signals' }));
      const ul = el('ul', { class: 'signal-list list-stretch' });
      signals.forEach((s) => {
        const li = el('li', { class: 'signal-item' });
        li.appendChild(el('div', { class: 'signal-title',   text: s.title || '' }));
        if (s.summary) li.appendChild(el('div', { class: 'signal-summary', text: s.summary }));
        ul.appendChild(li);
      });
      view.appendChild(ul);
    }
  }

  function renderHealth(view, status, slug) {
    const all = {
      'bridge-run':   { label: 'Bridge run',  value: status?.bridge?.last_run_status, src: status?.bridge },
      'morning':      { label: 'Morning',     value: status?.morning?.overall_status, src: status?.morning },
      'cockpit':      { label: 'Cockpit',     value: status?.morning?.cockpit_status, src: status?.morning },
      'drive-sync':   { label: 'Drive sync',  value: status?.morning?.drive_mirror_status, src: status?.morning },
      'notebooklm':   { label: 'NotebookLM',  value: status?.morning?.notebooklm_status, src: status?.morning },
      'self-verify':  { label: 'Self-verify', value: status?.selfverify?.overall, src: status?.selfverify },
      'last-artifact':{ label: 'Last artifact', value: status?.bridge?.last_artifact, src: status?.bridge },
    };
    const item = all[slug];
    if (!item) {
      view.appendChild(title('Runtime health', 'unknown subsystem'));
      view.appendChild(empty('No such health subsystem: ' + escapeHtml(slug)));
      return;
    }
    view.appendChild(title(item.label, 'Runtime health detail'));
    const card = el('div', { class: 'card' });
    card.appendChild(el('div', { class: 'subtle', text: 'Status: ' + (item.value || 'unknown') }));
    Object.entries(item.src || {}).forEach(([k, v]) => {
      if (v == null || typeof v === 'object') return;
      card.appendChild(el('div', { class: 'subtle', text: k + ': ' + String(v) }));
    });
    view.appendChild(card);
    view.appendChild(empty('Full subsystem log view coming soon. See desktop cockpit for raw output.'));
  }

  global.EPMCList = { render, isListRoute };
})(window);
