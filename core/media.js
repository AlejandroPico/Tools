export function stopStream(stream) { stream?.getTracks().forEach(track => track.stop()); }
export function recordingMime(kind, Recorder = globalThis.MediaRecorder) {
  const types = kind === 'video' ? ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'] : ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'];
  return types.find(type => Recorder?.isTypeSupported(type)) || '';
}
export function mediaExtension(type) { return type.includes('mp4') ? type.startsWith('video') ? 'mp4' : 'm4a' : type.includes('ogg') ? 'ogg' : 'webm'; }
export function mediaError(error) { return ({ NotAllowedError: 'El permiso no se ha concedido o la selección se ha cancelado.', NotFoundError: 'No se encuentra el dispositivo solicitado.', NotReadableError: 'El dispositivo está ocupado o no se puede leer.', AbortError: 'La operación se ha cancelado.' })[error.name] || error.message || 'No se pudo iniciar la captura.'; }
export class MediaTake {
  constructor(stream, { kind = 'audio', mimeType: preferredMime = '', onState = () => {}, onTick = () => {}, onResult = () => {}, onError = () => {}, limitSeconds = 900, maxBytes = 150 * 1024 * 1024 } = {}) {
    this.stream = stream; this.state = 'idle'; this.elapsed = 0; this.started = 0; this.disposed = false; this.chunks = []; this.bytes = 0;
    this.handlers = { onState, onTick, onResult, onError }; this.limitSeconds = limitSeconds; this.maxBytes = maxBytes;
    const mimeType = preferredMime || recordingMime(kind); this.recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    this.recorder.ondataavailable = event => { if (this.disposed || !event.data.size) return; this.chunks.push(event.data); this.bytes += event.data.size; if (this.bytes >= maxBytes) this.stop('Límite de tamaño alcanzado.'); };
    this.recorder.onstop = () => { stopStream(stream); clearInterval(this.timer); if (this.disposed) return; this.setState('ready'); const blob = new Blob(this.chunks, { type: this.recorder.mimeType || mimeType }); this.chunks = []; if (blob.size) onResult({ blob, duration: this.elapsed, message: this.message || '' }); else onError('No se han recibido datos de grabación.'); };
    this.recorder.onerror = () => { onError('La grabación se ha interrumpido. Se intentará conservar el contenido recibido.'); this.stop(); };
    const tracks = kind === 'video' ? stream.getVideoTracks() : stream.getAudioTracks(); tracks.forEach(track => track.addEventListener('ended', () => this.stop('La fuente ha dejado de compartir.'), { once: true }));
  }
  setState(state) { this.state = state; if (!this.disposed) this.handlers.onState(state); }
  duration() { return this.elapsed + (this.state === 'recording' ? (performance.now() - this.started) / 1000 : 0); }
  start() { this.started = performance.now(); this.recorder.start(500); this.setState('recording'); this.timer = setInterval(() => { this.handlers.onTick(this.duration()); if (this.duration() >= this.limitSeconds) this.stop('Límite de duración alcanzado.'); }, 250); }
  pause() { if (this.state !== 'recording') return; this.elapsed = this.duration(); this.recorder.pause(); this.setState('paused'); }
  resume() { if (this.state !== 'paused') return; this.recorder.resume(); this.started = performance.now(); this.setState('recording'); }
  stop(message = '') { if (!['recording', 'paused'].includes(this.state)) return; this.elapsed = this.duration(); this.message = message; this.setState('finishing'); clearInterval(this.timer); this.recorder.stop(); stopStream(this.stream); }
  destroy() { this.disposed = true; clearInterval(this.timer); if (this.recorder.state !== 'inactive') this.recorder.stop(); stopStream(this.stream); this.chunks = []; }
  get busy() { return ['recording', 'paused', 'finishing'].includes(this.state); }
}
