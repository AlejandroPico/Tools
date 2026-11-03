import { formatElapsed, remaining, stopwatchElapsed, worldCities, monthCells } from './model.js';
import { dateKey } from '../calculator/dates.js';
import { downloadFile } from '../../core/files.js';
import { notify } from '../../core/ui.js';

export function mountClock(root, service) {
  root.innerHTML = `<div class="clock-workbench"><nav class="tool-tabs clock-modes" aria-label="Funciones de Reloj"><button data-clock-mode="world" aria-pressed="true" data-initial-focus>Reloj mundial</button><button data-clock-mode="stopwatch" aria-pressed="false">Cronómetro</button><button data-clock-mode="timers" aria-pressed="false">Temporizadores</button><button data-clock-mode="pomodoro" aria-pressed="false">Pomodoro</button><button data-clock-mode="alarms" aria-pressed="false">Alarmas</button><button data-clock-mode="calendar" aria-pressed="false">Calendario</button></nav><div class="clock-content">
  <section data-clock-panel="world"><div class="local-time-card"><output class="clock-local-time" aria-label="Hora local"></output><p class="clock-local-date"></p><span>Hora de este dispositivo</span></div><form class="world-form compact-form"><label>Ciudad<select class="world-city" aria-label="Ciudad del reloj mundial"></select></label><button class="primary-button">Añadir reloj</button></form><div class="world-list"></div></section>
  <section data-clock-panel="stopwatch" hidden><output class="stopwatch-display clock-big-number" aria-label="Tiempo del cronómetro">00:00.00</output><div class="clock-buttons"><button class="primary-button stopwatch-toggle">Iniciar</button><button class="secondary-button stopwatch-lap">Vuelta</button><button class="secondary-button stopwatch-reset">Reiniciar</button><button class="secondary-button stopwatch-export">Exportar CSV</button></div><div class="stopwatch-laps"></div></section>
  <section data-clock-panel="timers" hidden><h3>Varios temporizadores, a tu ritmo.</h3><form class="timer-form compact-form"><label>Nombre<input class="timer-name" placeholder="Temporizador" maxlength="100"></label><label>Horas<input class="timer-hours" type="number" min="0" max="168" value="0"></label><label>Min<input class="timer-minutes" type="number" min="0" max="59" value="5"></label><label>Seg<input class="timer-seconds" type="number" min="0" max="59" value="0"></label><button class="primary-button">Crear e iniciar</button></form><div class="timer-list"></div></section>
  <section data-clock-panel="pomodoro" hidden><h3 class="pomodoro-phase"></h3><output class="pomodoro-display clock-big-number" aria-label="Tiempo Pomodoro"></output><p class="pomodoro-rounds status-text"></p><div class="clock-buttons"><button class="primary-button pomodoro-toggle">Iniciar</button><button class="secondary-button pomodoro-reset">Reiniciar intervalo</button></div><form class="pomodoro-form compact-form"><label>Concentración (min)<input class="pomodoro-focus" type="number" min="1" max="180"></label><label>Descanso corto<input class="pomodoro-short" type="number" min="1" max="180"></label><label>Descanso largo<input class="pomodoro-long" type="number" min="1" max="180"></label><button class="secondary-button">Aplicar y reiniciar ciclo</button></form><p class="status-text">Tras cada intervalo recibirás un aviso. Inicia manualmente el siguiente; cada cuatro bloques de concentración toca un descanso largo.</p></section>
  <section data-clock-panel="alarms" hidden><h3>Alarmas</h3><form class="alarm-form compact-form"><label>Nombre<input class="alarm-name" placeholder="Despertador" maxlength="100"></label><label>Hora local<input class="alarm-time" type="time" value="08:00" required></label><label>Repetir<select class="alarm-repeat"><option value="once">Una vez</option><option value="daily">Cada día</option><option value="weekdays">Lunes a viernes</option></select></label><button class="primary-button">Añadir alarma</button></form><div class="alarm-list"></div></section>
  <section data-clock-panel="calendar" hidden><div class="calendar-navigation"><button class="secondary-button calendar-prev" aria-label="Mes anterior">‹</button><h3 class="calendar-month"></h3><button class="secondary-button calendar-next" aria-label="Mes siguiente">›</button><button class="secondary-button calendar-today">Hoy</button></div><div class="calendar-weekdays" aria-hidden="true"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div><div class="calendar-grid" aria-label="Días del mes"></div><label class="calendar-note-label"><span class="calendar-selected"></span><textarea class="calendar-note" aria-label="Nota del día seleccionado" maxlength="20000" placeholder="Una nota para este día…"></textarea></label><div class="calendar-note-actions"><span class="calendar-note-status status-text">Notas guardadas en este navegador.</span><button class="secondary-button calendar-export">Exportar notas</button></div></section>
  </div><footer class="clock-settings"><button class="secondary-button clock-sound">Activar sonido</button><button class="secondary-button clock-notifications">Notificaciones</button><p>Los avisos requieren Tools abierto y el equipo despierto. Pueden retrasarse si el navegador suspende la pestaña. Siguen activos al minimizar o cerrar esta ventana.</p></footer></div>`;
  const $ = selector => root.querySelector(selector);
  let mode = 'world', selectedDate = new Date(), month = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1, 12);
  let calendarTimer, pendingCalendar;
  const formatters = new Map();
  const dateFormatter = new Intl.DateTimeFormat('es', { dateStyle: 'full' });
  const timeFormatter = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  for (const [zone, name] of worldCities) { const option = document.createElement('option'); option.value = zone; option.textContent = name; $('.world-city').append(option); }
  function switchMode(next) {
    mode = next; root.querySelectorAll('[data-clock-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.clockMode === next)));
    root.querySelectorAll('[data-clock-panel]').forEach(panel => { panel.hidden = panel.dataset.clockPanel !== next; });
    updateLive();
  }
  root.querySelectorAll('[data-clock-mode]').forEach(button => button.addEventListener('click', () => switchMode(button.dataset.clockMode)));
  function actionButton(text, action, title) {
    const button = document.createElement('button'); button.className = 'secondary-button'; button.textContent = text;
    if (title) button.setAttribute('aria-label', title); button.addEventListener('click', action); return button;
  }
  function updateLive() {
    const now = Date.now(), state = service.state;
    $('.clock-local-time').textContent = timeFormatter.format(now);
    $('.clock-local-date').textContent = dateFormatter.format(now);
    $('.stopwatch-display').textContent = formatElapsed(stopwatchElapsed(state.stopwatch, now), true);
    $('.stopwatch-toggle').textContent = state.stopwatch.startedAt === null ? 'Iniciar / continuar' : 'Pausar';
    $('.stopwatch-lap').disabled = state.stopwatch.startedAt === null;
    $('.stopwatch-export').disabled = !state.stopwatch.laps.length;
    for (const timer of state.timers) {
      const row = root.querySelector(`[data-timer="${timer.id}"]`);
      if (row) { row.querySelector('output').textContent = formatElapsed(remaining(timer, now)); row.querySelector('[data-toggle]').textContent = timer.running ? 'Pausar' : remaining(timer, now) === 0 ? 'Repetir' : 'Iniciar'; }
    }
    const pomodoro = state.pomodoro;
    $('.pomodoro-display').textContent = formatElapsed(remaining(pomodoro, now));
    $('.pomodoro-phase').textContent = ({ focus: 'Concentración', short: 'Descanso corto', long: 'Descanso largo' })[pomodoro.phase];
    $('.pomodoro-toggle').textContent = pomodoro.running ? 'Pausar' : 'Iniciar intervalo';
    $('.pomodoro-rounds').textContent = `${pomodoro.round} bloques de concentración completados`;
    root.querySelectorAll('[data-zone]').forEach(row => {
      const zone = row.dataset.zone;
      if (!formatters.has(zone)) formatters.set(zone, new Intl.DateTimeFormat('es', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short', day: 'numeric', month: 'short' }));
      row.querySelector('output').textContent = formatters.get(zone).format(now);
    });
    $('.clock-sound').textContent = !state.sound ? 'Sonido desactivado' : service.audioReady ? 'Sonido activado' : 'Activar sonido';
  }
  function renderCalendar() {
    $('.calendar-month').textContent = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(month);
    const grid = $('.calendar-grid'); grid.replaceChildren();
    for (const date of monthCells(month.getFullYear(), month.getMonth())) {
      const button = document.createElement('button'); const key = dateKey(date);
      button.textContent = String(date.getDate()); button.className = 'calendar-day';
      button.classList.toggle('outside-month', date.getMonth() !== month.getMonth());
      button.classList.toggle('has-note', !!service.state.calendar[key]);
      button.setAttribute('aria-label', `${dateFormatter.format(date)}${service.state.calendar[key] ? ', con nota' : ''}`);
      button.setAttribute('aria-pressed', String(key === dateKey(selectedDate)));
      if (key === dateKey()) button.setAttribute('aria-current', 'date');
      button.addEventListener('click', () => selectDate(date)); grid.append(button);
    }
  }
  function saveCalendar() {
    clearTimeout(calendarTimer);
    if (!pendingCalendar) return;
    const pending = pendingCalendar; pendingCalendar = null;
    const saved = service.calendarNote(pending.key, pending.text);
    $('.calendar-note-status').textContent = saved ? 'Nota guardada en el navegador. Puedes exportar todas las notas.' : 'No se pudo guardar. Exporta las notas antes de cerrar Tools.';
    $('.calendar-note-status').classList.toggle('error-text', !saved);
  }
  function selectDate(date) {
    saveCalendar(); selectedDate = date; month = new Date(date.getFullYear(), date.getMonth(), 1, 12);
    $('.calendar-selected').textContent = dateFormatter.format(date);
    $('.calendar-note').value = service.state.calendar[dateKey(date)] || ''; renderCalendar();
  }
  function renderLists() {
    const state = service.state;
    const laps = $('.stopwatch-laps'); laps.replaceChildren();
    state.stopwatch.laps.forEach((total, index) => {
      const row = document.createElement('div'); row.className = 'clock-list-row';
      const title = document.createElement('span'); title.textContent = `Vuelta ${index + 1}`;
      const time = document.createElement('span'); time.textContent = `${formatElapsed(total - (state.stopwatch.laps[index - 1] || 0), true)} · Total ${formatElapsed(total, true)}`;
      row.append(title, time); laps.prepend(row);
    });
    const timers = $('.timer-list'); timers.replaceChildren();
    if (!state.timers.length) { const empty = document.createElement('p'); empty.className = 'status-text'; empty.textContent = 'Añade temporizadores independientes. Puedes pausar y reanudar cada uno.'; timers.append(empty); }
    for (const timer of state.timers) {
      const row = document.createElement('div'); row.className = 'clock-card'; row.dataset.timer = timer.id;
      const name = document.createElement('strong'); name.textContent = timer.name;
      const time = document.createElement('output'); time.setAttribute('aria-label', `Tiempo restante: ${timer.name}`);
      const buttons = document.createElement('div'); buttons.className = 'clock-buttons';
      const toggle = actionButton('Iniciar', () => service.timer(timer.id, 'toggle')); toggle.dataset.toggle = '';
      buttons.append(toggle, actionButton('Reiniciar', () => service.timer(timer.id, 'reset')), actionButton('Eliminar', () => service.timer(timer.id, 'remove'), `Eliminar temporizador ${timer.name}`));
      row.append(name, time, buttons); timers.append(row);
    }
    const alarms = $('.alarm-list'); alarms.replaceChildren();
    if (!state.alarms.length) { const empty = document.createElement('p'); empty.className = 'status-text'; empty.textContent = 'No hay alarmas configuradas.'; alarms.append(empty); }
    for (const alarm of state.alarms) {
      const row = document.createElement('div'); row.className = 'clock-card alarm-card';
      const title = document.createElement('strong'); title.textContent = `${alarm.time} · ${alarm.name}`;
      const detail = document.createElement('p'); detail.className = 'status-text'; detail.textContent = `${({ once: 'Una vez', daily: 'Cada día', weekdays: 'Lunes a viernes' })[alarm.repeat]} · ${alarm.enabled ? `Próxima: ${new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(alarm.nextAt)}` : 'Desactivada'}`;
      const buttons = document.createElement('div'); buttons.className = 'clock-buttons';
      buttons.append(actionButton(alarm.enabled ? 'Desactivar' : 'Activar', () => service.alarm(alarm.id, 'toggle')), actionButton('Eliminar', () => service.alarm(alarm.id, 'remove'), `Eliminar alarma ${alarm.name}`));
      row.append(title, detail, buttons); alarms.append(row);
    }
    const worlds = $('.world-list'); worlds.replaceChildren();
    for (const zone of state.zones) {
      const row = document.createElement('div'); row.className = 'clock-list-row world-row'; row.dataset.zone = zone;
      const title = document.createElement('strong'); title.textContent = worldCities.find(city => city[0] === zone)?.[1] || zone;
      const time = document.createElement('output');
      row.append(title, time, actionButton('×', () => service.removeZone(zone), `Quitar reloj ${title.textContent}`)); worlds.append(row);
    }
    renderCalendar(); updateLive();
  }
  $('.stopwatch-toggle').addEventListener('click', () => service.stopwatch('toggle'));
  $('.stopwatch-lap').addEventListener('click', () => service.stopwatch('lap'));
  $('.stopwatch-reset').addEventListener('click', () => service.stopwatch('reset'));
  $('.stopwatch-export').addEventListener('click', () => {
    const laps = service.state.stopwatch.laps;
    const csv = ['Vuelta,Parcial (s),Total (s)', ...laps.map((total, index) => `${index + 1},${((total - (laps[index - 1] || 0)) / 1000).toFixed(3)},${(total / 1000).toFixed(3)}`)].join('\n');
    downloadFile(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'tools-vueltas.csv');
  });
  $('.timer-form').addEventListener('submit', event => {
    event.preventDefault();
    try { service.addTimer($('.timer-name').value, Number($('.timer-hours').value) * 3600 + Number($('.timer-minutes').value) * 60 + Number($('.timer-seconds').value)); } catch (error) { notify(error.message); }
  });
  $('.alarm-form').addEventListener('submit', event => { event.preventDefault(); try { service.addAlarm($('.alarm-name').value, $('.alarm-time').value, $('.alarm-repeat').value); } catch (error) { notify(error.message); } });
  for (const key of ['focus', 'short', 'long']) $(`.pomodoro-${key}`).value = service.state.pomodoro.durations[key] / 60000;
  $('.pomodoro-toggle').addEventListener('click', () => service.pomodoro('toggle'));
  $('.pomodoro-reset').addEventListener('click', () => service.pomodoro('reset'));
  $('.pomodoro-form').addEventListener('submit', event => {
    event.preventDefault(); try { service.pomodoro('configure', Object.fromEntries(['focus', 'short', 'long'].map(key => [key, Number($(`.pomodoro-${key}`).value) * 60000]))); } catch (error) { notify(error.message); }
  });
  $('.world-form').addEventListener('submit', event => { event.preventDefault(); service.addZone($('.world-city').value); });
  $('.calendar-prev').addEventListener('click', () => selectDate(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12)));
  $('.calendar-next').addEventListener('click', () => selectDate(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12)));
  $('.calendar-today').addEventListener('click', () => selectDate(new Date()));
  $('.calendar-note').addEventListener('input', () => { pendingCalendar = { key: dateKey(selectedDate), text: $('.calendar-note').value }; $('.calendar-note-status').textContent = 'Guardando…'; clearTimeout(calendarTimer); calendarTimer = setTimeout(saveCalendar, 300); });
  $('.calendar-export').addEventListener('click', () => { saveCalendar(); downloadFile(new Blob([JSON.stringify({ format: 'tools-calendar', version: 1, notes: service.state.calendar }, null, 2)], { type: 'application/json' }), 'tools-calendario.json'); });
  $('.clock-sound').addEventListener('click', () => { if (service.state.sound && !service.audioReady) service.armSound(); else service.toggleSound(); });
  $('.clock-notifications').addEventListener('click', async () => {
    if (!('Notification' in window)) { notify('Este navegador no admite notificaciones. Los avisos dentro de Tools siguen disponibles.'); return; }
    try { const result = await Notification.requestPermission(); notify(result === 'granted' ? 'Notificaciones activadas. Mantén Tools abierto.' : 'No se han activado las notificaciones.'); } catch { notify('No se pudieron activar las notificaciones.'); }
  });
  const unsubscribe = service.subscribe(reason => { if (reason === 'tick' || reason === 'audio') updateLive(); else renderLists(); });
  selectDate(selectedDate); renderLists();
  return { destroy: () => { clearTimeout(calendarTimer); saveCalendar(); unsubscribe(); } };
}
