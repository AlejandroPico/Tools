import { parseExpression, evaluateExpression } from './expressions.js';
import { conversions, convertValue } from './converters.js';
import { dateDifference, addDate, dateKey, parseDate } from './dates.js';
import { parseInteger, integerResult, integerFormats } from './programmer.js';
import { readLocal, writeLocal, notify } from '../../core/ui.js';
import { downloadFile } from '../../core/files.js';

const names = { standard: 'Estándar', scientific: 'Científica', graph: 'Gráfica', programmer: 'Programador', dates: 'Fechas y edades', units: 'Conversor de unidades' };
const numberText = value => new Intl.NumberFormat('es', { maximumSignificantDigits: 14 }).format(value);

export function mountCalculatorModes(root, mountStandard) {
  const saved = readLocal('calculator-settings', {});
  const preferences = { mode: Object.hasOwn(names, saved?.mode) ? saved.mode : 'standard', expression: typeof saved?.expression === 'string' ? saved.expression.slice(0, 300) : '', degrees: saved?.degrees !== false, ans: Number.isFinite(saved?.ans) ? saved.ans : 0 };
  root.innerHTML = `<div class="calculator-workbench"><div class="calculator-navigation"><button class="calculator-menu-toggle" aria-label="Modos de calculadora" aria-expanded="false">☰</button><strong class="calculator-current-mode"></strong></div><nav class="calculator-mode-menu" aria-label="Modos de calculadora" hidden></nav><div class="calculator-mode-body"></div></div>`;
  const body = root.querySelector('.calculator-mode-body'), menu = root.querySelector('.calculator-mode-menu'), toggle = root.querySelector('.calculator-menu-toggle');
  let controller;
  const persist = () => writeLocal('calculator-settings', preferences);
  for (const [mode, name] of Object.entries(names)) {
    const button = document.createElement('button'); button.textContent = name; button.dataset.mode = mode;
    button.addEventListener('click', () => show(mode)); menu.append(button);
  }
  function show(mode) {
    controller?.destroy?.(); preferences.mode = mode; persist();
    menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); root.querySelector('.calculator-current-mode').textContent = names[mode];
    menu.querySelectorAll('button').forEach(button => button.setAttribute('aria-current', button.dataset.mode === mode ? 'page' : 'false'));
    const panel = document.createElement('div'); panel.className = 'calculator-mode-content'; body.replaceChildren(panel);
    if (mode === 'standard') controller = mountStandard(panel);
    if (mode === 'scientific') controller = scientific(panel, preferences, persist);
    if (mode === 'graph') controller = graph(panel);
    if (mode === 'programmer') controller = programmer(panel);
    if (mode === 'dates') controller = dates(panel);
    if (mode === 'units') controller = units(panel);
  }
  toggle.addEventListener('click', () => { menu.hidden = !menu.hidden; toggle.setAttribute('aria-expanded', String(!menu.hidden)); if (!menu.hidden) menu.querySelector('button').focus(); });
  root.addEventListener('pointerdown', event => { if (!event.target.closest('.calculator-mode-menu,.calculator-menu-toggle')) { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); } });
  root.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); } });
  show(preferences.mode);
  return { destroy: () => { controller?.destroy?.(); persist(); } };
}

