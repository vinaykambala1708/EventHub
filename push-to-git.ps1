$ErrorActionPreference = 'Stop'

# Refresh PATH from system and user environment so newly installed Git is detected in existing terminals
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$cmd = Get-Command git -ErrorAction SilentlyContinue
$gitExe = if ($cmd) { $cmd.Source } else { $null }
if (-not $gitExe) {
    $fallback = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd\git.exe"
    if (Test-Path $fallback) {
        $gitExe = $fallback
    } else {
        Write-Error "Git executable could not be found."
        exit 1
    }
}

Write-Host "Found Git at: $gitExe" -ForegroundColor Green
Write-Host "Pushing main branch to GitHub..." -ForegroundColor Cyan

& $gitExe push -u origin main
