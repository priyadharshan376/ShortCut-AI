@echo off
chcp 65001 >nul
title ShortCut AI - Automated Installation and Setup
color 0b

echo ===============================================================================
echo                ShortCut AI - Setup and Dependency Installer
echo ===============================================================================
echo.

cd /d "%~dp0"

:: 1. Check Python
echo [1/5] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python 3.10+ was not found in your PATH.
    echo Please install Python from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)
python -c "import sys; print(f'Detected Python {sys.version.split()[0]}')"

:: 2. Check Node.js
echo.
echo [2/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not found in your PATH.
    echo Please install Node.js (LTS version) from https://nodejs.org/
    pause
    exit /b 1
)
node -e "console.log('Detected Node.js ' + process.version)"

:: 3. Check FFmpeg
echo.
echo [3/5] Checking FFmpeg installation...
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] FFmpeg was not found in PATH.
    echo ShortCut AI can auto-detect WinGet FFmpeg or you can install it via:
    echo     winget install Gyan.FFmpeg
    echo It is strongly recommended to install FFmpeg for fast 9:16 rendering.
) else (
    echo Detected FFmpeg in PATH.
)

:: 4. Create Virtual Environment and Install Python Dependencies
echo.
echo [4/5] Setting up Python virtual environment and backend dependencies...
if not exist "venv" (
    echo Creating virtual environment in .\venv ...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
)

call venv\Scripts\activate.bat
echo Upgrading pip and wheel...
python -m pip install --upgrade pip wheel >nul 2>&1

echo Installing backend requirements from requirements.txt...
pip install -r backend\requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b 1
)

:: Copy .env.example if .env does not exist
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo Created default .env file.
    )
)

:: 5. Install and Build Frontend
echo.
echo [5/5] Building frontend user interface...
cd frontend
if not exist "dist\index.html" (
    echo Installing npm dependencies...
    call npm.cmd install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        cd ..
        pause
        exit /b 1
    )
    echo Building production bundle...
    call npm.cmd run build
    if %errorlevel% neq 0 (
        echo [ERROR] npm run build failed.
        cd ..
        pause
        exit /b 1
    )
) else (
    echo Frontend dist is already compiled. (Run 'npm run build' inside frontend if you modify UI code)
)
cd ..

echo.
echo ===============================================================================
echo                ShortCut AI Setup Completed Successfully!
echo ===============================================================================
echo.
echo Next Steps:
echo 1. Connect your YouTube Channel:
echo    Double-click 'Connect_YouTube.bat' OR connect directly inside the web UI.
echo.
echo 2. Start ShortCut AI:
echo    Double-click 'Start_ShortCutAI.bat' and the web app will open at:
echo    http://localhost:8000
echo.
pause
