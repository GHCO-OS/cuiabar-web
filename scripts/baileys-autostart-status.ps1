param(
  [string]$BootTaskName = 'VillaCuiabar-WhatsAppBridge-Boot',
  [string]$UserTaskName = 'VillaCuiabar-WhatsAppBridge-User',
  [string]$WatchdogTaskName = 'VillaCuiabar-WhatsAppBridge-Watchdog',
  [string]$ServiceRoot = ''
)

$ErrorActionPreference = 'Stop'

if (-not $ServiceRoot) {
  $ServiceRoot = Join-Path $env:ProgramData 'VillaCuiabar'
}

$logsRoot = Join-Path $ServiceRoot 'logs'
$pidFile = Join-Path $logsRoot 'baileys-service.pid'
$health = $null
try {
  $health = Invoke-RestMethod -Uri 'http://127.0.0.1:8788/health' -TimeoutSec 5
} catch {
  $health = @{ ok = $false; error = $_.Exception.Message }
}

function Get-TaskSnapshot {
  param([string]$TaskName)

  $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  $taskInfo = if ($task) { Get-ScheduledTaskInfo -TaskName $TaskName } else { $null }

  return [pscustomobject]@{
    TaskName = $TaskName
    TaskExists = [bool]$task
    TaskState = $task.State
    LastRunTime = $taskInfo.LastRunTime
    LastTaskResult = $taskInfo.LastTaskResult
    NextRunTime = $taskInfo.NextRunTime
  }
}

Get-TaskSnapshot -TaskName $BootTaskName | Format-List
Get-TaskSnapshot -TaskName $UserTaskName | Format-List
Get-TaskSnapshot -TaskName $WatchdogTaskName | Format-List

[pscustomobject]@{
  HealthOk = $health.ok
  BridgeConnection = $health.status.connection
  BridgeMeId = $health.status.meId
  LastError = $health.status.lastError
  ServiceLog = Join-Path $logsRoot 'baileys-service.log'
  ServiceErrLog = Join-Path $logsRoot 'baileys-service.err.log'
  RuntimeOutLog = Join-Path $logsRoot 'baileys-runtime.out.log'
  RuntimeErrLog = Join-Path $logsRoot 'baileys-runtime.err.log'
  PidFile = $pidFile
} | Format-List
