import { icon, notify } from '../../core/ui.js';
import { saveFile, downloadFile, formatBytes } from '../../core/files.js';
import { formatDuration, chooseAudioMime, recordingFilename } from './recording.js';

export function mountRecorder(root) {
  root.innerHTML = `<div class="recorder-shell"><div class="window-subheading"><strong>Una idea empieza aquí.</strong><span class="small-label">AUDIO</span></div><p class="recorder-intro">Graba, escucha y llévatelo contigo.</p><div class="recorder-visual"><span class="recorder-state"><span></span><span class="recorder-state-text">Listo para grabar</span></span><canvas width="700" height="150" aria-hidden="true"></canvas><output class="recorder-time" aria-label="Duración de la grabación">00:00</output><span class="recorder-caption">Tu micrófono. Tu grabación.</span></div><div class="recorder-controls"><button class="recorder-pause" aria-label="Pausar grabación" title="Pausar" disabled>Ⅱ</button><button class="recorder-record" aria-label="Iniciar grabación" title="Iniciar grabación" data-initial-focus><span></span></button><button class="recorder-stop" aria-label="Detener grabación" title="Detener" disabled><span></span></button></div><p class="recorder-status status-text" role="status">El micrófono solo se activa al pulsar grabar.</p><section class="recording-result" hidden aria-label="Grabación terminada"><div class="recording-result-heading"><strong>Tu grabación está lista</strong><span class="recording-size"></span></div><audio controls preload="metadata" aria-label="Escuchar grabación"></audio><label class="recording-name-label">Nombre del archivo<input class="recording-name" maxlength="120" aria-label="Nombre del archivo de audio"></label><div class="recording-downloads"><button class="primary-button recorder-save">${icon('download')} Guardar como…</button><button class="secondary-button recorder-download">Descargar</button></div></section><div class="recorder-privacy">${icon('shield')} El audio se queda aquí hasta que lo descargues.<br>No se envía a ningún servidor.</div></div>`;
  const $ = selector => root.querySelector(selector);
  const shell = $('.recorder-shell');
  const recordButton = $('.recorder-record');
  const pauseButton = $('.recorder-pause');
  const stopButton = $('.recorder-stop');
  const status = $('.recorder-status');
  const player = $('audio');
  let stream = null, recorder = null, chunks = [], blob = null, objectUrl = null;
  let state = 'idle', disposed = false, exported = true, byteCount = 0, elapsed = 0, startedAt = 0;
  let audioContext = null, analyser = null, source = null, animation = 0, limitMessage = '';
  let saving = false;
  const supported = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
  if (!supported) {
    recordButton.disabled = true;
    status.textContent = window.isSecureContext ? 'Este navegador no admite la grabación de audio. Prueba con una versión reciente de Chrome, Edge, Firefox o Safari.' : 'Para usar el micrófono, abre Tools mediante HTTPS o localhost.';
    status.classList.add('error-text');
  }
  if (!('showSaveFilePicker' in window)) $('.recorder-save').hidden = true;

  function duration() { return elapsed + (state === 'recording' ? performance.now() - startedAt : 0); }
  function updateState(next) {
    state = next;
    shell.dataset.state = next;
    const active = ['recording', 'paused'].includes(next);
    recordButton.disabled = !supported || saving || ['requesting', 'recording', 'paused', 'stopping'].includes(next);
    pauseButton.disabled = !active;
    stopButton.disabled = !active;
    pauseButton.textContent = next === 'paused' ? '▷' : 'Ⅱ';
    pauseButton.setAttribute('aria-label', next === 'paused' ? 'Reanudar grabación' : 'Pausar grabación');
    pauseButton.title = next === 'paused' ? 'Reanudar' : 'Pausar';
    $('.recorder-state-text').textContent = ({ idle: 'Listo para grabar', requesting: 'Esperando el micrófono', recording: 'Grabando', paused: 'En pausa', stopping: 'Preparando audio', ready: 'Grabación terminada', error: 'No se pudo grabar' })[next];
    document.querySelector('[data-dock="audio-recorder"]')?.classList.toggle('is-recording', active);
  }
  function releaseInput() {
    stream?.getTracks().forEach(track => track.stop()); stream = null;
    cancelAnimationFrame(animation);
    source?.disconnect(); source = null;
    if (audioContext) { audioContext.close().catch(() => {}); audioContext = null; }
    analyser = null;
  }
  const canvas = $('canvas');
  const context = canvas.getContext('2d');
  function draw() {
    if (!context || disposed) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const data = new Uint8Array(analyser?.frequencyBinCount || 256);
    if (analyser && state === 'recording') analyser.getByteTimeDomainData(data);
    else data.fill(128);
    context.lineWidth = 2.5;
    context.strokeStyle = state === 'recording' ? '#efaaa0' : '#6a9694';
    context.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = i * canvas.width / (data.length - 1);
      const y = (data[i] - 128) * .7 + canvas.height / 2;
      if (i === 0) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.stroke();
    if (['recording', 'paused'].includes(state)) animation = requestAnimationFrame(draw);
  }
  draw();
  function finish(message = '') {
    if (!recorder || !['recording', 'paused'].includes(state)) return;
    elapsed = duration();
    limitMessage = message;
    updateState('stopping');
    recorder.stop();
    releaseInput();
  }
  const timer = setInterval(() => {
    if (disposed) return;
    $('.recorder-time').textContent = formatDuration(duration());
    if (duration() >= 60 * 60 * 1000 && state === 'recording') finish('Se ha alcanzado el límite de una hora. Guarda el audio antes de continuar.');
  }, 250);

  recordButton.addEventListener('click', async () => {
    if (blob && !exported && !window.confirm('La grabación anterior todavía no se ha descargado. ¿Descartarla y empezar otra?')) return;
    status.classList.remove('error-text');
    status.textContent = 'Permite el acceso al micrófono en el navegador.';
    updateState('requesting');
    try {
      const acquired = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (disposed) { acquired.getTracks().forEach(track => track.stop()); return; }
      stream = acquired;
      const mimeType = chooseAudioMime(window.MediaRecorder);
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunks = []; byteCount = 0; elapsed = 0; limitMessage = '';
      if (objectUrl) { player.pause(); player.removeAttribute('src'); player.load(); URL.revokeObjectURL(objectUrl); objectUrl = null; }
      blob = null; exported = false;
      $('.recording-result').hidden = true;
      recorder.addEventListener('dataavailable', event => {
        if (disposed || !event.data.size) return;
        chunks.push(event.data); byteCount += event.data.size;
        if (byteCount >= 100 * 1024 * 1024) finish('La grabación ha alcanzado 100 MB. Guarda el archivo para continuar.');
      });
      recorder.addEventListener('stop', () => {
        if (disposed) return;
        releaseInput();
        if (!chunks.length) {
          updateState('error'); status.classList.add('error-text'); status.textContent = 'No se ha recibido audio. Comprueba el micrófono y vuelve a intentarlo.'; return;
        }
        blob = new Blob(chunks, { type: recorder.mimeType || chunks[0].type || 'application/octet-stream' });
        chunks = [];
        objectUrl = URL.createObjectURL(blob);
        player.src = objectUrl;
        const date = new Date();
        $('.recording-name').value = `grabacion-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`;
        $('.recording-size').textContent = `${formatBytes(blob.size)} · ${blob.type.split(';')[0].replace('audio/', '').toUpperCase()}`;
        $('.recording-result').hidden = false;
        updateState('ready'); draw();
        $('.recorder-time').textContent = formatDuration(elapsed);
        status.textContent = limitMessage || 'Escucha el resultado y guarda el archivo en tu equipo.';
      });
      recorder.addEventListener('error', () => {
        if (recorder.state !== 'inactive') finish('La grabación se ha interrumpido. Guarda el audio recuperado.');
        releaseInput();
        status.textContent = 'Se produjo un error de grabación. Si hay audio recuperable, aparecerá debajo.';
        status.classList.add('error-text');
      });
      stream.getAudioTracks().forEach(track => track.addEventListener('ended', () => finish('El micrófono se ha desconectado. Puedes guardar el audio recibido.')));
      recorder.start(1000);
      startedAt = performance.now(); updateState('recording');
      status.textContent = 'Grabando desde tu micrófono. Puedes minimizar esta ventana.';
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioContext = new AudioContext();
          source = audioContext.createMediaStreamSource(stream);
          analyser = audioContext.createAnalyser(); analyser.fftSize = 512;
          source.connect(analyser); audioContext.resume().catch(() => {});
        }
      } catch { /* The waveform is optional; recording does not depend on it. */ }
      draw();
    } catch (error) {
      releaseInput();
      if (disposed) return;
      updateState(blob ? 'ready' : 'error');
      status.textContent = error.name === 'NotAllowedError' ? 'Acceso al micrófono denegado. Puedes permitirlo desde los ajustes del sitio y volver a intentarlo.' : error.name === 'NotFoundError' ? 'No se ha encontrado ningún micrófono conectado.' : 'No se pudo iniciar la grabación. Comprueba que el micrófono esté disponible.';
      status.classList.add('error-text');
    }
  });
  pauseButton.addEventListener('click', () => {
    if (state === 'recording') { elapsed = duration(); recorder.pause(); updateState('paused'); status.textContent = 'Grabación en pausa. Pulsa reanudar para continuar.'; }
    else if (state === 'paused') { recorder.resume(); startedAt = performance.now(); updateState('recording'); status.textContent = 'Grabando desde tu micrófono.'; }
  });
  stopButton.addEventListener('click', () => finish());
  $('.recorder-download').addEventListener('click', () => {
    if (!blob) return;
    downloadFile(blob, recordingFilename($('.recording-name').value, blob.type));
    exported = true; notify('Descarga de audio iniciada.');
  });
  $('.recorder-save').addEventListener('click', async () => {
    if (!blob || saving) return;
    saving = true; $('.recorder-save').disabled = true; recordButton.disabled = true;
    try {
      const result = await saveFile(blob, recordingFilename($('.recording-name').value, blob.type));
      if (result !== 'cancelled') { exported = true; notify(result === 'saved' ? 'Grabación guardada en tu equipo.' : 'Descarga iniciada.'); }
    } catch { notify('No se pudo guardar. Puedes probar con el botón Descargar.'); }
    finally { saving = false; $('.recorder-save').disabled = false; if (!disposed) updateState(state); }
  });
  return {
    preventClose: () => ['requesting', 'recording', 'paused', 'stopping'].includes(state) || (!!blob && !exported) || saving,
    destroy: () => {
      disposed = true; clearInterval(timer);
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      releaseInput();
      player.pause(); player.removeAttribute('src'); player.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      chunks = []; blob = null;
      document.querySelector('[data-dock="audio-recorder"]')?.classList.remove('is-recording');
    },
  };
}
