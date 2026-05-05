/* ============================================================
   EverPass Mobile Command Center — app shell + router
   ============================================================ */
(function (global) {
  'use strict';
  const { fetchAll } = global.EPMCData;

  const ROUTES = ['cockpit', 'dispatch', 'answers', 'results', 'live'];
  const DEFAULT_ROUTE = 'cockpit';

  function currentRoute() {
    const h = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
    return ROUTES.includes(h) ? h : DEFAULT_ROUTE;
  }

  function setActiveTab(route) {
    document.querySelectorAll('.tab').forEach((tab) => {
      const isActive = tab.dataset.tab === route;
      if (isActive) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
  }

  async function showRoute(route) {
    // Always tear down the Live poll when navigating; render() restarts it
    // when re-entering the Live tab.
    if (global.EPMCLive && typeof global.EPMCLive.teardown === 'function') {
      global.EPMCLive.teardown();
    }
    ROUTES.forEach((r) => {
      const view = document.getElementById('view-' + r);
      if (!view) return;
      view.hidden = r !== route;
    });
    setActiveTab(route);
    document.getElementById('topbar-subline').textContent = labelFor(route);
    if (route === 'cockpit') return global.EPMCCockpit.render(document.getElementById('view-cockpit'));
    if (route === 'dispatch') return global.EPMCDispatch.render(document.getElementById('view-dispatch'));
    if (route === 'answers')  return global.EPMCAnswers.render(document.getElementById('view-answers'));
    if (route === 'results')  return global.EPMCResults.render(document.getElementById('view-results'));
    if (route === 'live')     return global.EPMCLive.render(document.getElementById('view-live'));
  }

  function labelFor(route) {
    return ({ cockpit: 'Cockpit', dispatch: 'Dispatch', answers: 'Answers', results: 'Results', live: 'Live Q&A' })[route] || 'EverPass';
  }

  function onHashChange() {
    showRoute(currentRoute()).catch((e) => console.error('route error', e));
  }

  function wireRefresh() {
    const btn = document.getElementById('refresh-btn');
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const orig = btn.textContent;
      btn.textContent = '…';
      try {
        await fetchAll({ force: true });
        await showRoute(currentRoute());
      } finally {
        btn.disabled = false;
        btn.textContent = orig;
      }
    });
  }

  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return; // never register on file:// (e.g. local preview)
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW register failed', e));
    });
  }

  function init() {
    wireRefresh();
    registerSW();
    window.addEventListener('hashchange', onHashChange);
    onHashChange();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  global.EPMCApp = { showRoute, currentRoute };
})(window);
