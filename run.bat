@echo off
title GRI Auto-evaluation - Serveur local
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] Node.js n'est pas installe ou n'est pas dans le PATH.
    echo Telechargez-le depuis https://nodejs.org puis reessayez.
    echo.
    pause
    exit /b 1
)

set "PORT=3001"
echo Demarrage du serveur local sur le port %PORT%...
start "" http://localhost:%PORT%
node server/server.js
pause
