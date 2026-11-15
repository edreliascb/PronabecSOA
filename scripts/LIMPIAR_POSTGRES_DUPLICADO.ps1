$ErrorActionPreference = "Stop"

$project = "C:\PronabecSOA"

Set-Location $project

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " EDUPERU - LIMPIAR POSTGRES SIN BORRAR DATOS PRONABEC" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pega External Database URL de eduperu-db." -ForegroundColor Yellow
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

    node "$project\scripts\limpiar-postgres-duplicado.js"

    if ($LASTEXITCODE -ne 0) {
        throw "La limpieza no termino correctamente."
    }

}
finally {

    $env:PRONABEC_SYNC_DATABASE_URL = $null

    if ($ptr -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }

    $plainUrl = $null
}
