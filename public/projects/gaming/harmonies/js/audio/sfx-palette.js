/**
 * Harmonies — SFX palette (PURE DATA + PURE FUNCTIONS, no WebAudio)
 *
 * This module decides *what* a sound is; `sound-engine.js` decides how to make it.
 * Nothing here touches AudioContext, the DOM, or the clock — so it is fully unit-testable.
 *
 * ── The musical rule ───────────────────────────────────────────────────────────
 * Every pitch is drawn from the D major pentatonic ladder below. A pentatonic scale
 * has no semitone clashes, so no two placements can sound dissonant together — which
 * is what makes a ~90-move game listenable instead of grating. Do not add notes that
 * are off this ladder; `tests/sound.test.js` enforces it.
 *
 * Placement pitch = LADDER[ base(color) + 3 * (height - 1) ], clamped to the ladder.
 * Three ladder degrees is roughly a fifth, so stacking reads as an open, rising step.
 */

/** D major pentatonic (D E F# A B), D3 → D6. Index = scale degree. */
export const LADDER = [
  146.83, // 0  D3
  164.81, // 1  E3
  185.00, // 2  F#3
  220.00, // 3  A3
  246.94, // 4  B3
  293.66, // 5  D4
  329.63, // 6  E4
  369.99, // 7  F#4
  440.00, // 8  A4
  493.88, // 9  B4
  587.33, // 10 D5
  659.26, // 11 E5
  739.99, // 12 F#5
  880.00, // 13 A5
  987.77, // 14 B5
  1174.66, // 15 D6
];

/** Ladder degrees added per level of stack height. */
export const DEGREES_PER_LEVEL = 3;

/**
 * One voice per token colour. Colours (not derived terrains) are what the player
 * actually places, and they line up 1:1 with the TOKEN_EMOJI set in index.html:
 *   blue 🌊 water · yellow 🌼 field · brown 🪵 trunk
 *   green 🍃 leaves · red 🧱 brick · gray ⛰️ mountain
 *
 * `base` is a ladder index; `build(freq)` returns the engine part list for that pitch.
 * Volumes are deliberately tiny — these fire ~90 times a game and must never nag.
 */
export const VOICES = {
  // ⛰️ mountain — deep sine with a slow attack, the heaviest thing on the board.
  //
  // PHONE-SPEAKER CRITICAL. A bare D3 (147 Hz) sine has no harmonics at all, so a phone
  // speaker reproduced ~3% of its energy: this was the loudest voice on a laptop and
  // effectively inaudible on a phone, inverting the whole mix. The partials below fix
  // that, and they're free musically — 3x of D3 is A4 and 4x is D5, both already ladder
  // notes, so the harmonic series lands in-scale. The ear infers the missing fundamental
  // from them, so it still reads as "deep" on a small speaker.
  gray: {
    base: 0,
    label: "mountain",
    build: (freq) => [
      { type: "tone", wave: "sine", freq, dur: 0.34, vol: 0.022, attack: 0.02 },
      { type: "tone", wave: "sine", freq: freq * 2, dur: 0.24, vol: 0.015, attack: 0.015 },
      { type: "tone", wave: "sine", freq: freq * 3, dur: 0.2, vol: 0.018, attack: 0.012 },
      { type: "tone", wave: "sine", freq: freq * 4, dur: 0.15, vol: 0.014, attack: 0.01 },
      { type: "tone", wave: "sine", freq: freq * 6, dur: 0.09, vol: 0.007, attack: 0.008 },
    ],
  },

  // 🧱 brick — dry muted clack: a low noise transient with just a hint of pitch.
  // Deliberately the shortest voice, which costs it energy against the others; the
  // amplitudes are raised to compensate so it stays as *present* as its siblings
  // without becoming a longer, wetter sound. Q kept low so the band passes real energy.
  red: {
    base: 2,
    label: "brick",
    build: (freq) => [
      { type: "noise", color: "brown", filter: "bandpass", cutoff: 620, q: 0.7, dur: 0.06, vol: 0.048 },
      { type: "tone", wave: "triangle", freq, dur: 0.09, vol: 0.035 },
      // Phone-audible partial (3x F#3 = ~555Hz). Triangle already has odd harmonics,
      // but not enough of them above 500Hz to carry on a phone speaker.
      { type: "tone", wave: "triangle", freq: freq * 3, dur: 0.055, vol: 0.019 },
    ],
  },

  // 🪵 trunk — hollow wood knock: fast-decaying triangle over a click.
  brown: {
    base: 3,
    label: "trunk",
    build: (freq) => [
      { type: "noise", color: "white", filter: "bandpass", cutoff: 1800, q: 1.2, dur: 0.014, vol: 0.03 },
      { type: "tone", wave: "triangle", freq, dur: 0.11, vol: 0.026 },
      // Slightly inharmonic upper partials are what make wood read as wood; here they
      // double as the only part of this voice a phone speaker can actually reproduce.
      { type: "tone", wave: "sine", freq: freq * 3.01, dur: 0.06, vol: 0.022 },
      { type: "tone", wave: "sine", freq: freq * 5.04, dur: 0.035, vol: 0.011 },
    ],
  },

  // 🌼 field — light bell: fundamental plus a fifth, the sunniest voice.
  yellow: {
    base: 5,
    label: "field",
    build: (freq) => [
      { type: "tone", wave: "sine", freq, dur: 0.3, vol: 0.026, attack: 0.006 },
      { type: "tone", wave: "sine", freq: freq * 1.5, dur: 0.22, vol: 0.016, attack: 0.006 },
      { type: "tone", wave: "sine", freq: freq * 2, dur: 0.16, vol: 0.012, attack: 0.006 },
    ],
  },

  // 🌊 water — droplet: a fast upward pitch blip, the classic "plink".
  blue: {
    base: 8,
    label: "water",
    build: (freq) => [
      { type: "tone", wave: "sine", freq: freq * 0.72, freqTo: freq * 1.06, dur: 0.16, vol: 0.03 },
      { type: "tone", wave: "sine", freq: freq * 1.44, freqTo: freq * 2.12, dur: 0.1, vol: 0.014 },
      { type: "noise", color: "white", filter: "highpass", cutoff: 3200, q: 0.7, dur: 0.025, vol: 0.018 },
    ],
  },

  // 🍃 leaves — airy rustle. Noise, so the ladder note steers the bandpass centre
  // (scaled up by bandMul into the range where foliage actually lives) rather than a tone.
  //
  // Keep Q LOW and the source WHITE. A narrow bandpass (Q>1) over pink noise passes
  // almost no energy up here, which made this voice ~8x quieter than its siblings and
  // effectively inaudible. `tests/ui.spec.js` measures cross-voice balance to catch
  // that class of regression — verify there, not by eye.
  green: {
    base: 10,
    bandMul: 4,
    label: "leaves",
    build: (freq, { bandMul = 4 } = {}) => [
      {
        type: "noise",
        color: "white",
        filter: "bandpass",
        cutoff: freq * bandMul,
        q: 0.55,
        dur: 0.22,
        vol: 0.045,
        attack: 0.03,
      },
    ],
  },
};

