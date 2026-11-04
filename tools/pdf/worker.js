import * as lib from '../../vendor/pdf-lib.js';
import { zipSync } from '../../vendor/fflate.js';
import { pdfInfo, assemblePDF, splitPDF } from './engine.js';
self.onmessage = async ({ data }) => {
  try {
    const progress = value => self.postMessage({ progress: value });
    const result = data.action === 'info' ? await pdfInfo(data.file, lib) : { bytes: await (data.action === 'split' ? splitPDF(data.sources, data.pages, data.options, lib, zipSync, progress) : assemblePDF(data.sources, data.pages, data.options, lib, progress)) };
    self.postMessage({ result }, result.bytes ? [result.bytes.buffer] : []);
  } catch (error) { self.postMessage({ error: error.message || 'No se pudo procesar el PDF.' }); }
};
