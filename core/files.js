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
  if (!('showSaveFilePicker' in window)) {
    downloadFile(blob, filename);
    return 'downloaded';
  }
  let handle;
  try { handle = await window.showSaveFilePicker({ suggestedName: filename }); }
  catch (error) {
    if (error.name === 'AbortError') return 'cancelled';
    throw error;
  }
  const writable = await handle.createWritable();
  try { await writable.write(blob); await writable.close(); }
  catch (error) { await writable.abort().catch(() => {}); throw error; }
  return 'saved';
}

export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${new Intl.NumberFormat('es', { maximumFractionDigits: index ? 1 : 0 }).format(bytes / 1024 ** index)} ${units[index]}`;
}
