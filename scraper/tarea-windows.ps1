# Plan B para Súper Selectos: si Selectos bloquea los servidores de GitHub,
# esta tarea lo actualiza desde la compu de la casa todos los días.
# Uso (PowerShell, desde la carpeta del proyecto):
#   powershell -ExecutionPolicy Bypass -File scraper\tarea-windows.ps1            # registra a las 6:30 a.m.
#   powershell -ExecutionPolicy Bypass -File scraper\tarea-windows.ps1 -Hora 19:00
#   powershell -ExecutionPolicy Bypass -File scraper\tarea-windows.ps1 -Quitar
# Requiere: scraper\.env con las llaves y "npx playwright install chromium" hecho una vez.
param(
  [string]$Hora = "06:30",
  [switch]$Quitar
)
$nombre = "Canasta - precios Selectos"

if ($Quitar) {
  Unregister-ScheduledTask -TaskName $nombre -Confirm:$false
  Write-Host "Tarea quitada."
  exit 0
}

$repo = Split-Path -Parent $PSScriptRoot
$node = (Get-Command node -ErrorAction Stop).Source
$cmd  = "cd /d `"$repo`" && `"$node`" scraper\actualizar.mjs --solo-selectos >> scraper\selectos.log 2>&1"

$accion     = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c $cmd"
$disparador = New-ScheduledTaskTrigger -Daily -At $Hora
# Si la compu estaba apagada a esa hora, corre en cuanto se encienda
$ajustes    = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

Register-ScheduledTask -TaskName $nombre -Action $accion -Trigger $disparador -Settings $ajustes `
  -Description "Actualiza precios de Súper Selectos para la app Canasta" -Force | Out-Null
Write-Host "Listo: '$nombre' correrá todos los días a las $Hora. Registro en scraper\selectos.log"
