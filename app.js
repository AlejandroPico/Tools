import { DesktopWindows } from './core/windows.js';
import { icon } from './core/ui.js';
import { initializeDesktop } from './core/desktop.js';
import { mountCalculator } from './tools/calculator/app.js';
import { mountRecorder } from './tools/audio-recorder/app.js';
import { mountFiles } from './tools/file-explorer/workbench.js';
import { mountNotepad } from './tools/notepad/app.js';
import { mountClock } from './tools/clock/app.js';
import { mountData } from './tools/data/app.js';
import { mountImage } from './tools/image/app.js';
import { mountDesign } from './tools/design/app.js';
import { mountUtilities } from './tools/utilities/app.js';
import { mountPDF } from './tools/pdf/app.js';
import { mountCapture } from './tools/capture/app.js';
import { mountAudio } from './tools/audio/app.js';
import { mountVoice } from './tools/voice/app.js';
import { mountProductivity } from './tools/productivity/app.js';
import { mountAccessibility } from './tools/accessibility/app.js';
import { initializeAccess } from './core/accessibility.js';
import { createClockService, installClockAlerts } from './tools/clock/service.js';

const clockService = createClockService();

const apps = [
  { id: 'capture', name: 'Capturas', category: 'Multimedia', description: 'Capturar y recortar imágenes, grabar pantalla y cámara.', icon: 'camera', color: 'coral', width: 1000, height: 760, mount: mountCapture },
  { id: 'audio', name: 'Audio', category: 'Multimedia', description: 'Recortar, unir y convertir audio, reproducir a otra velocidad y generar tonos.', icon: 'wave', color: 'amber', width: 1000, height: 760, mount: mountAudio },
  { id: 'voice', name: 'Voz', category: 'Texto', description: 'Transcripción local, dictado, lectura, subtítulos y teleprónter.', icon: 'voice', color: 'coral', width: 1000, height: 760, mount: mountVoice },
  { id: 'productivity', name: 'Productividad', category: 'Organización', description: 'Tareas, tarjetas, pizarra, mapas mentales y diagramas.', icon: 'board', color: 'mint', width: 1100, height: 780, mount: mountProductivity },
  { id: 'accessibility', name: 'Accesibilidad', category: 'Accesibilidad', description: 'Lupa, lector, teclado en pantalla, filtros, contraste y tamaño de texto.', icon: 'access', color: 'amber', width: 960, height: 720, mount: mountAccessibility },
  { id: 'utilities', name: 'Utilidades', category: 'Utilidades', description: 'Contraseñas, QR, códigos de barras, números aleatorios y sorteos.', icon: 'utilities', color: 'mint', width: 900, height: 700, mount: mountUtilities },
  { id: 'pdf', name: 'PDF', category: 'Documentos', description: 'Visor PDF, unir, separar, extraer, reordenar y girar páginas, imágenes a PDF.', icon: 'pdf', color: 'coral', width: 1100, height: 780, mount: mountPDF },
  { id: 'data', name: 'Datos', category: 'Datos', description: 'JSON, CSV, expresiones regulares, URL, Base64 y bases numéricas.', icon: 'data', color: 'mint', width: 940, height: 720, mount: mountData },
  { id: 'image', name: 'Imagen', category: 'Imagen', description: 'Dibujar, recortar, redimensionar y convertir imágenes PNG, JPEG y WebP.', icon: 'image', color: 'coral', width: 1040, height: 780, mount: mountImage },
  { id: 'design', name: 'Diseño', category: 'Diseño', description: 'Cuentagotas, paletas, contraste, degradados y editor SVG.', icon: 'palette', color: 'amber', width: 940, height: 720, mount: mountDesign },
  { id: 'notepad', name: 'Bloc de notas', category: 'Texto', description: 'Notas, Markdown, comparar y limpiar texto.', icon: 'notes', color: 'mint', width: 920, height: 680, mount: mountNotepad },
  { id: 'clock', name: 'Reloj', category: 'Tiempo', description: 'Alarmas, cronómetro, temporizadores, Pomodoro, ciudades y calendario.', icon: 'clock', color: 'amber', width: 800, height: 680, mount: root => mountClock(root, clockService) },
  { id: 'calculator', name: 'Calculadora', category: 'Cálculo', description: 'Estándar, científica, gráfica, programador, fechas, edades y unidades.', icon: 'calculator', color: 'mint', width: 450, height: 680, mount: mountCalculator },
  { id: 'audio-recorder', name: 'Grabadora', category: 'Multimedia', description: 'Grabar, escuchar y descargar audio.', icon: 'mic', color: 'coral', width: 430, height: 570, mount: mountRecorder },
  { id: 'file-explorer', name: 'Archivos', category: 'Archivos', description: 'Explorador, ZIP, comparación, hexadecimal, SHA-256 y creación de archivos.', icon: 'folder', color: 'amber', width: 1000, height: 760, mount: mountFiles },
];

