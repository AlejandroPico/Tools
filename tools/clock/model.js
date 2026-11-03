export function formatElapsed(milliseconds, fractions = false) {
  const value = Math.max(0, milliseconds);
  const seconds = Math.floor(value / 1000);
  const hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds / 60) % 60;
  const main = `${hours ? `${String(hours).padStart(2, '0')}:` : ''}${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return fractions ? `${main}.${String(Math.floor(value % 1000 / 10)).padStart(2, '0')}` : main;
}
export function nextAlarmAt(time, repeat = 'once', now = new Date()) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Introduce una hora válida.');
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(now); date.setHours(hours, minutes, 0, 0);
  if (date <= now) date.setDate(date.getDate() + 1);
  if (repeat === 'weekdays') while ([0, 6].includes(date.getDay())) date.setDate(date.getDate() + 1);
  return date.getTime();
}
export function monthCells(year, month) {
  const start = new Date(year, month, 1, 12);
  start.setDate(1 - (start.getDay() + 6) % 7);
  return Array.from({ length: 42 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return date; });
}
export function remaining(item, now = Date.now()) { return item.running ? Math.max(0, item.dueAt - now) : Math.max(0, item.remainingMs); }
export function stopwatchElapsed(item, now = Date.now()) { return item.elapsed + (item.startedAt === null ? 0 : Math.max(0, now - item.startedAt)); }
export const worldCities = [
  ['Europe/Madrid', 'Madrid'], ['Europe/London', 'Londres'], ['Europe/Paris', 'París'], ['Europe/Rome', 'Roma'], ['Europe/Berlin', 'Berlín'], ['Europe/Lisbon', 'Lisboa'],
  ['America/New_York', 'Nueva York'], ['America/Los_Angeles', 'Los Ángeles'], ['America/Mexico_City', 'Ciudad de México'], ['America/Bogota', 'Bogotá'], ['America/Argentina/Buenos_Aires', 'Buenos Aires'], ['America/Sao_Paulo', 'São Paulo'],
  ['Asia/Tokyo', 'Tokio'], ['Asia/Seoul', 'Seúl'], ['Asia/Shanghai', 'Shanghái'], ['Asia/Dubai', 'Dubái'], ['Asia/Kolkata', 'Calcuta'], ['Australia/Sydney', 'Sídney'], ['Pacific/Auckland', 'Auckland'], ['Africa/Cairo', 'El Cairo'], ['UTC', 'UTC'],
];
export function initialClock(saved = {}) {
  const safe = saved && typeof saved === 'object' ? saved : {};
  const number = (value, fallback, max = Infinity) => Number.isFinite(value) && value >= 0 && value <= max ? value : fallback;
  const stopwatch = safe.stopwatch || {};
  const pomodoro = safe.pomodoro || {};
  return {
    stopwatch: { elapsed: number(stopwatch.elapsed, 0), startedAt: Number.isFinite(stopwatch.startedAt) ? stopwatch.startedAt : null, laps: Array.isArray(stopwatch.laps) ? stopwatch.laps.filter(Number.isFinite).slice(0, 500) : [] },
    timers: (Array.isArray(safe.timers) ? safe.timers : []).filter(item => item && typeof item.id === 'string' && Number.isFinite(item.durationMs) && item.durationMs >= 1000 && item.durationMs <= 604800000).slice(0, 50).map(item => ({ ...item, name: String(item.name || 'Temporizador').slice(0, 100), remainingMs: number(item.remainingMs, item.durationMs), running: !!item.running && Number.isFinite(item.dueAt) })),
    alarms: (Array.isArray(safe.alarms) ? safe.alarms : []).filter(item => item && typeof item.id === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)).slice(0, 50).map(item => ({ ...item, repeat: ['once', 'daily', 'weekdays'].includes(item.repeat) ? item.repeat : 'once', name: String(item.name || 'Alarma').slice(0, 100), enabled: !!item.enabled && Number.isFinite(item.nextAt) })),
    zones: (Array.isArray(safe.zones) ? safe.zones : ['Europe/Madrid', 'America/New_York', 'Asia/Tokyo']).filter(zone => worldCities.some(city => city[0] === zone)),
    calendar: Object.fromEntries(Object.entries(safe.calendar && typeof safe.calendar === 'object' ? safe.calendar : {}).filter(([key, value]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && typeof value === 'string')),
    pomodoro: { phase: ['focus', 'short', 'long'].includes(pomodoro.phase) ? pomodoro.phase : 'focus', round: number(pomodoro.round, 0), durations: { focus: number(pomodoro.durations?.focus, 1500000, 10800000) || 1500000, short: number(pomodoro.durations?.short, 300000, 10800000) || 300000, long: number(pomodoro.durations?.long, 900000, 10800000) || 900000 }, remainingMs: number(pomodoro.remainingMs, 1500000), running: !!pomodoro.running && Number.isFinite(pomodoro.dueAt), dueAt: pomodoro.dueAt || null },
    alerts: (Array.isArray(safe.alerts) ? safe.alerts : []).filter(item => item && typeof item.id === 'string' && typeof item.name === 'string').slice(0, 20),
    sound: safe.sound !== false,
  };
}
