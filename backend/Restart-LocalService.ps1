$ErrorActionPreference = 'Stop'
$trabBackend = (Resolve-Path -LiteralPath $PSScriptRoot).Path
$trabService = Join-Path $trabBackend 'service.py'
$trabData = Join-Path $trabBackend 'data'
$trabPort = 8100
$trabEnv = Join-Path $trabBackend '.env'
if (Test-Path -LiteralPath $trabEnv) {
    $trabPortLine = Get-Content -LiteralPath $trabEnv | Where-Object { $_ -match '^TRAB_API_PORT=\d+$' } | Select-Object -Last 1
    if ($trabPortLine) { $trabPort = [int]($trabPortLine -split '=', 2)[1] }
}
$trabConnection = Get-NetTCPConnection -LocalPort $trabPort -State Listen -ErrorAction SilentlyContinue
$trabStopId = $null
if ($trabConnection) {
    $trabKeyPath = Join-Path $trabData '.service_key'
    if (-not (Test-Path -LiteralPath $trabKeyPath)) { throw 'An unknown service uses this port. Close it before starting this workspace.' }
    $trabHeaders = @{ 'X-Trab-Bridge' = (Get-Content -LiteralPath $trabKeyPath -Raw).Trim() }
    try { $trabState = Invoke-RestMethod -Uri "http://127.0.0.1:$trabPort/state" -Headers $trabHeaders -TimeoutSec 10 }
    catch { throw 'Could not verify this local workspace. For hosted mode, restart through your host process manager.' }
    if ($trabState.capabilities.auth_mode -ne 'local') { throw 'This helper only restarts local development mode.' }
    if (@($trabState.jobs | Where-Object { $_.state -in @('running', 'queued', 'cancelling') }).Count -gt 0) {
        throw 'Cancel or finish active jobs in the app, then run this helper again.'
    }
    $trabPidPath = Join-Path $trabData 'service.pid.json'
    if (-not (Test-Path -LiteralPath $trabPidPath)) { throw 'This service predates the restart helper. Close its terminal once, then retry.' }
    $trabRecord = Get-Content -LiteralPath $trabPidPath -Raw | ConvertFrom-Json
    if ($trabRecord.root -ine $trabBackend) { throw 'The running service belongs to another project.' }
    $trabProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $([int]$trabRecord.pid)"
    if (-not $trabProcess -or $trabProcess.CommandLine -notmatch [regex]::Escape($trabService)) { throw 'The recorded process does not match this analysis service.' }
    $trabStopId = [int]$trabRecord.pid
}
New-Item -ItemType Directory -Path $trabData -Force | Out-Null
$trabPython = Join-Path $trabBackend '.venv/Scripts/python.exe'
if (-not (Test-Path -LiteralPath $trabPython)) { throw 'Install the backend virtual environment first.' }
$trabMarker = Join-Path $trabData '.service_restart.json'
@{ started_at_ms = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() } | ConvertTo-Json -Compress | Set-Content -LiteralPath $trabMarker
try {
    if ($trabStopId) { Stop-Process -Id $trabStopId }
    Start-Process -FilePath $trabPython -ArgumentList @('"' + $trabService + '"') -WorkingDirectory $trabBackend -WindowStyle Hidden -RedirectStandardOutput (Join-Path $trabData 'service-stdout.log') -RedirectStandardError (Join-Path $trabData 'service-stderr.log')
    $trabReady = $false
    for ($trabAttempt = 0; $trabAttempt -lt 40; $trabAttempt++) {
        try {
            $trabHealth = Invoke-RestMethod -Uri "http://127.0.0.1:$trabPort/health" -TimeoutSec 1
            if ($trabHealth.service -eq 'trab-workspace') { $trabReady = $true; break }
        } catch { }
        Start-Sleep -Milliseconds 250
    }
    if (-not $trabReady) { throw 'The analysis service did not become ready. Check backend/data/service-stderr.log.' }
    Write-Output 'Local analysis service restarted and verified ready. Keys are never printed.'
} finally {
    Remove-Item -LiteralPath $trabMarker -ErrorAction SilentlyContinue
}
