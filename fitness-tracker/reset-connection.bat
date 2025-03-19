@echo off
echo ===================================================
echo Fitness Management System - Connection Reset Utility
echo ===================================================
echo.
echo This utility will help resolve connection issues by:
echo 1. Killing any existing Node.js processes
echo 2. Resetting the server port configuration
echo 3. Validating server files for common errors
echo 4. Restarting the application
echo.
echo Please close your browser before continuing.
echo.
pause

REM Kill any existing Node.js processes
echo Killing any existing Node.js processes...
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq node.exe" /fo list ^| find "PID:"') do (
    echo Attempting to kill Node.js process with PID %%a
    taskkill /F /PID %%a >nul 2>&1
    if not errorlevel 1 (
        echo Successfully killed Node.js process with PID %%a
    )
)

REM Wait for processes to terminate
echo Waiting for processes to terminate...
timeout /t 5 /nobreak > nul

REM Reset port configuration
echo Resetting port configuration...
echo 7000 > current-port.txt
if exist "Client\gym\public\current-port.txt" (
    echo 7000 > Client\gym\public\current-port.txt
)

REM Validate the health routes file to prevent server crashes
echo Validating server files...
findstr /C:"auth(['admin'" Server\routes\healthRoutes.js >nul 2>&1
if not errorlevel 1 (
    echo WARNING: Found potential error in healthRoutes.js
    echo Fixing healthRoutes.js to prevent server crash...
    
    REM Create a backup of the original file
    copy Server\routes\healthRoutes.js Server\routes\healthRoutes.js.bak >nul
    
    REM Create a fixed version of the file
    echo const express = require('express'); > Server\routes\healthRoutes.js
    echo const router = express.Router(); >> Server\routes\healthRoutes.js
    echo. >> Server\routes\healthRoutes.js
    echo // Simple health check endpoint >> Server\routes\healthRoutes.js
    echo router.get('/', (req, res) =^> { >> Server\routes\healthRoutes.js
    echo   res.status(200).json({ >> Server\routes\healthRoutes.js
    echo     status: 'ok', >> Server\routes\healthRoutes.js
    echo     message: 'Server is running', >> Server\routes\healthRoutes.js
    echo     timestamp: new Date().toISOString(), >> Server\routes\healthRoutes.js
    echo     port: process.env.PORT ^|^| '7000' >> Server\routes\healthRoutes.js
    echo   }); >> Server\routes\healthRoutes.js
    echo }); >> Server\routes\healthRoutes.js
    echo. >> Server\routes\healthRoutes.js
    echo // Note: Example code was removed to prevent server crash >> Server\routes\healthRoutes.js
    echo. >> Server\routes\healthRoutes.js
    echo module.exports = router; >> Server\routes\healthRoutes.js
    
    echo Fixed healthRoutes.js file to prevent server crash
)

REM Create instructions for clearing browser cache
echo.
echo ===================================================
echo IMPORTANT: Please follow these steps in your browser
echo ===================================================
echo.
echo 1. Open your browser's developer tools (F12 or Ctrl+Shift+I)
echo 2. Go to the Application tab
echo 3. Select "Storage" on the left sidebar
echo 4. Check "Local Storage" and "Cookies"
echo 5. Click "Clear site data" button
echo 6. Close and reopen your browser
echo.
echo After completing these steps, restart the application.
echo.
pause

REM Start the application
echo Starting the application...
call start-app.bat

echo.
echo Connection reset complete. The application should now work correctly.
echo If you still experience issues, please contact support.
echo.
pause 