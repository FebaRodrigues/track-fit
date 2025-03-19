# PowerShell script to restart the server
Write-Host "Stopping any running Node.js processes..." -ForegroundColor Yellow

# Try to stop any running Node.js processes
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "Stopping Node.js process with ID: $($_.Id)" -ForegroundColor Yellow
        Stop-Process -Id $_.Id -Force
    }
} catch {
    Write-Host "No Node.js processes found or could not stop them." -ForegroundColor Red
}

# Wait a moment for processes to fully stop
Start-Sleep -Seconds 2

# Clear the port file if it exists
$portFilePath = "..\current-port.txt"
if (Test-Path $portFilePath) {
    Write-Host "Removing old port file..." -ForegroundColor Yellow
    Remove-Item $portFilePath -Force
}

# Start the server
Write-Host "Starting the server..." -ForegroundColor Green
npm start 