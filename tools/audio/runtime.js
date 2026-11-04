import { validatePCM, AUDIO_FRAMES_LIMIT } from './pcm.js';
import { MediaTake } from '../../core/media.js';
export async function decodeAudio(file, maxDuration = 600) {
  if (file.size > 50 * 1024 * 1024) throw Error('El archivo supera 50 MB.');
  const Context = window.AudioContext || window.webkitAudioContext; if (!Context) throw Error('Este navegador no permite procesar audio.');
  const context = new Context();
  try { const buffer = await context.decodeAudioData(await file.arrayBuffer()); if (buffer.duration > maxDuration || buffer.length * buffer.numberOfChannels > AUDIO_FRAMES_LIMIT) throw Error(`El audio supera ${maxDuration / 60} minutos o el límite de memoria.`); return { channels: Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i).slice()), rate: buffer.sampleRate, duration: buffer.duration }; }
  catch (error) { if (error.message.includes('supera')) throw error; throw Error('No se pudo decodificar el audio. Prueba con WAV, MP3, M4A, Ogg o WebM compatibles con el navegador.'); } finally { await context.close().catch(() => {}); }
}
export async function renderPCM(channels, sourceRate, rate, count = channels.length) {
  const duration = validatePCM(channels, sourceRate), length = Math.round(duration * rate); if (length * count > AUDIO_FRAMES_LIMIT || !length) throw Error('La conversión supera el límite de memoria.');
  const context = new OfflineAudioContext(count, length, rate), buffer = context.createBuffer(channels.length, channels[0].length, sourceRate); channels.forEach((channel, i) => buffer.copyToChannel(channel, i)); const source = context.createBufferSource(); source.buffer = buffer; source.connect(context.destination); source.start(); const output = await context.startRendering(); return Array.from({ length: count }, (_, i) => output.getChannelData(i).slice());
}
export function encodeCompressed(channels, rate, type, context, onTick = () => {}) {
  let take, source, settled = false, rejectJob;
  const cleanup = () => { try { source?.stop(); } catch {} take?.destroy(); context.close().catch(() => {}); };
  const promise = new Promise((resolve, reject) => {
    rejectJob = reject;
    try { if (!MediaRecorder.isTypeSupported(type)) throw Error('Formato no admitido.'); const destination = context.createMediaStreamDestination(), buffer = context.createBuffer(channels.length, channels[0].length, rate); channels.forEach((channel, i) => buffer.copyToChannel(channel, i)); source = context.createBufferSource(); source.buffer = buffer; source.connect(destination);
      // Use the requested native codec; MediaTake supplies timing and bounded buffering.
      take = new MediaTake(destination.stream, { kind: 'audio', mimeType: type, onTick, onResult({ blob }) { if (settled) return; settled = true; cleanup(); resolve(blob); }, onError(message) { if (!settled) { settled = true; cleanup(); reject(Error(message)); } } });
      if (take.recorder.mimeType.split(';')[0] !== type.split(';')[0]) { take.destroy(); take = null; throw Error('El navegador ha elegido un formato diferente. Usa WAV.'); }
      take.start(); source.onended = () => take?.stop(); source.start();
    } catch (error) { settled = true; cleanup(); reject(error); }
  });
  return { promise, cancel() { if (settled) return; settled = true; cleanup(); rejectJob(Error('Conversión detenida.')); } };
}
