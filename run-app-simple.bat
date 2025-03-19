@echo off
echo Starting Fitness Management System...

echo Starting Server...
cd fitness-tracker\Server
start cmd /k "node index.js"

echo Starting Client...
cd ..\Client\gym
start cmd /k "npm run dev"

cd ..\..\..

echo Both server and client should be starting now.
echo Server is running at http://localhost:5051
echo Client is running at http://localhost:5173 