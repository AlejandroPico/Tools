export function workerJob(url) {
  let current = null;
  function cancel(message = 'Operación cancelada.') {
    if (!current) return;
    const job = current; current = null; clearTimeout(job.timer); job.worker.terminate();
    const error = new Error(message); error.name = 'AbortError'; job.reject(error);
  }
  return {
    get busy() { return !!current; },
    run(payload, { timeout = 30000, progress = () => {} } = {}) {
      if (current) return Promise.reject(Error('Espera a que termine la operación actual.'));
      return new Promise((resolve, reject) => {
        let worker;
        try { worker = new Worker(url, { type: 'module' }); } catch (error) { reject(error); return; }
        const finish = (value, error = false) => {
          if (current?.worker !== worker) return;
          clearTimeout(current.timer); current = null; worker.terminate(); if (error) reject(value); else resolve(value);
        };
        current = { worker, reject, timer: setTimeout(() => cancel('La operación ha superado el tiempo permitido. Prueba con archivos más pequeños.'), timeout) };
        worker.onmessage = event => { if (event.data.progress !== undefined) progress(event.data.progress); else if (event.data.error) finish(Error(event.data.error), true); else finish(event.data.result); };
        worker.onerror = () => finish(Error('No se pudo procesar el archivo.'), true);
        try { worker.postMessage(payload); } catch (error) { finish(error, true); }
      });
    }, cancel,
  };
}
