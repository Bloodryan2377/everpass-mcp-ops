/* ============================================================
   EverPass Mobile Command Center — List / Detail sub-views
   Added 2026-05-26 (fix P2/P3/P4). Extended 2026-05-26 (pills + freshness).
   Hash routes:
     #/list/critical    — full critical-now list
     #/list/deals       — full active-deals list
     #/list/outbox      — outbox-today summary (stub)
     #/list/inbox       — inbox-pending summary (stub)
     #/list/rejected    — rejected asks detail
     #/partner/<slug>   — partner detail (todos + signals + insights stub)
     #/health/<slug>    — runtime health detail for a subsystem
     #/health/freshness — per-source freshness drill-down (which 2 of 29 are stale)
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
    return parts;
  }

  function isListRoute() {
    const p = parseHash();
    return p[0] === 'list' || p[0] === 'partner' || p[0] === 'health';
  }

  function backLink() {
    return el('a', {
      class: 'list-back',
      attrs: { href: '#/cockpit', 'aria-label': 'Back to Cockpit' },
      text: '← Back to Cockpit',
    });
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
    view.innerHTML = '<div class="state-loading"><span class="spinner"></span> loading...</div>';

    const [cockpit, status, freshness] = await Promise.all([
      fetchFeed('cockpit'),
      fetchFeed('status'),
      fetchFeed('freshness'),
    ]);
    view.innerHTML = '';
    view.appendChild(backLink());

    if (kind === 'list') {
      if (arg === 'critical') return renderCritical(view, cockpit);
      if (arg === 'deals')    return renderDeals(view, cockpit);
      if (arg === 'outbox')   return renderOutbox(view, status);
      if (arg === 'inbox')    return renderInbox(view, status);
      if (arg === 'rejected') return renderRejected(view, status);
      view.appendChild(title('Unknown list'));
      view.appendChild(empty('No such list: ' + arg));
      return;
    }
    if (kind === 'partner') return renderPartner(view, cockpit, arg);
    if (kind === 'health') {
      if (arg === 'freshness') return renderFreshness(view, freshness);
      return renderHealth(view, status, arg);
    }
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
    card.appendChild(el('div', { class: 'subtle', text: 'Last artifact: ' + (status?.bridge?.last_artifact || '-') }));
    card.appendChild(el('div', { class: 'subtle', text: 'Last processed: ' + (status?.bridge?.last_processed_at ? relTime(status.bridge.last_processed_at) : '-') }));
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

  // 2026-05-26 P1: rejected-outstanding drill-down. The mobile feed surfaces
  // counts via status.bridge.counts.rejected_outstanding plus optional detail
  // arrays in status.bridge.rejected and status.bridge.rejected_items. We
  // render whatever shape the feed produced; falls back to count + advice.
  function renderRejected(view, status) {
    const c = status?.bridge?.counts || {};
    const items = (status?.bridge?.rejected_items
                || status?.bridge?.rejected
                || status?.rejected
                || []);
    view.appendChild(title('Rejected asks', `${c.rejected_outstanding ?? items.length ?? 0} outstanding`));
    if (!items.length) {
      const card = el('div', { class: 'card' });
      card.appendChild(el('div', { class: 'subtle', text: 'Outstanding count: ' + (c.rejected_outstanding ?? 0) }));
      card.appendChild(el('div', { class: 'subtle', text: 'Bridge run: ' + (status?.bridge?.last_run_status || 'unknown') }));
      card.appendChild(el('div', { class: 'subtle', text: 'Last artifact: ' + (status?.bridge?.last_artifact || '-') }));
      view.appendChild(card);
      view.appendChild(empty('No per-item detail in mobile feed. See ChatGPT_Outbox/_rejected/ on desktop for raw payloads.'));
      return;
    }
    const ul = el('ul', { class: 'recent-list list-stretch' });
    items.forEach((r) => {
      const li = el('li', { class: 'recent-item' });
      li.appendChild(el('div', { class: 'recent-title', text: r.title || r.kind || r.correlation_id || 'rejected ask' }));
      li.appendChild(el('div', { class: 'recent-status', text: r.reason || 'rejected' }));
      if (r.correlation_id) li.appendChild(el('div', { class: 'recent-id', text: r.correlation_id }));
      if (r.rejected_at)    li.appendChild(el('div', { class: 'recent-time', text: relTime(r.rejected_at) }));
      ul.appendChild(li);
    });
    view.appendChild(ul);
  }

  // 2026-05-26 P3: freshness drill-down. Lists every artifact tracked by
  // Scripts/freshness_enforcer.py with its current status. Stale + warn rows
  // float to the top so the operator can see which 2 of 29 are red at a glance.
  function renderFreshness(view, freshness) {
    if (!freshness || freshness.__error) {
      view.appendChild(title('Chain freshness', 'unavailable'));
      view.appendChild(empty('Freshness feed not readable: ' + (freshness?.__error || 'unknown')));
      return;
    }
    const totals = freshness.totals || {};
    const fresh = totals.fresh | 0;
    const warn  = totals.warn  | 0;
    const stale = totals.stale | 0;
    const miss  = totals.missing | 0;
    const n     = (totals.total | 0) || (fresh + warn + stale + miss);
    const meta = (freshness.overall || '?') + ' · ' + fresh + ' fresh / ' + warn + ' warn / ' + stale + ' stale / ' + miss + ' missing · ' + n + ' total';
    view.appendChild(title('Chain freshness', meta));

    const ruleCard = el('div', { class: 'card' });
    ruleCard.appendChild(el('div', { class: 'subtle', text: 'Rule: ' + (freshness.rule || 'user-facing artifacts must be <= 12h old') }));
    if (freshness.generated_at) ruleCard.appendChild(el('div', { class: 'subtle', text: 'Generated: ' + relTime(freshness.generated_at) }));
    if (freshness.backend_overall) ruleCard.appendChild(el('div', { class: 'subtle', text: 'Backend overall: ' + freshness.backend_overall }));
    view.appendChild(ruleCard);

    const rank = { stale: 0, missing: 1, warn: 2, fresh: 3 };
    const rows = (freshness.artifacts || []).slice().sort((a, b) => {
      const sa = (a.post?.status || a.pre?.status || 'fresh');
      const sb = (b.post?.status || b.pre?.status || 'fresh');
      const ra = rank[sa] ?? 9;
      const rb = rank[sb] ?? 9;
      if (ra !== rb) return ra - rb;
      return (a.key || '').localeCompare(b.key || '');
    });
    if (!rows.length) {
      view.appendChild(empty('No per-artifact rows in freshness feed.'));
      return;
    }
    const ul = el('ul', { class: 'fresh-list list-stretch' });
    rows.forEach((r) => {
      const s = (r.post?.status || r.pre?.status || 'unknown');
      const ageH = r.post?.age_hours ?? r.pre?.age_hours;
      const ageStr = (typeof ageH === 'number')
        ? (ageH < 1 ? Math.round(ageH * 60) + 'm' : ageH.toFixed(1) + 'h')
        : '-';
      const dot = ({ fresh: 'ok', warn: 'warn', stale: 'danger', missing: 'danger' })[s] || 'info';
      const li = el('li', { class: 'fresh-item' });
      li.appendChild(el('span', { class: 'chip dot ' + dot, text: s }));
      li.appendChild(el('div', { class: 'fresh-key', text: r.key || '(unkeyed)' }));
      const metaBits = [r.category || 'misc', 'age ' + ageStr];
      if (r.user_facing) metaBits.push('user-facing');
      if (r.manual_only) metaBits.push('manual');
      li.appendChild(el('div', { class: 'fresh-meta', text: metaBits.join(' · ') }));
      if (r.notes) li.appendChild(el('div', { class: 'fresh-notes', text: r.notes }));
      ul.appendChild(li);
    });
    view.appendChild(ul);
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
