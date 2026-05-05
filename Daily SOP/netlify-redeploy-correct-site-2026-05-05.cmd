@echo off
REM Re-deploy to the CORRECT linked Netlify site (4da21bd2-5a53-49dc-949d-65bfa36d7b87)
REM by changing directory into the site root so state.json is found,
REM and also passing the siteId explicitly as a belt-and-suspenders.
setlocal
set "LOG=%~dp0netlify-redeploy-2026-05-05.log"
set "DASH=C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\EVERPASS TOOLS\Dashboard\dashboard-deploy"
set "SITE_ID=4da21bd2-5a53-49dc-949d-65bfa36d7b87"

echo === REDEPLOY START %DATE% %TIME% > "%LOG%"

cd /d "%DASH%"
echo CWD=%CD% >> "%LOG%"

call netlify deploy --prod --dir=. --site=%SITE_ID% >> "%LOG%" 2>&1
echo NETLIFY_REDEPLOY_EXIT=%ERRORLEVEL% >> "%LOG%"

echo === REDEPLOY END %DATE% %TIME% >> "%LOG%"
type "%LOG%"
endlocal
