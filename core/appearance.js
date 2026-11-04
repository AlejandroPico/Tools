export const appearances = [
  { id: 'tools', name: 'Tools', description: 'Escritorio original · líneas rectas' },
  { id: 'windows', name: 'Windows', description: 'Barra centrada · menú de aplicaciones · controles a la derecha' },
  { id: 'macos', name: 'macOS', description: 'Dock flotante · barra de menús · controles de colores' },
  { id: 'ubuntu', name: 'Ubuntu', description: 'Dock lateral · Actividades · barra superior' },
];
export const getAppearance = id => appearances.find(item => item.id === id) || appearances[0];
export function applyAppearance(id) {
  const appearance = getAppearance(id);
  document.documentElement.dataset.appearance = appearance.id;
  const label = document.querySelector('#system-apps-label');
  if (label) label.textContent = appearance.id === 'ubuntu' ? 'Actividades' : 'Aplicaciones';
  document.querySelector('#launcher-toggle')?.setAttribute('title', appearance.id === 'macos' ? 'Aplicaciones' : appearance.id === 'ubuntu' ? 'Mostrar aplicaciones' : 'Inicio');
  window.dispatchEvent(new Event('tools:appearance-change'));
}
