#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir

Set-Location $ProjectDir

if (-not (Test-Path ".env")) {
    Write-Error "Error: .env file not found. Copy .env.example to .env and fill in your values."
    exit 1
}

Write-Host "Starting Prelegal..."
docker compose up -d --build
Write-Host "Prelegal is running at http://localhost:8000"
