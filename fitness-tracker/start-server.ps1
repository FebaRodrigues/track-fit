# start-server.ps1
# Script to start the server with proper environment setup

# Kill any existing Node.js processes
Write-Host "Checking for existing Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Found existing Node.js processes. Attempting to terminate..." -ForegroundColor Yellow
    foreach ($process in $nodeProcesses) {
        try {
            Stop-Process -Id $process.Id -Force -ErrorAction Stop
            Write-Host "Successfully terminated Node.js process with PID $($process.Id)" -ForegroundColor Green
        } catch {
            Write-Host "Failed to kill Node.js process with PID $($process.Id). Error: $_" -ForegroundColor Red
        }
    }
    
    # Wait a moment for processes to fully terminate
    Start-Sleep -Seconds 2
} else {
    Write-Host "No existing Node.js processes found." -ForegroundColor Green
}

# Set the working directory to the Server folder
$serverDir = Join-Path $PSScriptRoot "Server"
Set-Location $serverDir

# Check if port 5050 is already in use
$portInUse = $false
try {
    $connections = Get-NetTCPConnection -LocalPort 5050 -ErrorAction SilentlyContinue
    if ($connections) {
        $portInUse = $true
        Write-Host "Port 5050 is already in use by another process." -ForegroundColor Red
        
        foreach ($conn in $connections) {
            $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "Process using port 5050: $($process.Name) (PID: $($process.Id))" -ForegroundColor Yellow
                
                # Try to kill the process
                try {
                    Stop-Process -Id $process.Id -Force -ErrorAction Stop
                    Write-Host "Successfully terminated process $($process.Name) with PID $($process.Id)" -ForegroundColor Green
                    $portInUse = $false
                } catch {
                    Write-Host "Failed to kill process. Error: $_" -ForegroundColor Red
                }
            }
        }
        
        if ($portInUse) {
            Write-Host "Please close the application using port 5050 and try again." -ForegroundColor Red
            Write-Host "This application must run on port 5050 to maintain data consistency." -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "Error checking port usage: $_" -ForegroundColor Red
}

# Start the server
Write-Host "Starting server on port 5050..." -ForegroundColor Green
node server.js

Write-Host "You can access the server at http://localhost:5050" -ForegroundColor Green
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 