@echo off
setlocal

REM --- Restart = stop -> brief pause -> start ---
call "%~dp0stop.bat"

REM ping-as-sleep: timeout /t fails under non-interactive cmd (CLAUDE.md)
ping 127.0.0.1 -n 3 >nul

call "%~dp0start.bat"
endlocal
