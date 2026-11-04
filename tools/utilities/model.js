let pool = new Uint32Array(128), cursor = pool.length;
function randomWord() { if (cursor === pool.length) { crypto.getRandomValues(pool); cursor = 0; } return pool[cursor++]; }
export function randomBelow(limit) {
  limit = BigInt(limit); if (limit < 1n || limit > 1n << 64n) throw Error('Intervalo aleatorio fuera de rango.');
  if (limit === 1n) return 0n;
  const bits = (limit - 1n).toString(2).length, mask = (1n << BigInt(bits)) - 1n;
  let value;
  do { value = BigInt(randomWord()); if (bits > 32) value = value << 32n | BigInt(randomWord()); value &= mask; } while (value >= limit);
  return value;
}
export function sampleIntegers(min, max, count, repeat = false) {
  if (![min, max].every(Number.isSafeInteger) || min > max || !Number.isInteger(count) || count < 1 || count > 10000) throw Error('Usa límites enteros válidos y entre 1 y 10.000 resultados.');
  const start = BigInt(min), range = BigInt(max) - start + 1n;
  if (!repeat && BigInt(count) > range) throw Error('El intervalo no contiene suficientes números distintos.');
  const result = [], swaps = new Map();
  for (let i = 0; i < count; i++) {
    const remaining = repeat ? range : range - BigInt(i), selected = randomBelow(remaining);
    const value = repeat ? selected : swaps.get(selected) ?? selected;
    if (!repeat) { const last = remaining - 1n; swaps.set(selected, swaps.get(last) ?? last); swaps.delete(last); }
    result.push(Number(start + value));
  }
  return result;
}
export function generatePassword(length, options = {}) {
  if (!Number.isInteger(length) || length < 4 || length > 256) throw Error('La longitud debe estar entre 4 y 256.');
  const groups = { lower: 'abcdefghijklmnopqrstuvwxyz', upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', digits: '0123456789', symbols: '!#$%&()*+,-./:;<=>?@[]^_{|}~' };
  const chosen = Object.entries(groups).filter(([key]) => options[key] !== false).map(([, chars]) => options.clear ? chars.replace(/[Il1O0o]/g, '') : chars);
  if (!chosen.length || chosen.length > length) throw Error('Selecciona al menos un grupo de caracteres.');
  const alphabet = chosen.join('');
  // Rejection sampling keeps every valid password equally likely.
  for (let attempt = 0; attempt < 1000; attempt++) {
    const text = Array.from({ length }, () => alphabet[Number(randomBelow(alphabet.length))]).join('');
    if (chosen.every(group => [...text].some(char => group.includes(char)))) return text;
  }
  throw Error('No se pudo generar una contraseña con estas opciones.');
}
export function drawNames(text, count, unique = true) {
  if (text.length > 500000) throw Error('La lista supera 500.000 caracteres.');
  let names = text.split(/\r?\n/).map(name => name.trim()).filter(Boolean);
  if (unique) names = [...new Set(names)];
  if (names.length > 10000) throw Error('La lista admite hasta 10.000 participaciones.');
  if (!Number.isInteger(count) || count < 1 || count > names.length) throw Error('Elige un número de ganadores entre 1 y el total de participaciones.');
  return { total: names.length, winners: sampleIntegers(0, names.length - 1, count).map(index => names[index]) };
}
export function checkDigit(text) { return String((10 - [...text].reverse().reduce((sum, digit, i) => sum + Number(digit) * (i % 2 ? 1 : 3), 0) % 10) % 10); }
export function barcodeValue(value, format) {
  if (format === 'CODE128') { if (!/^[\x20-\x7e]{1,80}$/.test(value)) throw Error('Code 128 admite de 1 a 80 caracteres ASCII imprimibles.'); return value; }
  if (format === 'CODE39') { value = value.toUpperCase(); if (!/^[A-Z0-9 .$/+%\-]{1,80}$/.test(value)) throw Error('Code 39 admite letras, números, espacios y . $ / + % -.'); return value; }
  const size = { EAN13: 13, EAN8: 8, UPC: 12, ITF14: 14 }[format];
  if (!size || !/^\d+$/.test(value) || ![size - 1, size].includes(value.length)) throw Error(`Introduce ${size - 1} cifras para calcular el control, o ${size} cifras completas.`);
  if (value.length === size - 1) return value + checkDigit(value);
  if (value.at(-1) !== checkDigit(value.slice(0, -1))) throw Error('El dígito de control no es correcto.');
  return value;
}
