Write-Host "Starting Fitness Management System..." -ForegroundColor Green

Write-Host "Starting Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ./Server; node index.js"

Write-Host "Starting Client..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ./Client/gym; npm run dev"

Write-Host "Both server and client should be starting now." -ForegroundColor Green
Write-Host "Server is running at http://localhost:5051" -ForegroundColor Cyan
Write-Host "Client is running at http://localhost:5173" -ForegroundColor Cyan 