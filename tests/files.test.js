import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFileTree, previewKind, sortEntries } from '../tools/file-explorer/model.js';
import { recordingFilename, audioExtension, formatDuration, chooseAudioMime } from '../tools/audio-recorder/recording.js';

test('carpeta importada conserva jerarquía y referencias originales', async () => {
  const file = { name: 'nota.txt', webkitRelativePath: 'Mis archivos/Subcarpeta/nota.txt', size: 6 };
  const root = buildFileTree([file]);
  assert.equal(root.name, 'Mis archivos');
  assert.equal(await root.children.get('Subcarpeta').children.get('nota.txt').getFile(), file);
});
test('nombres especiales no alteran el árbol y orden numérico', () => {
  const root = buildFileTree([{ name: '__proto__' }, { name: '<img onerror=x>.txt' }]);
  assert.equal(root.children.size, 2);
  assert.equal(root.children.get('__proto__').kind, 'file');
  assert.deepEqual(sortEntries([{ name: '10.txt', kind: 'file' }, { name: '2.txt', kind: 'file' }, { name: 'Z', kind: 'directory' }]).map(x => x.name), ['Z', '2.txt', '10.txt']);
});
test('HTML tiene vista de texto y binarios desconocidos no se ejecutan', () => {
  assert.equal(previewKind({ name: 'pagina.html', type: 'text/html' }), 'text');
  assert.equal(previewKind({ name: 'archivo.exe', type: 'application/octet-stream' }), 'unsupported');
  assert.equal(previewKind({ name: 'foto.png', type: '' }), 'image');
});
test('nombre de grabación seguro y extensión coincide con el MIME', () => {
  assert.equal(recordingFilename('mi/audio.webm', 'audio/ogg;codecs=opus'), 'mi-audio.ogg');
  assert.equal(recordingFilename('   ', 'audio/mp4'), 'grabacion.m4a');
  assert.equal(audioExtension('audio/webm;codecs=opus'), 'webm');
});
test('duración y selección de formato compatible', () => {
  assert.equal(formatDuration(125999), '02:05');
  assert.equal(formatDuration(3600000), '60:00');
  assert.equal(chooseAudioMime({ isTypeSupported: value => value === 'audio/mp4' }), 'audio/mp4');
});
