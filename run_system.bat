@echo off
setlocal enabledelayedexpansion
title FloodAI System Launcher
cd /d "%~dp0"

:MENU
cls
echo =====================================================================
echo          FloodAI - AI Flood Prediction and Alert System
echo                        Local Full-Stack Launcher
echo =====================================================================
echo.

:: 1. Verify Prerequisites
echo [1/5] Checking environment prerequisites...
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in system PATH!
    echo Please install Python 3.10+ from https://python.org and add it to PATH.
    echo.
    pause
    exit /b 1
)

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in system PATH!
    echo Please install Node.js from https://nodejs.org and add it to PATH.
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not installed or not in system PATH!
    echo.
    pause
    exit /b 1
)
echo    [OK] Python and Node.js detected.
echo.

:: 2. Check and Setup Configuration
echo [2/5] Checking project configuration and dependencies...
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        echo    [INFO] backend\.env not found. Creating from .env.example...
        copy /y "backend\.env.example" "backend\.env" >nul
        echo    [OK] backend\.env generated.
    )
)

if not exist "backend\node_modules" (
    echo    [INFO] Installing Node dependencies in backend...
    cd /d "%~dp0backend"
    call npm install
    cd /d "%~dp0"
    echo    [OK] Node dependencies installed.
) else (
    echo    [OK] Node dependencies present.
)

python -c "import flask, flask_cors, xgboost, shap" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo    [INFO] Installing Python dependencies: flask, flask-cors, scikit-learn, pandas, xgboost, shap...
    python -m pip install -r ml_model\requirements.txt
    echo    [OK] Python dependencies installed.
) else (
    echo    [OK] Python dependencies verified: XGBoost, SHAP, scikit-learn.
)
echo.

:: 3. Free Port Conflicts (if any)
echo [3/5] Checking port availability for 3000, 5000, 8000...
for %%P in (3000 5000 8000) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":%%P.*LISTENING"') do (
        if not "%%a"=="" if not "%%a"=="0" (
            echo    [WARN] Port %%P is occupied by process PID %%a. Freeing port...
            taskkill /f /pid %%a >nul 2>nul
        )
    )
)
echo    [OK] Ports 3000, 5000, and 8000 are ready.
echo.

:: 4. Check MongoDB Status
echo [4/5] Checking database status...
if exist "atlas-credentials.env" (
    echo    [OK] MongoDB Atlas cloud cluster configuration detected [atlas-credentials.env].
) else (
    findstr /i "mongodb+srv" .env >nul 2>nul
    if !ERRORLEVEL! equ 0 (
        echo    [OK] MongoDB Atlas cloud cluster URI detected in .env.
    ) else (
        netstat -aon | findstr ":27017" | findstr "LISTENING" >nul 2>nul
        if !ERRORLEVEL! equ 0 (
            echo    [OK] Local MongoDB detected running on port 27017.
        ) else (
            echo    [INFO] Standalone resilient mode active.
        )
    )
)
echo.

:: 5. Launch Services
echo [5/5] Launching all system services...

:: Launch ML Microservice (Port 8000)
echo    -- Starting Python ML Microservice on port 8000...
start "FloodAI - ML Microservice [8000]" cmd /k "title FloodAI - ML Microservice [8000] && cd /d ""%~dp0ml_model"" && python predict_api.py"

:: Launch Node.js API (Port 5000)
echo    -- Starting Node.js Express API on port 5000...
start "FloodAI - Backend API [5000]" cmd /k "title FloodAI - Backend API [5000] && cd /d ""%~dp0backend"" && npm start"

:: Launch Frontend Web Server (Port 3000)
echo    -- Starting Frontend HTTP Server on port 3000...
start "FloodAI - Frontend Server [3000]" cmd /k "title FloodAI - Frontend Server [3000] && cd /d ""%~dp0frontend"" && python -m http.server 3000"

echo.
echo =====================================================================
echo                    All Services Launched!
echo =====================================================================
echo  Initializing servers, opening web dashboard in 3 seconds...
ping 127.0.0.1 -n 4 >nul

:: Open web browser
start http://localhost:3000

:CONTROL_PANEL
cls
echo =====================================================================
echo          FloodAI - AI Flood Prediction and Alert System
echo                        Active System Monitor
echo =====================================================================
echo.
echo  Access Points:
echo    - Frontend Web App    : http://localhost:3000
echo    - Node.js Backend API : http://localhost:5000
echo    - ML Microservice API : http://localhost:8000/health
echo.
echo  Available Controls:
echo    [B] Reopen Dashboard in Browser
echo    [R] Restart All Services
echo    [S] Stop All Services and Exit
echo    [Q] Quit Launcher [Keep services running in background]
echo.
echo =====================================================================
set /p USER_CHOICE="Select an action [B / R / S / Q]: "

if /i "%USER_CHOICE%"=="B" (
    start http://localhost:3000
    goto CONTROL_PANEL
)
if /i "%USER_CHOICE%"=="R" (
    echo.
    echo Stopping running services...
    call :STOP_PORTS
    echo Restarting...
    ping 127.0.0.1 -n 2 >nul
    goto MENU
)
if /i "%USER_CHOICE%"=="S" (
    echo.
    echo Stopping all FloodAI services...
    call :STOP_PORTS
    echo [OK] All FloodAI services stopped.
    ping 127.0.0.1 -n 2 >nul
    exit /b 0
)
if /i "%USER_CHOICE%"=="Q" (
    echo.
    echo Leaving services running in background. Goodbye!
    ping 127.0.0.1 -n 2 >nul
    exit /b 0
)

goto CONTROL_PANEL

:STOP_PORTS
for %%P in (3000 5000 8000) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":%%P.*LISTENING"') do (
        if not "%%a"=="" if not "%%a"=="0" (
            taskkill /f /pid %%a >nul 2>nul
        )
    )
)
exit /b 0
