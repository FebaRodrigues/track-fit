@echo off
echo Killing all Node.js processes...
taskkill /F /IM node.exe

echo Waiting for processes to terminate...
timeout /t 2

echo Starting Fitness Management System...

echo Starting Server...
start cmd /k "cd Server && npm start"

echo Waiting for server to initialize...
timeout /t 5

echo Starting Client...
start cmd /k "cd Client\gym && npm run dev"

echo Both server and client should be starting now.
echo Server is running at http://localhost:7001
echo Client is running at http://localhost:5173 