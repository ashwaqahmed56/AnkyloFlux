@echo off
title Push Ankylo to GitHub
echo ========================================================
echo       Ankylo Video Player - Automatic GitHub Pusher
echo ========================================================
echo.
echo Make sure you have created a repository on github.com:
echo e.g. https://github.com/ashwaqahmed56/ankylo
echo.
set /p REPO_URL="Enter your GitHub repository URL (or press Enter for https://github.com/ashwaqahmed56/ankylo.git): "
if "%REPO_URL%"=="" set REPO_URL=https://github.com/ashwaqahmed56/ankylo.git

echo.
echo Initializing Git and staging clean files...
cd /d "%~dp0"
if not exist ".git" (
    git init
    git branch -M main
)
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git add .
git commit -m "Initial commit: Ankylo universal interactive video player"
echo.
echo Pushing to GitHub (%REPO_URL%)...
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo SUCCESS! Your code has been uploaded to GitHub!
    echo ========================================================
) else (
    echo ========================================================
    echo If push failed, try:
    echo 1. Make sure the repository exists on GitHub
    echo 2. Run: git push -u origin main --force
    echo ========================================================
)
pause
