/**
 * Harmonies — sound engine (the ONLY file that touches AudioContext)
 *
 * A dumb renderer: it reads the declarative part/layer specs from `sfx-palette.js` and
 * `ambience-scenes.js` and makes noise. All the musical decisions live in those two pure
 * modules; all the untestable WebAudio plumbing lives here.
 *
 * No DOM, no localStorage, no globals — the AudioContext arrives via `contextFactory`,
 * so tests can inject a fake and assert behaviour without a browser.
 *
 * Signal graph:
 *
 *     cue parts  ──► sfxBus ─────┐
 *                                ├──► masterGain ──► destination
 *     scene layers ──► ambienceBus (capped) ─┘
 *
 * Failure policy: audio is a garnish, never a gate. Any WebAudio error is swallowed,
 * `dead` latches on first failure so a broken context is not retried ~90 times a game,
 * and every public method stays safe to call afterwards.
 */

import { AMBIENCE_CAP, FADES, SCENES } from "./ambience-scenes.js";
import { EVENT_CUES, cueForPlacement } from "./sfx-palette.js";

const MIN_GAIN = 0.0001; // exponentialRampToValueAtTime cannot reach 0

/**
 * Single output trim applied at the master, on top of the user's 0–1 volume.
 *
 * The per-part `vol` numbers in sfx-palette.js are *relative weights* tuned against each
 * other; this is the one knob that sets absolute loudness. Originally there was no trim,
 * which put full-volume peaks at ~3% of full scale — fine on laptop speakers, too quiet
 * on a phone, which is the primary way this game is played.
 *
 * Turn overall loudness up/down HERE, not by rescaling the palette — rescaling would
 * destroy the measured SFX/ambience balance and the cross-voice balance.
 */
export const OUTPUT_TRIM = 7;

function rand(lo, hi) {
  return lo + Math.random() * (hi - lo);
}

/** Build one channel of noise. Cached per colour — generating this is not cheap. */
function makeNoiseBuffer(ctx, color, seconds = 3) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buffer.getChannelData(0);

  if (color === "white") {
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  } else if (color === "pink") {
    // Paul Kellett's economical pink filter.
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  } else {
    // brown — leaky integration of white, then normalised.
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
  }
  return buffer;
}

