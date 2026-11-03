import { getData, setData } from '../../core/storage.js';
import { saveFile, downloadFile } from '../../core/files.js';
import { notify } from '../../core/ui.js';
import { textStats, cleanText, compareLines, replaceText, safeNoteName } from './model.js';
import { renderMarkdown } from './markdown.js';

export function mountNotepad(root) {
  root.innerHTML = `<div class="notepad-shell"><div class="tool-toolbar"><button class="primary-button note-new" disabled>Nueva nota</button><button class="secondary-button note-open" disabled>Abrir</button><button class="secondary-button note-save" disabled>Guardar como…</button><button class="secondary-button note-download" disabled>Descargar</button><details class="note-backups"><summary>Copias</summary><button class="secondary-button note-backup">Exportar todas</button><button class="secondary-button note-restore">Restaurar copia</button></details></div><nav class="note-tabs" aria-label="Notas abiertas"></nav><div class="note-heading"><input class="note-title" aria-label="Título de la nota" placeholder="Título" maxlength="150" disabled><button class="secondary-button note-delete" disabled>Eliminar nota</button></div><nav class="tool-tabs" aria-label="Funciones del bloc"><button data-view="write" aria-pressed="true">Escribir</button><button data-view="markdown" aria-pressed="false">Markdown</button><button data-view="compare" aria-pressed="false">Comparar</button><button data-view="clean" aria-pressed="false">Limpiar texto</button></nav><div class="note-find"><input class="note-search" aria-label="Texto que buscar" placeholder="Buscar…"><input class="note-replacement" aria-label="Texto de reemplazo" placeholder="Reemplazar por…"><label><input class="note-match-case" type="checkbox"> Aa</label><button class="secondary-button note-replace">Reemplazar todo</button></div><section class="note-clean" hidden><span>Aplicar a la nota actual:</span><div><button data-clean="upper">MAYÚSCULAS</button><button data-clean="lower">minúsculas</button><button data-clean="initials">Iniciales Mayúsculas</button><button data-clean="sentence">Tipo oración</button><button data-clean="spaces">Limpiar espacios</button><button data-clean="blank-lines">Reducir líneas vacías</button><button data-clean="trim">Recortar extremos</button><button class="note-undo-clean" disabled>Deshacer limpieza</button></div></section><div class="note-writing"><textarea class="note-editor" aria-label="Contenido de la nota" placeholder="Escribe aquí…" spellcheck="true" disabled data-initial-focus></textarea><article class="note-markdown markdown-content" aria-label="Vista previa Markdown" hidden></article></div><section class="note-compare" hidden><p>La nota actual es el original. Pega otra versión para comparar por líneas.</p><textarea class="note-other" aria-label="Texto para comparar" placeholder="Pega la otra versión…"></textarea><div class="comparison-actions"><button class="primary-button note-compare-run">Comparar versiones</button><button class="secondary-button note-diff-download" disabled>Descargar diferencias</button></div><p class="note-diff-summary" role="status"></p><pre class="note-diff" tabindex="0" aria-label="Diferencias entre los textos"></pre></section><footer class="note-footer"><span class="note-stats"></span><span class="note-status" role="status">Cargando notas locales…</span></footer><input class="note-file-input" type="file" accept=".txt,.md,.markdown,.csv,.json,.log,text/*" multiple hidden><input class="note-backup-input" type="file" accept=".json,application/json" hidden></div>`;
  const $ = selector => root.querySelector(selector);
  let notes = [], activeId, view = 'write', disposed = false, loaded = false, version = 0, savedVersion = 0;
  let saveTimer, previewTimer, queue = Promise.resolve(), failed = false, canPersist = true, lastClean = null, diffText = '';
  const status = $('.note-status'), editor = $('.note-editor');
  $('.note-match-case').setAttribute('aria-label', 'Distinguir mayúsculas');
  const findCount = document.createElement('span'); findCount.className = 'note-find-count'; findCount.setAttribute('role', 'status'); $('.note-find').append(findCount);
  if (!('showSaveFilePicker' in window)) $('.note-save').textContent = 'Exportar';
  const current = () => notes.find(note => note.id === activeId);
  const newNote = (title = 'Sin título', content = '') => ({ id: crypto.randomUUID(), title, content, updated: Date.now() });
  function saveNow() {
    clearTimeout(saveTimer);
    if (!loaded || version === savedVersion) return queue;
    if (!canPersist) { status.textContent = 'Guardado local no disponible. Exporta el trabajo y vuelve a abrir Tools para recuperar los borradores anteriores.'; return queue; }
    const snapshotVersion = version;
    const snapshot = { format: 'tools-notebook', version: 1, activeId, notes: notes.map(note => ({ ...note })) };
    status.textContent = 'Guardando…';
    queue = queue.catch(() => {}).then(() => setData('notebook', snapshot)).then(() => {
      savedVersion = snapshotVersion; failed = false;
      if (!disposed) { status.textContent = savedVersion === version ? 'Guardado en este navegador' : 'Guardando…'; status.classList.remove('error-text'); }
    }).catch(() => {
      failed = true;
      if (!disposed) { status.textContent = 'No se pudo guardar. Exporta una copia para conservar el trabajo.'; status.classList.add('error-text'); }
    });
    return queue;
  }
  function changed() {
    version++; if (current()) current().updated = Date.now();
    status.textContent = 'Cambios pendientes…'; clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 300);
    updateStats();
  }
  function updateStats() {
    const stats = textStats(current()?.content || '');
    $('.note-stats').textContent = `${stats.words} palabras · ${stats.characters} caracteres · ${stats.lines} líneas · ${stats.minutes} min de lectura`;
    const search = $('.note-search').value;
    const count = search ? replaceText(current()?.content || '', search, '', $('.note-match-case').checked).count : 0;
    findCount.textContent = search ? `${count} ${count === 1 ? 'coincidencia' : 'coincidencias'}` : '';
    $('.note-search').title = findCount.textContent;
  }
  function preview() {
    const text = current()?.content || '';
    renderMarkdown(text.slice(0, 200_000), $('.note-markdown'));
    if (text.length > 200_000) { const note = document.createElement('p'); note.textContent = 'Vista previa limitada a 200 000 caracteres. La exportación conserva la nota completa.'; $('.note-markdown').append(note); }
  }
  function renderTabs() {
    const tabs = $('.note-tabs'); tabs.replaceChildren();
    for (const note of notes) {
      const button = document.createElement('button'); button.textContent = note.title || 'Sin título';
      button.title = note.title || 'Sin título'; button.setAttribute('aria-pressed', String(note.id === activeId));
      button.addEventListener('click', () => { activeId = note.id; lastClean = null; showNote(); changed(); }); tabs.append(button);
    }
  }
  function showNote() {
    $('.note-title').value = current()?.title || ''; editor.value = current()?.content || '';
    $('.note-undo-clean').disabled = true; renderTabs(); updateStats();
    if (view === 'markdown') preview();
  }
  function setView(next) {
    view = next;
    root.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === next)));
    $('.note-writing').hidden = next === 'compare'; $('.note-compare').hidden = next !== 'compare';
    $('.note-clean').hidden = next !== 'clean'; $('.note-markdown').hidden = next !== 'markdown';
    $('.note-writing').classList.toggle('with-preview', next === 'markdown');
    if (next === 'markdown') preview();
  }
  function addNote(title, content = '') { const note = newNote(title, content); notes.push(note); activeId = note.id; showNote(); changed(); editor.focus(); }
  function validNotes(data) {
    if (data?.format !== 'tools-notebook' || data.version !== 1 || !Array.isArray(data.notes)) throw new Error('La copia no es de Tools.');
    return data.notes.filter(note => note && typeof note.title === 'string' && typeof note.content === 'string').map(note => ({ id: typeof note.id === 'string' ? note.id : crypto.randomUUID(), title: note.title.slice(0, 150), content: note.content, updated: Number(note.updated) || Date.now() }));
  }
  getData('notebook').then(data => {
    if (disposed) return;
    if (data) { notes = validNotes(data); activeId = data.activeId; }
  }).catch(() => { canPersist = false; if (!disposed) { status.textContent = 'No se pudieron cargar los borradores locales. Puedes escribir y exportar.'; status.classList.add('error-text'); failed = true; } }).finally(() => {
    if (disposed) return;
    loaded = true;
    if (!notes.length) notes = [newNote()];
    if (!notes.some(note => note.id === activeId)) activeId = notes[0].id;
    root.querySelectorAll('.tool-toolbar button,.note-title,.note-delete,.note-editor').forEach(element => { element.disabled = false; });
    showNote(); if (!failed) status.textContent = 'Borrador local · Exporta para guardar un archivo en tu equipo';
  });
  $('.note-new').addEventListener('click', () => addNote('Sin título'));
  $('.note-title').addEventListener('input', event => { if (!loaded) return; current().title = event.target.value; renderTabs(); changed(); });
  editor.addEventListener('input', () => {
    if (!loaded) return; current().content = editor.value; changed();
    if (view === 'markdown') { clearTimeout(previewTimer); previewTimer = setTimeout(preview, 150); }
  });
  root.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  $('.note-search').addEventListener('input', updateStats);
  $('.note-match-case').addEventListener('change', updateStats);
  $('.note-replace').addEventListener('click', () => {
    if (!loaded) return;
    const result = replaceText(editor.value, $('.note-search').value, $('.note-replacement').value, $('.note-match-case').checked);
    lastClean = editor.value; editor.value = result.text; current().content = result.text; $('.note-undo-clean').disabled = false;
    changed(); if (view === 'markdown') preview(); notify(`${result.count} coincidencias reemplazadas.`);
  });
  root.querySelectorAll('[data-clean]').forEach(button => button.addEventListener('click', () => {
    if (!loaded) return; lastClean = editor.value; editor.value = cleanText(editor.value, button.dataset.clean); current().content = editor.value;
    $('.note-undo-clean').disabled = false; changed();
  }));
  $('.note-undo-clean').addEventListener('click', () => {
    if (lastClean === null || !loaded) return; current().content = lastClean; editor.value = lastClean; lastClean = null; $('.note-undo-clean').disabled = true; changed();
  });
  $('.note-compare-run').addEventListener('click', () => {
    if (!loaded) return;
    if (current().content.length + $('.note-other').value.length > 500000 || current().content.split('\n').length + $('.note-other').value.split('\n').length > 4000) { notify('Compara hasta 500 000 caracteres y 4000 líneas por operación. Divide el texto para comparar documentos mayores.'); return; }
    const result = compareLines(current().content, $('.note-other').value);
    const target = $('.note-diff'); target.replaceChildren();
    for (const row of result.rows) { const line = document.createElement('span'); line.className = `diff-${row.type}`; line.textContent = `${row.type === 'added' ? '+' : row.type === 'removed' ? '−' : ' '} ${row.text}\n`; target.append(line); }
    const added = result.rows.filter(row => row.type === 'added').length, removed = result.rows.filter(row => row.type === 'removed').length;
    $('.note-diff-summary').textContent = `${added} ${added === 1 ? 'línea añadida' : 'líneas añadidas'} · ${removed} ${removed === 1 ? 'eliminada' : 'eliminadas'}${result.exact ? '' : ' · Comparación de bloques por tamaño del texto'}`;
    diffText = target.textContent; $('.note-diff-download').disabled = false;
  });
  $('.note-diff-download').addEventListener('click', () => downloadFile(new Blob([diffText], { type: 'text/plain;charset=utf-8' }), 'comparacion.txt'));
  const exportNote = async choose => {
    if (!loaded) return;
    const extension = view === 'markdown' ? 'md' : 'txt';
    const blob = new Blob([current().content], { type: 'text/plain;charset=utf-8' });
    const filename = safeNoteName(current().title, extension);
    try {
      if (!choose) { downloadFile(blob, filename); notify('Descarga de la nota iniciada.'); }
      else { const result = await saveFile(blob, filename); if (result !== 'cancelled') notify(result === 'saved' ? 'Nota guardada en tu equipo.' : 'Descarga iniciada.'); }
    } catch { notify('No se pudo guardar el archivo. Prueba con Descargar.'); }
  };
  $('.note-save').addEventListener('click', () => exportNote(true));
  $('.note-download').addEventListener('click', () => exportNote(false));
  $('.note-open').addEventListener('click', () => $('.note-file-input').click());
  $('.note-file-input').addEventListener('change', async event => {
    const files = [...event.target.files]; event.target.value = '';
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { notify(`«${file.name}» supera el límite de importación de 5 MB.`); continue; }
      try {
        const content = await file.text(); if (disposed) return;
        addNote(file.name.replace(/\.(txt|md|markdown)$/i, ''), content);
        if (/\.(md|markdown)$/i.test(file.name)) setView('markdown');
      } catch { notify(`No se pudo leer «${file.name}».`); }
    }
  });
  $('.note-delete').addEventListener('click', () => {
    if (!loaded || !confirm('¿Eliminar esta nota y su borrador local? Exporta una copia antes si quieres conservarla.')) return;
    notes = notes.filter(note => note.id !== activeId); if (!notes.length) notes.push(newNote()); activeId = notes[0].id; showNote(); changed();
  });
  $('.note-backup').addEventListener('click', () => {
    if (!loaded) return;
    downloadFile(new Blob([JSON.stringify({ format: 'tools-notebook', version: 1, notes }, null, 2)], { type: 'application/json' }), 'tools-notas.json');
  });
  $('.note-restore').addEventListener('click', () => $('.note-backup-input').click());
  $('.note-backup-input').addEventListener('change', async event => {
    const file = event.target.files[0]; event.target.value = ''; if (!file) return;
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error('La copia supera 20 MB.');
      const restored = validNotes(JSON.parse(await file.text())); if (disposed) return;
      notes.push(...restored.map(note => ({ ...note, id: crypto.randomUUID() })));
      if (restored.length) activeId = notes.at(-1).id; showNote(); changed(); notify(`${restored.length} notas añadidas desde la copia.`);
    } catch (error) { notify(error.message || 'No se pudo leer esta copia.'); }
  });
  root.addEventListener('keydown', event => {
    if (!(event.ctrlKey || event.metaKey)) return;
    if (event.key.toLowerCase() === 's') { event.preventDefault(); exportNote(true); }
    if (event.key.toLowerCase() === 'f') { event.preventDefault(); $('.note-search').focus(); }
  });
  return { preventClose: () => loaded && version > savedVersion, closeMessage: 'Hay cambios sin guardar localmente. ¿Cerrar igualmente? Puedes exportar una copia antes.', destroy: () => { clearTimeout(saveTimer); clearTimeout(previewTimer); saveNow(); disposed = true; } };
}
