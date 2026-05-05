@echo off
REM Kill hung git/credential-manager/askpass processes
taskkill /F /IM git.exe /T 2>nul
taskkill /F /IM git-credential-manager.exe /T 2>nul
taskkill /F /IM git-credential-manager-core.exe /T 2>nul
taskkill /F /IM askpass.exe /T 2>nul
taskkill /F /IM ssh.exe /T 2>nul
echo KILL_DONE
