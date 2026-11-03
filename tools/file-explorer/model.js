export function buildFileTree(files) {
  const root = { name: 'Archivos seleccionados', kind: 'directory', children: new Map() };
  for (const file of files) {
    const segments = (file.webkitRelativePath || file.name).split('/').filter(Boolean);
    let directory = root;
    for (const name of segments.slice(0, -1)) {
      if (!directory.children.has(name)) directory.children.set(name, { name, kind: 'directory', children: new Map() });
      directory = directory.children.get(name);
    }
    const name = segments.at(-1);
    directory.children.set(name, { name, kind: 'file', file, getFile: async () => file });
  }
  if (root.children.size === 1) {
    const only = [...root.children.values()][0];
    if (only.kind === 'directory') return only;
  }
  return root;
}

export function sortEntries(entries) {
  return [...entries].sort((a, b) => a.kind === b.kind ? a.name.localeCompare(b.name, 'es', { numeric: true }) : a.kind === 'directory' ? -1 : 1);
}

export function previewKind(file) {
  const ext = file.name.split('.').at(-1).toLowerCase();
  if (file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'svg', 'ico'].includes(ext)) return 'image';
  if (file.type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) return 'audio';
  if (file.type.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(ext)) return 'video';
  if (file.type.startsWith('text/') || ['txt', 'md', 'json', 'csv', 'log', 'js', 'mjs', 'ts', 'css', 'html', 'xml', 'yml', 'yaml', 'ini', 'toml', 'sh', 'py', 'srt'].includes(ext)) return 'text';
  return 'unsupported';
}
