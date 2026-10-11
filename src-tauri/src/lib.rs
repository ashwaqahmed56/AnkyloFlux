mod commands;
mod download;
mod engine;
mod mpv;
mod window;

use engine::MpvEngine;
use std::path::Path;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use tauri::Manager;
use window::VideoWindow;

#[derive(Default)]
pub struct DownloadState {
    pub cancel: AtomicBool,
}

#[derive(Default)]
pub struct StartupTarget {
    pub path: std::sync::Mutex<Option<String>>,
}

pub mod log;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let cli_target = std::env::args()
        .skip(1)
        .find(|a| !a.starts_with('-') && Path::new(a).is_file())
        .map(|a| a.to_string());

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let hwnd = app
                .handle()
                .get_webview_window("main")
                .and_then(|w| w.hwnd().ok())
                .map(|h| h.0 as isize)
                .unwrap_or(0);

            let video = VideoWindow::create(hwnd);
            let video_hwnd = video.hwnd();
            log::line(&format!(
                "setup: webview_hwnd={hwnd} video_hwnd={video_hwnd} cli_target={:?}",
                cli_target
            ));

            app.manage(video);

            let engine = MpvEngine::new(app.handle().clone(), video_hwnd)
                .map_err(|e| std::io::Error::other(format!("Ankylo could not load libmpv: {e}")))?;
            log::line("setup: libmpv initialised");
            app.manage(engine);
            app.manage(DownloadState::default());

            if let Some(target) = cli_target {
                log::line(&format!("cli: queued {target}"));
                app.manage(StartupTarget {
                    path: std::sync::Mutex::new(Some(target)),
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::mpv_open,
            commands::mpv_close,
            commands::mpv_play,
            commands::mpv_pause,
            commands::mpv_toggle,
            commands::mpv_set_repeat,
            commands::mpv_stop,
            commands::mpv_seek,
            commands::mpv_seek_to,
            commands::mpv_frame_step,
            commands::mpv_set_speed,
            commands::mpv_set_volume,
            commands::mpv_set_muted,
            commands::mpv_set_balance,
            commands::mpv_set_audio_delay,
            commands::mpv_set_sub_delay,
            commands::mpv_set_eq,
            commands::mpv_set_aspect,
            commands::mpv_set_zoom,
            commands::mpv_set_pan,
            commands::mpv_reset_zoom,
            commands::mpv_set_rotation,
            commands::mpv_set_mirrored,
            commands::mpv_set_deinterlace,
            commands::mpv_set_hwdec,
            commands::mpv_set_tonemap,
            commands::mpv_cycle_track,
            commands::mpv_set_track,
            commands::mpv_add_sub,
            commands::mpv_load_sub_text,
            commands::mpv_screenshot,
            commands::mpv_enter_pip,
            commands::mpv_exit_pip,
            commands::mpv_video_rect,
            commands::mpv_video_hide,
            commands::mpv_open_dialog,
            commands::mpv_open_sub_dialog,
            commands::download_media,
            commands::download_cancel,
            commands::download_dir,
            commands::resolve_stream,
            commands::tool_available,
            commands::mpv_open_stream,
            commands::take_startup_target,
            commands::diag,
            commands::open_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Ankylo");
}

pub type Engine = Arc<MpvEngine>;