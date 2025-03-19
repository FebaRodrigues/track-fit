@echo off
echo Restarting the server...
cd Server
powershell -ExecutionPolicy Bypass -File .\restart-server.ps1
pause 