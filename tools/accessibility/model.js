export const defaultAccess = { scale:100,contrast:false,filter:'none',motion:false,focus:true,cursor:false };
export function accessPreferences(value) { return { scale:[100,115,130,150].includes(value?.scale) ? value.scale : 100,contrast:value?.contrast === true,filter:['none','grayscale','sepia','invert'].includes(value?.filter) ? value.filter : 'none',motion:value?.motion === true,focus:value?.focus !== false,cursor:value?.cursor === true }; }
export function editText(value,start,end,key,{ shift = false,multiline = true } = {}) {
  start = Math.max(0,Math.min(value.length,start)); end = Math.max(start,Math.min(value.length,end));
  const boundaries = [0,...Array.from(new Intl.Segmenter('es',{ granularity:'grapheme' }).segment(value),segment => segment.index + segment.segment.length)];
  const before = boundaries.findLast(index => index < start) ?? 0, after = boundaries.find(index => index > end) ?? value.length;
  if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Home' || key === 'End') { const position = key === 'Home' ? start === 0 ? 0 : value.lastIndexOf('\n',start-1) + 1 : key === 'End' ? (value.indexOf('\n',end) < 0 ? value.length : value.indexOf('\n',end)) : key === 'ArrowLeft' ? start === end ? before : start : start === end ? after : end; return { value,start:position,end:position }; }
  let insert = key === 'Space' ? ' ' : key === 'Enter' ? multiline ? '\n' : '' : key === 'Tab' ? '\t' : key;
  if (key === 'Backspace' || key === 'Delete') { insert = ''; if (start === end) { if (key === 'Backspace') start = before; else end = after; } }
  else if (shift && key.length === 1) insert = insert.toLocaleUpperCase('es');
  return { value:value.slice(0,start)+insert+value.slice(end),start:start+insert.length,end:start+insert.length };
}
