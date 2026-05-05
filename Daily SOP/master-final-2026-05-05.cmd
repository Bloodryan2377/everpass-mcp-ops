@echo off
REM ===========================================================
REM Master orchestrator: kill git, mirror shell, push, deploy.
REM Captures one consolidated log to %TEMP%\final-2026-05-05.log
REM ===========================================================
setlocal
set "SOP=%~dp0"
set "LOG=%SOP%final-2026-05-05.log"
set "DASH=C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\EVERPASS TOOLS\Dashboard\dashboard-deploy"

echo === MASTER START %DATE% %TIME% > "%LOG%"

echo. >> "%LOG%"
echo --- JOB 1: kill hung git --- >> "%LOG%"
call "%SOP%kill-hung-git.cmd" >> "%LOG%" 2>&1
echo JOB1_EXIT=%ERRORLEVEL% >> "%LOG%"

echo. >> "%LOG%"
echo --- JOB 2: mirror mobile shell --- >> "%LOG%"
call "%SOP%Mirror-Mobile-Shell.cmd" >> "%LOG%" 2>&1
echo JOB2_EXIT=%ERRORLEVEL% >> "%LOG%"

echo. >> "%LOG%"
echo --- JOB 3: git push --- >> "%LOG%"
call "%SOP%final-push-mobile-2026-05-05.cmd" >> "%LOG%" 2>&1
echo JOB3_EXIT=%ERRORLEVEL% >> "%LOG%"

echo. >> "%LOG%"
echo --- JOB 4: netlify deploy --- >> "%LOG%"
where netlify >> "%LOG%" 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo netlify CLI not on PATH; trying npm install -g netlify-cli >> "%LOG%"
  call npm install -g netlify-cli >> "%LOG%" 2>&1
)
where netlify >> "%LOG%" 2>&1
if %ERRORLEVEL% EQU 0 (
  pushd "%DASH%"
  netlify deploy --prod --dir="%DASH%" >> "%LOG%" 2>&1
  echo NETLIFY_EXIT=%ERRORLEVEL% >> "%LOG%"
  popd
) else (
  echo NETLIFY_NOT_AVAILABLE >> "%LOG%"
)

echo. >> "%LOG%"
echo === MASTER END %DATE% %TIME% >> "%LOG%"

REM Also dump to console for any watcher
type "%LOG%"
endlocal
