export function toBase64(text) {
  const bytes = new TextEncoder().encode(text); let binary = '';
  for (let i = 0; i < bytes.length; i += 16384) binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return btoa(binary);
}
export function base64Bytes(source) {
  const text = source.replace(/\s/g, '');
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(text)) throw new Error('Base64 no válido: revisa el alfabeto y el relleno =.');
  const binary = atob(text); return Uint8Array.from(binary, char => char.charCodeAt(0));
}
export function fromBase64(source) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(base64Bytes(source)); }
  catch (error) { if (error instanceof TypeError) throw new Error('Los bytes no son texto UTF-8. Puedes descargarlos como archivo.'); throw error; }
}
