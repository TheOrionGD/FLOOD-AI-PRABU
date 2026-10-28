@echo off
title Stop FloodAI Services
cd /d "%~dp0"

echo =====================================================================
echo                   Stopping FloodAI Services
echo =====================================================================
echo.

set STOPPED=0

for %%P in (3000 5000 8000) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":%%P.*LISTENING"') do (
        if not "%%a"=="" if not "%%a"=="0" (
            echo  [STOPPING] Terminating process on port %%P - PID %%a...
            taskkill /f /pid %%a >nul 2>nul
            set /a STOPPED+=1
        )
    )
)

echo.
if %STOPPED% gtr 0 (
    echo [OK] All FloodAI service processes stopped successfully.
) else (
    echo [INFO] No active FloodAI service was found running on ports 3000, 5000, or 8000.
)
echo.
ping 127.0.0.1 -n 3 >nul
exit /b 0
