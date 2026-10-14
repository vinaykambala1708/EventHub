$ErrorActionPreference = 'Stop'

$cachedMvn = "C:\Users\kamba\.m2\wrapper\dists\apache-maven-3.9.16\0daed3be3ebd1c706f0e69e8b07c6b73f5cc4ea3dfce72a8d0ec2e849ca2ddb0\bin\mvn.cmd"

if (-not (Test-Path $cachedMvn)) {
    $cachedMvn = Get-ChildItem "$HOME\.m2\wrapper\dists" -Filter mvn.cmd -Recurse -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty FullName
}

if (-not $cachedMvn) {
    $systemMvn = Get-Command mvn -ErrorAction SilentlyContinue
    if ($systemMvn) {
        $cachedMvn = $systemMvn.Source
    }
}

if (-not $cachedMvn) {
    Write-Error "Maven (mvn.cmd) was not found on your system or in ~/.m2/wrapper/dists."
    exit 1
}

& $cachedMvn @args
