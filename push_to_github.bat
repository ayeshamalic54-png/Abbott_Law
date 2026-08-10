@echo off
title Push to GitHub - Abbott Law
echo ===================================================
echo   Pushing Abbott Law Project to GitHub...
echo ===================================================
echo.

cd /d "%~dp0"

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS! All files pushed to GitHub successfully.
) else (
    echo.
    echo Push failed. Please log in when prompted or check internet connection.
)

echo.
echo Press any key to close...
pause
