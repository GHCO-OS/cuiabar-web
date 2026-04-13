param(
  [string]$RuntimeRoot = '',
  [string]$ToolsRoot = '',
  [string]$LogRoot = ''
)

$ErrorActionPreference = 'Stop'

$serviceRoot = Join-Path $env:ProgramData 'VillaCuiabar'
if (-not $RuntimeRoot) {
  $RuntimeRoot = Join-Path $serviceRoot 'whatsapp-baileys-runtime'
}
if (-not $ToolsRoot) {
  $ToolsRoot = Join-Path $serviceRoot 'tools'
}
if (-not $LogRoot) {
  $LogRoot = Join-Path $serviceRoot 'logs'
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$runScript = Join-Path $PSScriptRoot 'run-baileys-runtime.ps1'
$pidFile = Join-Path $LogRoot 'baileys-service.pid'
$runtimeOutLog = Join-Path $LogRoot 'baileys-runtime.out.log'
$runtimeErrLog = Join-Path $LogRoot 'baileys-runtime.err.log'

New-Item -ItemType Directory -Force -Path $RuntimeRoot | Out-Null
New-Item -ItemType Directory -Force -Path $ToolsRoot | Out-Null
New-Item -ItemType Directory -Force -Path $LogRoot | Out-Null

$logFile = Join-Path $LogRoot 'baileys-service.log'
$errorFile = Join-Path $LogRoot 'baileys-service.err.log'
$env:BAILEYS_ARTIFACT_ROOT = $LogRoot

function Test-BridgeHealthy {
  try {
    $health = Invoke-RestMethod -Uri 'http://127.0.0.1:8788/health' -TimeoutSec 5
    if ($health.ok -ne $true) {
      return $false
    }

    return ($health.status.connection -eq 'open') -or ($health.status.qrAvailable -eq $true) -or (-not [string]::IsNullOrWhiteSpace($health.status.pairingCode))
  } catch {
    return $false
  }
}

function Get-PortableNpmCommand {
  param([string]$ToolsDirectory)

  $portableNodeDir = Get-ChildItem -Path $ToolsDirectory -Directory -Filter 'node-v20.*-win-x64' -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    Select-Object -First 1

  if ($portableNodeDir) {
    return Join-Path $portableNodeDir.FullName 'npm.cmd'
  }

  return (Get-Command npm.cmd -ErrorAction Stop).Source
}

function Get-PortableNodeCommand {
  param([string]$ToolsDirectory)

  $portableNodeDir = Get-ChildItem -Path $ToolsDirectory -Directory -Filter 'node-v20.*-win-x64' -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    Select-Object -First 1

  if ($portableNodeDir) {
    return Join-Path $portableNodeDir.FullName 'node.exe'
  }

  return (Get-Command node.exe -ErrorAction Stop).Source
}

function Get-TrackedProcess {
  if (-not (Test-Path $pidFile)) {
    return $null
  }

  try {
    $pidValue = (Get-Content $pidFile -ErrorAction Stop | Select-Object -First 1).Trim()
    if (-not $pidValue) {
      return $null
    }

    return Get-Process -Id ([int]$pidValue) -ErrorAction Stop
  } catch {
    return $null
  }
}

function Clear-TrackedProcess {
  if (Test-Path $pidFile) {
    Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
  }
}

function Stop-StaleProcess {
  $trackedProcess = Get-TrackedProcess
  if (-not $trackedProcess) {
    Clear-TrackedProcess
    return
  }

  try {
    Stop-Process -Id $trackedProcess.Id -Force -ErrorAction Stop
    "[$([DateTime]::Now.ToString('s'))] Processo antigo do bridge encerrado antes de novo bootstrap (PID $($trackedProcess.Id))." | Out-File -FilePath $logFile -Append -Encoding utf8
  } catch {
    "[$([DateTime]::Now.ToString('s'))] Falha ao encerrar processo antigo do bridge: $($_.Exception.Message)" | Out-File -FilePath $errorFile -Append -Encoding utf8
  } finally {
    Clear-TrackedProcess
  }
}

if (Test-BridgeHealthy) {
  "[$([DateTime]::Now.ToString('s'))] Bridge ja estava ativo ou em modo de pareamento; nenhuma nova instancia foi iniciada." | Out-File -FilePath $logFile -Append -Encoding utf8
  exit 0
}

Stop-StaleProcess

"[$([DateTime]::Now.ToString('s'))] Iniciando bootstrap do servico Baileys..." | Out-File -FilePath $logFile -Append -Encoding utf8
& $runScript -Mode build -RuntimeRoot $RuntimeRoot -ToolsRoot $ToolsRoot 1>> $logFile 2>> $errorFile

$nodeCmd = Get-PortableNodeCommand -ToolsDirectory $ToolsRoot
$distEntry = Join-Path $RuntimeRoot 'dist\index.js'

if (-not (Test-Path $distEntry)) {
  throw "Runtime compilado, mas o entrypoint nao foi encontrado em $distEntry"
}

"[$([DateTime]::Now.ToString('s'))] Executando runtime principal do Baileys em segundo plano..." | Out-File -FilePath $logFile -Append -Encoding utf8
$process = Start-Process -FilePath $nodeCmd `
  -ArgumentList 'dist/index.js' `
  -WorkingDirectory $RuntimeRoot `
  -RedirectStandardOutput $runtimeOutLog `
  -RedirectStandardError $runtimeErrLog `
  -PassThru

Set-Content -LiteralPath $pidFile -Value $process.Id -Encoding ascii
"[$([DateTime]::Now.ToString('s'))] Processo do bridge iniciado com PID $($process.Id)." | Out-File -FilePath $logFile -Append -Encoding utf8

$deadline = (Get-Date).AddSeconds(90)
while ((Get-Date) -lt $deadline) {
  if (Test-BridgeHealthy) {
    "[$([DateTime]::Now.ToString('s'))] Bridge respondeu ao healthcheck e ficou operacional ou pronto para pareamento." | Out-File -FilePath $logFile -Append -Encoding utf8
    exit 0
  }

  $trackedProcess = Get-TrackedProcess
  if (-not $trackedProcess) {
    break
  }

  Start-Sleep -Seconds 3
}

$trackedProcess = Get-TrackedProcess
if ($trackedProcess) {
  try {
    Stop-Process -Id $trackedProcess.Id -Force -ErrorAction Stop
  } catch {
    "[$([DateTime]::Now.ToString('s'))] Falha ao encerrar processo nao saudavel do bridge: $($_.Exception.Message)" | Out-File -FilePath $errorFile -Append -Encoding utf8
  }
}

Clear-TrackedProcess
throw 'O runtime do Baileys nao ficou saudavel dentro do tempo limite.'
