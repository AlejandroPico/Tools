import { DesktopWindows } from './core/windows.js';
import { icon } from './core/ui.js';
import { mountCalculator } from './tools/calculator/app.js';
import { mountRecorder } from './tools/audio-recorder/app.js';
import { mountExplorer } from './tools/file-explorer/app.js';

const apps = [
  { id: 'calculator', name: 'Calculadora', description: 'Tus cuentas, a mano.', icon: 'calculator', color: 'mint', width: 370, height: 590, mount: mountCalculator },
  { id: 'audio-recorder', name: 'Grabadora', description: 'Dale voz a tus ideas.', icon: 'mic', color: 'coral', width: 430, height: 570, mount: mountRecorder },
  { id: 'file-explorer', name: 'Archivos', description: 'Explora lo que es tuyo.', icon: 'folder', color: 'amber', width: 700, height: 560, mount: mountExplorer },
];

const manager = new DesktopWindows(windows => {
  for (const app of apps) {
    const button = document.querySelector(`[data-dock="${app.id}"]`);
    const win = windows.get(app.id);
    button?.classList.toggle('is-open', !!win);
    button?.classList.toggle('is-active', !!win && !win.element.hidden && manager.activeId === app.id);
    button?.setAttribute('aria-label', `${app.name}${win ? win.element.hidden ? ' (minimizada)' : ' (abierta)' : ''}`);
  }
  const count = windows.size;
  document.querySelector('#window-count').textContent = count ? `${count} ${count === 1 ? 'herramienta abierta' : 'herramientas abiertas'}` : 'Tu espacio de trabajo';
});

for (const app of apps) {
  for (const target of ['#dock', '#launcher-apps']) {
    const button = document.createElement('button');
    button.className = target === '#dock' ? 'dock-app' : 'launcher-app';
    button.title = `Abrir ${app.name}`;
    button.innerHTML = `<span class="app-icon ${app.color}">${icon(app.icon)}</span>${target === '#dock' ? '' : `<span class="app-label">${app.name}${target === '#launcher-apps' ? `<small>${app.description}</small>` : ''}</span>`}`;
    if (target === '#dock') button.dataset.dock = app.id;
    button.addEventListener('click', () => { manager.open(app); closeLauncher(); });
    document.querySelector(target).append(button);
  }
}

const launcher = document.querySelector('#launcher');
const launcherToggle = document.querySelector('#launcher-toggle');
function closeLauncher() { launcher.hidden = true; launcherToggle.setAttribute('aria-expanded', 'false'); }
launcherToggle.addEventListener('click', () => {
  launcher.hidden = !launcher.hidden;
  launcherToggle.setAttribute('aria-expanded', String(!launcher.hidden));
  if (!launcher.hidden) launcher.querySelector('button').focus();
});
document.addEventListener('pointerdown', event => { if (!event.target.closest('#launcher, #launcher-toggle')) closeLauncher(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !launcher.hidden) { closeLauncher(); launcherToggle.focus(); } });
document.querySelector('#help-button').addEventListener('click', () => document.querySelector('#about-dialog').showModal());

function updateClock() {
  const now = new Date();
  const clock = document.querySelector('#clock-time');
  clock.textContent = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(now);
  clock.dateTime = now.toISOString();
  document.querySelector('#clock-date').textContent = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(now);
}
updateClock();
setInterval(updateClock, 15000);
const requested = apps.find(app => app.id === location.hash.slice(1));
manager.open(requested || apps[0]);
