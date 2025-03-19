# PowerShell script to start the Vite development server
Write-Host "Starting Vite development server..." -ForegroundColor Green

# Get the path to the vite executable
$vitePath = Join-Path -Path $PSScriptRoot -ChildPath "node_modules\.bin\vite.cmd"

# Check if the vite executable exists
if (Test-Path $vitePath) {
    Write-Host "Found Vite at: $vitePath" -ForegroundColor Green
    
    # Start the Vite server
    Write-Host "Starting Vite server on port 5173..." -ForegroundColor Green
    & $vitePath --port 5173 --host
} else {
    Write-Host "Vite executable not found at: $vitePath" -ForegroundColor Red
    Write-Host "Trying to run via npm..." -ForegroundColor Yellow
    
    # Try running via npm
    npm run dev
}

# Keep the window open
Read-Host -Prompt "Press Enter to exit" 