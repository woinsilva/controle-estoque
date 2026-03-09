@echo off
set "ROOT=%~dp0"
start "Backend Dev Server" cmd /k "cd /d ""%ROOT%backend"" && npm run dev"
start "Frontend Dev Server" cmd /k "cd /d ""%ROOT%frontend"" && npm run dev"
