@echo off
title AltiSec Report Automation Studio
cd /d "%~dp0"
echo =======================================================
echo    AltiSec Report Automation Studio (Localhost)
echo =======================================================
echo.
echo Starting local server on http://localhost:8000 ...
start "" http://localhost:8000
node server.js
pause
