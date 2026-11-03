import { readLocal, writeLocal, notify } from '../../core/ui.js';
import { initialClock, nextAlarmAt, remaining, stopwatchElapsed } from './model.js';

export function createClockService() {
  const state = initialClock(readLocal('clock-state', {}));
  const listeners = new Set();
  let context = null, lastTone = 0, warnedStorage = false;
  const emit = reason => listeners.forEach(listener => listener(reason));
  function persist() {
    const saved = writeLocal('clock-state', state);
    if (!saved && !warnedStorage) { warnedStorage = true; notify('Reloj no pudo guardar los cambios. Se conservarán durante esta sesión.'); }
    emit('change');
    return saved;
  }
  function beep() {
    if (!state.sound || context?.state !== 'running') return;
    for (let index = 0; index < 3; index++) {
      const oscillator = context.createOscillator(), gain = context.createGain();
      const start = context.currentTime + index * .25;
      oscillator.frequency.value = index % 2 ? 880 : 660;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.14, start + .02); gain.gain.exponentialRampToValueAtTime(.001, start + .18);
      oscillator.connect(gain).connect(context.destination); oscillator.start(start); oscillator.stop(start + .2);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    }
    lastTone = Date.now();
  }
  function ring(name, kind) {
    state.alerts.push({ id: crypto.randomUUID(), name, kind });
    state.alerts = state.alerts.slice(-20);
    beep();
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification(`Tools · ${name}`, { body: 'Abre Reloj para detener o posponer el aviso.', tag: `tools-clock-${kind}` }); } catch { /* The in-app alert remains available. */ }
    }
  }
  function tick() {
    const now = Date.now(); let changed = false;
    for (const timer of state.timers) if (timer.running && timer.dueAt <= now) { timer.running = false; timer.remainingMs = 0; ring(timer.name, 'timer'); changed = true; }
    for (const alarm of state.alarms) if (alarm.enabled && alarm.nextAt <= now) {
      ring(alarm.name, 'alarm');
      if (alarm.repeat === 'once') alarm.enabled = false;
      else alarm.nextAt = nextAlarmAt(alarm.time, alarm.repeat, new Date(now + 1000));
      changed = true;
    }
    const pomodoro = state.pomodoro;
    if (pomodoro.running && pomodoro.dueAt <= now) {
      const wasFocus = pomodoro.phase === 'focus';
      if (wasFocus) pomodoro.round++;
      pomodoro.phase = wasFocus ? pomodoro.round % 4 === 0 ? 'long' : 'short' : 'focus';
      pomodoro.remainingMs = pomodoro.durations[pomodoro.phase]; pomodoro.running = false; pomodoro.dueAt = null;
      ring(wasFocus ? 'Pomodoro: toca descansar' : 'Pomodoro: comienza otro bloque de concentración', 'pomodoro'); changed = true;
    }
    if (state.alerts.length && now - lastTone > 5000) beep();
    if (changed) persist(); else emit('tick');
  }
  setInterval(tick, 100);
  document.addEventListener('visibilitychange', tick);
  return {
    state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    get audioReady() { return context?.state === 'running'; },
    async armSound() {
      if (!state.sound) return;
      try { const Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) return; context ||= new Audio(); await context.resume(); emit('audio'); } catch { notify('No se pudo activar el sonido. Los avisos visuales siguen disponibles.'); }
    },
    toggleSound() { state.sound = !state.sound; if (state.sound) this.armSound(); persist(); },
    stopwatch(action) {
      const stopwatch = state.stopwatch;
      if (action === 'toggle') { if (stopwatch.startedAt === null) stopwatch.startedAt = Date.now(); else { stopwatch.elapsed = stopwatchElapsed(stopwatch); stopwatch.startedAt = null; } }
      if (action === 'reset') { stopwatch.elapsed = 0; stopwatch.startedAt = null; stopwatch.laps = []; }
      if (action === 'lap' && stopwatch.startedAt !== null && stopwatch.laps.length < 500) stopwatch.laps.push(stopwatchElapsed(stopwatch));
      persist();
    },
    addTimer(name, seconds, start = true) {
      if (!Number.isFinite(seconds) || seconds < 1 || seconds > 604800 || state.timers.length >= 50) throw new Error('Admite hasta 50 temporizadores de 1 segundo a 7 días.');
      state.timers.push({ id: crypto.randomUUID(), name: name.trim().slice(0, 100) || 'Temporizador', durationMs: seconds * 1000, remainingMs: seconds * 1000, dueAt: start ? Date.now() + seconds * 1000 : null, running: start });
      if (start) this.armSound(); persist();
    },
    timer(id, action) {
      const timer = state.timers.find(item => item.id === id); if (!timer) return;
      if (action === 'remove') state.timers = state.timers.filter(item => item.id !== id);
      if (action === 'reset') { timer.running = false; timer.remainingMs = timer.durationMs; timer.dueAt = null; }
      if (action === 'toggle') {
        if (timer.running) { timer.remainingMs = remaining(timer); timer.running = false; }
        else { timer.remainingMs ||= timer.durationMs; timer.dueAt = Date.now() + timer.remainingMs; timer.running = true; this.armSound(); }
      }
      persist();
    },
    addAlarm(name, time, repeat) {
      if (state.alarms.length >= 50) throw new Error('Ya hay 50 alarmas.');
      state.alarms.push({ id: crypto.randomUUID(), name: name.trim().slice(0, 100) || 'Alarma', time, repeat, enabled: true, nextAt: nextAlarmAt(time, repeat) }); this.armSound(); persist();
    },
    alarm(id, action) {
      const alarm = state.alarms.find(item => item.id === id); if (!alarm) return;
      if (action === 'remove') state.alarms = state.alarms.filter(item => item.id !== id);
      else { alarm.enabled = !alarm.enabled; if (alarm.enabled) { alarm.nextAt = nextAlarmAt(alarm.time, alarm.repeat); this.armSound(); } }
      persist();
    },
    pomodoro(action, durations) {
      const item = state.pomodoro;
      if (action === 'configure') {
        if (Object.values(durations).some(value => !Number.isFinite(value) || value < 60000 || value > 10800000)) throw new Error('Los intervalos deben durar entre 1 y 180 minutos.');
        item.durations = durations; item.phase = 'focus'; item.round = 0; item.running = false; item.remainingMs = durations.focus;
      }
      if (action === 'reset') { item.running = false; item.remainingMs = item.durations[item.phase]; }
      if (action === 'toggle') {
        if (item.running) { item.remainingMs = remaining(item); item.running = false; }
        else { item.dueAt = Date.now() + item.remainingMs; item.running = true; this.armSound(); }
      }
      persist();
    },
    addZone(zone) { if (!state.zones.includes(zone)) state.zones.push(zone); persist(); },
    removeZone(zone) { state.zones = state.zones.filter(item => item !== zone); persist(); },
    calendarNote(key, text) { if (text) state.calendar[key] = text; else delete state.calendar[key]; return persist(); },
    dismiss(id, snooze = false) {
      const alert = state.alerts.find(item => item.id === id);
      state.alerts = state.alerts.filter(item => item.id !== id);
      if (snooze && alert) this.addTimer(`Pospuesto: ${alert.name}`, 300);
      persist();
    },
  };
}

