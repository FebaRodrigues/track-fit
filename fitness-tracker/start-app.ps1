# start-app.ps1
# Script to start both server and client

Write-Host "Starting Fitness Management System..." -ForegroundColor Green

# Kill any existing Node.js processes
Write-Host "Checking for existing Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found Node.js processes. Attempting to terminate..." -ForegroundColor Yellow
    foreach ($process in $nodeProcesses) {
        try {
            Stop-Process -Id $process.Id -Force -ErrorAction Stop
            Write-Host "Successfully killed Node.js process with PID $($process.Id)" -ForegroundColor Green
        } catch {
            Write-Host "Failed to kill Node.js process with PID $($process.Id). Error: $_" -ForegroundColor Red
        }
    }
} else {
    Write-Host "No Node.js processes found" -ForegroundColor Green
}

# Wait a moment for processes to terminate
Write-Host "Waiting for processes to terminate..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Start the server in a new window
Write-Host "Starting server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -Path '.\Server'; nodemon index.js"

# Wait for server to initialize
Write-Host "Waiting for server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start the client in a new window
Write-Host "Starting client..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -Path '.\Client\gym'; npm run dev"

Write-Host "Both server and client should be starting now." -ForegroundColor Green
Write-Host "Server is running at http://localhost:7000" -ForegroundColor Cyan
Write-Host "Client is running at http://localhost:5173" -ForegroundColor Cyan 