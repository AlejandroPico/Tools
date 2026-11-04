export function byteValue(text) { if (!/^[\da-f]{2}$/i.test(text.trim())) throw Error('Introduce un byte hexadecimal de dos cifras (00–FF).'); return parseInt(text, 16); }
export function byteOffset(value, length, allowEnd = false) { const n = Number(value); if (!String(value).trim() || !Number.isSafeInteger(n) || n < 0 || n > length - (allowEnd ? 0 : 1)) throw Error('La posición está fuera del archivo. Usa decimal o el prefijo 0x.'); return n; }
export function hexBytes(text) { const clean = text.replace(/\s/g, ''); if (!clean || clean.length % 2 || /[^\da-f]/i.test(clean) || clean.length > 131072) throw Error('Introduce pares hexadecimales válidos, hasta 64 KB.'); return Uint8Array.from(clean.match(/../g), byte => parseInt(byte, 16)); }
export async function compareFiles(a, b, { cancelled = () => false, progress = () => {} } = {}) {
  if (Math.max(a.size, b.size) > 200 * 1024 * 1024) throw Error('La comparación admite archivos de hasta 200 MB.');
  const max = Math.max(a.size, b.size), samples = []; let differences = 0, first = null;
  for (let offset = 0; offset < max; offset += 1024 * 1024) {
    if (cancelled()) throw Error('Comparación cancelada.');
    const [left, right] = await Promise.all([a.slice(offset, offset + 1024 * 1024).arrayBuffer(), b.slice(offset, offset + 1024 * 1024).arrayBuffer()]);
    const x = new Uint8Array(left), y = new Uint8Array(right);
    for (let i = 0; i < Math.max(x.length, y.length); i++) if (x[i] !== y[i]) { differences++; if (first === null) first = offset + i; if (samples.length < 100) samples.push({ offset: offset + i, a: x[i] ?? null, b: y[i] ?? null }); }
    progress(Math.min(100, Math.round((offset + 1024 * 1024) / max * 100)));
  }
  if (cancelled()) throw Error('Comparación cancelada.');
  return { equal: differences === 0, differences, first, samples, sizeA: a.size, sizeB: b.size };
}
export function makeBytes(size, mode, value = '00') {
  if (!Number.isSafeInteger(size) || size < 0 || size > 32 * 1024 * 1024) throw Error('El tamaño debe estar entre 0 y 32 MB.');
  const data = new Uint8Array(size);
  if (mode === 'byte') data.fill(byteValue(value));
  else if (mode === 'random') for (let i = 0; i < size; i += 65536) crypto.getRandomValues(data.subarray(i, i + 65536));
  else if (mode !== 'zero') throw Error('Contenido de archivo no admitido.');
  return data;
}