export function installClockAlerts(service, openClock) {
  const dialog = document.createElement('dialog'); dialog.className = 'clock-alert about-dialog';
  dialog.setAttribute('aria-label', 'Aviso de Reloj');
  dialog.innerHTML = '<h2>Reloj</h2><p class="clock-alert-name"></p><div class="clock-alert-actions"><button class="primary-button alert-stop">Detener aviso</button><button class="secondary-button alert-snooze">Posponer 5 min</button><button class="secondary-button alert-clock">Abrir Reloj</button></div>';
  document.body.append(dialog);
  let currentId;
  service.subscribe(() => {
    const alert = service.state.alerts[0];
    if (!alert) { if (dialog.open) dialog.close(); currentId = null; return; }
    if (currentId === alert.id) return;
    currentId = alert.id; dialog.querySelector('.clock-alert-name').textContent = alert.name;
    if (!dialog.open) dialog.showModal();
  });
  dialog.querySelector('.alert-stop').addEventListener('click', () => service.dismiss(currentId));
  dialog.querySelector('.alert-snooze').addEventListener('click', () => service.dismiss(currentId, true));
  dialog.querySelector('.alert-clock').addEventListener('click', () => { service.dismiss(currentId); openClock(); });
  dialog.addEventListener('cancel', event => { event.preventDefault(); service.dismiss(currentId); });
}
