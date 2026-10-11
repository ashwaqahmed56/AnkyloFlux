param(
  [string]$Exe = "src-tauri\target\release\ankylo.exe",
  [string]$Clip = "C:\Users\Admin4\Desktop\Ankylo\test videos\Video-46840.mp4",
  [int]$WaitSeconds = 14,
  [string]$Out = "$env:TEMP\ankylo-shot.png"
)

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

Get-Process -Name "ankylo" -EA SilentlyContinue | Stop-Process -Force -EA SilentlyContinue
Start-Sleep -Seconds 1

$p = if ($Clip) {
  Start-Process -FilePath $Exe -ArgumentList "`"$Clip`"" -PassThru -WorkingDirectory (Split-Path $Exe)
} else {
  Start-Process -FilePath $Exe -PassThru -WorkingDirectory (Split-Path $Exe)
}

Write-Host "launched pid=$($p.Id), waiting ${WaitSeconds}s..." -ForegroundColor Cyan
Start-Sleep -Seconds $WaitSeconds

$p.Refresh()
if ($p.HasExited) { Write-Host "process exited"; exit 1 }

$hwnd = $p.MainWindowHandle
if ($hwnd -eq 0) { Write-Host "no main window handle"; exit 1 }

$rect = New-Object System.Drawing.Rectangle 0,0,0,0
[void][System.Drawing.NativeMethods]::GetWindowRect 2>$null

# Use the Win32 API through a small P/Invoke-free path: capture the whole screen
# region occupied by the window via GetWindowRect through user32.
$sig = @"
using System;
using System.Runtime.InteropServices;
public class Win {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
}
"@
Add-Type -TypeDefinition $sig -ErrorAction SilentlyContinue

$r = New-Object Win+RECT
[void][Win]::GetWindowRect($hwnd, [ref]$r)
$w = $r.Right - $r.Left
$h = $r.Bottom - $r.Top
Write-Host "window rect: $($r.Left),$($r.Top) ${w}x${h}" -ForegroundColor DarkGray

$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($r.Left, $r.Top, 0, 0, (New-Object System.Drawing.Size $w, $h))
$g.Dispose()
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "saved $Out" -ForegroundColor Green

Get-Process -Name "ankylo" -EA SilentlyContinue | Stop-Process -Force -EA SilentlyContinue