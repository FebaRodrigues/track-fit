Write-Host "Fitness Tracker Server Diagnostics" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverDir = Join-Path $scriptDir "fitness-tracker\Server"

Write-Host "`nChecking server directory..." -ForegroundColor Yellow
if (Test-Path $serverDir) {
    Write-Host "✅ Server directory found at: $serverDir" -ForegroundColor Green
} else {
    Write-Host "❌ Server directory not found at: $serverDir" -ForegroundColor Red
    Write-Host "   Please make sure the server files are in the correct location" -ForegroundColor Red
    exit
}

# Check if server.js exists
$serverJsPath = Join-Path $serverDir "server.js"
if (Test-Path $serverJsPath) {
    Write-Host "✅ server.js found" -ForegroundColor Green
} else {
    Write-Host "❌ server.js not found" -ForegroundColor Red
}

# Check if start-server.js exists
$startServerJsPath = Join-Path $serverDir "start-server.js"
if (Test-Path $startServerJsPath) {
    Write-Host "✅ start-server.js found" -ForegroundColor Green
} else {
    Write-Host "❌ start-server.js not found" -ForegroundColor Red
}

# Check if .env file exists
$envPath = Join-Path $serverDir ".env"
if (Test-Path $envPath) {
    Write-Host "✅ .env file found" -ForegroundColor Green
    
    # Check if PORT is defined in .env
    $envContent = Get-Content $envPath -ErrorAction SilentlyContinue
    $portDefined = $envContent | Where-Object { $_ -match "PORT=" }
    
    if ($portDefined) {
        $port = $portDefined -replace "PORT=", ""
        Write-Host "   Port defined in .env: $port" -ForegroundColor Green
    } else {
        Write-Host "   PORT not defined in .env, will use default (5050)" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "   This may cause issues with server configuration" -ForegroundColor Red
}

# Check if node_modules exists
$nodeModulesPath = Join-Path $serverDir "node_modules"
if (Test-Path $nodeModulesPath) {
    Write-Host "✅ node_modules directory found" -ForegroundColor Green
} else {
    Write-Host "❌ node_modules directory not found" -ForegroundColor Red
    Write-Host "   You need to run 'npm install' in the server directory" -ForegroundColor Red
}

# Check if port 5050 is in use
Write-Host "`nChecking if port 5050 is in use..." -ForegroundColor Yellow
$portInUse = $false
try {
    $connection = New-Object System.Net.Sockets.TcpClient("localhost", 5050)
    if ($connection.Connected) {
        $portInUse = $true
        $connection.Close()
    }
} catch {
    # Port is not in use
}

if ($portInUse) {
    Write-Host "✅ Port 5050 is in use - server may be running" -ForegroundColor Green
} else {
    Write-Host "❌ Port 5050 is not in use - server is not running" -ForegroundColor Red
}

# Check client .env file
$clientEnvPath = Join-Path $scriptDir "fitness-tracker\Client\gym\.env"
if (Test-Path $clientEnvPath) {
    Write-Host "`nChecking client .env file..." -ForegroundColor Yellow
    $clientEnvContent = Get-Content $clientEnvPath -ErrorAction SilentlyContinue
    $apiUrlDefined = $clientEnvContent | Where-Object { $_ -match "VITE_API_URL=" }
    
    if ($apiUrlDefined) {
        $apiUrl = $apiUrlDefined -replace "VITE_API_URL=", ""
        Write-Host "✅ API URL defined in client .env: $apiUrl" -ForegroundColor Green
        
        if ($apiUrl -match "5050") {
            Write-Host "   API URL is correctly configured to use port 5050" -ForegroundColor Green
        } else {
            Write-Host "❌ API URL is not configured to use port 5050" -ForegroundColor Red
            Write-Host "   Please update the VITE_API_URL in fitness-tracker/Client/gym/.env" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ VITE_API_URL not defined in client .env" -ForegroundColor Red
    }
} else {
    Write-Host "`n❌ Client .env file not found" -ForegroundColor Red
}

Write-Host "`nDiagnostics complete!" -ForegroundColor Cyan
Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 