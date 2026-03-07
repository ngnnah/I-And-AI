/**
 * High Society — Procedural Sound Effects
 * Web Audio API synthesis — no file downloads, offline-ready.
 * All sounds are short tonal cues designed for board-game feedback.
 */

let ctx = null;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/**
 * Play a single tone with an exponential decay envelope.
 * @param {number} freq    - Frequency in Hz
 * @param {string} type    - OscillatorType: 'sine' | 'triangle' | 'sawtooth' | 'square'
 * @param {number} dur     - Duration in seconds
 * @param {number} gain    - Peak gain (0–1)
 * @param {number} delay   - Start delay in seconds from now
 */
function tone(freq, type, dur, gain = 0.25, delay = 0) {
  const ac  = getCtx();
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const env = ac.createGain();

  osc.connect(env);
  env.connect(ac.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now + delay);

  env.gain.setValueAtTime(0, now + delay);
  env.gain.linearRampToValueAtTime(gain, now + delay + 0.01);
  env.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

  osc.start(now + delay);
  osc.stop(now + delay + dur + 0.05);
}

/**
 * Play a named sound effect.
 * Silently no-ops if AudioContext is unavailable (test/SSR environments).
 *
 * @param {'tick'|'untick'|'bid'|'fold'|'yourTurn'|'winCard'|'disgraceCard'|'gameWin'|'gameLose'} name
 */
export function playSound(name) {
  try {
    switch (name) {
      // Card select / deselect — short soft click
      case 'tick':
        tone(900, 'sine', 0.05, 0.12);
        break;
      case 'untick':
        tone(600, 'sine', 0.05, 0.10);
        break;

      // Bid confirmed — two ascending notes (confident)
      case 'bid':
        tone(440, 'sine', 0.10, 0.20);
        tone(660, 'sine', 0.18, 0.28, 0.09);
        break;

      // Fold/Pass — soft descending (retreat)
      case 'fold':
        tone(330, 'sine', 0.12, 0.18);
        tone(220, 'sine', 0.18, 0.14, 0.10);
        break;

      // Your turn — two bright rising chimes (alert)
      case 'yourTurn':
        tone(523, 'triangle', 0.14, 0.28);       // C5
        tone(784, 'triangle', 0.18, 0.32, 0.14); // G5
        break;

      // Won a luxury/prestige card — three ascending notes (reward)
      case 'winCard':
        tone(523, 'triangle', 0.10, 0.25);
        tone(659, 'triangle', 0.10, 0.30, 0.10);
        tone(784, 'triangle', 0.22, 0.35, 0.20);
        break;

      // Received a disgrace card — descending minor (ominous)
      case 'disgraceCard':
        tone(370, 'sawtooth', 0.10, 0.18);
        tone(277, 'sawtooth', 0.10, 0.16, 0.10);
        tone(196, 'sawtooth', 0.22, 0.14, 0.20);
        break;

      // Game won — short fanfare (four ascending notes)
      case 'gameWin':
        tone(523,  'triangle', 0.12, 0.30);
        tone(659,  'triangle', 0.12, 0.35, 0.13);
        tone(784,  'triangle', 0.12, 0.40, 0.26);
        tone(1047, 'triangle', 0.35, 0.45, 0.39);
        break;

      // Game lost / eliminated — slow descending minor (dejected)
      case 'gameLose':
        tone(392, 'sine', 0.18, 0.20);
        tone(330, 'sine', 0.18, 0.18, 0.18);
        tone(277, 'sine', 0.18, 0.16, 0.36);
        tone(220, 'sine', 0.35, 0.14, 0.54);
        break;

      default:
        break;
    }
  } catch (_) {
    // AudioContext unavailable (test environments, old browsers) — silently skip
  }
}
