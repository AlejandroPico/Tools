export function icon(name, className = '') {
  return `<svg class="icon ${className}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

let toastTimer;
export function notify(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 5000);
}

export function readLocal(key, fallback) {
  try { return JSON.parse(localStorage.getItem(`tools-${key}`)) ?? fallback; }
  catch { return fallback; }
}

export function writeLocal(key, value) {
  try { localStorage.setItem(`tools-${key}`, JSON.stringify(value)); return true; }
  catch { return false; }
}
