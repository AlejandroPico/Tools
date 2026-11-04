export function localTranscriber(progress) {
  let worker = null, sequence = 0, pending = null, ready = false;
  function cancel() { worker?.terminate(); worker = null; ready = false; if (pending) { clearTimeout(pending.timer); pending.reject(Error('Motor local detenido. Puedes prepararlo de nuevo desde la caché.')); pending = null; } }
  return { get ready() { return ready; }, cancel,
    request(action, payload = {}) { if (pending) return Promise.reject(Error('Espera a que termine el motor.')); return new Promise((resolve, reject) => {
      const id = ++sequence;
      if (!worker) { worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }); worker.onmessage = ({ data }) => { if (data.id !== pending?.id) return; if ('progress' in data) { progress(data.progress); return; } const job = pending; clearTimeout(job.timer); pending = null; if (data.error) { if (job.action === 'load') { worker.terminate(); worker = null; ready = false; } job.reject(Error(data.error)); } else { if (job.action === 'load') ready = true; job.resolve(data.result); } }; worker.onerror = () => cancel(); }
      pending = { id, action, resolve, reject, timer: setTimeout(cancel, action === 'load' ? 300000 : 1200000) }; worker.postMessage({ action, id, ...payload }, payload.audio ? [payload.audio.buffer] : []);
    }); },
  };
}
