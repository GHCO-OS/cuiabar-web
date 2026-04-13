param(
  [string]$Version = '',
  [string]$ToolsRoot = ''
)

$ErrorActionPreference = 'Stop'

$toolsRoot = if ($ToolsRoot) { $ToolsRoot } else { Join-Path $env:LOCALAPPDATA 'VillaCuiabar\tools' }
$tempRoot = Join-Path $env:TEMP 'villa-cuiabar-node-runtime'

New-Item -ItemType Directory -Force -Path $toolsRoot | Out-Null
New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

if (-not $Version) {
  $index = Invoke-RestMethod -Uri 'https://nodejs.org/dist/index.json'
  $selected = $index |
    Where-Object { $_.version -like 'v20.*' -and $_.files -contains 'win-x64-zip' } |
    Select-Object -First 1

  if (-not $selected) {
    throw 'Nao foi possivel localizar uma versao v20 do Node.js para Windows x64.'
  }

  $Version = $selected.version
}

if ($Version -notmatch '^v20\.\d+\.\d+$') {
  throw 'Informe uma versao valida do Node.js 20, por exemplo v20.19.5.'
}

$folderName = "node-$Version-win-x64"
$targetDir = Join-Path $toolsRoot $folderName
$zipPath = Join-Path $tempRoot "$folderName.zip"
$downloadUrl = "https://nodejs.org/dist/$Version/$folderName.zip"

if (-not (Test-Path $targetDir)) {
  Write-Host "Baixando $downloadUrl"
  Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath

  Write-Host "Extraindo Node.js em $toolsRoot"
  Expand-Archive -Path $zipPath -DestinationPath $toolsRoot -Force
} else {
  Write-Host "Node.js ja disponivel em $targetDir"
}

$nodeCmd = Join-Path $targetDir 'node.exe'
$npmCmd = Join-Path $targetDir 'npm.cmd'

if (-not (Test-Path $nodeCmd) -or -not (Test-Path $npmCmd)) {
  throw "Instalacao incompleta do Node.js em $targetDir"
}

Write-Host "Node: $nodeCmd"
& $nodeCmd -v
Write-Host "NPM: $npmCmd"
& $npmCmd -v
