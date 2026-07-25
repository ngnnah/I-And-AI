import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DEGREES_PER_LEVEL,
  EVENT_CUES,
  LADDER,
  TOKEN_COLORS_WITH_VOICE,
  VOICES,
  cueForPlacement,
  ladderIndexFor,
} from "../js/audio/sfx-palette.js";
import {
  AMBIENCE_CAP,
  LAYER_TYPES,
  SCENES,
  SCENE_ORDER,
} from "../js/audio/ambience-scenes.js";
import { createSoundEngine } from "../js/audio/sound-engine.js";

// ── The musical contract ──────────────────────────────────────────────────────

test("every placement pitch stays on the pentatonic ladder", () => {
  // The whole point of a pentatonic scale is that nothing can clash. If a future
  // edit introduces an off-scale frequency, a 90-move game starts sounding sour.
  const onLadder = new Set(LADDER);
  for (const color of TOKEN_COLORS_WITH_VOICE) {
    for (let h = 1; h <= 5; h++) {
      const { freq } = cueForPlacement(color, h);
      assert.ok(onLadder.has(freq), `${color} @ h${h} → ${freq} is not a ladder note`);
    }
  }
});

test("pitch rises monotonically with stack height, then clamps", () => {
  for (const color of TOKEN_COLORS_WITH_VOICE) {
    let prev = -Infinity;
    for (let h = 1; h <= 6; h++) {
      const { freq } = cueForPlacement(color, h);
      assert.ok(freq >= prev, `${color}: h${h} (${freq}) dropped below h${h - 1} (${prev})`);
      prev = freq;
    }
    // Never runs off the end of the ladder.
    assert.equal(cueForPlacement(color, 99).freq, LADDER[LADDER.length - 1]);
  }
});

test("ladderIndexFor advances by DEGREES_PER_LEVEL and clamps at both ends", () => {
  assert.equal(ladderIndexFor(0, 1), 0);
  assert.equal(ladderIndexFor(0, 2), DEGREES_PER_LEVEL);
  assert.equal(ladderIndexFor(0, 3), DEGREES_PER_LEVEL * 2);
  assert.equal(ladderIndexFor(0, 0), 0); // height 0 / undefined treated as 1
  assert.equal(ladderIndexFor(LADDER.length - 1, 4), LADDER.length - 1);
});

test("all six token colours have a distinct voice", () => {
  assert.deepEqual(
    [...TOKEN_COLORS_WITH_VOICE].sort(),
    ["blue", "brown", "gray", "green", "red", "yellow"],
  );
  const labels = new Set(Object.values(VOICES).map((v) => v.label));
  assert.equal(labels.size, 6, "each colour needs its own timbre, not a shared one");
});

test("an unknown token colour falls back instead of throwing", () => {
  const cue = cueForPlacement("chartreuse", 2);
  assert.equal(cue.voice, "unknown");
  assert.ok(cue.parts.length > 0);
  assert.ok(new Set(LADDER).has(cue.freq));
});

test("cue parts are well-formed and quiet", () => {
  const all = [
    ...Object.values(EVENT_CUES).flat(),
    ...TOKEN_COLORS_WITH_VOICE.flatMap((c) => cueForPlacement(c, 2).parts),
  ];
  for (const p of all) {
    assert.ok(p.type === "tone" || p.type === "noise", `bad part type ${p.type}`);
    assert.ok(p.dur > 0 && p.dur <= 2, `implausible dur ${p.dur}`);
    assert.ok(p.vol > 0 && p.vol <= 0.05, `part too loud: ${p.vol} — SFX must stay calm`);
    if (p.type === "noise") assert.ok(["white", "pink", "brown"].includes(p.color));
  }
});

test("the error cue is quieter than the reward cues", () => {
  // Mistakes should inform, not punish.
  const loudest = (parts) => Math.max(...parts.map((p) => p.vol));
  assert.ok(loudest(EVENT_CUES.error) < loudest(EVENT_CUES.cardComplete));
  assert.ok(loudest(EVENT_CUES.error) < loudest(EVENT_CUES.gameOver));
});

// ── Ambience scene data ───────────────────────────────────────────────────────

