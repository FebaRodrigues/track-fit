# ensure-port-5050.ps1
# Script to ensure the server is running on port 5050

Write-Host "Ensuring server is running on port 5050..." -ForegroundColor Cyan

# Determine the base directory
if (Test-Path "Server\server.js") {
    $baseDir = "."
    Write-Host "Using current directory as base directory" -ForegroundColor Green
} elseif (Test-Path "fitness-tracker\Server\server.js") {
    $baseDir = "fitness-tracker"
    Write-Host "Using fitness-tracker subdirectory as base directory" -ForegroundColor Green
} else {
    Write-Host "ERROR: Cannot find server.js file. Please run this script from the root directory." -ForegroundColor Red
    Write-Host "Current directory: $PWD" -ForegroundColor Yellow
    exit 1
}

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

# Set the working directory to the Server folder
$serverDir = Join-Path $PWD "$baseDir\Server"
Set-Location $serverDir

# Start the server
Write-Host "Starting server on port 5050..." -ForegroundColor Green
$serverProcess = Start-Process -FilePath "node" -ArgumentList "server.js" -NoNewWindow -PassThru

# Wait for server to start
Write-Host "Waiting for server to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Check if server started successfully
$serverStarted = $false
try {
    $connection = New-Object System.Net.Sockets.TcpClient("localhost", 5050)
    if ($connection.Connected) {
        Write-Host "Server started successfully on port 5050!" -ForegroundColor Green
        $connection.Close()
        $serverStarted = $true
    }
} catch {
    Write-Host "Failed to connect to server on port 5050. Server may not have started correctly." -ForegroundColor Red
}

if (-not $serverStarted) {
    Write-Host "Server failed to start on port 5050. Please check the server logs at: $serverDir\server.log" -ForegroundColor Red
    exit 1
}

# Set the working directory back to the root
if ($baseDir -eq ".") {
    Set-Location $PWD\..
} else {
    Set-Location $PWD\..\..\..
}

Write-Host "Server is running on port 5050. You can now start the client." -ForegroundColor Green
Write-Host "To start the client, run: cd $baseDir\Client\gym && npm run dev" -ForegroundColor Cyan 