@echo off
echo Starting Fitness Management System...

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
)

REM Start the server
echo Starting server on port 5050...
cd Server
start /b cmd /c "node server.js > server.log 2>&1"
cd ..

REM Wait for server to initialize
echo Waiting for server to initialize...
timeout /t 5 >nul

REM Start the client
echo Starting client...
cd Client\gym
start /b cmd /c "npm run dev > client.log 2>&1"
cd ..\..

echo Both server and client should be starting now.
echo Server is running at http://localhost:5050
echo Client is running at http://localhost:5173 
echo Application started! You can access it at:
echo Server: http://localhost:5050
echo Client: http://localhost:5173 

REM Keep the window open
cmd /k 