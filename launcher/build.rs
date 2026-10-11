use std::path::Path;
use std::time::SystemTime;

fn modified(p: &str) -> Option<SystemTime> {
    std::fs::metadata(p).ok().and_then(|m| m.modified().ok())
}

/// The payload is compressed at build time by `node scripts/pack-payload.mjs`.
/// If the app was recompiled after that, the launcher would embed a stale
/// binary and ship yesterday's build. Fail loudly instead.
fn check_payload_freshness() {
    let app = "../src-tauri/target/release/ankylo.exe";
    let packed = "../src-tauri/payload/ankylo.exe.gz";

    let (Some(app_t), Some(packed_t)) = (modified(app), modified(packed)) else {
        println!(
            "cargo:warning=payload freshness could not be checked; run `node scripts/pack-payload.mjs`"
        );
        return;
    };

    if app_t > packed_t {
        panic!(
            "\nSTALE PAYLOAD\n  {} is newer than {}.\n  \
             The launcher would ship an old copy of the app.\n\n  \
             Fix:  node scripts/pack-payload.mjs   (or just run scripts/build-all.ps1)\n",
            Path::new(app).display(),
            Path::new(packed).display()
        );
    }
}

fn main() {
    println!("cargo:rerun-if-changed=../src-tauri/icons/icon.ico");
    // Re-run this script when the app binary changes, so the freshness check
    // below is actually re-evaluated instead of being cached by cargo.
    println!("cargo:rerun-if-changed=../src-tauri/target/release/ankylo.exe");
    println!("cargo:rerun-if-changed=../src-tauri/payload/ankylo.exe.gz");
    println!("cargo:rerun-if-changed=../src-tauri/payload/libmpv-2.dll.gz");
    println!("cargo:rerun-if-changed=../src-tauri/payload/yt-dlp.exe.gz");

    check_payload_freshness();

    #[cfg(windows)]
    {
        let mut res = winres::WindowsResource::new();
        res.set_icon("../src-tauri/icons/icon.ico");
        res.set("FileDescription", "Ankylo - Universal Video Player");
        res.set("ProductName", "Ankylo");
        res.set("CompanyName", "Ankylo");
        res.set("FileVersion", "0.1.0");
        res.set("ProductVersion", "0.1.0");
        if let Err(e) = res.compile() {
            println!("cargo:warning=icon embedding failed: {e}");
        }
    }
}