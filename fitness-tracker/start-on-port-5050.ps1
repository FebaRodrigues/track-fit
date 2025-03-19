# start-on-port-5050.ps1
# Script to start both the server and client on port 5050

Write-Host "Starting Fitness Management System on port 5050..." -ForegroundColor Cyan

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

# Create directory for server port file if it doesn't exist
$clientPublicDir = Join-Path $PWD "$baseDir\Client\gym\public"
if (-not (Test-Path $clientPublicDir)) {
    New-Item -ItemType Directory -Path $clientPublicDir -Force | Out-Null
    Write-Host "Created directory: $clientPublicDir" -ForegroundColor Green
}

# Set the port to 5050
$portFilePath = Join-Path $PWD "$baseDir\current-port.txt"
$clientPortFilePath = Join-Path $clientPublicDir "server-port.txt"
"5050" | Out-File -FilePath $portFilePath -Force
"5050" | Out-File -FilePath $clientPortFilePath -Force
Write-Host "Set port to 5050 in port files" -ForegroundColor Green

# Set the working directory to the Server folder
$serverDir = Join-Path $PWD "$baseDir\Server"
Set-Location $serverDir

# Start the server
Write-Host "Starting server on port 5050..." -ForegroundColor Green
$serverProcess = Start-Process -FilePath "node" -ArgumentList "server.js" -NoNewWindow -PassThru

# Wait for server to start
Write-Host "Waiting for server to initialize..." -ForegroundColor Cyan
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

# Set the working directory to the Client folder
$clientDir = Join-Path $PWD "..\Client\gym"
Set-Location $clientDir

# Start the client
Write-Host "Starting client..." -ForegroundColor Green
$clientProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow -PassThru

# Set the working directory back to the root
if ($baseDir -eq ".") {
    Set-Location $PWD\..
} else {
    Set-Location $PWD\..\..\..
}

Write-Host "Both server and client should be starting now." -ForegroundColor Green
Write-Host "Server is running at http://localhost:5050" -ForegroundColor Cyan
Write-Host "Client is running at http://localhost:5173" -ForegroundColor Cyan
Write-Host "Application started! You can access it at:" -ForegroundColor Green
Write-Host "Server: http://localhost:5050" -ForegroundColor Cyan
Write-Host "Client: http://localhost:5173" -ForegroundColor Cyan

Write-Host "`nIMPORTANT: This application must run on port 5050 to maintain data consistency." -ForegroundColor Yellow
Write-Host "If you change the port, all user, admin, and trainer data will be lost." -ForegroundColor Yellow

# Keep the script running to maintain the processes
Write-Host "`nPress Ctrl+C to stop the server and client..." -ForegroundColor Cyan
try {
    while ($true) {
        Start-Sleep -Seconds 1
        
        # Check if processes are still running
        if ($serverProcess.HasExited) {
            Write-Host "Server process has exited unexpectedly." -ForegroundColor Red
            break
        }
        
        if ($clientProcess.HasExited) {
            Write-Host "Client process has exited unexpectedly." -ForegroundColor Red
            break
        }
    }
} finally {
    # Clean up processes when the script is terminated
    if (-not $serverProcess.HasExited) {
        Write-Host "Stopping server process..." -ForegroundColor Yellow
        Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    if (-not $clientProcess.HasExited) {
        Write-Host "Stopping client process..." -ForegroundColor Yellow
        Stop-Process -Id $clientProcess.Id -Force -ErrorAction SilentlyContinue
    }
} 