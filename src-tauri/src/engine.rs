use crate::mpv::*;
use serde::Serialize;
use serde_json::json;
use std::ffi::{c_void, CStr};
use std::sync::mpsc::{channel, Sender};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize)]
pub struct Track {
    pub id: i64,
    pub kind: &'static str,
    pub title: String,
    pub lang: Option<String>,
    pub codec: Option<String>,
    pub selected: bool,
}

#[derive(Clone, Serialize)]
pub struct Chapter {
    pub title: String,
    pub time: f64,
}

pub struct MpvEngine {
    handle: Arc<MpvHandle>,
    repeat: Mutex<bool>,
    loop_points: Mutex<(Option<f64>, Option<f64>)>,
    video_hwnd: Mutex<isize>,
}

pub const EVENT: &str = "mpv-event";

const OBS_TIME: u64 = 1;
const OBS_PAUSE: u64 = 2;
const OBS_CHAPTER: u64 = 3;
const OBS_EOF: u64 = 4;

static WAKE_FLAG: Mutex<Option<Sender<()>>> = Mutex::new(None);

extern "C" fn wakeup(_ctx: *mut c_void) {
    if let Ok(guard) = WAKE_FLAG.lock() {
        if let Some(tx) = guard.as_ref() {
            let _ = tx.send(());
        }
    }
}

fn node_string(node: &MpvNode) -> String {
    MpvHandle::node_string(node)
}

fn map_lookup<'a>(map: &MpvNodeMap, key: &str) -> Option<&'a MpvNode> {
    if map.num <= 0 || map.keys.is_null() || map.values.is_null() {
        return None;
    }
    let keys = unsafe { std::slice::from_raw_parts(map.keys, map.num as usize) };
    let values = unsafe { std::slice::from_raw_parts(map.values, map.num as usize) };
    keys.iter().enumerate().find_map(|(i, k)| {
        if k.is_null() {
            return None;
        }
        let k = unsafe { CStr::from_ptr(*k) }.to_string_lossy();
        if k == key {
            Some(&values[i])
        } else {
            None
        }
    })
}

