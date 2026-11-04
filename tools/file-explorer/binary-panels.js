import { pickFiles } from '../../core/workbench.js';
import { formatBytes } from '../../core/files.js';
import { byteValue, byteOffset, hexBytes, compareFiles, makeBytes } from './binary.js';
import { validateEntryName } from './filesystem.js';

export function mountCompare(panel, api) {
  panel.innerHTML = `<div class="wb-body"><div class="wb-toolbar"><button data-pick="a">Elegir archivo A</button><span data-name="a" class="wb-help">Sin archivo</span><button data-pick="b">Elegir archivo B</button><span data-name="b" class="wb-help">Sin archivo</span><button data-do="compare" disabled>Comparar archivos</button><button data-do="cancel" disabled>Detener comparación</button><button data-do="save" disabled>Guardar informe…</button></div><pre class="wb-code comparison-result">Elige dos archivos para comparar sus bytes.</pre><div class="wb-split"><pre class="wb-code comparison-a" aria-label="Vista de texto del archivo A"></pre><pre class="wb-code comparison-b" aria-label="Vista de texto del archivo B"></pre></div><p class="wb-help">Comparación por posición de byte, hasta 200 MB por archivo. Se muestran las primeras 100 diferencias. La vista de texto UTF-8 utiliza los primeros 100 KB y puede no ser legible en archivos binarios.</p></div>`;
  const q = s => panel.querySelector(s), files = {}; let disposed = false, busy = false, cancelled = false, report = '';
  for (const side of ['a', 'b']) q(`[data-pick=${side}]`).onclick = async () => {
    const [file] = await pickFiles(); if (!file || disposed) return;
    if (file.size > 200 * 1024 * 1024) { api.status('El archivo supera 200 MB.', true); return; }
    files[side] = file; q(`[data-name=${side}]`).textContent = `${file.name} · ${formatBytes(file.size)}`;
    q('.comparison-' + side).textContent = (await file.slice(0, 100000).text()).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '·'); report = ''; q('[data-do=save]').disabled = true; q('[data-do=compare]').disabled = !files.a || !files.b;
  };
  q('[data-do=compare]').onclick = async () => {
    if (busy) return; busy = true; cancelled = false; q('[data-do=compare]').disabled = true; q('[data-do=cancel]').disabled = false; panel.querySelectorAll('[data-pick]').forEach(b => { b.disabled = true; });
    try {
      const result = await compareFiles(files.a, files.b, { cancelled: () => cancelled || disposed, progress: value => api.status(`Comparando… ${value}%`) }); if (disposed) return;
      const hex = value => value === null ? '—' : value.toString(16).padStart(2, '0').toUpperCase();
      report = `${files.a.name} (${files.a.size} bytes)\n${files.b.name} (${files.b.size} bytes)\n\n${result.equal ? 'Archivos idénticos byte por byte.' : `${result.differences} posiciones diferentes.\nPrimera diferencia: ${result.first} (0x${result.first.toString(16).toUpperCase()}).`}\n\n${result.samples.map(row => `0x${row.offset.toString(16).padStart(8, '0').toUpperCase()}  ${hex(row.a)} → ${hex(row.b)}`).join('\n')}`;
      q('.comparison-result').textContent = report; q('[data-do=save]').disabled = false; api.status(result.equal ? 'Los archivos son idénticos.' : 'Comparación completada.');
    } catch (error) { api.status(error.message, true); } finally { busy = false; if (!disposed) { q('[data-do=compare]').disabled = !files.a || !files.b; q('[data-do=cancel]').disabled = true; panel.querySelectorAll('[data-pick]').forEach(b => { b.disabled = false; }); } }
  };
  q('[data-do=cancel]').onclick = () => { cancelled = true; };
  q('[data-do=save]').onclick = () => api.save(new Blob([report], { type: 'text/plain;charset=utf-8' }), 'comparacion.txt');
  return { preventClose: () => busy, destroy() { disposed = true; cancelled = true; } };
}

