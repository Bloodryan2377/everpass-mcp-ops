/* ============================================================
   EverPass Mobile Command Center — Daily S (additive 2026-04-27)

   Quiet, low-visibility morning-clearance SOP control.
   - Trigger lives in the topbar next to Refresh.
   - Bottom sheet with backdrop. Esc / outside-tap / handle close it.
   - Reuses freshness-status.json (data/mobile/freshness-status.json)
     via EPMCData.fetchFeed('freshness'). No new feeds.
   - Live Ask readiness is derived from what is actually visible client-
     side (composer presence + freshness signals); we never fabricate
     backend state.

   Rollback = remove this file, the <script src="./scripts/daily-s.js"></script>
   line in index.html, the .ds-* CSS in cockpit.css, and the #ds-trigger
   + #ds-sheet + #ds-backdrop markup in index.html.
   ============================================================ */
(function (global) {
  'use strict';
  var DATA = global.EPMCData;
  if (!DATA) return; // data layer must be loaded first

  var trigger, panel, dot, body, backdrop, btnClose, btnFresh;
  var lastData = null;
  var initialized = false;

  // ---- Daily S usage logging (additive 2026-04-27) ----------------------
  // Posts each open/close to the cockpit-server.py logging endpoint, which
  // appends to AI Related/health/logs/daily_s-usage-YYYY-MM.jsonl. Failures
  // are silent — UI behavior must not depend on the bridge being up.
  var DS_LOG_URL = 'http://127.0.0.1:8787/_log/daily-s';
  var dsSessionId = (function () {
    try {
      if (window.crypto && crypto.randomUUID) return 'ds-m-' + crypto.randomUUID().slice(0, 8);
    } catch (_e) { /* ignore */ }
    return 'ds-m-' + Math.random().toString(36).slice(2, 10);
  })();
  var dsOpenedAt = null;

  function ageLabel(h) {
    if (h == null) return '?';
    if (h < 1) return Math.round(h * 60) + 'm';
    if (h < 24) return h.toFixed(1) + 'h';
    return (h / 24).toFixed(1) + 'd';
  }

  function findArtifact(data, key) {
    if (!data || !data.artifacts) return null;
    for (var i = 0; i < data.artifacts.length; i++) {
      if (data.artifacts[i].key === key) return data.artifacts[i];
    }
    return null;
  }

  function artifactReadiness(label, art) {
    if (!art) return { state: 'unknown', value: label + ' — no entry in freshness-status.json' };
    var post = art.post || {};
    var status = (post.status || '?').toLowerCase();
    var age = ageLabel(post.age_hours);
    var state =
      (status === 'fresh' || status === 'ok') ? 'green' :
      (status === 'warn') ? 'amber' :
      (status === 'stale' || status === 'missing' || status === 'fail') ? 'red' :
      'unknown';
    return { state: state, value: label + ' as of ' + age + ' · ' + status };
  }

  function liveAskReadiness(data) {
    // The mobile cockpit Ask composer lives only on the cockpit view; treat
    // its presence as a soft signal but do not penalize other tabs heavily.
    var hasComposer = !!document.getElementById('ask-composer-input');
    if (!data || data.__error) {
      return { state: 'amber', value: 'Live Ask Brain — check needed (freshness payload not readable)' };
    }
    var contracts = findArtifact(data, 'contract_master_manifest_json')
                 || findArtifact(data, 'contract_master_data_json');
    var fin = findArtifact(data, 'financials_full_normalized_csv')
           || findArtifact(data, 'financials_full_normalized');
    var contractsBad = contracts && /^(stale|missing|fail)$/i.test((contracts.post || {}).status || '');
    var finBad       = fin       && /^(stale|missing|fail)$/i.test((fin.post || {}).status || '');
    if (contractsBad || finBad) {
      return { state: 'amber', value: 'Live Ask Brain — limited (contracts or financials not fresh)' };
    }
    if ((data.overall || '') === 'WARN') {
      return { state: 'amber', value: 'Live Ask Brain — limited (chain freshness WARN)' };
    }
    if ((data.overall || '') === 'FAIL') {
      return { state: 'red', value: 'Live Ask Brain — check needed (chain freshness FAIL)' };
    }
    return {
      state: 'green',
      value: hasComposer
        ? 'Live Ask Brain — ready'
        : 'Live Ask Brain — ready (open Dashboard tab to use)',
    };
  }

  function rollupState(parts) {
    if (parts.some(function (p) { return p.state === 'red'; })) return 'red';
    if (parts.some(function (p) { return p.state === 'amber'; })) return 'amber';
    if (parts.some(function (p) { return p.state === 'unknown'; })) return 'amber';
    return 'green';
  }

  function buildSummary(data) {
    var freshnessRow, contractsRow, financialsRow;
    if (!data || data.__error) {
      freshnessRow  = { state: 'amber', value: 'Freshness status unavailable — freshness-status.json not readable' };
      contractsRow  = { state: 'unknown', value: 'Contracts — status unavailable' };
      financialsRow = { state: 'unknown', value: 'Financials — status unavailable' };
    } else {
      var verdict = data.overall || '?';
      var totals = data.totals || {};
      var n = (totals.fresh | 0) + (totals.warn | 0) + (totals.stale | 0) + (totals.missing | 0);
      var verdictState =
        verdict === 'PASS' ? 'green' :
        verdict === 'WARN' ? 'amber' :
        verdict === 'FAIL' ? 'red' : 'amber';
      var verdictText = 'Freshness ' + verdict + ' · ' + (totals.fresh | 0) + '/' + n + ' fresh';
      freshnessRow = { state: verdictState, value: verdictText };
      contractsRow = artifactReadiness('Contracts',
        findArtifact(data, 'contract_master_manifest_json')
        || findArtifact(data, 'contract_master_data_json'));
      financialsRow = artifactReadiness('Financials',
        findArtifact(data, 'financials_full_normalized_csv')
        || findArtifact(data, 'financials_full_normalized'));
    }
    var liveRow = liveAskReadiness(data);
    // Email state row (additive 2026-04-27): partner_email_prod watcher
    // heartbeat. user_facing=False in the registry, so this is informational
    // and does NOT participate in the rollup dot — same pattern as Financials.
    var emailRow = (data && !data.__error)
      ? artifactReadiness('Email state', findArtifact(data, 'partner_email_state'))
      : { state: 'unknown', value: 'Email state — status unavailable' };
    var queueRow = { state: 'unknown', value: 'Bridge / queue status — see Runtime health on the Dashboard tab' };
    var rolled = rollupState([freshnessRow, contractsRow, liveRow]);
    return {
      state: rolled,
      rows: [
        { label: 'Freshness', row: freshnessRow },
        { label: 'Contracts', row: contractsRow },
        { label: 'Financials', row: financialsRow },
        { label: 'Live Ask Brain', row: liveRow },
        { label: 'Email state', row: emailRow },
        { label: 'Queue / bridge', row: queueRow },
      ],
    };
  }

  function renderSummary(summary) {
    body.innerHTML = '';
    if (!summary) {
      var miss = document.createElement('div');
      miss.className = 'ds-row';
      miss.innerHTML = '<span class="ds-row-dot" data-state="amber"></span>'
        + '<div class="ds-row-text">'
        +   '<span class="ds-row-label">Status</span>'
        +   '<span class="ds-row-value">Freshness status unavailable — try again later.</span>'
        + '</div>';
      body.appendChild(miss);
      dot.setAttribute('data-state', 'amber');
      return;
    }
    summary.rows.forEach(function (r) {
      var row = document.createElement('div');
      row.className = 'ds-row';
      var spanDot = document.createElement('span');
      spanDot.className = 'ds-row-dot';
      spanDot.setAttribute('data-state', r.row.state || 'unknown');
      var txt = document.createElement('div');
      txt.className = 'ds-row-text';
      var lbl = document.createElement('span');
      lbl.className = 'ds-row-label';
      lbl.textContent = r.label;
      var val = document.createElement('span');
      val.className = 'ds-row-value';
      val.textContent = r.row.value;
      txt.appendChild(lbl); txt.appendChild(val);
      row.appendChild(spanDot); row.appendChild(txt);
      body.appendChild(row);
    });
    dot.setAttribute('data-state', summary.state || 'unknown');
  }

  function refreshSummary(force) {
    DATA.fetchFeed('freshness', { force: !!force })
      .then(function (data) {
        lastData = data;
        lastSummary = buildSummary(data);
        renderSummary(lastSummary);
      })
      .catch(function () {
        lastData = null;
        lastSummary = buildSummary(null);
        renderSummary(lastSummary);
      });
  }

  // Track the most recent summary so the logger can include it without
  // recomputing. (renderSummary mutates DOM only; this lets the logger see
  // exactly what the user is looking at.)
  var lastSummary = null;

  function dsArtifactStatus(data, primaryKey, fallbackKey) {
    if (!data || data.__error) return 'unknown';
    var hit = findArtifact(data, primaryKey) || (fallbackKey ? findArtifact(data, fallbackKey) : null);
    if (!hit) return 'unknown';
    var s = ((hit.post || {}).status || '').toLowerCase();
    return /^(fresh|ok|warn|stale|missing|fail)$/.test(s) ? s : 'unknown';
  }

  function dsLiveAskStatus(data) {
    var hasComposer = !!document.getElementById('ask-composer-input');
    if (!data || data.__error) return 'check-needed';
    var contractsBad = /^(stale|missing|fail)$/.test(dsArtifactStatus(data, 'contract_master_manifest_json', 'contract_master_data_json'));
    var finBad       = /^(stale|missing|fail)$/.test(dsArtifactStatus(data, 'financials_full_normalized_csv', 'financials_full_normalized'));
    if (contractsBad || finBad) return 'limited';
    if ((data.overall || '') === 'WARN') return 'limited';
    if ((data.overall || '') === 'FAIL') return 'check-needed';
    // Mobile cockpit composer only renders on the Cockpit tab. Treat its
    // absence as "ready (off-tab)" rather than limited — same logic as the
    // panel's row text.
    return hasComposer ? 'ready' : 'ready';
  }

  function dsBuildLogPayload(action, openMs) {
    var rolled = (lastSummary && lastSummary.state) || 'unknown';
    var freshnessVerdict =
      (lastData && !lastData.__error && lastData.overall) ? lastData.overall : 'UNKNOWN';
    var payload = {
      schema: 'epc-daily-s-usage/v1',
      ts: new Date().toISOString(),
      surface: 'mobile',
      action: action,
      state: rolled,
      freshness_status: freshnessVerdict,
      contracts_status:  dsArtifactStatus(lastData, 'contract_master_manifest_json', 'contract_master_data_json'),
      financials_status: dsArtifactStatus(lastData, 'financials_full_normalized_csv', 'financials_full_normalized'),
      email_state_status: dsArtifactStatus(lastData, 'partner_email_state'),
      live_ask_status:   dsLiveAskStatus(lastData),
      session_id: dsSessionId,
    };
    if (typeof openMs === 'number' && isFinite(openMs)) payload.open_ms = openMs;
    return payload;
  }

  function logDailySEvent(action, openMs) {
    try {
      var payload = dsBuildLogPayload(action, openMs);
      var body = JSON.stringify(payload);
      var blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
      var sent = false;
      try {
        if (navigator.sendBeacon) sent = navigator.sendBeacon(DS_LOG_URL, blob);
      } catch (_e) { sent = false; }
      if (!sent) {
        try {
          fetch(DS_LOG_URL, {
            method: 'POST',
            mode: 'cors',
            keepalive: true,
            headers: { 'Content-Type': 'text/plain' },
            body: body,
          }).catch(function () { /* silent */ });
        } catch (_e) { /* silent */ }
      }
    } catch (_e) { /* silent */ }
  }

  function setOpen(open) {
    if (!panel || !backdrop) return;
    var was = panel.getAttribute('data-open') === 'true';
    if (was === !!open) return; // idempotent: don't double-log
    panel.setAttribute('data-open', open ? 'true' : 'false');
    backdrop.setAttribute('data-open', open ? 'true' : 'false');
    panel.hidden = !open;
    backdrop.hidden = !open;
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      refreshSummary(true);
      try { btnClose.focus(); } catch (_e) {}
      dsOpenedAt = Date.now();
      logDailySEvent('open');
    } else {
      var openMs = dsOpenedAt ? (Date.now() - dsOpenedAt) : null;
      dsOpenedAt = null;
      logDailySEvent('close', openMs);
    }
  }

  function init() {
    if (initialized) return;
    trigger  = document.getElementById('ds-trigger');
    panel    = document.getElementById('ds-sheet');
    dot      = document.getElementById('ds-trigger-dot');
    body     = document.getElementById('ds-sheet-body');
    backdrop = document.getElementById('ds-backdrop');
    btnClose = document.getElementById('ds-sheet-close');
    btnFresh = document.getElementById('ds-foot-freshness');
    if (!trigger || !panel || !body || !backdrop) return;
    initialized = true;

    // Initial dot population so the chip doesn't sit grey.
    refreshSummary(false);

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = panel.getAttribute('data-open') === 'true';
      setOpen(!open);
    });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });

    backdrop.addEventListener('click', function () { setOpen(false); });

    if (btnClose) {
      btnClose.addEventListener('click', function () {
        setOpen(false);
        try { trigger.focus(); } catch (_e) {}
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.getAttribute('data-open') === 'true') {
        setOpen(false);
        try { trigger.focus(); } catch (_e) {}
      }
    });

    // Shift+S toggles. Ignored when typing into form controls.
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'S') return;
      if (!e.shiftKey) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      e.preventDefault();
      var open = panel.getAttribute('data-open') === 'true';
      setOpen(!open);
    });

    if (btnFresh) {
      btnFresh.addEventListener('click', function (e) {
        e.stopPropagation();
        try {
          /* eslint-disable no-console */
          console.group('Daily S — freshness detail');
          if (!lastData || lastData.__error) {
            console.log('No freshness payload loaded ('
              + (lastData && lastData.__error ? lastData.__error : 'status file missing') + ').');
          } else {
            (lastData.artifacts || []).forEach(function (a) {
              var post = a.post || {};
              console.log(
                (post.status || '?').padEnd(8)
                + ' age=' + ageLabel(post.age_hours).padStart(6)
                + '  ' + a.key
                + (a.user_facing ? ' (USER-FACING)' : '')
                + (a.manual_only ? ' [manual-only]' : '')
              );
            });
            console.log('Verdict: ' + (lastData.overall || '?')
              + ' · generated: ' + (lastData.generated_at || '?'));
          }
          console.groupEnd();
          /* eslint-enable no-console */
        } catch (_e) { /* ignore */ }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  global.EPMCDailyS = {
    refresh: function () { refreshSummary(true); },
    // Test-only handles (additive 2026-04-27). Pure functions, no DOM
    // side effects beyond document.getElementById('ask-composer-input').
    // Used by daily-s-logic-tests.js for headless PASS/WARN/FAIL/UNKNOWN
    // verification without a browser.
    _test: {
      ageLabel: ageLabel,
      findArtifact: findArtifact,
      artifactReadiness: artifactReadiness,
      liveAskReadiness: liveAskReadiness,
      rollupState: rollupState,
      buildSummary: buildSummary,
    },
  };
})(window);
