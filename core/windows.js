import { icon } from './ui.js';

export class DesktopWindows {
  constructor(onChange) {
    this.container = document.querySelector('#windows');
    this.workspace = document.querySelector('#workspace');
    this.windows = new Map();
    this.zIndex = 10;
    this.onChange = onChange;
    window.addEventListener('resize', () => this.windows.forEach(win => this.fit(win)));
    window.addEventListener('beforeunload', event => {
      if ([...this.windows.values()].some(win => win.controller?.preventClose?.())) {
        event.preventDefault();
        event.returnValue = '';
      }
    });
  }

  open(app) {
    if (this.windows.has(app.id)) {
      const win = this.windows.get(app.id);
      win.element.hidden = false;
      this.focus(win);
      return;
    }
    const element = document.createElement('section');
    element.className = `app-window ${app.id}-window`;
    element.setAttribute('role', 'dialog');
    element.setAttribute('aria-modal', 'false');
    element.setAttribute('aria-labelledby', `title-${app.id}`);
    element.dataset.app = app.id;
    element.innerHTML = `<header class="window-titlebar" tabindex="0" title="Arrastra para mover. Con esta barra enfocada: flechas para mover; Mayús + flechas para cambiar el tamaño."><span class="window-title-icon ${app.color}">${icon(app.icon)}</span><h2 id="title-${app.id}">${app.name}</h2><div class="window-controls"><button data-action="minimize" aria-label="Minimizar ${app.name}" title="Minimizar"><span class="minimize-mark"></span></button><button data-action="maximize" aria-label="Maximizar ${app.name}" title="Maximizar"><span class="maximize-mark"></span></button><button data-action="close" class="close-window" aria-label="Cerrar ${app.name}" title="Cerrar">${icon('close')}</button></div></header><div class="window-content"></div>`;
    const width = Math.min(app.width, this.workspace.clientWidth - 16);
    const height = Math.min(app.height, this.workspace.clientHeight - 16);
    const offset = this.windows.size * 36;
    const left = (this.workspace.clientWidth - width) / 2 + offset;
    Object.assign(element.style, { width: `${width}px`, height: `${height}px`, left: `${left}px`, top: `${Math.max(8, 20 + offset)}px` });
    const win = { app, element, maximized: false, controller: null };
    this.windows.set(app.id, win);
    this.container.append(element);
    win.controller = app.mount(element.querySelector('.window-content')) || {};
    win.resizeObserver = new ResizeObserver(() => this.fit(win));
    win.resizeObserver.observe(element);
    this.attachEvents(win);
    this.fit(win);
    this.focus(win);
    this.onChange(this.windows);
  }

  focus(win, moveFocus = true) {
    this.windows.forEach(other => other.element.classList.toggle('active', other === win));
    win.element.style.zIndex = ++this.zIndex;
    this.activeId = win.app.id;
    if (moveFocus) (win.element.querySelector('[data-initial-focus]') || win.element.querySelector('.window-titlebar')).focus({ preventScroll: true });
    this.onChange(this.windows);
  }

  fit(win) {
    if (win.maximized) return;
    const el = win.element;
    const maxWidth = Math.max(1, this.workspace.clientWidth - 16);
    const maxHeight = Math.max(1, this.workspace.clientHeight - 16);
    el.style.maxWidth = `${maxWidth}px`;
    el.style.maxHeight = `${maxHeight}px`;
    const width = Math.min(parseFloat(el.style.width), maxWidth);
    const height = Math.min(parseFloat(el.style.height), maxHeight);
    el.style.left = `${Math.max(8, Math.min(parseFloat(el.style.left), this.workspace.clientWidth - width - 8))}px`;
    el.style.top = `${Math.max(8, Math.min(parseFloat(el.style.top), this.workspace.clientHeight - height - 8))}px`;
  }

  toggleMaximize(win) {
    win.maximized = !win.maximized;
    win.element.classList.toggle('maximized', win.maximized);
    const button = win.element.querySelector('[data-action="maximize"]');
    button.setAttribute('aria-label', `${win.maximized ? 'Restaurar' : 'Maximizar'} ${win.app.name}`);
    button.title = win.maximized ? 'Restaurar' : 'Maximizar';
    this.fit(win);
  }

  attachEvents(win) {
    const el = win.element;
    const bar = el.querySelector('.window-titlebar');
    el.addEventListener('pointerdown', () => this.focus(win, false));
    el.addEventListener('focusin', () => { if (this.activeId !== win.app.id) this.focus(win, false); });
    bar.addEventListener('dblclick', event => { if (!event.target.closest('button')) this.toggleMaximize(win); });
    let drag = null;
    bar.addEventListener('pointerdown', event => {
      if (event.target.closest('button') || win.maximized || event.button !== 0) return;
      drag = { x: event.clientX, y: event.clientY, left: parseFloat(el.style.left), top: parseFloat(el.style.top) };
      bar.setPointerCapture(event.pointerId);
      bar.focus({ preventScroll: true });
      el.classList.add('dragging');
    });
    bar.addEventListener('pointermove', event => {
      if (!drag) return;
      el.style.left = `${drag.left + event.clientX - drag.x}px`;
      el.style.top = `${drag.top + event.clientY - drag.y}px`;
      this.fit(win);
    });
    const endDrag = () => { drag = null; el.classList.remove('dragging'); };
    bar.addEventListener('pointerup', endDrag);
    bar.addEventListener('pointercancel', endDrag);
    bar.addEventListener('lostpointercapture', endDrag);
    bar.addEventListener('keydown', event => {
      if (event.target !== bar || !event.key.startsWith('Arrow') || win.maximized) return;
      event.preventDefault();
      const dx = event.key === 'ArrowLeft' ? -16 : event.key === 'ArrowRight' ? 16 : 0;
      const dy = event.key === 'ArrowUp' ? -16 : event.key === 'ArrowDown' ? 16 : 0;
      if (event.shiftKey) {
        el.style.width = `${Math.max(300, Math.min(this.workspace.clientWidth - parseFloat(el.style.left) - 8, el.offsetWidth + dx))}px`;
        el.style.height = `${Math.max(260, Math.min(this.workspace.clientHeight - parseFloat(el.style.top) - 8, el.offsetHeight + dy))}px`;
      } else {
        el.style.left = `${parseFloat(el.style.left) + dx}px`;
        el.style.top = `${parseFloat(el.style.top) + dy}px`;
      }
      this.fit(win);
    });
    el.querySelector('[data-action="minimize"]').addEventListener('click', () => {
      el.hidden = true;
      document.querySelector(`[data-dock="${win.app.id}"]`)?.focus();
      this.onChange(this.windows);
    });
    el.querySelector('[data-action="maximize"]').addEventListener('click', () => this.toggleMaximize(win));
    el.querySelector('[data-action="close"]').addEventListener('click', () => {
      if (win.controller.preventClose?.() && !window.confirm(win.controller.closeMessage || 'Hay una grabación en curso o sin descargar. ¿Cerrar y descartarla?')) return;
      win.controller.destroy?.();
      win.resizeObserver.disconnect();
      el.remove();
      this.windows.delete(win.app.id);
      document.querySelector(`[data-dock="${win.app.id}"]`)?.focus();
      this.onChange(this.windows);
    });
  }
}