export function mountHex(panel, api) {
  panel.innerHTML = `<div class="wb-body"><div class="wb-toolbar"><button data-do="open">Abrir archivo hexadecimal</button><span class="hex-name wb-help">Sin archivo</span><button data-do="save" disabled>Guardar copia binaria…</button><button data-do="undo" disabled>Deshacer byte</button><button data-do="redo" disabled>Rehacer byte</button></div><div class="wb-toolbar"><button data-do="previous" disabled>Página anterior</button><span class="hex-page wb-help"></span><button data-do="next" disabled>Página siguiente</button><label>Posición <input id="hex-offset" value="0" size="12"></label><button data-do="goto" disabled>Ir a posición</button></div><div class="wb-table-wrap hex-grid"><table class="wb-table" aria-label="Bytes hexadecimales"><tbody></tbody></table></div><div class="wb-toolbar"><label>Byte <input id="hex-byte" maxlength="2" size="3" value="00"></label><button data-do="edit" disabled>Aplicar byte</button></div><label>Pegar bytes HEX (sobrescribir desde la posición)<input id="hex-paste" maxlength="196608" placeholder="00 FF 42 7A"></label><button data-do="paste" disabled>Sobrescribir bytes</button><p class="wb-help">Hasta 16 MB. Posiciones desde cero: decimal o 0x hexadecimal. Haz clic en un byte para editarlo. No cambia el archivo original; guarda una copia. Hasta 100 cambios y 8 MB de deshacer.</p></div>`;
  const q = s => panel.querySelector(s); let data = null, filename = '', page = 0, selected = 0, undo = [], redo = [], dirty = false, disposed = false, revision = 0;
  function controls() { for (const action of ['save', 'goto', 'edit', 'paste']) q(`[data-do=${action}]`).disabled = !data || !data.length && action !== 'save'; q('[data-do=previous]').disabled = !data || page === 0; q('[data-do=next]').disabled = !data || (page + 1) * 256 >= data.length; q('[data-do=undo]').disabled = !undo.length; q('[data-do=redo]').disabled = !redo.length; }
  function render() {
    const tbody = q('tbody'); tbody.replaceChildren();
    if (!data) { controls(); return; }
    for (let offset = page * 256; offset < Math.min(data.length, (page + 1) * 256); offset += 16) {
      const row = document.createElement('tr'), heading = document.createElement('th'); heading.scope = 'row'; heading.textContent = offset.toString(16).padStart(8, '0').toUpperCase(); row.append(heading); let ascii = '';
      for (let i = offset; i < Math.min(offset + 16, data.length); i++) { const td = document.createElement('td'), button = document.createElement('button'); button.textContent = data[i].toString(16).padStart(2, '0').toUpperCase(); button.setAttribute('aria-label', `Byte ${i}: ${button.textContent}`); button.setAttribute('aria-pressed', String(i === selected)); button.onclick = () => { selected = i; q('#hex-offset').value = i; q('#hex-byte').value = data[i].toString(16).padStart(2, '0'); render(); }; td.append(button); row.append(td); ascii += data[i] >= 32 && data[i] <= 126 ? String.fromCharCode(data[i]) : '·'; }
      const text = document.createElement('td'); text.className = 'hex-ascii'; text.textContent = ascii; row.append(text); tbody.append(row);
    }
    q('.hex-page').textContent = data.length ? `${page * 256}–${Math.min(data.length, (page + 1) * 256) - 1} de ${data.length} bytes` : 'Archivo vacío'; controls();
  }
  function edit(bytes) {
    const offset = byteOffset(q('#hex-offset').value, data.length); if (offset + bytes.length > data.length) throw Error('Los bytes pegados no caben dentro del archivo.');
    undo.push({ offset, before: data.slice(offset, offset + bytes.length), after: bytes.slice() }); redo = [];
    while (undo.length > 100 || undo.reduce((n, item) => n + item.before.length + item.after.length, 0) > 8 * 1024 * 1024) undo.shift();
    data.set(bytes, offset); selected = offset; page = Math.floor(offset / 256); dirty = true; revision++; render(); api.status('Copia modificada en memoria. Guarda el resultado para conservarlo.');
  }
  q('[data-do=open]').onclick = async () => {
    const [file] = await pickFiles(); if (!file || disposed) return;
    if (file.size > 16 * 1024 * 1024) { api.status('El editor admite hasta 16 MB.', true); return; }
    if (dirty && !window.confirm('Hay cambios sin exportar. ¿Abrir otro archivo?')) return;
    const bytes = new Uint8Array(await file.arrayBuffer()); if (disposed) return; data = bytes; filename = file.name; page = selected = 0; undo = []; redo = []; dirty = false; revision++; q('.hex-name').textContent = `${file.name} · ${formatBytes(file.size)}`; q('#hex-offset').value = '0'; q('#hex-byte').value = data.length ? data[0].toString(16).padStart(2, '0') : '00'; render();
  };
  for (const [name, fn] of Object.entries({ previous: () => { page--; render(); }, next: () => { page++; render(); }, goto: () => { selected = byteOffset(q('#hex-offset').value, data.length); page = Math.floor(selected / 256); q('#hex-byte').value = data[selected].toString(16).padStart(2, '0'); render(); }, edit: () => edit(Uint8Array.of(byteValue(q('#hex-byte').value))), paste: () => edit(hexBytes(q('#hex-paste').value)) })) q(`[data-do=${name}]`).onclick = () => { try { fn(); } catch (error) { api.status(error.message, true); } };
  for (const back of [true, false]) q(`[data-do=${back ? 'undo' : 'redo'}]`).onclick = () => { const source = back ? undo : redo, target = back ? redo : undo, item = source.pop(); if (!item) return; data.set(back ? item.before : item.after, item.offset); target.push(item); selected = item.offset; page = Math.floor(selected / 256); q('#hex-offset').value = selected; q('#hex-byte').value = data[selected].toString(16).padStart(2, '0'); dirty = true; revision++; render(); };
  q('[data-do=save]').onclick = async () => { const current = revision, blob = new Blob([data]), result = await api.save(blob, filename.replace(/(\.[^.]*)?$/, '-editado$1')); if (current === revision && ['saved', 'downloaded'].includes(result)) dirty = false; };
  render(); return { preventClose: () => dirty, destroy() { disposed = true; data = null; undo = []; redo = []; } };
}

