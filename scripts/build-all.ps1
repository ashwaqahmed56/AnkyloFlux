# Builds the shippable single-file exe in the correct order.
#
#   powershell -ExecutionPolicy Bypass -File scripts\build-all.ps1
#
# The order matters. `cargo build` on the app crate produces a dev-mode binary
# that shows "can't reach this page"; only `npm run tauri:build` embeds the
# frontend. These scripts enforce both of those rules.

param(
  [switch]$SkipSidecars
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

$cargo = "$env:USERPROFILE\.cargo\bin"
if (Test-Path $cargo) { $env:PATH = "$cargo;$env:PATH" }

if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
  throw "cargo not found. Install Rust: https://rustup.rs"
}

Get-Process -Name "Ankylo", "ankylo" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Remove-Item "$env:LOCALAPPDATA\Ankylo\ankylo.exe" -Force -ErrorAction SilentlyContinue

Step "Sidecars (libmpv + yt-dlp)"
if ($SkipSidecars) {
  Write-Host "skipped" -ForegroundColor DarkGray
}
else {
  foreach ($f in @("src-tauri\binaries\libmpv-2.dll", "src-tauri\binaries\yt-dlp.exe")) {
    if (Test-Path $f) {
      Write-Host "  have $f" -ForegroundColor DarkGray
    }
    else {
      Write-Host "  missing $f - fetching" -ForegroundColor Yellow
      node scripts\fetch-libmpv.mjs zhongfly/mpv-winbuild "mpv-dev-lgpl-x86_64-" "ffmpeg-lgpl-x86_64-"
      break
    }
  }
  if (-not (Test-Path "src-tauri\binaries\yt-dlp.exe")) {
    Write-Host "  yt-dlp missing - downloading" -ForegroundColor Yellow
    node scripts\fetch-ytdlp.mjs
  }
}

Step "Frontend + app (tauri build, embeds the UI)"
npm.cmd run tauri:build
if ($LASTEXITCODE -ne 0) { throw "tauri build failed" }

Step "Compressing payload (verifies the frontend is embedded)"
node scripts\pack-payload.mjs
if ($LASTEXITCODE -ne 0) { throw "payload packing failed" }

Step "Launcher (single-file wrapper)"
cargo build --release --manifest-path launcher\Cargo.toml
if ($LASTEXITCODE -ne 0) { throw "launcher build failed" }

Step "Publishing"
New-Item -ItemType Directory -Path "build" -Force | Out-Null
$out = Join-Path $root "build\Ankylo.exe"
Copy-Item "launcher\target\release\ankylo-launcher.exe" $out -Force

$size = [math]::Round((Get-Item $out).Length / 1MB, 1)
Write-Host "`nDONE -> $out  ($size MB)" -ForegroundColor Green
Write-Host "Copy that single file to share Ankylo." -ForegroundColor DarkGray