/** Used when a colour is unknown — silent-ish, never throws, never sours the scale. */
const FALLBACK_VOICE = {
  base: 5,
  label: "unknown",
  build: (freq) => [{ type: "tone", wave: "sine", freq, dur: 0.14, vol: 0.02 }],
};

/**
 * Pitch for a placement, as a ladder index (clamped).
 * @param {number} base ladder index for the colour
 * @param {number} height resulting stack height (1-based)
 */
export function ladderIndexFor(base, height) {
  const level = Math.max(1, Math.floor(height || 1));
  const idx = base + DEGREES_PER_LEVEL * (level - 1);
  return Math.min(LADDER.length - 1, Math.max(0, idx));
}

/**
 * The placement cue: which voice, at which pitch.
 * Returns a plain list of engine parts — makes no sound on its own.
 *
 * @param {string} color token colour ('blue'|'yellow'|'brown'|'green'|'red'|'gray')
 * @param {number} height stack height after placing (1-based)
 * @returns {{ parts: object[], freq: number, voice: string }}
 */
export function cueForPlacement(color, height = 1) {
  const voice = VOICES[color] || FALLBACK_VOICE;
  const freq = LADDER[ladderIndexFor(voice.base, height)];
  return { parts: voice.build(freq, voice), freq, voice: voice.label };
}

/**
 * Fixed cues for everything that isn't a token placement.
 * `at` offsets a part in seconds so a cue can be a short phrase.
 * Ordering note: the error cue is deliberately quieter than the success cues —
 * mistakes should inform, not punish.
 */
