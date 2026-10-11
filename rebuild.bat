@echo off
title Rebuilding Ankylo.exe
cd /d "%~dp0"
echo ========================================================
echo             Rebuilding Ankylo Single-File EXE
echo ========================================================
echo.
powershell -ExecutionPolicy Bypass -File scripts\build-all.ps1 -SkipSidecars
if %ERRORLEVEL% EQU 0 (
    copy /y build\Ankylo.exe "%USERPROFILE%\Desktop\Ankylo.exe" >nul
    echo.
    echo ========================================================
    echo SUCCESS: Fresh Ankylo.exe built and copied to your Desktop!
    echo ========================================================
) else (
    echo.
    echo Rebuild failed. Check the error messages above.
)
pause
