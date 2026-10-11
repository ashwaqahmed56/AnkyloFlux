use crate::engine::MpvEngine;
use crate::window::VideoWindow;
use serde::Deserialize;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager, State};
use walkdir::WalkDir;

#[derive(Deserialize)]
pub struct EqParams {
    brightness: f64,
    contrast: f64,
    saturation: f64,
    gamma: f64,
    hue: f64,
    sharpness: f64,
}

#[tauri::command]
pub fn mpv_open(state: State<'_, Arc<MpvEngine>>, path: String) {
    crate::log::line(&format!("open: {path}"));
    state.open(&path);
}

#[tauri::command]
pub fn mpv_close(state: State<'_, Arc<MpvEngine>>) {
    state.close();
}

#[tauri::command]
pub fn mpv_play(state: State<'_, Arc<MpvEngine>>) {
    state.play();
}

#[tauri::command]
pub fn mpv_pause(state: State<'_, Arc<MpvEngine>>) {
    state.set_property("pause", "yes");
}

#[tauri::command]
pub fn mpv_toggle(state: State<'_, Arc<MpvEngine>>) {
    state.toggle_play();
}

#[tauri::command]
pub fn mpv_set_repeat(state: State<'_, Arc<MpvEngine>>, repeat: bool) {
    state.set_repeat(repeat);
}

#[tauri::command]
pub fn mpv_stop(state: State<'_, Arc<MpvEngine>>) {
    state.command("stop");
}

#[tauri::command]
pub fn mpv_seek(state: State<'_, Arc<MpvEngine>>, delta: f64) {
    state.command(&format!("seek {delta} relative+exact"));
}

#[tauri::command]
pub fn mpv_seek_to(state: State<'_, Arc<MpvEngine>>, t: f64) {
    state.command(&format!("seek {t} absolute+exact"));
}

#[tauri::command]
pub fn mpv_frame_step(state: State<'_, Arc<MpvEngine>>, dir: i32) {
    state.command(if dir > 0 { "frame-step" } else { "frame-back-step" });
}

#[tauri::command]
pub fn mpv_set_speed(state: State<'_, Arc<MpvEngine>>, v: f64) {
    state.set_property("speed", &format!("{v:.3}"));
}

#[tauri::command]
pub fn mpv_set_volume(state: State<'_, Arc<MpvEngine>>, v: f64) {
    // `v` arrives as a 0..1 gain, mpv's `volume` is a percentage.
    let pct = v.clamp(0.0, 1.0) * 100.0;
    crate::log::line(&format!("volume: {v:.4} -> mpv {pct:.2}"));
    state.set_property("volume", &format!("{pct:.2}"));
}

#[tauri::command]
pub fn mpv_set_muted(state: State<'_, Arc<MpvEngine>>, m: bool) {
    state.set_property("mute", if m { "yes" } else { "no" });
}

#[tauri::command]
pub fn mpv_set_balance(state: State<'_, Arc<MpvEngine>>, v: f64) {
    state.set_property("audio-pan", &format!("{v:.2} 1"));
}

#[tauri::command]
pub fn mpv_set_audio_delay(state: State<'_, Arc<MpvEngine>>, ms: f64) {
    state.set_property("audio-delay", &format!("{:.3}", ms / 1000.0));
}

#[tauri::command]
pub fn mpv_set_sub_delay(state: State<'_, Arc<MpvEngine>>, ms: f64) {
    state.set_property("sub-delay", &format!("{:.3}", ms / 1000.0));
}

#[tauri::command]
pub fn mpv_set_eq(state: State<'_, Arc<MpvEngine>>, eq: EqParams) {
    state.eq_params("brightness", eq.brightness);
    state.eq_params("contrast", eq.contrast);
    state.eq_params("saturation", eq.saturation);
    state.eq_params("gamma", eq.gamma);
    state.eq_params("hue", eq.hue);
    state.eq_params("sharpen", eq.sharpness);
}

