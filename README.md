<div align="center">
  <img src="src-tauri/icons/128x128.png" alt="Ankylo logo" width="104" />
  <h1>Ankylo</h1>
  <p><strong>A video player that opens everything.</strong></p>
  <p>If VLC, MPV or Windows Media Player can play it — Ankylo plays it.</p>
</div>

<div align="center">

![Rust](https://img.shields.io/badge/Rust-1.99-DEA171?style=flat-square)
![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38BDF8?style=flat-square)
![mpv](https://img.shields.io/badge/mpv%20%2B%20FFmpeg-007808?style=flat-square)
![Windows](https://img.shields.io/badge/Windows-10%20%2F%2011-0078D4?style=flat-square)
![Format support](https://img.shields.io/badge/formats-MKV%20%2F%20AVI%20%2F%20MP4%20%2F%20HEVC%20%2F%20AV1-brightgreen?style=flat-square)

</div>

---

<div align="center">

## 🎬 MKV &nbsp;•&nbsp; AVI &nbsp;•&nbsp; MP4 &nbsp;•&nbsp; HEVC &nbsp;•&nbsp; AV1 &nbsp;•&nbsp; FLV &nbsp;•&nbsp; TS &nbsp;•&nbsp; YouTube

**One file. No installer. No codec packs.**

</div>

---

## 📑 Contents

- [✨ Features](#features)
- [🚀 Quick start](#quick-start)
- [🎮 Using Ankylo](#using-ankylo)
- [⌨️ Keyboard shortcuts](#keyboard-shortcuts)
- [🩺 Troubleshooting](#troubleshooting)
- [🏗️ Build from source](#build-from-source)
- [🧰 Tech stack](#tech-stack)
- [📦 Format support](#format-support)
- [🧾 Licence](#licence)

---

<a id="features"></a>

## ✨ Features

| | Feature | What it does |
|:-:|---|---|
| 🎞️ | **Every format** | MKV, AVI, FLV, TS, VOB, HEVC, AV1, ProRes, FLAC, DTS… if mpv can open it, so can Ankylo |
| 🔗 | **Website links** | Paste a YouTube (or similar) link and it plays like a normal file — no waiting for a download |
| ⬇️ | **Download** | Save what you're watching straight to your Videos folder, with progress and speed |
| ⏩ | **Fine speed control** | 0.1× to 8×, with presets and frame-by-frame stepping for the fussy |
| 🔁 | **Repeat** | Loop the whole video, or queue a folder and let it run |
| 🎧 | **Audio control** | Switch tracks, adjust delay and balance, normalise loudness |
| 💬 | **Subtitles** | Built-in and external (SRT/ASS/VTT), with delay, size, colour and position |
| 🎨 | **Video adjustments** | Brightness, contrast, saturation, gamma, hue and sharpness |
| 🖼️ | **Display control** | Aspect ratio, zoom, rotate, mirror, deinterlace, HDR → SDR tone mapping |
| ⌨️ | **Keyboard-first** | Every action has a shortcut, and every shortcut is remappable |
| ⚡ | **Command palette** | `Ctrl+K` — one search box for the entire app |
| 📚 | **Playlist** | Drag to reorder, drop folders in, jump to recent files |
| 🪟 | **Mini player & PiP** | Shrink it to a corner or float it over other apps |
| 📸 | **Snapshots** | Save any frame as a PNG |
| ℹ️ | **Media info** | Codec, resolution, FPS, bitrate, channels — at a glance |
| 🎨 | **Themes** | Dark or light, with four accent colours, saved between sessions |

---

<a id="quick-start"></a>

## 🚀 Quick start

### ▶️ Just use it

1. Download **`Ankylo.exe`**
2. Double-click it
3. Drag a video onto the window

That's the whole install. First launch takes a few seconds longer while Ankylo unpacks its playback
engine into `%LOCALAPPDATA%\Ankylo` — every launch after that is instant.

### 🧪 Try it in your browser

```bash
npm install
npm run dev
```

Opens at `http://localhost:1488`. Good for working on the interface; browsers can only decode MP4 and
WebM, so use the `.exe` for everything else.

---

<a id="using-ankylo"></a>

## 🎮 Using Ankylo

### Opening something to watch

| You want to | Do this |
|---|---|
| Watch a video | Click **Open file**, or drag the file onto the window |
| Watch a folder | Drag the folder in — it queues everything inside |
| Watch a website link | Click **URL**, paste the link, press Enter |
| Reopen something recent | Click it in the **Recent** list |
| Right-click options | Right-click anywhere on the video |

### The controls

Hover over the video and the control bar slides up; it fades away after a few seconds of stillness so
nothing covers the picture. Move the mouse and it's back.

- **Click** — play / pause
- **Double-click** — fullscreen
- **Scroll wheel** — volume · **Shift + scroll** — seek
- **Right-click** — full menu

---

<a id="keyboard-shortcuts"></a>

## ⌨️ Keyboard shortcuts

Defaults — all remappable under **Settings → Keyboard shortcuts**.

| Key | Action | Key | Action |
|---|---|---|---|
| `Space` | Play / pause | `F` | Fullscreen |
| `←` `→` | Seek ∓10s | `M` | Mute |
| `Shift` + `←` `→` | Seek ∓60s | `↑` `↓` | Volume |
| `,` `.` | Step one frame back / forward | `A` | Next audio track |
| `Ctrl` + `↑` `↓` | Playback speed | `J` | Next subtitle track |
| `Ctrl` + `Ctrl+Backspace` | Reset speed to 1× | `Ctrl` + `J` | Subtitle delay |
| `Ctrl` + `=` `-` / `Ctrl+0` | Zoom in / out / reset | `R` | Repeat |
| `Ctrl` + `S` | Save a screenshot | `T` | Aspect ratio |
| `Ctrl` + `P` | Picture-in-picture | `D` | Deinterlace |
| `Ctrl` + `K` | Command palette | `Ctrl` + `R` | Mirror |
| `L` | Playlist | `Ctrl` + `Shift` + `R` | Rotate 90° |
| `I` | Media info | `Ctrl` + `Shift` + `M` | Mini player |
| `Ctrl` + `E` | Video adjustments | `Ctrl` + `Shift` + `S` | Download current stream |
| `Ctrl` + `,` | Settings | `Esc` | Close / go back |

---

<a id="troubleshooting"></a>

## 🩺 Troubleshooting

<details>
<summary><b>"This file won't play"</b></summary>

Browsers can only play MP4 and WebM. If a file was refused in browser mode that's expected — use
**`Ankylo.exe`**, which plays everything.
</details>

<details>
<summary><b>No sound</b></summary>

Check the volume isn't muted (`M` toggles it), and that Windows isn't routing audio somewhere odd —
right-click the speaker icon → **Sound settings**.
</details>

<details>
<summary><b>Black screen but audio plays</b></summary>

Try `Ctrl+0` to reset zoom, then turn off mirror/rotation under **Adjustments → Display**.
</details>

<details>
<summary><b>Controls don't respond over the video</b></summary>

Ankylo sizes its video layer to avoid the controls. Very small windows, or an open side panel, can
leave it too tight — try maximising.
</details>

<details>
<summary><b>Looks stale after an update</b></summary>

Delete `%LOCALAPPDATA%\Ankylo` and run the `.exe` again; it rebuilds itself.
</details>

<details>
<summary><b>Where are the logs?</b></summary>

`%LOCALAPPDATA%\Ankylo\ankylo.log` — plain text, useful when reporting a bug.
</details>

---

<a id="build-from-source"></a>

## 🏗️ Build from source

Needs [Rust](https://rustup.rs) and Visual Studio Build Tools with the **Desktop development with C++**
workload.

```powershell
npm install
powershell -ExecutionPolicy Bypass -File scripts\build-all.ps1
```

Output lands in **`build\Ankylo.exe`** — the same single file. The script also guards against two
easy-to-miss mistakes: a binary accidentally built in dev mode, and shipping a stale packaged copy.

<details>
<summary><b>How it fits together</b></summary>

Ankylo is a lightweight desktop shell with a web interface. All the real decoding is done by **mpv**,
which wraps FFmpeg — that's where "every format" comes from.

```
Ankylo.exe
   └── unpacks itself on first run
         ├── Ankylo UI          (Tauri 2 + React + TypeScript)
         ├── playback engine    (libmpv / FFmpeg)
         └── link resolver      (yt-dlp)
```

| Folder | Contents |
|---|---|
| `src/` | The interface — components, state, the hand-drawn icon set |
| `src/engine/` | One playback interface, two implementations (desktop / browser) |
| `src-tauri/` | Desktop shell, mpv bindings, native video surface, commands |
| `launcher/` | The self-extracting single-file wrapper |
| `scripts/` | Build and asset-fetching helpers |
| `build/` | The finished `.exe` |

The UI never branches on platform: `src/engine/types.ts` defines one interface, and the desktop and
browser engines both implement it.

</details>

---

<a id="tech-stack"></a>

## 🧰 Tech stack

| Layer | Choice | Why |
|---|---|---|
| **Playback** | mpv / libmpv | Wraps FFmpeg — the reason every format works |
| **Shell** | Tauri 2 (Rust) | Tiny native app; the UI is a webview |
| **Interface** | React 18 + TypeScript | Fast to build, hard to break |
| **Styling** | Tailwind CSS 3 | Dark-first design tokens |
| **State** | Zustand | Small, predictable, no boilerplate |
| **Streaming** | hls.js · dash.js | HLS and DASH playback in browser mode |
| **Links** | yt-dlp | Resolves website pages into real media streams |
| **Packaging** | Custom Rust launcher | Ships as one self-extracting `.exe` |
| **Icons** | Hand-drawn SVG | No icon fonts, crisp at any size |

---

<a id="format-support"></a>

## 📦 Format support

| Type | Supported |
|---|---|
| **Video** | H.264 · H.265/HEVC · AV1 · VP8/VP9 · MPEG-2 · MPEG-4 · DivX · Xvid · ProRes · DNxHD · VVC · MJPEG |
| **Audio** | AAC · MP3 · FLAC · Opus · AC-3 · E-AC-3 · DTS · Vorbis · ALAC · PCM · WavPack |
| **Subtitles** | SRT · ASS/SSA · VTT · PGS · IDX/SUB |
| **Containers** | MP4 · MKV · AVI · MOV · WebM · FLV · MPEG-TS · OGG · VOB · WMV · 3GP · M2TS · RM · VOB |
| **Streams** | HLS (`.m3u8`) · DASH (`.mpd`) · RTSP · RTMP · HTTP progressive |

**Anything mpv can open, Ankylo opens.**

---

<a id="licence"></a>

## 🧾 Licence

Ankylo itself is yours to use however you like. mpv and FFmpeg do the decoding and are used
unmodified as separate programs — never compiled into Ankylo.

<div align="center">
  <sub>Built for people who just want the thing to play.</sub>
</div>