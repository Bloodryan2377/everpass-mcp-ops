@echo off
REM Force-sync the gh-pages branch from main so GitHub Pages serves the new mobile shell + fresh data.
setlocal
set "LOG=%~dp0sync-gh-pages-2026-05-05.log"

echo === GH-PAGES SYNC START %DATE% %TIME% > "%LOG%"

cd /d "C:\Users\ryan\Projects\everpass-mcp-ops"
echo CWD=%CD% >> "%LOG%"

git rev-parse HEAD >> "%LOG%" 2>&1
echo --- pushing main to gh-pages (force) --- >> "%LOG%"
git push origin main:gh-pages --force >> "%LOG%" 2>&1
echo GH_PAGES_PUSH_EXIT=%ERRORLEVEL% >> "%LOG%"

echo === GH-PAGES SYNC END %DATE% %TIME% >> "%LOG%"
type "%LOG%"
endlocal
