@echo off
echo Starting Fitness Management System...
echo.

echo Starting Server...
start cmd /k "cd fitness-tracker\Server && node index.js"

echo Starting Client...
start cmd /k "cd fitness-tracker\Client\gym && npm run dev"

echo.
echo Both server and client should be starting now.
echo Server is running at http://localhost:5051
echo Client is running at http://localhost:5173
echo.
echo Press any key to exit this window...
pause > nul 