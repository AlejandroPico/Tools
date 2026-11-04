import { workbench } from '../../core/workbench.js';
import { mountExplorer } from './app.js';
import { mountZIP } from './zip-panel.js';
import { mountCompare, mountHex, mountHash, mountGenerate } from './binary-panels.js';

export function mountFiles(root) {
  root.classList.add('file-tools');
  const mounts = { explorer: mountExplorer, zip: mountZIP, compare: mountCompare, hex: mountHex, hash: mountHash, generate: mountGenerate };
  return workbench(root, { explorer: 'Explorador', zip: 'ZIP', compare: 'Comparar', hex: 'Hexadecimal', hash: 'SHA-256', generate: 'Crear archivo' }, (mode, panel, api) => mounts[mode](panel, api), { label: 'Herramientas de archivos', help: 'Los archivos abiertos permanecen en esta ventana hasta cerrarla. Exporta las copias que quieras conservar.' });
}
