import { icon, notify } from '../../core/ui.js';
import { saveFile, downloadFile, formatBytes } from '../../core/files.js';
import { buildFileTree, sortEntries, previewKind } from './model.js';
import { getData, setData } from '../../core/storage.js';
import { validateEntryName, entryExists, writeNewFile, copyFileTo } from './filesystem.js';

let copiedFile = null;

export function mountExplorer(root) {
  root.innerHTML = `<div class="explorer-shell"><div class="explorer-toolbar"><button class="secondary-button explorer-back" aria-label="Atrás en carpetas" disabled>←</button><button class="secondary-button explorer-forward" aria-label="Adelante en carpetas" disabled>→</button><button class="primary-button explorer-folder" data-initial-focus>${icon('folder')} Abrir carpeta</button><button class="secondary-button explorer-files">${icon('file')} Abrir archivos</button><button class="secondary-button explorer-refresh" title="Actualizar carpeta" aria-label="Actualizar carpeta" disabled>↻</button><input class="explorer-search" type="search" aria-label="Filtrar archivos de esta carpeta" placeholder="Buscar en esta carpeta…" disabled></div><div class="explorer-file-actions"><button class="secondary-button explorer-copy" disabled>Copiar archivo</button><button class="secondary-button explorer-paste" disabled>Pegar copia</button><button class="secondary-button explorer-new-folder" disabled>Nueva carpeta</button><button class="secondary-button explorer-new-file" disabled>Nuevo archivo TXT</button></div><div class="explorer-connection" hidden><span></span><button class="primary-button explorer-reconnect">Volver a conectar</button></div><div class="explorer-location"><button class="explorer-up" aria-label="Subir a la carpeta superior" title="Subir" disabled>${icon('arrow')}</button><nav class="explorer-breadcrumbs" aria-label="Ruta de la carpeta"><span>Este dispositivo</span></nav><span class="readonly-badge">Local</span></div><div class="explorer-body"><aside class="explorer-sidebar"><strong>Ubicaciones</strong><button class="explorer-home" disabled>${icon('folder')}<span>Carpeta conectada</span></button><p>La ruta empieza en la carpeta que autorizas. El navegador no expone la ruta completa de Windows.</p></aside><div class="explorer-file-panel"><div class="explorer-columns"><span>Nombre</span><span>Tamaño</span></div><ul class="explorer-list" aria-label="Archivos y carpetas"></ul><div class="explorer-empty empty-state"><span class="explorer-empty-icon">${icon('folder')}</span><strong>Conecta una carpeta de tu equipo.</strong><p>Elige una carpeta una vez. Tools recordará dónde estabas y volverá a abrirla cuando el navegador conserve el permiso.</p><span>Navegación · Vista previa · Copias locales</span></div></div><aside class="explorer-preview" aria-label="Vista previa del archivo" hidden><div class="preview-header"><strong>Vista previa</strong><button class="preview-close" aria-label="Cerrar vista previa">×</button></div><div class="preview-content"></div><div class="preview-metadata"></div><div class="preview-actions"><button class="primary-button explorer-save">${icon('download')} Guardar copia…</button><button class="secondary-button explorer-download">Descargar</button></div></aside></div><footer class="explorer-status status-text" role="status">Elige una carpeta para empezar. La escritura solo se autoriza cuando creas o pegas un archivo.</footer><input type="file" class="explorer-file-input" multiple hidden><input type="file" class="explorer-directory-input" webkitdirectory multiple hidden><dialog class="explorer-create-dialog about-dialog"><form><h3 class="explorer-create-title"></h3><label class="field-label">Nombre<input class="explorer-entry-name" maxlength="200" required autocomplete="off"></label><label class="field-label explorer-initial-content" hidden>Contenido inicial<textarea class="explorer-entry-content" rows="5"></textarea></label><p class="explorer-create-error error-text" role="status"></p><div class="clock-buttons"><button class="primary-button explorer-create-submit">Crear</button><button class="secondary-button explorer-create-cancel" type="button">Cancelar</button></div></form></dialog></div>`;
  const $ = selector => root.querySelector(selector);
  let trail = [], entries = [], selectedFile = null, selectedNode = null, previewUrl = null;
  let disposed = false, directoryVersion = 0, previewVersion = 0, busy = false;
  let history = [], historyIndex = -1, remembered = null, rememberQueue = Promise.resolve(), warnedRemember = false;
  let createKind = 'file', destination = null;
  const sizes = new WeakMap();
  const status = $('.explorer-status');
  if (!('showSaveFilePicker' in window)) $('.explorer-save').hidden = true;
  function updateButtons() {
    const nativeDirectory = !!trail.at(-1)?.node.getFileHandle;
    $('.explorer-copy').disabled = !selectedFile || busy;
    $('.explorer-paste').disabled = !copiedFile || !nativeDirectory || busy;
    $('.explorer-new-folder').disabled = !nativeDirectory || busy;
    $('.explorer-new-file').disabled = !nativeDirectory || busy;
    $('.explorer-back').disabled = historyIndex <= 0;
    $('.explorer-forward').disabled = historyIndex >= history.length - 1;
    $('.explorer-home').disabled = !trail.length;
  }

  function clearPreview() {
    ++previewVersion;
    $('.preview-content').querySelectorAll('audio,video').forEach(media => { media.pause(); media.removeAttribute('src'); media.load(); });
    $('.explorer-preview').hidden = true;
    $('.preview-content').replaceChildren();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null; selectedFile = null; selectedNode = null;
    updateButtons();
  }
  async function navigate(nextTrail, record = true) {
    const version = ++directoryVersion;
    clearPreview();
    trail = nextTrail;
    if (record) { history = history.slice(0, historyIndex + 1); history.push([...trail]); historyIndex = history.length - 1; }
    updateButtons();
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
      $('.explorer-home span').textContent = trail[0].name;
      $('.explorer-connection').hidden = true;
      status.textContent = limited ? 'Mostrando los primeros 2000 elementos. El filtro busca en esos elementos.' : `${entries.length} ${entries.length === 1 ? 'elemento' : 'elementos'} · ${trail.map(part => part.name).join(' / ')}`;
      if (trail[0].node.getDirectoryHandle) {
        const snapshot = { handle: trail[0].node, path: trail.slice(1).map(part => part.name) };
        remembered = snapshot;
        rememberQueue = rememberQueue.catch(() => {}).then(() => setData('explorer-location', snapshot)).catch(() => { if (!warnedRemember && !disposed) { warnedRemember = true; notify('No se pudo recordar esta carpeta. Puedes seguir usándola durante la sesión.'); } });
      }
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
      if (entry.kind === 'file' && !entry.file) {
        if (!sizes.has(entry)) sizes.set(entry, entry.getFile().then(file => file.size).catch(() => null));
        sizes.get(entry).then(size => { if (!disposed && button.isConnected && size !== null) button.querySelector('.file-size').textContent = formatBytes(size); });
      }
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
      updateButtons();
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
      const handle = await window.showDirectoryPicker({ mode: 'read', id: 'tools-explorer' });
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
  $('.explorer-refresh').addEventListener('click', () => { if (trail.length) navigate([...trail], false); });
  $('.explorer-back').addEventListener('click', () => { if (historyIndex > 0) navigate(history[--historyIndex], false); });
  $('.explorer-forward').addEventListener('click', () => { if (historyIndex < history.length - 1) navigate(history[++historyIndex], false); });
  $('.explorer-home').addEventListener('click', () => { if (trail.length) navigate([trail[0]]); });
  $('.explorer-search').addEventListener('input', renderEntries);
  $('.preview-close').addEventListener('click', () => { clearPreview(); renderEntries(); $('.explorer-search').focus(); });
  $('.explorer-download').addEventListener('click', () => { if (selectedFile) { downloadFile(selectedFile, selectedFile.name); notify('Descarga del archivo iniciada.'); } });
  $('.explorer-save').addEventListener('click', async () => {
    if (!selectedFile || busy) return;
    busy = true; $('.explorer-save').disabled = true; updateButtons();
    try {
      const result = await saveFile(selectedFile, selectedFile.name);
      if (result !== 'cancelled') notify(result === 'saved' ? 'Copia guardada en tu equipo.' : 'Descarga iniciada.');
    } catch { notify('No se pudo guardar la copia. Puedes usar Descargar.'); }
    finally { busy = false; $('.explorer-save').disabled = false; updateButtons(); }
  });
  async function restoreLocation(saved, request = false) {
    if (!saved?.handle || disposed) return;
    const version = directoryVersion;
    try {
      const handle = saved.handle;
      const permission = request ? await handle.requestPermission({ mode: 'read' }) : await handle.queryPermission({ mode: 'read' });
      if (disposed || directoryVersion !== version) return;
      if (permission !== 'granted') {
        remembered = saved; $('.explorer-connection').hidden = false;
        $('.explorer-connection span').textContent = `Carpeta recordada: ${handle.name}. El navegador necesita que confirmes el acceso.`; return;
      }
      const restored = [{ name: handle.name, node: handle }];
      try { for (const name of saved.path || []) { const node = await restored.at(-1).node.getDirectoryHandle(name); restored.push({ name, node }); } }
      catch { notify('La subcarpeta anterior no está disponible. Se abrirá la carpeta principal.'); restored.splice(1); }
      if (!disposed && directoryVersion === version) navigate(restored);
    } catch { if (!disposed) { remembered = saved; $('.explorer-connection').hidden = false; $('.explorer-connection span').textContent = `Vuelve a autorizar «${saved.handle.name}» o elige otra carpeta.`; } }
  }
  $('.explorer-reconnect').addEventListener('click', () => restoreLocation(remembered, true));
  const initialVersion = directoryVersion;
  getData('explorer-location').then(saved => { if (!disposed && directoryVersion === initialVersion && saved) restoreLocation(saved); }).catch(() => {});
  $('.explorer-copy').addEventListener('click', () => { if (selectedFile) { copiedFile = selectedFile; updateButtons(); notify(`«${selectedFile.name}» listo para pegar como copia en una carpeta autorizada.`); } });
  function openCreate(kind) {
    destination = trail.at(-1)?.node; if (!destination?.getFileHandle || busy) return;
    createKind = kind;
    $('.explorer-create-title').textContent = kind === 'paste' ? `Pegar copia en «${trail.at(-1).name}»` : kind === 'folder' ? 'Nueva carpeta' : 'Nuevo archivo de texto';
    $('.explorer-entry-name').value = kind === 'paste' ? copiedFile.name : kind === 'folder' ? 'Nueva carpeta' : 'Nuevo documento.txt';
    $('.explorer-entry-content').value = ''; $('.explorer-initial-content').hidden = kind !== 'file'; $('.explorer-create-error').textContent = '';
    $('.explorer-create-submit').textContent = kind === 'paste' ? 'Pegar copia' : 'Crear';
    $('.explorer-create-dialog').showModal(); $('.explorer-entry-name').focus(); $('.explorer-entry-name').select();
  }
  $('.explorer-paste').addEventListener('click', () => openCreate('paste'));
  $('.explorer-new-folder').addEventListener('click', () => openCreate('folder'));
  $('.explorer-new-file').addEventListener('click', () => openCreate('file'));
  $('.explorer-create-cancel').addEventListener('click', () => $('.explorer-create-dialog').close());
  $('.explorer-create-dialog form').addEventListener('submit', async event => {
    event.preventDefault(); if (busy || !destination) return;
    busy = true; updateButtons(); $('.explorer-create-submit').disabled = true;
    const target = destination, kind = createKind, source = copiedFile;
    try {
      const name = validateEntryName($('.explorer-entry-name').value);
      const permission = await target.requestPermission({ mode: 'readwrite' });
      if (permission !== 'granted') throw new Error('No se ha autorizado la escritura en esta carpeta.');
      if (disposed) return;
      let created;
      if (kind === 'paste') created = await copyFileTo(target, source, name);
      else if (kind === 'folder') { if (await entryExists(target, name)) throw new Error('Ya existe un elemento con ese nombre.'); created = await target.getDirectoryHandle(name, { create: true }); }
      else created = await writeNewFile(target, name, new Blob([$('.explorer-entry-content').value], { type: 'text/plain;charset=utf-8' }));
      if (disposed) return;
      $('.explorer-create-dialog').close(); await navigate([...trail], false); notify(`«${created.name}» guardado en la carpeta de tu equipo.`);
    } catch (error) { if (!disposed) $('.explorer-create-error').textContent = error.message || 'No se pudo completar la operación.'; }
    finally { busy = false; $('.explorer-create-submit').disabled = false; updateButtons(); }
  });
  return { preventClose: () => busy, closeMessage: 'Hay una operación de archivos en curso. ¿Cerrar esta ventana?', destroy: () => { disposed = true; ++directoryVersion; clearPreview(); } };
}
