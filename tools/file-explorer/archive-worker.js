import { zipSync, inflateSync } from '../../vendor/fflate.js';
import { inspectZIP, extractZIP, createZIP } from './archive.js';
self.onmessage = async ({ data }) => {
  try {
    let result;
    if (data.action === 'create') result = { data: await createZIP(data.entries, zipSync) };
    else {
      if (data.file.size > 100 * 1024 * 1024) throw Error('El ZIP supera 100 MB.');
      const bytes = new Uint8Array(await data.file.arrayBuffer());
      result = data.action === 'inspect' ? { entries: inspectZIP(bytes) } : { files: extractZIP(bytes, inflateSync, data.names) };
    }
    const transfer = result.data ? [result.data.buffer] : result.files?.map(file => file.data.buffer) || [];
    self.postMessage({ result }, transfer);
  } catch (error) { self.postMessage({ error: error.message || 'No se pudo procesar el ZIP.' }); }
};