#[tauri::command]
pub fn mpv_set_aspect(state: State<'_, Arc<MpvEngine>>, mode: String) {
    crate::log::line(&format!("mpv_set_aspect: mode={mode}"));
    match mode.as_str() {
        "fit" => {
            state.set_property("panscan", "0.0");
            state.set_property("keepaspect", "no");
            state.set_property("video-aspect-override", "no");
            state.set_property("video-aspect-mode", "container");
        }
        "fill" => {
            state.set_property("panscan", "1.0");
            state.set_property("keepaspect", "yes");
            state.set_property("video-aspect-override", "no");
            state.set_property("video-aspect-mode", "container");
        }
        "auto" => {
            state.set_property("panscan", "0.0");
            state.set_property("keepaspect", "yes");
            state.set_property("video-aspect-override", "no");
            state.set_property("video-aspect-mode", "container");
        }
        "16:9" => {
            state.set_property("panscan", "0.0");
            state.set_property("keepaspect", "yes");
            state.set_property("video-aspect-override", "16:9");
        }
        "4:3" => {
            state.set_property("panscan", "0.0");
            state.set_property("keepaspect", "yes");
            state.set_property("video-aspect-override", "4:3");
        }
        "2.35:1" => {
            state.set_property("panscan", "0.0");
            state.set_property("keepaspect", "yes");
            state.set_property("video-aspect-override", "2.35");
        }
        "1:1" => {
            state.set_property("panscan", "0.0");
            state.set_property("keepaspect", "yes");
            state.set_property("video-aspect-override", "1:1");
        }
        other => {
            state.set_property("panscan", "0.0");
            state.set_property("keepaspect", "yes");
            state.set_property("video-aspect-override", other);
        }
    }
    // Redraw immediately so paused frames reflect the new ratio
    state.command("seek 0 relative+exact");
}

#[tauri::command]
pub fn mpv_set_zoom(state: State<'_, Arc<MpvEngine>>, zoom: f64) {
    let z = zoom.clamp(-1.0, 3.0);
    crate::log::line(&format!("mpv_set_zoom: {z:.4}"));
    state.set_property("video-zoom", &format!("{z:.4}"));
    state.command("seek 0 relative+exact");
}

#[tauri::command]
pub fn mpv_set_pan(state: State<'_, Arc<MpvEngine>>, x: f64, y: f64) {
    let px = x.clamp(-1.0, 1.0);
    let py = y.clamp(-1.0, 1.0);
    state.set_property("video-pan-x", &format!("{px:.4}"));
    state.set_property("video-pan-y", &format!("{py:.4}"));
    state.command("seek 0 relative+exact");
}

#[tauri::command]
pub fn mpv_reset_zoom(state: State<'_, Arc<MpvEngine>>) {
    crate::log::line("mpv_reset_zoom");
    state.set_property("video-zoom", "0.0");
    state.set_property("video-pan-x", "0.0");
    state.set_property("video-pan-y", "0.0");
    state.set_property("panscan", "0.0");
    state.command("seek 0 relative+exact");
}


#[tauri::command]
pub fn mpv_set_rotation(state: State<'_, Arc<MpvEngine>>, deg: f64) {
    crate::log::line(&format!("mpv_set_rotation: deg={deg}"));
    state.set_property("video-rotate", &format!("{deg:.0}"));
    state.command("seek 0 relative+exact");
}

#[tauri::command]
pub fn mpv_set_mirrored(state: State<'_, Arc<MpvEngine>>, b: bool) {
    crate::log::line(&format!("mpv_set_mirrored: b={b}"));
    state.set_property("video-flip-y", if b { "yes" } else { "no" });
    state.command("seek 0 relative+exact");
}

#[tauri::command]
pub fn mpv_set_deinterlace(state: State<'_, Arc<MpvEngine>>, b: bool) {
    state.set_property("deinterlace", if b { "yadif" } else { "no" });
}

#[tauri::command]
pub fn mpv_set_hwdec(state: State<'_, Arc<MpvEngine>>, mode: String) {
    state.set_property("hwdec", &mode);
}

#[tauri::command]
pub fn mpv_set_tonemap(state: State<'_, Arc<MpvEngine>>, mode: String) {
    match mode.as_str() {
        "no" => state.set_property("tone-mapping", "clip"),
        "auto" => state.set_property("target-colorspace-hint", "yes"),
        other => {
            state.set_property("tone-mapping", other);
            state.set_property("target-colorspace-hint", "yes");
        }
    }
}

#[tauri::command]
pub fn mpv_cycle_track(state: State<'_, Arc<MpvEngine>>, kind: String) {
    let prop = if kind == "audio" { "aid" } else { "sid" };
    state.command(&format!("cycle {prop}"));
}

#[tauri::command]
pub fn mpv_set_track(state: State<'_, Arc<MpvEngine>>, kind: String, id: i64) {
    let prop = if kind == "audio" { "aid" } else { "sid" };
    if id < 0 {
        state.set_property(prop, "no");
    } else {
        state.set_property(prop, &id.to_string());
    }
}

fn escape_path(path: &str) -> String {
    path.replace('\\', "\\\\").replace('"', "\\\"")
}

