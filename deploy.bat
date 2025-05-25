@echo off
echo ===== Salud Language Learning Platform Deployment =====
echo.

REM Check if Node.js is in the PATH
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not found in your PATH.
    echo Temporarily adding Node.js to PATH for this session...
    set PATH=%PATH%;C:\Program Files\nodejs
    echo.
)

REM Verify Node.js is accessible
node -v >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Failed to access Node.js. Please make sure it's installed correctly.
    echo You can run add-nodejs-to-path.ps1 as Administrator to add Node.js to your PATH permanently.
    echo.
    pause
    exit /b 1
)

REM Check if Vercel CLI is installed
call vercel --version >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Vercel CLI is not installed. Installing it now...
    call npm install -g vercel
    echo.
)

REM Generate V0 metadata
echo Generating V0 metadata...
call node v0-integration.js
echo.

REM Run deployment script
echo Running deployment script...
call node deploy-to-vercel.js
echo.

echo ===== Deployment Process Completed =====
echo.
echo Next steps:
echo 1. Follow the instructions above to connect your project to V0
echo 2. See V0_INTEGRATION.md for more details on V0 integration
echo.

pause
