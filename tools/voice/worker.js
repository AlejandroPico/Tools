import { pipeline, env } from '../../vendor/transformers.js';
import { SPEECH_MODEL, SPEECH_REVISION, SPEECH_CACHE } from './model-config.js';
let transcriber = null, busy = false;
env.allowLocalModels = false; env.allowRemoteModels = false; env.cacheKey = SPEECH_CACHE;
env.backends.onnx.wasm.wasmPaths = new URL('../../vendor/onnx/', import.meta.url).href;
env.backends.onnx.wasm.numThreads = 1; env.backends.onnx.wasm.proxy = false;
self.onmessage = async ({ data }) => {
  if (busy) { self.postMessage({ id: data.id, error: 'El motor está ocupado.' }); return; } busy = true;
  try {
    if (data.action === 'load') { if (globalThis.caches) { env.customCache = await caches.open(SPEECH_CACHE); env.useCustomCache = true; env.useBrowserCache = false; } env.allowRemoteModels = true;
      transcriber = await pipeline('automatic-speech-recognition', SPEECH_MODEL, { revision: SPEECH_REVISION, dtype: 'q8', device: 'wasm', progress_callback: progress => self.postMessage({ id: data.id, progress: typeof progress.progress === 'number' ? progress.progress : null }) }); env.allowRemoteModels = false; self.postMessage({ id: data.id, result: { ready: true } });
    } else {
      if (!transcriber) throw Error('Prepara el modelo local antes de transcribir.');
      if (!(data.audio instanceof Float32Array) || !data.audio.length || data.audio.length > 16000 * 300) throw Error('El audio debe durar entre una muestra y cinco minutos.');
      let power = 0; for (let i = 0; i < data.audio.length; i += 10) power += data.audio[i] * data.audio[i]; if (power / Math.ceil(data.audio.length / 10) < 1e-10) throw Error('El audio está en silencio.');
      const result = await transcriber(data.audio, { language: data.language || undefined, task: 'transcribe', return_timestamps: true, chunk_length_s: 30, stride_length_s: 5 }); self.postMessage({ id: data.id, result });
    }
  } catch (error) { env.allowRemoteModels = false; self.postMessage({ id: data.id, error: error.message || 'No se pudo procesar la transcripción.' }); } finally { busy = false; }
};
