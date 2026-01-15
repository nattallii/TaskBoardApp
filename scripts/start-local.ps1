param(
    [switch]$SkipFrontendInstall
)

# This script boots backend services via Docker Compose and then starts the frontend dev server.
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1 -SkipFrontendInstall

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot

Write-Host '==> Starting backend services with docker compose...' -ForegroundColor Cyan
Push-Location $repoRoot
try {
    docker compose up -d --build
    Write-Host 'Backend services are up.' -ForegroundColor Green
} finally {
    Pop-Location
}

$frontendPath = Join-Path $repoRoot 'frontend'
if (-not (Test-Path $frontendPath)) {
    throw "Frontend directory not found at $frontendPath"
}

Push-Location $frontendPath
try {
    if (-not $SkipFrontendInstall -and -not (Test-Path 'node_modules')) {
        Write-Host '==> Installing frontend dependencies (npm install)...' -ForegroundColor Cyan
        npm install
    }

    Write-Host '==> Starting frontend dev server (npm run dev)...' -ForegroundColor Cyan
    npm run dev
} finally {
    Pop-Location
}
