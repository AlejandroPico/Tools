import { icon, notify } from '../../core/ui.js';
import { saveFile, downloadFile, formatBytes } from '../../core/files.js';
import { buildFileTree, sortEntries, previewKind } from './model.js';

export function mountExplorer(root) {
  root.innerHTML = `<div class="explorer-shell"><div class="explorer-toolbar"><button class="primary-button explorer-folder" data-initial-focus>${icon('folder')} Abrir carpeta</button><button class="secondary-button explorer-files">${icon('file')} Abrir archivos</button><button class="secondary-button explorer-refresh" title="Actualizar carpeta" aria-label="Actualizar carpeta" disabled>↻</button><input class="explorer-search" type="search" aria-label="Filtrar archivos de esta carpeta" placeholder="Buscar en esta carpeta…" disabled></div><div class="explorer-location"><button class="explorer-up" aria-label="Subir a la carpeta superior" title="Subir" disabled>${icon('arrow')}</button><nav class="explorer-breadcrumbs" aria-label="Ruta de la carpeta"><span>Este dispositivo</span></nav><span class="readonly-badge">Solo lectura</span></div><div class="explorer-body"><div class="explorer-file-panel"><div class="explorer-columns"><span>Nombre</span><span>Tamaño</span></div><ul class="explorer-list" aria-label="Archivos y carpetas"></ul><div class="explorer-empty empty-state"><span class="explorer-empty-icon">${icon('folder')}</span><strong>Tus archivos, en tu espacio.</strong><p>Elige una carpeta o varios archivos para explorarlos. Se quedan en tu equipo.</p><span>Vista previa · Navegación · Descarga</span></div></div><aside class="explorer-preview" aria-label="Vista previa del archivo" hidden><div class="preview-header"><strong>Vista previa</strong><button class="preview-close" aria-label="Cerrar vista previa">×</button></div><div class="preview-content"></div><div class="preview-metadata"></div><div class="preview-actions"><button class="primary-button explorer-save">${icon('download')} Guardar copia…</button><button class="secondary-button explorer-download">Descargar</button></div></aside></div><footer class="explorer-status status-text" role="status">Selecciona lo que quieres abrir. Tools no accede al resto del equipo.</footer><input type="file" class="explorer-file-input" multiple hidden><input type="file" class="explorer-directory-input" webkitdirectory multiple hidden></div>`;
  const $ = selector => root.querySelector(selector);
  let trail = [], entries = [], selectedFile = null, selectedNode = null, previewUrl = null;
  let disposed = false, directoryVersion = 0, previewVersion = 0, busy = false;
  const status = $('.explorer-status');
  if (!('showSaveFilePicker' in window)) $('.explorer-save').hidden = true;

  function clearPreview() {
    ++previewVersion;
    $('.preview-content').querySelectorAll('audio,video').forEach(media => { media.pause(); media.removeAttribute('src'); media.load(); });
    $('.explorer-preview').hidden = true;
    $('.preview-content').replaceChildren();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null; selectedFile = null; selectedNode = null;
  }
  async function navigate(nextTrail) {
    const version = ++directoryVersion;
    clearPreview();
    trail = nextTrail;
    $('.explorer-search').value = '';
    status.classList.remove('error-text');
    status.textContent = 'Leyendo carpeta…';
    try {
      const node = trail.at(-1).node;
      const children = [];
      let limited = false;
      if (node.children) children.push(...node.children.values());
      else {
        for await (const child of node.values()) {
          if (version !== directoryVersion || disposed) return;
          if (children.length >= 2000) { limited = true; break; }
          children.push(child);
        }
      }
      if (version !== directoryVersion || disposed) return;
      entries = sortEntries(children);
      $('.explorer-search').disabled = false;
      $('.explorer-up').disabled = trail.length <= 1;
      $('.explorer-refresh').disabled = false;
      const breadcrumbs = $('.explorer-breadcrumbs'); breadcrumbs.replaceChildren();
      trail.forEach((part, index) => {
        const button = document.createElement('button'); button.textContent = part.name; button.title = part.name;
        button.addEventListener('click', () => navigate(trail.slice(0, index + 1)));
        if (index === trail.length - 1) button.setAttribute('aria-current', 'location');
        breadcrumbs.append(button);
        if (index < trail.length - 1) breadcrumbs.append(document.createTextNode(' / '));
      });
      renderEntries();
      status.textContent = limited ? 'Mostrando los primeros 2000 elementos. El filtro busca en esos elementos.' : `${entries.length} ${entries.length === 1 ? 'elemento' : 'elementos'} · Archivos locales · Solo lectura`;
    } catch (error) {
      if (version !== directoryVersion || disposed) return;
      entries = []; renderEntries();
      status.classList.add('error-text');
      status.textContent = error.name === 'NotAllowedError' ? 'Se ha perdido el permiso de lectura. Vuelve a abrir la carpeta para autorizarla.' : 'No se pudo leer esta carpeta. Puedes volver a seleccionarla.';
    }
  }
  function renderEntries() {
    const list = $('.explorer-list'); list.replaceChildren();
    const query = $('.explorer-search').value.toLocaleLowerCase('es');
    const filtered = entries.filter(entry => entry.name.toLocaleLowerCase('es').includes(query));
    $('.explorer-empty').hidden = trail.length > 0;
    if (!filtered.length && trail.length) {
      const empty = document.createElement('li'); empty.className = 'explorer-no-results'; empty.textContent = query ? 'No hay coincidencias en esta carpeta.' : 'Esta carpeta está vacía.'; list.append(empty);
    }
    for (const entry of filtered) {
      const item = document.createElement('li');
      const button = document.createElement('button'); button.className = 'file-row';
      if (entry === selectedNode) button.classList.add('selected');
      button.innerHTML = `${icon(entry.kind === 'directory' ? 'folder' : 'file')}<span class="file-name"></span><span class="file-size"></span>`;
      button.querySelector('.file-name').textContent = entry.name;
      button.querySelector('.file-size').textContent = entry.kind === 'directory' ? 'Carpeta' : entry.file ? formatBytes(entry.file.size) : '—';
      button.title = `${entry.kind === 'directory' ? 'Abrir carpeta' : 'Ver archivo'}: ${entry.name}`;
      button.classList.toggle('directory-row', entry.kind === 'directory');
      button.addEventListener('click', () => {
        if (entry.kind === 'directory') navigate([...trail, { name: entry.name, node: entry }]);
        else preview(entry);
      });
      item.append(button); list.append(item);
    }
  }
  async function preview(entry) {
    clearPreview();
    const version = previewVersion;
    status.classList.remove('error-text');
    status.textContent = 'Abriendo archivo…';
    try {
      const file = await entry.getFile();
      if (disposed || version !== previewVersion) return;
      selectedFile = file; selectedNode = entry;
      const container = $('.preview-content');
      const heading = document.createElement('h3'); heading.textContent = file.name; container.append(heading);
      const kind = previewKind(file);
      if (kind === 'text') {
        const text = await file.slice(0, 200_000).text();
        if (disposed || version !== previewVersion) return;
        const pre = document.createElement('pre'); pre.textContent = text; pre.tabIndex = 0; container.append(pre);
        if (file.size > 200_000) { const note = document.createElement('p'); note.className = 'status-text'; note.textContent = 'Vista parcial: primeros 200 KB. La descarga conserva el archivo completo.'; container.append(note); }
      } else if (['image', 'audio', 'video'].includes(kind)) {
        previewUrl = URL.createObjectURL(file);
        const media = document.createElement(kind === 'image' ? 'img' : kind);
        if (kind === 'image') media.alt = file.name;
        else { media.controls = true; media.preload = 'metadata'; }
        media.addEventListener('error', () => {
          if (disposed || version !== previewVersion) return;
          const notice = document.createElement('p'); notice.className = 'status-text'; notice.textContent = 'Este navegador no puede previsualizar el formato. Puedes descargar el archivo completo.'; media.replaceWith(notice);
        });
        media.src = previewUrl; container.append(media);
      } else {
        const notice = document.createElement('p'); notice.className = 'status-text'; notice.textContent = 'Este formato no tiene vista previa. Puedes guardar una copia del archivo original.'; container.append(notice);
      }
      const modified = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(file.lastModified));
      $('.preview-metadata').textContent = `${formatBytes(file.size)} · ${file.type || 'Tipo no indicado'} · Modificado: ${modified}`;
      $('.explorer-preview').hidden = false;
      status.textContent = 'Vista previa local. El archivo original no se modifica.';
      renderEntries();
    } catch {
      if (disposed || version !== previewVersion) return;
      clearPreview();
      status.classList.add('error-text');
      status.textContent = 'No se pudo abrir el archivo. Puede haberse movido o haber cambiado el permiso.';
    }
  }
  $('.explorer-folder').addEventListener('click', async () => {
    if (!('showDirectoryPicker' in window)) { $('.explorer-directory-input').click(); return; }
    try {
      const handle = await window.showDirectoryPicker({ mode: 'read' });
      if (!disposed) navigate([{ name: handle.name, node: handle }]);
    } catch (error) {
      if (error.name !== 'AbortError') notify('No se pudo abrir la carpeta. Prueba con «Abrir archivos».');
    }
  });
  $('.explorer-files').addEventListener('click', () => $('.explorer-file-input').click());
  for (const selector of ['.explorer-file-input', '.explorer-directory-input']) {
    $(selector).addEventListener('change', event => {
      if (!event.target.files.length) return;
      const tree = buildFileTree(event.target.files);
      navigate([{ name: tree.name, node: tree }]);
      event.target.value = '';
    });
  }
  $('.explorer-up').addEventListener('click', () => { if (trail.length > 1) navigate(trail.slice(0, -1)); });
  $('.explorer-refresh').addEventListener('click', () => { if (trail.length) navigate([...trail]); });
  $('.explorer-search').addEventListener('input', renderEntries);
  $('.preview-close').addEventListener('click', () => { clearPreview(); renderEntries(); $('.explorer-search').focus(); });
  $('.explorer-download').addEventListener('click', () => { if (selectedFile) { downloadFile(selectedFile, selectedFile.name); notify('Descarga del archivo iniciada.'); } });
  $('.explorer-save').addEventListener('click', async () => {
    if (!selectedFile || busy) return;
    busy = true; $('.explorer-save').disabled = true;
    try {
      const result = await saveFile(selectedFile, selectedFile.name);
      if (result !== 'cancelled') notify(result === 'saved' ? 'Copia guardada en tu equipo.' : 'Descarga iniciada.');
    } catch { notify('No se pudo guardar la copia. Puedes usar Descargar.'); }
    finally { busy = false; $('.explorer-save').disabled = false; }
  });
  return { preventClose: () => busy, closeMessage: 'Se está guardando una copia. ¿Cerrar esta ventana?', destroy: () => { disposed = true; ++directoryVersion; clearPreview(); } };
}
