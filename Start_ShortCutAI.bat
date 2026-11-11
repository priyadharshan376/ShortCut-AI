@echo off
chcp 65001 >nul
title ShortCut AI - Running
color 0a

echo ===============================================================================
echo                ShortCut AI - Intelligent YouTube Shorts Pipeline
echo ===============================================================================
echo.

cd /d "%~dp0"

:: Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment 'venv' not found.
    echo Please run 'Setup.bat' first to install all required dependencies.
    echo.
    pause
    exit /b 1
)

:: Activate virtual environment
call venv\Scripts\activate.bat
set PYTHONPATH=%~dp0

:: Free up port 8000 if occupied
echo Checking port 8000...
python backend\cleanup_port.py

:: Open browser automatically after 3 seconds
start /b cmd /c "ping 127.0.0.1 -n 4 >nul && start http://localhost:8000"

echo.
echo ===============================================================================
echo  Application is running at: http://localhost:8000
echo  Press Ctrl+C in this console window to stop the server at any time.
echo ===============================================================================
echo.

uvicorn backend.app:app --host 127.0.0.1 --port 8000
pause