export const EVENT_CUES = {
  // Picking a token up out of the pouch — barely there on purpose.
  tokenSelect: [
    { type: "noise", color: "white", filter: "highpass", cutoff: 2600, q: 0.7, dur: 0.008, vol: 0.012 },
  ],

  // An animal cube landing on the board: a soft, high tick.
  cubePlace: [
    { type: "tone", wave: "triangle", freq: LADDER[13], dur: 0.05, vol: 0.022 },
    { type: "tone", wave: "sine", freq: LADDER[15], dur: 0.03, vol: 0.01 },
  ],

  // Animal card completed — a warm rising resolve (A4 → D5 → F#5), the reward moment.
  cardComplete: [
    { type: "tone", wave: "sine", freq: LADDER[8], dur: 0.24, vol: 0.034, attack: 0.008 },
    { type: "tone", wave: "sine", freq: LADDER[10], dur: 0.3, at: 0.13, vol: 0.03, attack: 0.008 },
    { type: "tone", wave: "sine", freq: LADDER[12], dur: 0.36, at: 0.26, vol: 0.02, attack: 0.01 },
  ],

  // Invalid move: a soft low muted thud. Not a buzzer. Quieter than any success cue.
  error: [
    // The deep parts are kept deliberately small. They give the thud its weight on good
    // speakers, but a phone reproduces almost none of them — so spending amplitude here
    // buys nothing on the primary platform and only makes the cue louder than the reward
    // cues, which it must never be. Phone audibility comes from the mid band below.
    { type: "noise", color: "brown", filter: "lowpass", cutoff: 300, q: 0.6, dur: 0.16, vol: 0.012 },
    { type: "tone", wave: "sine", freq: 110, dur: 0.18, vol: 0.008 },
    // Soft damped mid thud — NOT a beep. Pink, not brown: brown noise is -6dB/oct and
    // carries almost nothing this high, which is why an earlier brown-noise attempt at
    // the same job left the cue inaudible on a phone.
    { type: "noise", color: "pink", filter: "bandpass", cutoff: 700, q: 0.8, dur: 0.11, vol: 0.03 },
    { type: "noise", color: "pink", filter: "bandpass", cutoff: 1150, q: 1.0, dur: 0.06, vol: 0.014 },
    { type: "tone", wave: "sine", freq: 330, dur: 0.13, vol: 0.012 },
  ],

  // End of turn: a soft downward exhale, marking the rhythm without adding chrome.
  turnEnd: [
    {
      type: "noise",
      color: "pink",
      filter: "bandpass",
      cutoff: 1300,
      cutoffTo: 380,
      q: 0.9,
      dur: 0.5,
      vol: 0.022,
      attack: 0.06,
    },
  ],

  // Pouch refilled: a faint granular shuffle of tokens.
  pouchRefill: [
    { type: "noise", color: "brown", filter: "bandpass", cutoff: 900, q: 1.3, dur: 0.02, vol: 0.014 },
    { type: "noise", color: "brown", filter: "bandpass", cutoff: 1150, q: 1.3, dur: 0.02, at: 0.045, vol: 0.012 },
    { type: "noise", color: "brown", filter: "bandpass", cutoff: 780, q: 1.3, dur: 0.02, at: 0.085, vol: 0.013 },
    { type: "noise", color: "brown", filter: "bandpass", cutoff: 1020, q: 1.3, dur: 0.02, at: 0.14, vol: 0.011 },
    { type: "noise", color: "brown", filter: "bandpass", cutoff: 860, q: 1.3, dur: 0.02, at: 0.185, vol: 0.01 },
  ],

  // Entering the final-turn Finish state: a low resonant bell — the game is closing.
  finishBell: [
    { type: "tone", wave: "sine", freq: LADDER[0], dur: 1.6, vol: 0.036, attack: 0.01 },
    { type: "tone", wave: "sine", freq: LADDER[5], dur: 1.1, vol: 0.02, attack: 0.02 },
    { type: "tone", wave: "sine", freq: LADDER[8], dur: 0.9, vol: 0.018, attack: 0.03 },
    // Upper partials (D5, A5, D6) — a real bell's strike tone lives up here, and it's
    // the only part of this cue a phone speaker reproduces.
    { type: "tone", wave: "sine", freq: LADDER[10], dur: 0.7, vol: 0.016, attack: 0.02 },
    { type: "tone", wave: "sine", freq: LADDER[13], dur: 0.45, vol: 0.01, attack: 0.015 },
    { type: "tone", wave: "sine", freq: LADDER[15], dur: 0.3, vol: 0.006, attack: 0.012 },
  ],

  // Game over: a gentle ascending flourish, in-scale (D4 A4 D5 F#5).
  gameOver: [
    { type: "tone", wave: "sine", freq: LADDER[5], dur: 0.5, vol: 0.036, attack: 0.01 },
    { type: "tone", wave: "sine", freq: LADDER[8], dur: 0.5, at: 0.2, vol: 0.034, attack: 0.01 },
    { type: "tone", wave: "sine", freq: LADDER[10], dur: 0.5, at: 0.4, vol: 0.032, attack: 0.01 },
    { type: "tone", wave: "sine", freq: LADDER[12], dur: 0.9, at: 0.6, vol: 0.028, attack: 0.02 },
  ],
};

/** Every frequency this module can emit, for the "stays on the ladder" test. */
export const TOKEN_COLORS_WITH_VOICE = Object.keys(VOICES);
