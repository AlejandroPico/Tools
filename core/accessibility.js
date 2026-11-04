import { readLocal,writeLocal } from './ui.js';
import { accessPreferences,editText } from '../tools/accessibility/model.js';
let current = accessPreferences(readLocal('accessibility',{})), target = null;
export function applyAccess(value) { current = accessPreferences(value); const root = document.documentElement; root.style.setProperty('--access-zoom',current.scale/100); for (const key of ['contrast','motion','focus','cursor']) root.dataset[`access${key[0].toUpperCase()+key.slice(1)}`] = String(current[key]); root.dataset.accessFilter = current.filter; const saved = writeLocal('accessibility',current); window.dispatchEvent(new Event('tools:accessibility')); return saved; }
export function getAccess() { return { ...current }; }
export function initializeAccess() { applyAccess(current); document.addEventListener('focusin',event => { if ((event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement && ['text','search','url','email','tel','password'].includes(event.target.type)) && !event.target.disabled && !event.target.readOnly && !event.target.closest('[data-virtual-keyboard]')) { target = new WeakRef(event.target); window.dispatchEvent(new Event('tools:keyboard-target')); } }); }
export function keyboardTarget() { const field = target?.deref(); return field?.isConnected && !field.disabled && !field.readOnly && field.getClientRects().length ? field : null; }
export function typeKey(key,shift) { const field = keyboardTarget(); if (!field) return false; const start = field.selectionStart ?? field.value.length, end = field.selectionEnd ?? start;
  if (key === 'Enter' && !(field instanceof HTMLTextAreaElement)) { field.dispatchEvent(new KeyboardEvent('keydown',{ key:'Enter',code:'Enter',bubbles:true,cancelable:true })); return true; }
  const edited = editText(field.value,start,end,key,{ shift,multiline:field instanceof HTMLTextAreaElement }); if (field.maxLength >= 0 && edited.value.length > field.maxLength) return false;
  const input = new InputEvent('beforeinput',{ bubbles:true,cancelable:true,inputType:key === 'Backspace' ? 'deleteContentBackward' : key === 'Delete' ? 'deleteContentForward' : 'insertText',data:key.length === 1 ? key : null }); if (!field.dispatchEvent(input)) return false;
  const changed = field.value !== edited.value; field.value = edited.value; try { field.setSelectionRange(edited.start,edited.end); } catch { /* Email fields may not expose a caret. */ }
  if (changed) field.dispatchEvent(new InputEvent('input',{ bubbles:true,inputType:input.inputType,data:input.data })); return true;
}