impl MpvEngine {
    pub fn new(app: AppHandle, video_hwnd: isize) -> Result<Arc<Self>, String> {
        let mpv = MpvHandle::new()?;

        mpv.set_option("config", "no")?;
        mpv.set_option("terminal", "no")?;
        mpv.set_option("audio-display", "no")?;
        mpv.set_option("osd-level", "0")?;
        mpv.set_option("input-default-bindings", "no")?;
        mpv.set_option("input-vo-keyboard", "no")?;
        mpv.set_option("keep-open", "yes")?;
        mpv.set_option("idle", "yes")?;
        mpv.set_option("border", "no")?;
        mpv.set_option("screenshot-format", "png")?;
        if video_hwnd != 0 {
            mpv.set_option("wid", &video_hwnd.to_string())?;
        }
        mpv.set_property("hwdec", "auto-safe");
        mpv.set_property("video-sync", "display-resample");
        mpv.request_logs("warn");

        mpv.observe(OBS_TIME, "time-pos", MPV_FORMAT_DOUBLE);
        mpv.observe(OBS_TIME, "duration", MPV_FORMAT_DOUBLE);
        mpv.observe(OBS_TIME, "demuxer-cache-time", MPV_FORMAT_DOUBLE);
        mpv.observe(OBS_PAUSE, "pause", MPV_FORMAT_FLAG);
        mpv.observe(OBS_PAUSE, "paused-for-cache", MPV_FORMAT_FLAG);
        mpv.observe(OBS_PAUSE, "seeking", MPV_FORMAT_FLAG);
        // mpv dropped MPV_EVENT_CHAPTERS_CHANGED; the list is only signalled by
        // the property now. Observe it without a value so no node is built.
        mpv.observe(OBS_CHAPTER, "chapter-list", MPV_FORMAT_NONE);
        mpv.observe(OBS_EOF, "eof-reached", MPV_FORMAT_FLAG);

        let (tx, rx) = channel::<()>();
        *WAKE_FLAG.lock().unwrap() = Some(tx);
        mpv.set_wakeup(wakeup, std::ptr::null_mut());

        let handle = Arc::new(mpv);
        let engine = Arc::new(Self {
            handle: handle.clone(),
            repeat: Mutex::new(false),
            loop_points: Mutex::new((None, None)),
            video_hwnd: Mutex::new(video_hwnd),
        });

        let loop_engine = engine.clone();
        let loop_app = app.clone();
        std::thread::spawn(move || {
            let mpv = loop_engine.handle.clone();
            let mut last_time_push = Instant::now() - Duration::from_millis(200);

            while let Ok(()) = rx.recv() {
                // Drain everything the wakeup signalled. mpv_wait_event(0.0)
                // does not block - it returns MPV_EVENT_NONE once the queue is
                // empty - which is also when mpv flushes coalesced property
                // change notifications.
                while let Some(event) = mpv.wait_event(0.0) {
                    if event.event_id == MPV_EVENT_NONE {
                        break;
                    }
                    match event.event_id {
                        MPV_EVENT_PROPERTY_CHANGE => {
                            if event.data.is_null() {
                                continue;
                            }
                            let prop = unsafe { &*(event.data as *mut MpvEventProperty) };
                            match (event.reply_userdata, prop.format) {
                                (OBS_TIME, MPV_FORMAT_DOUBLE) => {
                                    // A live stream can produce hundreds of these per second;
                                    // cap what we forward so the UI thread is never flooded.
                                    let now = Instant::now();
                                    if now.duration_since(last_time_push) < Duration::from_millis(100) {
                                        continue;
                                    }
                                    last_time_push = now;

                                    let time = unsafe { *(prop.data as *mut f64) };
                                    let duration =
                                        mpv.get_double("duration").unwrap_or(0.0);
                                    let buffered =
                                        mpv.get_double("demuxer-cache-time").unwrap_or(0.0);
                                    check_loop(loop_engine.as_ref(), time);
                                    let _ = loop_app.emit(
                                        EVENT,
                                        json!({
                                            "type": "time",
                                            "time": time,
                                            "duration": duration,
                                            "buffered": buffered
                                        }),
                                    );
                                }
                                (OBS_PAUSE, _) => {
                                    let is_paused = loop_engine.handle.get_flag("pause").unwrap_or(false);
                                    let is_eof = loop_engine.handle.get_flag("eof-reached").unwrap_or(false);
                                    let is_repeat = *loop_engine.repeat.lock().unwrap();
                                    if is_paused && is_eof && is_repeat {
                                        crate::log::line("pause at EOF with repeat=true: restarting playback");
                                        loop_engine.handle.command("seek 0 absolute+exact");
                                        loop_engine.handle.set_property("pause", "no");
                                    }
                                    emit_state(&loop_app, &loop_engine);
                                }
                                // Observed as MPV_FORMAT_NONE, so the payload is
                                // unused and prop.format is always NONE here.
                                (OBS_CHAPTER, _) => {
                                    emit_chapters(&loop_app, &loop_engine);
                                }
                                (OBS_EOF, _) => {
                                    let eof = loop_engine.handle.get_flag("eof-reached").unwrap_or(false);
                                    if eof {
                                        let is_repeat = *loop_engine.repeat.lock().unwrap();
                                        crate::log::line(&format!("OBS_EOF: eof=true, repeat={is_repeat}"));
                                        if is_repeat {
                                            loop_engine.handle.command("seek 0 absolute+exact");
                                            loop_engine.handle.set_property("pause", "no");
                                        }
                                        let _ = loop_app.emit(EVENT, json!({ "type": "ended" }));
                                    }
                                }
                                _ => {}
                            }
                        }
                        MPV_EVENT_LOG_MESSAGE => {
                            if event.data.is_null() {
                                continue;
                            }
                            let msg = unsafe { &*(event.data as *mut MpvEventLogMessage) };
                            let text = if msg.text.is_null() {
                                String::new()
                            } else {
                                unsafe { CStr::from_ptr(msg.text).to_string_lossy().into_owned() }
                            };
                            let level = if msg.level.is_null() {
                                String::new()
                            } else {
                                unsafe { CStr::from_ptr(msg.level).to_string_lossy().into_owned() }
                            };
                            let _ = loop_app.emit(
                                EVENT,
                                json!({ "type": "log", "message": text, "level": level }),
                            );
                            crate::log::line(&format!("mpv[{level}] {text}"));
                        }
                        MPV_EVENT_FILE_LOADED => {
                            crate::log::line("mpv: FILE_LOADED");
                            let repeat = *loop_engine.repeat.lock().unwrap();
                            let val = if repeat { "inf" } else { "no" };
                            loop_engine.handle.set_property("loop-file", val);
                            loop_engine.handle.set_property("loop", val);
                            emit_state(&loop_app, &loop_engine);
                            emit_tracks(&loop_app, &loop_engine);
                            emit_chapters(&loop_app, &loop_engine);
                            emit_media_info(&loop_app, &loop_engine);
                        }
                        MPV_EVENT_TRACKS_CHANGED => {
                            emit_tracks(&loop_app, &loop_engine);
                            emit_chapters(&loop_app, &loop_engine);
                            emit_media_info(&loop_app, &loop_engine);
                        }
                        MPV_EVENT_PAUSE => {
                            emit_state(&loop_app, &loop_engine);
                        }
                        MPV_EVENT_END_FILE => {
                            let _ = loop_app.emit(EVENT, json!({ "type": "ended" }));
                        }
                        MPV_EVENT_IDLE => {
                            let _ = loop_app.emit(
                                EVENT,
                                json!({ "type": "state", "playing": false }),
                            );
                        }
                        _ => {}
                    }
                }
            }
        });

        Ok(engine)
    }

