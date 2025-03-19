@echo off
echo Starting Fitness Management System on port 5050...

REM Check if we're already in the fitness-tracker directory
if exist "Server\server.js" (
    set "BASE_DIR=."
) else if exist "fitness-tracker\Server\server.js" (
    set "BASE_DIR=fitness-tracker"
) else (
    echo ERROR: Cannot find server.js file. Please run this script from the root directory.
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo Using base directory: %BASE_DIR%

REM Kill any existing Node.js processes
echo Killing any existing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
echo Waiting for processes to terminate...
timeout /t 2 >nul

REM Check if port 5050 is in use
echo Checking if port 5050 is in use...
netstat -ano | findstr :5050 | findstr TCP >nul
if %ERRORLEVEL% EQU 0 (
    echo Port 5050 is already in use. Attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5050 ^| findstr TCP') do (
        echo Killing process with PID %%a
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 >nul
    
    REM Check again if port is free
    netstat -ano | findstr :5050 | findstr TCP >nul
    if %ERRORLEVEL% EQU 0 (
        echo Failed to free port 5050. Please close the application using this port manually.
        echo This application must run on port 5050 to maintain data consistency.
        pause
        exit /b 1
    )
)

REM Create a directory for the server port file if it doesn't exist
if not exist "%BASE_DIR%\Client\gym\public" mkdir "%BASE_DIR%\Client\gym\public"

REM Set the port to 5050
echo 5050 > %BASE_DIR%\current-port.txt
echo 5050 > %BASE_DIR%\Client\gym\public\server-port.txt

REM Start the server
echo Starting server on port 5050...
cd %BASE_DIR%\Server
start /b cmd /c "node server.js > server.log 2>&1"
cd ..

REM Wait for server to initialize
echo Waiting for server to initialize...
timeout /t 5 >nul

REM Check if server started successfully
echo Checking if server started successfully...
powershell -Command "try { $connection = New-Object System.Net.Sockets.TcpClient('localhost', 5050); if ($connection.Connected) { Write-Host 'Server started successfully on port 5050!' -ForegroundColor Green; $connection.Close() } } catch { Write-Host 'Failed to connect to server on port 5050. Server may not have started correctly.' -ForegroundColor Red; exit 1 }"
if %ERRORLEVEL% NEQ 0 (
    echo Server failed to start on port 5050. Please check the server logs.
    echo Server log location: %CD%\Server\server.log
    pause
    exit /b 1
)

REM Start the client
echo Starting client...
cd Client\gym
start /b cmd /c "npm run dev > client.log 2>&1"
cd ..\..

if "%BASE_DIR%" NEQ "." (
    cd ..
)

echo Both server and client should be starting now.
echo Server is running at http://localhost:5050
echo Client is running at http://localhost:5173 
echo Application started! You can access it at:
echo Server: http://localhost:5050
echo Client: http://localhost:5173

echo.
echo IMPORTANT: This application must run on port 5050 to maintain data consistency.
echo If you change the port, all user, admin, and trainer data will be lost.

REM Keep the window open
cmd /k 