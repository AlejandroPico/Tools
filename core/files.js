export function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// Call directly from the user's click to retain browser activation.
export async function saveFile(blob, filename) {
  // Attach a rejection handler immediately, including while the destination picker is open.
  const prepared = Promise.resolve(blob).then(value => ({ value, ok: true }), error => ({ error, ok: false }));
  const content = async () => { const result = await prepared; if (!result.ok) throw result.error; return result.value; };
  if (!('showSaveFilePicker' in window)) {
    downloadFile(await content(), filename);
    return 'downloaded';
  }
  let handle;
  try { handle = await window.showSaveFilePicker({ suggestedName: filename }); }
  catch (error) {
    if (error.name === 'AbortError') return 'cancelled';
    throw error;
  }
  const data = await content();
  const writable = await handle.createWritable();
  try { await writable.write(data); await writable.close(); }
  catch (error) { await writable.abort().catch(() => {}); throw error; }
  return 'saved';
}

export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${new Intl.NumberFormat('es', { maximumFractionDigits: index ? 1 : 0 }).format(bytes / 1024 ** index)} ${units[index]}`;
}