const dock = document.querySelector('#dock');
const manager = new DesktopWindows(windows => {
  document.querySelector('#system-active-app').textContent = windows.get(manager.activeId)?.app.name || 'Tools';
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
const search = document.querySelector('#launcher-search');
let category = 'Todas';
const normalize = text => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es');
function filterLauncher() {
  const query = normalize(search.value.trim()); let matches = 0;
  for (const app of apps) {
    const button = launcher.querySelector(`[data-launch="${app.id}"]`);
    const visible = (category === 'Todas' || category === app.category) && normalize(`${app.name} ${app.description} ${app.category}`).includes(query);
    button.hidden = !visible; if (visible) matches++;
  }
  launcher.querySelectorAll('[data-category]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === category)));
  document.querySelector('#launcher-no-results').hidden = matches > 0;
  document.querySelector('#launcher-clear').hidden = !search.value;
}
function closeLauncher() { launcher.hidden = true; launcherToggle.setAttribute('aria-expanded', 'false'); }
function openLauncher() {
  launcher.hidden = false; launcherToggle.setAttribute('aria-expanded', 'true');
  search.value = ''; category = 'Todas'; filterLauncher(); search.focus();
}
for (const app of [...apps].sort((a, b) => a.name.localeCompare(b.name, 'es'))) {
  const button = document.createElement('button');
  button.className = 'launcher-app'; button.dataset.launch = app.id; button.title = `${app.name} · ${app.description}`;
  button.innerHTML = `<span class="app-icon ${app.color}">${icon(app.icon)}</span><span class="app-label">${app.name}</span><span class="launcher-app-arrow" aria-hidden="true">›</span>`;
  button.addEventListener('click', () => { closeLauncher(); manager.open(app); });
  document.querySelector('#launcher-apps').append(button);
}
for (const name of ['Todas', ...new Set(apps.map(app => app.category))]) {
  const button = document.createElement('button'); button.dataset.category = name; button.textContent = name;
  button.setAttribute('aria-label', `Categoría: ${name}`);
  button.addEventListener('click', () => { category = name; filterLauncher(); }); document.querySelector('#launcher-categories').append(button);
}
search.addEventListener('input', filterLauncher);
document.querySelector('#launcher-clear').addEventListener('click', () => { search.value = ''; filterLauncher(); search.focus(); });
launcher.addEventListener('keydown', event => {
  const buttons = [...launcher.querySelectorAll('.launcher-app:not([hidden])')];
  if (event.target === search && event.key === 'ArrowDown' && buttons.length) { event.preventDefault(); buttons[0].focus(); }
  else if (buttons.includes(event.target) && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault(); const index = buttons.indexOf(event.target); const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length; buttons[next].focus();
  }
});
launcherToggle.addEventListener('click', () => { if (launcher.hidden) openLauncher(); else closeLauncher(); });
document.addEventListener('pointerdown', event => { if (!event.target.closest('#launcher, #launcher-toggle')) closeLauncher(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !launcher.hidden) { closeLauncher(); launcherToggle.focus(); } });
initializeDesktop({ manager, openLauncher, closeLauncher });
initializeAccess();
const clockApp = apps.find(app => app.id === 'clock');
document.querySelector('#system-clock').addEventListener('click', () => { closeLauncher(); manager.open(clockApp); });
document.querySelector('#taskbar-clock').addEventListener('click', () => { closeLauncher(); manager.open(clockApp); });
installClockAlerts(clockService, () => manager.open(clockApp));

function updateClock() {
  const now = new Date();
  const clock = document.querySelector('#clock-time');
  clock.textContent = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(now);
  clock.dateTime = now.toISOString();
  document.querySelector('#system-clock').textContent = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(now);
  document.querySelector('#clock-date').textContent = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(now);
}
updateClock(); setInterval(updateClock, 1000);
// Every visit starts with an empty desktop. Only geometry and preferences persist.
