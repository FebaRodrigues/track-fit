@echo off
echo Starting Vite development server...

:: Check if vite.cmd exists
if exist "node_modules\.bin\vite.cmd" (
    echo Found Vite executable
    echo Starting Vite server on port 5173...
    node_modules\.bin\vite.cmd --port 5173 --host
) else (
    echo Vite executable not found
    echo Trying to run via npm...
    npm run dev
)

pause 