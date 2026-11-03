import { icon, readLocal, writeLocal, notify } from './ui.js';
import { fitRect, resizeRect } from './geometry.js';

export class DesktopWindows {
  constructor(onChange) {
    this.container = document.querySelector('#windows');
    this.workspace = document.querySelector('#workspace');
    this.windows = new Map();
    this.zIndex = 10;
    this.onChange = onChange;
    const saved = readLocal('window-layout', {});
    this.layouts = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    this.warnedStorage = false;
    window.addEventListener('resize', () => this.windows.forEach(win => this.fit(win)));
    window.addEventListener('beforeunload', event => {
      if ([...this.windows.values()].some(win => win.controller?.preventClose?.())) {
        event.preventDefault(); event.returnValue = '';
      }
    });
  }

  bounds() { return { width: this.workspace.clientWidth, height: this.workspace.clientHeight }; }
  rect(win) {
    const style = win.element.style;
    return { left: parseFloat(style.left), top: parseFloat(style.top), width: parseFloat(style.width), height: parseFloat(style.height) };
  }
  place(win, rect) {
    const fitted = fitRect(rect, this.bounds());
    for (const [property, value] of Object.entries(fitted)) win.element.style[property] = `${value}px`;
  }
  fit(win) { if (!win.maximized) this.place(win, this.rect(win)); }
  persist(win) {
    if (win.maximized) return;
    this.layouts[win.app.id] = this.rect(win);
    if (!writeLocal('window-layout', this.layouts) && !this.warnedStorage) {
      this.warnedStorage = true;
      notify('No se pudo guardar la distribución en el navegador. Se mantendrá durante esta sesión.');
    }
  }

  open(app) {
    if (this.windows.has(app.id)) {
      const win = this.windows.get(app.id);
      win.element.hidden = false; this.focus(win); return;
    }
    const element = document.createElement('section');
    element.className = `app-window ${app.id}-window`;
    element.setAttribute('role', 'dialog');
    element.setAttribute('aria-modal', 'false');
    element.setAttribute('aria-labelledby', `title-${app.id}`);
    element.dataset.app = app.id;
    element.innerHTML = `<header class="window-titlebar" tabindex="0" title="Arrastra para mover. Flechas: mover. Mayús + flechas: cambiar tamaño."><span class="window-title-icon ${app.color}">${icon(app.icon)}</span><h2 id="title-${app.id}">${app.name}</h2><div class="window-controls"><button data-action="minimize" aria-label="Minimizar ${app.name}" title="Minimizar"><span class="minimize-mark"></span></button><button data-action="maximize" aria-label="Maximizar ${app.name}" title="Maximizar"><span class="maximize-mark"></span></button><button data-action="close" class="close-window" aria-label="Cerrar ${app.name}" title="Cerrar">${icon('close')}</button></div></header><div class="window-content"></div>`;
    for (const edge of ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']) {
      const handle = document.createElement(edge === 'se' ? 'button' : 'div');
      handle.className = `window-resize-handle resize-${edge}`;
      handle.dataset.edge = edge;
      if (edge === 'se') {
        handle.setAttribute('aria-label', `Cambiar tamaño de ${app.name}`);
        handle.title = 'Arrastra para cambiar tamaño. También puedes usar las flechas.';
      } else handle.setAttribute('aria-hidden', 'true');
      element.append(handle);
    }
    const bounds = this.bounds();
    const width = Math.min(app.width, bounds.width);
    const height = Math.min(app.height, bounds.height - 60);
    const offset = this.windows.size * 28;
    const initial = { width, height, left: (bounds.width - width) / 2 + offset, top: 24 + offset };
    const saved = this.layouts[app.id];
    const win = { app, element, maximized: false, controller: null };
    this.windows.set(app.id, win);
    this.place(win, saved && typeof saved === 'object' ? { ...initial, ...saved } : initial);
    this.container.append(element);
    win.controller = app.mount(element.querySelector('.window-content')) || {};
    this.attachEvents(win);
    this.focus(win);
  }

  focus(win, moveFocus = true) {
    this.windows.forEach(other => other.element.classList.toggle('active', other === win));
    win.element.style.zIndex = ++this.zIndex;
    this.activeId = win.app.id;
    if (moveFocus) (win.element.querySelector('[data-initial-focus]') || win.element.querySelector('.window-titlebar')).focus({ preventScroll: true });
    this.onChange(this.windows);
  }
  focusNext() {
    const visible = [...this.windows.values()].filter(win => !win.element.hidden).sort((a, b) => Number(b.element.style.zIndex) - Number(a.element.style.zIndex));
    if (visible.length) this.focus(visible[0], false);
    else { this.activeId = null; this.onChange(this.windows); }
  }
  minimize(win) {
    win.element.hidden = true;
    if (this.activeId === win.app.id) this.focusNext(); else this.onChange(this.windows);
    document.querySelector(`[data-dock="${win.app.id}"]`)?.focus();
  }
  toggleFromTaskbar(id) {
    const win = this.windows.get(id);
    if (!win) return;
    if (!win.element.hidden && this.activeId === id) this.minimize(win);
    else { win.element.hidden = false; this.focus(win); }
  }
  toggleMaximize(win) {
    if (!win.maximized) this.persist(win);
    win.maximized = !win.maximized;
    win.element.classList.toggle('maximized', win.maximized);
    const button = win.element.querySelector('[data-action="maximize"]');
    button.setAttribute('aria-label', `${win.maximized ? 'Restaurar' : 'Maximizar'} ${win.app.name}`);
    button.title = win.maximized ? 'Restaurar' : 'Maximizar';
    this.fit(win);
  }

