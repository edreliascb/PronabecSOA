$ErrorActionPreference = "Stop"

$project = "C:\PronabecSOA"

Set-Location $project

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " EDUPERU - INDICES LIGEROS PARA TODAS LAS PESTANAS V5" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Usa External Database URL de eduperu-db." -ForegroundColor Yellow
Write-Host "No se mostrara ni se guardara." -ForegroundColor Yellow
Write-Host ""

$secureUrl = Read-Host "External Database URL" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureUrl)

try {

    $plainUrl =
        [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)

    if ([string]::IsNullOrWhiteSpace($plainUrl)) {
        throw "No ingresaste la URL."
    }

    $env:PRONABEC_SYNC_DATABASE_URL = $plainUrl
    $env:NODE_OPTIONS = "--max-old-space-size=1024"

    node "$project\scripts\construir-indices-ligeros-v5.js"

    if ($LASTEXITCODE -ne 0) {
        throw "No se pudieron construir los indices."
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
