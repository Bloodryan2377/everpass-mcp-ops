// EverPass Visual QA Screenshot Capture — 2026-04-28
// Run: playwright node capture-qa-screenshots.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, 'qa-screenshots-2026-04-28');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const MOBILE_BASE = 'http://127.0.0.1:7891';

const EP = 'C:/Users/ryan/OneDrive - EverPass Media/EVERPASS';

const SURFACES = [
  // ── Mobile tabs — iPhone 17 Pro Max ─────────────────────────
  { id: 'mob-iphone-dashboard',  url: `${MOBILE_BASE}/#/dashboard`,  w: 430,  h: 932,  label: 'Mobile Dashboard (iPhone)' },
  { id: 'mob-iphone-answers',  url: `${MOBILE_BASE}/#/answers`,  w: 430,  h: 932,  label: 'Mobile Answers (iPhone)' },
  { id: 'mob-iphone-results',  url: `${MOBILE_BASE}/#/results`,  w: 430,  h: 932,  label: 'Mobile Results (iPhone)' },
  { id: 'mob-iphone-live',     url: `${MOBILE_BASE}/#/live`,     w: 430,  h: 932,  label: 'Mobile Live (iPhone)' },
  { id: 'mob-iphone-dispatch', url: `${MOBILE_BASE}/#/dispatch`, w: 430,  h: 932,  label: 'Mobile Dispatch (iPhone)' },
  // ── Mobile tabs — iPad Pro ───────────────────────────────────
  { id: 'mob-ipad-dashboard',    url: `${MOBILE_BASE}/#/dashboard`,  w: 1024, h: 1366, label: 'Mobile Dashboard (iPad Pro)' },
  { id: 'mob-ipad-answers',    url: `${MOBILE_BASE}/#/answers`,  w: 1024, h: 1366, label: 'Mobile Answers (iPad Pro)' },
  { id: 'mob-ipad-results',    url: `${MOBILE_BASE}/#/results`,  w: 1024, h: 1366, label: 'Mobile Results (iPad Pro)' },
  { id: 'mob-ipad-live',       url: `${MOBILE_BASE}/#/live`,     w: 1024, h: 1366, label: 'Mobile Live (iPad Pro)' },
  // ── Desktop dashboard surfaces ───────────────────────────────
  {
    id: 'desktop-dashboard',
    url: `file:///${EP}/EVERPASS TOOLS/Dashboard/dashboard-deploy/index.html`,
    w: 1440, h: 900, label: 'Desktop Dashboard'
  },
  {
    id: 'desktop-rsn-deals',
    url: `file:///${EP}/EVERPASS TOOLS/Dashboard/dashboard-deploy/RSN Deals.html`,
    w: 1440, h: 900, label: 'RSN Deals'
  },
  {
    id: 'desktop-pipeline-flow',
    url: `file:///${EP}/EVERPASS TOOLS/Dashboard/dashboard-deploy/EverPass Content Pipeline Flow.html`,
    w: 1440, h: 900, label: 'Content Pipeline Flow'
  },
  {
    id: 'desktop-rsn-framing',
    url: `file:///${EP}/EVERPASS TOOLS/AI Related/RSN-Decision-Framing.html`,
    w: 1440, h: 900, label: 'RSN Decision Framing'
  },
  // ── Negotiation panels ───────────────────────────────────────
  {
    id: 'nego-twdc',
    url: `file:///${EP}/CONTENT PARTNERSHIPS/Broadcast Streaming Networks/DISNEY/EverPass Media _ TWDC_ESPN Negotiation Panel.html`,
    w: 1440, h: 900, label: 'TWDC/ESPN Negotiation Panel'
  },
  {
    id: 'nego-fox',
    url: `file:///${EP}/CONTENT PARTNERSHIPS/Broadcast Streaming Networks/FOX/EverPass___FOX___Negotiation_Panel.html`,
    w: 1440, h: 900, label: 'FOX Negotiation Panel'
  },
  {
    id: 'nego-nesn',
    url: `file:///${EP}/CONTENT PARTNERSHIPS/RSNs/NESN/EverPass___NESN___Negotiation_Panel.html`,
    w: 1440, h: 900, label: 'NESN Negotiation Panel'
  },
  {
    id: 'nego-marquee',
    url: `file:///${EP}/CONTENT PARTNERSHIPS/RSNs/MARQUEE/EverPass___Marquee___Negotiation_Panel.html`,
    w: 1440, h: 900, label: 'Marquee Negotiation Panel'
  },
  {
    id: 'nego-msg',
    url: `file:///${EP}/CONTENT PARTNERSHIPS/RSNs/MSG-Gotham/EverPass___MSG___Negotiation_Panel.html`,
    w: 1440, h: 900, label: 'MSG Negotiation Panel'
  },
  {
    id: 'nego-monumental',
    url: `file:///${EP}/CONTENT PARTNERSHIPS/RSNs/MONUMENTAL/EverPass___Monumental___Negotiation_Panel.html`,
    w: 1440, h: 900, label: 'Monumental Negotiation Panel'
  },
  {
    id: 'nego-nba',
    url: `file:///${EP}/CONTENT PARTNERSHIPS/Pro Leagues/NBA/EverPass___NBA___Negotiation_Panel.html`,
    w: 1440, h: 900, label: 'NBA Negotiation Panel'
  },
  {
    id: 'nego-nhl',
    url: `file:///${EP}/CONTENT PARTNERSHIPS/Pro Leagues/NHL/EverPass___NHL___Negotiation_Panel.html`,
    w: 1440, h: 900, label: 'NHL Negotiation Panel'
  },
  {
    id: 'nego-mlb',
    url: `file:///${EP}/CONTENT PARTNERSHIPS/Pro Leagues/MLB/EverPass___MLB___Negotiation_Panel.html`,
    w: 1440, h: 900, label: 'MLB Negotiation Panel'
  },
  {
    id: 'nego-golf',
    url: `file:///${EP}/CONTENT PARTNERSHIPS/Cable Networks/Golf/EverPass___Golf___Negotiation_Panel.html`,
    w: 1440, h: 900, label: 'Golf Negotiation Panel'
  },
  {
    id: 'nego-wbd',
    url: `file:///${EP}/CONTENT PARTNERSHIPS/Cable Networks/WBD/EverPass___WBD___Negotiation_Panel.html`,
    w: 1440, h: 900, label: 'WBD Negotiation Panel'
  },
  {
    id: 'nego-flosports',
    url: `file:///${EP}/CONTENT PARTNERSHIPS/Core and PPV/FloSports/EverPass___FloSports___Negotiation_Panel.html`,
    w: 1440, h: 900, label: 'FloSports Negotiation Panel'
  },
  {
    id: 'nego-bravesvision',
    url: `file:///${EP}/CONTENT PARTNERSHIPS/RSNs/BravesVision/EverPass___BravesVision___Negotiation_Panel.html`,
    w: 1440, h: 900, label: 'BravesVision Negotiation Panel'
  },
  {
    id: 'nego-samsung',
    url: `file:///${EP}/CONTENT PARTNERSHIPS/Device Partners/Samsung/EverPass___Samsung___Negotiation_Panel.html`,
    w: 1440, h: 900, label: 'Samsung Negotiation Panel'
  },
  {
    id: 'nego-charter',
    url: `file:///${EP}/CONTENT PARTNERSHIPS/Platform Partners/CHARTER/everpass_charter_negotiation_panel.html`,
    w: 1440, h: 900, label: 'Charter Negotiation Panel'
  },
  {
    id: 'sales-comcast',
    url: `file:///${EP}/CONTENT PARTNERSHIPS/Platform Partners/COMCAST/EverPass___Comcast___Sales_Flow_Tool.html`,
    w: 1440, h: 900, label: 'Comcast Sales Flow Tool'
  },
  {
    id: 'sales-charter',
    url: `file:///${EP}/CONTENT PARTNERSHIPS/Platform Partners/CHARTER/Sales and Information/EverPass _ Charter _ Interactive Sales Flow Tool.html`,
    w: 1440, h: 900, label: 'Charter Interactive Sales Flow Tool'
  },
];

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const s of SURFACES) {
    try {
      const ctx = await browser.newContext({
        viewport: { width: s.w, height: s.h },
        colorScheme: 'dark',
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      await page.goto(s.url, { waitUntil: 'networkidle', timeout: 12000 });
      // Allow JS render + animations to settle
      await page.waitForTimeout(800);
      const outPath = path.join(OUT, `${s.id}.png`);
      await page.screenshot({ path: outPath, fullPage: false });
      await ctx.close();
      results.push({ id: s.id, label: s.label, status: 'ok', file: outPath });
      process.stdout.write(`  ✓ ${s.id}\n`);
    } catch (e) {
      results.push({ id: s.id, label: s.label, status: 'error', error: String(e.message || e) });
      process.stdout.write(`  ✗ ${s.id} — ${e.message}\n`);
    }
  }

  await browser.close();

  // Write manifest
  const manifest = { generated_at: new Date().toISOString(), surfaces: results };
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nDone. ${results.filter(r => r.status === 'ok').length}/${results.length} captured.`);
}

capture().catch(err => { console.error(err); process.exit(1); });
