import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { execFileSync } from 'node:child_process';

const OUT = path.join('src-tauri', 'binaries');
const CACHE = path.join(OUT, '.cache');
fs.mkdirSync(CACHE, { recursive: true });

const SEVENZIP = path.join(process.env['ProgramFiles'] || 'C:\\Program Files', '7-Zip', '7z.exe');

function get(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (redirects > 10) return reject(new Error('too many redirects'));
        res.resume();
        return resolve(get(res.headers.location, redirects + 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(120000, () => req.destroy(new Error('timeout')));
  });
}

async function latestAsset(repo, prefix) {
  const body = await get('https://api.github.com/repos/' + repo + '/releases/latest');
  const rel = JSON.parse(body.toString('utf8'));
  const asset = (rel.assets || []).find((a) => a.name.startsWith(prefix));
  return asset ? { url: asset.browser_download_url, name: asset.name } : null;
}

async function download(repo, prefix, label) {
  const info = await latestAsset(repo, prefix);
  if (!info) throw new Error('no asset matching ' + prefix + ' in ' + repo);
  const dest = path.join(CACHE, info.name);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1024 * 1024) {
    console.log(label + ': cached (' + info.name + ')');
    return dest;
  }
  console.log(label + ': downloading ' + info.name);
  const buf = await get(info.url);
  fs.writeFileSync(dest, buf);
  console.log(label + ': ' + (buf.length / 1048576).toFixed(1) + ' MB');
  return dest;
}

function sevenZip(args) {
  return execFileSync(SEVENZIP, args, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
}

function extract(archive, wanted, destDir) {
  const list = sevenZip(['l', '-ba', archive]).split(/\r?\n/);
  const files = list
    .map((line) => line.trim().split(/\s+/))
    .filter((cols) => cols.length >= 6)
    .map((cols) => cols.slice(-1)[0])
    .filter((f) => wanted.test(f));

  if (files.length === 0) throw new Error('nothing matched ' + wanted + ' in ' + archive);

  for (const f of files) {
    sevenZip(['e', archive, '-o' + destDir, '-y', f]);
  }
  return files.length;
}

(async () => {
  const repo = process.argv[2] || 'zhongfly/mpv-winbuild';
  const mpvPrefix = process.argv[3] || 'mpv-x86_64-';
  const ffPrefix = process.argv[4] || 'ffmpeg-lgpl-x86_64-';

  const mpvArchive = await download(repo, mpvPrefix, 'mpv (libmpv-2.dll)');
  const n1 = extract(mpvArchive, /libmpv-2\.dll$/i, OUT);
  console.log('  extracted libmpv-2.dll');

  const ffArchive = await download(repo, ffPrefix, 'ffmpeg (LGPL)');
  const n2 = extract(ffArchive, /(avcodec|avformat|avutil|swscale|swresample)-[\w]+\.dll$/i, OUT);
  console.log('  extracted ' + n2 + ' ffmpeg DLLs');

  const zipPath = path.join(OUT, 'ffmpeg.zip');
  if (fs.existsSync(zipPath)) {
    const exDir = path.join(OUT, '.ffextract');
    fs.rmSync(exDir, { recursive: true, force: true });
    sevenZip(['x', zipPath, '-o' + exDir, '-y']);
    const found = [];
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/^(ffmpeg|ffprobe)\.exe$/i.test(e.name)) found.push(p);
      }
    };
    walk(exDir);
    const target = path.join(OUT, 'ffmpeg');
    fs.mkdirSync(target, { recursive: true });
    for (const f of found) fs.copyFileSync(f, path.join(target, path.basename(f)));
    console.log('  copied ' + found.map((f) => path.basename(f)).join(', '));
    fs.rmSync(exDir, { recursive: true, force: true });
    fs.rmSync(zipPath, { force: true });
  }

  console.log('\n--- binaries ---');
  for (const f of fs.readdirSync(OUT)) {
    const st = fs.statSync(path.join(OUT, f));
    if (st.isDirectory() && f === '.cache') continue;
    console.log('  ' + f.padEnd(26) + (st.isDirectory() ? '<dir>' : (st.size / 1048576).toFixed(1) + ' MB'));
  }
})().catch((e) => {
  console.error('FAILED: ' + e.message);
  process.exit(1);
});