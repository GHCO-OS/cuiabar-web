param(
  [string]$BootTaskName = 'VillaCuiabar-WhatsAppBridge-Boot',
  [string]$UserTaskName = 'VillaCuiabar-WhatsAppBridge-User',
  [string]$WatchdogTaskName = 'VillaCuiabar-WhatsAppBridge-Watchdog',
  [string]$ServiceRoot = ''
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $ServiceRoot) {
  $ServiceRoot = Join-Path $env:ProgramData 'VillaCuiabar'
}

$runtimeRoot = Join-Path $ServiceRoot 'whatsapp-baileys-runtime'
$toolsRoot = Join-Path $ServiceRoot 'tools'
$logsRoot = Join-Path $ServiceRoot 'logs'
$currentUserRoot = Join-Path $env:LOCALAPPDATA 'VillaCuiabar'
$currentUserRuntime = Join-Path $currentUserRoot 'whatsapp-baileys-runtime'
$startScript = Join-Path $PSScriptRoot 'start-baileys-service.ps1'
$runScript = Join-Path $PSScriptRoot 'run-baileys-runtime.ps1'
$nodeInstallScript = Join-Path $PSScriptRoot 'install-node20-runtime.ps1'
$currentUser = if ($env:USERDOMAIN) { "$($env:USERDOMAIN)\$($env:USERNAME)" } else { $env:USERNAME }

New-Item -ItemType Directory -Force -Path $ServiceRoot | Out-Null
New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null
New-Item -ItemType Directory -Force -Path $toolsRoot | Out-Null
New-Item -ItemType Directory -Force -Path $logsRoot | Out-Null

if ((Test-Path (Join-Path $currentUserRuntime '.env')) -and -not (Test-Path (Join-Path $runtimeRoot '.env'))) {
  Copy-Item -LiteralPath (Join-Path $currentUserRuntime '.env') -Destination (Join-Path $runtimeRoot '.env') -Force
  Write-Host "Segredos copiados para $runtimeRoot"
}

if ((Test-Path (Join-Path $currentUserRuntime '.auth')) -and -not (Test-Path (Join-Path $runtimeRoot '.auth'))) {
  Copy-Item -LiteralPath (Join-Path $currentUserRuntime '.auth') -Destination (Join-Path $runtimeRoot '.auth') -Recurse -Force
  Write-Host "Sessao do WhatsApp copiada para $runtimeRoot"
}

& $nodeInstallScript -ToolsRoot $toolsRoot
& $runScript -Mode build -RuntimeRoot $runtimeRoot -ToolsRoot $toolsRoot

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$startScript`""
$startupTrigger = New-ScheduledTaskTrigger -AtStartup
$logonTrigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUser
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -MultipleInstances IgnoreNew `
  -RestartCount 999 `
  -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit (New-TimeSpan -Days 3650)
$bootPrincipal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$userPrincipal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Highest

if (Get-ScheduledTask -TaskName 'VillaCuiabar-WhatsAppBridge' -ErrorAction SilentlyContinue) {
  Unregister-ScheduledTask -TaskName 'VillaCuiabar-WhatsAppBridge' -Confirm:$false
}

Register-ScheduledTask -TaskName $BootTaskName -Action $action -Trigger $startupTrigger -Settings $settings -Principal $bootPrincipal -Force | Out-Null
Register-ScheduledTask -TaskName $UserTaskName -Action $action -Trigger $logonTrigger -Settings $settings -Principal $userPrincipal -Force | Out-Null

$watchdogCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$startScript`""
schtasks /Create /TN $WatchdogTaskName /TR $watchdogCommand /SC MINUTE /MO 5 /RU SYSTEM /RL HIGHEST /F | Out-Null

try {
  Start-ScheduledTask -TaskName $WatchdogTaskName
} catch {
  Write-Warning "Nao foi possivel iniciar a tarefa watchdog imediatamente: $($_.Exception.Message)"
}

Write-Host "Tarefa agendada '$BootTaskName' registrada com sucesso."
Write-Host "Tarefa agendada '$UserTaskName' registrada com sucesso."
Write-Host "Tarefa agendada '$WatchdogTaskName' registrada com sucesso."
Write-Host "Runtime do servico: $runtimeRoot"
Write-Host "Logs do servico: $logsRoot"
