const day = 86400000;
export function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Introduce una fecha válida.');
  const [year, month, date] = value.split('-').map(Number);
  if (year < 1 || year > 9999) throw new Error('El año debe estar entre 0001 y 9999.');
  const result = new Date(0); result.setUTCFullYear(year, month - 1, date); result.setUTCHours(0, 0, 0, 0);
  if (result.getUTCFullYear() !== year || result.getUTCMonth() !== month - 1 || result.getUTCDate() !== date) throw new Error('La fecha no existe.');
  return result;
}
export function dateKey(date = new Date()) {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function addDate(value, amount, unit) {
  const start = parseDate(value);
  if (!Number.isSafeInteger(amount) || Math.abs(amount) > 1_000_000) throw new Error('Introduce una cantidad entera válida.');
  if (unit === 'days') start.setUTCDate(start.getUTCDate() + amount);
  else {
    const originalDay = start.getUTCDate(); start.setUTCDate(1);
    if (unit === 'months') start.setUTCMonth(start.getUTCMonth() + amount);
    else if (unit === 'years') start.setUTCFullYear(start.getUTCFullYear() + amount);
    else throw new Error('Unidad de fecha desconocida.');
    const last = new Date(start); last.setUTCMonth(last.getUTCMonth() + 1, 0);
    start.setUTCDate(Math.min(originalDay, last.getUTCDate()));
  }
  if (!Number.isFinite(start.getTime()) || start.getUTCFullYear() < 1 || start.getUTCFullYear() > 9999) throw new Error('La fecha resultante está fuera del rango 0001–9999.');
  return start.toISOString().slice(0, 10);
}
export function dateDifference(from, to) {
  const a = parseDate(from), b = parseDate(to);
  const days = Math.round((b - a) / day);
  const early = days >= 0 ? from : to, late = days >= 0 ? to : from;
  const first = parseDate(early), last = parseDate(late);
  let years = last.getUTCFullYear() - first.getUTCFullYear();
  if (parseDate(addDate(early, years, 'years')) > last) years--;
  const yearAnchor = addDate(early, years, 'years');
  const yearDate = parseDate(yearAnchor);
  let months = (last.getUTCFullYear() - yearDate.getUTCFullYear()) * 12 + last.getUTCMonth() - yearDate.getUTCMonth();
  if (parseDate(addDate(yearAnchor, months, 'months')) > last) months--;
  const anchor = parseDate(addDate(yearAnchor, months, 'months'));
  return { days, years, months, remainingDays: Math.round((last - anchor) / day), negative: days < 0 };
}