function scientific(root, preferences, persist) {
  root.innerHTML = `<div class="advanced-calc"><form class="scientific-form"><label class="field-label">Expresión<input class="scientific-input" aria-label="Expresión científica" placeholder="sin(30) + 2^3" maxlength="300" autocomplete="off" data-initial-focus></label><div class="scientific-options"><label>Ángulos<select class="scientific-angle"><option value="degrees">Grados (DEG)</option><option value="radians">Radianes (RAD)</option></select></label><label>Variable x<input class="scientific-x" type="number" step="any" value="0"></label></div><output class="advanced-result scientific-result" aria-label="Resultado científico" aria-live="polite">0</output><p class="advanced-error scientific-error" role="status"></p><div class="scientific-keypad"></div><button class="primary-button scientific-evaluate">Calcular</button><button class="secondary-button scientific-copy" type="button">Copiar resultado</button></form><p class="status-text">Paréntesis y prioridad de operaciones. Funciones: sin, cos, tan, asin, acos, atan, sqrt, abs, ln, log, exp, floor, ceil, round. Potencias con ^, factorial con ! y resto de la división con %. «ans» recupera el último resultado.</p></div>`;
  const input = root.querySelector('.scientific-input'), angle = root.querySelector('.scientific-angle'), output = root.querySelector('.scientific-result');
  input.value = preferences.expression; angle.value = preferences.degrees ? 'degrees' : 'radians';
  for (const label of ['sin(', 'cos(', 'tan(', 'ln(', 'log(', 'sqrt(', 'abs(', '^', '!', '(', ')', 'pi', 'e', 'ans', '⌫', '7', '8', '9', '/', 'C', '4', '5', '6', '*', '%', '1', '2', '3', '-', '.', '0', '+']) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
    button.addEventListener('click', () => {
      const start = input.selectionStart ?? input.value.length, end = input.selectionEnd ?? start;
      if (label === 'C') input.value = '';
      else if (label === '⌫') { input.value = input.value.slice(0, Math.max(0, start - (start === end ? 1 : 0))) + input.value.slice(end); input.setSelectionRange(Math.max(0, start - 1), Math.max(0, start - 1)); }
      else { input.value = input.value.slice(0, start) + label + input.value.slice(end); input.setSelectionRange(start + label.length, start + label.length); }
      preferences.expression = input.value; persist(); input.focus();
    }); root.querySelector('.scientific-keypad').append(button);
  }
  input.addEventListener('input', () => { preferences.expression = input.value; persist(); });
  angle.addEventListener('change', () => { preferences.degrees = angle.value === 'degrees'; persist(); });
  let result;
  root.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      result = evaluateExpression(parseExpression(input.value), { degrees: angle.value === 'degrees', ans: preferences.ans, x: Number(root.querySelector('.scientific-x').value) });
      preferences.ans = result; preferences.expression = input.value; persist(); output.textContent = numberText(result); root.querySelector('.scientific-error').textContent = '';
    } catch (error) { result = undefined; output.textContent = '—'; root.querySelector('.scientific-error').textContent = error.message; }
  });
  root.querySelector('.scientific-copy').addEventListener('click', async () => {
    if (result === undefined) return;
    try { await navigator.clipboard.writeText(numberText(result)); notify('Resultado copiado.'); } catch { notify('No se pudo copiar. Puedes seleccionar el resultado.'); }
  });
}

function units(root) {
  root.innerHTML = `<div class="advanced-calc"><label class="field-label">Magnitud<select class="unit-category" aria-label="Magnitud para convertir"></select></label><label class="field-label">Valor<input class="unit-value" aria-label="Valor para convertir" inputmode="decimal" value="1" data-initial-focus></label><label class="field-label">De<select class="unit-from" aria-label="Unidad de origen"></select></label><button class="secondary-button unit-swap">⇅ Intercambiar unidades</button><label class="field-label">A<select class="unit-to" aria-label="Unidad de destino"></select></label><output class="advanced-result unit-result" aria-label="Resultado de la conversión" aria-live="polite"></output><p class="advanced-error unit-error" role="status"></p><p class="status-text">Conversiones locales. Los galones de EE. UU. e imperiales y las unidades decimales y binarias de datos se distinguen expresamente.</p></div>`;
  const $ = selector => root.querySelector(selector);
  for (const category of conversions) { const option = document.createElement('option'); option.value = category.id; option.textContent = category.name; $('.unit-category').append(option); }
  function update() {
    try {
      if (!$('.unit-value').value.trim()) throw new Error('Introduce un valor.');
      const value = convertValue($('.unit-category').value, $('.unit-from').value, $('.unit-to').value, Number($('.unit-value').value.replace(',', '.')));
      $('.unit-result').textContent = `${numberText(value)} ${$('.unit-to').selectedOptions[0].textContent}`; $('.unit-error').textContent = '';
    } catch (error) { $('.unit-result').textContent = '—'; $('.unit-error').textContent = error.message; }
  }
  function selectCategory() {
    const category = conversions.find(item => item.id === $('.unit-category').value);
    for (const selector of ['.unit-from', '.unit-to']) {
      $(selector).replaceChildren(); for (const unit of category.units) { const option = document.createElement('option'); option.value = unit.id; option.textContent = unit.label; $(selector).append(option); }
    }
    $('.unit-to').selectedIndex = 1; update();
  }
  $('.unit-category').addEventListener('change', selectCategory);
  for (const selector of ['.unit-value', '.unit-from', '.unit-to']) $(selector).addEventListener('input', update);
  $('.unit-swap').addEventListener('click', () => { const from = $('.unit-from').value; $('.unit-from').value = $('.unit-to').value; $('.unit-to').value = from; update(); });
  selectCategory();
}

