const operations = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => b === 0 ? NaN : a / b,
};
export const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };

export function cleanNumber(number) {
  if (!Number.isFinite(number)) throw new Error('No se puede realizar esta operación');
  return String(Number(number.toPrecision(14)));
}

export class Calculator {
  constructor() { this.memory = null; this.history = []; this.clear(); }

  clear() {
    this.display = '0'; this.left = null; this.operator = null;
    this.waiting = false; this.completed = false; this.lastOperand = null;
    this.lastOperator = null; this.expression = ''; this.error = '';
  }

  input(key) {
    try { this.handle(key); }
    catch (error) {
      this.clear(); this.display = 'Error'; this.error = error.message;
    }
    return this;
  }

  setNumber(number) { this.display = cleanNumber(number); }

  handle(key) {
    if (key === 'C') { this.clear(); return; }
    if (/^\d$/.test(key) || key === '.') {
      if (this.error || this.completed) this.clear();
      if (this.waiting) { this.display = '0'; this.waiting = false; }
      if (key === '.') {
        if (!this.display.includes('.') && !this.display.includes('e')) this.display += '.';
      } else if (this.display.replace(/[-.]/g, '').length < 14) {
        this.display = this.display === '0' ? key : this.display === '-0' ? `-${key}` : this.display + key;
      }
      return;
    }
    if (key === 'CE') {
      this.display = '0'; this.error = ''; this.waiting = false; this.completed = false;
      return;
    }
    if (this.error) return;
    if (key === 'back') {
      if (!this.waiting && !this.completed) {
        this.display = this.display.includes('e') ? '0' : this.display.slice(0, -1);
        if (!this.display || this.display === '-') this.display = '0';
      }
      return;
    }
    if (key.startsWith('M')) {
      const number = Number(this.display);
      if (key === 'MC') this.memory = null;
      if (key === 'MR' && this.memory !== null) { this.setNumber(this.memory); this.waiting = false; this.completed = false; }
      if (key === 'M+') this.memory = Number(cleanNumber((this.memory ?? 0) + number));
      if (key === 'M-') this.memory = Number(cleanNumber((this.memory ?? 0) - number));
      return;
    }
    if (key === 'sign') { if (Number(this.display) !== 0) this.display = this.display.startsWith('-') ? this.display.slice(1) : `-${this.display}`; return; }
    const current = Number(this.display);
    if (key === '%') {
      this.setNumber(this.left !== null && ['+', '-'].includes(this.operator) ? this.left * current / 100 : current / 100);
      this.waiting = false;
      return;
    }
    if (['sqrt', 'square', 'inverse'].includes(key)) {
      const number = key === 'sqrt' ? Math.sqrt(current) : key === 'square' ? current ** 2 : current === 0 ? NaN : 1 / current;
      this.setNumber(number);
      this.waiting = false;
      if (this.completed) this.completed = false;
      return;
    }
    if (Object.hasOwn(operations, key)) {
      if (this.operator && !this.waiting) {
        this.setNumber(operations[this.operator](this.left, current));
      }
      this.left = Number(this.display);
      this.operator = key;
      this.expression = `${this.display} ${symbols[key]}`;
      this.waiting = true; this.completed = false;
      this.lastOperator = null; this.lastOperand = null;
      return;
    }
    if (key === '=') {
      const operator = this.operator || this.lastOperator;
      if (!operator) return;
      const a = this.operator ? this.left : current;
      const b = this.operator ? current : this.lastOperand;
      const result = cleanNumber(operations[operator](a, b));
      this.expression = `${a} ${symbols[operator]} ${b} =`;
      this.display = result;
      this.history.unshift({ expression: this.expression, result });
      this.history = this.history.slice(0, 50);
      this.lastOperator = operator; this.lastOperand = b;
      this.operator = null; this.left = null; this.waiting = false; this.completed = true;
    }
  }
}

export function formatDisplay(value) {
  if (value === 'Error') return value;
  if (value.includes('e')) return value.replace('.', ',');
  const [integer, fraction] = value.split('.');
  const grouped = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: true }).format(Number(integer));
  return fraction !== undefined ? `${grouped},${fraction}` : grouped;
}
