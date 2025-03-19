@echo off
setlocal enabledelayedexpansion

echo Starting Fitness Management System on port 5050...
echo Using base directory: %CD%

echo Checking if port 5050 is in use...
set PORT_IN_USE=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5050') do (
    set PORT_IN_USE=1
    set pid=%%a
    echo Port 5050 is in use by process with PID: !pid!
    echo Attempting to kill process with PID: !pid!
    taskkill /F /PID !pid!
    if !errorlevel! equ 0 (
        echo Successfully killed process with PID: !pid!
        set PORT_IN_USE=0
    ) else (
        echo Failed to kill process with PID: !pid!
        echo You may need to run this script as administrator or manually close the application using port 5050.
    )
)

if !PORT_IN_USE! equ 1 (
    echo.
    echo Failed to free port 5050. Please close the application using this port manually.
    echo This application must run on port 5050 to maintain data consistency.
    echo.
    echo Press any key to exit...
    pause > nul
    exit /b 1
)

echo Port 5050 is available. Starting server...

cd Server
echo Starting server from directory: %CD%

echo Installing dependencies if needed...
call npm install

echo Starting server...
call npm start

if !errorlevel! neq 0 (
    echo.
    echo Failed to start server. Please check the error messages above.
    echo.
    echo Press any key to exit...
    pause > nul
    exit /b 1
)

echo.
echo Server started successfully on port 5050.
echo Press Ctrl+C to stop the server.
echo. 