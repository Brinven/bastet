@echo off
setlocal
cd /d "%~dp0"

REM --- Bastet dev launcher: Vite (5173) + Worker (wrangler dev, 8787) ---

where node >nul 2>nul
if errorlevel 1 (
  echo [Bastet] Node.js not found in PATH. Install Node 20+ and retry.
  exit /b 1
)

if not exist "node_modules" (
  echo [Bastet] node_modules missing - installing dependencies...
  call npm install
  if errorlevel 1 (
    echo [Bastet] npm install failed.
    exit /b 1
  )
)

echo [Bastet] Starting Worker  -> http://localhost:8787
start "Bastet Worker" cmd /k "cd /d %~dp0 && npx wrangler dev --local --port 8787"

echo [Bastet] Starting Web app -> http://localhost:5173
start "Bastet Web" cmd /k "cd /d %~dp0 && npm run dev"

echo [Bastet] Launched. Health check: http://localhost:8787/api/health
endlocal