    pub fn set_video_hwnd(&self, hwnd: isize) {
        *self.video_hwnd.lock().unwrap() = hwnd;
        if hwnd != 0 {
            self.handle.set_property("wid", &hwnd.to_string());
        }
    }

    pub fn open(&self, path: &str) {
        let escaped = path.replace('\\', "\\\\").replace('"', "\\\"");
        self.handle.command(&format!("loadfile \"{escaped}\" replace"));
        let repeat = *self.repeat.lock().unwrap();
        let val = if repeat { "inf" } else { "no" };
        self.handle.set_property("loop-file", val);
        self.handle.set_property("loop", val);
        let _ = self.loop_points.lock().map(|mut l| *l = (None, None));
    }

    pub fn open_stream(&self, video: &str, audio: Option<&str>) {
        let v = video.replace('\\', "\\\\").replace('"', "\\\"");
        match audio {
            Some(a) => {
                let a = a.replace('\\', "\\\\").replace('"', "\\\"");
                self.handle
                    .command(&format!("loadfile \"{v}\" replace audio-file=\"{a}\""));
            }
            None => self.handle.command(&format!("loadfile \"{v}\" replace")),
        }
        let repeat = *self.repeat.lock().unwrap();
        let val = if repeat { "inf" } else { "no" };
        self.handle.set_property("loop-file", val);
        self.handle.set_property("loop", val);
        let _ = self.loop_points.lock().map(|mut l| *l = (None, None));
    }

    pub fn play(&self) {
        if self.handle.get_flag("eof-reached").unwrap_or(false) {
            self.handle.command("seek 0 absolute+exact");
        }
        self.handle.set_property("pause", "no");
    }

    pub fn toggle_play(&self) {
        if self.handle.get_flag("eof-reached").unwrap_or(false) {
            self.handle.command("seek 0 absolute+exact");
            self.handle.set_property("pause", "no");
        } else {
            self.handle.command("cycle pause");
        }
    }

    pub fn set_repeat(&self, repeat: bool) {
        *self.repeat.lock().unwrap() = repeat;
        let val = if repeat { "inf" } else { "no" };
        self.handle.set_property("loop-file", val);
        self.handle.set_property("loop", val);
        crate::log::line(&format!("set_repeat: repeat={repeat} (loop-file={val})"));
        if repeat && self.handle.get_flag("eof-reached").unwrap_or(false) {
            crate::log::line("set_repeat: at EOF, seeking to 0 and playing");
            self.handle.command("seek 0 absolute+exact");
            self.handle.set_property("pause", "no");
        }
    }

