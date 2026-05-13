# Club360 - unico script .ps1 del proyecto (opcional).
# Arranque recomendado: consola manual (sin este archivo):
#   Backend:  cd backend  && npm run start:dev
#   Frontend: cd frontend && npm run dev
#
# Limpia solo marcadores de instalacion y backend\.env para volver al wizard:
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\club360.ps1 -ResetInstall

param(
  [switch]$ResetInstall
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$data = Join-Path $Root 'backend\data'
$envFile = Join-Path $Root 'backend\.env'

if ($ResetInstall) {
  foreach ($name in @('installed.txt', '.installed')) {
    $p = Join-Path $data $name
    if (Test-Path $p) { Remove-Item -LiteralPath $p -Force; Write-Host "Eliminado: $p" }
  }
  if (Test-Path $envFile) {
    Remove-Item -LiteralPath $envFile -Force
    Write-Host "Eliminado: $envFile"
  }
  Write-Host 'Listo. Reinicia el backend (Ctrl+C y npm run start:dev en backend).' -ForegroundColor Yellow
  Write-Host 'Tras reinstalar, en backend ejecuta: npx prisma migrate deploy (aplica columnas y quita tablas obsoletas).' -ForegroundColor Cyan
  exit 0
}

Write-Host ''
Write-Host 'Club360' -ForegroundColor Cyan
Write-Host '  MySQL: debe estar en marcha. Crea la base vacia antes del wizard.'
Write-Host '  Truncar tablas MVP a mano (cambia usuario, host y nombre de base):'
Write-Host ('    mysql -h 127.0.0.1 -P 3306 -u root -p club360 < "' + (Join-Path $Root 'database\ops\truncate_mvp_all_tables.sql') + '"')
Write-Host '    (Edita USE `club360` dentro del .sql si tu base tiene otro nombre.)'
Write-Host ''
Write-Host '  API:  cd backend  ; npm run start:dev   -> http://localhost:3000/api'
Write-Host '  Web:  cd frontend ; npm run dev       -> http://localhost:5173'
Write-Host ''
Write-Host '  Para limpiar instalacion y .env: .\club360.ps1 -ResetInstall'
Write-Host ''
