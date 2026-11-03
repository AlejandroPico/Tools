import { regexRun } from './regex-engine.js';
self.onmessage = event => { try { self.postMessage({ result: regexRun(event.data) }); } catch (error) { self.postMessage({ error: error.message }); } };