  arrange(mode) {
    const visible = [...this.windows.values()].filter(win => !win.element.hidden);
    const bounds = this.bounds();
    const workHeight = Math.max(1, bounds.height - document.querySelector('.taskbar').offsetHeight);
    const columns = Math.max(1, Math.min(visible.length, Math.floor(bounds.width / 280) || 1, Math.ceil(Math.sqrt(visible.length * bounds.width / workHeight))));
    const rows = Math.ceil(visible.length / columns);
    visible.forEach((win, index) => {
      if (win.maximized) this.toggleMaximize(win);
      if (mode === 'tile') {
        const width = bounds.width / columns;
        const height = workHeight / rows;
        this.place(win, { left: (index % columns) * width, top: Math.floor(index / columns) * height, width, height });
      } else {
        this.place(win, { left: 24 + index * 28, top: 24 + index * 28, width: win.app.width, height: Math.min(win.app.height, workHeight - 24) });
      }
      this.persist(win);
    });
  }

  attachEvents(win) {
    const el = win.element;
    const bar = el.querySelector('.window-titlebar');
    el.addEventListener('pointerdown', () => this.focus(win, false));
    el.addEventListener('focusin', () => { if (this.activeId !== win.app.id) this.focus(win, false); });
    bar.addEventListener('dblclick', event => { if (!event.target.closest('button')) this.toggleMaximize(win); });
    const attachGesture = (target, edge = '') => {
      let gesture = null;
      target.addEventListener('pointerdown', event => {
        if ((!edge && event.target.closest('button')) || win.maximized || event.button !== 0) return;
        event.preventDefault();
        gesture = { x: event.clientX, y: event.clientY, rect: this.rect(win) };
        target.setPointerCapture(event.pointerId);
        if (!edge || target.tagName === 'BUTTON') target.focus({ preventScroll: true });
        el.classList.add(edge ? 'resizing' : 'dragging');
      });
      target.addEventListener('pointermove', event => {
        if (!gesture) return;
        const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
        this.place(win, edge ? resizeRect(gesture.rect, edge, dx, dy, this.bounds()) : { ...gesture.rect, left: gesture.rect.left + dx, top: gesture.rect.top + dy });
      });
      const finish = () => {
        if (!gesture) return;
        gesture = null; el.classList.remove('dragging', 'resizing'); this.persist(win);
      };
      target.addEventListener('pointerup', finish);
      target.addEventListener('pointercancel', finish);
      target.addEventListener('lostpointercapture', finish);
    };
    attachGesture(bar);
    el.querySelectorAll('.window-resize-handle').forEach(handle => attachGesture(handle, handle.dataset.edge));
    const keyboardResize = event => {
      if (!event.key.startsWith('Arrow') || win.maximized) return;
      const onBar = event.target === bar;
      if (!onBar && event.target !== el.querySelector('.resize-se')) return;
      event.preventDefault();
      const dx = event.key === 'ArrowLeft' ? -16 : event.key === 'ArrowRight' ? 16 : 0;
      const dy = event.key === 'ArrowUp' ? -16 : event.key === 'ArrowDown' ? 16 : 0;
      const rect = this.rect(win);
      this.place(win, event.shiftKey || !onBar ? resizeRect(rect, 'se', dx, dy, this.bounds()) : { ...rect, left: rect.left + dx, top: rect.top + dy });
      this.persist(win);
    };
    bar.addEventListener('keydown', keyboardResize);
    el.querySelector('.resize-se').addEventListener('keydown', keyboardResize);
    el.querySelector('[data-action="minimize"]').addEventListener('click', () => this.minimize(win));
    el.querySelector('[data-action="maximize"]').addEventListener('click', () => this.toggleMaximize(win));
    el.querySelector('[data-action="close"]').addEventListener('click', () => {
      if (win.controller.preventClose?.() && !window.confirm(win.controller.closeMessage || 'Hay una grabación en curso o sin descargar. ¿Cerrar y descartarla?')) return;
      this.persist(win); win.controller.destroy?.(); el.remove(); this.windows.delete(win.app.id);
      this.focusNext();
      (document.querySelector('#dock button') || document.querySelector('#launcher-toggle')).focus();
    });
  }
}
