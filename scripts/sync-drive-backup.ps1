param(
  [string]$SourcePath = 'C:\cuiabar-web',
  [string]$BackupPath = 'G:\Meu Drive\cuiabar-web',
  [switch]$Mirror
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $SourcePath)) {
  throw "SourcePath nao encontrado: $SourcePath"
}

if (-not (Test-Path $BackupPath)) {
  New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null
}

$excludeDirs = @(
  'node_modules',
  'dist',
  'dist-blog',
  '.wrangler',
  '.ssr',
  '.ssr-blog',
  'coverage',
  'services\\whatsapp-baileys\\node_modules',
  'services\\whatsapp-baileys\\.auth'
)

$excludeFiles = @(
  'ACESSOS-CHAVES-PROJETO.md'
)

$arguments = @(
  $SourcePath,
  $BackupPath,
  '/E',
  '/FFT',
  '/R:2',
  '/W:2',
  '/XD'
) + $excludeDirs + @('/XF') + $excludeFiles

if ($Mirror) {
  $arguments += '/MIR'
}

Write-Host "Sincronizando backup do projeto para $BackupPath"
Write-Host 'Diretorios excluidos:' ($excludeDirs -join ', ')
Write-Host 'Arquivos excluidos:' ($excludeFiles -join ', ')

& robocopy @arguments
$exitCode = $LASTEXITCODE

if ($exitCode -ge 8) {
  throw "Robocopy falhou com codigo $exitCode"
}

Write-Host "Backup concluido com codigo $exitCode"
