import test from 'node:test';
import assert from 'node:assert/strict';
import { parseExpression, evaluateExpression } from '../tools/calculator/expressions.js';
import { parseInteger, integerResult, integerFormats } from '../tools/calculator/programmer.js';
import { addDate, dateDifference, parseDate } from '../tools/calculator/dates.js';
import { convertValue } from '../tools/calculator/converters.js';
import { cleanText, replaceText, compareLines, textStats, safeNoteName } from '../tools/notepad/model.js';
import { markdownBlocks, safeLink } from '../tools/notepad/markdown.js';
import { formatElapsed, nextAlarmAt, remaining, stopwatchElapsed, monthCells, initialClock } from '../tools/clock/model.js';
import { copyFileTo, writeNewFile, validateEntryName } from '../tools/file-explorer/filesystem.js';

const calc = (expression, options) => evaluateExpression(parseExpression(expression), options);
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} ≠ ${expected}`);
test('científica respeta prioridad, potencias derechas, signos e implícitos', () => {
  assert.equal(calc('2+3*4'), 14); assert.equal(calc('-2^2'), -4); assert.equal(calc('2^3^2'), 512); assert.equal(calc('2^-2'), .25);
  assert.equal(calc('2(3+4)'), 14); assert.equal(calc('3x+1', { x: 2 }), 7); assert.equal(calc('5!'), 120); assert.equal(calc('1,5 + 2.5'), 4);
});
test('funciones y ángulos, constantes y resultado anterior', () => {
  near(calc('sin(30)', { degrees: true }), .5); near(calc('cos(pi)'), -1); near(calc('asin(0.5)', { degrees: true }), 30);
  assert.equal(calc('sqrt(81)+log(100)+ln(e)'), 12); assert.equal(calc('ans*2', { ans: 7 }), 14); assert.equal(calc('1e-20'), 1e-20);
});
test('científica rechaza dominios inválidos e intentos de ejecutar código', () => {
  for (const expression of ['1/0', 'sqrt(-1)', '(-1)!', '171!', 'alert(1)', 'constructor(1)', 'window.location', '(2+3', '2+']) assert.throws(() => calc(expression), undefined, expression);
  assert.throws(() => calc('tan(90)', { degrees: true }));
});
test('programador conserva 64 bits y complemento a dos sin perder precisión', () => {
  assert.equal(parseInteger('FFFFFFFFFFFFFFFF', 16), 18446744073709551615n);
  assert.equal(integerResult(255n, 1n, '+', 8, false), 0n);
  assert.equal(integerResult(127n, 1n, '+', 8, true), -128n);
  assert.deepEqual(integerFormats(-1n, 8, true), { HEX: 'FF', DEC: '-1', OCT: '377', BIN: '11111111' });
  assert.equal(integerResult(170n, 15n, 'AND', 8), 10n); assert.equal(integerResult(1n, 63n, '<<', 64), 9223372036854775808n);
});
test('programador valida base, divisores y desplazamientos', () => {
  assert.throws(() => parseInteger('102', 2)); assert.throws(() => integerResult(1n, 0n, '/', 64)); assert.throws(() => integerResult(1n, 256n, '<<', 8));
});
test('fechas respetan años bisiestos y finales de mes', () => {
  assert.equal(addDate('2024-01-31', 1, 'months'), '2024-02-29'); assert.equal(addDate('2024-02-29', 1, 'years'), '2025-02-28');
  assert.equal(dateDifference('2024-03-30', '2024-04-01').days, 2);
  assert.deepEqual(dateDifference('2000-06-15', '2026-11-03'), { days: 9637, years: 26, months: 4, remainingDays: 19, negative: false });
  assert.equal(dateDifference('9999-12-01', '9999-12-31').remainingDays, 30);
  assert.equal(dateDifference('2026-11-03', '2026-11-01').days, -2);
  assert.throws(() => parseDate('2025-02-29')); assert.throws(() => parseDate('0000-01-01'));
});
test('conversiones de unidades y temperatura con cero absoluto', () => {
  near(convertValue('length', 'mi', 'km', 1), 1.609344); near(convertValue('temperature', 'c', 'f', 100), 212);
  near(convertValue('temperature', 'f', 'k', -459.67), 0); assert.throws(() => convertValue('temperature', 'k', 'c', -1));
  assert.equal(convertValue('data', 'kib', 'b', 1), 1024); assert.equal(convertValue('data', 'kb', 'b', 1), 1000);
});
test('texto cuenta Unicode y reemplaza de forma literal', () => {
  assert.deepEqual(textStats('Hola, mundo 🌍\nDos palabras'), { words: 4, characters: 26, lines: 2, minutes: 1 });
  assert.deepEqual(replaceText('A.b a.b', 'a.b', '$&', false), { text: '$& $&', count: 2 });
  assert.equal(cleanText('  A   B \n\n\n c ', 'spaces'), 'A B\n\n\nc');
  assert.equal(cleanText('ñandú', 'upper'), 'ÑANDÚ'); assert.equal(safeNoteName('../nota'), '..-nota.txt');
});
test('comparación conserva líneas iguales y marca adiciones y borrados', () => {
  assert.deepEqual(compareLines('uno\ndos', 'uno\ntres').rows, [{ type: 'same', text: 'uno' }, { type: 'removed', text: 'dos' }, { type: 'added', text: 'tres' }]);
});
test('Markdown trata HTML como texto y bloquea esquemas ejecutables', () => {
  assert.deepEqual(markdownBlocks('# Título\n<script>x</script>').map(block => block.type), ['h1', 'p']);
  assert.equal(safeLink('javascript:alert(1)'), null); assert.equal(safeLink('data:text/html,x'), null); assert.equal(safeLink('https://example.com'), 'https://example.com/');
  assert.deepEqual(markdownBlocks('```\n<code>\n```'), [{ type: 'code', text: '<code>' }]);
});
test('reloj calcula tiempo por instantes reales y genera meses desde lunes', () => {
  assert.equal(remaining({ running: true, dueAt: 5000 }, 6500), 0); assert.equal(stopwatchElapsed({ elapsed: 1000, startedAt: 2000 }, 5500), 4500);
  assert.equal(formatElapsed(3661234, true), '01:01:01.23');
  const cells = monthCells(2026, 10); assert.equal(cells.length, 42); assert.equal(cells[0].getDay(), 1); assert.equal(cells.filter(date => date.getMonth() === 10).length, 30);
});
test('alarmas de lunes a viernes saltan el fin de semana y permiten una vez', () => {
  const friday = new Date(2026, 10, 6, 10, 0);
  const weekday = new Date(nextAlarmAt('08:00', 'weekdays', friday)); assert.equal(weekday.getDay(), 1); assert.equal(weekday.getDate(), 9);
  assert.equal(new Date(nextAlarmAt('08:00', 'once', friday)).getDay(), 6); assert.throws(() => nextAlarmAt('25:00'));
  const state = initialClock({ timers: [null, {}], zones: ['bad/zone'] }); assert.equal(state.timers.length, 0); assert.equal(state.zones.length, 0);
});
function fakeDirectory() {
  const files = new Map([['nota.txt', 'original']]);
  return { files, async getFileHandle(name, options = {}) {
    if (!files.has(name) && !options.create) throw new DOMException('Ausente', 'NotFoundError');
    if (!files.has(name)) files.set(name, '');
    return { name, async createWritable() { let pending; return { async write(value) { pending = await value.text(); }, async close() { files.set(name, pending); }, async abort() {} }; } };
  } };
}
test('copiar conserva el original y genera nombres sucesivos', async () => {
  const dir = fakeDirectory(), file = new File(['nuevo contenido'], 'nota.txt');
  assert.equal((await copyFileTo(dir, file)).name, 'nota - copia.txt'); assert.equal((await copyFileTo(dir, file)).name, 'nota - copia (2).txt');
  assert.equal(dir.files.get('nota.txt'), 'original'); assert.equal(dir.files.get('nota - copia.txt'), 'nuevo contenido');
  await assert.rejects(() => writeNewFile(dir, 'nota.txt', file));
});
test('no se admiten rutas o nombres reservados al crear archivos', () => {
  for (const name of ['../nota', 'carpeta/nota', 'CON', 'NUL.txt', '.', 'nota.']) assert.throws(() => validateEntryName(name));
});
