import { workbench } from '../../core/workbench.js';
import { loadImage, canvasBlob } from '../../core/raster.js';
import { generatePassword, sampleIntegers, drawNames, barcodeValue } from './model.js';

export function mountUtilities(root) {
  return workbench(root, { passwords: 'Contraseñas', qr: 'QR', barcode: 'Códigos de barras', numbers: 'Números', draw: 'Sorteos' }, (mode, panel, api) => {
    panel.innerHTML = '<div class="wb-body"></div>'; const body = panel.firstElementChild, q = selector => body.querySelector(selector);
    let disposed = false;
    const attempt = fn => { try { fn(); } catch (error) { api.status(error.message, true); } };
    const textFile = (text, name) => api.save(new Blob([text], { type: 'text/plain;charset=utf-8' }), name);
    if (mode === 'passwords') {
      body.innerHTML = `<div class="wb-toolbar"><label>Longitud <input id="password-length" type="number" min="4" max="256" value="20"></label><button data-do="generate">Generar contraseña</button></div><div class="wb-toolbar"><label><input type="checkbox" name="lower" checked>Minúsculas</label><label><input type="checkbox" name="upper" checked>Mayúsculas</label><label><input type="checkbox" name="digits" checked>Números</label><label><input type="checkbox" name="symbols" checked>Símbolos</label><label><input type="checkbox" name="clear">Evitar caracteres parecidos</label></div><label>Contraseña generada <input id="password-result" type="password" readonly autocomplete="off" class="utility-password"></label><div class="wb-toolbar"><button data-do="reveal" aria-pressed="false">Mostrar</button><button data-do="copy" disabled>Copiar contraseña</button><button data-do="save" disabled>Guardar contraseña…</button><button data-do="clear">Vaciar</button></div><p class="wb-help">Se usa el generador criptográfico del navegador. La contraseña no se guarda como borrador ni se envía fuera del dispositivo. Descárgala o cópiala si quieres conservarla.</p>`;
      q('[data-do=generate]').onclick = () => attempt(() => { const options = Object.fromEntries([...body.querySelectorAll('input[type=checkbox]')].map(input => [input.name, input.checked])); q('#password-result').value = generatePassword(Number(q('#password-length').value), options); q('[data-do=copy]').disabled = false; q('[data-do=save]').disabled = false; api.status('Contraseña generada.'); });
      q('[data-do=reveal]').onclick = () => { const input = q('#password-result'), visible = input.type === 'password'; input.type = visible ? 'text' : 'password'; q('[data-do=reveal]').textContent = visible ? 'Ocultar' : 'Mostrar'; q('[data-do=reveal]').setAttribute('aria-pressed', String(visible)); };
      q('[data-do=copy]').onclick = async () => { try { await navigator.clipboard.writeText(q('#password-result').value); api.status('Contraseña copiada.'); } catch { api.status('No se pudo copiar. Puedes mostrarla y seleccionarla.', true); } };
      q('[data-do=save]').onclick = () => textFile(q('#password-result').value + '\n', 'contraseña.txt');
      q('[data-do=clear]').onclick = () => { q('#password-result').value = ''; q('[data-do=copy]').disabled = q('[data-do=save]').disabled = true; api.status('Contraseña retirada de la ventana.'); };
    } else if (mode === 'numbers') {
      body.innerHTML = `<div class="wb-toolbar"><label>Mínimo <input id="random-min" type="number" value="1"></label><label>Máximo <input id="random-max" type="number" value="100"></label><label>Cantidad <input id="random-count" type="number" min="1" max="10000" value="10"></label><label><input id="random-repeat" type="checkbox">Permitir repetidos</label><button data-do="generate">Generar números</button><button data-do="save" disabled>Guardar números…</button></div><pre class="wb-output" aria-label="Números generados"></pre><p class="wb-help">Límites incluidos. Admite enteros seguros de JavaScript y hasta 10.000 resultados, con selección criptográfica uniforme.</p>`;
      q('[data-do=generate]').onclick = () => attempt(() => { const numbers = sampleIntegers(...['min', 'max', 'count'].map(name => Number(q('#random-' + name).value)), q('#random-repeat').checked); q('pre').textContent = numbers.join(', '); q('[data-do=save]').disabled = false; api.status(`${numbers.length} números generados.`); });
      q('[data-do=save]').onclick = () => textFile(q('pre').textContent + '\n', 'numeros.txt');
    } else if (mode === 'draw') {
      body.innerHTML = `<div class="wb-editor"><label for="draw-names">Participantes · uno por línea</label><textarea id="draw-names" maxlength="500000" placeholder="Ana\nLuis\nMarta"></textarea></div><div class="wb-toolbar"><label>Ganadores <input id="draw-count" type="number" min="1" max="10000" value="1"></label><label><input id="draw-unique" type="checkbox" checked>Unificar nombres repetidos</label><button data-do="draw">Realizar sorteo</button><button data-do="save" disabled>Guardar resultado del sorteo…</button></div><pre class="wb-output" aria-label="Ganadores del sorteo"></pre><p class="wb-help">Selección aleatoria sin repetir participaciones, hasta 10.000 líneas. La lista y el resultado permanecen en esta ventana hasta cerrarla.</p>`;
      q('[data-do=draw]').onclick = () => attempt(() => { const result = drawNames(q('#draw-names').value, Number(q('#draw-count').value), q('#draw-unique').checked); q('pre').textContent = `Sorteo · ${new Date().toLocaleString('es')}\n${result.total} participaciones\n\n${result.winners.map((name, i) => `${i + 1}. ${name}`).join('\n')}`; q('[data-do=save]').disabled = false; api.status('Sorteo completado.'); });
      q('[data-do=save]').onclick = () => textFile(q('pre').textContent + '\n', 'sorteo.txt');
    } else {
      let svgSource = '', rasterSize = { width: 600, height: 600 }, version = 0;
      body.innerHTML = `<div class="wb-editor"><label for="${mode}-input">${mode === 'qr' ? 'Texto o enlace para QR' : 'Contenido del código de barras'}</label><textarea id="${mode}-input" maxlength="2000" style="min-height:85px;flex:0"></textarea></div><div class="wb-toolbar">${mode === 'qr' ? '<label>Corrección de errores <select id="qr-format"><option value="L">Baja (L)</option><option value="M" selected>Media (M)</option><option value="Q">Alta (Q)</option><option value="H">Máxima (H)</option></select></label>' : '<label>Formato <select id="barcode-format"><option>CODE128</option><option>CODE39</option><option>EAN13</option><option>EAN8</option><option>UPC</option><option>ITF14</option></select></label>'}<button data-do="generate">Generar ${mode === 'qr' ? 'QR' : 'código de barras'}</button><button data-do="svg" disabled>Guardar SVG…</button><button data-do="png" disabled>Guardar PNG…</button></div><div class="utility-code-preview" aria-label="Vista del código"><p class="wb-help">Introduce el contenido y pulsa Generar.</p></div><p class="wb-help">${mode === 'qr' ? 'QR en negro sobre blanco, con margen de lectura. Admite texto UTF-8; la capacidad depende del nivel de corrección elegido.' : 'EAN, UPC e ITF permiten calcular o verificar la cifra de control. Los códigos se generan con márgenes y fondo blanco.'} Puedes descargar SVG vectorial o PNG. El contenido no se guarda al cerrar.</p>`;
      const invalidate = () => { version++; svgSource = ''; q('[data-do=svg]').disabled = q('[data-do=png]').disabled = true; q('.utility-code-preview').replaceChildren(); };
      q('#' + mode + '-input').oninput = invalidate; q('#' + mode + '-format').onchange = invalidate;
      q('[data-do=generate]').onclick = async () => {
        invalidate(); const token = version; api.status('Generando código…');
        try {
          const text = q('#' + mode + '-input').value, format = q('#' + mode + '-format').value;
          if (!text) throw Error('Introduce el contenido del código.');
          if (mode === 'qr') {
            if (new TextEncoder().encode(text).length > 1800) throw Error('El texto supera 1.800 bytes. Reduce el contenido.');
            const { default: QRCode } = await import('../../vendor/qrcode.js');
            if (disposed || token !== version) return;
            let qr; try { qr = QRCode.create(text, { errorCorrectionLevel: format }); } catch { throw Error('El contenido no cabe con ese nivel de corrección. Reduce el texto o elige otro nivel.'); }
            const n = qr.modules.size, size = n + 8, paths = [];
            for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.modules.data[y * n + x]) paths.push(`M${x + 4} ${y + 4}h1v1h-1z`);
            svgSource = `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 6}" height="${size * 6}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${paths.join('')}" fill="#000"/></svg>`;
            rasterSize = { width: size * 6, height: size * 6 };
          } else {
            const value = barcodeValue(text, format), { default: JsBarcode } = await import('../../vendor/barcode.js');
            if (disposed || token !== version) return;
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            JsBarcode(svg, value, { format, width: 2, height: 90, margin: 16, fontSize: 18, background: '#ffffff', lineColor: '#000000' });
            svgSource = new XMLSerializer().serializeToString(svg);
            const scale = Math.min(2, 4096 / Number(svg.getAttribute('width')));
            rasterSize = { width: Math.round(Number(svg.getAttribute('width')) * scale), height: Math.round(Number(svg.getAttribute('height')) * scale) };
          }
          if (disposed || token !== version) return;
          const image = document.createElement('img'), url = URL.createObjectURL(new Blob([svgSource], { type: 'image/svg+xml' }));
          image.alt = mode === 'qr' ? 'Código QR generado' : 'Código de barras generado';
          image.onload = image.onerror = () => URL.revokeObjectURL(url); image.src = url;
          q('.utility-code-preview').replaceChildren(image); q('[data-do=svg]').disabled = q('[data-do=png]').disabled = false; api.status('Código generado.');
        } catch (error) { if (!disposed) { svgSource = ''; api.status(error.message, true); } }
      };
      q('[data-do=svg]').onclick = () => { if (svgSource) api.save(new Blob([svgSource], { type: 'image/svg+xml' }), `${mode}.svg`); };
      q('[data-do=png]').onclick = () => {
        if (!svgSource) return; const source = svgSource, size = rasterSize;
        const blob = (async () => { const image = await loadImage(new Blob([source], { type: 'image/svg+xml' })), canvas = document.createElement('canvas'); canvas.width = size.width; canvas.height = size.height; const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false; ctx.drawImage(image, 0, 0, size.width, size.height); return canvasBlob(canvas); })();
        api.save(blob, `${mode}.png`);
      };
    }
    return { destroy() { disposed = true; body.querySelectorAll('input,textarea').forEach(input => { input.value = ''; }); body.replaceChildren(); } };
  }, { label: 'Utilidades', help: 'Los resultados se procesan en este dispositivo.' });
}
