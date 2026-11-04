import { build } from 'esbuild';
import { mkdir, cp, readFile, readdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'vendor');
if (path.dirname(path.resolve(output)) !== path.resolve(root)) throw Error('Destino de bibliotecas fuera del proyecto');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const entries = {
  'pdf-lib': "export * from 'pdf-lib';",
  'pdfjs': "export * from 'pdfjs-dist/build/pdf.mjs';",
  'fflate': "export * from 'fflate';",
  'qrcode': "export {default} from 'qrcode';",
  'barcode': "export {default} from 'jsbarcode';",
};
await Promise.all(Object.entries(entries).map(([name, contents]) => build({
  stdin: { contents, resolveDir: root, sourcefile: `${name}-entry.js` },
  outfile: path.join(output, `${name}.js`), bundle: true, format: 'esm', platform: 'browser',
  target: 'es2022', minify: true, legalComments: 'eof',
})));
const pdf = path.join(root, 'node_modules/pdfjs-dist');
await cp(path.join(pdf, 'build/pdf.worker.mjs'), path.join(output, 'pdf.worker.mjs'));
for (const directory of ['cmaps', 'standard_fonts', 'wasm', 'iccs']) {
  await cp(path.join(pdf, directory), path.join(output, directory), { recursive: true }).catch(error => { if (error.code !== 'ENOENT') throw error; });
}
const licenses = [];
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const location = path.join(directory, entry.name);
    if (entry.name.startsWith('@')) { await collect(location); continue; }
    try {
      const metadata = JSON.parse(await readFile(path.join(location, 'package.json'), 'utf8'));
      for (const file of await readdir(location)) if (/^(?:LICENSE|COPYING|NOTICE)(?:\.|$)/i.test(file)) {
        licenses.push(`${metadata.name}@${metadata.version} — ${file}\n${await readFile(path.join(location, file), 'utf8')}\n`);
      }
      await collect(path.join(location, 'node_modules')).catch(error => { if (error.code !== 'ENOENT') throw error; });
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
await collect(path.join(root, 'node_modules'));
await writeFile(path.join(output, 'LICENSES.txt'), licenses.join('\n--------------------\n\n'));
console.log('Bibliotecas preparadas para procesamiento local.');
