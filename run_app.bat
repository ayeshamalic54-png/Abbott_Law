@echo off
title Abbott Law College Management System
echo ===================================================
echo   Starting Abbott Law College Management System...
echo ===================================================
echo.

cd /d "%~dp0"

echo Current Directory: %CD%
echo.

echo Checking Node.js installation...
node -v
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Starting Development Server...
echo URL: http://localhost:5000
echo.

call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo Server stopped with error code %errorlevel%.
)

echo.
echo Press any key to close this window...
pause
