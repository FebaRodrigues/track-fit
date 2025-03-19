@echo off
echo Starting clean server startup process...

REM Kill all Node.js processes first
echo Attempting to kill all Node.js processes...
taskkill /F /IM node.exe /T 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Successfully killed all Node.js processes
) else (
    echo No Node.js processes found or could not kill them
)

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0start-clean.ps1"

REM If PowerShell script fails, try direct approach
if %ERRORLEVEL% NEQ 0 (
    echo PowerShell script failed, trying direct approach...
    
    REM Kill processes on ports (this is a simplified approach)
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5050" ^| findstr "LISTENING"') do (
        echo Killing process %%a using port 5050
        taskkill /F /PID %%a
    )
    
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5051" ^| findstr "LISTENING"') do (
        echo Killing process %%a using port 5051
        taskkill /F /PID %%a
    )
    
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5052" ^| findstr "LISTENING"') do (
        echo Killing process %%a using port 5052
        taskkill /F /PID %%a
    )
    
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":7000" ^| findstr "LISTENING"') do (
        echo Killing process %%a using port 7000
        taskkill /F /PID %%a
    )
    
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
        echo Killing process %%a using port 8000
        taskkill /F /PID %%a
    )
    
    REM Wait a moment for processes to terminate
    timeout /t 2 /nobreak > nul
    
    cd Server
    echo Starting server with nodemon on port 7000 (or next available port)...
    nodemon index.js
) 