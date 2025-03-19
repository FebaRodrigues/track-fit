@echo off
echo Starting Fitness Management System...

REM Kill any existing Node.js processes
echo Killing any existing Node.js processes...
taskkill /F /IM node.exe /T 2>nul

REM Wait for processes to terminate
echo Waiting for processes to terminate...
timeout /t 5 /nobreak > nul

REM Check if any node processes are still running
wmic process where name="node.exe" get processid 2>nul | find /i "ProcessId" > nul
if %ERRORLEVEL% EQU 0 (
    echo Some Node.js processes are still running. Please close them manually.
    echo You can use Task Manager to end these processes.
    pause
    exit
)

REM Change to the fitness-tracker directory and run the start script
cd fitness-tracker
call start-app.bat

echo Application started! You can access it at:
echo Server: http://localhost:7000
echo Client: http://localhost:5173 