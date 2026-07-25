/**
 * Harmonies — ambience scenes (PURE DATA, no WebAudio)
 *
 * Three atmospheres, one active at a time, crossfaded by `sound-engine.js`.
 * Everything is synthesized: no sample files, so zero asset bytes ship, and because
 * the events fire on random intervals there is no loop and no audible seam.
 *
 * Deliberately NOT white noise — broadband noise is fatiguing over a 20-minute game.
 * Each scene is a quiet filtered *bed* plus *sparse random events*, which is what
 * makes long listening comfortable.
 *
 * ── Layer types ────────────────────────────────────────────────────────────────
 *  noiseBed     steady filtered noise; optional lfo modulating 'cutoff' or 'gain'
 *  drone        steady oscillator; optional lfo
 *  randomEvent  a cue fired at a random interval in [minMs, maxMs]
 *
 * ── Gain budget ────────────────────────────────────────────────────────────────
 * `gain` is RELATIVE (0..1). The engine multiplies by AMBIENCE_CAP so ambience can
 * never overpower the SFX however the layer math shakes out. Per-scene relative gains
 * must sum to <= 1.0; `tests/sound.test.js` enforces it.
 *
 * Parts inside a randomEvent may use `freqRange: [lo, hi]` / `cutoffRange: [lo, hi]` /
 * `volRange: [lo, hi]` instead of fixed values — the engine draws the random value.
 * Keeping the ranges here as data (and the RNG in the engine) keeps this module pure.
 */

/** Hard ceiling on the ambience bus. Ambience must always sit under the game. */
export const AMBIENCE_CAP = 0.18;

/** Crossfade / fade timings in seconds. */
export const FADES = { crossfade: 0.8, in: 0.4, out: 0.6 };