#[tauri::command]
pub fn mpv_add_sub(state: State<'_, Arc<MpvEngine>>, path: String) {
    state.command(&format!("sub-add \"{}\" select", escape_path(&path)));
}

#[tauri::command]
pub fn mpv_load_sub_text(
    app: AppHandle,
    state: State<'_, Arc<MpvEngine>>,
    text: String,
    name: String,
) -> Result<String, String> {
    let ext = PathBuf::from(&name)
        .extension()
        .map(|e| e.to_string_lossy().to_string())
        .unwrap_or_else(|| "srt".to_string());
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).ok();
    let path = dir.join(format!("ankylo-sub-{}.{}", std::process::id(), ext));
    std::fs::write(&path, text).map_err(|e| e.to_string())?;
    let p = path.to_string_lossy().to_string();
    mpv_add_sub(state, p.clone());
    Ok(p)
}

#[tauri::command]
pub fn mpv_screenshot(app: AppHandle, state: State<'_, Arc<MpvEngine>>) -> Result<String, String> {
    let dir = app
        .path()
        .picture_dir()
        .map_err(|e| e.to_string())
        .unwrap_or_else(|_| PathBuf::from("."));
    let stamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    let path = dir.join(format!("ankylo-{stamp}.png"));
    state.command(&format!(
        "screenshot-to-file \"{}\" video",
        escape_path(&path.to_string_lossy())
    ));
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn mpv_enter_pip(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_always_on_top(true);
        let _ = window.set_size(tauri::PhysicalSize::new(520, 320));
        let _ = window.center();
    }
    Ok(())
}

#[tauri::command]
pub fn mpv_exit_pip(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_always_on_top(false);
        let _ = window.set_size(tauri::PhysicalSize::new(1360, 800));
        let _ = window.center();
    }
    Ok(())
}

#[tauri::command]
pub fn diag(msg: String) {
    crate::log::line(&format!("ui: {msg}"));
}

#[tauri::command]
pub fn take_startup_target(state: State<'_, crate::StartupTarget>) -> Option<String> {
    state.path.lock().ok().and_then(|mut g| g.take())
}

#[tauri::command]
pub fn mpv_video_rect(video: State<'_, VideoWindow>, x: f64, y: f64, w: f64, h: f64) {
    // CSS pixels are fractional, and a float that does not fit `i32` would
    // otherwise fail argument deserialisation and drop the rect on the floor.
    let (x, y, w, h) = (
        x.round() as i32,
        y.round() as i32,
        w.round() as i32,
        h.round() as i32,
    );
    crate::log::rect(x, y, w, h);
    video.move_to(x, y, w, h);
}

#[tauri::command]
pub fn mpv_video_hide(video: State<'_, VideoWindow>) {
    video.hide();
}

const MEDIA_EXTS: &[&str] = &[
    "mp4", "mkv", "avi", "mov", "webm", "flv", "ts", "m2ts", "mts", "m4ts", "mpg", "mpeg", "m2v",
    "vob", "evo", "wmv", "asf", "rm", "rmvb", "3gp", "3g2", "ogv", "ogg", "divx", "xvid", "f4v",
    "mxf", "m4a", "mp3", "flac", "wav", "aac", "opus", "wma", "ape", "wv", "alac",
];

fn is_media(path: &std::path::Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| MEDIA_EXTS.contains(&e.to_ascii_lowercase().as_str()))
        .unwrap_or(false)
}

#[tauri::command]
pub async fn mpv_open_dialog(app: AppHandle, mode: String) -> Vec<String> {
    use tauri_plugin_dialog::DialogExt;

    if mode == "folder" {
        let picked = app.dialog().file().blocking_pick_folder().and_then(|p| p.into_path().ok());

        return match picked {
            Some(dir) => WalkDir::new(dir)
                .max_depth(4)
                .into_iter()
                .filter_map(|e| e.ok())
                .filter(|e| e.file_type().is_file())
                .filter(|e| is_media(e.path()))
                .map(|e| e.path().to_string_lossy().to_string())
                .collect(),
            None => Vec::new(),
        };
    }

    app.dialog()
        .file()
        .add_filter(
            "Media",
            &[
                "mp4", "mkv", "avi", "mov", "webm", "flv", "ts", "m2ts", "mts", "mpg", "mpeg",
                "vob", "wmv", "asf", "rm", "rmvb", "3gp", "ogv", "m4a", "mp3", "flac", "opus",
            ],
        )
        .add_filter("All files", &["*"])
        .blocking_pick_files()
        .unwrap_or_default()
        .into_iter()
        .filter_map(|p| p.into_path().ok())
        .map(|p| p.to_string_lossy().to_string())
        .collect()
}

