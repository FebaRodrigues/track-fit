# PowerShell script to start the server
Write-Host "Starting the server..." -ForegroundColor Green

# Function to check if a file exists
function Test-FileExists {
    param (
        [string]$Path
    )
    return Test-Path -Path $Path -PathType Leaf
}

# Function to load environment variables from a .env file
function Load-EnvFile {
    param (
        [string]$EnvFilePath
    )
    
    if (Test-FileExists $EnvFilePath) {
        Write-Host "Loading .env from: $EnvFilePath"
        $envContent = Get-Content $EnvFilePath
        
        foreach ($line in $envContent) {
            if ($line -match '^\s*([^#][^=]+)=(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                
                # Remove quotes if present
                if ($value -match '^"(.*)"$' -or $value -match "^'(.*)'$") {
                    $value = $matches[1]
                }
                
                # Set environment variable
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
                Write-Host "Set environment variable: $key"
            }
        }
        return $true
    } else {
        Write-Host "File not found: $EnvFilePath"
        return $false
    }
}

# Try to load environment variables from multiple locations
Write-Host "=== Loading Environment Variables ==="

# First try the server .env file
$serverEnvPath = Join-Path $PSScriptRoot ".env"
$loaded = Load-EnvFile $serverEnvPath

# If MONGO_URI is still not defined, try the root .env file
if (-not $env:MONGO_URI) {
    $rootEnvPath = Join-Path $PSScriptRoot "../../.env"
    $loaded = Load-EnvFile $rootEnvPath
}

# Check for critical environment variables
$criticalVars = @("MONGO_URI", "STRIPE_SECRET_KEY", "JWT_SECRET")
$missingVars = @()

foreach ($varName in $criticalVars) {
    if (-not (Get-Item env:$varName -ErrorAction SilentlyContinue)) {
        $missingVars += $varName
    }
}

if ($missingVars.Count -gt 0) {
    Write-Error "ERROR: The following critical environment variables are missing:"
    foreach ($varName in $missingVars) {
        Write-Error "- $varName"
    }
    Write-Error "Please check your .env file and try again."
    exit 1
}

# Determine which server file to run
$serverFile = if ($args[0] -eq "index") { "index.js" } else { "server.js" }
Write-Host "Starting server using $serverFile..."

# Get the port from environment variables or use default
$port = if ($env:PORT) { $env:PORT } else { "5050" }

# Start the server
Write-Host "Server starting on port $port"
node $serverFile 