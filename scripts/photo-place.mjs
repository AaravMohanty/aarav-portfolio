/* Reads EXIF GPS out of the photos in incoming/ and prints where each one
   was taken, so a phone filename like IMG_7480.jpeg does not have to be
   matched to a place by hand.  Pure Node, no dependencies.

   Usage: npm run photos:where                                           */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = new URL('../incoming/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/* ---------- a very small EXIF reader: just the tags we care about ---------- */

const read = (buf, offset, size, little) => (
  size === 2
    ? (little ? buf.readUInt16LE(offset) : buf.readUInt16BE(offset))
    : (little ? buf.readUInt32LE(offset) : buf.readUInt32BE(offset))
);

function findExif(buf) {
  if (buf.readUInt16BE(0) !== 0xffd8) return null;          // not a JPEG
  let at = 2;
  while (at < buf.length - 4) {
    if (buf[at] !== 0xff) { at += 1; continue; }
    const marker = buf[at + 1];
    const size = buf.readUInt16BE(at + 2);
    if (marker === 0xe1 && buf.toString('ascii', at + 4, at + 8) === 'Exif') return at + 10;
    if (marker === 0xda) break;                              // start of scan, no EXIF
    at += 2 + size;
  }
  return null;
}

function readIFD(buf, tiff, ifd, little) {
  const entries = {};
  const count = read(buf, ifd, 2, little);
  for (let i = 0; i < count; i += 1) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > buf.length) break;
    entries[read(buf, entry, 2, little)] = {
      type: read(buf, entry + 2, 2, little),
      count: read(buf, entry + 4, 4, little),
      value: entry + 8
    };
  }
  return entries;
}

const rationals = (buf, tiff, field, little, n) => {
  const base = tiff + read(buf, field.value, 4, little);
  return Array.from({ length: n }, (_, i) => {
    const num = read(buf, base + i * 8, 4, little);
    const den = read(buf, base + i * 8 + 4, 4, little);
    return den ? num / den : 0;
  });
};

const ascii = (buf, tiff, field, little) => {
  const len = field.count;
  const base = len > 4 ? tiff + read(buf, field.value, 4, little) : field.value;
  return buf.toString('ascii', base, base + len).replace(/\0+$/, '');
};

function gpsOf(file) {
  const buf = readFileSync(file);
  const tiff = findExif(buf);
  if (tiff === null) return { error: 'no EXIF block' };

  const little = buf.toString('ascii', tiff, tiff + 2) === 'II';
  const ifd0 = tiff + read(buf, tiff + 4, 4, little);
  const root = readIFD(buf, tiff, ifd0, little);

  const out = {};

  const exifPtr = root[0x8769];
  if (exifPtr) {
    const exif = readIFD(buf, tiff, tiff + read(buf, exifPtr.value, 4, little), little);
    if (exif[0x9003]) out.taken = ascii(buf, tiff, exif[0x9003], little);
  }

  const gpsPtr = root[0x8825];
  if (!gpsPtr) return { ...out, error: 'no GPS tags (location may be off, or stripped)' };

  const gps = readIFD(buf, tiff, tiff + read(buf, gpsPtr.value, 4, little), little);
  if (!gps[2] || !gps[4]) return { ...out, error: 'GPS block present but empty' };

  const [latD, latM, latS] = rationals(buf, tiff, gps[2], little, 3);
  const [lonD, lonM, lonS] = rationals(buf, tiff, gps[4], little, 3);
  const latRef = gps[1] ? ascii(buf, tiff, gps[1], little) : 'N';
  const lonRef = gps[3] ? ascii(buf, tiff, gps[3], little) : 'E';

  let lat = latD + latM / 60 + latS / 3600;
  let lon = lonD + lonM / 60 + lonS / 3600;
  if (latRef === 'S') lat = -lat;
  if (lonRef === 'W') lon = -lon;

  return { ...out, lat, lon };
}

/* ------------------------------- report ------------------------------- */

if (!existsSync(DIR)) {
  console.log('No incoming/ folder yet. Create it and drop the photos in.');
  process.exit(0);
}

const files = readdirSync(DIR).filter((f) => /\.(jpe?g)$/i.test(f));
if (!files.length) {
  console.log('No JPEGs in incoming/.');
  process.exit(0);
}

for (const name of files) {
  const info = gpsOf(join(DIR, name));
  if (info.lat !== undefined) {
    console.log(`  ${name}`);
    console.log(`    ${info.lat.toFixed(5)}, ${info.lon.toFixed(5)}`);
    console.log(`    https://www.google.com/maps?q=${info.lat.toFixed(6)},${info.lon.toFixed(6)}`);
    if (info.taken) console.log(`    taken ${info.taken}`);
  } else {
    console.log(`  ${name}  —  ${info.error}${info.taken ? ` (taken ${info.taken})` : ''}`);
  }
  console.log('');
}
