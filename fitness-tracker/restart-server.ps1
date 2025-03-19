# PowerShell script to restart the server from the root directory
Write-Host "Restarting the server..." -ForegroundColor Green

# Change to the Server directory and run the restart script
Set-Location -Path "Server"
& .\restart-server.ps1 