@echo off
title Pushing Report Studio to GitHub
cd /d "%~dp0"
echo ======================================================
echo   Pushing Report Studio to https://github.com/geet264/Report-auto
echo ======================================================
echo.
git push -u origin main
echo.
echo ======================================================
echo   Done! Check https://github.com/geet264/Report-auto
echo ======================================================
pause