export const SCENES = {
  cabin: {
    id: "cabin",
    emoji: "🌙",
    name: "Cabin by the Lake",
    blurb: "Bonfire crackle, water lapping, a distant loon",
    layers: [
      // The fire's body: brown noise rolled off low, so it sits under everything.
      {
        type: "noiseBed",
        color: "brown",
        filter: "lowpass",
        cutoff: 400,
        q: 0.7,
        gain: 0.3,
        lfo: { rate: 0.07, depth: 0.35, target: "gain" }, // fire breathing
      },
      // The crackle. Very short bandpassed bursts at tight random intervals — this,
      // not the bed, is what the ear actually reads as "fire".
      {
        type: "randomEvent",
        minMs: 40,
        maxMs: 200,
        gain: 0.22,
        parts: [
          {
            type: "noise",
            color: "white",
            filter: "bandpass",
            cutoffRange: [1000, 3000],
            q: 3.0,
            dur: 0.006,
            volRange: [0.25, 1.0],
          },
        ],
      },
      // Lake water: pink noise through a slowly swept bandpass = a gentle wash.
      {
        type: "noiseBed",
        color: "pink",
        filter: "bandpass",
        cutoff: 620,
        q: 0.8,
        gain: 0.22,
        lfo: { rate: 0.1, depth: 0.5, target: "cutoff" },
      },
      // Night wind over the water.
      {
        type: "noiseBed",
        color: "brown",
        filter: "lowpass",
        cutoff: 240,
        q: 0.6,
        gain: 0.14,
        lfo: { rate: 0.05, depth: 0.6, target: "cutoff" },
      },
      // A loon, rarely. The one thing that makes the scene feel like a *place*.
      {
        type: "randomEvent",
        minMs: 30000,
        maxMs: 90000,
        gain: 0.12,
        parts: [
          { type: "tone", wave: "sine", freq: 700, freqTo: 500, dur: 1.1, vol: 0.5, attack: 0.12, vibrato: 5.5 },
          { type: "tone", wave: "sine", freq: 520, freqTo: 470, dur: 0.8, at: 1.2, vol: 0.3, attack: 0.1, vibrato: 5 },
        ],
      },
    ],
  },

  summer: {
    id: "summer",
    emoji: "🦗",
    name: "Summer Night",
    blurb: "Insect chorus, distant frogs, a warm breeze",
    layers: [
      // Warm still air.
      {
        type: "noiseBed",
        color: "brown",
        filter: "lowpass",
        cutoff: 320,
        q: 0.6,
        gain: 0.16,
        lfo: { rate: 0.04, depth: 0.5, target: "cutoff" },
      },
      // The chorus: four voices at slightly different pitches on independent random
      // timing. Staggering them is what turns beeps into a field of insects.
      ...[4100, 3800, 4400, 3550].map((freq, i) => ({
        type: "randomEvent",
        minMs: 900 + i * 260,
        maxMs: 2600 + i * 420,
        gain: 0.13,
        parts: [
          {
            type: "tone",
            wave: "triangle",
            freq,
            dur: 0.09 + i * 0.012,
            vol: 0.55,
            attack: 0.01,
            am: 42 + i * 4, // amplitude modulation = the chirp's "buzz"
          },
        ],
      })),
      // Frogs, low and occasional.
      {
        type: "randomEvent",
        minMs: 4000,
        maxMs: 12000,
        gain: 0.16,
        parts: [
          { type: "tone", wave: "sawtooth", freqRange: [180, 230], dur: 0.14, vol: 0.4, attack: 0.01, am: 26 },
        ],
      },
      // Leaves stirring now and then.
      {
        type: "randomEvent",
        minMs: 7000,
        maxMs: 20000,
        gain: 0.1,
        parts: [
          {
            type: "noise",
            color: "pink",
            filter: "bandpass",
            cutoffRange: [2200, 4200],
            q: 1.1,
            dur: 1.4,
            vol: 0.5,
            attack: 0.4,
          },
        ],
      },
    ],
  },

  morning: {
    id: "morning",
    emoji: "🌿",
    name: "Morning Forest",
    blurb: "Birdsong, rustling leaves, a faint stream",
    layers: [
      // Faint stream: static, highpassed, very low in the mix.
      {
        type: "noiseBed",
        color: "pink",
        filter: "highpass",
        cutoff: 900,
        q: 0.7,
        gain: 0.12,
      },
      // Forest floor / air.
      {
        type: "noiseBed",
        color: "brown",
        filter: "lowpass",
        cutoff: 300,
        q: 0.6,
        gain: 0.15,
        lfo: { rate: 0.045, depth: 0.5, target: "cutoff" },
      },
      // Leaves in the canopy.
      {
        type: "noiseBed",
        color: "pink",
        filter: "bandpass",
        cutoff: 2600,
        q: 1.0,
        gain: 0.1,
        lfo: { rate: 0.08, depth: 0.7, target: "gain" },
      },
      // Birdsong: short frequency-swept phrases. Two generators at different tempos
      // so the calls answer each other instead of marching.
      {
        type: "randomEvent",
        minMs: 2600,
        maxMs: 9000,
        gain: 0.2,
        parts: [
          { type: "tone", wave: "sine", freqRange: [2400, 3200], freqMul: 1.35, dur: 0.09, vol: 0.4, attack: 0.01 },
          { type: "tone", wave: "sine", freqRange: [2900, 3600], freqMul: 0.8, dur: 0.11, at: 0.12, vol: 0.36, attack: 0.01 },
          { type: "tone", wave: "sine", freqRange: [2200, 2800], freqMul: 1.2, dur: 0.13, at: 0.27, vol: 0.3, attack: 0.01 },
        ],
      },
      {
        type: "randomEvent",
        minMs: 5000,
        maxMs: 16000,
        gain: 0.14,
        parts: [
          { type: "tone", wave: "triangle", freqRange: [1700, 2100], freqMul: 1.6, dur: 0.16, vol: 0.32, attack: 0.02 },
          { type: "tone", wave: "triangle", freqRange: [1900, 2300], freqMul: 0.7, dur: 0.14, at: 0.2, vol: 0.26, attack: 0.02 },
        ],
      },
    ],
  },
};

/** Stable order for the picker UI. */
export const SCENE_ORDER = ["cabin", "summer", "morning"];

/** Layer `type` values the engine knows how to render. */
export const LAYER_TYPES = ["noiseBed", "drone", "randomEvent"];