    pub fn close(&self) {
        self.handle.command("stop");
        let _ = self.loop_points.lock().map(|mut l| *l = (None, None));
    }

    pub fn command(&self, cmd: &str) {
        self.handle.command(cmd);
    }

    pub fn set_property(&self, name: &str, value: &str) {
        self.handle.set_property(name, value);
    }

    pub fn set_loop(&self, a: Option<f64>, b: Option<f64>) {
        *self.loop_points.lock().unwrap() = (a, b);
        if a.is_none() && b.is_none() {
            self.handle.set_property("loop", "no");
            self.handle.set_property("ab-loop-a", "no");
            self.handle.set_property("ab-loop-b", "no");
        }
    }

    pub fn eq_params(&self, p: &str, value: f64) {
        let v = clamp(value, -100.0, 100.0) / 100.0;
        self.handle.set_property(p, &format!("{v:.4}"));
    }
}

fn emit_state(app: &AppHandle, engine: &MpvEngine) {
    let mpv = &engine.handle;
    let playing = !mpv.get_flag("pause").unwrap_or(false);
    let buffering = mpv.get_flag("paused-for-cache").unwrap_or(false);
    let _ = app.emit(
        EVENT,
        json!({ "type": "state", "playing": playing, "buffering": buffering }),
    );
}

fn check_loop(engine: &MpvEngine, time: f64) {
    let (a, b) = *engine.loop_points.lock().unwrap();
    if let (Some(a), Some(b)) = (a, b) {
        if b > a && time >= b {
            engine.command(&format!("seek {} absolute exact", a));
        }
    }
}

fn emit_tracks(app: &AppHandle, engine: &MpvEngine) {
    let mpv = &engine.handle;

    let (audio, subs, videos) = collect_tracks(mpv);

    let audio_id = audio.iter().find(|t| t.selected).map(|t| t.id);
    let sub_id = subs.iter().find(|t| t.selected).map(|t| t.id);

    let _ = app.emit(
        EVENT,
        json!({
            "type": "tracks",
            "tracks": { "audio": audio, "subs": subs, "videos": videos },
            "audioId": audio_id,
            "subId": sub_id
        }),
    );
}

fn emit_chapters(app: &AppHandle, engine: &MpvEngine) {
    let mpv = &engine.handle;
    let _ = app.emit(
        EVENT,
        json!({ "type": "chapters", "chapters": collect_chapters(mpv) }),
    );
}

fn collect_tracks(mpv: &MpvHandle) -> (Vec<Track>, Vec<Track>, Vec<Track>) {
    let mut audio: Vec<Track> = Vec::new();
    let mut subs: Vec<Track> = Vec::new();
    let mut videos: Vec<Track> = Vec::new();

    let node = match mpv.get_node("track-list") {
        Some(n) => n,
        None => return (audio, subs, videos),
    };

    if let Some(list) = MpvHandle::node_list(unsafe { &*node }) {
        for entry in unsafe { std::slice::from_raw_parts(list.values, list.num as usize) } {
            let map = match MpvHandle::node_map(entry) {
                Some(m) => m,
                None => continue,
            };
            let id = map_lookup(map, "id").map(MpvHandle::node_int64).unwrap_or(0);
            let kind = map_lookup(map, "type").map(node_string).unwrap_or_default();
            let title = map_lookup(map, "title").map(node_string).unwrap_or_default();
            let lang = map_lookup(map, "lang").map(node_string).filter(|s| !s.is_empty());
            let codec = map_lookup(map, "codec").map(node_string).filter(|s| !s.is_empty());
            let selected = map_lookup(map, "selected").map(MpvHandle::node_flag).unwrap_or(0) != 0;

            let track = Track {
                id,
                kind: match kind.as_str() {
                    "audio" => "audio",
                    "sub" => "sub",
                    _ => "video",
                },
                title: if title.is_empty() {
                    format!("{} {}", kind, id)
                } else {
                    title
                },
                lang,
                codec,
                selected,
            };
            match kind.as_str() {
                "audio" => audio.push(track),
                "sub" => subs.push(track),
                _ => videos.push(track),
            }
        }
    }

    mpv.free_node(node);
    (audio, subs, videos)
}

