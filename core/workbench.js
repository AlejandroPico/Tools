import { saveFile, downloadFile } from './files.js';

export function pickFiles({ accept = '', multiple = false, directory = false } = {}) {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = accept; input.multiple = multiple;
    if (directory) input.setAttribute('webkitdirectory', '');
    input.hidden = true; document.body.append(input);
    const finish = files => { input.remove(); resolve(files); };
    input.onchange = () => finish([...input.files]); input.oncancel = () => finish([]); input.click();
  });
}

export function workbench(root, modes, mount, { label = 'Herramientas', help = '' } = {}) {
  root.innerHTML = `<div class="workbench"><nav class="wb-tabs" role="tablist"></nav><div class="wb-content"></div><footer class="wb-status wb-export-footer"><span class="wb-feedback" role="status"></span><label>Al guardar <select aria-label="Destino de exportación"><option value="save">Elegir destino</option><option value="download">Descargar</option></select></label></footer></div>`;
  const tabs = root.querySelector('.wb-tabs'), content = root.querySelector('.wb-content');
  tabs.setAttribute('aria-label', label);
  const controllers = new Map(), panels = new Map(); let active, disposed = false;
  function status(text, error = false) {
    if (disposed) return;
    const target = root.querySelector('.wb-feedback'); target.textContent = text; target.classList.toggle('error-text', error);
  }
  async function save(blob, filename) {
    try {
      let result;
      if (root.querySelector('footer select').value === 'download') { downloadFile(await blob, filename); result = 'downloaded'; }
      else result = await saveFile(blob, filename);
      if (result !== 'cancelled') status(result === 'saved' ? 'Archivo guardado.' : 'Descarga iniciada. La ubicación depende de los ajustes del navegador.');
      return result;
    } catch (error) { status(error.message || 'No se pudo guardar el archivo.', true); return 'failed'; }
  }
  function activate(key) {
    if (disposed) return; active = key;
    for (const tab of tabs.children) { const selected = tab.dataset.mode === key; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; }
    if (!panels.has(key)) {
      const panel = document.createElement('div'); panel.className = 'wb-panel'; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-label', modes[key]);
      panels.set(key, panel); content.append(panel); controllers.set(key, mount(key, panel, { status, save }) || {});
    }
    for (const [name, panel] of panels) panel.hidden = name !== key;
  }
  for (const [key, name] of Object.entries(modes)) { const button = document.createElement('button'); button.textContent = name; button.dataset.mode = key; button.setAttribute('role', 'tab'); button.onclick = () => activate(key); tabs.append(button); }
  tabs.onkeydown = event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); const keys = Object.keys(modes), index = keys.indexOf(active);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? keys.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + keys.length) % keys.length;
    activate(keys[next]); tabs.children[next].focus();
  };
  status(help); activate(Object.keys(modes)[0]);
  return { activate, status, preventClose: () => [...controllers.values()].some(controller => controller.preventClose?.()), closeMessage: 'Hay trabajo en curso o cambios sin exportar. ¿Cerrar esta ventana?', destroy() { disposed = true; for (const controller of controllers.values()) controller.destroy?.(); } };
}
