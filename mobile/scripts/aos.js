/* ============================================================
   EverPass Mobile — AOS Launcher (2026-05-18)
   Phone-accessible skill runner. Hits aos_launcher.py Flask
   server via configurable URL + Bearer token (stored in
   localStorage). Mirrors the laptop cockpit AOS pattern but
   sealed behind token auth for public-tunnel use.

   Rollback = remove this file, remove markup + script include
   in index.html. Backup: index.html.bak.aos-pill-2026-05-18.
   ============================================================ */
(function (global) {
  'use strict';

  const URL_KEY = 'epmcc.aos.url.v1';
  const TOKEN_KEY = 'epmcc.aos.token.v1';
  const RUNS_KEY = 'epmcc.aos.runs.v1';
  const ENABLED_KEY = 'epmcc.aos.enabled.v1'; // 2026-05-26 opt-in: only show chip if '1'
  const DEFAULT_URL = 'http://127.0.0.1:8765';
  const MAX_RUNS = 12;
  const PROBE_INTERVAL_MS = 30 * 1000;

  let probeTimer = null;
  let skills = null;

  function isEnabled() {
    try { return localStorage.getItem(ENABLED_KEY) === '1'; } catch (_) { return false; }
  }

  function getUrl() {
    return (localStorage.getItem(URL_KEY) || DEFAULT_URL).replace(/\/+$/, '');
  }
  function setUrl(v) {
    localStorage.setItem(URL_KEY, v.trim().replace(/\/+$/, '') || DEFAULT_URL);
  }
  function getToken() {
    return (localStorage.getItem(TOKEN_KEY) || '').trim();
  }
  function setToken(v) {
    localStorage.setItem(TOKEN_KEY, (v || '').trim());
  }
  function getRuns() {
    try { return JSON.parse(localStorage.getItem(RUNS_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function pushRun(entry) {
    const list = getRuns();
    list.unshift(entry);
    while (list.length > MAX_RUNS) list.pop();
    localStorage.setItem(RUNS_KEY, JSON.stringify(list));
  }

  function authHeaders() {
    const t = getToken();
    return t ? { Authorization: 'Bearer ' + t } : {};
  }

  // 2026-05-26: probe is now opt-in. Default label is always "AOS" without
  // status decoration so cellular sessions don't see a permanent "down" pill.
  // Only updates dot color; never mutates the chip label to "down" / "token?".
  // Inline status surfaces inside the sheet via setSheetStatus() instead.
  async function probe() {
    const url = getUrl();
    const dot = document.getElementById('aos-trigger-dot');
    try {
      const r = await fetch(url + '/health', {
        cache: 'no-store',
        headers: authHeaders(),
      });
      if (r.status === 401) {
        dot && (dot.dataset.state = 'amber');
        setSheetStatus('Token required (HTTP 401). Save your AOS_TOKEN above.', 'amber');
        return false;
      }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      dot && (dot.dataset.state = 'green');
      setSheetStatus(`Connected · ${j.skills || 0} skills`, 'green');
      return true;
    } catch (e) {
      dot && (dot.dataset.state = 'red');
      setSheetStatus('AOS unreachable from this network. Laptop-only — run on desktop.', 'red');
      return false;
    }
  }

  function setSheetStatus(text, kind) {
    const el = document.getElementById('aos-sheet-status');
    if (!el) return;
    el.textContent = text || '';
    el.dataset.kind = kind || '';
  }

  async function loadSkills() {
    const r = await fetch(getUrl() + '/skills', {
      cache: 'no-store',
      headers: authHeaders(),
    });
    if (!r.ok) throw new Error('skills ' + r.status);
    skills = await r.json();
    return skills;
  }

  async function runSkill(skillId, btn) {
    const prev = btn && btn.textContent;
    if (btn) { btn.disabled = true; btn.textContent = 'Running…'; }
    const t0 = Date.now();
    try {
      const r = await fetch(getUrl() + '/run/' + skillId, {
        method: 'POST',
        headers: authHeaders(),
      });
      const j = await r.json().catch(() => ({}));
      const ok = r.ok && (j.status === 'ok' || j.status === undefined);
      pushRun({
        skill: skillId,
        status: ok ? 'ok' : (j.status || 'err'),
        duration_s: j.duration_s ?? Math.round((Date.now() - t0) / 1000),
        at: new Date().toISOString(),
      });
      renderRuns();
      toast(ok ? `${skillId} done` : `${skillId} ${j.status || 'err'}`);
    } catch (e) {
      pushRun({
        skill: skillId,
        status: 'err',
        duration_s: Math.round((Date.now() - t0) / 1000),
        at: new Date().toISOString(),
      });
      renderRuns();
      toast(`${skillId} failed: ${e.message}`);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = prev; }
    }
  }

  function toast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.hidden = true; }, 2200);
  }

  function renderSkills() {
    const list = document.getElementById('aos-skill-list');
    if (!list) return;
    if (!skills) {
      list.innerHTML = '<div class="aos-empty">No mobile skills configured. AOS runs on the laptop only.</div>';
      return;
    }
    const ids = Object.keys(skills).sort();
    if (!ids.length) {
      list.innerHTML = '<div class="aos-empty">No skills available.</div>';
      return;
    }
    list.innerHTML = ids.map((id) => {
      const s = skills[id];
      const name = (s && s.name) || id;
      const kind = (s && s.kind) || '';
      return `
        <div class="aos-skill-row">
          <div class="aos-skill-meta">
            <div class="aos-skill-name">${escapeHtml(name)}</div>
            <div class="aos-skill-sub">${escapeHtml(id)} · ${escapeHtml(kind)}</div>
          </div>
          <button type="button" class="aos-run-btn" data-skill="${escapeHtml(id)}">Run</button>
        </div>`;
    }).join('');
    list.querySelectorAll('.aos-run-btn').forEach((b) => {
      b.addEventListener('click', () => runSkill(b.dataset.skill, b));
    });
  }

  function renderRuns() {
    const el = document.getElementById('aos-runs');
    if (!el) return;
    const runs = getRuns();
    if (!runs.length) { el.innerHTML = '<div class="aos-empty">No runs yet.</div>'; return; }
    el.innerHTML = runs.map((r) => {
      const t = new Date(r.at).toLocaleTimeString('en-US', {
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
      const cls = r.status === 'ok' ? 'ok' : (r.status === 'err' ? 'err' : 'run');
      return `<div class="aos-run-row">
        <span class="aos-run-ts">${t}</span>
        <span class="aos-run-name">${escapeHtml(r.skill)}</span>
        <span class="aos-run-dur">${r.duration_s ?? '—'}s</span>
        <span class="aos-run-status ${cls}">${escapeHtml(String(r.status).toUpperCase())}</span>
      </div>`;
    }).join('');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function openSheet() {
    const sheet = document.getElementById('aos-sheet');
    const bd = document.getElementById('aos-backdrop');
    if (!sheet) return;
    sheet.hidden = false;
    bd && (bd.hidden = false);
    sheet.dataset.open = 'true';
    document.getElementById('aos-url-input').value = getUrl();
    document.getElementById('aos-token-input').value = getToken() ? '••••••••' : '';
    setSheetStatus('Probing…', '');
    renderSkills(); // 2026-05-26: render static empty-state immediately
    renderRuns();
    probe().then((ok) => { if (ok) loadSkills().then(renderSkills).catch(() => {}); });
  }
  function closeSheet() {
    const sheet = document.getElementById('aos-sheet');
    const bd = document.getElementById('aos-backdrop');
    if (sheet) { sheet.hidden = true; sheet.dataset.open = 'false'; }
    bd && (bd.hidden = true);
  }

  // 2026-05-26: hard-reset state on init. Prior sessions left the sheet
  // sometimes appearing pinned (Ryan's report 2026-05-26). Defensive close.
  function forceCloseOnInit() {
    closeSheet();
  }

  function wire() {
    const trig = document.getElementById('aos-trigger');
    const close = document.getElementById('aos-sheet-close');
    const bd = document.getElementById('aos-backdrop');
    const save = document.getElementById('aos-save');
    const reload = document.getElementById('aos-reload');

    trig && trig.addEventListener('click', openSheet);
    close && close.addEventListener('click', closeSheet);
    bd && bd.addEventListener('click', closeSheet);
    save && save.addEventListener('click', () => {
      setUrl(document.getElementById('aos-url-input').value);
      const tv = document.getElementById('aos-token-input').value;
      if (tv && tv !== '••••••••') setToken(tv);
      toast('Saved.');
      probe().then((ok) => { if (ok) loadSkills().then(renderSkills).catch(() => {}); });
    });
    reload && reload.addEventListener('click', async () => {
      try { await loadSkills(); renderSkills(); toast('Skills reloaded.'); }
      catch (e) { toast('Reload failed: ' + e.message); }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSheet();
    });
  }

  function init() {
    forceCloseOnInit();
    const trig = document.getElementById('aos-trigger');
    const label = document.getElementById('aos-trigger-label');
    // 2026-05-26: AOS chip is opt-in. Hide entirely unless user enabled it via
    // localStorage 'epmcc.aos.enabled.v1' = '1'. From cellular, AOS is always
    // unreachable (laptop-bound), so default-hiding removes the misleading
    // "AOS · down" badge. Power users can enable via DevTools console.
    if (!isEnabled()) {
      if (trig) trig.style.display = 'none';
      // Still wire close-on-Escape in case the sheet was server-rendered open.
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
      return;
    }
    if (label) label.textContent = 'AOS';
    wire();
    // 2026-05-26: removed auto-probe interval. Probe only when user opens the
    // sheet. From cellular, repeated probes just produced "AOS · down" noise.
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.EPMCAos = { probe, openSheet, closeSheet, getUrl, getToken };
})(window);
