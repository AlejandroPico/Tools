import { validateEntryName } from './filesystem.js';
export const ZIP_LIMIT = 100 * 1024 * 1024, ZIP_ENTRIES = 2000;
export function zipPath(path) {
  if (typeof path !== 'string' || path.length > 1024 || /[\\\u0000-\u001f]/.test(path) || path.startsWith('/')) throw Error('El ZIP contiene una ruta no admitida.');
  const directory = path.endsWith('/'), parts = (directory ? path.slice(0, -1) : path).split('/');
  if (!parts.length || parts.length > 32) throw Error('Ruta de ZIP demasiado profunda.');
  for (const part of parts) { if (['__proto__', 'constructor', 'prototype'].includes(part.toLowerCase()) || validateEntryName(part) !== part) throw Error('El ZIP contiene una ruta no admitida.'); }
  return parts.join('/') + (directory ? '/' : '');
}
const crcTable = Uint32Array.from({ length: 256 }, (_, value) => { for (let i = 0; i < 8; i++) value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1; return value >>> 0; });
export function crc32(data) { let crc = 0xffffffff; for (const byte of data) crc = crcTable[(crc ^ byte) & 255] ^ crc >>> 8; return (crc ^ 0xffffffff) >>> 0; }
export function inspectZIP(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 22 || bytes.length > ZIP_LIMIT) throw Error('ZIP no válido o superior a 100 MB.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  for (; end >= Math.max(0, bytes.length - 65557); end--) if (view.getUint32(end, true) === 0x06054b50 && end + 22 + view.getUint16(end + 20, true) === bytes.length) break;
  if (end < Math.max(0, bytes.length - 65557)) throw Error('No se encuentra el índice del ZIP.');
  const count = view.getUint16(end + 10, true), size = view.getUint32(end + 12, true), start = view.getUint32(end + 16, true);
  if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true) || view.getUint16(end + 8, true) !== count || count === 65535 || start === 0xffffffff || size === 0xffffffff) throw Error('No se admiten ZIP64 ni archivos repartidos en varios discos.');
  if (count > ZIP_ENTRIES || start + size !== end) throw Error('Índice ZIP no válido o superior a 2.000 entradas.');
  const entries = [], names = new Set(), files = new Set(); let offset = start, total = 0;
  for (let i = 0; i < count; i++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50) throw Error('Índice ZIP incompleto.');
    const flags = view.getUint16(offset + 8, true), method = view.getUint16(offset + 10, true), compressed = view.getUint32(offset + 20, true), original = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true), extra = view.getUint16(offset + 30, true), comment = view.getUint16(offset + 32, true), local = view.getUint32(offset + 42, true);
    if (flags & 1 || flags & 64 || ![0, 8].includes(method)) throw Error('ZIP cifrado o método de compresión no admitido.');
    if (view.getUint16(offset + 34, true) || [compressed, original, local].includes(0xffffffff)) throw Error('No se admite ZIP64.');
    if ((view.getUint32(offset + 38, true) >>> 16 & 0xf000) === 0xa000) throw Error('No se extraen enlaces simbólicos.');
    const next = offset + 46 + nameLength + extra + comment;
    if (!nameLength || next > end) throw Error('Nombre ZIP incompleto.');
    const nameBytes = bytes.subarray(offset + 46, offset + 46 + nameLength);
    if (!(flags & 2048) && nameBytes.some(byte => byte > 127)) throw Error('Los nombres no ASCII deben estar codificados como UTF-8.');
    const name = zipPath(new TextDecoder('utf-8', { fatal: true }).decode(nameBytes)), directory = name.endsWith('/'), key = name.replace(/\/$/, '').toLocaleLowerCase('en-US');
    if (names.has(key)) throw Error('El ZIP contiene nombres duplicados o que solo se distinguen por mayúsculas.');
    names.add(key); if (!directory) files.add(key);
    if (local + 30 > start || view.getUint32(local, true) !== 0x04034b50) throw Error('Cabecera local ZIP no válida.');
    const localNameLength = view.getUint16(local + 26, true), localExtra = view.getUint16(local + 28, true), dataOffset = local + 30 + localNameLength + localExtra;
    if (dataOffset + compressed > start || localNameLength !== nameLength || view.getUint16(local + 6, true) !== flags || view.getUint16(local + 8, true) !== method || !nameBytes.every((byte, j) => byte === bytes[local + 30 + j])) throw Error('Las cabeceras del ZIP no coinciden.');
    if (method === 0 && original !== compressed || directory && (original || compressed > 2)) throw Error('Tamaño de entrada ZIP no válido.');
    total += original; if (total > ZIP_LIMIT) throw Error('El contenido descomprimido supera 100 MB.');
    entries.push({ name, directory, size: original, compressed, method, crc: view.getUint32(offset + 16, true), dataOffset, local }); offset = next;
  }
  if (offset !== end) throw Error('El índice ZIP contiene datos inesperados.');
  const ranges = [...entries].sort((a, b) => a.local - b.local);
  for (let i = 1; i < ranges.length; i++) if (ranges[i].local < ranges[i - 1].dataOffset + ranges[i - 1].compressed) throw Error('Las entradas ZIP se solapan.');
  for (const name of names) { const parts = name.split('/'); parts.pop(); while (parts.length) { if (files.has(parts.join('/'))) throw Error('Un archivo del ZIP se usa también como carpeta.'); parts.pop(); } }
  return entries;
}
export function extractZIP(bytes, inflate, selected = null) {
  const entries = inspectZIP(bytes), wanted = selected ? new Set(selected) : null, result = [];
  for (const entry of entries) {
    if (entry.directory || wanted && !wanted.has(entry.name)) continue;
    const input = bytes.subarray(entry.dataOffset, entry.dataOffset + entry.compressed);
    const data = entry.method === 0 ? input.slice() : inflate(input, { out: new Uint8Array(entry.size + 1) });
    if (data.length !== entry.size || crc32(data) !== entry.crc) throw Error(`El archivo «${entry.name}» no supera la comprobación de integridad.`);
    result.push({ name: entry.name, data: data.slice() });
  }
  if (wanted && result.length !== wanted.size) throw Error('No se encontraron todos los archivos seleccionados.');
  return result;
}
export async function createZIP(entries, zip) {
  if (!entries.length || entries.length > ZIP_ENTRIES) throw Error('Elige entre 1 y 2.000 archivos.');
  const names = new Set(); let total = 0; const input = Object.create(null);
  for (const entry of entries) {
    const name = zipPath(entry.name), key = name.toLocaleLowerCase('en-US');
    if (name.endsWith('/') || names.has(key)) throw Error('Elige nombres distintos para los archivos del ZIP.');
    names.add(key); total += entry.file.size; if (total > ZIP_LIMIT) throw Error('Los archivos superan 100 MB.');
    input[name] = new Uint8Array(await entry.file.arrayBuffer());
  }
  for (const name of names) { const parts = name.split('/'); parts.pop(); while (parts.length) { if (names.has(parts.join('/'))) throw Error('Un archivo se usa también como carpeta dentro del ZIP.'); parts.pop(); } }
  const output = zip(input, { level: 6 });
  if (output.length > ZIP_LIMIT) throw Error('El ZIP generado supera 100 MB. Divide la selección.');
  return output;
}
