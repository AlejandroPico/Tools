export function parseInteger(text, base) {
  if (![2, 8, 10, 16].includes(base)) throw new Error('Base no admitida.');
  let value = text.trim().replace(/[ _]/g, '').toUpperCase();
  const negative = value.startsWith('-'); if (negative || value.startsWith('+')) value = value.slice(1);
  const prefix = { 2: '0B', 8: '0O', 16: '0X' }[base];
  if (prefix && value.startsWith(prefix)) value = value.slice(2);
  if (!value || value.length > 256) throw new Error('Introduce un entero de hasta 256 cifras.');
  const digits = '0123456789ABCDEF';
  let result = 0n;
  for (const char of value) {
    const digit = digits.indexOf(char);
    if (digit < 0 || digit >= base) throw new Error(`La cifra «${char}» no existe en base ${base}.`);
    result = result * BigInt(base) + BigInt(digit);
  }
  return negative ? -result : result;
}
export function integerResult(a, b, operation, bits = 64, signed = false) {
  if (![8, 16, 32, 64].includes(bits)) throw new Error('Tamaño de palabra no admitido.');
  const normalize = value => signed ? BigInt.asIntN(bits, value) : BigInt.asUintN(bits, value);
  if (['<<', '>>'].includes(operation) && (b < 0n || b >= BigInt(bits))) throw new Error(`El desplazamiento debe estar entre 0 y ${bits - 1}.`);
  a = normalize(a); b = normalize(b);
  if (['/', '%'].includes(operation) && b === 0n) throw new Error('No se puede dividir entre cero.');
  if (['<<', '>>'].includes(operation) && (b < 0n || b >= BigInt(bits))) throw new Error(`El desplazamiento debe estar entre 0 y ${bits - 1}.`);
  const actions = { '+': () => a + b, '-': () => a - b, '*': () => a * b, '/': () => a / b, '%': () => a % b, AND: () => a & b, OR: () => a | b, XOR: () => a ^ b, NOT: () => ~a, '<<': () => a << b, '>>': () => a >> b };
  if (!Object.hasOwn(actions, operation)) throw new Error('Operación desconocida.');
  return normalize(actions[operation]());
}
export function integerFormats(value, bits, signed) {
  const unsigned = BigInt.asUintN(bits, value);
  return { HEX: unsigned.toString(16).toUpperCase(), DEC: (signed ? BigInt.asIntN(bits, value) : unsigned).toString(10), OCT: unsigned.toString(8), BIN: unsigned.toString(2).padStart(bits, '0') };
}
