Write-Host "Creating Desktop Shortcuts for Fitness Tracker Server..." -ForegroundColor Cyan

# Get the script directory and desktop path
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktopPath = [Environment]::GetFolderPath("Desktop")

# Create shortcut for starting the server
$startServerShortcut = Join-Path $desktopPath "Start Fitness Tracker Server.lnk"
$startServerScript = Join-Path $scriptDir "start-server.ps1"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($startServerShortcut)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$startServerScript`""
$Shortcut.WorkingDirectory = $scriptDir
$Shortcut.IconLocation = "powershell.exe,0"
$Shortcut.Description = "Start the Fitness Tracker Server on port 5050"
$Shortcut.Save()

# Create shortcut for checking server status
$checkServerShortcut = Join-Path $desktopPath "Check Fitness Tracker Server.lnk"
$checkServerScript = Join-Path $scriptDir "check-server.ps1"

$Shortcut = $WshShell.CreateShortcut($checkServerShortcut)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$checkServerScript`""
$Shortcut.WorkingDirectory = $scriptDir
$Shortcut.IconLocation = "powershell.exe,0"
$Shortcut.Description = "Check the Fitness Tracker Server Status on port 5050"
$Shortcut.Save()

# Create shortcut for diagnosing server issues
$diagnoseServerShortcut = Join-Path $desktopPath "Diagnose Fitness Tracker Server.lnk"
$diagnoseServerScript = Join-Path $scriptDir "diagnose-server.ps1"

$Shortcut = $WshShell.CreateShortcut($diagnoseServerShortcut)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$diagnoseServerScript`""
$Shortcut.WorkingDirectory = $scriptDir
$Shortcut.IconLocation = "powershell.exe,0"
$Shortcut.Description = "Diagnose Fitness Tracker Server issues"
$Shortcut.Save()

Write-Host "✅ Desktop shortcuts created successfully!" -ForegroundColor Green
Write-Host "   - Start Fitness Tracker Server" -ForegroundColor Green
Write-Host "   - Check Fitness Tracker Server" -ForegroundColor Green
Write-Host "   - Diagnose Fitness Tracker Server" -ForegroundColor Green
Write-Host "`nThe server will run on port 5050" -ForegroundColor Cyan

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 