test("scenes are well-formed and every layer type is renderable", () => {
  assert.deepEqual(SCENE_ORDER.sort(), Object.keys(SCENES).sort());
  for (const id of SCENE_ORDER) {
    const scene = SCENES[id];
    assert.equal(scene.id, id, "scene.id must match its key");
    assert.ok(scene.name && scene.emoji && scene.blurb, `${id} needs picker copy`);
    assert.ok(scene.layers.length >= 3, `${id} needs enough layers to feel like a place`);
    for (const layer of scene.layers) {
      assert.ok(LAYER_TYPES.includes(layer.type), `${id}: unknown layer type ${layer.type}`);
      assert.ok(layer.gain > 0 && layer.gain <= 1, `${id}: relative gain out of range`);
      if (layer.type === "randomEvent") {
        assert.ok(layer.minMs > 0 && layer.maxMs > layer.minMs, `${id}: bad interval range`);
        assert.ok(layer.parts?.length, `${id}: randomEvent needs parts`);
      }
      if (layer.type === "noiseBed") {
        assert.ok(["white", "pink", "brown"].includes(layer.color));
        assert.ok(layer.cutoff > 0);
      }
    }
  }
});

test("each scene respects the ambience gain budget", () => {
  // Relative gains are multiplied by AMBIENCE_CAP; keeping the sum <= 1 is what
  // guarantees ambience can never climb over the game.
  for (const id of SCENE_ORDER) {
    const sum = SCENES[id].layers.reduce((t, l) => t + l.gain, 0);
    assert.ok(sum <= 1.0001, `${id}: relative gains sum to ${sum.toFixed(2)}, over budget`);
  }
  assert.ok(AMBIENCE_CAP > 0 && AMBIENCE_CAP <= 0.25);
});

test("random-event parts declare ranges the engine can resolve", () => {
  for (const id of SCENE_ORDER) {
    for (const layer of SCENES[id].layers) {
      if (layer.type !== "randomEvent") continue;
      for (const p of layer.parts) {
        const hasFreq = p.freq || p.freqRange;
        const hasCut = p.cutoff || p.cutoffRange;
        if (p.type === "tone") assert.ok(hasFreq, `${id}: tone part without a frequency`);
        if (p.type === "noise") assert.ok(hasCut, `${id}: filtered noise without a cutoff`);
        for (const key of ["freqRange", "cutoffRange", "volRange"]) {
          if (p[key]) {
            assert.equal(p[key].length, 2, `${id}: ${key} must be [lo, hi]`);
            assert.ok(p[key][0] < p[key][1], `${id}: ${key} is inverted`);
          }
        }
      }
    }
  }
});

// ── Engine, against a fake AudioContext ───────────────────────────────────────

/** Minimal AudioContext stand-in that records what the engine built. */
function fakeContext() {
  const log = { oscillators: 0, buffers: 0, gains: 0, filters: 0, started: 0, stopped: 0 };
  const param = () => ({
    value: 0,
    setValueAtTime() { return this; },
    linearRampToValueAtTime() { return this; },
    exponentialRampToValueAtTime() { return this; },
    cancelScheduledValues() { return this; },
  });
  const node = (kind) => ({
    kind,
    connect() {},
    disconnect() {},
    start() { log.started++; },
    stop() { log.stopped++; },
    frequency: param(),
    Q: param(),
    gain: param(),
  });
  const ctx = {
    state: "running",
    sampleRate: 8000, // small: keeps generated noise buffers fast in tests
    currentTime: 0,
    destination: node("destination"),
    createGain: () => { log.gains++; return node("gain"); },
    createOscillator: () => { log.oscillators++; return node("osc"); },
    createBiquadFilter: () => { log.filters++; return node("filter"); },
    createBufferSource: () => { log.buffers++; return node("buffer"); },
    createBuffer: (ch, len) => ({ duration: len / 8000, getChannelData: () => new Float32Array(len) }),
    resume() { ctx.state = "running"; return Promise.resolve(); },
    suspend() { ctx.state = "suspended"; return Promise.resolve(); },
  };
  return { ctx, log };
}

test("engine builds a graph for a placement without throwing", () => {
  const { ctx, log } = fakeContext();
  const engine = createSoundEngine({ contextFactory: () => ctx });
  engine.placement("blue", 1);
  assert.equal(engine.dead, false);
  assert.ok(log.oscillators > 0, "a droplet needs an oscillator");
  assert.ok(log.buffers > 0, "the droplet's transient needs a noise source");
});

