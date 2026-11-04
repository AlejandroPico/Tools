import { mkdir, writeFile } from 'node:fs/promises';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { zipSync, strToU8 } from 'fflate';
import { fileURLToPath } from 'node:url';
const directory = new URL('../.local/qa789/', import.meta.url); await mkdir(directory, { recursive: true });
const first = await PDFDocument.create();
for (const [index, color] of [rgb(.85, .2, .2), rgb(.2, .35, .85)].entries()) { const page = first.addPage([300, 400]); page.drawRectangle({ x: 20, y: 20, width: 260, height: 360, color }); page.drawText(`Tools - pagina ${index + 1}`, { x: 35, y: 200, size: 20, color: rgb(1, 1, 1) }); if (index === 1) page.setRotation(degrees(90)); }
await writeFile(new URL('dos-paginas.pdf', directory), await first.save());
const second = await PDFDocument.create(), page = second.addPage([250, 250]); page.drawRectangle({ x: 10, y: 10, width: 230, height: 230, color: rgb(.15, .6, .35) }); page.drawText('Tools - documento B', { x: 20, y: 120, size: 16, color: rgb(1, 1, 1) }); await writeFile(new URL('otro-documento.pdf', directory), await second.save());
const form = await PDFDocument.create(), formPage = form.addPage([400, 220]); formPage.drawText('Formulario de prueba', { x: 25, y: 170, size: 20 }); const field = form.getForm().createTextField('nombre'); field.setText('Tools'); field.addToPage(formPage, { x: 25, y: 70, width: 300, height: 50 }); await writeFile(new URL('formulario.pdf', directory), await form.save());
const a = Uint8Array.from({ length: 32 }, (_, i) => i), b = new Uint8Array(33); b.set(a); b[10] = 255; b[32] = 42;
await writeFile(new URL('comparar-a.bin', directory), a); await writeFile(new URL('comparar-b.bin', directory), b); await writeFile(new URL('hola.txt', directory), 'Hola Tools\n');
await writeFile(new URL('ejemplo.zip', directory), zipSync({ 'carpeta/hola.txt': strToU8('Hola Tools\n'), 'datos.bin': a }));
console.log(`Archivos de ejemplo preparados en ${fileURLToPath(directory)}`);
