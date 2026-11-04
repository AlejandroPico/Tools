import { cp, mkdir, rm, writeFile, readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import './vendor.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
if (path.dirname(path.resolve(output)) !== path.resolve(root)) throw new Error('Destino de compilación fuera del proyecto');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'favicon.svg', 'styles.css', 'app.js', 'core', 'tools', 'vendor']) {
  await cp(path.join(root, file), path.join(output, file), { recursive: true });
}
// Each release uses consistent module/style URLs so cached files cannot mix releases.
async function filesIn(directory) {
  const files = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const location = path.join(directory,item.name);
    if (item.isDirectory()) files.push(...await filesIn(location)); else files.push(location);
  }
  return files;
}
const allFiles = await filesIn(output), assets = new Set(allFiles);
const sources = await Promise.all(allFiles.filter(file => !path.relative(output,file).startsWith(`vendor${path.sep}`) && /\.(?:html|css|js)$/.test(file)).sort().map(async file => ({ file, source: await readFile(file,'utf8') })));
const hash = createHash('sha256').update(await readFile(path.join(root,'package-lock.json')));
for (const { file,source } of sources) hash.update(path.relative(output,file)).update(source);
const version = hash.digest('hex').slice(0,12);
for (const { file,source } of sources) {
  const updated = source.replace(/(['"])(\.{1,2}\/[^'"\\\s?#]+\.(?:css|m?js))\1/g,(match,quote,url) => assets.has(path.resolve(path.dirname(file),url)) ? `${quote}${url}?v=${version}${quote}` : match);
  await writeFile(file,updated);
}
await writeFile(path.join(output, '.nojekyll'), '');
console.log('Sitio estático preparado en dist/');
