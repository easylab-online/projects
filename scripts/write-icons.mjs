import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

/** Minimal PNG writer — generates solid emerald rounded icons without binary assets in git. */
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function writePng(size, outPath) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const i = row + 1 + x * 4;
      const cx = size / 2;
      const cy = size / 2;
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      const m = size * 0.08;
      const r = size * 0.18;
      const qx = dx - (size / 2 - m - r);
      const qy = dy - (size / 2 - m - r);
      const outside =
        Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2) +
        Math.min(Math.max(qx, qy), 0) -
        r;
      if (outside > 0) {
        raw[i] = raw[i + 1] = raw[i + 2] = raw[i + 3] = 0;
        continue;
      }
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist < size * 0.22) {
        raw[i] = raw[i + 1] = raw[i + 2] = 255;
        raw[i + 3] = 230;
      } else {
        const t = y / size;
        raw[i] = 5;
        raw[i + 1] = Math.floor(80 + 100 * (1 - t));
        raw[i + 2] = Math.floor(90 + 40 * t);
        raw[i + 3] = 255;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  writeFileSync(outPath, png);
  console.log("wrote", outPath, png.length);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const iconsDir = join(root, "public", "icons");
mkdirSync(iconsDir, { recursive: true });
writePng(192, join(iconsDir, "icon-192.png"));
writePng(512, join(iconsDir, "icon-512.png"));
