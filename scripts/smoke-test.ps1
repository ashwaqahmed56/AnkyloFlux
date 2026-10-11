param(
  [string]$Exe = "build\Ankylo.exe",
  [string]$Clip = "test videos\Video-46840.mp4",
  [int]$WaitSeconds = 12,
  [string]$Out = "$env:TEMP\ankylo-shot.png",
  [int]$IdleWaitSeconds = 6,
  [switch]$KeepPayload
)

Add-Type -AssemblyName System.Drawing
$sig = @"
using System;
using System.Runtime.InteropServices;
public class Win {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint flags);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr h);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
}
"@
Add-Type -TypeDefinition $sig -ErrorAction SilentlyContinue

# Without this the shell gets virtualised coordinates and the grab covers only
# part of the window on a scaled display.
[void][Win]::SetProcessDPIAware()

$HWND_TOPMOST = [IntPtr](-1)
$HWND_NOTOPMOST = [IntPtr](-2)
$SWP_NOMOVE = 0x0002
$SWP_NOSIZE = 0x0001
$SWP_SHOWWINDOW = 0x0040

function Focus-Player([IntPtr]$hwnd) {
  [void][Win]::ShowWindow($hwnd, 9)   # SW_RESTORE
  [void][Win]::SetWindowPos($hwnd, $HWND_TOPMOST, 0, 0, 0, 0, $SWP_NOMOVE -bor $SWP_NOSIZE -bor $SWP_SHOWWINDOW)
  [void][Win]::BringWindowToTop($hwnd)
  [void][Win]::SetForegroundWindow($hwnd)
  $deadline = (Get-Date).AddSeconds(5)
  while ((Get-Date) -lt $deadline) {
    if ([Win]::GetForegroundWindow() -eq $hwnd) { return $true }
    Start-Sleep -Milliseconds 100
    [void][Win]::SetForegroundWindow($hwnd)
  }
  return $false
}

function Stop-Ankylo {
  Get-Process -Name "Ankylo", "ankylo" -EA SilentlyContinue | Stop-Process -Force -EA SilentlyContinue
  Start-Sleep -Seconds 1
}

function Capture([IntPtr]$hwnd, [string]$path, [string]$label) {
  # CopyFromScreen grabs whatever is painted on top, so force the player above
  # everything else for the duration of the grab.
  if (-not (Focus-Player $hwnd)) {
    Write-Host "  $label : could not bring player to foreground (have $([Win]::GetForegroundWindow()))" -ForegroundColor Yellow
  }
  Start-Sleep -Milliseconds 600

  $r = New-Object Win+RECT
  [void][Win]::GetWindowRect($hwnd, [ref]$r)
  $w = $r.Right - $r.Left
  $h = $r.Bottom - $r.Top
  if ($w -le 0 -or $h -le 0) { Write-Host "  $label : bad window rect ${w}x${h}" -ForegroundColor Red; return }

  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($r.Left, $r.Top, 0, 0, (New-Object System.Drawing.Size $w, $h))
  $g.Dispose()
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()

  [void][Win]::SetWindowPos($hwnd, $HWND_NOTOPMOST, 0, 0, 0, 0, $SWP_NOMOVE -bor $SWP_NOSIZE -bor $SWP_SHOWWINDOW)
  Write-Host "  $label : window ${w}x${h} -> $path" -ForegroundColor Cyan
}

function Log-Since([int]$mark) {
  $log = Join-Path $env:LOCALAPPDATA "Ankylo\ankylo.log"
  if (-not (Test-Path $log)) { return @() }
  @(Get-Content $log | Select-Object -Skip $mark)
}

# A couple of small pointer moves inside the window count as user activity, which
# is what un-hides the chrome.
function Jiggle([IntPtr]$hwnd) {
  $r = New-Object Win+RECT
  [void][Win]::GetWindowRect($hwnd, [ref]$r)
  $cx = $r.Left + [int](($r.Right - $r.Left) / 2)
  $cy = $r.Top + [int](($r.Bottom - $r.Top) / 2)
  foreach ($d in @(0, 12, 6, 14, 8)) {
    [void][Win]::SetCursorPos($cx + $d, $cy + $d)
    Start-Sleep -Milliseconds 120
  }
}

