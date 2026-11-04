import { imagePlacement, rotation, validatePlan, PAGE_LIMIT, PDF_LIMIT } from './model.js';

export function formInfo(doc, lib) {
  const { PDFName, PDFDict } = lib, acro = doc.catalog.lookupMaybe(PDFName.of('AcroForm'), PDFDict);
  if (acro?.has(PDFName.of('XFA'))) return { fields: 0, signature: false, xfa: true, orphan: false };
  const fields = acro ? doc.getForm().getFields() : [], widgets = new Set(fields.flatMap(field => field.acroField.getWidgets().map(widget => widget.dict)));
  let orphan = false;
  for (const page of doc.getPages()) for (const ref of page.node.Annots()?.asArray() || []) {
    const dict = doc.context.lookup(ref); if (dict instanceof PDFDict && dict.get(PDFName.of('Subtype'))?.toString() === '/Widget' && !widgets.has(dict)) orphan = true;
  }
  const signature = doc.context.enumerateIndirectObjects().some(([, obj]) => obj instanceof PDFDict && (obj.has(PDFName.of('ByteRange')) || obj.get(PDFName.of('Type'))?.toString() === '/Sig')) || fields.some(field => field instanceof lib.PDFSignature);
  return { fields: fields.length, signature, xfa: false, orphan };
}
export async function pdfInfo(file, lib) {
  if (file.size > PDF_LIMIT) throw Error('El PDF supera 50 MB.');
  let doc;
  try { doc = await lib.PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false }); } catch (error) { throw Error(/encrypt/i.test(error.message) ? 'No se admiten PDF protegidos con contraseña.' : 'No se pudo leer este PDF. Puede estar dañado o utilizar funciones no admitidas.'); }
  const pages = doc.getPages(); if (!pages.length || pages.length > PAGE_LIMIT) throw Error('El PDF debe tener entre 1 y 500 páginas.');
  const form = formInfo(doc, lib);
  if (form.xfa) throw Error('Los formularios XFA no se admiten en esta versión.');
  return { count: pages.length, rotations: pages.map(page => rotation(page.getRotation().angle)), form };
}
async function loadSources(sources, options, lib) {
  const result = new Map();
  for (const source of sources) {
    let doc;
    if (source.kind === 'image') {
      doc = await lib.PDFDocument.create(); const bytes = await source.file.arrayBuffer(), image = await doc.embedPng(bytes);
      const box = imagePlacement(image.width, image.height, options), page = doc.addPage([box.pageWidth, box.pageHeight]);
      page.drawImage(image, { x: box.x, y: box.y, width: box.width, height: box.height });
    } else {
      doc = await lib.PDFDocument.load(await source.file.arrayBuffer(), { updateMetadata: false });
      const form = formInfo(doc, lib);
      if (form.xfa || form.orphan) throw Error('Este PDF contiene un formulario no compatible. Conserva el original; no se puede generar una copia fiel de sus páginas.');
      if ((form.fields || form.signature) && !options.staticForms) throw Error('Hay formularios o firmas. Para exportar una copia fija debes activar «Convertir formularios y firmas a copia estática».');
      if (form.fields) {
        const fields = doc.getForm();
        for (const field of fields.getFields()) if (!(field instanceof lib.PDFSignature)) fields.markFieldAsDirty(field.ref);
        try { fields.flatten(); } catch { throw Error('No se pudo convertir el formulario a una copia fija sin perder contenido.'); }
      }
    }
    result.set(source.id, doc);
  }
  return result;
}
export async function assemblePDF(sources, pages, options, lib, progress = () => {}) {
  validatePlan(sources, pages); const used = sources.filter(source => pages.some(page => page.source === source.id));
  const docs = await loadSources(used, options, lib), output = await lib.PDFDocument.create(), copies = new Map();
  for (const source of used) {
    const selected = pages.filter(page => page.source === source.id), originals = docs.get(source.id);
    if (selected.some(page => page.index >= originals.getPageCount())) throw Error('La lista no coincide con el documento.');
    const copied = await output.copyPages(originals, selected.map(page => page.index));
    selected.forEach((page, index) => copies.set(`${page.source}:${page.index}`, copied[index]));
  }
  pages.forEach((page, index) => { const copy = copies.get(`${page.source}:${page.index}`); const original = docs.get(page.source).getPage(page.index).getRotation().angle; copy.setRotation(lib.degrees(rotation(original + page.rotation))); output.addPage(copy); progress(Math.round((index + 1) / pages.length * 100)); });
  output.setTitle(options.title || 'Documento Tools'); output.setCreator('Tools'); output.setProducer('Tools / pdf-lib'); output.setLanguage('es-ES');
  const check = formInfo(output, lib); if (check.orphan || check.fields) throw Error('No se ha podido conservar correctamente la apariencia de un formulario.');
  const bytes = await output.save(); if (bytes.length > 100 * 1024 * 1024) throw Error('El PDF generado supera 100 MB. Divide la selección.');
  return bytes;
}
export async function splitPDF(sources, pages, options, lib, zip, progress = () => {}) {
  validatePlan(sources, pages); const files = Object.create(null); let total = 0;
  // Load and flatten only once, then copy each selected page into its own document.
  const combined = await assemblePDF(sources, pages, options, lib), doc = await lib.PDFDocument.load(combined);
  for (let i = 0; i < pages.length; i++) {
    const output = await lib.PDFDocument.create(), [page] = await output.copyPages(doc, [i]); output.addPage(page); const bytes = await output.save(); total += bytes.length;
    if (total > 100 * 1024 * 1024) throw Error('Los PDF separados superan 100 MB. Reduce la selección.');
    files[`pagina-${String(i + 1).padStart(3, '0')}.pdf`] = bytes; progress(Math.round((i + 1) / pages.length * 100));
  }
  return zip(files, { level: 0 });
}
