const palettes = {
  'Mañana': [
    ['lino', 'Lino', '#ede8df', '#fff9ed', '#526651', 40],
    ['niebla', 'Niebla', '#e1e7ed', '#f8fcff', '#40637d', 210],
    ['menta', 'Menta', '#dcece4', '#f5fff9', '#28684e', 155],
    ['cielo', 'Cielo', '#d9e9f4', '#f4fbff', '#29698f', 205],
    ['lavanda', 'Lavanda', '#e8e0f0', '#fcf7ff', '#6d528d', 275],
    ['melocoton', 'Melocotón', '#f3e1d7', '#fff5eb', '#915633', 25],
    ['rosa', 'Rosa', '#f0dfe6', '#fff5f8', '#8c4f6c', 335],
    ['arena', 'Arena', '#eee5ce', '#fff8e7', '#78612f', 45],
  ],
  'Tarde': [
    ['ambar', 'Ámbar', '#5c4531', '#9a7041', '#f3d395', 35],
    ['terracota', 'Terracota', '#63423b', '#a26753', '#f3c4ac', 15],
    ['salvia', 'Salvia', '#3c5146', '#6c8c70', '#c6e7b7', 140],
    ['laguna', 'Laguna', '#305657', '#538f87', '#b3e8df', 175],
    ['azul', 'Azul tinta', '#3b4b63', '#627ca3', '#c1dcfc', 215],
    ['brezo', 'Brezo', '#57465f', '#8b6b91', '#e8c9f1', 285],
    ['cobre', 'Cobre', '#5c443e', '#996b53', '#eec7a0', 22],
    ['oliva', 'Oliva', '#4d5136', '#7e8650', '#dde5ab', 70],
  ],
  'Noche': [
    ['original', 'Original', '#111d2a', '#345952', '#9ce4c4', 210],
    ['grafito', 'Grafito', '#191c22', '#41454c', '#d1d8e1', 220],
    ['oceano', 'Océano', '#102537', '#245c77', '#9bdcf3', 200],
    ['bosque', 'Bosque', '#10251e', '#2d5b43', '#a4dfb5', 150],
    ['ciruela', 'Ciruela', '#25182e', '#59356b', '#dbb6f1', 280],
    ['vino', 'Vino', '#2b1922', '#6d344c', '#efb5ce', 335],
    ['pizarra', 'Pizarra', '#19282c', '#37585e', '#b2dedb', 185],
    ['medianoche', 'Medianoche', '#111526', '#303b69', '#becbff', 230],
  ],
  'Mate': [
    ['negro-oled', 'Negro', '#000000', '#000000', '#c6c6c6', 0],
    ['grafito', 'Grafito', '#111111', '#111111', '#cccccc', 0],
    ['carbon', 'Carbón', '#1b1b1b', '#1b1b1b', '#cecece', 0],
    ['azul', 'Azul', '#07111c', '#07111c', '#b4c4d2', 210],
    ['verde', 'Verde', '#08140e', '#08140e', '#b7c9bc', 150],
    ['ciruela', 'Ciruela', '#160e18', '#160e18', '#cbbbd0', 285],
    ['arena', 'Arena', '#d7cbb4', '#d7cbb4', '#655b47', 40],
    ['blanco', 'Blanco', '#ffffff', '#ffffff', '#454545', 0],
  ],
};

export const themes = Object.entries(palettes).flatMap(([group, rows]) => rows.map(([id, name, base, glow, accent, hue]) => ({
  id: `${group.toLowerCase().replace('ñ', 'n')}-${id}`, name, group, base, glow, accent, hue, matte: group === 'Mate',
})));
export const defaultThemeId = 'noche-original';
export const getTheme = id => themes.find(theme => theme.id === id) || themes.find(theme => theme.id === defaultThemeId);

export function applyTheme(theme) {
  const light = theme.group === 'Mañana' || ['mate-arena', 'mate-blanco'].includes(theme.id);
  const dusk = theme.group === 'Tarde';
  const root = document.documentElement;
  root.dataset.surface = light ? 'light' : 'dark';
  root.dataset.theme = theme.id;
  root.dataset.finish = theme.matte ? 'matte' : 'ambient';
  const tone = level => `hsl(${theme.hue} ${light ? 20 : 19}% ${level}%)`;
  const properties = {
    '--desktop-base': theme.base, '--desktop-glow': theme.glow,
    '--text': light ? '#23333d' : '#edf1f3', '--muted': light ? '#526471' : '#a4b5c1',
    '--mint': theme.accent, '--accent-ink': light ? '#ffffff' : '#192d2b',
    '--line': light ? '#263c521f' : '#d1e1ed20',
    '--panel': tone(light ? 96 : dusk ? 24 : 18),
    '--panel-strong': tone(light ? 91 : dusk ? 19 : 13),
    '--soft': tone(light ? 90 : dusk ? 31 : 25),
    '--input': tone(light ? 99 : dusk ? 18 : 11),
    '--number-key': tone(light ? 100 : dusk ? 34 : 28),
    '--function-key': tone(light ? 91 : dusk ? 27 : 22),
    '--hover': light ? '#1a3d5710' : '#ffffff0d',
    '--window-border': light ? '#53687855' : '#a0b9c055',
    '--shadow': light ? '#263b5226' : '#00000066',
  };
  if (theme.matte) {
    Object.assign(properties, {
      '--panel': theme.base, '--panel-strong': theme.base, '--input': theme.base,
      '--soft': light ? '#dfdfdf' : '#1c1c1c', '--number-key': light ? '#f4f4f4' : '#171717',
      '--function-key': light ? '#e7e7e7' : '#101010', '--shadow': '#00000000',
      '--window-border': light ? '#00000040' : '#ffffff35', '--line': light ? '#00000024' : '#ffffff24',
      '--muted': light ? '#505050' : '#a6a6a6', '--text': light ? '#202020' : '#e3e3e3',
    });
  }
  for (const [key, value] of Object.entries(properties)) root.style.setProperty(key, value);
  root.style.colorScheme = light ? 'light' : 'dark';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.base);
  window.dispatchEvent(new Event('tools:theme-change'));
}
