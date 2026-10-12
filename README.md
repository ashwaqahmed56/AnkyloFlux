# Ankylo

**A video player that opens everything.**

If VLC, MPV or Windows Media Player can play it, Ankylo can play it — MKV, AVI, FLV, TS, HEVC, AV1,
ProRes, FLAC, DTS, and thousands more. No codec packs, no conversion, no mystery errors.

It also plays **website links** (YouTube and friends) and can **save** what it plays.

---

## Part 1 — Using Ankylo

### Opening it

Double-click **`Ankylo.exe`**. That's it. One file, no installer.

The first launch takes a few seconds longer: Ankylo unpacks its playback engine into
`%LOCALAPPDATA%\Ankylo` on your machine. Every launch after that is instant. To move Ankylo to another
PC, copy the single `.exe` file — the other computer does the same thing on first run.

### Opening something to watch

| You want to | Do this |
|---|---|
| Watch a video | Click **Open file**, or drag the file onto the window |
| Watch a folder | Drag the folder onto the window — it queues everything inside |
| Watch a website link | Click **URL**, paste the link, press Enter |
| Reopen something recent | Click it in the **Recent** list |
| Right-click options | Right-click the video |

Files you open can also be queued: select several at once, and they play one after another.

### The controls

Hover over the video and the control bar slides up from the bottom. It hides after a few seconds of
stillness so nothing covers the picture. Move the mouse and it's back.

- **Click** the video to play or pause
- **Double-click** for fullscreen
- **Scroll wheel** for volume, **Shift + wheel** to seek
- **Right-click** for a full menu of everything

### Keyboard shortcuts

These are the defaults — every one of them can be changed in **Settings → Keyboard shortcuts**.

| Key | Does this | Key | Does this |
|---|---|---|---|
| `Space` | Play / pause | `F` | Fullscreen |
| `←` `→` | Back / forward 10s | `M` | Mute |
| `Shift` + `←` `→` | Back / forward 60s | `↑` `↓` | Volume |
| `,` `.` | Step one frame back / forward | `A` | Switch audio track |
| `Ctrl` + `↑` `↓` | Playback speed | `J` | Switch subtitle track |
| `Ctrl` + `Ctrl+Backspace` | Reset speed to 1× | `Ctrl` + `J` | Subtitle delay |
| `Ctrl` + `S` | Save a screenshot (PNG) | `R` | Repeat the video |
| `Ctrl` + `P` | Picture-in-picture | `T` | Aspect ratio |
| `Ctrl` + `K` | **Command palette** | `D` | Deinterlace |
| `L` | Playlist | `Ctrl` + `R` | Mirror |
| `I` | Media info (codec, fps, audio) | `Ctrl` + `Shift` + `R` | Rotate 90° |
| `Ctrl` + `E` | Video adjustments | `Ctrl` + `Shift` + `M` | Mini player |
| `Ctrl` + `Shift` + `S` | Download the current stream | `Esc` | Close / go back |

### Command palette — `Ctrl+K`

One search box for everything: "blur all colors", "slow motion", "skip 5 minutes". Start typing and
pick from the list.

### Playing a website link

Paste a YouTube (or similar) link into **URL**. Ankylo fetches the real video and audio streams and
plays them like a normal file — you don't wait for a download first, and the link plays at whatever
speed you like.

### Downloading

When a link is playing, click **Download** (or `Ctrl+Shift+S`). Progress and speed show at the top and
the finished file lands in your **Videos** folder.

### Settings worth knowing

- **Theme** — dark or light, and four accent colours
- **Hardware decoding** — leave on *Auto* unless video stutters, then try turning it off
- **Subtitles** — font size, position, colour and delay
- **Adjustments** (`Ctrl+E`) — brightness, contrast, saturation, gamma, hue, sharpness

---

## Part 2 — If something goes wrong

**"This file won't play"**
Browsers can only play MP4/WebM, but **the `.exe` plays everything**. If you tried the file in browser
mode and it refused, that's expected — use `Ankylo.exe`.

**No sound**
Check the volume isn't muted (`M` toggles it) and Windows isn't routing audio somewhere unexpected
(right-click the speaker icon → Sound settings).

**Video is black but audio plays**
Try **Adjustments** (`Ctrl+E`) → **Display** → turn mirror and rotation off, or press `Ctrl+0` to reset
zoom.

**Controls don't respond when hovering over the picture**
Ankylo sizes its video layer to avoid the controls. If the window is very small, or a side panel is
open, try maximising the window.

**Something looks stale after an update**
Delete `%LOCALAPPDATA%\Ankylo` and run the `.exe` again. It rebuilds itself.

**Where are the logs?**
`%LOCALAPPDATA%\Ankylo\ankylo.log` — plain text, useful if you're reporting a bug.

---

## Part 3 — Building it yourself

Only needed if you want to change the code. Requires [Rust](https://rustup.rs) and Visual Studio Build
Tools ("Desktop development with C++").

```powershell
npm install
powershell -ExecutionPolicy Bypass -File scripts\build-all.ps1
```

That produces **`build\Ankylo.exe`** — the same single file you'd hand to a friend. The script handles
everything in order and checks for two easy-to-miss mistakes (a binary built in dev mode, and a stale
packaged copy).

### How it fits together

Ankylo is a small desktop shell with a web UI, and all the real work is done by **mpv**, which wraps
FFmpeg — that's what gives it every format.

```
Ankylo.exe  →  unpacks itself  →  Ankylo UI (Tauri + React)
                                  + playback engine (mpv/libmpv)
                                  + link resolver (yt-dlp)
```

| Folder | What's in it |
|---|---|
| `src/` | The interface |
| `src-tauri/` | The desktop shell and the mpv bindings |
| `launcher/` | The single-file self-extracting wrapper |
| `scripts/` | Build and asset-fetching helpers |
| `build/` | The finished `.exe` |

The UI talks to playback through one interface (`src/engine/types.ts`), with two implementations: the
real one for the desktop app, and a browser-based one so the interface can be developed and tested with
`npm run dev`.

---

## Format notes

**Video:** H.264, H.265/HEVC, AV1, VP8/9, MPEG-2, MPEG-4, DivX, Xvid, ProRes, DNxHD, VVC, MJPEG
**Audio:** AAC, MP3, FLAC, Opus, AC-3, E-AC-3, DTS, Vorbis, ALAC, PCM, WavPack
**Subtitles:** SRT, ASS/SSA, VTT, PGS, IDX/SUB
**Containers:** MP4, MKV, AVI, MOV, WebM, FLV, MPEG-TS, OGG, VOB, WMV, 3GP, M2TS, RM and more
**Streams:** HLS (`.m3u8`), DASH (`.mpd`), RTSP, RTMP, HTTP

Anything **mpv** can open, Ankylo opens.

---

## Licence

Ankylo itself is yours to use however you like. mpv and FFmpeg are the components doing the decoding,
and they are used unmodified as separate programs — not compiled into Ankylo.