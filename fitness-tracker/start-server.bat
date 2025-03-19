@echo off
echo Starting Fitness Tracker Server on port 5050...
cd %~dp0\fitness-tracker\Server
node start-server.js
pause 