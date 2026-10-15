@echo off
cd /d "%~dp0frontend"
echo ========================================================
echo Starting FarmwiseAI Vite React Frontend...
echo Frontend UI: http://127.0.0.1:5173
echo ========================================================
npm run dev -- --host 127.0.0.1 --port 5173
pause
