@echo off
REM Wrapper to invoke the mirror-mobile-shell python script.
setlocal
set "SCRIPT=%~dp0mirror-mobile-shell-2026-05-05.py"
where py >nul 2>nul
if %ERRORLEVEL%==0 (
  py -3 "%SCRIPT%"
) else (
  python "%SCRIPT%"
)
echo MIRROR_EXIT=%ERRORLEVEL%
endlocal