#[tauri::command]
pub async fn mpv_open_sub_dialog(app: AppHandle) -> Vec<String> {
    use tauri_plugin_dialog::DialogExt;

    app.dialog()
        .file()
        .add_filter("Subtitles", &["srt", "ass", "ssa", "vtt", "sub", "idx", "sup"])
        .blocking_pick_files()
        .unwrap_or_default()
        .into_iter()
        .filter_map(|p| p.into_path().ok())
        .map(|p| p.to_string_lossy().to_string())
        .collect()
}

#[tauri::command]
pub fn download_dir(app: AppHandle) -> String {
    let dir = app
        .path()
        .video_dir()
        .or_else(|_| app.path().download_dir())
        .or_else(|_| app.path().home_dir())
        .unwrap_or_else(|_| PathBuf::from("."));
    dir.to_string_lossy().to_string()
}

#[tauri::command]
pub fn mpv_open_stream(state: State<'_, Arc<MpvEngine>>, video: String, audio: Option<String>) {
    crate::log::line(&format!("open_stream: audio={}", audio.is_some()));
    state.open_stream(&video, audio.as_deref());
}

fn tool_path(name: &str) -> Option<std::path::PathBuf> {
    let exe = if cfg!(windows) { format!("{name}.exe") } else { name.to_string() };
    let mut candidates: Vec<std::path::PathBuf> = Vec::new();
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(dir) = exe_path.parent() {
            for sub in ["binaries", "."] {
                candidates.push(dir.join(sub).join(&exe));
            }
        }
    }
    candidates.push(std::path::PathBuf::from(&exe));
    candidates.into_iter().find(|p| p.exists())
}

/// Sites like YouTube hand out video and audio as separate streams. Resolve them
/// to direct URLs so the player can start immediately instead of downloading.
/// CREATE_NO_WINDOW. Without it, spawning a console-subsystem tool from a GUI
/// app makes Windows allocate a console window that flashes on screen.
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

#[cfg(windows)]
fn hidden(cmd: &mut std::process::Command) -> &mut std::process::Command {
    use std::os::windows::process::CommandExt;
    cmd.creation_flags(CREATE_NO_WINDOW)
}

#[cfg(not(windows))]
fn hidden(cmd: &mut std::process::Command) -> &mut std::process::Command {
    cmd
}

#[derive(serde::Serialize)]
pub struct ResolvedStream {
    pub video: String,
    pub audio: Option<String>,
    pub title: String,
}

#[tauri::command]
pub async fn resolve_stream(url: String) -> Result<ResolvedStream, String> {
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err("not a network url".to_string());
    }
    let ytdlp = tool_path("yt-dlp").ok_or_else(|| "yt-dlp is not available".to_string())?;

    let out = tokio::task::spawn_blocking(move || {
        let mut cmd = std::process::Command::new(&ytdlp);
        cmd.args([
            "-J",
            "--no-warnings",
            "--no-playlist",
            "--no-check-certificate",
            &url,
        ]);
        hidden(&mut cmd).output()
    })
    .await
    .map_err(|e| format!("resolver task failed: {e}"))?
    .map_err(|e| format!("could not run yt-dlp: {e}"))?;

    if !out.status.success() {
        let err = String::from_utf8_lossy(&out.stderr);
        let first = err.lines().find(|l| l.contains("ERROR")).unwrap_or("resolve failed");
        return Err(first.trim_start_matches("ERROR: ").to_string());
    }

    let data: serde_json::Value =
        serde_json::from_slice(&out.stdout).map_err(|e| format!("bad resolver output: {e}"))?;

    let title = data["title"].as_str().unwrap_or("Stream").to_string();

    let mut video: Option<String> = None;
    let mut audio: Option<String> = None;

    if let Some(list) = data["requested_formats"].as_array() {
        for f in list {
            let u = f["url"].as_str().unwrap_or("").to_string();
            if u.is_empty() {
                continue;
            }
            let has_v = f["vcodec"].as_str().unwrap_or("none") != "none";
            let has_a = f["acodec"].as_str().unwrap_or("none") != "none";
            if has_v && video.is_none() {
                video = Some(u);
            } else if has_a && audio.is_none() {
                audio = Some(u);
            }
        }
    }

    if video.is_none() {
        let u = data["url"].as_str().unwrap_or("").to_string();
        // A single muxed URL is the fallback; without a video stream there is
        // nothing playable, and mpv cannot use an audio-only source here.
        if !u.is_empty() && data["vcodec"].as_str().unwrap_or("none") != "none" {
            video = Some(u);
        }
    }

    let video = video.ok_or_else(|| "no playable video stream found".to_string())?;
    Ok(ResolvedStream { video, audio, title })
}

