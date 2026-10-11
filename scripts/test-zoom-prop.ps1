Add-Type @"
using System;
using System.Runtime.InteropServices;
public class MpvZoomTest {
    [DllImport(@"C:\Users\Admin4\Desktop\Ankylo\src-tauri\binaries\libmpv-2.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern IntPtr mpv_create();
    [DllImport(@"C:\Users\Admin4\Desktop\Ankylo\src-tauri\binaries\libmpv-2.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern int mpv_initialize(IntPtr ctx);
    [DllImport(@"C:\Users\Admin4\Desktop\Ankylo\src-tauri\binaries\libmpv-2.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern int mpv_set_option_string(IntPtr ctx, string name, string data);
    [DllImport(@"C:\Users\Admin4\Desktop\Ankylo\src-tauri\binaries\libmpv-2.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern int mpv_set_property_string(IntPtr ctx, string name, string data);
    [DllImport(@"C:\Users\Admin4\Desktop\Ankylo\src-tauri\binaries\libmpv-2.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern int mpv_get_property(IntPtr ctx, string name, int format, out IntPtr data);
    [DllImport(@"C:\Users\Admin4\Desktop\Ankylo\src-tauri\binaries\libmpv-2.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern void mpv_free(IntPtr data);
    [DllImport(@"C:\Users\Admin4\Desktop\Ankylo\src-tauri\binaries\libmpv-2.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern void mpv_terminate_destroy(IntPtr ctx);
}
"@

$ctx = [MpvZoomTest]::mpv_create()
[void][MpvZoomTest]::mpv_set_option_string($ctx, 'vo', 'null')
[void][MpvZoomTest]::mpv_initialize($ctx)

function SetP($n, $v) {
    return [MpvZoomTest]::mpv_set_property_string($ctx, $n, $v)
}

function GetP($n) {
    $ptr = [IntPtr]::Zero
    $rv = [MpvZoomTest]::mpv_get_property($ctx, $n, 2, [ref]$ptr)
    if ($rv -ge 0 -and $ptr -ne [IntPtr]::Zero) {
        $s = [System.Runtime.InteropServices.Marshal]::PtrToStringAnsi($ptr)
        [MpvZoomTest]::mpv_free($ptr)
        return $s
    }
    return "err($rv)"
}

Write-Host "Set video-zoom 0.5: $(SetP 'video-zoom' '0.5') -> $(GetP 'video-zoom')"
Write-Host "Set video-pan-x 0.1: $(SetP 'video-pan-x' '0.1') -> $(GetP 'video-pan-x')"
Write-Host "Set video-pan-y -0.2: $(SetP 'video-pan-y' '-0.2') -> $(GetP 'video-pan-y')"
Write-Host "Set panscan 1.0: $(SetP 'panscan' '1.0') -> $(GetP 'panscan')"

[MpvZoomTest]::mpv_terminate_destroy($ctx)
