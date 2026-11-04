export const PDF_LIMIT = 50 * 1024 * 1024, PAGE_LIMIT = 500;
export function rotation(angle) { if (!Number.isInteger(angle) || angle % 90) throw Error('El giro debe ser múltiplo de 90°.'); return (angle % 360 + 360) % 360; }
export function pageRange(text, count) {
  if (!text.trim() || text.length > 2000) throw Error('Introduce páginas o rangos, por ejemplo 1-3, 5.');
  const selected = new Set();
  for (const part of text.split(',')) {
    const match = /^\s*(\d+)(?:\s*-\s*(\d+))?\s*$/.exec(part); if (!match) throw Error('Rango no válido. Usa 1-3, 5.');
    const first = Number(match[1]), last = Number(match[2] || match[1]);
    if (first < 1 || first > last || last > count) throw Error('El rango está fuera de la lista de páginas.');
    for (let n = first; n <= last; n++) selected.add(n - 1);
  }
  return selected;
}
export function imagePlacement(width, height, { paper = 'a4', margin = 10 } = {}) {
  if (![width, height].every(n => Number.isFinite(n) && n > 0 && n <= 4096) || width * height > 8000000 || !Number.isFinite(margin) || margin < 0 || margin > 40 || !['a4', 'original'].includes(paper)) throw Error('Tamaño de imagen o márgenes no válidos.');
  const m = margin * 72 / 25.4, landscape = width > height;
  const pageWidth = paper === 'a4' ? landscape ? 841.89 : 595.28 : width * .75 + 2 * m;
  const pageHeight = paper === 'a4' ? landscape ? 595.28 : 841.89 : height * .75 + 2 * m;
  const scale = Math.min((pageWidth - 2 * m) / width, (pageHeight - 2 * m) / height);
  return { pageWidth, pageHeight, x: (pageWidth - width * scale) / 2, y: (pageHeight - height * scale) / 2, width: width * scale, height: height * scale };
}
export function validatePlan(sources, pages) {
  if (!Array.isArray(sources) || !Array.isArray(pages) || !pages.length || pages.length > PAGE_LIMIT) throw Error('Elige entre 1 y 500 páginas.');
  const byId = new Map(sources.map(source => [source.id, source])); let total = 0;
  for (const source of sources) { if (!source.file || source.file.size > PDF_LIMIT || !['pdf', 'image'].includes(source.kind)) throw Error('Origen de páginas no válido.'); total += source.file.size; }
  if (total > PDF_LIMIT) throw Error('Los documentos superan 50 MB en total.');
  const seen = new Set();
  for (const page of pages) {
    const source = byId.get(page.source), key = `${page.source}:${page.index}`;
    if (!source || !Number.isInteger(page.index) || page.index < 0 || page.index >= source.count || seen.has(key)) throw Error('La lista contiene páginas no válidas o repetidas.');
    seen.add(key); rotation(page.rotation);
  }
  return byId;
}
