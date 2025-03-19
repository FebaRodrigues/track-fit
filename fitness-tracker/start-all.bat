@echo off
echo Starting Fitness Management System...

echo Starting Server...
start cmd /k "cd Server && npm start"

echo Starting Client...
start cmd /k "cd Client\gym && npm run dev"

echo Both server and client should be starting now.
echo Server is running at http://localhost:7001
echo Client is running at http://localhost:5173 