export function createSoundEngine({ contextFactory, cap = AMBIENCE_CAP } = {}) {
  const state = {
    ctx: null,
    master: null,
    sfxBus: null,
    ambienceBus: null,
    dead: false,
    sfxEnabled: true,
    volume: 0.6,
    sceneId: null,
    /** setTimeout ids for the live scene's random-event generators. */
    timers: new Set(),
    /** Nodes owned by the live scene, so a crossfade can retire exactly those. */
    sceneNodes: [],
    /** Bumped on every scene change; stale timer callbacks check it and bail. */
    generation: 0,
    noise: new Map(),
    /** Set by unlock(); gates real-AudioContext creation until a user gesture. */
    unlockRequested: false,
    /** iOS output-path prime has been played. */
    primed: false,
  };

  function makeContext() {
    if (typeof contextFactory === "function") return contextFactory();
    const Ctor = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
    if (!Ctor) throw new Error("WebAudio unavailable");
    return new Ctor();
  }

  /** Lazily build the context + buses. Returns null once dead. */
  function ensure() {
    if (state.dead) return null;
    if (state.ctx) return state.ctx;
    // Never create a real AudioContext before a user gesture. iOS Safari starts such a
    // context suspended and waking it afterwards is unreliable — the game used to build
    // one during init (the pouch-refill cue), which is the worst possible starting state.
    // Tests and the sound lab inject a contextFactory and are exempt.
    if (!state.unlockRequested && typeof contextFactory !== "function") return null;
    try {
      const ctx = makeContext();
      const master = ctx.createGain();
      master.gain.value = state.volume * OUTPUT_TRIM;
      master.connect(ctx.destination);

      const sfxBus = ctx.createGain();
      sfxBus.gain.value = 1;
      sfxBus.connect(master);

      // Hard-capped so ambience can never climb over the game, whatever the layer math does.
      const ambienceBus = ctx.createGain();
      ambienceBus.gain.value = 0;
      ambienceBus.connect(master);

      Object.assign(state, { ctx, master, sfxBus, ambienceBus });
      return ctx;
    } catch (e) {
      state.dead = true;
      return null;
    }
  }

  function noiseBuffer(ctx, color) {
    const key = color || "white";
    if (!state.noise.has(key)) state.noise.set(key, makeNoiseBuffer(ctx, key));
    return state.noise.get(key);
  }

  /** Attach a `dur`-long attack/decay envelope, returning the gain node. */
  function envelope(ctx, vol, dur, attack, startAt) {
    const g = ctx.createGain();
    const a = Math.min(Math.max(attack || 0.004, 0.001), Math.max(dur * 0.5, 0.002));
    g.gain.setValueAtTime(MIN_GAIN, startAt);
    g.gain.linearRampToValueAtTime(Math.max(vol, MIN_GAIN), startAt + a);
    g.gain.exponentialRampToValueAtTime(MIN_GAIN, startAt + Math.max(dur, a + 0.005));
    return g;
  }

  /** Free a finished one-shot so a 20-minute session doesn't accumulate nodes. */
  function autoRelease(source, nodes) {
    source.onended = () => {
      for (const n of nodes) {
        try { n.disconnect(); } catch (e) { /* already gone */ }
      }
    };
  }

  /**
   * Render one part spec into the graph.
   * Supported: type tone|noise, wave, freq/freqRange/freqTo/freqMul, vibrato, am,
   * color, filter, cutoff/cutoffRange/cutoffTo, q, dur, vol/volRange, attack, at.
   */
  function renderPart(ctx, part, destination, gainScale, baseTime) {
    const at = baseTime + (part.at || 0);
    const dur = part.dur || 0.1;
    const vol = (part.volRange ? rand(part.volRange[0], part.volRange[1]) : part.vol ?? 0.02) * gainScale;
    if (vol <= 0) return;

    const env = envelope(ctx, vol, dur, part.attack, at);
    env.connect(destination);
    const owned = [env];

    let source;
    if (part.type === "noise") {
      source = ctx.createBufferSource();
      source.buffer = noiseBuffer(ctx, part.color);
      const cutoff = part.cutoffRange ? rand(part.cutoffRange[0], part.cutoffRange[1]) : part.cutoff;
      if (part.filter && cutoff) {
        const f = ctx.createBiquadFilter();
        f.type = part.filter;
        f.Q.value = part.q ?? 1;
        f.frequency.setValueAtTime(cutoff, at);
        if (part.cutoffTo) f.frequency.exponentialRampToValueAtTime(Math.max(part.cutoffTo, 1), at + dur);
        source.connect(f);
        f.connect(env);
        owned.push(f);
      } else {
        source.connect(env);
      }
      // Random offset so repeated bursts never sound like the same click.
      const maxOffset = Math.max(0, (source.buffer.duration || 1) - dur - 0.01);
      source.start(at, rand(0, maxOffset));
    } else {
      source = ctx.createOscillator();
      source.type = part.wave || "sine";
      const freq = part.freqRange ? rand(part.freqRange[0], part.freqRange[1]) : part.freq || 440;
      const freqTo = part.freqTo || (part.freqMul ? freq * part.freqMul : null);
      source.frequency.setValueAtTime(freq, at);
      if (freqTo) source.frequency.exponentialRampToValueAtTime(Math.max(freqTo, 1), at + dur);

      if (part.vibrato) {
        const lfo = ctx.createOscillator();
        const depth = ctx.createGain();
        lfo.frequency.value = part.vibrato;
        depth.gain.value = freq * 0.012;
        lfo.connect(depth);
        depth.connect(source.frequency);
        lfo.start(at);
        lfo.stop(at + dur);
        owned.push(lfo, depth);
      }

      if (part.am) {
        // Amplitude modulation gives insect chirps their buzz. AudioParam sums
        // connected inputs with the envelope automation already scheduled above.
        const lfo = ctx.createOscillator();
        const depth = ctx.createGain();
        lfo.type = "sine";
        lfo.frequency.value = part.am;
        depth.gain.value = vol * 0.7;
        lfo.connect(depth);
        depth.connect(env.gain);
        lfo.start(at);
        lfo.stop(at + dur);
        owned.push(lfo, depth);
      }

      source.connect(env);
      source.start(at);
    }

    source.stop(at + dur + 0.02);
    owned.push(source);
    autoRelease(source, owned);
  }

  /** Play a list of parts on a bus. Safe to call at any time; silent when unavailable. */
  function playParts(parts, { bus = "sfx", gainScale = 1 } = {}) {
    if (!parts || !parts.length) return;
    const ctx = ensure();
    if (!ctx) return;
    // An OfflineAudioContext also reports "suspended" until startRendering() is called,
    // and dropping cues there would silence every offline measurement — so only guard
    // realtime contexts. `startRendering` is the discriminator.
    const isRealtime = typeof ctx.startRendering !== "function";
    if (isRealtime && ctx.state === "suspended") {
      // currentTime is frozen while suspended, so anything scheduled now is lost.
      // Ask for a wake and drop this one cue rather than emit silence forever.
      try { ctx.resume && ctx.resume(); } catch (e) { /* ignore */ }
      return;
    }
    try {
      const destination = bus === "ambience" ? state.ambienceBus : state.sfxBus;
      const now = ctx.currentTime;
      for (const part of parts) renderPart(ctx, part, destination, gainScale, now);
    } catch (e) {
      state.dead = true;
    }
  }

  // ── Ambience ────────────────────────────────────────────────────────────────

  function buildBed(ctx, layer) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, layer.color);
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = layer.filter || "lowpass";
    filter.Q.value = layer.q ?? 0.7;
    filter.frequency.value = layer.cutoff || 500;

    const g = ctx.createGain();
    g.gain.value = layer.gain ?? 0.1;

    src.connect(filter);
    filter.connect(g);
    g.connect(state.ambienceBus);
    src.start(0);

    const nodes = [src, filter, g];
    if (layer.lfo) nodes.push(...attachLfo(ctx, layer, filter, g));
    return nodes;
  }

  function buildDrone(ctx, layer) {
    const osc = ctx.createOscillator();
    osc.type = layer.wave || "sine";
    osc.frequency.value = layer.freq || 110;
    const g = ctx.createGain();
    g.gain.value = layer.gain ?? 0.05;
    osc.connect(g);
    g.connect(state.ambienceBus);
    osc.start(0);
    const nodes = [osc, g];
    if (layer.lfo) nodes.push(...attachLfo(ctx, layer, null, g));
    return nodes;
  }

  /** Slow modulation — the thing that stops a bed from sounding like a fan. */
  function attachLfo(ctx, layer, filter, gainNode) {
    const { rate, depth, target } = layer.lfo;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = rate;
    const amount = ctx.createGain();
    if (target === "cutoff" && filter) {
      amount.gain.value = (layer.cutoff || 500) * depth;
      amount.connect(filter.frequency);
    } else {
      amount.gain.value = (layer.gain ?? 0.1) * depth;
      amount.connect(gainNode.gain);
    }
    lfo.connect(amount);
    lfo.start(0);
    return [lfo, amount];
  }

  /**
   * Schedule a random-event layer as a self-rescheduling timeout chain.
   * Every callback checks `generation` first: without that, a scene change would
   * leave the old scene's events firing forever underneath the new one.
   */
  function scheduleRandomEvent(layer, generation) {
    const tick = () => {
      if (state.generation !== generation || state.sceneId === null) return;
      playParts(layer.parts, { bus: "ambience", gainScale: layer.gain ?? 0.1 });
      const id = setTimeout(tick, rand(layer.minMs, layer.maxMs));
      state.timers.add(id);
    };
    const id = setTimeout(tick, rand(layer.minMs, layer.maxMs));
    state.timers.add(id);
  }

  /** Cancel every pending random-event timer. The main leak guard. */
  function clearTimers() {
    for (const id of state.timers) clearTimeout(id);
    state.timers.clear();
  }

  function teardownScene(nodes, fadeOut) {
    if (!nodes || !nodes.length) return;
    const ctx = state.ctx;
    const stopAt = (ctx ? ctx.currentTime : 0) + fadeOut + 0.05;
    for (const n of nodes) {
      try {
        if (typeof n.stop === "function") n.stop(stopAt);
      } catch (e) { /* already stopped */ }
    }
    setTimeout(() => {
      for (const n of nodes) {
        try { n.disconnect(); } catch (e) { /* already gone */ }
      }
    }, (fadeOut + 0.2) * 1000);
  }

  /**
   * Switch ambience. `null` turns it off.
   * @returns {boolean} whether the requested scene is now live
   */
  function setScene(id) {
    const known = id === null || id === undefined ? null : (SCENES[id] ? id : null);
    const ctx = known ? ensure() : state.ctx;

    // Always retire the previous scene, even if the new one can't start.
    state.generation++;
    clearTimers();
    const old = state.sceneNodes;
    state.sceneNodes = [];
    state.sceneId = known;

    if (!ctx) {
      teardownScene(old, 0.1);
      return false;
    }

    try {
      const fade = old.length ? FADES.crossfade : FADES.in;
      const now = ctx.currentTime;

      if (!known) {
        state.ambienceBus.gain.cancelScheduledValues(now);
        state.ambienceBus.gain.setValueAtTime(state.ambienceBus.gain.value, now);
        state.ambienceBus.gain.linearRampToValueAtTime(0, now + FADES.out);
        teardownScene(old, FADES.out);
        return false;
      }

      teardownScene(old, fade);

      const scene = SCENES[known];
      const nodes = [];
      for (const layer of scene.layers) {
        if (layer.type === "noiseBed") nodes.push(...buildBed(ctx, layer));
        else if (layer.type === "drone") nodes.push(...buildDrone(ctx, layer));
        else if (layer.type === "randomEvent") scheduleRandomEvent(layer, state.generation);
      }
      state.sceneNodes = nodes;

      state.ambienceBus.gain.cancelScheduledValues(now);
      state.ambienceBus.gain.setValueAtTime(Math.max(state.ambienceBus.gain.value, MIN_GAIN), now);
      state.ambienceBus.gain.linearRampToValueAtTime(cap, now + fade);
      return true;
    } catch (e) {
      state.dead = true;
      return false;
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  return {
    /**
     * Call from inside a user gesture. Returns whether the context is genuinely
     * RUNNING — callers must keep retrying on later gestures until it is.
     *
     * iOS Safari is strict here in ways Chrome is not:
     *  - It only treats SOME events as user activation for audio (`click`, `touchend`,
     *    `keydown`) — NOT `touchstart`/`pointerdown`. So a resume attempt can simply be
     *    refused, and reporting success then is what produced total silence on iPhone.
     *  - `resume()` is async; the context is not running until it settles.
     *  - The output path stays asleep until something has actually been played, hence
     *    the one-sample silent prime below.
     */
    async unlock() {
      state.unlockRequested = true;
      const ctx = ensure();
      if (!ctx) return false;
      try {
        if (ctx.state === "suspended" && ctx.resume) await ctx.resume();
        if (!state.primed) {
          // Playing a silent 1-sample buffer is the reliable way to wake iOS's output.
          const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(ctx.destination);
          src.start(0);
          state.primed = true;
        }
        return ctx.state === "running";
      } catch (e) {
        return false;
      }
    },

    /** Token placed: per-colour voice, pitch rising with stack height. */
    placement(color, height) {
      if (!state.sfxEnabled) return;
      playParts(cueForPlacement(color, height).parts);
    },

    /** Any fixed cue from EVENT_CUES, e.g. 'error', 'turnEnd', 'gameOver'. */
    cue(name) {
      if (!state.sfxEnabled) return;
      playParts(EVENT_CUES[name]);
    },

    setSfxEnabled(on) {
      state.sfxEnabled = !!on;
    },

    setVolume(v) {
      state.volume = Math.min(1, Math.max(0, Number(v) || 0));
      if (!state.master || !state.ctx) return;
      try {
        const now = state.ctx.currentTime;
        state.master.gain.cancelScheduledValues(now);
        state.master.gain.setValueAtTime(state.master.gain.value, now);
        state.master.gain.linearRampToValueAtTime(state.volume * OUTPUT_TRIM, now + 0.08);
      } catch (e) { /* volume is cosmetic; never fatal */ }
    },

    setScene,

    /** Tab hidden — stop burning battery and never play into a background tab. */
    suspend() {
      if (!state.ctx) return;
      try { if (state.ctx.suspend) state.ctx.suspend(); } catch (e) { /* ignore */ }
    },

    /** Tab visible again — only resume if ambience or SFX are actually wanted. */
    wake() {
      if (!state.ctx) return;
      try { if (state.ctx.resume) state.ctx.resume(); } catch (e) { /* ignore */ }
    },

    // Introspection for tests and the sound lab.
    get sceneId() { return state.sceneId; },
    get sfxEnabled() { return state.sfxEnabled; },
    get volume() { return state.volume; },
    get dead() { return state.dead; },
    get pendingTimerCount() { return state.timers.size; },
    get liveNodeCount() { return state.sceneNodes.length; },
    _playParts: playParts,
  };
}