export function mountHash(panel, api) {
  panel.innerHTML = `<div class="wb-body"><div class="wb-toolbar"><button data-do="open">Calcular SHA-256 de un archivo</button><button data-do="copy" disabled>Copiar SHA-256</button><button data-do="save" disabled>Guardar huella…</button></div><p class="hash-name wb-help">Elige un archivo de hasta 100 MB.</p><pre class="wb-output" aria-label="Huella SHA-256"></pre><label>Huella esperada (opcional)<input id="hash-expected" maxlength="64" spellcheck="false" placeholder="64 cifras hexadecimales"></label><button data-do="verify" disabled>Verificar huella</button><p class="hash-check wb-message"></p><p class="wb-help">La huella permite comprobar si dos copias tienen el mismo contenido. No depende del nombre del archivo. Todo el cálculo se realiza en el dispositivo.</p></div>`;
  const q = s => panel.querySelector(s); let hash = '', filename = '', disposed = false, busy = false;
  q('[data-do=open]').onclick = async () => { const [file] = await pickFiles(); if (!file || disposed) return; if (file.size > 100 * 1024 * 1024) { api.status('El archivo supera 100 MB.', true); return; } busy = true; q('[data-do=open]').disabled = true; api.status('Calculando SHA-256…'); try { if (!crypto.subtle) throw Error('Este navegador no ofrece SHA-256 en este contexto.'); const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer()); if (disposed) return; hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join(''); filename = file.name; q('pre').textContent = hash; q('.hash-name').textContent = `${file.name} · ${formatBytes(file.size)}`; q('.hash-check').textContent = ''; for (const name of ['copy', 'save', 'verify']) q(`[data-do=${name}]`).disabled = false; api.status('Huella calculada.'); } catch (error) { api.status(error.message, true); } finally { busy = false; if (!disposed) q('[data-do=open]').disabled = false; } };
  q('[data-do=copy]').onclick = async () => { try { await navigator.clipboard.writeText(hash); api.status('Huella copiada.'); } catch { api.status('No se pudo copiar. Selecciona la huella para copiarla.', true); } };
  q('[data-do=verify]').onclick = () => { const expected = q('#hash-expected').value.trim(); if (!/^[\da-f]{64}$/i.test(expected)) { api.status('La huella esperada debe contener 64 cifras hexadecimales.', true); return; } q('.hash-check').textContent = expected.toLowerCase() === hash ? '✓ La huella coincide.' : '✕ La huella no coincide.'; };
  q('[data-do=save]').onclick = () => api.save(new Blob([`${hash}  ${filename.replace(/[\r\n]/g, '_')}\n`], { type: 'text/plain' }), 'archivo.sha256');
  return { preventClose: () => busy, destroy() { disposed = true; } };
}

