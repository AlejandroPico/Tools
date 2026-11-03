const functions = {
  sqrt: Math.sqrt, abs: Math.abs, ln: Math.log, log: Math.log10, exp: Math.exp,
  floor: Math.floor, ceil: Math.ceil, round: Math.round,
};
export function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170) throw new Error('El factorial admite enteros de 0 a 170.');
  let value = 1; for (let i = 2; i <= n; i++) value *= i; return value;
}
export function parseExpression(source) {
  if (!source.trim()) throw new Error('Escribe una expresión.');
  if (source.length > 300) throw new Error('La expresión es demasiado larga (máximo 300 caracteres).');
  const text = source.replace(/,/g, '.').replace(/π/g, 'pi').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  const tokens = [];
  let position = 0;
  while (position < text.length) {
    const rest = text.slice(position);
    const match = /^(?:\s+|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[a-zA-Z]+|[()+\-*/^%!])/.exec(rest);
    if (!match) throw new Error(`Carácter no admitido: ${rest[0]}`);
    position += match[0].length;
    if (!/^\s/.test(match[0])) tokens.push(match[0].toLowerCase());
  }
  let cursor = 0, depth = 0;
  const peek = () => tokens[cursor];
  function primary() {
    if (++depth > 50) throw new Error('Demasiados paréntesis anidados.');
    const token = tokens[cursor++];
    let node;
    if (token === '(') {
      node = sum(); if (tokens[cursor++] !== ')') throw new Error('Falta cerrar un paréntesis.');
    } else if (/^(?:\d|\.)/.test(token || '')) node = { type: 'number', value: Number(token) };
    else if (['pi', 'e', 'x', 'ans'].includes(token)) node = { type: 'variable', name: token };
    else if (Object.hasOwn(functions, token) || ['sin', 'cos', 'tan', 'asin', 'acos', 'atan'].includes(token)) {
      if (tokens[cursor++] !== '(') throw new Error(`Usa ${token}(…).`);
      node = { type: 'function', name: token, argument: sum() };
      if (tokens[cursor++] !== ')') throw new Error('Falta cerrar un paréntesis.');
    } else throw new Error(token ? `No se reconoce «${token}».` : 'La expresión está incompleta.');
    depth--; return node;
  }
  function postfix() { let node = primary(); while (peek() === '!') { cursor++; node = { type: 'function', name: 'factorial', argument: node }; } return node; }
  function power() { const node = postfix(); if (peek() === '^') { cursor++; return { type: 'binary', op: '^', left: node, right: unary() }; } return node; }
  function unary() { if (peek() === '+' || peek() === '-') { const op = tokens[cursor++]; return { type: 'unary', op, argument: unary() }; } return power(); }
  function product() {
    let node = unary();
    while (cursor < tokens.length) {
      let op = peek();
      const implicit = op === '(' || /^[a-z]/.test(op || '');
      if (!['*', '/', '%'].includes(op) && !implicit) break;
      if (implicit) op = '*'; else cursor++;
      node = { type: 'binary', op, left: node, right: unary() };
    }
    return node;
  }
  function sum() { let node = product(); while (peek() === '+' || peek() === '-') { const op = tokens[cursor++]; node = { type: 'binary', op, left: node, right: product() }; } return node; }
  const node = sum();
  if (cursor !== tokens.length) throw new Error(`Elemento inesperado: ${peek()}`);
  return node;
}
export function evaluateExpression(node, { x = 0, ans = 0, degrees = false } = {}) {
  function run(item) {
    if (item.type === 'number') return item.value;
    if (item.type === 'variable') return ({ pi: Math.PI, e: Math.E, x, ans })[item.name];
    if (item.type === 'unary') return (item.op === '-' ? -1 : 1) * run(item.argument);
    if (item.type === 'function') {
      const value = run(item.argument);
      if (item.name === 'factorial') return factorial(value);
      if (Object.hasOwn(functions, item.name)) return functions[item.name](value);
      if (['sin', 'cos', 'tan'].includes(item.name)) {
        const angle = degrees ? value * Math.PI / 180 : value;
        if (item.name === 'tan' && Math.abs(Math.cos(angle)) < 1e-14) return NaN;
        return Math[item.name](angle);
      }
      return Math[item.name](value) * (degrees ? 180 / Math.PI : 1);
    }
    const a = run(item.left), b = run(item.right);
    return ({ '+': () => a + b, '-': () => a - b, '*': () => a * b, '/': () => b === 0 ? NaN : a / b, '%': () => b === 0 ? NaN : a % b, '^': () => a ** b })[item.op]();
  }
  const result = run(node);
  if (!Number.isFinite(result)) throw new Error('El resultado no es un número real finito. Revisa el dominio y los divisores.');
  return result;
}
