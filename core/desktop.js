import { applyTheme, themes, defaultThemeId, getTheme } from './themes.js';
import { readLocal, writeLocal } from './ui.js';

export function initializeDesktop({ manager, openLauncher, closeLauncher }) {
  const preference = readLocal('desktop-preferences', {});
  let currentTheme = getTheme(preference?.themeId);
  applyTheme(currentTheme);

  function mountProperties(root) {
    root.innerHTML = `<div class="desktop-properties"><div class="properties-heading"><h3>Elige tu ambiente</h3><p>24 fondos y colores para tu escritorio. La selección se guarda en este navegador.</p></div><div class="theme-groups" role="radiogroup" aria-label="Tema del escritorio"></div><footer class="properties-footer"><span class="theme-status" role="status"></span><button class="secondary-button theme-reset">Restablecer tema</button></footer></div>`;
    const groups = root.querySelector('.theme-groups');
    for (const group of ['Mañana', 'Tarde', 'Noche']) {
      const section = document.createElement('section');
      const heading = document.createElement('h4'); heading.textContent = group;
      const grid = document.createElement('div'); grid.className = 'theme-grid';
      for (const theme of themes.filter(item => item.group === group)) {
        const label = document.createElement('label'); label.className = 'theme-tile';
        const input = document.createElement('input'); input.type = 'radio'; input.name = 'desktop-theme'; input.value = theme.id;
        input.checked = currentTheme.id === theme.id;
        input.setAttribute('aria-label', `${group}: ${theme.name}`);
        const swatch = document.createElement('span'); swatch.className = 'theme-swatch';
        swatch.setAttribute('aria-hidden', 'true');
        swatch.style.background = `radial-gradient(ellipse at 80% 90%, ${theme.glow}, transparent 85%), ${theme.base}`;
        const name = document.createElement('span'); name.textContent = theme.name;
        label.append(input, swatch, name); grid.append(label);
        input.addEventListener('change', () => choose(theme));
      }
      section.append(heading, grid); groups.append(section);
    }
    const status = root.querySelector('.theme-status');
    status.textContent = `Tema actual: ${currentTheme.name}`;
    function choose(theme) {
      currentTheme = theme; applyTheme(theme);
      const saved = writeLocal('desktop-preferences', { version: 1, themeId: theme.id });
      status.textContent = saved ? `«${theme.name}» guardado en este navegador.` : 'No se pudo guardar. El tema se conservará durante esta sesión.';
      status.classList.toggle('error-text', !saved);
    }
    root.querySelector('.theme-reset').addEventListener('click', () => {
      choose(getTheme(defaultThemeId));
      root.querySelector(`input[value="${defaultThemeId}"]`).checked = true;
    });
  }
  const propertiesApp = { id: 'desktop-properties', name: 'Propiedades del escritorio', icon: 'palette', color: 'mint', width: 650, height: 620, mount: mountProperties };
  const menu = document.querySelector('#desktop-menu');
  const workspace = document.querySelector('#workspace');
  let previousFocus = null;
  function closeMenu(restoreFocus = false) {
    if (menu.hidden) return;
    menu.hidden = true;
    if (restoreFocus) (previousFocus?.isConnected ? previousFocus : workspace).focus({ preventScroll: true });
  }
  function showMenu(x, y) {
    closeLauncher();
    previousFocus = document.activeElement;
    const visible = [...manager.windows.values()].filter(win => !win.element.hidden).length;
    menu.querySelectorAll('[data-arrange]').forEach(button => { button.disabled = visible < 2; });
    menu.hidden = false;
    menu.style.left = `${Math.max(4, Math.min(x, window.innerWidth - menu.offsetWidth - 4))}px`;
    menu.style.top = `${Math.max(4, Math.min(y, window.innerHeight - menu.offsetHeight - 4))}px`;
    menu.querySelector('button').focus({ preventScroll: true });
  }
  menu.querySelector('[data-desktop-action="apps"]').addEventListener('click', () => { closeMenu(); openLauncher(); });
  menu.querySelector('[data-desktop-action="properties"]').addEventListener('click', () => { closeMenu(); manager.open(propertiesApp); });
  menu.querySelector('[data-desktop-action="about"]').addEventListener('click', () => { closeMenu(); document.querySelector('#about-dialog').showModal(); });
  menu.querySelectorAll('[data-arrange]').forEach(button => button.addEventListener('click', () => {
    closeMenu(true); manager.arrange(button.dataset.arrange);
  }));
  const isDesktop = target => !target.closest('.app-window, dialog, #launcher, #desktop-menu');
  document.addEventListener('contextmenu', event => {
    if (!isDesktop(event.target)) return;
    event.preventDefault(); showMenu(event.clientX, event.clientY);
  });
  document.addEventListener('pointerdown', event => { if (!event.target.closest('#desktop-menu')) closeMenu(); });
  window.addEventListener('resize', () => closeMenu());
  document.addEventListener('keydown', event => {
    if ((event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) && isDesktop(event.target)) {
      event.preventDefault(); showMenu(window.innerWidth / 2, window.innerHeight / 2); return;
    }
    if (menu.hidden) return;
    const buttons = [...menu.querySelectorAll('button:not(:disabled)')];
    const index = buttons.indexOf(document.activeElement);
    if (event.key === 'Escape' || event.key === 'Tab') { event.preventDefault(); closeMenu(true); }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus();
    }
  });
  // On touch devices the same desktop menu is available by holding an empty area.
  let holdTimer, holdPoint;
  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || !event.target.closest('#workspace') || !isDesktop(event.target)) return;
    holdPoint = { x: event.clientX, y: event.clientY };
    holdTimer = setTimeout(() => showMenu(holdPoint.x, holdPoint.y), 600);
  });
  document.addEventListener('pointermove', event => {
    if (holdPoint && Math.hypot(event.clientX - holdPoint.x, event.clientY - holdPoint.y) > 12) clearTimeout(holdTimer);
  });
  for (const type of ['pointerup', 'pointercancel']) document.addEventListener(type, () => { clearTimeout(holdTimer); holdPoint = null; });
}
