#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use flate2::read::DeflateDecoder;
use std::ffi::c_void;
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::Command;

const APP_GZ: &[u8] = include_bytes!("../../src-tauri/payload/ankylo.exe.gz");
const MPV_GZ: &[u8] = include_bytes!("../../src-tauri/payload/libmpv-2.dll.gz");
const YTDLP_GZ: &[u8] = include_bytes!("../../src-tauri/payload/yt-dlp.exe.gz");

fn inflate(compressed: &[u8]) -> Result<Vec<u8>, String> {
    let mut out = Vec::new();
    DeflateDecoder::new(compressed)
        .read_to_end(&mut out)
        .map_err(|e| format!("decompress failed: {e}"))?;
    Ok(out)
}

fn unpack(name: &str, compressed: &[u8], dest: &Path) -> Result<(), String> {
    let expected = compressed
        .len()
        .checked_sub(0)
        .map(|_| ())
        .ok_or_else(|| "invalid payload".to_string());
    expected?;

    let data = inflate(compressed)?;

    if let Ok(existing) = fs::read(dest) {
        if existing == data {
            return Ok(());
        }
    }

    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let tmp = dest.with_extension("tmp");
    fs::write(&tmp, &data).map_err(|e| e.to_string())?;
    let _ = fs::remove_file(dest);
    fs::rename(&tmp, dest).map_err(|e| e.to_string())?;
    let _ = name;
    Ok(())
}

fn app_dir() -> PathBuf {
    if let Ok(local) = std::env::var("LOCALAPPDATA") {
        return PathBuf::from(local).join("Ankylo");
    }
    std::env::temp_dir().join("Ankylo")
}

#[link(name = "user32")]
extern "system" {
    fn MessageBoxW(hwnd: *mut c_void, text: *const u16, caption: *const u16, flags: u32) -> i32;
}

fn wide(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(std::iter::once(0)).collect()
}

fn message(title: &str, body: &str) {
    unsafe {
        MessageBoxW(
            std::ptr::null_mut(),
            wide(body).as_ptr(),
            wide(title).as_ptr(),
            0x10,
        );
    }
}

fn main() {
    let dir = app_dir();

    let exe = dir.join("ankylo.exe");
    let dll = dir.join("binaries").join("libmpv-2.dll");
    let ytdlp = dir.join("binaries").join("yt-dlp.exe");

    if let Err(e) = unpack("ankylo.exe", APP_GZ, &exe) {
        message("Ankylo", &e);
        return;
    }
    if let Err(e) = unpack("libmpv-2.dll", MPV_GZ, &dll) {
        message("Ankylo", &e);
        return;
    }
    if let Err(e) = unpack("yt-dlp.exe", YTDLP_GZ, &ytdlp) {
        message("Ankylo", &e);
        return;
    }

    // Spawn the app directly. Going through `cmd /c start` spawns a console
    // window that flashes on every launch.
    let mut child = Command::new(&exe);
    child.current_dir(exe.parent().unwrap_or_else(|| std::path::Path::new(".")));
    // Carry the launcher's own arguments through, otherwise
    // `Ankylo.exe some.mkv` unpacks the player and opens it empty.
    child.args(std::env::args().skip(1));
    if let Err(e) = child.spawn() {
        message("Ankylo", &format!("could not start the player: {e}"));
    }
}