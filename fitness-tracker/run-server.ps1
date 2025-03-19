Write-Host "Starting Fitness Management System Server..." -ForegroundColor Green
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host "Changing to Server directory..." -ForegroundColor Yellow
Set-Location -Path "./Server"
Write-Host "New directory: $(Get-Location)" -ForegroundColor Yellow

# Check if .env file exists
if (Test-Path .env) {
    Write-Host ".env file found" -ForegroundColor Green
} else {
    Write-Host ".env file not found, creating a basic one..." -ForegroundColor Yellow
    @"
PORT=5051
MONGO_URI=mongodb://localhost:27017/fitness-tracker
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:5173
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host "Created basic .env file. Please update with your actual MongoDB URI and other settings." -ForegroundColor Yellow
}

# Check if node_modules exists
if (Test-Path node_modules) {
    Write-Host "node_modules found" -ForegroundColor Green
} else {
    Write-Host "node_modules not found, running npm install..." -ForegroundColor Yellow
    npm install
}

Write-Host "Starting server with node index.js..." -ForegroundColor Green
node index.js 