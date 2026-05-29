/* ============================================================
   EverPass Mobile Command Center — data layer
   Strict rules:
     - never fabricate data
     - never silently fail (always surface stale/missing/error)
     - all fetches go through this module so the SW can intercept consistently
   ============================================================ */
(function (global) {
  'use strict';

  const FEEDS = {
    status:   '../data/mobile/mobile-status.json',
    cockpit:  '../data/mobile/mobile-cockpit.json',
    results:  '../data/mobile/mobile-results.json',
    options:  '../data/mobile/mobile-dispatch-options.json',
    index:    '../data/mobile/mobile-feed-index.json',
    liveQa:   '../data/mobile/mobile-live-qa.json',
    answers:  '../data/mobile/mobile-answers.json',
    // Mirror of EVERPASS TOOLS/AI Related/health/freshness-status.json,
    // written every 2h by Scripts/freshness_enforcer.py (scheduled task
    // "EverPass Freshness Enforcer"). Same shape as the desktop chip
    // reads — green/amber/red against the 12h global staleness rule.
    freshness:'../data/mobile/freshness-status.json',
  };

  const cache = new Map();
  const subscribers = new Map();

  async function fetchFeed(name, { force = false } = {}) {
    const url = FEEDS[name];
    if (!url) throw new Error(`unknown feed: ${name}`);
    if (!force && cache.has(name)) return cache.get(name);
    const t0 = performance.now();
    let payload;
    try {
      const res = await fetch(`${url}?_=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      payload = await res.json();
      payload.__fetched_at = new Date().toISOString();
      payload.__source = url;
      payload.__latency_ms = Math.round(performance.now() - t0);
    } catch (err) {
      payload = {
        __error: err.message || String(err),
        __fetched_at: new Date().toISOString(),
        __source: url,
      };
    }
    cache.set(name, payload);
    notify(name, payload);
    return payload;
  }

  async function fetchAll(opts) {
    const names = Object.keys(FEEDS);
    return Promise.all(names.map((n) => fetchFeed(n, opts).then((p) => [n, p])))
      .then((entries) => Object.fromEntries(entries));
  }

  function getCached(name) { return cache.get(name); }

  function subscribe(name, handler) {
    if (!subscribers.has(name)) subscribers.set(name, new Set());
    subscribers.get(name).add(handler);
    if (cache.has(name)) {
      try { handler(cache.get(name)); } catch (e) { console.error(e); }
    }
    return () => subscribers.get(name).delete(handler);
  }

  function notify(name, payload) {
    const subs = subscribers.get(name);
    if (!subs) return;
    subs.forEach((h) => { try { h(payload); } catch (e) { console.error(e); } });
  }

  // ---- formatting helpers shared by all surfaces ----

  function relTime(iso) {
    if (!iso) return 'unknown';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return iso;
    const delta = (Date.now() - t) / 1000;
    if (delta < 60) return 'just now';
    if (delta < 3600) return `${Math.round(delta / 60)} min ago`;
    if (delta < 86400) return `${Math.round(delta / 3600)} h ago`;
    if (delta < 86400 * 7) return `${Math.round(delta / 86400)} d ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function freshnessLabel(iso, { stale = 60 * 60 * 6, danger = 60 * 60 * 24 } = {}) {
    if (!iso) return { label: 'unknown', kind: 'warn' };
    const ageSec = (Date.now() - new Date(iso).getTime()) / 1000;
    if (Number.isNaN(ageSec)) return { label: iso, kind: 'warn' };
    let kind = 'ok';
    if (ageSec > danger) kind = 'danger';
    else if (ageSec > stale) kind = 'warn';
    return { label: relTime(iso), kind };
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function el(tag, opts = {}, children = []) {
    const node = document.createElement(tag);
    if (opts.class) node.className = opts.class;
    if (opts.text != null) node.textContent = opts.text;
    if (opts.html != null) node.innerHTML = opts.html;
    if (opts.attrs) for (const [k, v] of Object.entries(opts.attrs)) {
      if (v === false || v == null) continue;
      node.setAttribute(k, v === true ? '' : String(v));
    }
    if (opts.on) for (const [k, v] of Object.entries(opts.on)) node.addEventListener(k, v);
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  global.EPMCData = {
    FEEDS,
    fetchFeed,
    fetchAll,
    getCached,
    subscribe,
    relTime,
    freshnessLabel,
    escapeHtml,
    el,
  };
})(window);
