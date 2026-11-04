import { pickFiles } from '../../core/workbench.js';
import { workerJob } from '../../core/jobs.js';
import { saveFile, downloadFile, formatBytes } from '../../core/files.js';
import { readImage, canvasBlob, loadImage } from '../../core/raster.js';
import { imagePlacement, rotation, pageRange, PDF_LIMIT, PAGE_LIMIT } from './model.js';
import { validateEntryName } from '../file-explorer/filesystem.js';

export function mountPDF(root) {
  root.innerHTML = `<div class="workbench pdf-app"><div class="pdf-toolbar wb-toolbar"><button data-do="open" data-edit>Añadir PDF</button><button data-do="images" data-edit>Añadir imágenes</button><button data-do="undo" data-edit disabled>Deshacer organización</button><button data-do="clear" data-edit>Vaciar lista</button><button data-do="cancel" disabled>Detener</button><span class="pdf-summary wb-help">Sin documentos</span></div><div class="pdf-layout"><aside class="pdf-organizer"><div class="wb-toolbar"><label>Rango <input id="pdf-range" placeholder="1-3, 5" size="10" data-edit></label><button data-do="range" data-edit>Seleccionar rango</button><button data-do="all" data-edit>Todas</button><button data-do="none" data-edit>Ninguna</button><button data-do="remove" data-edit>Quitar seleccionadas</button><button data-do="rotate" data-edit>Girar selección 90°</button></div><ol class="pdf-pages wb-list" aria-label="Lista ordenada de páginas"></ol><p class="wb-help">Marca las páginas que quieras exportar. Arrastra sus filas o usa ↑ y ↓ para ordenarlas. Los números de rango se refieren a esta lista.</p></aside><div class="pdf-viewer"><div class="wb-toolbar"><button data-do="previous" disabled aria-label="Página anterior del visor">←</button><label>Página <input id="pdf-view-page" type="number" min="1" value="1" aria-label="Página del visor"></label><button data-do="next" disabled aria-label="Página siguiente del visor">→</button><label>Zoom <select id="pdf-zoom"><option value="0.5">50%</option><option value="0.75">75%</option><option value="1" selected>Ajustar</option><option value="1.5">150%</option><option value="2">200%</option></select></label><button data-do="output-preview" disabled>Ver copia preparada</button></div><p class="pdf-preview-label wb-help">Abre un documento o añade imágenes.</p><div class="pdf-stage"><canvas aria-label="Vista de la página PDF" hidden></canvas><p class="pdf-empty wb-help">Añade PDF o imágenes para empezar.</p></div></div></div><details class="pdf-options"><summary>Imágenes y formularios</summary><div class="wb-toolbar"><label>Papel de imágenes <select id="pdf-paper" data-edit><option value="a4">A4 · orientación automática</option><option value="original">Tamaño original · 96 ppp</option></select></label><label>Margen de imágenes <input id="pdf-margin" type="number" min="0" max="40" value="10" data-edit> mm</label><label><input type="checkbox" id="pdf-static" data-edit>Convertir formularios y firmas a copia estática</label></div><p class="wb-help">La copia estática deja los campos fijos y las firmas pierden su validez. Revisa la vista de la copia preparada antes de guardar. La exportación contiene las páginas seleccionadas y no conserva los marcadores ni la estructura del documento original.</p></details><div class="pdf-export wb-toolbar"><label>Salida <select id="pdf-format" data-edit><option value="single">Un PDF · unir o extraer selección</option><option value="split">Un PDF por página · ZIP</option></select></label><label>Nombre <input id="pdf-name" value="documento" maxlength="150"></label><button data-do="prepare" data-edit disabled>Preparar resultado</button><button data-do="save" disabled>Guardar resultado…</button><span class="pdf-output-info wb-help"></span></div><footer class="wb-status wb-export-footer"><span class="pdf-status wb-feedback" role="status">Procesamiento local. Hasta 50 MB de entrada y 500 páginas; los documentos permanecen en esta ventana hasta cerrarla.</span><label>Al guardar <select class="pdf-destination" aria-label="Destino de exportación"><option value="save">Elegir destino</option><option value="download">Descargar</option></select></label></footer></div>`;
  const q = s => root.querySelector(s), canvas = q('canvas'), job = workerJob(new URL('./worker.js', import.meta.url));
  const mobileSwitch = document.createElement('div'); mobileSwitch.className = 'pdf-mobile-switch wb-toolbar';
  mobileSwitch.innerHTML = '<button data-view="pages" aria-pressed="true">Páginas</button><button data-view="preview" aria-pressed="false">Vista previa</button>';
  q('.pdf-toolbar').after(mobileSwitch);
  function mobileView(view) { q('.pdf-app').dataset.mobileView = view; for (const button of mobileSwitch.children) button.setAttribute('aria-pressed', String(button.dataset.view === view)); }
  for (const button of mobileSwitch.children) button.onclick = () => { mobileView(button.dataset.view); preview(); };
  mobileView('pages');
  let sources = [], pages = [], history = [], current = null, busy = false, disposed = false, dirty = false, prepared = null, revision = 0, exported = true, cancelled = false;
  let outputView = false, outputIndex = 0, renderVersion = 0, renderTask = null, loadingTask = null, loadingKey = null, pdfjs = null, resizeTimer;
  function status(text, error = false) { if (disposed) return; q('.pdf-status').textContent = text; q('.pdf-status').classList.toggle('error-text', error); }
  function controls() {
    root.querySelectorAll('[data-edit]').forEach(element => { element.disabled = busy; });
    q('[data-do=undo]').disabled = busy || !history.length; q('[data-do=prepare]').disabled = busy || !pages.some(page => page.selected);
    q('[data-do=save]').disabled = busy || !prepared; q('[data-do=output-preview]').disabled = !prepared || prepared.type !== 'single'; q('[data-do=cancel]').disabled = !busy;
    const index = outputView ? outputIndex : pages.findIndex(page => page.id === current), count = outputView ? prepared?.count || 0 : pages.length;
    q('[data-do=previous]').disabled = index <= 0; q('[data-do=next]').disabled = index < 0 || index >= count - 1; q('#pdf-view-page').value = Math.max(1, index + 1); q('#pdf-view-page').max = Math.max(1, count);
    const selected = pages.filter(page => page.selected).length;
    q('.pdf-summary').textContent = `${sources.length} documento${sources.length === 1 ? '' : 's'} · ${pages.length} página${pages.length === 1 ? '' : 's'} · ${selected} seleccionada${selected === 1 ? '' : 's'}`;
  }
  function remember() { history.push(pages.map(page => ({ ...page }))); if (history.length > 20) history.shift(); }
  function invalidate(markDirty = true) { revision++; prepared = null; exported = true; if (markDirty) dirty = true; outputView = false; q('.pdf-output-info').textContent = ''; }
  function renderList() {
    const list = q('.pdf-pages'); list.replaceChildren();
    if (current && !pages.some(page => page.id === current)) current = pages[0]?.id || null;
    pages.forEach((page, index) => {
      const source = sources.find(item => item.id === page.source), row = document.createElement('li'); row.draggable = !busy; row.classList.toggle('current', page.id === current && !outputView);
      const checked = document.createElement('input'); checked.type = 'checkbox'; checked.checked = page.selected; checked.disabled = busy; checked.setAttribute('aria-label', `Exportar página ${index + 1}`);
      checked.onchange = () => { page.selected = checked.checked; invalidate(); renderList(); preview(); };
      const view = document.createElement('button'); view.className = 'grow pdf-page-label'; view.textContent = `${index + 1}. ${source.name} · p. ${page.index + 1}${page.rotation ? ` · giro +${page.rotation}°` : ''}`; view.setAttribute('aria-label', `Ver página ${index + 1}: ${source.name}`); view.onclick = () => { current = page.id; outputView = false; mobileView('preview'); renderList(); preview(); };
      const actions = document.createElement('span'); actions.className = 'pdf-page-actions';
      for (const [name, text, delta] of [['Subir', '↑', -1], ['Bajar', '↓', 1]]) {
        const button = document.createElement('button'); button.textContent = text; button.setAttribute('aria-label', `${name} página ${index + 1}`); button.disabled = busy || index + delta < 0 || index + delta >= pages.length;
        button.onclick = () => { remember(); [pages[index], pages[index + delta]] = [pages[index + delta], pages[index]]; invalidate(); renderList(); preview(); }; actions.append(button);
      }
      row.ondragstart = event => { if (busy) { event.preventDefault(); return; } event.dataTransfer.setData('text/x-tools-page', page.id); event.dataTransfer.effectAllowed = 'move'; };
      row.ondragover = event => { if (!busy) event.preventDefault(); };
      row.ondrop = event => { event.preventDefault(); if (busy) return; const id = event.dataTransfer.getData('text/x-tools-page'), from = pages.findIndex(item => item.id === id); if (from < 0 || from === index) return; remember(); const [item] = pages.splice(from, 1); pages.splice(index, 0, item); invalidate(); renderList(); preview(); };
      row.append(checked, view, actions); list.append(row);
    }); controls();
  }
  async function pdfDocument(file, key, token) {
    if (!pdfjs) pdfjs = await import('../../vendor/pdfjs.js'); if (disposed || token !== renderVersion) return null;
    if (loadingKey !== key || !loadingTask) {
      const bytes = new Uint8Array(await file.arrayBuffer()); if (disposed || token !== renderVersion) return null;
      loadingTask?.destroy().catch(() => {}); loadingKey = key;
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('../../vendor/pdf.worker.mjs', import.meta.url).href;
      const base = new URL('../../vendor/', import.meta.url).href;
      loadingTask = pdfjs.getDocument({ data: bytes, cMapUrl: base + 'cmaps/', cMapPacked: true, standardFontDataUrl: base + 'standard_fonts/', wasmUrl: base + 'wasm/', iccUrl: base + 'iccs/', enableXfa: false, isEvalSupported: false, stopAtErrors: true });
      loadingTask.onPassword = () => { loadingTask.destroy().catch(() => {}); status('No se admiten PDF protegidos con contraseña.', true); };
    }
    return loadingTask.promise;
  }
  async function preview() {
    const token = ++renderVersion, previous = renderTask; renderTask = null; previous?.cancel(); if (previous) await previous.promise.catch(() => {});
    if (disposed || token !== renderVersion) return;
    const page = pages.find(item => item.id === current), source = sources.find(item => item.id === page?.source);
    if ((!page || !source) && !outputView) { canvas.hidden = true; q('.pdf-empty').hidden = false; q('.pdf-preview-label').textContent = 'Abre un documento o añade imágenes.'; controls(); return; }
    q('.pdf-empty').hidden = true; canvas.hidden = false; controls();
    const zoom = Number(q('#pdf-zoom').value), available = Math.max(120, q('.pdf-stage').clientWidth - 36), availableHeight = Math.max(20, q('.pdf-stage').clientHeight - 36);
    const fit = (w, h) => Math.min(Math.min(available / w, availableHeight / h) * zoom, 4096 / w, 4096 / h, Math.sqrt(8000000 / w / h));
    try {
      if (outputView || source.kind === 'pdf') {
        const file = outputView ? prepared.blob : source.file, key = outputView ? `output-${revision}` : source.id, index = outputView ? outputIndex : page.index;
        const doc = await pdfDocument(file, key, token); if (!doc || disposed || token !== renderVersion) return;
        const pdfPage = await doc.getPage(index + 1); if (disposed || token !== renderVersion) return;
        const turn = outputView ? pdfPage.rotate : rotation(pdfPage.rotate + page.rotation), natural = pdfPage.getViewport({ scale: 1, rotation: turn });
        if (![natural.width, natural.height].every(n => Number.isFinite(n) && n > 0)) throw Error('La página tiene dimensiones no válidas.');
        const viewport = pdfPage.getViewport({ scale: fit(natural.width, natural.height), rotation: turn }); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        const task = pdfPage.render({ canvasContext: canvas.getContext('2d'), viewport, background: 'rgb(255,255,255)' }); renderTask = task; await task.promise; if (renderTask === task) renderTask = null;
        if (disposed || token !== renderVersion) return;
        q('.pdf-preview-label').textContent = outputView ? `Copia preparada · página ${index + 1} de ${doc.numPages}` : `${source.name} · página ${index + 1} de ${source.count}${source.form?.fields || source.form?.signature ? ' · contiene formularios o firmas' : ''}`;
      } else {
        const image = await loadImage(source.file); if (disposed || token !== renderVersion) return;
        const box = imagePlacement(image.naturalWidth, image.naturalHeight, { paper: q('#pdf-paper').value, margin: Number(q('#pdf-margin').value) }), turn = rotation(page.rotation), swap = turn % 180 !== 0, w = swap ? box.pageHeight : box.pageWidth, h = swap ? box.pageWidth : box.pageHeight, scale = fit(w, h);
        canvas.width = Math.ceil(w * scale); canvas.height = Math.ceil(h * scale); const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.scale(scale, scale);
        if (turn === 90) ctx.translate(box.pageHeight, 0); else if (turn === 180) ctx.translate(box.pageWidth, box.pageHeight); else if (turn === 270) ctx.translate(0, box.pageWidth); ctx.rotate(turn * Math.PI / 180);
        ctx.drawImage(image, box.x, box.pageHeight - box.y - box.height, box.width, box.height); q('.pdf-preview-label').textContent = `${source.name} · imagen en ${q('#pdf-paper').value === 'a4' ? 'A4' : 'tamaño original'}`;
      }
    } catch (error) { if (!disposed && token === renderVersion && error.name !== 'RenderingCancelledException') status(`No se pudo dibujar la vista: ${error.message}`, true); }
  }
  async function add(kind) {
    const files = await pickFiles({ multiple: true, accept: kind === 'pdf' ? '.pdf,application/pdf' : 'image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif,image/svg+xml' }); if (!files.length || disposed || busy) return;
    if (sources.reduce((n, source) => n + source.file.size, 0) + files.reduce((n, file) => n + file.size, 0) > PDF_LIMIT) { status('La selección supera 50 MB de entrada.', true); return; }
    busy = true; cancelled = false; controls(); renderList();
    try {
      for (const file of files) {
        if (disposed) return; if (cancelled) throw Error('Importación detenida.'); status(`Leyendo ${file.name}…`);
        let metadata, input = file;
        if (kind === 'pdf') metadata = await job.run({ action: 'info', file });
        else { const image = await readImage(file); if (disposed) return; const temporary = document.createElement('canvas'); temporary.width = image.naturalWidth; temporary.height = image.naturalHeight; temporary.getContext('2d').drawImage(image, 0, 0); input = await canvasBlob(temporary); metadata = { count: 1, rotations: [0], form: null }; }
        if (disposed) return; if (cancelled) throw Error('Importación detenida.');
        if (pages.length + metadata.count > PAGE_LIMIT || sources.reduce((n, source) => n + source.file.size, 0) + input.size > PDF_LIMIT) throw Error('Se ha alcanzado el límite de 50 MB o 500 páginas.');
        remember(); const hadPages = pages.length > 0, source = { id: crypto.randomUUID(), file: input, kind, name: file.name, ...metadata }; sources.push(source);
        for (let index = 0; index < source.count; index++) pages.push({ id: `${source.id}:${index}`, source: source.id, index, selected: true, rotation: 0 });
        if (!current) current = pages[0].id; invalidate(hadPages || kind === 'image'); renderList();
      }
      status('Documentos añadidos. Organiza las páginas y prepara el resultado.');
    } catch (error) { status(error.message, true); } finally { busy = false; if (!disposed) { renderList(); preview(); } }
  }
  q('[data-do=open]').onclick = () => add('pdf'); q('[data-do=images]').onclick = () => add('image');
  q('[data-do=cancel]').onclick = () => { cancelled = true; job.cancel(); };
  q('[data-do=undo]').onclick = () => { const previous = history.pop(); if (!previous) return; pages = previous; invalidate(); renderList(); preview(); };
  q('[data-do=clear]').onclick = () => { if (dirty && !window.confirm('Hay una organización sin exportar. ¿Vaciar la lista?')) return; pages = []; sources = []; history = []; current = null; invalidate(false); dirty = false; loadingTask?.destroy().catch(() => {}); loadingTask = null; loadingKey = null; renderList(); preview(); };
  for (const name of ['all', 'none']) q(`[data-do=${name}]`).onclick = () => { pages.forEach(page => { page.selected = name === 'all'; }); invalidate(); renderList(); preview(); };
  q('[data-do=range]').onclick = () => { try { const selected = pageRange(q('#pdf-range').value, pages.length); pages.forEach((page, index) => { page.selected = selected.has(index); }); invalidate(); renderList(); preview(); } catch (error) { status(error.message, true); } };
  q('[data-do=remove]').onclick = () => { remember(); pages = pages.filter(page => !page.selected); invalidate(); renderList(); preview(); };
  q('[data-do=rotate]').onclick = () => { remember(); pages.forEach(page => { if (page.selected) page.rotation = rotation(page.rotation + 90); }); invalidate(); renderList(); preview(); };
  for (const step of [-1, 1]) q(`[data-do=${step < 0 ? 'previous' : 'next'}]`).onclick = () => { if (outputView) outputIndex = Math.max(0, Math.min(prepared.count - 1, outputIndex + step)); else { const index = pages.findIndex(page => page.id === current); current = pages[Math.max(0, Math.min(pages.length - 1, index + step))]?.id || null; } renderList(); preview(); };
  q('#pdf-view-page').onchange = () => { const n = Number(q('#pdf-view-page').value), count = outputView ? prepared.count : pages.length; if (!Number.isInteger(n) || n < 1 || n > count) { status('Página del visor fuera de rango.', true); return; } if (outputView) outputIndex = n - 1; else current = pages[n - 1].id; renderList(); preview(); };
  q('#pdf-zoom').onchange = preview;
  for (const selector of ['#pdf-paper', '#pdf-margin', '#pdf-static', '#pdf-format']) q(selector).onchange = () => { invalidate(); controls(); preview(); };
  q('[data-do=prepare]').onclick = async () => {
    if (busy || !pages.some(page => page.selected)) return;
    busy = true; controls(); renderList(); status('Preparando resultado…'); const token = revision, format = q('#pdf-format').value, selected = pages.filter(page => page.selected).map(page => ({ ...page }));
    try {
      const result = await job.run({ action: format === 'split' ? 'split' : 'assemble', sources, pages: selected, options: { paper: q('#pdf-paper').value, margin: Number(q('#pdf-margin').value), staticForms: q('#pdf-static').checked } }, { timeout: 60000, progress: value => status(`Preparando resultado… ${value}%`) });
      if (disposed || token !== revision) return;
      prepared = { blob: new Blob([result.bytes], { type: format === 'split' ? 'application/zip' : 'application/pdf' }), type: format, count: selected.length }; exported = false;
      q('.pdf-output-info').textContent = `${selected.length} página${selected.length === 1 ? '' : 's'} · ${formatBytes(prepared.blob.size)}`; status('Resultado preparado. Puedes revisarlo y guardarlo.');
    } catch (error) { status(error.message, true); } finally { busy = false; if (!disposed) { controls(); renderList(); } }
  };
  q('[data-do=output-preview]').onclick = () => { outputView = true; outputIndex = 0; mobileView('preview'); renderList(); preview(); };
  q('[data-do=save]').onclick = async () => {
    if (!prepared) return; const output = prepared;
    try { const extension = output.type === 'split' ? '.zip' : '.pdf', name = validateEntryName((q('#pdf-name').value.trim().replace(/\.(?:pdf|zip)$/i, '') || 'documento') + extension); let result;
      if (q('.pdf-destination').value === 'download') { downloadFile(output.blob, name); result = 'downloaded'; } else result = await saveFile(output.blob, name);
      if (result !== 'cancelled') { if (prepared === output) { exported = true; dirty = false; } status(result === 'saved' ? 'Resultado guardado.' : 'Descarga iniciada. La ubicación depende de los ajustes del navegador.'); }
    } catch (error) { status(error.message, true); }
  };
  const observer = new ResizeObserver(() => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (!disposed && (current || outputView)) preview(); }, 100); }); observer.observe(q('.pdf-stage'));
  renderList();
  return { preventClose: () => busy || dirty || !!prepared && !exported, closeMessage: 'Hay páginas organizadas o un resultado sin guardar. ¿Cerrar PDF?', destroy() { disposed = true; renderVersion++; job.cancel(); observer.disconnect(); clearTimeout(resizeTimer); renderTask?.cancel(); loadingTask?.destroy().catch(() => {}); sources = []; pages = []; history = []; prepared = null; } };
}
