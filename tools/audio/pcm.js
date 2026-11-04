export const AUDIO_FRAMES_LIMIT = 48_000_000;
export function validatePCM(channels, rate) { if (!Array.isArray(channels) || !channels.length || channels.length > 8 || !Number.isInteger(rate) || rate < 8000 || rate > 192000 || !channels[0]?.length || channels.some(channel => !(channel instanceof Float32Array) || channel.length !== channels[0].length) || channels.length * channels[0].length > AUDIO_FRAMES_LIMIT) throw Error('Audio no válido o superior al límite de memoria.'); return channels[0].length / rate; }
export function editPCM(channels, rate, { start = 0, end, gain = 1, normalize = false, fade = 0 } = {}) {
  const duration = validatePCM(channels, rate); end ??= duration;
  if (![start,end,gain,fade].every(Number.isFinite) || start < 0 || end > duration + .000001 || start >= end || gain < 0 || gain > 4 || fade < 0 || fade > 5) throw Error('Selección, volumen o fundido no válidos.');
  const first = Math.round(start * rate), last = Math.min(channels[0].length, Math.round(end * rate)); if (last <= first) throw Error('La selección no contiene muestras.');
  const output = channels.map(channel => channel.slice(first, last)); let peak = 0;
  if (normalize) for (const channel of output) for (const sample of channel) if (Number.isFinite(sample)) peak = Math.max(peak, Math.abs(sample));
  const multiplier = gain * (normalize && peak ? .98 / peak : 1), fadeFrames = Math.min(Math.round(fade * rate), Math.floor(output[0].length / 2));
  for (const channel of output) for (let i = 0; i < channel.length; i++) { const envelope = fadeFrames ? Math.min(1, i / fadeFrames, (channel.length - 1 - i) / fadeFrames) : 1; channel[i] = Math.max(-1, Math.min(1, (Number.isFinite(channel[i]) ? channel[i] : 0) * multiplier * envelope)); }
  return output;
}
export function joinPCM(items, rate) { if (!items.length) throw Error('Añade al menos un audio.'); const count = items[0].length; let length = 0; for (const channels of items) { validatePCM(channels, rate); if (channels.length !== count) throw Error('Los audios deben tener los mismos canales.'); length += channels[0].length; } if (length * count > AUDIO_FRAMES_LIMIT) throw Error('El audio unido supera el límite de memoria.'); const result = Array.from({ length: count }, () => new Float32Array(length)); let offset = 0; for (const channels of items) { channels.forEach((channel, i) => result[i].set(channel, offset)); offset += channels[0].length; } return result; }
export function encodeWAV(channels, rate) {
  validatePCM(channels, rate); const frames = channels[0].length, size = frames * channels.length * 2, buffer = new ArrayBuffer(44 + size), view = new DataView(buffer);
  const word = (offset, text) => [...text].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  word(0,'RIFF'); view.setUint32(4,36 + size,true); word(8,'WAVE'); word(12,'fmt '); view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,channels.length,true); view.setUint32(24,rate,true); view.setUint32(28,rate * channels.length * 2,true); view.setUint16(32,channels.length * 2,true); view.setUint16(34,16,true); word(36,'data'); view.setUint32(40,size,true);
  let offset = 44; for (let i = 0; i < frames; i++) for (const channel of channels) { const sample = Math.max(-1, Math.min(1, Number.isFinite(channel[i]) ? channel[i] : 0)); view.setInt16(offset, Math.round(sample * (sample < 0 ? 32768 : 32767)), true); offset += 2; }
  return new Uint8Array(buffer);
}
export function tonePCM(frequency, duration, type = 'sine', gain = .2, rate = 48000) {
  if (![frequency,duration,gain,rate].every(Number.isFinite) || frequency < 20 || frequency > 20000 || frequency >= rate / 2 || duration < .1 || duration > 60 || gain < 0 || gain > .8 || !['sine','square','triangle','sawtooth'].includes(type)) throw Error('Tono no válido: 20–20.000 Hz, 0,1–60 segundos y volumen hasta 80%.');
  const data = new Float32Array(Math.round(duration * rate));
  for (let i = 0; i < data.length; i++) { const phase = i * frequency / rate % 1, wave = type === 'sine' ? Math.sin(phase * Math.PI * 2) : type === 'square' ? phase < .5 ? 1 : -1 : type === 'triangle' ? 1 - 4 * Math.abs(phase - .5) : 2 * phase - 1; const envelope = Math.min(1, i / (rate * .005), (data.length - 1 - i) / (rate * .005)); data[i] = wave * gain * Math.max(0, envelope); }
  return [data];
}
