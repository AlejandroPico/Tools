export function validateEntryName(name) {
  const value = name.trim();
  if (!value || value.length > 200 || /[<>:"/\\|?*\u0000-\u001f]/.test(value) || /[. ]$/.test(value) || ['.', '..'].includes(value) || /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(value)) throw new Error('Usa un nombre válido de hasta 200 caracteres, sin separadores ni caracteres reservados.');
  return value;
}
export function copyName(name, index) {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name, extension = dot > 0 ? name.slice(dot) : '';
  return index ? `${base.slice(0, 160)} - copia${index > 1 ? ` (${index})` : ''}${extension}` : name;
}
export async function entryExists(directory, name) {
  try { await directory.getFileHandle(name); return true; }
  catch (error) { if (error.name === 'NotFoundError') return false; if (error.name === 'TypeMismatchError') return true; throw error; }
}
export async function writeNewFile(directory, name, blob) {
  const filename = validateEntryName(name);
  if (await entryExists(directory, filename)) throw new Error('Ya existe un elemento con ese nombre. Elige otro para conservar el original.');
  const fileHandle = await directory.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  try { await writable.write(blob); await writable.close(); }
  catch (error) { await writable.abort().catch(() => {}); throw error; }
  return fileHandle;
}
export async function copyFileTo(directory, file, preferredName = file.name) {
  const desired = validateEntryName(preferredName);
  let index = 0, name = desired;
  while (await entryExists(directory, name)) {
    if (++index > 999) throw new Error('No se pudo encontrar un nombre disponible para la copia.');
    name = copyName(desired, index);
  }
  return writeNewFile(directory, name, file);
}
