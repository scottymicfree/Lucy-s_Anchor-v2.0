@echo off
title Lucy Anchor Sovereign Workstation v1.0
color 0B
echo =====================================================================
echo                LUCY ANCHOR SOVEREIGN WORKSPACE v1.0
echo =====================================================================
echo.

:: Check Node.js installation
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js (v18+) and try again.
    pause
    exit /b
)

:: Verify dependencies
if not exist node_modules (
    echo [SYSTEM] Node modules missing. Initializing installation...
    call npm install
) else (
    echo [SYSTEM] Node modules detected. Verifying packages...
)

echo.
echo [SYSTEM] Starting Lucy Ecosystem Orchestrator Backend...
start "Lucy Backend (Port 3001)" cmd /k "title Lucy Backend Server && npm run server"

echo [SYSTEM] Starting Lucy Workstation Frontend Console...
start "Lucy Frontend (Port 3000)" cmd /k "title Lucy Frontend Dev Server && npm run dev"

echo.
echo =====================================================================
echo   LUCY ANCHOR ACTIVE CORE RUNNING IN BACKGROUND SEPARATE SECTIONS
echo   - Backend Server: http://localhost:3001
echo   - Frontend Studio: http://localhost:3000
echo =====================================================================
echo.
pause
