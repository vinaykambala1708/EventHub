param(
    [switch]$Restart
)

$ErrorActionPreference = 'Stop'

$repoRoot = $PSScriptRoot
$backendDir = Join-Path $repoRoot 'backend'
$envFile = Join-Path $repoRoot '.env'
$propertiesFile = Join-Path $backendDir 'src\main\resources\application.properties'
$wrapper = Join-Path $backendDir 'mvnw.cmd'

if (-not (Test-Path -LiteralPath $envFile)) {
    throw "Missing $envFile. Create it from .env.example and fill in the database and JWT settings."
}

# Load KEY=VALUE entries from EventHub's .env into this PowerShell process.
foreach ($line in [System.IO.File]::ReadAllLines($envFile)) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
    $separator = $line.IndexOf('=')
    if ($separator -lt 1) { continue }

    $key = $line.Substring(0, $separator).Trim()
    $value = $line.Substring($separator + 1).Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or
        ($value.StartsWith("'") -and $value.EndsWith("'"))) {
        $value = $value.Substring(1, $value.Length - 2)
    }
    [Environment]::SetEnvironmentVariable($key, $value, 'Process')
}

# Seed the Hyderabad sample catalog on startup under the configured existing account.
$profiles = @($env:SPRING_PROFILES_ACTIVE -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
if ($profiles -notcontains 'sample-events') { $profiles += 'sample-events' }
$env:SPRING_PROFILES_ACTIVE = $profiles -join ','

$required = @('DB_URL', 'DB_USERNAME', 'DB_PASSWORD', 'JWT_SECRET')
$missing = @($required | Where-Object {
    [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($_, 'Process'))
})
if ($missing.Count -gt 0) {
    throw "Missing required settings in $($envFile): $($missing -join ', '). Fill them in and run this script again."
}

$javaHome = $env:JAVA_HOME
if (-not $javaHome -or -not (Test-Path -LiteralPath (Join-Path $javaHome 'bin\java.exe'))) {
    $defaultJavaHome = 'C:\Program Files\Java\jdk-17'
    if (Test-Path -LiteralPath (Join-Path $defaultJavaHome 'bin\java.exe')) {
        $javaHome = $defaultJavaHome
        $env:JAVA_HOME = $javaHome
    }
}
if (-not $javaHome -or -not (Test-Path -LiteralPath (Join-Path $javaHome 'bin\java.exe'))) {
    throw 'Java 17 was not found. Install JDK 17 or set JAVA_HOME to its installation folder.'
}

if (-not (Test-Path -LiteralPath $wrapper)) {
    throw "The Maven wrapper is missing: $wrapper"
}

$port = 8080
if (Test-Path -LiteralPath $propertiesFile) {
    $portPattern = 'server\.port=' + '\$' + '{PORT:(\d+)}'
    $match = Select-String -Path $propertiesFile -Pattern $portPattern
    if ($match -and $match.Matches.Groups.Count -gt 1) {
        $port = [int]$match.Matches.Groups[1].Value
    }
}
$backendUrl = "http://localhost:$port"
$portListener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($portListener) {
    $serverPid = [int]$portListener.OwningProcess
    $serverProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$serverPid" -ErrorAction SilentlyContinue
    $parentProcess = if ($serverProcess) {
        Get-CimInstance Win32_Process -Filter "ProcessId=$($serverProcess.ParentProcessId)" -ErrorAction SilentlyContinue
    }
    $projectPattern = [regex]::Escape($backendDir)
    $isEventHub = $serverProcess -and ([string]$serverProcess.CommandLine -match $projectPattern)
    if (-not $isEventHub -and $parentProcess) {
        $isEventHub = [string]$parentProcess.CommandLine -match $projectPattern
    }

    $isHealthy = $false
    try {
        $health = Invoke-RestMethod -Uri "$backendUrl/actuator/health" -TimeoutSec 5
        $isHealthy = $health.status -eq 'UP'
    }
    catch {
        # A listener may be in startup or may be an unrelated process.
    }

    if ($isHealthy -and $isEventHub -and -not $Restart) {
        Write-Host "EventHub backend is already running at $backendUrl. Use .\start-backend.ps1 -Restart to restart and seed events."
        return
    }
    if (-not $Restart) {
        throw "Port $port is occupied. Run .\start-backend.ps1 -Restart only if the listener belongs to EventHub, or stop the owning application first."
    }
    if (-not $isEventHub) {
        throw "Port $port is not confirmed to belong to D:\EventHub, so it was left running."
    }

    $stopIds = @($serverPid)
    if ($parentProcess -and ([string]$parentProcess.CommandLine -match $projectPattern)) {
        $stopIds += [int]$parentProcess.ProcessId
    }
    foreach ($processId in $stopIds) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        if (-not (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)) { break }
        Start-Sleep -Milliseconds 500
    }
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
        throw "EventHub stopped, but port $port is still occupied."
    }
    Write-Host "Stopped the previous EventHub backend on port $port."
}

Write-Host "Starting EventHub backend with the sample event catalog at $backendUrl"
Set-Location $backendDir
& $wrapper spring-boot:run
if ($LASTEXITCODE -ne 0) {
    throw "EventHub backend stopped with exit code $LASTEXITCODE."
}