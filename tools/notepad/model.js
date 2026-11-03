export function textStats(text) {
  const words = text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || [];
  return { words: words.length, characters: Array.from(text).length, lines: text ? text.split('\n').length : 0, minutes: Math.ceil(words.length / 200) };
}
export function cleanText(text, action) {
  if (action === 'upper') return text.toLocaleUpperCase('es');
  if (action === 'lower') return text.toLocaleLowerCase('es');
  if (action === 'initials') return text.toLocaleLowerCase('es').replace(/(^|[^\p{L}\p{N}])([\p{L}])/gu, (_, before, letter) => before + letter.toLocaleUpperCase('es'));
  if (action === 'sentence') return text.toLocaleLowerCase('es').replace(/(^|[.!?]\s+)([¿¡"'\s]*)(\p{L})/gu, (_, before, punctuation, letter) => before + punctuation + letter.toLocaleUpperCase('es'));
  if (action === 'spaces') return text.replace(/[\t ]+/g, ' ').split('\n').map(line => line.trim()).join('\n');
  if (action === 'blank-lines') return text.replace(/\n[\t ]*\n(?:[\t ]*\n)+/g, '\n\n');
  if (action === 'trim') return text.trim();
  return text;
}
export function replaceText(text, search, replacement, matchCase = false) {
  if (!search) return { text, count: 0 };
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let count = 0;
  const next = text.replace(new RegExp(escaped, matchCase ? 'g' : 'gi'), () => { count++; return replacement; });
  return { text: next, count };
}
export function compareLines(left, right) {
  if (left === right) return { exact: true, rows: left.split('\n').map(text => ({ type: 'same', text })) };
  const a = left.split('\n'), b = right.split('\n');
  if (a.length * b.length > 500_000 || a.length + b.length > 5000) {
    return { exact: false, rows: [...a.map(text => ({ type: 'removed', text })), ...b.map(text => ({ type: 'added', text }))] };
  }
  const table = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
  const rows = [];
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) rows.push({ type: 'same', text: a[i++] }), j++;
    else if (j >= b.length || (i < a.length && table[i + 1][j] >= table[i][j + 1])) rows.push({ type: 'removed', text: a[i++] });
    else rows.push({ type: 'added', text: b[j++] });
  }
  return { exact: true, rows };
}
export function safeNoteName(title, extension = 'txt') {
  return `${title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/[. ]+$/, '').trim().slice(0, 100) || 'nota'}.${extension}`;
}
