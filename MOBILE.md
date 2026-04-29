# EverPass Mobile — Home-Screen Web App

This is the operational record for the mobile home-screen URL.

## Final clickable URL

```
https://bloodryan2377.github.io/everpass-mcp-ops/
```

Redirects to `/mobile/`. The `/mobile/` URL works directly too:

```
https://bloodryan2377.github.io/everpass-mcp-ops/mobile/
```

## Where the deployed mobile shell lives

- Branch: `gh-pages`
- Path: `mobile/index.html`
- Served by: GitHub Pages (project site, source = `gh-pages` / `/`)

The shell is a dark, premium iPhone/iPad-optimized launcher. Its primary
button opens the live production dashboard at
`https://dashboard.everpasspipeline.com/mobile/` in the standalone web-app
window.

## Source-of-truth note

The Windows-local redesigned source is at:

```
C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\Dashboard\dashboard-deploy\mobile\index.html
```

The gh-pages copy is the home-screen-installable wrapper for that app. If the
Windows-local mobile app is updated and you want those changes reflected on
the home-screen URL, copy the new files into the `gh-pages` branch under
`mobile/` and push (see "Restart / redeploy" below).

## Home-screen metadata present

`mobile/index.html` already includes:

- `viewport` with `viewport-fit=cover` and `user-scalable=no`
- `apple-mobile-web-app-capable=yes`
- `mobile-web-app-capable=yes`
- `apple-mobile-web-app-status-bar-style=black-translucent`
- `apple-mobile-web-app-title=EverPass`
- `theme-color=#0a0b0f`
- `color-scheme=dark`
- `<link rel="manifest" href="manifest.json">`
- `<link rel="icon" type="image/png" href="icons/favicon.png">`
- `<link rel="apple-touch-icon">` at 120, 152, 167, 180 px
- Standalone-mode CSS (`@media all and (display-mode: standalone)`)
- Safe-area padding via `env(safe-area-inset-*)`

`mobile/manifest.json` declares `display: standalone`, dark theme, and 192 /
512 / maskable-512 icons.

## One-time Pages enablement (only needed once)

If `https://bloodryan2377.github.io/everpass-mcp-ops/` returns a 404, GitHub
Pages has not been activated yet. Activate it once in the GitHub UI:

1. Open `https://github.com/Bloodryan2377/everpass-mcp-ops/settings/pages`
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**
3. Set **Branch** to `gh-pages`, folder `/ (root)`
4. Click **Save**
5. Wait ~60 seconds. The site appears at the URL above.

There is no CI / build step. Pages serves the static files in `gh-pages`
directly.

## Restart / redeploy

There is no server to restart — Pages re-serves whatever is on `gh-pages`.
To push a new version of the mobile shell:

```bash
# from the repo on your Windows box, in Git Bash or PowerShell
git fetch origin
git switch gh-pages
git pull --ff-only

# Replace the shell files (or copy fresh ones from the dashboard-deploy folder)
# e.g. copy the redesigned mobile to gh-pages mobile/
# cp -r "/c/Users/ryan/OneDrive - EverPass Media/EVERPASS/Dashboard/dashboard-deploy/mobile/." mobile/

git add -A
git commit -m "mobile: refresh home-screen shell"
git push origin gh-pages
```

GitHub Pages picks up the new commit within ~60 seconds. Hard-refresh on
your iPhone (delete the home-screen icon and re-add) to bust the iOS web-app
cache if needed.

## Stale / older mobile copies to be aware of

- `C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\Dashboard\dashboard-deploy\mobile\index.html`
  — Windows-local redesigned source. Not directly addressable from
  iPhone/iPad Safari (file:// is unreliable for Add to Home Screen). Treat
  this as the source-of-truth you copy *from* into `gh-pages/mobile/`.

- Any older mobile pages at `dashboard.everpasspipeline.com/mobile/` are the
  live production app the shell launches into — leave those alone.

## How to add to iPhone / iPad home screen

1. Open the URL in **Safari** (not Chrome — Add to Home Screen is Safari-only on iOS):
   `https://bloodryan2377.github.io/everpass-mcp-ops/`
2. Tap the **Share** button (square with up arrow).
3. Scroll and tap **Add to Home Screen**.
4. If "Open as Web App" toggle appears (iOS 16.4+), keep it **ON**.
5. Edit the name if you want, then tap **Add**.
6. The EverPass icon appears on your home screen. Tap it — it launches in
   standalone mode (no Safari chrome), and the status bar will be
   translucent dark to match the theme.
