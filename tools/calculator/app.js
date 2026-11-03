import { Calculator, formatDisplay } from './engine.js';
import { readLocal, writeLocal, notify, icon } from '../../core/ui.js';
import { downloadFile } from '../../core/files.js';

export function mountCalculator(root) {
  const calc = new Calculator();
  const stored = readLocal('calculator-history', []);
  calc.history = Array.isArray(stored) ? stored.filter(item => item && typeof item.expression === 'string' && typeof item.result === 'string' && Number.isFinite(Number(item.result))).slice(0, 50) : [];
  root.innerHTML = `<div class="calc-shell" tabindex="0" data-initial-focus aria-label="Calculadora. Puedes escribir con el teclado."><div class="window-subheading"><strong>Estándar</strong><button class="calc-history-toggle" aria-expanded="false">↶ <span>Historial</span></button></div><div class="calc-screen"><div class="calc-expression"></div><output class="calc-display" aria-live="polite" aria-label="Resultado">0</output><span class="calc-error" role="status"></span><button class="calc-copy" title="Copiar resultado" aria-label="Copiar resultado">Copiar resultado</button></div><div class="calc-memory"><button data-key="MC" title="Borrar memoria">MC</button><button data-key="MR" title="Recuperar memoria">MR</button><button data-key="M+" title="Sumar a memoria">M+</button><button data-key="M-" title="Restar de memoria">M−</button><span class="memory-indicator" title="Valor en memoria"></span></div><div class="calc-keys"></div><div class="calc-footer"><span>↵ = resultado</span><span>Esc = borrar</span></div><section class="calc-history" hidden aria-label="Historial de cálculos"><div class="history-heading"><strong>Historial</strong><button class="history-close" aria-label="Cerrar historial">×</button></div><div class="history-items"></div><div class="history-actions"><button class="secondary-button history-export">${icon('download')} Exportar TXT</button><button class="secondary-button history-clear">Vaciar</button></div></section></div>`;
  const keys = [
    ['%', '%', 'Porcentaje'], ['CE', 'CE', 'Borrar entrada'], ['C', 'C', 'Borrar todo'], ['back', '⌫', 'Borrar última cifra'],
    ['inverse', '1/x', 'Inverso'], ['square', 'x²', 'Elevar al cuadrado'], ['sqrt', '√x', 'Raíz cuadrada'], ['/', '÷', 'Dividir'],
    ['7', '7'], ['8', '8'], ['9', '9'], ['*', '×', 'Multiplicar'],
    ['4', '4'], ['5', '5'], ['6', '6'], ['-', '−', 'Restar'],
    ['1', '1'], ['2', '2'], ['3', '3'], ['+', '+', 'Sumar'],
    ['sign', '+/−', 'Cambiar signo'], ['0', '0'], ['.', ',', 'Separador decimal'], ['=', '=', 'Igual'],
  ];
  for (const [key, label, accessible] of keys) {
    const button = document.createElement('button');
    button.dataset.key = key; button.textContent = label;
    button.setAttribute('aria-label', accessible || label);
    button.className = /^\d$|^\.$/.test(key) ? 'number-key' : key === '=' ? 'equals-key' : 'function-key';
    root.querySelector('.calc-keys').append(button);
  }
  function render() {
    const display = root.querySelector('.calc-display');
    display.textContent = formatDisplay(calc.display);
    display.style.fontSize = display.textContent.length > 13 ? '29px' : display.textContent.length > 10 ? '36px' : '';
    root.querySelector('.calc-expression').textContent = calc.expression.replace(/\./g, ',');
    root.querySelector('.calc-error').textContent = calc.error;
    root.querySelector('.memory-indicator').textContent = calc.memory !== null ? 'M' : '';
    root.querySelector('[data-key="MR"]').disabled = calc.memory === null;
    root.querySelector('[data-key="MC"]').disabled = calc.memory === null;
  }
  function renderHistory() {
    const list = root.querySelector('.history-items');
    list.replaceChildren();
    if (!calc.history.length) {
      const empty = document.createElement('p'); empty.className = 'status-text'; empty.textContent = 'Tus próximos cálculos aparecerán aquí.'; list.append(empty);
    }
    for (const item of calc.history) {
      const button = document.createElement('button'); button.className = 'history-item';
      const expression = document.createElement('span'); expression.textContent = item.expression.replace(/\./g, ',');
      const result = document.createElement('strong'); result.textContent = formatDisplay(item.result);
      button.append(expression, result); button.title = 'Recuperar este resultado';
      button.addEventListener('click', () => { calc.clear(); calc.display = item.result; calc.completed = true; render(); toggleHistory(false); });
      list.append(button);
    }
    root.querySelector('.history-export').disabled = !calc.history.length;
    root.querySelector('.history-clear').disabled = !calc.history.length;
  }
  function execute(key) {
    const count = calc.history[0];
    calc.input(key); render();
    if (calc.history[0] !== count) {
      if (!writeLocal('calculator-history', calc.history)) notify('El historial no se pudo guardar. Puedes exportarlo como TXT.');
      renderHistory();
    }
  }
  root.addEventListener('click', event => { const button = event.target.closest('[data-key]'); if (button) execute(button.dataset.key); });
  root.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || !root.querySelector('.calc-history').hidden) return;
    const aliases = { Enter: '=', Escape: 'C', Delete: 'CE', Backspace: 'back', ',': '.', 'x': '*' };
    const key = aliases[event.key] || event.key;
    if (/^[\d.+\-*/%=]$/.test(key) || ['C', 'CE', 'back'].includes(key)) { event.preventDefault(); execute(key); }
  });
  function toggleHistory(open) {
    root.querySelector('.calc-history').hidden = !open;
    root.querySelector('.calc-history-toggle').setAttribute('aria-expanded', String(open));
    if (open) { renderHistory(); root.querySelector('.history-close').focus(); }
    else root.querySelector('.calc-history-toggle').focus();
  }
  root.querySelector('.calc-history-toggle').addEventListener('click', () => toggleHistory(root.querySelector('.calc-history').hidden));
  root.querySelector('.history-close').addEventListener('click', () => toggleHistory(false));
  root.querySelector('.history-clear').addEventListener('click', () => {
    calc.history = [];
    if (!writeLocal('calculator-history', [])) notify('El historial se ha vaciado en esta sesión, pero no se pudo actualizar el guardado local.');
    renderHistory();
  });
  root.querySelector('.history-export').addEventListener('click', () => downloadFile(new Blob([calc.history.map(item => `${item.expression} ${item.result}`).join('\n')], { type: 'text/plain;charset=utf-8' }), 'tools-calculos.txt'));
  root.querySelector('.calc-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(formatDisplay(calc.display)); notify('Resultado copiado.'); }
    catch { notify('No se pudo copiar. Selecciona el resultado para copiarlo manualmente.'); }
  });
  render();
}
