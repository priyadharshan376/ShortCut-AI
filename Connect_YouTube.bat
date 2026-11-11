@echo off
chcp 65001 >nul
title ShortCut AI - Connect YouTube Channel
color 0e

cd /d "%~dp0"

if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment 'venv' not found.
    echo Please run 'Setup.bat' first.
    pause
    exit /b 1
)

call venv\Scripts\activate.bat
set PYTHONPATH=%~dp0

python auth_youtube.py
echo.
pause
