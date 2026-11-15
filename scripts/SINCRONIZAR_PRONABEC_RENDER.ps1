$ErrorActionPreference = "Stop"

$project = "C:\PronabecSOA"

if (-not (Test-Path $project)) {
    throw "No existe $project"
}

Set-Location $project

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " EDUPERU - SINCRONIZAR DATOS PRONABEC A RENDER DB" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Necesitas el External Database URL de eduperu-db en Render." -ForegroundColor Yellow
Write-Host "La URL no se mostrara en pantalla ni se guardara en Git." -ForegroundColor Yellow
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

    node "$project\scripts\sincronizar-pronabec-postgres.js"

    if ($LASTEXITCODE -ne 0) {
        throw "La sincronizacion no termino correctamente."
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
