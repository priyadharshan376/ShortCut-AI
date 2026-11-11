@echo off
chcp 65001 >nul
title ShortCut AI - Stop Server
color 0c

cd /d "%~dp0"

if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe backend\cleanup_port.py
) else (
    python backend\cleanup_port.py
)

echo.
echo ShortCut AI server on port 8000 has been stopped.
pause
