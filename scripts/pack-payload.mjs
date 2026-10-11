import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

const payload = path.join('src-tauri', 'payload');
fs.mkdirSync(payload, { recursive: true });

const jobs = [
  [path.join('src-tauri', 'target', 'release', 'ankylo.exe'), path.join(payload, 'ankylo.exe.gz')],
  [path.join('src-tauri', 'binaries', 'libmpv-2.dll'), path.join(payload, 'libmpv-2.dll.gz')],
  [path.join('src-tauri', 'binaries', 'yt-dlp.exe'), path.join(payload, 'yt-dlp.exe.gz')],
];

// Guard: a binary produced by plain `cargo build` runs in Tauri dev mode and
// points the webview at localhost, so the user sees "can't reach this page".
// Only `npm run tauri:build` embeds the frontend. The devUrl string is present
// in every Tauri binary (it is part of the embedded config), so the reliable
// marker is whether the hashed bundle from dist/ made it inside.
const APP_BIN = jobs[0][0];
const raw = fs.readFileSync(APP_BIN);

let assetName = null;
const assetsDir = path.join('dist', 'assets');
if (fs.existsSync(assetsDir)) {
  assetName =
    fs
      .readdirSync(assetsDir)
      .find((f) => /^index-.*\.js$/.test(f)) ?? null;
}

if (!assetName) {
  console.error('\nREFUSING TO PACKAGE: run `npm run build` first (no frontend found).');
  process.exit(1);
}

if (!raw.includes(Buffer.from(assetName, 'utf8'))) {
  console.error(
    `\nREFUSING TO PACKAGE: ${APP_BIN} does not embed the frontend (${assetName} not found).\n` +
      `That binary runs in dev mode and shows "can't reach this page".\n\n` +
      `Rebuild with:  npm run tauri:build\n`,
  );
  process.exit(1);
}

console.log(`verified: frontend embedded (${assetName})`);

for (const [src, dest] of jobs) {
  const raw = fs.readFileSync(src);
  const packed = zlib.deflateRawSync(raw, { level: 9 });
  fs.writeFileSync(dest, packed);
  const pct = ((packed.length / raw.length) * 100).toFixed(0);
  console.log(
    `${path.basename(dest).padEnd(20)} ${(raw.length / 1048576).toFixed(1)} MB -> ${(packed.length / 1048576).toFixed(1)} MB (${pct}%)`,
  );
}