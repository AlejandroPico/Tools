import test from 'node:test';
import assert from 'node:assert/strict';
import { createClockService } from '../tools/clock/service.js';

test('el servicio conserva plazos, pausa, vueltas y transiciones Pomodoro con el reloj adelantado', () => {
  const original = { window: globalThis.window, document: globalThis.document, localStorage: globalThis.localStorage, setInterval: globalThis.setInterval, now: Date.now };
  const records = new Map(); let tick, now = 1000000;
  globalThis.window = {};
  globalThis.document = { addEventListener() {} };
  globalThis.localStorage = { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) };
  globalThis.setInterval = callback => { tick = callback; return 0; };
  Date.now = () => now;
  try {
    const clock = createClockService();
    clock.addTimer('Té', 10); const timer = clock.state.timers[0];
    now += 3000; clock.timer(timer.id, 'toggle'); assert.equal(timer.remainingMs, 7000);
    now += 100000; tick(); assert.equal(clock.state.alerts.length, 0);
    clock.timer(timer.id, 'toggle'); now += 7001; tick(); assert.equal(clock.state.alerts[0].name, 'Té'); assert.equal(timer.running, false);
    clock.dismiss(clock.state.alerts[0].id);
    clock.stopwatch('toggle'); now += 2500; clock.stopwatch('lap'); now += 500; clock.stopwatch('toggle');
    assert.deepEqual(clock.state.stopwatch.laps, [2500]); assert.equal(clock.state.stopwatch.elapsed, 3000);
    clock.pomodoro('configure', { focus: 60000, short: 60000, long: 60000 });
    for (let block = 1; block <= 4; block++) {
      clock.pomodoro('toggle'); now += 60001; tick();
      assert.equal(clock.state.pomodoro.phase, block === 4 ? 'long' : 'short');
      assert.equal(clock.state.pomodoro.round, block); assert.equal(clock.state.pomodoro.running, false);
      clock.dismiss(clock.state.alerts[0].id);
      if (block < 4) { clock.pomodoro('toggle'); now += 60001; tick(); assert.equal(clock.state.pomodoro.phase, 'focus'); clock.dismiss(clock.state.alerts[0].id); }
    }
    clock.state.alarms.push({ id: 'alarm-test', time: '08:00', repeat: 'once', nextAt: now + 1000, enabled: true, name: 'Una vez' });
    now += 1001; tick(); assert.equal(clock.state.alarms[0].enabled, false); assert.equal(clock.state.alerts[0].name, 'Una vez');
    assert.equal(JSON.parse(records.get('tools-clock-state')).stopwatch.elapsed, 3000);
    clock.dismiss(clock.state.alerts[0].id);
    clock.addTimer('Persistente', 5); now += 6000;
    const restored = createClockService(); tick();
    assert.equal(restored.state.alerts[0].name, 'Persistente');
  } finally {
    Date.now = original.now; globalThis.setInterval = original.setInterval;
    for (const key of ['window', 'document', 'localStorage']) { if (original[key] === undefined) delete globalThis[key]; else globalThis[key] = original[key]; }
  }
});
