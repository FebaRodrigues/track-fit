Write-Host "Starting Fitness Management System..." -ForegroundColor Green

# First, start the server
Write-Host "Starting Server..." -ForegroundColor Yellow
Set-Location -Path "./fitness-tracker/Server"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node index.js"

# Then, start the client
Write-Host "Starting Client..." -ForegroundColor Yellow
Set-Location -Path "../Client/gym"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# Return to the original directory
Set-Location -Path "../../.."

Write-Host "Both server and client should be starting now." -ForegroundColor Green
Write-Host "Server is running at http://localhost:5051" -ForegroundColor Cyan
Write-Host "Client is running at http://localhost:5173" -ForegroundColor Cyan 