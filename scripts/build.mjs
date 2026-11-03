import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
if (path.dirname(path.resolve(output)) !== path.resolve(root)) throw new Error('Destino de compilación fuera del proyecto');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'favicon.svg', 'styles.css', 'app.js', 'core', 'tools']) {
  await cp(path.join(root, file), path.join(output, file), { recursive: true });
}
await writeFile(path.join(output, '.nojekyll'), '');
console.log('Sitio estático preparado en dist/');
