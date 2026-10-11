use serde::Serialize;
use std::fs::File;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

pub const DOWNLOAD_EVENT: &str = "download-progress";

#[derive(Clone, Serialize)]
pub struct Progress {
    pub kind: &'static str,
    pub name: String,
    pub received: u64,
    pub total: u64,
    pub percent: f64,
    pub speed_bps: f64,
    pub done: bool,
    pub error: Option<String>,
    pub path: Option<String>,
}

fn resolve(base: &str, rel: &str) -> String {
    if rel.starts_with("http://") || rel.starts_with("https://") {
        return rel.to_string();
    }
    if let Some(idx) = base.find("://") {
        let after_scheme = &base[idx + 3..];
        let host_end = after_scheme.find('/').map(|i| idx + 3 + i).unwrap_or(base.len());
        let origin = &base[..host_end];
        if rel.starts_with('/') {
            return format!("{origin}{rel}");
        }
        let dir_end = base.rfind('/').unwrap_or(host_end);
        return format!("{}/{rel}", &base[..dir_end]);
    }
    rel.to_string()
}

fn is_playlist(url: &str) -> bool {
    let lower = url.to_ascii_lowercase();
    lower.contains(".m3u8") || lower.contains(".m3u")
}

fn fetch_text(url: &str) -> Result<String, String> {
    let resp = ureq::get(url)
        .set("User-Agent", "Ankylo/0.1")
        .timeout(Duration::from_secs(30))
        .call()
        .map_err(|e| e.to_string())?;
    resp.into_string().map_err(|e| e.to_string())
}

/// Returns the segment list for a media playlist, or the best variant URL for a master playlist.
fn parse_playlist(body: &str) -> (bool, Vec<String>, Option<String>) {
    let mut segments = Vec::new();
    let mut variants: Vec<(u64, String)> = Vec::new();
    let mut pending_bandwidth: Option<u64> = None;
    let mut master = false;

    for line in body.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        if let Some(rest) = line.strip_prefix("#EXT-X-STREAM-INF:") {
            master = true;
            for attr in rest.split(',') {
                if let Some(bw) = attr.trim().strip_prefix("BANDWIDTH=") {
                    pending_bandwidth = bw.parse::<u64>().ok();
                }
            }
        } else if line.starts_with('#') {
            continue;
        } else if pending_bandwidth.is_some() {
            variants.push((pending_bandwidth.take().unwrap_or(0), line.to_string()));
        } else {
            segments.push(line.to_string());
        }
    }

    let best = variants
        .into_iter()
        .max_by_key(|(bw, _)| *bw)
        .map(|(_, uri)| uri);

    (master, segments, best)
}

fn segment_extension(segments: &[String]) -> &'static str {
    let any_mp4 = segments
        .iter()
        .filter(|s| !s.contains('?'))
        .any(|s| s.ends_with(".m4s") || s.ends_with(".mp4"));
    if any_mp4 {
        "mp4"
    } else {
        "ts"
    }
}

fn unique_path(dir: &Path, stem: &str, ext: &str) -> PathBuf {
    let mut candidate = dir.join(format!("{stem}.{ext}"));
    let mut n = 1;
    while candidate.exists() {
        candidate = dir.join(format!("{stem} ({n}).{ext}"));
        n += 1;
        if n > 999 {
            break;
        }
    }
    candidate
}

fn stem_from_url(url: &str) -> String {
    let path = url.split('?').next().unwrap_or(url);
    let name = path.rsplit('/').next().unwrap_or("download");
    let clean: String = name
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect();
    if clean.is_empty() {
        "ankylo-download".to_string()
    } else {
        clean
    }
}