export function mountGenerate(panel, api) {
  panel.innerHTML = `<div class="wb-body"><div class="wb-toolbar"><label>Nombre <input id="generate-name" value="archivo.bin" maxlength="200"></label><label>Contenido <select id="generate-mode"><option value="zero">Ceros</option><option value="byte">Byte repetido</option><option value="random">Bytes aleatorios</option><option value="text">Texto UTF-8</option></select></label></div><div class="wb-toolbar"><label>Tamaño <input id="generate-size" type="number" value="1024" min="0" max="33554432"></label><label>Unidad <select id="generate-unit"><option value="1">Bytes</option><option value="1024">KiB</option><option value="1048576">MiB</option></select></label><label>Byte HEX <input id="generate-byte" value="00" maxlength="2" size="3"></label></div><div class="wb-editor"><label for="generate-text">Texto (solo en modo Texto UTF-8)</label><textarea id="generate-text" maxlength="5000000"></textarea></div><div class="wb-toolbar"><button data-do="prepare">Preparar archivo nuevo</button><button data-do="save" disabled>Guardar archivo nuevo…</button><span class="generate-info wb-help"></span></div><p class="wb-help">Hasta 32 MiB en binario o 5 millones de caracteres en texto. El tamaño indicado se utiliza en los modos binarios. Los bytes aleatorios proceden del generador criptográfico del navegador.</p></div>`;
  const q = s => panel.querySelector(s); let prepared = null, name = '', dirty = false;
  function invalidate() { prepared = null; dirty = false; q('[data-do=save]').disabled = true; q('.generate-info').textContent = ''; }
  panel.querySelectorAll('input,select,textarea').forEach(input => input.addEventListener('input', invalidate));
  q('[data-do=prepare]').onclick = () => { try { name = validateEntryName(q('#generate-name').value); const mode = q('#generate-mode').value; prepared = mode === 'text' ? new Blob([q('#generate-text').value], { type: 'text/plain;charset=utf-8' }) : new Blob([makeBytes(Number(q('#generate-size').value) * Number(q('#generate-unit').value), mode, q('#generate-byte').value)]); dirty = true; q('[data-do=save]').disabled = false; q('.generate-info').textContent = formatBytes(prepared.size); api.status('Archivo preparado para guardar.'); } catch (error) { api.status(error.message, true); } };
  q('[data-do=save]').onclick = async () => { const blob = prepared, result = await api.save(blob, name); if (prepared === blob && ['saved', 'downloaded'].includes(result)) dirty = false; };
  return { preventClose: () => dirty, destroy() { prepared = null; } };
}
