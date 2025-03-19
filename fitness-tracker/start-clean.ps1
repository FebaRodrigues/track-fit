# start-clean.ps1
# Script to clean up ports and start the server

Write-Host "Starting clean server startup process..." -ForegroundColor Green

# Function to kill processes using a specific port
function Kill-ProcessByPort {
    param (
        [int]$Port
    )
    
    Write-Host "Checking for processes using port $Port..." -ForegroundColor Yellow
    
    # Find process using the port
    $processInfo = netstat -ano | findstr ":$Port" | findstr "LISTENING"
    
    if ($processInfo) {
        # Extract PID
        $pid = ($processInfo -split '\s+')[-1]
        
        if ($pid -match '^\d+$') {
            Write-Host "Found process with PID $pid using port $Port. Attempting to kill..." -ForegroundColor Yellow
            
            try {
                Stop-Process -Id $pid -Force -ErrorAction Stop
                Write-Host "Successfully killed process with PID $pid" -ForegroundColor Green
            }
            catch {
                Write-Host "Failed to kill process with PID $pid. Error: $_" -ForegroundColor Red
            }
        }
    }
    else {
        Write-Host "No process found using port $Port" -ForegroundColor Green
    }
}

# Kill all Node.js processes
Write-Host "Attempting to kill all Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    foreach ($process in $nodeProcesses) {
        try {
            Stop-Process -Id $process.Id -Force -ErrorAction Stop
            Write-Host "Successfully killed Node.js process with PID $($process.Id)" -ForegroundColor Green
        }
        catch {
            Write-Host "Failed to kill Node.js process with PID $($process.Id). Error: $_" -ForegroundColor Red
        }
    }
}
else {
    Write-Host "No Node.js processes found" -ForegroundColor Green
}

# Kill processes using common ports
Write-Host "Checking for processes using specific ports..." -ForegroundColor Yellow
Kill-ProcessByPort -Port 5050
Kill-ProcessByPort -Port 5051
Kill-ProcessByPort -Port 5052
Kill-ProcessByPort -Port 50501
Kill-ProcessByPort -Port 7000
Kill-ProcessByPort -Port 8000

# Wait a moment for processes to fully terminate
Write-Host "Waiting for processes to terminate..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Change to Server directory
Write-Host "Changing to Server directory..." -ForegroundColor Yellow
Set-Location -Path "./Server"

# Start the server with nodemon
Write-Host "Starting server with nodemon..." -ForegroundColor Green
Write-Host "The server will use port 7000 (or next available port)" -ForegroundColor Cyan
nodemon index.js

# Note: This script will not return until the server is stopped 