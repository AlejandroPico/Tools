import { DesktopWindows } from './core/windows.js';
import { icon } from './core/ui.js';
import { initializeDesktop } from './core/desktop.js';
import { mountCalculator } from './tools/calculator/app.js';
import { mountRecorder } from './tools/audio-recorder/app.js';
import { mountExplorer } from './tools/file-explorer/app.js';

const apps = [
  { id: 'calculator', name: 'Calculadora', description: 'Operaciones, memoria e historial.', icon: 'calculator', color: 'mint', width: 370, height: 590, mount: mountCalculator },
  { id: 'audio-recorder', name: 'Grabadora', description: 'Graba, escucha y descarga audio.', icon: 'mic', color: 'coral', width: 430, height: 570, mount: mountRecorder },
  { id: 'file-explorer', name: 'Archivos', description: 'Explora tus archivos locales.', icon: 'folder', color: 'amber', width: 700, height: 560, mount: mountExplorer },
];

const dock = document.querySelector('#dock');
const manager = new DesktopWindows(windows => {
  for (const button of dock.querySelectorAll('[data-dock]')) {
    if (!windows.has(button.dataset.dock)) button.remove();
  }
  for (const [id, win] of windows) {
    let button = dock.querySelector(`[data-dock="${id}"]`);
    if (!button) {
      button = document.createElement('button');
      button.className = 'dock-app is-open'; button.dataset.dock = id;
      button.innerHTML = `<span class="app-icon ${win.app.color}">${icon(win.app.icon)}</span>`;
      button.addEventListener('click', () => manager.toggleFromTaskbar(id));
      dock.append(button);
    }
    button.classList.toggle('is-active', !win.element.hidden && manager.activeId === id);
    button.setAttribute('aria-label', `${win.app.name} (${win.element.hidden ? 'minimizada' : 'abierta'})`);
    button.title = win.app.name;
  }
});

const launcher = document.querySelector('#launcher');
const launcherToggle = document.querySelector('#launcher-toggle');
function closeLauncher() { launcher.hidden = true; launcherToggle.setAttribute('aria-expanded', 'false'); }
function openLauncher() {
  launcher.hidden = false; launcherToggle.setAttribute('aria-expanded', 'true');
  launcher.querySelector('button').focus();
}
for (const app of apps) {
  const button = document.createElement('button');
  button.className = 'launcher-app'; button.title = `Abrir ${app.name}`;
  button.innerHTML = `<span class="app-icon ${app.color}">${icon(app.icon)}</span><span class="app-label">${app.name}<small>${app.description}</small></span>`;
  button.addEventListener('click', () => { closeLauncher(); manager.open(app); });
  document.querySelector('#launcher-apps').append(button);
}
launcherToggle.addEventListener('click', () => { if (launcher.hidden) openLauncher(); else closeLauncher(); });
document.addEventListener('pointerdown', event => { if (!event.target.closest('#launcher, #launcher-toggle')) closeLauncher(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !launcher.hidden) { closeLauncher(); launcherToggle.focus(); } });
initializeDesktop({ manager, openLauncher, closeLauncher });

function updateClock() {
  const now = new Date();
  const clock = document.querySelector('#clock-time');
  clock.textContent = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(now);
  clock.dateTime = now.toISOString();
  document.querySelector('#clock-date').textContent = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(now);
}
updateClock(); setInterval(updateClock, 15000);
// Every visit starts with an empty desktop. Only geometry and preferences persist.
