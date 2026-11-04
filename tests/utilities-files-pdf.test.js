import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { zipSync, inflateSync, unzipSync, strToU8 } from 'fflate';
import * as lib from 'pdf-lib';
import { randomBelow, sampleIntegers, generatePassword, drawNames, barcodeValue, checkDigit } from '../tools/utilities/model.js';
import { inspectZIP, extractZIP, createZIP, zipPath, crc32 } from '../tools/file-explorer/archive.js';
import { byteValue, byteOffset, hexBytes, compareFiles, makeBytes } from '../tools/file-explorer/binary.js';
import { pageRange, rotation, imagePlacement, validatePlan } from '../tools/pdf/model.js';
import { assemblePDF, splitPDF, pdfInfo, formInfo } from '../tools/pdf/engine.js';

test('números criptográficos respetan extremos seguros, unicidad e intervalos completos', () => {
  assert.equal(randomBelow(1), 0n); assert.throws(() => randomBelow(0));
  const values = sampleIntegers(-10, 10, 21); assert.deepEqual([...values].sort((a, b) => a - b), Array.from({ length: 21 }, (_, i) => i - 10));
  const large = sampleIntegers(-Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 1000); assert.equal(new Set(large).size, 1000); assert.ok(large.every(Number.isSafeInteger));
  assert.deepEqual(sampleIntegers(7, 7, 3, true), [7, 7, 7]); assert.throws(() => sampleIntegers(0, 1, 3)); assert.throws(() => sampleIntegers(2, 1, 1)); assert.throws(() => sampleIntegers(0, Infinity, 1));
});
test('contraseñas contienen los grupos elegidos y permiten excluir caracteres ambiguos', () => {
  for (let i = 0; i < 10; i++) { const value = generatePassword(24); assert.equal(value.length, 24); for (const pattern of [/[a-z]/, /[A-Z]/, /\d/, /[^a-z\d]/i]) assert.match(value, pattern); }
  assert.match(generatePassword(256, { upper: false, digits: false, symbols: false, clear: true }), /^[a-km-np-z]{256}$/);
  assert.throws(() => generatePassword(20, { lower: false, upper: false, digits: false, symbols: false })); assert.throws(() => generatePassword(3));
});
test('sorteos unifican nombres cuando se solicita y no repiten participaciones', () => {
  const result = drawNames('Ana\n Luis \nAna\n\nMarta', 3); assert.equal(result.total, 3); assert.deepEqual(new Set(result.winners), new Set(['Ana', 'Luis', 'Marta']));
  assert.equal(drawNames('Ana\nAna', 2, false).total, 2); assert.throws(() => drawNames('Ana', 2));
});
test('códigos de barras calculan y verifican cifras de control conocidas', () => {
  assert.equal(checkDigit('400638133393'), '1'); assert.equal(barcodeValue('400638133393', 'EAN13'), '4006381333931'); assert.equal(barcodeValue('9638507', 'EAN8'), '96385074');
  assert.equal(barcodeValue('03600029145', 'UPC'), '036000291452'); assert.equal(barcodeValue('tools-24', 'CODE39'), 'TOOLS-24');
  assert.throws(() => barcodeValue('4006381333932', 'EAN13')); assert.throws(() => barcodeValue('á', 'CODE128')); assert.throws(() => barcodeValue('*', 'CODE39'));
});
test('ZIP conserva rutas UTF-8, datos binarios y comprueba CRC', async () => {
  const bytes = await createZIP([{ name: 'carpeta/á.txt', file: new Blob(['Hola 🛠']) }, { name: 'bytes.bin', file: new Blob([Uint8Array.of(0, 255, 1)]) }], zipSync);
  assert.equal(inspectZIP(bytes).length, 2); const files = extractZIP(bytes, inflateSync); assert.equal(new TextDecoder().decode(files[0].data), 'Hola 🛠'); assert.deepEqual([...files[1].data], [0, 255, 1]);
  assert.equal(crc32(strToU8('123456789')), 0xcbf43926); assert.equal(extractZIP(bytes, inflateSync, ['bytes.bin']).length, 1);
  const broken = bytes.slice(), entry = inspectZIP(broken)[1]; broken[entry.dataOffset] ^= 1; assert.throws(() => extractZIP(broken, inflateSync));
});
test('ZIP rechaza traversal, nombres conflictivos, cifrado, ZIP64 y tamaños falsificados', async () => {
  for (const name of ['../a', '/a', 'C:/a', 'a\\b', 'a/../../b', '__proto__/x', 'NUL.txt', 'a//b']) assert.throws(() => zipPath(name));
  assert.throws(() => inspectZIP(zipSync({ '../a': Uint8Array.of(1) }))); assert.throws(() => inspectZIP(new Uint8Array(20)));
  await assert.rejects(createZIP([{ name: 'A', file: new Blob() }, { name: 'a', file: new Blob() }], zipSync));
  await assert.rejects(createZIP([{ name: 'a', file: new Blob() }, { name: 'a/b', file: new Blob() }], zipSync));
  const zip = zipSync({ 'x.txt': new Uint8Array(10000) }), info = inspectZIP(zip), central = info[0].dataOffset + info[0].compressed;
  const encrypted = zip.slice(); new DataView(encrypted.buffer).setUint16(central + 8, 1, true); assert.throws(() => inspectZIP(encrypted), /cifrado/);
  const zip64 = zip.slice(); new DataView(zip64.buffer).setUint32(central + 24, 0xffffffff, true); assert.throws(() => inspectZIP(zip64), /ZIP64/);
  const short = zip.slice(); new DataView(short.buffer).setUint32(central + 24, 1, true); assert.throws(() => extractZIP(short, inflateSync), /integridad/);
});
test('editor hexadecimal valida bytes, límites y bloques sin alterar otras posiciones', () => {
  assert.equal(byteValue('ff'), 255); assert.deepEqual([...hexBytes('00 FF\n42')], [0, 255, 66]); assert.equal(byteOffset('0x10', 32), 16);
  for (const value of ['f', 'gg', '100']) assert.throws(() => byteValue(value)); assert.throws(() => byteOffset('', 20)); assert.throws(() => byteOffset('20', 20)); assert.throws(() => hexBytes('ABC'));
  assert.deepEqual([...makeBytes(3, 'byte', 'AA')], [170, 170, 170]); assert.equal(makeBytes(0, 'zero').length, 0); assert.throws(() => makeBytes(33 * 1024 * 1024, 'zero'));
});
test('comparación binaria detecta bytes distintos, colas y archivos vacíos', async () => {
  assert.equal((await compareFiles(new Blob(), new Blob())).equal, true);
  const result = await compareFiles(new Blob([Uint8Array.of(0, 1, 2)]), new Blob([Uint8Array.of(0, 9, 2, 3)]));
  assert.equal(result.first, 1); assert.equal(result.differences, 2); assert.deepEqual(result.samples[1], { offset: 3, a: null, b: 3 });
  await assert.rejects(compareFiles(new Blob(['x']), new Blob(['y']), { cancelled: () => true }), /cancelada/);
});
test('rangos PDF, rotación y tamaños de imagen conservan proporciones', () => {
  assert.deepEqual([...pageRange('1-3, 5, 2', 5)], [0, 1, 2, 4]); for (const text of ['', '0', '4-2', '1-6', 'x']) assert.throws(() => pageRange(text, 5));
  assert.equal(rotation(-90), 270); assert.equal(rotation(450), 90); assert.throws(() => rotation(45));
  const box = imagePlacement(800, 400); assert.ok(box.pageWidth > box.pageHeight); assert.equal(box.width / box.height, 2); assert.ok(box.x > 0);
  assert.deepEqual(imagePlacement(400, 200, { paper: 'original', margin: 0 }), { pageWidth: 300, pageHeight: 150, x: 0, y: 0, width: 300, height: 150 });
  assert.throws(() => imagePlacement(8000, 400));
});
async function fixture(widths = [300, 400], form = false) {
  const doc = await lib.PDFDocument.create(); for (const width of widths) { const page = doc.addPage([width, 200]); page.drawText(`PAGE ${width}`, { x: 20, y: 120, size: 20 }); }
  if (form) { const field = doc.getForm().createTextField('nombre'); field.setText('Tools'); field.addToPage(doc.getPage(0), { x: 20, y: 30, width: 180, height: 35 }); }
  return new File([await doc.save()], 'prueba.pdf', { type: 'application/pdf' });
}
test('PDF une, extrae y reordena páginas conservando sus tamaños y giros', async () => {
  const file = await fixture(), second = await fixture([500]), info = await pdfInfo(file, lib); assert.equal(info.count, 2);
  const sources = [{ id: 'a', file, kind: 'pdf', count: 2 }, { id: 'b', file: second, kind: 'pdf', count: 1 }];
  const pages = [{ source: 'b', index: 0, rotation: 90 }, { source: 'a', index: 1, rotation: 180 }];
  const bytes = await assemblePDF(sources, pages, {}, lib), doc = await lib.PDFDocument.load(bytes); assert.equal(doc.getPageCount(), 2); assert.deepEqual(doc.getPages().map(page => page.getWidth()), [500, 400]); assert.deepEqual(doc.getPages().map(page => page.getRotation().angle), [90, 180]);
  assert.throws(() => validatePlan(sources, [...pages, pages[0]])); await assert.rejects(pdfInfo(new Blob(['bad PDF']), lib), /leer/);
});
test('PDF separa la selección en un ZIP de documentos válidos', async () => {
  const file = await fixture(), sources = [{ id: 'a', file, kind: 'pdf', count: 2 }], pages = [{ source: 'a', index: 1, rotation: 90 }, { source: 'a', index: 0, rotation: 0 }];
  const bytes = await splitPDF(sources, pages, {}, lib, zipSync), files = unzipSync(bytes); assert.equal(Object.keys(files).length, 2);
  const first = await lib.PDFDocument.load(files['pagina-001.pdf']); assert.equal(first.getPageCount(), 1); assert.equal(first.getPage(0).getWidth(), 400); assert.equal(first.getPage(0).getRotation().angle, 90);
});
test('convertir imágenes a PDF mantiene contenido embebido y tamaño solicitado', async () => {
  const file = new Blob([await readFile(new URL('./fixtures/creative.png', import.meta.url))], { type: 'image/png' });
  const bytes = await assemblePDF([{ id: 'image', file, kind: 'image', count: 1 }], [{ source: 'image', index: 0, rotation: 0 }], { paper: 'original', margin: 0 }, lib);
  const doc = await lib.PDFDocument.load(bytes); assert.deepEqual(doc.getPage(0).getSize(), { width: 60, height: 45 }); assert.ok(doc.getPage(0).node.Resources().has(lib.PDFName.of('XObject')));
});
test('formularios requieren elección explícita antes de crear una copia estática', async () => {
  const file = await fixture([300], true), source = { id: 'a', file, kind: 'pdf', count: 1 }, pages = [{ source: 'a', index: 0, rotation: 0 }];
  assert.equal((await pdfInfo(file, lib)).form.fields, 1);
  await assert.rejects(assemblePDF([source], pages, {}, lib), /copia fija/);
  const bytes = await assemblePDF([source], pages, { staticForms: true }, lib), doc = await lib.PDFDocument.load(bytes), info = formInfo(doc, lib); assert.equal(info.fields, 0); assert.equal(info.orphan, false); assert.equal(doc.getPageCount(), 1);
  assert.equal((await lib.PDFDocument.load(await file.arrayBuffer())).getForm().getTextField('nombre').getText(), 'Tools');
});