function dates(root) {
  root.innerHTML = `<div class="advanced-calc"><form class="dates-difference"><h3>Diferencia y edad</h3><label class="field-label">Fecha inicial / nacimiento<input class="date-from" type="date" min="0001-01-01" max="9999-12-31" required data-initial-focus></label><label class="field-label">Fecha final<input class="date-to" type="date" min="0001-01-01" max="9999-12-31" required></label><button class="primary-button">Calcular diferencia</button><output class="date-result" aria-live="polite"></output></form><form class="dates-add"><h3>Sumar o restar a la fecha inicial</h3><div class="compact-form"><label>Cantidad<input class="date-amount" type="number" step="1" value="1" required></label><label>Unidad<select class="date-unit"><option value="days">Días</option><option value="months">Meses</option><option value="years">Años</option></select></label></div><button class="secondary-button">Calcular fecha</button><output class="date-add-result" aria-live="polite"></output></form><p class="status-text">Usa una cantidad negativa para restar. Los meses y años se ajustan al último día válido cuando es necesario.</p></div>`;
  const $ = selector => root.querySelector(selector); $('.date-from').value = dateKey(); $('.date-to').value = dateKey();
  $('.dates-difference').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const result = dateDifference($('.date-from').value, $('.date-to').value);
      $('.date-result').textContent = `${result.days} días de diferencia. Periodo: ${result.years} años, ${result.months} meses y ${result.remainingDays} días.${result.negative ? ' La fecha final es anterior a la inicial.' : ''}`;
    } catch (error) { $('.date-result').textContent = error.message; }
  });
  $('.dates-add').addEventListener('submit', event => {
    event.preventDefault(); try { const value = addDate($('.date-from').value, Number($('.date-amount').value), $('.date-unit').value); $('.date-add-result').textContent = `${value} · ${new Intl.DateTimeFormat('es', { dateStyle: 'long', timeZone: 'UTC' }).format(parseDate(value))}`; } catch (error) { $('.date-add-result').textContent = error.message; }
  });
}

function programmer(root) {
  root.innerHTML = `<div class="advanced-calc"><form class="programmer-form"><div class="compact-form"><label>Base de entrada<select class="programmer-base"><option value="10">Decimal</option><option value="16">Hexadecimal</option><option value="2">Binaria</option><option value="8">Octal</option></select></label><label>Palabra<select class="programmer-bits"><option>8</option><option>16</option><option>32</option><option selected>64</option></select></label><label class="programmer-signed-label"><input class="programmer-signed" type="checkbox"> Con signo</label></div><label class="field-label">Operando A<input class="programmer-a" value="255" aria-label="Operando A" autocomplete="off" data-initial-focus></label><label class="field-label">Operación<select class="programmer-operation"></select></label><label class="field-label">Operando B<input class="programmer-b" value="1" aria-label="Operando B" autocomplete="off"></label><button class="primary-button">Calcular</button><button type="button" class="secondary-button programmer-use">Usar resultado como A</button></form><p class="advanced-error programmer-error" role="status"></p><dl class="programmer-results"></dl><div class="bit-grid" aria-label="Bits del resultado"></div><p class="status-text">Enteros de precisión exacta. La palabra fija usa complemento a dos y aritmética modular: los desbordamientos se ajustan al número de bits seleccionado.</p></div>`;
  const $ = selector => root.querySelector(selector); let result = 255n;
  for (const operation of ['+', '-', '*', '/', '%', 'AND', 'OR', 'XOR', 'NOT', '<<', '>>']) { const option = document.createElement('option'); option.value = operation; option.textContent = operation === 'NOT' ? 'NOT A' : operation; $('.programmer-operation').append(option); }
  function render() {
    const bits = Number($('.programmer-bits').value), signed = $('.programmer-signed').checked;
    const formats = integerFormats(result, bits, signed); const target = $('.programmer-results'); target.replaceChildren();
    for (const [name, value] of Object.entries(formats)) { const label = document.createElement('dt'); label.textContent = name; const output = document.createElement('dd'); output.textContent = name === 'BIN' ? value.match(/.{1,4}/g).join(' ') : value; target.append(label, output); }
    const grid = $('.bit-grid'); grid.replaceChildren();
    for (let bit = bits - 1; bit >= 0; bit--) {
      const button = document.createElement('button'); const enabled = (BigInt.asUintN(bits, result) >> BigInt(bit) & 1n) === 1n;
      button.textContent = `${enabled ? '1' : '0'}`; button.setAttribute('aria-label', `Bit ${bit}: ${enabled ? 1 : 0}`); button.classList.toggle('bit-on', enabled);
      button.addEventListener('click', () => { result ^= 1n << BigInt(bit); render(); }); grid.append(button);
    }
  }
  $('.programmer-form').addEventListener('submit', event => {
    event.preventDefault(); try {
      const base = Number($('.programmer-base').value); const operation = $('.programmer-operation').value;
      result = integerResult(parseInteger($('.programmer-a').value, base), operation === 'NOT' ? 0n : parseInteger($('.programmer-b').value, base), operation, Number($('.programmer-bits').value), $('.programmer-signed').checked);
      $('.programmer-error').textContent = ''; render();
    } catch (error) { $('.programmer-error').textContent = error.message; }
  });
  $('.programmer-base').addEventListener('change', () => { $('.programmer-a').value = BigInt.asUintN(Number($('.programmer-bits').value), result).toString(Number($('.programmer-base').value)).toUpperCase(); $('.programmer-b').value = '1'; });
  for (const selector of ['.programmer-bits', '.programmer-signed']) $(selector).addEventListener('change', render);
  $('.programmer-use').addEventListener('click', () => { const formats = integerFormats(result, Number($('.programmer-bits').value), $('.programmer-signed').checked); const base = Number($('.programmer-base').value); $('.programmer-a').value = base === 10 ? formats.DEC : BigInt.asUintN(Number($('.programmer-bits').value), result).toString(base).toUpperCase(); });
  render();
}

