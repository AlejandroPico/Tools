import test from 'node:test';
import assert from 'node:assert/strict';
import { fitRect, resizeRect } from '../core/geometry.js';
import { themes, getTheme, defaultThemeId } from '../core/themes.js';

const bounds = { width: 1200, height: 800 };
const rect = { left: 100, top: 80, width: 400, height: 300 };
test('las ventanas llegan a las cuatro esquinas sin márgenes reservados', () => {
  assert.deepEqual(fitRect({ ...rect, left: -200, top: -200 }, bounds), { ...rect, left: 0, top: 0 });
  assert.deepEqual(fitRect({ ...rect, left: 2000, top: 2000 }, bounds), { ...rect, left: 800, top: 500 });
});
test('al reducir la pantalla se conservan controles dentro de sus límites', () => {
  assert.deepEqual(fitRect(rect, { width: 250, height: 160 }), { left: 0, top: 0, width: 250, height: 160 });
});
test('geometría guardada no válida se recupera sin posiciones NaN', () => {
  assert.deepEqual(fitRect({ left: NaN, top: Infinity, width: -1, height: 'oops' }, bounds), { left: 0, top: 0, width: 280, height: 200 });
});
test('redimensionar arriba e izquierda conserva la esquina opuesta', () => {
  const resized = resizeRect(rect, 'nw', -60, -40, bounds);
  assert.deepEqual(resized, { left: 40, top: 40, width: 460, height: 340 });
  assert.equal(resized.left + resized.width, rect.left + rect.width);
  assert.equal(resized.top + resized.height, rect.top + rect.height);
});
test('los bordes respetan tamaño mínimo y límites de pantalla', () => {
  assert.deepEqual(resizeRect(rect, 'nw', 900, 900, bounds), { left: 220, top: 180, width: 280, height: 200 });
  assert.deepEqual(resizeRect(rect, 'se', 2000, 2000, bounds), { left: 100, top: 80, width: 1100, height: 720 });
  assert.deepEqual(resizeRect(rect, 'nw', -2000, -2000, bounds), { left: 0, top: 0, width: 500, height: 380 });
});
test('redimensionar un solo borde no desplaza los otros ejes', () => {
  assert.deepEqual(resizeRect(rect, 'e', 50, 90, bounds), { ...rect, width: 450 });
  assert.deepEqual(resizeRect(rect, 'n', 50, -30, bounds), { ...rect, top: 50, height: 330 });
});
test('24 temas únicos repartidos entre mañana, tarde y noche', () => {
  assert.equal(themes.length, 24);
  assert.equal(new Set(themes.map(theme => theme.id)).size, 24);
  for (const group of ['Mañana', 'Tarde', 'Noche']) assert.equal(themes.filter(theme => theme.group === group).length, 8);
  assert.equal(getTheme('dato-antiguo-o-corrupto').id, defaultThemeId);
  for (const theme of themes) for (const color of [theme.base, theme.glow, theme.accent]) assert.match(color, /^#[\da-f]{6}$/i);
});
