@echo off
setlocal

:: Try system mvn first
where mvn >nul 2>nul
if %ERRORLEVEL% equ 0 (
    mvn %*
    exit /b %ERRORLEVEL%
)

:: Try direct cached wrapper path
set "CACHED_MVN=%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.16\0daed3be3ebd1c706f0e69e8b07c6b73f5cc4ea3dfce72a8d0ec2e849ca2ddb0\bin\mvn.cmd"
if exist "%CACHED_MVN%" (
    call "%CACHED_MVN%" %*
    exit /b %ERRORLEVEL%
)

:: Dynamic search for cached mvn.cmd
for /f "delims=" %%F in ('powershell -NoProfile -Command "Get-ChildItem -Path \"$HOME\.m2\wrapper\dists\" -Filter mvn.cmd -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName"') do (
    set "FOUND_MVN=%%F"
)

if defined FOUND_MVN (
    call "%FOUND_MVN%" %*
    exit /b %ERRORLEVEL%
)

echo [ERROR] Maven not found. Please install Maven or run via start-backend.ps1.
exit /b 1
