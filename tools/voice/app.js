import { workbench } from '../../core/workbench.js';
import { mountReader } from '../../core/speech.js';
import { mountTranscription } from './transcription.js';
import { mountDictation, mountSubtitles, mountPrompter } from './panels.js';
export function mountVoice(root) {
  const shared = { pending: null, importCues: null, sendCues(cues) { if (shared.importCues) shared.importCues(structuredClone(cues)); else shared.pending = structuredClone(cues); desk.activate('subtitles'); } };
  const mounts = { transcription: (panel,api) => mountTranscription(panel,api,shared), dictation: mountDictation, reader: mountReader, subtitles: (panel,api) => mountSubtitles(panel,api,shared), prompter: mountPrompter };
  const desk = workbench(root, { transcription: 'Transcripción', dictation: 'Dictado local', reader: 'Lectura', subtitles: 'Subtítulos', prompter: 'Teleprónter' }, (mode,panel,api) => mounts[mode](panel,api), { label: 'Voz y lectura', help: 'Texto local. El micrófono se activa solo cuando lo solicitas.' }); return desk;
}
