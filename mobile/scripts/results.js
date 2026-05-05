/* ============================================================
   EverPass Mobile Command Center — Result Surface
   ============================================================ */
(function (global) {
  'use strict';
  const { fetchFeed, escapeHtml, el, relTime } = global.EPMCData;

  const filterState = { kind: 'all', partner: 'all' };
  let cached = null;

  function sectionTitle(label, meta) {
    const node = el('div', { class: 'section-title' });
    node.appendChild(el('span', { text: label }));
    if (meta) node.appendChild(el('span', { class: 'meta', text: meta }));
    return node;
  }

  function chipRow(label, options, selected, onPick) {
    const wrap = el('div', { class: 'filter-row', attrs: { role: 'group', 'aria-label': label } });
    options.forEach((opt) => {
      const btn = el('button', {
        class: 'filter-chip',
        attrs: { type: 'button', 'aria-pressed': selected === opt.value ? 'true' : 'false' },
        text: opt.label,
        on: { click: () => onPick(opt.value) },
      });
      wrap.appendChild(btn);
    });
    return wrap;
  }

  function applyFilter(items) {
    return items.filter((it) => {
      if (filterState.kind !== 'all' && it.kind !== filterState.kind) return false;
      if (filterState.partner !== 'all' && it.partner !== filterState.partner) return false;
      return true;
    });
  }

  function renderResultItem(it) {
    const li = el('li', { class: 'result-item', attrs: { 'data-corr': it.correlation_id || '' } });
    const head = el('div', { class: 'result-head' });
    head.appendChild(el('div', { class: 'result-title', text: it.title || it.filename || '(untitled)' }));
    head.appendChild(el('div', { class: 'result-kind', text: it.kind || '' }));
    li.appendChild(head);
    if (it.summary) li.appendChild(el('div', { class: 'result-summary', text: it.summary }));
    const meta = el('div', { class: 'result-meta' });
    if (it.partner) meta.appendChild(el('span', { class: 'pill partner', text: it.partner }));
    if (it.confidence) meta.appendChild(el('span', { class: `pill confidence-${it.confidence}`, text: 'confidence ' + it.confidence }));
    const reviewFlag = String(it.needs_review).toLowerCase() === 'true';
    if (reviewFlag) meta.appendChild(el('span', { class: 'pill review', text: 'needs review' }));
    if (it.produced_at) meta.appendChild(el('span', { class: 'pill', text: relTime(it.produced_at) }));
    if (it.date_dir) meta.appendChild(el('span', { class: 'pill', text: it.date_dir }));
    li.appendChild(meta);
    li.appendChild(el('div', { class: 'mono faint', attrs: { style: 'margin-top:8px' }, text: it.filename || '' }));
    return li;
  }

  async function render(view) {
    view.innerHTML = '<div class="state-loading"><span class="spinner"></span> loading results…</div>';
    cached = await fetchFeed('results');
    view.innerHTML = '';

    if (cached?.__error) {
      view.appendChild(el('div', { class: 'card state-error', text: 'Could not load results feed: ' + cached.__error }));
      return;
    }

    view.appendChild(sectionTitle('Latest results', `${cached?.count || 0} in archive`));

    // kind filter
    const kindOpts = [{ value: 'all', label: 'all kinds' }];
    Object.keys(cached?.by_kind || {}).forEach((k) => kindOpts.push({ value: k, label: `${k} · ${cached.by_kind[k]}` }));
    view.appendChild(chipRow('Kind filter', kindOpts, filterState.kind, (v) => { filterState.kind = v; rerenderList(view); }));

    // partner filter (only if any partners present)
    const partnerKeys = Object.keys(cached?.by_partner || {});
    if (partnerKeys.length) {
      const partnerOpts = [{ value: 'all', label: 'all partners' }];
      partnerKeys.forEach((p) => partnerOpts.push({ value: p, label: `${p} · ${cached.by_partner[p]}` }));
      view.appendChild(chipRow('Partner filter', partnerOpts, filterState.partner, (v) => { filterState.partner = v; rerenderList(view); }));
    }

    rerenderList(view);

    const foot = el('div', { class: 'faint', attrs: { style: 'text-align:center;font-size:11px;margin:14px 0 4px' } });
    foot.textContent = `Generated ${cached?.generated_at ? relTime(cached.generated_at) : 'unknown'}`;
    view.appendChild(foot);
  }

  function rerenderList(view) {
    let listWrap = document.getElementById('result-list-wrap');
    if (!listWrap) {
      listWrap = el('div', { attrs: { id: 'result-list-wrap' } });
      view.appendChild(listWrap);
    }
    listWrap.innerHTML = '';
    const items = applyFilter(cached?.items || []);
    if (!items.length) {
      listWrap.appendChild(el('div', { class: 'card state-empty', text: 'No results match this filter.' }));
      return;
    }
    const ul = el('ul', { class: 'results-list' });
    items.forEach((it) => ul.appendChild(renderResultItem(it)));
    listWrap.appendChild(ul);
  }

  global.EPMCResults = { render };
})(window);