pub fn download(
    app: &AppHandle,
    url: &str,
    dest_dir: PathBuf,
    cancel: Arc<AtomicBool>,
) -> Result<String, String> {
    let stem = stem_from_url(url);
    let mut total: u64 = 0;
    let mut received: u64 = 0;
    let started = Instant::now();

    let emit = |app: &AppHandle,
                name: &str,
                received: u64,
                total: u64,
                done: bool,
                error: Option<String>,
                path: Option<String>| {
        let elapsed = started.elapsed().as_secs_f64().max(0.001);
        let _ = app.emit(
            DOWNLOAD_EVENT,
            Progress {
                kind: "download",
                name: name.to_string(),
                received,
                total,
                percent: if total > 0 {
                    (received as f64 / total as f64 * 100.0).min(100.0)
                } else {
                    0.0
                },
                speed_bps: received as f64 / elapsed,
                done,
                error,
                path,
            },
        );
    };

    let out_path: PathBuf;
    let mut file: File;

    if is_playlist(url) {
        let body = fetch_text(url)?;
        let (master, segments, variant) = parse_playlist(&body);

        if master {
            let variant = variant.ok_or_else(|| "no playable variant in playlist".to_string())?;
            return download(app, &resolve(url, &variant), dest_dir, cancel);
        }

        if segments.is_empty() {
            return Err("playlist contains no segments".to_string());
        }

        for seg in &segments {
            let part = fetch_text(&resolve(url, seg))?;
            let (_m, nested, _) = parse_playlist(&part);
            if !nested.is_empty() {
                return Err("nested playlists are not supported".to_string());
            }
        }

        let ext = segment_extension(&segments);
        out_path = unique_path(&dest_dir, &stem, ext);
        file = File::create(&out_path).map_err(|e| e.to_string())?;

        emit(app, &stem, 0, segments.len() as u64, false, None, None);

        for (i, seg) in segments.iter().enumerate() {
            if cancel.load(Ordering::Relaxed) {
                return Err("cancelled".to_string());
            }
            let abs = resolve(url, seg);
            let resp = ureq::get(&abs)
                .set("User-Agent", "Ankylo/0.1")
                .timeout(Duration::from_secs(60))
                .call()
                .map_err(|e| e.to_string())?;
            let mut reader = resp.into_reader();
            let mut buf = vec![0u8; 64 * 1024];
            loop {
                if cancel.load(Ordering::Relaxed) {
                    return Err("cancelled".to_string());
                }
                let n = reader.read(&mut buf).map_err(|e| e.to_string())?;
                if n == 0 {
                    break;
                }
                file.write_all(&buf[..n]).map_err(|e| e.to_string())?;
                received += n as u64;
            }
            emit(
                app,
                &stem,
                i as u64 + 1,
                segments.len() as u64,
                false,
                None,
                None,
            );
        }
        file.flush().map_err(|e| e.to_string())?;
    } else {
        let resp = ureq::get(url)
            .set("User-Agent", "Ankylo/0.1")
            .timeout(Duration::from_secs(60))
            .call()
            .map_err(|e| e.to_string())?;

        total = resp
            .header("content-length")
            .and_then(|v| v.parse::<u64>().ok())
            .unwrap_or(0);

        let ext = url
            .split('?')
            .next()
            .unwrap_or(url)
            .rsplit('.')
            .next()
            .filter(|e| e.len() <= 4 && e.chars().all(|c| c.is_ascii_alphanumeric()))
            .map(|e| e.to_ascii_lowercase())
            .unwrap_or_else(|| "mp4".to_string());

        out_path = unique_path(&dest_dir, &stem, &ext);
        file = File::create(&out_path).map_err(|e| e.to_string())?;

        let mut reader = resp.into_reader();
        let mut buf = vec![0u8; 128 * 1024];
        let mut last_emit = Instant::now();

        loop {
            if cancel.load(Ordering::Relaxed) {
                return Err("cancelled".to_string());
            }
            let n = reader.read(&mut buf).map_err(|e| e.to_string())?;
            if n == 0 {
                break;
            }
            file.write_all(&buf[..n]).map_err(|e| e.to_string())?;
            received += n as u64;
            if last_emit.elapsed() > Duration::from_millis(200) {
                emit(app, &stem, received, total, false, None, None);
                last_emit = Instant::now();
            }
        }
        file.flush().map_err(|e| e.to_string())?;
    }

    let path = out_path.to_string_lossy().to_string();
    emit(app, &stem, received.max(1), total.max(received), true, None, Some(path.clone()));
    Ok(path)
}