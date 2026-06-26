@echo off
setlocal

REM --- Stop ONLY Bastet's dev servers, anchored to its dev ports (5173, 8787). ---
REM Port-anchored so this never touches unrelated Node/Electron apps. Do not
REM switch this to a bare process-name match (CLAUDE.md launcher rule).

echo [Bastet] Stopping dev servers on ports 5173 and 8787...

powershell -NoProfile -ExecutionPolicy Bypass -Command "foreach($p in 5173,8787){ Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { try { Stop-Process -Id $_ -Force -ErrorAction Stop; Write-Host ('  killed PID {0} (port {1})' -f $_,$p) } catch {} } }"

echo [Bastet] Verifying ports freed...
powershell -NoProfile -ExecutionPolicy Bypass -Command "foreach($p in 5173,8787){ $c = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue; if($c){ Write-Host ('  port {0} STILL in use' -f $p) } else { Write-Host ('  port {0} free' -f $p) } }"

echo [Bastet] Done.
endlocal
