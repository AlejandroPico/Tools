export function guessDelimiter(text) {
  const counts = { ',': 0, ';': 0, '\t': 0 }; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '"') { if (quoted && text[i + 1] === '"') i++; else quoted = !quoted; }
    else if (!quoted && /[\r\n]/.test(text[i])) break;
    else if (!quoted && Object.hasOwn(counts, text[i])) counts[text[i]]++;
  }
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
}
export function parseCSV(text, delimiter = ',') {
  if (![',', ';', '\t'].includes(delimiter)) throw new Error('Separador no admitido.');
  if (text.length > 5_000_000) throw new Error('CSV admite hasta 5 MB.');
  const rows = []; let row = [], field = '', quoted = false, afterQuote = false;
  function cell() { row.push(field); field = ''; afterQuote = false; if (row.length > 100) throw new Error('Se admiten hasta 100 columnas.'); }
  function finish() { cell(); rows.push(row); row = []; if (rows.length > 3000 || rows.reduce((sum, item) => sum + item.length, 0) > 50000) throw new Error('Límite de 3000 filas o 50 000 celdas.'); }
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) { if (char === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else { quoted = false; afterQuote = true; } } else field += char; }
    else if (char === delimiter) cell();
    else if (char === '\r' || char === '\n') { if (char === '\r' && text[i + 1] === '\n') i++; finish(); }
    else if (char === '"' && !field && !afterQuote) quoted = true;
    else { if (afterQuote || char === '"') throw new Error('Comillas inesperadas. Encierra el campo completo entre comillas.'); field += char; }
  }
  if (quoted) throw new Error('Falta cerrar un campo entre comillas.');
  if (field || row.length || afterQuote || !rows.length) finish();
  const width = Math.max(1, ...rows.map(item => item.length));
  if (rows.length * width > 50000) throw new Error('Límite de 50 000 celdas al completar las filas.');
  return rows.map(item => [...item, ...Array(width - item.length).fill('')]);
}
export function writeCSV(rows, delimiter = ',', safeSpreadsheet = false) {
  return rows.map(row => row.map(raw => {
    let text = String(raw);
    if (safeSpreadsheet && /^[=+@\-\t\r]/.test(text)) text = "'" + text;
    return /["\r\n]/.test(text) || text.includes(delimiter) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }).join(delimiter)).join('\r\n');
}
