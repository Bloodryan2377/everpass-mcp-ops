# EverPass mobile — home-screen-ready shell

This folder is a **PWA-ready mobile shell** for EverPass, designed to be opened
in iOS / iPadOS Safari and saved to the home screen as a standalone web app.

## What's here

- `index.html` — the mobile shell (dark premium theme, safe-area aware, all
  iOS home-screen meta tags wired up).
- `manifest.json` — Web App Manifest (`display: standalone`, theme + bg color,
  PWA icons including a maskable variant).
- `icons/` — apple-touch-icons (120, 152, 167, 180), PWA icons (192, 512), a
  maskable 512, and a favicon.

## URLs

- **Works immediately, no GitHub setup required:**
  `https://raw.githack.com/Bloodryan2377/everpass-mcp-ops/claude/mobile-homescreen-url-FCK1V/mobile/index.html`
- **Cleaner permanent URL (after enabling GitHub Pages once):**
  `https://bloodryan2377.github.io/everpass-mcp-ops/mobile/`

## Replacing the shell with the real redesigned mobile app

When you're ready to drop in the actual redesigned mobile app from
`OneDrive\EVERPASS\Dashboard\dashboard-deploy\mobile\`:

1. Copy that folder's `index.html` (and any of its assets) into this `mobile/`
   folder, **keeping** `manifest.json`, `icons/`, and the iOS `<meta>` /
   `<link>` tags from the current `index.html` `<head>`.
2. Commit and push. The URL stays the same, so any iPhone/iPad install you
   already did will load the new version next time you open it.

## Why this approach

This Linux Claude Code container can't reach the Windows OneDrive path, so
the actual redesigned source could not be pulled from here. This shell gives
you a real `https://` URL today that is correctly configured for iPhone/iPad
"Add to Home Screen" and "Open as Web App". You can swap in the real app's
HTML at any time without changing the URL or re-installing the icon on your
device.
