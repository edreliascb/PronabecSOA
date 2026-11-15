$ErrorActionPreference = "Stop"

$project = "C:\PronabecSOA"

if (-not (Test-Path $project)) {
    throw "No existe $project"
}

Set-Location $project

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " EDUPERU - CONSTRUIR CATALOGO PARA TODAS LAS PESTANAS" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Usa el External Database URL de eduperu-db en Render." -ForegroundColor Yellow
Write-Host "No se mostrara ni se guardara en Git." -ForegroundColor Yellow
Write-Host ""

$secureUrl = Read-Host "Pega External Database URL" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureUrl)

try {
    $plainUrl = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)

    if ([string]::IsNullOrWhiteSpace($plainUrl)) {
        throw "No ingresaste la URL de PostgreSQL."
    }

    $env:PRONABEC_SYNC_DATABASE_URL = $plainUrl
    $env:NODE_OPTIONS = "--max-old-space-size=768"

    node "$project\scripts\construir-catalogo-portal.js"

    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo construir el catalogo."
    }
}
finally {
    $env:PRONABEC_SYNC_DATABASE_URL = $null
    $env:NODE_OPTIONS = $null

    if ($ptr -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }

    $plainUrl = $null
}
