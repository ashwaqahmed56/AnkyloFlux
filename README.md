# Ankylo

A dark-first, keyboard-driven, all-format video player. Playback runs on **libmpv** (FFmpeg under the hood) in a
**Tauri 2** shell, with a **React + TypeScript** interface. The same frontend also runs in a plain browser against a
MediaSource/HLS/DASH engine, so the UI is testable without a native build.

```
┌─────────────────────────────────────────────────────────────┐
│  React + TS UI  (dark-first, SVG icon set, Tailwind tokens) │
└───────────────┬─────────────────────────────────────────────┘
                │  PlayerEngine abstraction
        ┌───────┴────────┐
        │                │
  MpvEngine         MseEngine
  (Tauri)           (browser dev/preview)
        │                │
  libmpv-2.dll     <video> + hls.js + dash.js
  (sidecar)
```

---

## Quick start

### 1. UI in the browser (no Rust, no native deps)

```bash
npm install
npm run dev          # http://localhost:1488
```

Drag an `.mp4`/`.webm`/`.mkv` (if your browser can decode it) onto the window, or use **Open file**.
HLS (`.m3u8`) and DASH (`.mpd`) URLs work through the stream URL dialog. Video adjustments use CSS/SVG filters
in this mode; the full EQ, deinterlacing, and track control surface comes from libmpv in the desktop build.

### 2. Desktop build (Windows .exe)

Prerequisites:

- Rust toolchain — `rustup` (stable)
- Visual Studio Build Tools with the **Desktop development with C++** workload

```bash
npm install
node scripts\fetch-libmpv.mjs zhongfly/mpv-winbuild mpv-dev-lgpl-x86_64- ffmpeg-lgpl-x86_64-
npm run tauri:build
node scripts\pack-payload.mjs
cargo build --release --manifest-path launcher\Cargo.toml
```

The shippable single file is then:

```
build\Ankylo.exe
```

**That one file is the whole application.** It is a launcher with the real binary and `libmpv-2.dll`
compressed inside it (deflate, ~44 MB total). On first run it unpacks itself into
`%LOCALAPPDATA%\Ankylo\`, starts the real player, and subsequent launches start in ~2 s. No install,
no console window, no DLL juggling, no runtime downloads.

`libmpv` is the LGPL mpv build with FFmpeg statically linked, so every container/codec mpv supports
plays out of the box. It is never statically linked into Ankylo — it stays a separate DLL, keeping
the LGPL obligations simple.

To skip the packaging step and run the unpackaged build directly, use
`src-tauri\target\release\ankylo.exe` with `src-tauri\binaries\libmpv-2.dll` next to it.

If libmpv cannot be found the shell exits with a clear message instead of showing a player that cannot play.

---

## Engine contract

`src/engine/types.ts` defines the whole playback surface once. Both engines implement it, so the UI never branches
on platform:

```ts
interface PlayerEngine {
  open(pathOrUrl: string, opts?: OpenOptions): void
  seekBy(delta: number): void
  setEq(eq: EqState): void
  setTrack(kind: 'audio' | 'sub', id: number): void
  setHwdec(mode: string): void
  setLoop(a: number | null, b: number | null): void
  // …play, pause, frameStep, speed, volume, balance, delays, aspect,
  // rotation, mirror, deinterlace, tone map, screenshot, PiP
}
```

Engine → UI communication is one-way through `EngineHost` (`src/engine/types.ts`), bound in
`src/state/host.ts`. The Rust side emits a single `mpv-event` channel that the adapter translates into those host
calls, so the store never learns whether it is talking to mpv or a `<video>` tag.

---

## Features

**Playback** — play/pause, frame stepping (`,` / `.`), A–B loop (`R`), speed 0.1×–8× with presets and fine
adjustment, aspect override, rotation, mirror, deinterlace, chapter navigation, playlist auto-advance.

**Audio** — track switching, volume, mute, stereo balance, audio delay.

**Subtitles** — track switching, external `.srt`/`.ass`/`.vtt` loading (dragged in or via the menu), ±5 s delay,
font size, position, colour, outline.

**Video adjustments** — brightness, contrast, saturation, gamma, hue, sharpness, with per-control reset.

**Interaction** — double-click fullscreen, click to toggle, horizontal drag to seek, vertical drag on the right for
volume / left for brightness, wheel volume (shift+wheel seeks), right-click context menu, hover-reveal controls that
fade after 2.5 s, drag-and-drop files and folders, toast feedback for every gesture.

**Power user** — `Ctrl+K` command palette, fully remappable shortcuts, mini player, PiP, snapshot to PNG, media info
panel, playlist with drag-to-reorder, recent files.

**Downloads** — when a network stream is loaded, **Download** saves it to your Videos folder. HLS master playlists
resolve to the highest-bandwidth variant, segments are fetched and concatenated, and a progress bar shows
percentage and speed. `Ctrl+Shift+S`, the top-bar button, or the right-click menu.

---

## Keyboard

| Key | Action | Key | Action |
|---|---|---|---|
| `Space` | Play / pause | `Ctrl+K` | Command palette |
| `←` / `→` | Seek ∓10 s | `Ctrl+E` | Adjustments panel |
| `Shift+←` / `Shift+→` | Seek ∓60 s | `I` | Media info |
| `,` / `.` | Frame step | `L` | Playlist |
| `↑` / `↓` | Volume | `R` | A–B loop |
| `M` | Mute | `A` / `J` | Audio / subtitle track |
| `F` | Fullscreen | `Ctrl+J` | Subtitle delay |
| `Ctrl+S` | Snapshot | `T` | Aspect ratio |
| `Ctrl+P` | Picture-in-Picture | `D` | Deinterlace |
| `Ctrl+M` | Mini player | `Esc` | Close / dismiss |

Every binding is editable in **Settings → Keyboard shortcuts**.

---

## Design

Dark-first with a deep charcoal base (`#0e1013`), not pure black, so the video is the brightest thing on screen.
A single desaturated accent (amber by default, with teal / warm grey / rose) is used only for active states.
Icons are hand-drawn SVG at 24×24 with a 1.5 px stroke — no icon font, no raster assets (`src/icons.tsx`).
Typography is Inter with JetBrains Mono for timecodes. Corners stay at 4–6 px; transitions run 150–250 ms.

Light theme and accent switching live in Settings and persist to `localStorage`.

---

## Layout

```
src/
├── engine/          PlayerEngine interface, MseEngine, MpvEngine
├── state/           zustand stores, engine host, action registry
├── components/      PlayerSurface, ControlsBar, SeekBar, panels, palette…
├── hooks/           keyboard, idle-hide, drag-drop, video-rect sync
├── icons.tsx        the SVG icon set
└── styles.css       tokens, theme variables, animations
src-tauri/
├── src/mpv.rs       libmpv C ABI bindings (loaded via libloading)
├── src/engine.rs    property observation, event loop, track/chapter parsing
├── src/commands.rs  the Tauri command surface + ffprobe probing
└── src/window.rs    Win32 child window that hosts the mpv video output
```

---

## Phase 2

The icon set already includes Android mipmaps and the window/Tauri layer is portable. For a shipping `.apk` you
would swap `MpvEngine` for an ExoPlayer/Media3 adapter behind the same `PlayerEngine` interface — the UI, stores,
and command registry need no changes.

## Licence notes

libmpv and FFmpeg are shipped as **external sidecar DLLs loaded at runtime**, not statically linked, which keeps
Ankylo itself off the GPL. mpv and FFmpeg builds must come from LGPL-enabled builds (the fetch script uses
LGPL-shared ones).