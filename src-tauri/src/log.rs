use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;

fn log_path() -> Option<PathBuf> {
    let base = std::env::var("LOCALAPPDATA").ok()?;
    let dir = PathBuf::from(base).join("Ankylo");
    std::fs::create_dir_all(&dir).ok()?;
    Some(dir.join("ankylo.log"))
}

pub fn line(msg: &str) {
    let path = match log_path() {
        Some(p) => p,
        None => return,
    };
    if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(path) {
        let stamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        let _ = writeln!(f, "[{stamp}] {msg}");
    }
}

pub fn rect(x: i32, y: i32, w: i32, h: i32) {
    line(&format!("video_rect x={x} y={y} w={w} h={h}"));
}