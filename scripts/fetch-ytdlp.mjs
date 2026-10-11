import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';

const dest = path.join('src-tauri', 'binaries', 'yt-dlp.exe');

function get(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Ankylo/0.1' } }, (res) => {
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
      })
      .on('error', reject);
  });
}

const url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
console.log('downloading yt-dlp.exe ...');
const buf = await get(url);
if (buf[0] !== 0x4d || buf[1] !== 0x5a) {
  console.error('downloaded file is not a PE binary - aborting');
  process.exit(1);
}
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, buf);
console.log(`saved ${(buf.length / 1048576).toFixed(1)} MB -> ${dest}`);