# Sync local apps-script/ to the bound Apps Script project.
# One-click replacement for "open the editor, paste the files, save".
#
# Usage: from this workspace dir, just run
#   powershell -ExecutionPolicy Bypass -File .\sync-apps-script.ps1
#
# Pre-reqs (one-time):
#   npm install -g @google/clasp
#   clasp login                             # browser OAuth, once per machine
#
# Uses the .clasp.json already in apps-script/ — pinned to the bound
# project 1vigLzEMqarY5CgSslWsxYqDPrzy1dKrhC7MVxD-1pUEq4BI5VzNZjGcI.

$ErrorActionPreference = 'Stop'

$repoRoot   = Split-Path -Parent $PSScriptRoot  # workspace/ -> repo root
$appsScript = Join-Path $repoRoot 'apps-script'

if (-not (Test-Path $appsScript)) {
    Write-Host "apps-script/ not found at $appsScript" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command clasp -ErrorAction SilentlyContinue)) {
    Write-Host "clasp not installed. Install with:" -ForegroundColor Yellow
    Write-Host "  npm install -g @google/clasp" -ForegroundColor Yellow
    Write-Host "Then: clasp login" -ForegroundColor Yellow
    exit 1
}

Push-Location $appsScript
try {
    Write-Host "=== Pushing to bound Apps Script project ===" -ForegroundColor Cyan
    clasp push -f
    Write-Host "`nDone. New deals will use the updated scripts automatically." -ForegroundColor Green
    Write-Host "To regenerate an existing deal, open Master Index →" -ForegroundColor Yellow
    Write-Host "BPI Commercial → Deal Manager → Run AI Research." -ForegroundColor Yellow
} finally {
    Pop-Location
}
