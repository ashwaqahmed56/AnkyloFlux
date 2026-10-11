import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const S = 1024;
const BG = [14, 16, 19, 255];
const ACCENT = [224, 164, 88, 255];
const ACCENT_DIM = [224, 164, 88, 70];

const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const raster = Buffer.alloc(S * S * 4);

function set(x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= S || y >= S) return;
  const i = (y * S + x) * 4;
  const src = a / 255;
  const dstA = raster[i + 3] / 255;
  const outA = src + dstA * (1 - src);
  if (outA === 0) return;
  raster[i] = Math.round((r * src + raster[i] * dstA * (1 - src)) / outA);
  raster[i + 1] = Math.round((g * src + raster[i + 1] * dstA * (1 - src)) / outA);
  raster[i + 2] = Math.round((b * src + raster[i + 2] * dstA * (1 - src)) / outA);
  raster[i + 3] = Math.round(outA * 255);
}

function fillPolygon(points, color) {
  const minY = Math.max(0, Math.floor(Math.min(...points.map((p) => p[1]))));
  const maxY = Math.min(S - 1, Math.ceil(Math.max(...points.map((p) => p[1]))));
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      if (y1 === y2) continue;
      if (y >= Math.min(y1, y2) && y < Math.max(y1, y2)) {
        xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      for (let x = Math.round(xs[i]); x <= Math.round(xs[i + 1]); x++) set(x, y, color);
    }
  }
}

function strokePolygon(points, color, width, close = true) {
  for (let i = 0; i < (close ? points.length : points.length - 1); i++) {
    strokeLine(points[i], points[(i + 1) % points.length], color, width);
  }
}

function strokeLine([x1, y1], [x2, y2], color, width) {
  const minX = Math.max(0, Math.floor(Math.min(x1, x2) - width));
  const maxX = Math.min(S - 1, Math.ceil(Math.max(x1, x2) + width));
  const minY = Math.max(0, Math.floor(Math.min(y1, y2) - width));
  const maxY = Math.min(S - 1, Math.ceil(Math.max(y1, y2) + width));
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy || 1;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lenSq));
      const px = x1 + t * dx;
      const py = y1 + t * dy;
      const d = Math.hypot(x - px, y - py);
      if (d <= width) {
        const edge = Math.min(1, Math.max(0, width - d + 0.5));
        set(x, y, [color[0], color[1], color[2], Math.round(color[3] * edge)]);
      }
    }
  }
}

function fillBackground(color) {
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) set(x, y, color);
}

fillBackground(BG);

const cx = S / 2;
const shield = [
  [cx, 168],
  [cx + 210, 262],
  [cx + 210, 512],
  [cx, 856],
  [cx - 210, 512],
  [cx - 210, 262],
];

fillPolygon(shield, ACCENT_DIM);
strokePolygon(shield, ACCENT, 26);

const play = [
  [cx - 84, 372],
  [cx + 128, 512],
  [cx - 84, 652],
];
fillPolygon(play, ACCENT);

const raw = Buffer.alloc((S * 4 + 1) * S);
for (let y = 0; y < S; y++) {
  raw[y * (S * 4 + 1)] = 0;
  raster.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0);
ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8;
ihdr[9] = 6;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

writeFileSync(process.argv[2] ?? 'icon.png', png);
console.log('wrote', process.argv[2] ?? 'icon.png', png.length, 'bytes');