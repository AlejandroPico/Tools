export function jsonDocument(source) {
  if (source.length > 5_000_000) throw new Error('JSON admite hasta 5 MB de texto.');
  let i = 0, nodes = 0, depth = 0, duplicates = 0;
  const fail = text => { const before = source.slice(0, i); throw new Error(`${text} Línea ${before.split('\n').length}, columna ${i - before.lastIndexOf('\n')}.`); };
  const space = () => { while (/[ \t\r\n]/.test(source[i] || '\0')) i++; };
  function string() {
    const start = i++; let escaped = false;
    while (i < source.length) {
      const char = source[i++];
      if (!escaped && char === '"') { const raw = source.slice(start, i); try { return { raw, value: JSON.parse(raw) }; } catch { fail('Cadena no válida.'); } }
      if (!escaped && char === '\\') escaped = true; else escaped = false;
    }
    fail('Falta cerrar una cadena.');
  }
  function value() {
    space(); if (++nodes > 100000 || ++depth > 64) fail('Documento demasiado complejo.');
    let node;
    if (source[i] === '{') {
      i++; space(); const entries = [], names = new Set();
      if (source[i] !== '}') while (true) {
        space(); if (source[i] !== '"') fail('Se esperaba una clave entre comillas.');
        const key = string(); space(); if (source[i++] !== ':') fail('Falta dos puntos tras la clave.');
        if (names.has(key.value)) duplicates++; names.add(key.value);
        entries.push({ key, node: value() }); space();
        if (source[i] !== ',') break; i++;
      }
      if (source[i++] !== '}') fail('Falta cerrar el objeto.'); node = { type: 'object', entries };
    } else if (source[i] === '[') {
      i++; space(); const items = [];
      if (source[i] !== ']') while (true) { items.push(value()); space(); if (source[i] !== ',') break; i++; }
      if (source[i++] !== ']') fail('Falta cerrar la lista.'); node = { type: 'array', items };
    } else if (source[i] === '"') node = { type: 'primitive', raw: string().raw };
    else {
      const match = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(source.slice(i));
      if (!match) fail('Valor JSON no válido.'); i += match[0].length; node = { type: 'primitive', raw: match[0] };
    }
    depth--; return node;
  }
  const root = value(); space(); if (i !== source.length) fail('Hay contenido después del valor JSON.');
  return { root, nodes, duplicates };
}
export function formatJSON(source, indent = '  ', sort = false) {
  const parsed = jsonDocument(source), chunks = []; let length = 0;
  const push = text => { length += text.length; if (length > 10_000_000) throw new Error('La salida supera 10 MB. Usa un formato más compacto.'); chunks.push(text); };
  function write(node, level) {
    if (node.type === 'primitive') { push(node.raw); return; }
    const object = node.type === 'object';
    const entries = object ? sort ? [...node.entries].sort((a, b) => a.key.value.localeCompare(b.key.value, 'es')) : node.entries : node.items;
    push(object ? '{' : '[');
    entries.forEach((entry, index) => {
      if (index) push(','); if (indent) push('\n' + indent.repeat(level + 1));
      if (object) { push(entry.key.raw + ':' + (indent ? ' ' : '')); write(entry.node, level + 1); } else write(entry, level + 1);
    });
    if (entries.length && indent) push('\n' + indent.repeat(level)); push(object ? '}' : ']');
  }
  write(parsed.root, 0); return { text: chunks.join(''), nodes: parsed.nodes, duplicates: parsed.duplicates };
}
