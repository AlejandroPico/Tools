import { pickFiles } from '../../core/workbench.js';
import { workerJob } from '../../core/jobs.js';
import { formatBytes } from '../../core/files.js';
import { entryExists, writeNewFile } from './filesystem.js';

export function mountZIP(panel, api) {
  panel.innerHTML = `<div class="wb-body"><div class="wb-toolbar"><button data-do="add">Añadir archivos al ZIP</button><button data-do="folder">Añadir carpeta al ZIP</button><button data-do="create">Crear ZIP</button><button data-do="save" disabled>Guardar ZIP…</button><button data-do="cancel" disabled>Detener operación</button></div><ul class="wb-list zip-inputs" aria-label="Archivos para comprimir"></ul><p class="wb-help">Puedes cambiar las rutas dentro del ZIP. Hasta 2.000 archivos y 100 MB de entrada. La carpeta original no se modifica.</p><hr><div class="wb-toolbar"><button data-do="open">Abrir ZIP</button><label>Archivo del ZIP <select id="zip-entry" disabled></select></label><button data-do="extract" disabled>Extraer archivo seleccionado</button><button data-do="extract-folder" disabled>Extraer en carpeta…</button></div><p class="zip-summary wb-help">Abre un ZIP para ver su contenido.</p><ul class="wb-list zip-contents" aria-label="Contenido del ZIP"></ul><p class="wb-help">Admite ZIP estándar sin contraseña, con compresión Almacenar o Deflate. Hasta 100 MB descomprimidos. Extraer en carpeta crea una carpeta nueva en el destino elegido. Si el navegador no permite elegir carpetas, puedes guardar cada archivo por separado.</p></div>`;
  const q = selector => panel.querySelector(selector), job = workerJob(new URL('./archive-worker.js', import.meta.url));
  let inputs = [], archive = null, entries = [], prepared = null, running = false, cancelled = false, disposed = false, unexported = false;
  function controls() {
    for (const element of panel.querySelectorAll('button,input,select')) element.disabled = running;
    q('[data-do=cancel]').disabled = !running;
    if (!running) {
      q('[data-do=create]').disabled = !inputs.length; q('[data-do=save]').disabled = !prepared;
      q('#zip-entry').disabled = !entries.some(entry => !entry.directory);
      q('[data-do=extract]').disabled = q('#zip-entry').disabled;
      q('[data-do=extract-folder]').disabled = q('#zip-entry').disabled || !('showDirectoryPicker' in window);
    }
  }
  async function run(payload) {
    running = true; cancelled = false; controls(); api.status('Procesando ZIP…');
    try { return await job.run(payload); } finally { running = false; if (!disposed) controls(); }
  }
  function renderInputs() {
    const list = q('.zip-inputs'); list.replaceChildren();
    inputs.forEach((entry, index) => {
      const row = document.createElement('li'), name = document.createElement('input'), size = document.createElement('span'), remove = document.createElement('button');
      name.className = 'grow'; name.value = entry.name; name.setAttribute('aria-label', `Ruta del archivo ${index + 1} en ZIP`);
      name.oninput = () => { entry.name = name.value; prepared = null; unexported = false; controls(); };
      size.className = 'wb-help'; size.textContent = formatBytes(entry.file.size);
      remove.textContent = 'Quitar'; remove.setAttribute('aria-label', `Quitar archivo ${index + 1} del ZIP`);
      remove.onclick = () => { inputs.splice(index, 1); prepared = null; unexported = false; renderInputs(); controls(); };
      row.append(name, size, remove); list.append(row);
    }); controls();
  }
  for (const directory of [false, true]) q(directory ? '[data-do=folder]' : '[data-do=add]').onclick = async () => {
    const files = await pickFiles({ multiple: true, directory }); if (disposed || !files.length) return;
    if (inputs.length + files.length > 2000 || [...inputs.map(entry => entry.file), ...files].reduce((n, file) => n + file.size, 0) > 100 * 1024 * 1024) { api.status('La selección supera 2.000 archivos o 100 MB.', true); return; }
    inputs.push(...files.map(file => ({ file, name: file.webkitRelativePath || file.name }))); prepared = null; unexported = false; renderInputs();
  };
  q('[data-do=create]').onclick = async () => { try { const result = await run({ action: 'create', entries: inputs }); if (disposed) return; prepared = new Blob([result.data], { type: 'application/zip' }); unexported = true; controls(); api.status(`ZIP preparado · ${formatBytes(prepared.size)}. Pulsa Guardar ZIP para conservarlo.`); } catch (error) { api.status(error.message, true); } };
  q('[data-do=save]').onclick = async () => { if (!prepared) return; const result = await api.save(prepared, 'archivos.zip'); if (['saved', 'downloaded'].includes(result)) unexported = false; };
  q('[data-do=open]').onclick = async () => {
    const [file] = await pickFiles({ accept: '.zip,application/zip' }); if (!file || disposed) return;
    try {
      const result = await run({ action: 'inspect', file }); if (disposed) return;
      archive = file; entries = result.entries; const list = q('.zip-contents'), select = q('#zip-entry'); list.replaceChildren(); select.replaceChildren();
      for (const entry of entries) {
        const row = document.createElement('li'), name = document.createElement('span'), size = document.createElement('span'); name.className = 'grow'; name.textContent = entry.name; size.className = 'wb-help'; size.textContent = entry.directory ? 'Carpeta' : formatBytes(entry.size); row.append(name, size); list.append(row);
        if (!entry.directory) { const option = document.createElement('option'); option.value = entry.name; option.textContent = entry.name; select.append(option); }
      }
      q('.zip-summary').textContent = `${file.name} · ${entries.length} entradas · ${formatBytes(entries.reduce((n, entry) => n + entry.size, 0))} descomprimidos`;
      controls(); api.status('Contenido del ZIP leído.');
    } catch (error) { api.status(error.message, true); }
  };
  q('[data-do=extract]').onclick = async () => {
    if (!archive || !q('#zip-entry').value) return;
    try { const result = await run({ action: 'extract', file: archive, names: [q('#zip-entry').value] }); if (disposed) return; const file = result.files[0]; const row = document.createElement('div'); row.className = 'wb-toolbar zip-extracted'; q('.zip-extracted')?.remove(); const label = document.createElement('span'); label.className = 'wb-help'; label.textContent = `${file.name} · ${formatBytes(file.data.length)} · extraído y verificado`; const save = document.createElement('button'); save.textContent = 'Guardar copia extraída…'; save.onclick = () => api.save(new Blob([file.data]), file.name.split('/').at(-1)); row.append(label, save); q('.zip-summary').after(row); api.status('Archivo extraído. Pulsa Guardar copia extraída para elegir el destino o descargarlo.'); } catch (error) { api.status(error.message, true); }
  };
  q('[data-do=extract-folder]').onclick = async () => {
    if (!archive || running) return;
    let destination;
    try { destination = await window.showDirectoryPicker({ mode: 'readwrite' }); } catch (error) { if (error.name !== 'AbortError') api.status(error.message, true); return; }
    try {
      const result = await run({ action: 'extract', file: archive }); if (disposed) return;
      running = true; cancelled = false; controls();
      let name; do { name = `Tools-extraido-${crypto.randomUUID().slice(0, 8)}`; } while (await entryExists(destination, name));
      const target = await destination.getDirectoryHandle(name, { create: true }); let count = 0;
      for (const entry of entries.filter(item => item.directory)) { if (cancelled || disposed) break; let folder = target; for (const part of entry.name.split('/').filter(Boolean)) folder = await folder.getDirectoryHandle(part, { create: true }); }
      for (const file of result.files) {
        if (cancelled || disposed) break;
        const parts = file.name.split('/'), filename = parts.pop(); let folder = target;
        for (const part of parts) folder = await folder.getDirectoryHandle(part, { create: true });
        await writeNewFile(folder, filename, new Blob([file.data])); count++; api.status(`Extrayendo ${count} de ${result.files.length} archivos…`);
      }
      api.status(`${cancelled ? 'Extracción detenida' : 'Extracción completada'}: ${count} archivos guardados en ${name}.`);
    } catch (error) { api.status(error.message, true); } finally { running = false; if (!disposed) controls(); }
  };
  q('[data-do=cancel]').onclick = () => { cancelled = true; job.cancel(); };
  controls();
  return { preventClose: () => running || unexported, destroy() { disposed = true; cancelled = true; job.cancel(); prepared = null; archive = null; inputs = []; } };
}
