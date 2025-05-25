# PowerShell script to add Node.js to the PATH environment variable permanently

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "This script needs to be run as Administrator to modify the system PATH." -ForegroundColor Red
    Write-Host "Please right-click on PowerShell and select 'Run as Administrator', then run this script again." -ForegroundColor Red
    exit
}

# Define the Node.js installation path
$nodejsPath = "C:\Program Files\nodejs"

# Check if Node.js is installed at the specified path
if (-not (Test-Path $nodejsPath)) {
    Write-Host "Node.js installation not found at $nodejsPath" -ForegroundColor Red
    Write-Host "Please make sure Node.js is installed correctly." -ForegroundColor Red
    exit
}

# Get the current PATH environment variable
$currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::Machine)

# Check if Node.js path is already in the PATH
if ($currentPath -like "*$nodejsPath*") {
    Write-Host "Node.js is already in your PATH environment variable." -ForegroundColor Green
} else {
    # Add Node.js to the PATH
    $newPath = "$currentPath;$nodejsPath"
    [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::Machine)
    
    Write-Host "Node.js has been added to your PATH environment variable." -ForegroundColor Green
    Write-Host "You may need to restart your computer for the changes to take effect." -ForegroundColor Yellow
}

# Verify Node.js is accessible
try {
    $nodeVersion = node -v
    Write-Host "Node.js is installed and accessible. Version: $nodeVersion" -ForegroundColor Green
    
    $npmVersion = npm -v
    Write-Host "npm is installed and accessible. Version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is installed but not accessible in the current session." -ForegroundColor Yellow
    Write-Host "Please restart your terminal or computer for the changes to take effect." -ForegroundColor Yellow
}

Write-Host "`nTo verify the installation after restarting, open a new terminal and run:" -ForegroundColor Cyan
Write-Host "node -v" -ForegroundColor Cyan
Write-Host "npm -v" -ForegroundColor Cyan
