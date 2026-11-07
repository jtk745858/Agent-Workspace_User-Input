@echo off
setlocal
for %%I in ("%~dp0..") do set "PROJECT_ROOT=%%~fI"
set "PATH=%PROJECT_ROOT%\.tools\node-v22.23.4-win-x64;%PROJECT_ROOT%\.tools\package-manager\node_modules\.bin;%PROJECT_ROOT%\.tools\cargo\bin;%PATH%"
set "CARGO_HOME=%PROJECT_ROOT%\.tools\cargo"
set "RUSTUP_HOME=%PROJECT_ROOT%\.tools\rustup"
set "npm_config_cache=%PROJECT_ROOT%\.cache\npm"
set "npm_config_store_dir=%PROJECT_ROOT%\.cache\pnpm-store"
set "COREPACK_HOME=%PROJECT_ROOT%\.cache\corepack"
set "TEMP=%PROJECT_ROOT%\.cache\tmp"
set "TMP=%TEMP%"
if not exist "%TEMP%" mkdir "%TEMP%"
cd /d "%PROJECT_ROOT%"
if "%~1"=="" (
  echo Usage: scripts\dev-env.cmd pnpm install
  echo        scripts\dev-env.cmd pnpm tauri dev
  exit /b 1
)
call %*
exit /b %ERRORLEVEL%
