// EverPass — Remediated Failing Panels Screenshot Capture — 2026-04-28
// Captures only the 10 previously-failing negotiation panels after dark-mode fix.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, 'qa-screenshots-remediated-2026-04-28');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const EP = 'C:/Users/ryan/OneDrive - EverPass Media/EVERPASS';

const FAILING_PANELS = [
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
    id: 'nego-monumental',
    url: `file:///${EP}/CONTENT PARTNERSHIPS/RSNs/MONUMENTAL/EverPass___Monumental___Negotiation_Panel.html`,
    w: 1440, h: 900, label: 'Monumental Negotiation Panel'
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
    w: 1440, h: 900, label: 'Golf Channel Negotiation Panel'
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
];

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const s of FAILING_PANELS) {
    try {
      const ctx = await browser.newContext({
        viewport: { width: s.w, height: s.h },
        colorScheme: 'dark',
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      await page.goto(s.url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);
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

  const manifest = {
    generated_at: new Date().toISOString(),
    pass: 'remediated-failing-panels-2026-04-28',
    surfaces: results
  };
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nDone. ${results.filter(r => r.status === 'ok').length}/${results.length} captured.`);
}

capture().catch(err => { console.error(err); process.exit(1); });
