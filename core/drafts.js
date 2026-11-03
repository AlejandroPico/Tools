import { getData, setData } from './storage.js';

export function draftStore(key, status) {
  let value, version = 0, saved = 0, ready = false, writable = true, disposed = false, timer, queue = Promise.resolve();
  function message(text, error = false) { if (!disposed && status) { status.textContent = text; status.classList.toggle('error-text', error); } }
  function flush() {
    clearTimeout(timer);
    if (!ready || version === saved) return queue;
    if (!writable) { message('Guardado local no disponible. Descarga tu trabajo antes de cerrar.', true); return queue; }
    const revision = version, snapshot = structuredClone(value);
    message('Guardando borrador…');
    queue = queue.catch(() => {}).then(() => setData(key, snapshot)).then(() => {
      saved = revision; message(saved === version ? 'Borrador guardado en este navegador' : 'Guardando borrador…');
    }).catch(() => message('No se pudo guardar. Descarga una copia para conservar el trabajo.', true));
    return queue;
  }
  return {
    async load(fallback) {
      try { value = (await getData(key)) ?? fallback; message('Borrador local'); }
      catch { value = fallback; writable = false; message('No se pudieron cargar los borradores. Puedes trabajar y descargar el resultado.', true); }
      ready = true; return value;
    },
    change(next) { value = next; version++; message('Cambios pendientes…'); clearTimeout(timer); timer = setTimeout(flush, 400); },
    get pending() { return version > saved; },
    flush,
    destroy() { clearTimeout(timer); flush(); disposed = true; },
  };
}
