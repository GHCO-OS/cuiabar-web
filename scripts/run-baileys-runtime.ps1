param(
  [ValidateSet('prepare', 'dev', 'build', 'check', 'start')]
  [string]$Mode = 'prepare',
  [string]$RuntimeRoot = '',
  [string]$ToolsRoot = ''
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $repoRoot 'services\whatsapp-baileys'
$runtimeRoot = if ($RuntimeRoot) { $RuntimeRoot } else { Join-Path $env:LOCALAPPDATA 'VillaCuiabar\whatsapp-baileys-runtime' }
$toolsRoot = if ($ToolsRoot) { $ToolsRoot } else { Join-Path $env:LOCALAPPDATA 'VillaCuiabar\tools' }
$sourceEntries = @('src', 'package.json', 'package-lock.json', 'tsconfig.json', '.env.example')

if (-not (Test-Path $sourceRoot)) {
  throw "Servico Baileys nao encontrado em $sourceRoot"
}

New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null

$portableNodeDir = Get-ChildItem -Path $toolsRoot -Directory -Filter 'node-v20.*-win-x64' -ErrorAction SilentlyContinue |
  Sort-Object Name -Descending |
  Select-Object -First 1

if ($portableNodeDir) {
  $nodeCmd = Join-Path $portableNodeDir.FullName 'node.exe'
  $npmCmd = Join-Path $portableNodeDir.FullName 'npm.cmd'
  $env:PATH = "$($portableNodeDir.FullName);$env:PATH"
} else {
  $nodeCmd = (Get-Command node.exe -ErrorAction Stop).Source
  $npmCmd = (Get-Command npm.cmd -ErrorAction Stop).Source
}

foreach ($entry in $sourceEntries) {
  $sourcePath = Join-Path $sourceRoot $entry
  $targetPath = Join-Path $runtimeRoot $entry

  if (-not (Test-Path $sourcePath)) {
    continue
  }

  if (Test-Path $targetPath) {
    try {
      Remove-Item -LiteralPath $targetPath -Recurse -Force -ErrorAction Stop
    } catch {
      if (Test-Path $targetPath) {
        throw
      }
    }
  }

  Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Recurse -Force
}

$runtimeEnvPath = Join-Path $runtimeRoot '.env'
if (-not (Test-Path $runtimeEnvPath) -and (Test-Path (Join-Path $runtimeRoot '.env.example'))) {
  Copy-Item -LiteralPath (Join-Path $runtimeRoot '.env.example') -Destination $runtimeEnvPath -Force
}

Write-Host "Baileys runtime sincronizado em $runtimeRoot"
Write-Host "Node do runtime: $nodeCmd"
Write-Host "NPM do runtime: $npmCmd"

Push-Location $runtimeRoot
try {
  if (-not (Test-Path (Join-Path $runtimeRoot 'node_modules'))) {
    Write-Host 'Instalando dependencias do runtime local do Baileys...'
    & $npmCmd install
    if ($LASTEXITCODE -ne 0) {
      throw 'Falha ao instalar dependencias do runtime local do Baileys.'
    }
  }

  if ($Mode -ne 'prepare') {
    Write-Host "Executando npm run $Mode no runtime local do Baileys..."
    & $npmCmd run $Mode
    if ($LASTEXITCODE -ne 0) {
      throw "Falha ao executar npm run $Mode no runtime local do Baileys."
    }
  }
} finally {
  Pop-Location
}
