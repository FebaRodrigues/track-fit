@echo off
echo Ensuring server is running on port 5050...

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

REM Start the server
echo Starting server on port 5050...
cd %BASE_DIR%\Server
start /b cmd /c "node server.js > server.log 2>&1"
cd ..

REM Wait for server to start
echo Waiting for server to initialize...
timeout /t 5 >nul

REM Check if server started successfully
echo Checking if server started successfully...
powershell -Command "try { $connection = New-Object System.Net.Sockets.TcpClient('localhost', 5050); if ($connection.Connected) { Write-Host 'Server started successfully on port 5050!' -ForegroundColor Green; $connection.Close() } } catch { Write-Host 'Failed to connect to server on port 5050. Server may not have started correctly.' -ForegroundColor Red }"

if "%BASE_DIR%" NEQ "." (
    cd ..
)

echo Server is running on port 5050. You can now start the client.
echo To start the client, run: cd %BASE_DIR%\Client\gym ^&^& npm run dev

echo You can access the server at http://localhost:5050 