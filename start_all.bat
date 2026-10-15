@echo off
cd /d "%~dp0"
echo ========================================================
echo Launching FarmwiseAI Full-Stack Intelligence Platform
echo ========================================================

echo Starting Backend Server (Port 8000)...
start "FarmwiseAI Backend" cmd /k "call "%~dp0start_backend.bat""

echo Starting Frontend Dev Server (Port 5173)...
start "FarmwiseAI Frontend" cmd /k "call "%~dp0start_frontend.bat""

echo Waiting 4 seconds for servers to initialize...
timeout /t 4 /nobreak >nul

echo Opening http://127.0.0.1:5173 in your default browser...
start "" "http://127.0.0.1:5173"

echo.
echo ========================================================
echo Both servers are running in separate windows!
echo   - Website (Frontend): http://127.0.0.1:5173
echo   - Backend API Docs:   http://127.0.0.1:8000/docs
echo ========================================================
pause
