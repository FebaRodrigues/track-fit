@echo off
setlocal enabledelayedexpansion

echo Checking for processes using port 5050...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5050') do (
    set pid=%%a
    echo Found process with PID: !pid!
    echo Attempting to kill process with PID: !pid!
    taskkill /F /PID !pid!
    if !errorlevel! equ 0 (
        echo Successfully killed process with PID: !pid!
    ) else (
        echo Failed to kill process with PID: !pid!
    )
)

echo.
echo If the process could not be killed, you may need to run this script as administrator.
echo.
echo Press any key to exit...
pause > nul 