#[tauri::command]
pub fn tool_available(name: String) -> bool {
    tool_path(&name).is_some()
}

#[tauri::command]
pub async fn download_media(
    app: AppHandle,
    state: State<'_, crate::DownloadState>,
    url: String,
) -> Result<String, String> {
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err("only network streams can be downloaded".to_string());
    }

    let dir = PathBuf::from(download_dir(app.clone()));
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    state.cancel.store(false, std::sync::atomic::Ordering::Relaxed);

    // yt-dlp handles the awkward sources (split streams, signature-protected
    // URLs, adaptive manifests) far better than raw HTTP does.
    if let Some(ytdlp) = tool_path("yt-dlp") {
        let app2 = app.clone();
        let url2 = url.clone();
        let dir2 = dir.clone();
        let result = tokio::task::spawn_blocking(move || {
            download_with_tool(&app2, &ytdlp, &url2, &dir2)
        })
        .await
        .map_err(|e| format!("download task failed: {e}"))?;
        if result.is_ok() {
            return result;
        }
    }

    let cancel = Arc::new(std::sync::atomic::AtomicBool::new(false));
    tokio::task::spawn_blocking(move || {
        crate::download::download(&app, &url, dir, cancel)
    })
    .await
    .map_err(|e| format!("download task failed: {e}"))?
}

fn download_with_tool(
    app: &AppHandle,
    tool: &std::path::Path,
    url: &str,
    dir: &Path,
) -> Result<String, String> {
    let template = dir.join("%(title).80s [%(id)s].%(ext)s");

    let mut cmd = std::process::Command::new(tool);
    cmd.args([
        "--newline",
        "--no-playlist",
        "--no-warnings",
        "--progress",
        "-f",
        "bv*+ba/b",
        "--merge-output-format",
        "mp4",
        "-o",
        &template.to_string_lossy(),
        url,
    ])
    .stdout(std::process::Stdio::piped())
    .stderr(std::process::Stdio::piped());

    let child = hidden(&mut cmd).spawn().map_err(|e| e.to_string())?;

    let child = std::sync::Mutex::new(child);
    let mut last = std::time::Instant::now();
    let finished: Option<String>;

    loop {
        let mut guard = child.lock().unwrap();
        match guard.try_wait() {
            Ok(Some(status)) => {
                if status.success() {
                    let newest = std::fs::read_dir(dir)
                        .ok()
                        .and_then(|entries| {
                            entries
                                .flatten()
                                .filter(|e| e.path().is_file())
                                .max_by_key(|e| e.metadata().ok().and_then(|m| m.modified().ok()))
                                .map(|e| e.path().to_string_lossy().to_string())
                        })
                        .unwrap_or_else(|| dir.to_string_lossy().to_string());
                    finished = Some(newest);
                } else {
                    return Err("downloader failed".to_string());
                }
                break;
            }
            Ok(None) => {}
            Err(e) => return Err(e.to_string()),
        }
        drop(guard);

        if last.elapsed() > std::time::Duration::from_millis(400) {
            last = std::time::Instant::now();
            let _ = app.emit(
                crate::download::DOWNLOAD_EVENT,
                crate::download::Progress {
                    kind: "download",
                    name: file_name_of(url),
                    received: 0,
                    total: 0,
                    percent: 0.0,
                    speed_bps: 0.0,
                    done: false,
                    error: None,
                    path: None,
                },
            );
        }
        std::thread::sleep(std::time::Duration::from_millis(120));
    }

    let path = finished.ok_or_else(|| "no file produced".to_string())?;
    let _ = app.emit(
        crate::download::DOWNLOAD_EVENT,
        crate::download::Progress {
            kind: "download",
            name: file_name_of(url),
            received: 0,
            total: 0,
            percent: 100.0,
            speed_bps: 0.0,
            done: true,
            error: None,
            path: Some(path.clone()),
        },
    );
    Ok(path)
}

fn file_name_of(url: &str) -> String {
    url.split('?')
        .next()
        .unwrap_or(url)
        .rsplit('/')
        .next()
        .unwrap_or("download")
        .to_string()
}

#[tauri::command]
pub fn download_cancel(state: State<'_, crate::DownloadState>) {
    state.cancel.store(true, std::sync::atomic::Ordering::Relaxed);
}

#[tauri::command]
pub fn open_url(url: String) -> Result<(), String> {
    #[cfg(windows)]
    {
        hidden(&mut std::process::Command::new("cmd"))
            .args(["/C", "start", "", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(windows))]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
}