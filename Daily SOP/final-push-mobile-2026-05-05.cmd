@echo off
cd /d "C:\Users\ryan\Projects\everpass-mcp-ops"
git config --global credential.helper manager-core
git add -A
git commit -m "Auto: mirror mobile shell + refresh data 2026-05-05" --allow-empty
git push origin main 2>&1
echo PUSH_EXIT=%ERRORLEVEL%