fn collect_chapters(mpv: &MpvHandle) -> Vec<Chapter> {
    let mut chapters: Vec<Chapter> = Vec::new();
    let node = match mpv.get_node("chapter-list") {
        Some(n) => n,
        None => return chapters,
    };
    if let Some(list) = MpvHandle::node_list(unsafe { &*node }) {
        for entry in unsafe { std::slice::from_raw_parts(list.values, list.num as usize) } {
            let map = match MpvHandle::node_map(entry) {
                Some(m) => m,
                None => continue,
            };
            let title = map_lookup(map, "title").map(node_string).unwrap_or_default();
            let time = map_lookup(map, "time").map(MpvHandle::node_double).unwrap_or(0.0);
            chapters.push(Chapter { title, time });
        }
    }
    mpv.free_node(node);
    chapters
}

fn channel_label(count: u64) -> String {
    match count {
        0 => "—".to_string(),
        1 => "mono".to_string(),
        2 => "stereo".to_string(),
        6 => "5.1".to_string(),
        8 => "7.1".to_string(),
        n => format!("{n} channels"),
    }
}

fn hdr_label(transfer: &str, primaries: &str) -> String {
    if transfer.contains("bt2020-10") || transfer.contains("smpte2084") {
        "HDR10 (PQ)".to_string()
    } else if transfer.contains("arib-std-b67") || transfer.contains("b67") {
        "HDR10 (HLG)".to_string()
    } else if primaries.contains("bt2020") {
        "BT.2020".to_string()
    } else if primaries.contains("p3") {
        "Display P3".to_string()
    } else if primaries.contains("bt709") || primaries.is_empty() {
        String::new()
    } else {
        primaries.to_string()
    }
}

fn emit_media_info(app: &AppHandle, engine: &MpvEngine) {
    let mpv = &engine.handle;

    let path = mpv.get_string("path").unwrap_or_default();
    let container = mpv.get_string("file-format").unwrap_or_default();
    let duration = mpv.get_double("duration").unwrap_or(0.0);
    let width = mpv.get_double("video-params/w").unwrap_or(0.0);
    let height = mpv.get_double("video-params/h").unwrap_or(0.0);
    let fps = mpv.get_double("container-fps").unwrap_or(0.0);
    let video_codec = mpv.get_string("video-codec").unwrap_or_default();
    let audio_codec = mpv.get_string("audio-codec").unwrap_or_default();
    let channels = mpv.get_double("audio-params/channels").unwrap_or(0.0) as u64;
    let video_bitrate = mpv.get_double("video-bitrate").unwrap_or(0.0);
    let audio_bitrate = mpv.get_double("audio-bitrate").unwrap_or(0.0);
    let transfer = mpv.get_string("video-params/transfer").unwrap_or_default();
    let primaries = mpv.get_string("video-params/primaries").unwrap_or_default();

    let (_audio, subs, _videos) = collect_tracks(mpv);
    let subtitle_count = subs.len();

    let title = path
        .rsplit(['\\', '/'])
        .next()
        .filter(|s| !s.is_empty())
        .unwrap_or(&path)
        .to_string();

    let _ = app.emit(
        EVENT,
        json!({
            "type": "info",
            "info": {
                "path": path,
                "title": title,
                "container": container,
                "duration": duration,
                "width": width,
                "height": height,
                "fps": fps,
                "videoCodec": video_codec,
                "audioCodec": audio_codec,
                "audioChannels": channel_label(channels),
                "bitrate": (video_bitrate + audio_bitrate) as i64,
                "subtitleCount": subtitle_count,
                "hdr": hdr_label(&transfer, &primaries),
            }
        }),
    );
}

fn clamp(v: f64, min: f64, max: f64) -> f64 {
    v.max(min).min(max)
}