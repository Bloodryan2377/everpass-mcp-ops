/* ============================================================
   EverPass Mobile Command Center — Live Q&A panel
   Read-only consumer of mobile-live-qa.json (mirror of
   AI Related/live-qa/store.json). Polls every 15s while the
   tab is visible; teardown stops the loop.
   ============================================================ */
(function (global) {
  'use strict';
  const { fetchFeed, escapeHtml, el, relTime } = global.EPMCData;

  const POLL_MS = 15000;
  let pollTimer = null;
  let mountedView = null;

  function teardown() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    mountedView = null;
  }

  async function refreshOnce(view) {
    const data = await fetchFeed('liveQa', { force: true });
    if (mountedView !== view) return; // user navigated away mid-fetch
    paint(view, data);
  }

  function paint(view, data) {
    view.innerHTML = '';

    const header = el('div', { class: 'live-header' });
    header.appendChild(el('span', { class: 'live-title', text: 'Live Q&A' }));
    if (data && data.generated_at) {
      header.appendChild(el('span', { class: 'live-meta', text: 'updated ' + relTime(data.generated_at) }));
    }
    view.appendChild(header);

    if (data && data.__error) {
      const err = el('div', { class: 'card state-error' });
      err.textContent = 'Could not load Live Q&A feed: ' + data.__error;
      view.appendChild(err);
      return;
    }

    const items = (data && Array.isArray(data.items)) ? data.items : [];

    // Stub-source banner so users know we are not yet on a live transcript provider.
    const allStub = items.length > 0 && items.every((i) => i.source_kind === 'stub');
    if (allStub) {
      view.appendChild(el('div', { class: 'live-banner', text:
        'Scaffold mode — no live transcript provider connected. Showing stub answers. See AI Related/transcripts/README.md.'
      }));
    }

    if (!items.length) {
      view.appendChild(el('div', { class: 'card state-empty', text:
        'No questions captured yet. Once Granola or Fireflies is connected, questions directed at you will land here automatically.'
      }));
      return;
    }

    const list = el('ul', { class: 'live-list' });
    // Show the most recent 3 by default; allow expanding to all.
    const recent = items.slice(0, 3);
    recent.forEach((item) => list.appendChild(renderItem(item)));
    view.appendChild(list);

    if (items.length > recent.length) {
      const more = el('button', {
        class: 'btn btn-ghost btn-block',
        attrs: { type: 'button' },
        text: `Show all ${items.length} captured Q&A`,
        on: { click: () => paintAll(view, data) },
      });
      view.appendChild(more);
    }
  }

  function paintAll(view, data) {
    view.innerHTML = '';
    const header = el('div', { class: 'live-header' });
    header.appendChild(el('span', { class: 'live-title', text: 'Live Q&A — all captured' }));
    if (data && data.generated_at) {
      header.appendChild(el('span', { class: 'live-meta', text: 'updated ' + relTime(data.generated_at) }));
    }
    view.appendChild(header);
    const items = (data && Array.isArray(data.items)) ? data.items : [];
    const list = el('ul', { class: 'live-list' });
    items.forEach((it) => list.appendChild(renderItem(it)));
    view.appendChild(list);
  }

  function renderItem(item) {
    const li = el('li', { class: 'live-item' });

    const head = el('div', { class: 'live-item-head' });
    const meta = el('div', { class: 'live-item-meta' });
    if (item.speaker) meta.appendChild(el('span', { class: 'live-speaker', text: item.speaker }));
    if (item.meeting_title) meta.appendChild(el('span', { class: 'live-meeting', text: item.meeting_title }));
    if (item.ts) meta.appendChild(el('span', { class: 'live-time', text: relTime(item.ts) }));
    head.appendChild(meta);
    head.appendChild(el('span', { class: 'live-source-tag', attrs: { 'data-kind': item.source_kind || 'stub' }, text: item.source_kind || 'stub' }));
    li.appendChild(head);

    li.appendChild(el('div', { class: 'live-q', text: 'Q: ' + (item.question || '') }));
    li.appendChild(el('div', { class: 'live-a', text: 'A: ' + (item.answer || '') }));

    if (Array.isArray(item.sources) && item.sources.length) {
      const details = el('details', { class: 'live-sources' });
      const summary = el('summary', { text: `${item.sources.length} source${item.sources.length === 1 ? '' : 's'}` });
      details.appendChild(summary);
      const sourceList = el('ul', { class: 'live-source-list' });
      item.sources.forEach((s) => {
        const sli = el('li');
        const txt = s.path || s.url || s.note || s.type || '(unnamed source)';
        sli.appendChild(el('span', { class: 'live-source-type', text: (s.type || 'src') + ': ' }));
        sli.appendChild(el('span', { class: 'live-source-body', text: String(txt) }));
        sourceList.appendChild(sli);
      });
      details.appendChild(sourceList);
      li.appendChild(details);
    }
    return li;
  }

  async function render(view) {
    mountedView = view;
    view.innerHTML = '<div class="state-loading"><span class="spinner"></span> loading Live Q&A…</div>';
    try {
      await refreshOnce(view);
    } catch (e) {
      view.innerHTML = '';
      view.appendChild(el('div', { class: 'card state-error', text: 'Live Q&A render error: ' + (e.message || e) }));
    }
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      if (mountedView !== view) { teardown(); return; }
      refreshOnce(view).catch((e) => console.warn('live poll failed', e));
    }, POLL_MS);
  }

  global.EPMCLive = { render, teardown };
})(window);
