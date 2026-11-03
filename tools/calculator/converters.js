const unit = (id, label, factor) => ({ id, label, toBase: value => value * factor, fromBase: value => value / factor });
export const conversions = [
  { id: 'length', name: 'Longitud', units: [unit('m', 'Metros', 1), unit('km', 'Kilómetros', 1000), unit('cm', 'Centímetros', .01), unit('mm', 'Milímetros', .001), unit('in', 'Pulgadas', .0254), unit('ft', 'Pies', .3048), unit('yd', 'Yardas', .9144), unit('mi', 'Millas', 1609.344)] },
  { id: 'area', name: 'Superficie', units: [unit('m2', 'Metros cuadrados', 1), unit('km2', 'Kilómetros cuadrados', 1e6), unit('ha', 'Hectáreas', 10000), unit('cm2', 'Centímetros cuadrados', .0001), unit('acre', 'Acres', 4046.8564224), unit('ft2', 'Pies cuadrados', .09290304)] },
  { id: 'volume', name: 'Volumen', units: [unit('l', 'Litros', 1), unit('ml', 'Mililitros', .001), unit('m3', 'Metros cúbicos', 1000), unit('gal-us', 'Galones de EE. UU.', 3.785411784), unit('gal-uk', 'Galones imperiales', 4.54609), unit('cup', 'Tazas de EE. UU.', .2365882365)] },
  { id: 'mass', name: 'Masa', units: [unit('kg', 'Kilogramos', 1), unit('g', 'Gramos', .001), unit('mg', 'Miligramos', .000001), unit('t', 'Toneladas', 1000), unit('lb', 'Libras', .45359237), unit('oz', 'Onzas', .028349523125)] },
  { id: 'temperature', name: 'Temperatura', units: [{ id: 'c', label: 'Celsius', toBase: v => v + 273.15, fromBase: v => v - 273.15 }, { id: 'f', label: 'Fahrenheit', toBase: v => (v - 32) * 5 / 9 + 273.15, fromBase: v => (v - 273.15) * 9 / 5 + 32 }, unit('k', 'Kelvin', 1)] },
  { id: 'speed', name: 'Velocidad', units: [unit('ms', 'Metros por segundo', 1), unit('kmh', 'Kilómetros por hora', 1 / 3.6), unit('mph', 'Millas por hora', .44704), unit('kn', 'Nudos', .514444444444)] },
  { id: 'time', name: 'Tiempo', units: [unit('s', 'Segundos', 1), unit('ms', 'Milisegundos', .001), unit('min', 'Minutos', 60), unit('h', 'Horas', 3600), unit('d', 'Días', 86400), unit('week', 'Semanas', 604800)] },
  { id: 'energy', name: 'Energía', units: [unit('j', 'Julios', 1), unit('kj', 'Kilojulios', 1000), unit('cal', 'Calorías', 4.184), unit('kcal', 'Kilocalorías', 4184), unit('wh', 'Vatios hora', 3600), unit('kwh', 'Kilovatios hora', 3.6e6)] },
  { id: 'pressure', name: 'Presión', units: [unit('pa', 'Pascales', 1), unit('kpa', 'Kilopascales', 1000), unit('bar', 'Bares', 1e5), unit('atm', 'Atmósferas', 101325), unit('psi', 'Libras por pulgada cuadrada', 6894.757293168)] },
  { id: 'data', name: 'Datos digitales', units: [unit('bit', 'Bits', .125), unit('b', 'Bytes', 1), unit('kb', 'Kilobytes (1000 B)', 1000), unit('mb', 'Megabytes', 1e6), unit('gb', 'Gigabytes', 1e9), unit('kib', 'Kibibytes (1024 B)', 1024), unit('mib', 'Mebibytes', 1048576), unit('gib', 'Gibibytes', 1073741824)] },
];
export function convertValue(categoryId, fromId, toId, value) {
  const category = conversions.find(item => item.id === categoryId);
  const from = category?.units.find(item => item.id === fromId), to = category?.units.find(item => item.id === toId);
  if (!from || !to || !Number.isFinite(value)) throw new Error('Revisa el valor y las unidades.');
  const base = from.toBase(value);
  if (categoryId === 'temperature' && base < -1e-10) throw new Error('La temperatura está por debajo del cero absoluto.');
  const result = to.fromBase(base);
  if (!Number.isFinite(result)) throw new Error('El resultado está fuera del rango admitido.');
  return Number(result.toPrecision(14));
}