function graph(root) {
  root.innerHTML = `<div class="advanced-calc graph-calc"><form class="graph-form"><label class="field-label">f(x)<input class="graph-function" value="sin(x)" aria-label="Función f de x" maxlength="300" data-initial-focus></label><label class="field-label">g(x), opcional<input class="graph-function" aria-label="Función g de x" maxlength="300" placeholder="x^2 / 5"></label><label class="field-label">h(x), opcional<input class="graph-function" aria-label="Función h de x" maxlength="300"></label><div class="graph-ranges"><label>X mín<input data-range="xmin" type="number" step="any" value="-10"></label><label>X máx<input data-range="xmax" type="number" step="any" value="10"></label><label>Y mín<input data-range="ymin" type="number" step="any" value="-10"></label><label>Y máx<input data-range="ymax" type="number" step="any" value="10"></label></div><div class="clock-buttons"><button class="primary-button">Representar</button><button class="secondary-button graph-zoom-in" type="button">Acercar +</button><button class="secondary-button graph-zoom-out" type="button">Alejar −</button></div></form><p class="advanced-error graph-error" role="status"></p><canvas class="graph-canvas" aria-label="Gráfica de funciones. Ajusta los rangos o usa los botones de zoom."></canvas><p class="graph-position status-text">Arrastra para desplazar. Rueda del ratón para acercar o alejar. Ángulos en radianes.</p><div class="clock-buttons"><button class="secondary-button graph-png">Descargar PNG</button><button class="secondary-button graph-csv">Exportar muestras CSV</button></div></div>`;
  const canvas = root.querySelector('canvas'), context = canvas.getContext('2d');
  const fields = root.querySelectorAll('.graph-function'); const rangeFields = [...root.querySelectorAll('[data-range]')];
  let range = { xmin: -10, xmax: 10, ymin: -10, ymax: 10 }, compiled = [], frame, disposed = false;
  const colors = ['#478ec4', '#c78b43', '#a478c3'];
  function syncFields() { rangeFields.forEach(field => { field.value = String(Number(range[field.dataset.range].toPrecision(9))); }); }
  function draw() {
    if (disposed || !context) return;
    const width = Math.max(200, canvas.clientWidth), height = 260, ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const style = getComputedStyle(root); context.fillStyle = style.getPropertyValue('--input').trim(); context.fillRect(0, 0, width, height);
    const px = x => (x - range.xmin) / (range.xmax - range.xmin) * width;
    const py = y => height - (y - range.ymin) / (range.ymax - range.ymin) * height;
    context.lineWidth = 1; context.strokeStyle = style.getPropertyValue('--line').trim(); context.beginPath();
    for (let i = 0; i <= 10; i++) { context.moveTo(width * i / 10, 0); context.lineTo(width * i / 10, height); context.moveTo(0, height * i / 10); context.lineTo(width, height * i / 10); } context.stroke();
    context.strokeStyle = style.getPropertyValue('--muted').trim(); context.beginPath(); context.moveTo(px(0), 0); context.lineTo(px(0), height); context.moveTo(0, py(0)); context.lineTo(width, py(0)); context.stroke();
    context.fillStyle = style.getPropertyValue('--muted').trim(); context.font = '10px Segoe UI';
    context.fillText(String(Number(range.xmin.toPrecision(4))), 5, height - 7); context.fillText(String(Number(range.xmax.toPrecision(4))), width - 45, height - 7); context.fillText(String(Number(range.ymax.toPrecision(4))), 5, 13); context.fillText(String(Number(range.ymin.toPrecision(4))), 5, height - 22);
    compiled = []; const errors = [];
    fields.forEach((field, index) => {
      if (!field.value.trim()) return;
      try { compiled.push({ tree: parseExpression(field.value), index, expression: field.value }); } catch (error) { errors.push(`${'fgh'[index]}: ${error.message}`); }
    });
    for (const item of compiled) {
      context.strokeStyle = colors[item.index]; context.lineWidth = 2; context.beginPath(); let previous = null;
      for (let i = 0; i <= Math.min(1000, width * 2); i++) {
        const pixel = i / Math.min(1000, width * 2) * width;
        try {
          const y = py(evaluateExpression(item.tree, { x: range.xmin + pixel / width * (range.xmax - range.xmin) }));
          if (!Number.isFinite(y) || Math.abs(y) > height * 50) { previous = null; continue; }
          if (previous === null || Math.abs(y - previous) > height * 1.5) context.moveTo(pixel, y); else context.lineTo(pixel, y);
          previous = y;
        } catch { previous = null; }
      }
      context.stroke();
    }
    root.querySelector('.graph-error').textContent = errors.join(' · ');
  }
  function requestDraw() { cancelAnimationFrame(frame); frame = requestAnimationFrame(draw); }
  root.querySelector('.graph-form').addEventListener('submit', event => {
    event.preventDefault(); const next = Object.fromEntries(rangeFields.map(field => [field.dataset.range, Number(field.value)]));
    if (Object.values(next).some(value => !Number.isFinite(value) || Math.abs(value) > 1e12) || next.xmin >= next.xmax || next.ymin >= next.ymax) { root.querySelector('.graph-error').textContent = 'Los mínimos deben ser menores que los máximos y estar dentro de ±10¹².'; return; }
    range = next; draw();
  });
  function zoom(factor) {
    const cx = (range.xmin + range.xmax) / 2, cy = (range.ymin + range.ymax) / 2;
    const dx = Math.min(1e12, Math.max(1e-8, (range.xmax - range.xmin) * factor / 2)), dy = Math.min(1e12, Math.max(1e-8, (range.ymax - range.ymin) * factor / 2));
    range = { xmin: cx - dx, xmax: cx + dx, ymin: cy - dy, ymax: cy + dy }; syncFields(); requestDraw();
  }
  root.querySelector('.graph-zoom-in').addEventListener('click', () => zoom(.6)); root.querySelector('.graph-zoom-out').addEventListener('click', () => zoom(1.6));
  canvas.addEventListener('wheel', event => { if (event.ctrlKey) return; event.preventDefault(); zoom(event.deltaY > 0 ? 1.2 : .8); }, { passive: false });
  let drag;
  canvas.addEventListener('pointerdown', event => { if (event.button !== 0) return; drag = { x: event.clientX, y: event.clientY, range: { ...range } }; canvas.setPointerCapture(event.pointerId); });
  canvas.addEventListener('pointermove', event => {
    if (!drag) return;
    const dx = (event.clientX - drag.x) / canvas.clientWidth * (drag.range.xmax - drag.range.xmin), dy = (event.clientY - drag.y) / canvas.clientHeight * (drag.range.ymax - drag.range.ymin);
    range = { xmin: drag.range.xmin - dx, xmax: drag.range.xmax - dx, ymin: drag.range.ymin + dy, ymax: drag.range.ymax + dy }; syncFields(); requestDraw();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(type, () => { drag = null; });
  root.querySelector('.graph-png').addEventListener('click', () => canvas.toBlob(blob => { if (blob) downloadFile(blob, 'tools-grafica.png'); }));
  root.querySelector('.graph-csv').addEventListener('click', () => {
    const lines = [['x', ...compiled.map(item => `${'fgh'[item.index]}(x)=${item.expression}`)].map(value => `"${value.replace(/"/g, '""')}"`).join(',')];
    for (let i = 0; i <= 200; i++) { const x = range.xmin + (range.xmax - range.xmin) * i / 200; lines.push([x, ...compiled.map(item => { try { return evaluateExpression(item.tree, { x }); } catch { return ''; } })].join(',')); }
    downloadFile(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }), 'tools-grafica.csv');
  });
  const observer = new ResizeObserver(requestDraw); observer.observe(canvas); window.addEventListener('tools:theme-change', requestDraw); requestDraw();
  return { destroy: () => { disposed = true; observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('tools:theme-change', requestDraw); } };
}
