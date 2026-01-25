// Audio effects using Web Audio API

let audioContext = null;

export function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
}

// Auto-init on first interaction
if (typeof document !== 'undefined') {
  document.addEventListener('touchstart', initAudio, { once: true });
  document.addEventListener('click', initAudio, { once: true });
}

export function playSound(freq, duration, type = 'sine') {
  if (!audioContext) initAudio();
  if (!audioContext) return;
  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    osc.start();
    osc.stop(audioContext.currentTime + duration);
  } catch (e) {
    console.warn('Audio error:', e);
  }
}

export function playCorrect() {
  playSound(523, 0.1);
  setTimeout(() => playSound(659, 0.1), 100);
  setTimeout(() => playSound(784, 0.15), 200);
}

export function playWrong() {
  playSound(200, 0.3, 'sawtooth');
}

export function playVictory() {
  playSound(440, 0.1);
  setTimeout(() => playSound(554, 0.1), 100);
  setTimeout(() => playSound(659, 0.1), 200);
  setTimeout(() => playSound(880, 0.3), 300);
}

export function playClick() {
  playSound(400, 0.05);
}
