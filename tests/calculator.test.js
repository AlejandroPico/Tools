import test from 'node:test';
import assert from 'node:assert/strict';
import { Calculator, formatDisplay } from '../tools/calculator/engine.js';

function calculate(...keys) { const calc = new Calculator(); keys.forEach(key => calc.input(key)); return calc; }
test('suma decimal sin residuos de coma flotante', () => {
  assert.equal(calculate('0', '.', '1', '+', '0', '.', '2', '=').display, '0.3');
});
test('operaciones consecutivas y repetición de igual', () => {
  assert.equal(calculate('2', '+', '3', '*', '4', '=').display, '20');
  assert.equal(calculate('2', '+', '3', '=', '=').display, '8');
});
test('porcentajes relativos al total en suma y división por cien en producto', () => {
  assert.equal(calculate('2', '0', '0', '+', '1', '0', '%', '=').display, '220');
  assert.equal(calculate('2', '0', '0', '*', '1', '0', '%', '=').display, '20');
});
test('cambiar operador antes de introducir segundo operando', () => {
  assert.equal(calculate('9', '+', '-', '4', '=').display, '5');
});
test('errores recuperables y raíz negativa', () => {
  const calc = calculate('8', '/', '0', '=');
  assert.equal(calc.display, 'Error'); assert.ok(calc.error);
  calc.input('2'); assert.equal(calc.display, '2');
  assert.equal(calculate('9', 'sign', 'sqrt').display, 'Error');
});
test('memoria, borrado y recuperación', () => {
  assert.equal(calculate('5', 'M+', 'C', '2', 'M+', 'MR').display, '7');
  assert.equal(calculate('1', '2', 'back', '+', '9', 'CE', '3', '=').display, '4');
});
test('inverso, cuadrado, decimales e historial', () => {
  assert.equal(calculate('4', 'inverse').display, '0.25');
  assert.equal(calculate('3', 'square').display, '9');
  assert.equal(calculate('1', '.', '.', '5').display, '1.5');
  const calc = calculate('7', '+', '2', '=');
  assert.deepEqual(calc.history[0], { expression: '7 + 2 =', result: '9' });
  calc.input('4'); assert.equal(calc.display, '4'); assert.equal(calc.history.length, 1);
});
test('formato español conserva ceros y separador decimal', () => {
  assert.equal(formatDisplay('12.00'), '12,00');
  assert.equal(formatDisplay('0.'), '0,');
  assert.equal(formatDisplay('-12.5'), '-12,5');
});
