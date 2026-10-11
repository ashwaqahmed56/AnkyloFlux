@echo off
title Push Ankylo to GitHub (AnkyloFlux)
echo ========================================================
echo       Ankylo Video Player - GitHub Pusher
echo ========================================================
echo.
cd /d "%~dp0"

echo [1/4] Configuring Git user identity...
git config user.name "Ashwaq Ahmed"
git config user.email "ashwaqahmed56@users.noreply.github.com"
git config --global user.name "Ashwaq Ahmed" 2>nul
git config --global user.email "ashwaqahmed56@users.noreply.github.com" 2>nul

echo.
echo [2/4] Initializing repository and branch 'main'...
if not exist ".git" (
    git init
)
git branch -M main

set REPO_URL=https://github.com/ashwaqahmed56/AnkyloFlux.git
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo.
echo [3/4] Staging clean files and committing...
git add .
git commit -m "Initial commit: Ankylo universal interactive video player" 2>nul

echo.
echo [4/4] Pushing to %REPO_URL%...
echo (If a browser window or login prompt appears, please sign in to GitHub)
echo.
git push -u origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo --------------------------------------------------------
    echo If push was rejected because the GitHub repo already has a README or license:
    echo Attempting to push with --force...
    echo --------------------------------------------------------
    git push -u origin main --force
)

echo.
echo ========================================================
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS! Your code has been uploaded to GitHub!
    echo Check it here: https://github.com/ashwaqahmed56/AnkyloFlux
) else (
    echo Something went wrong. Please check your GitHub login and try again.
)
echo ========================================================
echo.
pause
