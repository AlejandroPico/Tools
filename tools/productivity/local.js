import { draftStore } from '../../core/drafts.js';
import { pickFiles } from '../../core/workbench.js';
import { canvasBlob, loadImage } from '../../core/raster.js';
export function localProject(panel, api, key, initial, validate, render) {
  const status = document.createElement('span'); status.className = 'wb-help productivity-draft'; status.setAttribute('role','status');
  panel.innerHTML = '<div class="wb-body"></div>'; panel.firstElementChild.append(status); const store = draftStore(`productivity-${key}`,status); let value = initial, ready = false, disposed = false, history = [];
  function redraw() { if (!ready || disposed) return; render(value); panel.querySelector('.wb-body').append(status); }
  const project = {
    get data() { return value; }, get ready() { return ready; },
    change(fn) { if (!ready) return; try { const next = structuredClone(value); fn(next); const checked = validate(next); history.push(value); if (history.length > 20) history.shift(); value = checked; store.change(value); redraw(); } catch (error) { api.status(error.message,true); } },
    undo() { if (!history.length) return; value = history.pop(); store.change(value); redraw(); },
    redraw,
    save() { return api.save(new Blob([JSON.stringify({ type: `tools-${key}`, version: 1, data: value },null,2)], { type:'application/json' }),`${key}.json`); },
    async open() { const [file] = await pickFiles({ accept: '.json,application/json' }); if (!file || disposed) return; try { if (file.size > 5 * 1024 * 1024) throw Error('El documento supera 5 MB.'); const parsed = JSON.parse(await file.text()); if (parsed.version !== 1 || parsed.type !== `tools-${key}`) throw Error('El archivo corresponde a otro tipo de documento.'); const next = validate(parsed.data); if (disposed) return; history.push(value); if (history.length > 20) history.shift(); value = next; store.change(value); redraw(); api.status('Documento importado.'); } catch (error) { api.status(error.message,true); } },
    preventClose: () => store.pending,
    destroy() { disposed = true; store.destroy(); history = []; },
  };
  store.load(initial).then(data => { if (disposed) return; try { value = validate(data); } catch { value = initial; api.status('El borrador no era válido. Puedes importar una copia.',true); } ready = true; redraw(); }); return project;
}
export const backupButtons = '<button data-project="undo">Deshacer</button><button data-project="save">Guardar documento JSON…</button><button data-project="open">Importar documento JSON</button>';
export function bindBackup(panel,project) { for (const action of ['undo','save','open']) panel.querySelector(`[data-project=${action}]`).onclick = () => project[action](); }
export function saveSVG(api, source, name, png = false) { if (!png) return api.save(new Blob([source],{ type:'image/svg+xml' }),`${name}.svg`); const blob = (async () => { const image = await loadImage(new Blob([source],{ type:'image/svg+xml' })), canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 900; canvas.getContext('2d').drawImage(image,0,0); return canvasBlob(canvas); })(); return api.save(blob,`${name}.png`); }
