Write-Host "Checking Fitness Tracker Server Status..." -ForegroundColor Cyan

# Try to connect to the server
$serverRunning = $false
try {
    $connection = New-Object System.Net.Sockets.TcpClient("localhost", 5050)
    if ($connection.Connected) {
        $serverRunning = $true
        $connection.Close()
    }
} catch {
    # Server is not running
}

if ($serverRunning) {
    Write-Host "✅ Server is RUNNING on port 5050" -ForegroundColor Green
    Write-Host "   You can access the server at http://localhost:5050" -ForegroundColor Green
} else {
    Write-Host "❌ Server is NOT RUNNING on port 5050" -ForegroundColor Red
    Write-Host "   To start the server, run the start-server.ps1 script" -ForegroundColor Yellow
}

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 