Stop-Ankylo

# The launcher only unpacks when the cached payload is empty, so a stale copy
# from a previous build would silently be tested instead of the new one.
if (-not $KeepPayload) {
  $payload = Join-Path $env:LOCALAPPDATA "Ankylo\ankylo.exe"
  if (Test-Path $payload) {
    Remove-Item $payload -Force
    Write-Host "cleared stale payload: $payload" -ForegroundColor DarkGray
  }
}

$mark = (Log-Since 0).Count
$exePath = (Resolve-Path $Exe).Path
$clipPath = if ($Clip) { (Resolve-Path $Clip).Path } else { $null }

$extracted = Join-Path $env:LOCALAPPDATA "Ankylo\ankylo.exe"

if (-not $KeepPayload) {
  # Run the shipped launcher once so the fresh payload lands in LOCALAPPDATA,
  # then drive that binary directly - the launcher does not forward argv.
  Write-Host "launching $exePath to unpack payload" -ForegroundColor Cyan
  Start-Process -FilePath $exePath -WorkingDirectory (Split-Path $exePath) | Out-Null
  $deadline = (Get-Date).AddSeconds(90)
  while ((Get-Date) -lt $deadline -and -not (Test-Path $extracted)) { Start-Sleep -Milliseconds 500 }
  if (-not (Test-Path $extracted)) { Write-Host "payload was not unpacked" -ForegroundColor Red; exit 1 }
  Stop-Ankylo
  Start-Sleep -Seconds 1
  $mark = (Log-Since 0).Count
  Write-Host "unpacked -> $extracted" -ForegroundColor DarkGray
}

$target = if (Test-Path $extracted) { $extracted } else { $exePath }
Write-Host "launching $target with $clipPath" -ForegroundColor Cyan
if ($clipPath) {
  Start-Process -FilePath $target -ArgumentList "`"$clipPath`"" -WorkingDirectory (Split-Path $target) | Out-Null
} else {
  Start-Process -FilePath $target -WorkingDirectory (Split-Path $target) | Out-Null
}

# Wait for the window rather than trusting the process we started.
$deadline = (Get-Date).AddSeconds(60)
$p = $null
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Milliseconds 500
  $p = Get-Process -Name "ankylo" -EA SilentlyContinue |
       Sort-Object StartTime |
       Select-Object -Last 1
  if ($p) {
    $p.Refresh()
    if ($p.HasExited) { $p = $null; continue }
    if ($p.MainWindowHandle -ne 0) { break }
  }
}

if (-not $p) { Write-Host "player process never appeared" -ForegroundColor Red; exit 1 }

Write-Host "player pid=$($p.Id) path=$($p.Path)" -ForegroundColor Cyan
Start-Sleep -Seconds $WaitSeconds

$p.Refresh()
if ($p.HasExited) { Write-Host "player exited early (code $($p.ExitCode))" -ForegroundColor Red; exit 1 }

$hwnd = $p.MainWindowHandle
if ($hwnd -eq 0) { Write-Host "no main window handle" -ForegroundColor Red; exit 1 }

# The chrome auto-hides after ~2.5s of no input, so nudge the pointer to bring
# it back before the first grab.
Start-Sleep -Seconds 2
[void](Focus-Player $hwnd)
Jiggle $hwnd
Capture $hwnd $Out "controls-visible"

Write-Host "`nwaiting ${IdleWaitSeconds}s for chrome to auto-hide..." -ForegroundColor DarkGray
Start-Sleep -Seconds $IdleWaitSeconds
Capture $hwnd ($Out -replace '\.png$', '-idle.png') "controls-hidden"

Write-Host "`n--- new log lines ---" -ForegroundColor Cyan
Log-Since $mark | ForEach-Object { Write-Host $_ }

Stop-Ankylo
