@echo off
set "ROOT=%~dp0"
start "Frontend Dev Server" cmd /k "cd /d ""%ROOT%frontend"" && npm run dev"
