@echo off
echo === Starting Server with Environment Variables ===

:: Set the current directory to the script directory
cd /d "%~dp0"

:: Check if .env file exists in the server directory
if exist .env (
    echo Loading .env from Server directory...
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" (
            set "%%a=%%b"
            echo Set environment variable: %%a
        )
    )
) else (
    echo Server .env file not found
)

:: Check if MONGO_URI is defined, if not try to load from root .env
if "%MONGO_URI%"=="" (
    if exist ..\..\..\.env (
        echo Loading .env from root directory...
        for /f "tokens=1,2 delims==" %%a in (..\..\..\.env) do (
            if not "%%a"=="" if not "%%a:~0,1%"=="#" (
                set "%%a=%%b"
                echo Set environment variable: %%a
            )
        )
    ) else (
        echo Root .env file not found
    )
)

:: Check for critical environment variables
set MISSING_VARS=0
if "%MONGO_URI%"=="" (
    echo ERROR: MONGO_URI is not defined
    set /a MISSING_VARS+=1
)
if "%STRIPE_SECRET_KEY%"=="" (
    echo ERROR: STRIPE_SECRET_KEY is not defined
    set /a MISSING_VARS+=1
)
if "%JWT_SECRET%"=="" (
    echo ERROR: JWT_SECRET is not defined
    set /a MISSING_VARS+=1
)

if %MISSING_VARS% GTR 0 (
    echo Please check your .env file and try again.
    exit /b 1
)

:: Determine which server file to run
set SERVER_FILE=server.js
if "%1"=="index" set SERVER_FILE=index.js
echo Starting server using %SERVER_FILE%...

:: Get the port from environment variables or use default
if "%PORT%"=="" set PORT=5050
echo Server starting on port %PORT%

:: Start the server
node %SERVER_FILE% 