test("SFX toggle actually silences cues", () => {
  const { ctx, log } = fakeContext();
  const engine = createSoundEngine({ contextFactory: () => ctx });
  engine.setSfxEnabled(false);
  engine.placement("gray", 3);
  engine.cue("gameOver");
  assert.equal(log.oscillators, 0, "nothing should be scheduled while muted");
  engine.setSfxEnabled(true);
  engine.cue("gameOver");
  assert.ok(log.oscillators > 0);
});

test("an unknown cue name is a no-op, not a crash", () => {
  const { ctx } = fakeContext();
  const engine = createSoundEngine({ contextFactory: () => ctx });
  engine.cue("nope-not-a-cue");
  assert.equal(engine.dead, false);
});

test("switching scenes cancels the previous scene's timers", async () => {
  // The primary bug risk: leaked timeout chains would stack scenes invisibly on
  // top of each other, and the ambience would get louder and muddier over a session.
  const { ctx } = fakeContext();
  const engine = createSoundEngine({ contextFactory: () => ctx });

  assert.equal(engine.setScene("cabin"), true);
  const cabinTimers = engine.pendingTimerCount;
  assert.ok(cabinTimers > 0, "cabin schedules crackle + loon generators");
  assert.ok(engine.liveNodeCount > 0, "cabin builds bed nodes");

  engine.setScene("summer");
  assert.equal(engine.sceneId, "summer");
  // Every pending timer must belong to summer only — never cabin plus summer.
  const summerEvents = SCENES.summer.layers.filter((l) => l.type === "randomEvent").length;
  assert.equal(engine.pendingTimerCount, summerEvents);

  engine.setScene(null);
  assert.equal(engine.sceneId, null);
  assert.equal(engine.pendingTimerCount, 0, "turning ambience off must leave no timers");
});

test("an unknown scene id turns ambience off rather than half-starting it", () => {
  const { ctx } = fakeContext();
  const engine = createSoundEngine({ contextFactory: () => ctx });
  engine.setScene("cabin");
  assert.equal(engine.setScene("atlantis"), false);
  assert.equal(engine.sceneId, null);
  assert.equal(engine.pendingTimerCount, 0);
});

test("a broken AudioContext latches dead and never blocks the game", async () => {
  const engine = createSoundEngine({
    contextFactory: () => { throw new Error("no audio on this device"); },
  });
  // None of these may throw — a game action must never fail because sound failed.
  engine.placement("water", 2);
  engine.cue("error");
  engine.setVolume(0.9);
  assert.equal(engine.setScene("cabin"), false);
  engine.suspend();
  engine.wake();
  assert.equal(engine.dead, true);
  assert.equal(await engine.unlock(), false);
});

test("volume is clamped to 0..1", () => {
  const { ctx } = fakeContext();
  const engine = createSoundEngine({ contextFactory: () => ctx });
  engine.setVolume(5);
  assert.equal(engine.volume, 1);
  engine.setVolume(-3);
  assert.equal(engine.volume, 0);
  engine.setVolume("not a number");
  assert.equal(engine.volume, 0);
});

test("suspend/wake drive the context state", async () => {
  const { ctx } = fakeContext();
  const engine = createSoundEngine({ contextFactory: () => ctx });
  await engine.unlock();
  engine.suspend();
  assert.equal(ctx.state, "suspended");
  engine.wake();
  assert.equal(ctx.state, "running");
});

test("unlock reports whether the context is genuinely running", async () => {
  // Safari can refuse a resume. Claiming success then means the caller stops retrying
  // and the game goes permanently silent — the iPhone bug this guards.
  const { ctx } = fakeContext();
  ctx.state = "suspended";
  ctx.resume = () => Promise.resolve();   // refuses: state never becomes "running"
  const engine = createSoundEngine({ contextFactory: () => ctx });
  assert.equal(await engine.unlock(), false, "a refused resume must report failure");

  const ok = fakeContext();
  ok.ctx.state = "suspended";
  const engine2 = createSoundEngine({ contextFactory: () => ok.ctx });
  assert.equal(await engine2.unlock(), true, "a successful resume must report success");
});

test("cues are dropped, not silently lost, while the context is suspended", async () => {
  // currentTime is frozen while suspended, so anything scheduled then never sounds.
  const { ctx, log } = fakeContext();
  const engine = createSoundEngine({ contextFactory: () => ctx });
  await engine.unlock();
  ctx.state = "suspended";
  const before = log.oscillators;
  engine.placement("gray", 1);
  assert.equal(log.oscillators, before, "must not schedule into a suspended context");
  assert.equal(ctx.state, "running", "should have asked the context to wake");
});
