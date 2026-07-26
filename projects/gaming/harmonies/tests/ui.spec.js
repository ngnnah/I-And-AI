import { test, expect } from "@playwright/test";

// Start each test from a clean, fully-loaded game.
async function freshGame(page) {
  await page.goto("/index.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#score-total-sidebar")).toBeVisible();
  // Tokens are rendered once the module has booted.
  await expect(page.locator('.token[data-space="0"] >> visible=true').first()).toBeVisible();
}

// Place one token onto the first empty board hex. After the first placement the
// next token is auto-selected, so only click a token when none is selected.
async function placeOneToken(page) {
  if ((await page.locator(".token.selected >> visible=true").count()) === 0) {
    await page.locator('.token[data-space="0"] >> visible=true').first().click();
  }
  await page.locator("#hex-grid-container .hex-cell[data-terrain='empty']").first().click();
}

test("loads without console errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await freshGame(page);
  expect(errors, `page errors: ${errors.join("; ")}`).toEqual([]);
});

test("there is no manual End Turn button (turn auto-advances)", async ({ page }) => {
  await freshGame(page);
  await expect(page.locator("#end-turn-btn")).toHaveCount(0);
  // The token spaces still live in the right-hand panel.
  await expect(page.locator('.token-row[data-space="0"]')).toBeVisible();
});

test("placing all 3 tokens auto-ends the turn and draws new tokens", async ({ page }) => {
  await freshGame(page);
  const filledBefore = await page.locator("#hex-grid-container .hex-cell:not([data-terrain='empty'])").count();

  for (let i = 0; i < 3; i++) await placeOneToken(page);

  const filledAfter = await page.locator("#hex-grid-container .hex-cell:not([data-terrain='empty'])").count();
  expect(filledAfter).toBe(filledBefore + 3);

  // Turn ended automatically → advanced to Turn 2 + a fresh set of tokens.
  await expect(page.locator("#turn-number")).toHaveText("2");
  await expect(page.locator('.token[data-space="0"] >> visible=true').first()).toBeVisible();
});

test("placing a token auto-selects the next one, arrows switch it", async ({ page }) => {
  await freshGame(page);
  // Place the first token (this commits the active space).
  await page.locator('.token[data-space="0"] >> visible=true').first().click();
  await page.locator("#hex-grid-container .hex-cell[data-terrain='empty']").first().click();

  // The next token in that space should now be pre-selected.
  const selected = page.locator(".token.selected >> visible=true");
  await expect(selected.first()).toBeVisible();
  const idxBefore = await selected.first().getAttribute("data-index");

  // Right arrow moves the selection to the other remaining token.
  await page.keyboard.press("ArrowRight");
  const idxAfter = await page.locator(".token.selected >> visible=true").first().getAttribute("data-index");
  expect(idxAfter).not.toBe(idxBefore);

  // Exactly one logical token is selected (desktop copy).
  await expect(page.locator(".token.selected >> visible=true")).toHaveCount(1);
});

test("selecting a token highlights valid placement hexes", async ({ page }) => {
  await freshGame(page);
  expect(await page.locator(".hex-cell.valid-token-target").count()).toBe(0);
  await page.locator('.token[data-space="0"] >> visible=true').first().click();
  // On an empty board every hex accepts the first token.
  expect(await page.locator(".hex-cell.valid-token-target").count()).toBeGreaterThan(0);
});

test("final turn shows Finish, then the Game Over summary", async ({ page }) => {
  await freshGame(page);
  let finished = false;
  for (let i = 0; i < 40 && !finished; i++) {
    // On the last turn a Finish button appears (so you can place final cubes).
    if (await page.locator("#finish-btn:visible").count()) {
      await page.locator("#finish-btn").click();
      finished = true;
      break;
    }
    const empty = page.locator("#hex-grid-container .hex-cell[data-terrain='empty']");
    if ((await empty.count()) === 0) break;
    if ((await page.locator(".token.selected >> visible=true").count()) === 0) {
      const t = page.locator('.token[data-space="0"] >> visible=true').first();
      if ((await t.count()) === 0) break;
      await t.click();
    }
    await empty.first().click();
    await page.waitForTimeout(40);
  }
  expect(finished).toBe(true);
  await expect(page.locator("#gameover-modal")).toBeVisible();
  await expect(page.locator("#gameover-modal")).toContainText("Game Over");
});

test("Help button opens a How to Play modal with stacking and scoring", async ({ page }) => {
  await freshGame(page);
  await page.locator("#help-btn").click();

  const modal = page.locator("#help-modal");
  await expect(modal).toBeVisible();
  await expect(modal).toContainText("How to Play");
  await expect(modal).toContainText("Stacking tokens");
  await expect(modal).toContainText("Scoring");
  await expect(modal).toContainText("tall tree"); // the 7-point rule
  await expect(modal).toContainText("suns");

  // Closes via the × button
  await modal.getByRole("button", { name: "Close" }).click();
  await expect(modal).not.toBeVisible();
});

test("New Game starts fresh (does not resume the old board)", async ({ page }) => {
  await freshGame(page);
  for (let i = 0; i < 3; i++) await placeOneToken(page);
  expect(await page.locator("#hex-grid-container .hex-cell:not([data-terrain='empty'])").count()).toBe(3);

  page.once("dialog", (d) => d.accept()); // confirm "start a new game?"
  await page.locator("#new-game-btn").click();
  await page.waitForLoadState("networkidle");

  // Board must be empty and NOT show the "Resumed" message.
  expect(await page.locator("#hex-grid-container .hex-cell:not([data-terrain='empty'])").count()).toBe(0);
  await expect(page.locator("#game-message")).not.toContainText("Resumed");
});

// ── Sound panel ───────────────────────────────────────────────────────────────
// These assert state and the absence of errors. They CANNOT assert that anything is
// audible — headless Chromium has no output device. Judging the sound itself is done
// by ear in dev-sound-lab.html; the cue/scene data is covered by tests/sound.test.js.

test("sound panel opens, defaults to SFX on + ambience off", async ({ page }) => {
  await freshGame(page);
  const panel = page.locator("#sound-panel");
  await expect(panel).not.toBeVisible();

  await page.locator("#sound-btn").click();
  await expect(panel).toBeVisible();
  await expect(page.locator("#sound-btn")).toHaveAttribute("aria-expanded", "true");

  // Defaults: effects on, ambience off — background audio must never start uninvited.
  await expect(page.locator("#sfx-toggle")).toBeChecked();
  await expect(page.locator('#ambience-scenes input[value=""]')).toBeChecked();
  await expect(panel).toContainText("Cabin by the Lake");
  await expect(panel).toContainText("Summer Night");
  await expect(panel).toContainText("Morning Forest");

  // Escape closes it.
  await page.keyboard.press("Escape");
  await expect(panel).not.toBeVisible();
});

test("sound preferences persist across a reload", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await freshGame(page);

  await page.locator("#sound-btn").click();
  await page.locator("#sfx-toggle").uncheck();
  await page.locator('#ambience-scenes input[value="summer"]').check();
  await page.locator("#sound-volume").fill("0.25");
  await page.locator("#sound-volume").dispatchEvent("change"); // commit the slider

  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#sound-btn").click();
  await expect(page.locator("#sfx-toggle")).not.toBeChecked();
  await expect(page.locator('#ambience-scenes input[value="summer"]')).toBeChecked();
  await expect(page.locator("#sound-volume")).toHaveValue("0.25");

  expect(errors, `page errors: ${errors.join("; ")}`).toEqual([]);
});

test("a corrupt sound-prefs entry falls back to defaults instead of breaking the game", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/index.html");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("harmonies_sound_prefs", "{ this is not json");
  });
  await page.reload({ waitUntil: "networkidle" });

  // The game still boots, and the panel shows the defaults.
  await expect(page.locator("#score-total-sidebar")).toBeVisible();
  await page.locator("#sound-btn").click();
  await expect(page.locator("#sfx-toggle")).toBeChecked();
  await expect(page.locator('#ambience-scenes input[value=""]')).toBeChecked();
  expect(errors, `page errors: ${errors.join("; ")}`).toEqual([]);
});

test("playing a full turn with ambience on raises no errors", async ({ page }) => {
  // Guards the integration: cue call sites, the scene graph, and the crossfade all
  // running together during real play.
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await freshGame(page);

  await page.locator("#sound-btn").click();
  await page.locator('#ambience-scenes input[value="cabin"]').check();
  await page.keyboard.press("Escape");

  for (let i = 0; i < 3; i++) await placeOneToken(page);
  await expect(page.locator("#turn-number")).toHaveText("2");

  // Crossfade to another scene mid-game, then off.
  await page.locator("#sound-btn").click();
  await page.locator('#ambience-scenes input[value="morning"]').check();
  await page.locator('#ambience-scenes input[value=""]').check();

  expect(errors, `page errors: ${errors.join("; ")}`).toEqual([]);
});

// Render the engine's output into an OfflineAudioContext and measure it. Headless has
// no speakers, but it can still do the real DSP — so this proves the cues actually
// produce a signal rather than merely wiring up nodes without throwing.
async function renderPeak(page, action, seconds = 1) {
  return page.evaluate(async ({ action, seconds }) => {
    const { createSoundEngine } = await import("/js/audio/sound-engine.js");
    const rate = 44100;
    const offline = new OfflineAudioContext(1, rate * seconds, rate);
    const engine = createSoundEngine({ contextFactory: () => offline });

    if (action.kind === "placement") engine.placement(action.color, action.height);
    else if (action.kind === "cue") engine.cue(action.name);
    else if (action.kind === "scene") engine.setScene(action.name);
    else if (action.kind === "muted") { engine.setSfxEnabled(false); engine.cue("gameOver"); }

    const data = (await offline.startRendering()).getChannelData(0);
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      const v = Math.abs(data[i]);
      if (v > peak) peak = v;
    }
    return peak;
  }, { action, seconds });
}

test("every placement voice renders an audible, calm signal", async ({ page }) => {
  await freshGame(page);
  for (const color of ["blue", "yellow", "brown", "green", "red", "gray"]) {
    for (const height of [1, 3]) {
      const peak = await renderPeak(page, { kind: "placement", color, height });
      expect(peak, `${color} h${height} was silent`).toBeGreaterThan(0.0005);
      // Calm means calm: nothing may approach clipping.
      expect(peak, `${color} h${height} is too loud (${peak})`).toBeLessThan(0.75);
    }
  }
});

test("every event cue renders an audible signal", async ({ page }) => {
  await freshGame(page);
  const cues = ["tokenSelect", "cubePlace", "cardComplete", "error", "turnEnd", "pouchRefill", "finishBell", "gameOver"];
  for (const name of cues) {
    const peak = await renderPeak(page, { kind: "cue", name }, 2);
    expect(peak, `cue "${name}" was silent`).toBeGreaterThan(0.0005);
    expect(peak, `cue "${name}" is too loud (${peak})`).toBeLessThan(0.75);
  }
});

test("muting really produces digital silence, not just quieter audio", async ({ page }) => {
  await freshGame(page);
  expect(await renderPeak(page, { kind: "muted" })).toBe(0);
});

test("every ambience scene renders a signal under the gain cap", async ({ page }) => {
  await freshGame(page);
  for (const name of ["cabin", "summer", "morning"]) {
    const peak = await renderPeak(page, { kind: "scene", name }, 2);
    expect(peak, `scene "${name}" was silent`).toBeGreaterThan(0.0005);
    // Ambience must always sit under the game — this is the audible proof of the cap.
    expect(peak, `scene "${name}" breaches the ambience cap (${peak})`).toBeLessThan(0.45);
  }
  // Ambience off must render silence.
  expect(await renderPeak(page, { kind: "scene", name: null })).toBe(0);
});

// Peak alone can't catch a bad mix: ambience is continuous while cues are brief, so
// equal peaks still leave the cues masked. These measure RMS (perceived loudness) and
// assert the two balance relationships that actually matter.
async function mixProfile(page) {
  return page.evaluate(async () => {
    const { createSoundEngine } = await import("/js/audio/sound-engine.js");
    const rms = async (fn, secs, activeSecs) => {
      const off = new OfflineAudioContext(1, 44100 * secs, 44100);
      fn(createSoundEngine({ contextFactory: () => off }));
      const d = (await off.startRendering()).getChannelData(0);
      const n = Math.min(d.length, Math.floor(44100 * (activeSecs || secs)));
      let sum = 0;
      for (let i = 0; i < n; i++) sum += d[i] * d[i];
      return Math.sqrt(sum / n);
    };
    const sfx = {}, amb = {};
    for (const c of ["blue", "yellow", "brown", "green", "red", "gray"]) {
      sfx[c] = await rms((e) => e.placement(c, 1), 1, 0.35);
    }
    for (const s of ["cabin", "summer", "morning"]) {
      amb[s] = await rms((e) => e.setScene(s), 3);   // beds only; timers don't run offline
    }
    return { sfx, amb };
  });
}

test("ambience stays underneath the game, not on top of it", async ({ page }) => {
  await freshGame(page);
  const { sfx, amb } = await mixProfile(page);
  const avg = (o) => Object.values(o).reduce((a, b) => a + b, 0) / Object.values(o).length;
  const ratio = avg(amb) / avg(sfx);
  console.log(`ambience/SFX RMS ratio = ${ratio.toFixed(2)} (sfx ${avg(sfx).toFixed(5)}, amb ${avg(amb).toFixed(5)})`);

  // The bed must be audibly below the cues. Above ~1.0 the cues start getting masked,
  // which is exactly the bug this test was written for.
  expect(ratio, `ambience is too loud relative to cues (${ratio.toFixed(2)}x)`).toBeLessThan(0.9);
  expect(ratio, `ambience is so quiet it may as well be off (${ratio.toFixed(2)}x)`).toBeGreaterThan(0.05);

  // Switching scenes should change the *place*, not the volume.
  const vals = Object.values(amb);
  const spread = Math.max(...vals) / Math.min(...vals);
  expect(spread, `scene loudness spread is ${spread.toFixed(2)}x — switching feels like a volume change`).toBeLessThan(2.2);
});

test("no placement voice is drowned out by its siblings", async ({ page }) => {
  await freshGame(page);
  const { sfx } = await mixProfile(page);
  const vals = Object.values(sfx);
  const spread = Math.max(...vals) / Math.min(...vals);
  const quietest = Object.entries(sfx).sort((a, b) => a[1] - b[1])[0];
  console.log(`voice RMS: ${Object.entries(sfx).map(([k, v]) => `${k}=${v.toFixed(5)}`).join(" ")}`);

  // The 🍃 leaves voice was once ~8x quieter than the rest (a narrow bandpass over pink
  // noise passes almost nothing) — inaudible in practice. Six voices only work as an
  // instrument if you can actually hear all six.
  expect(spread, `voice loudness spread is ${spread.toFixed(1)}x; quietest is "${quietest[0]}"`).toBeLessThan(4);
});

// Phone is the primary platform, and phone speakers roll off steeply below ~500Hz. A
// voice whose energy is all in the fundamental measures fine here but is inaudible in
// the hand — that happened: a bare 147Hz sine kept only 3% of its energy, making the
// loudest laptop voice the quietest phone voice and inverting the whole mix. So every
// voice must carry enough upper-harmonic content to survive a small speaker.
async function phoneProfile(page) {
  return page.evaluate(async () => {
    const { createSoundEngine } = await import("/js/audio/sound-engine.js");
    const render = async (fn) => {
      const off = new OfflineAudioContext(1, 44100, 44100);
      const e = createSoundEngine({ contextFactory: () => off });
      e.setVolume(1); fn(e);
      return (await off.startRendering()).getChannelData(0);
    };
    const energy = (d) => { let s = 0; for (let i = 0; i < d.length; i++) s += d[i] * d[i]; return Math.sqrt(s / d.length); };
    // Two cascaded 500Hz highpasses ≈ 12dB/oct rolloff: a crude but directionally
    // correct stand-in for a phone speaker's low-end response.
    const throughPhone = async (d) => {
      const off = new OfflineAudioContext(1, d.length, 44100);
      const buf = off.createBuffer(1, d.length, 44100);
      buf.getChannelData(0).set(d);
      const src = off.createBufferSource(); src.buffer = buf;
      const a = off.createBiquadFilter(); a.type = "highpass"; a.frequency.value = 500; a.Q.value = 0.7;
      const b = off.createBiquadFilter(); b.type = "highpass"; b.frequency.value = 500; b.Q.value = 0.7;
      src.connect(a); a.connect(b); b.connect(off.destination); src.start(0);
      return (await off.startRendering()).getChannelData(0);
    };
    const out = {};
    const add = async (name, fn) => {
      let f = 0, p = 0;
      const PASSES = 3;   // noise is random per render; averaging keeps this test stable
      for (let i = 0; i < PASSES; i++) {
        const d = await render(fn);
        f += energy(d); p += energy(await throughPhone(d));
      }
      out[name] = { flat: f / PASSES, phone: p / PASSES };
    };
    for (const c of ["blue", "yellow", "brown", "green", "red", "gray"]) await add(c, (e) => e.placement(c, 1));
    for (const cue of ["error", "finishBell", "cardComplete", "gameOver", "cubePlace"]) await add(`cue:${cue}`, (e) => e.cue(cue));
    return out;
  });
}

test("every sound survives a phone speaker (primary platform)", async ({ page }) => {
  await freshGame(page);
  const prof = await phoneProfile(page);
  const rows = Object.entries(prof).map(([k, v]) => `${k}=${(v.phone / v.flat * 100).toFixed(0)}%`);
  console.log(`phone-audible energy: ${rows.join(" ")}`);

  for (const [name, v] of Object.entries(prof)) {
    const kept = v.phone / v.flat;
    // This is a CATASTROPHE guard, not a balance metric: it exists to catch the class of
    // bug where a sound is essentially all fundamental (the mountain voice was at 3%).
    // Don't ratchet it upward — some cues are deliberately deep (the error thud sits near
    // 30% by design), and forcing every sound bright would wreck the palette. Cross-sound
    // balance is asserted by the spread checks instead.
    expect(kept, `"${name}" keeps only ${(kept * 100).toFixed(0)}% of its energy above 500Hz — inaudible on a phone`)
      .toBeGreaterThan(0.22);
  }

  // And the phone-side balance must not be wildly inverted vs the flat balance.
  const voices = ["blue", "yellow", "brown", "green", "red", "gray"];
  const phoneVals = voices.map((c) => prof[c].phone);
  const spread = Math.max(...phoneVals) / Math.min(...phoneVals);
  console.log(`phone voice spread = ${spread.toFixed(2)}x`);
  expect(spread, `on a phone the voices differ by ${spread.toFixed(1)}x — some will be inaudible`).toBeLessThan(4);
});

test("output stays well clear of clipping even at max volume", async ({ page }) => {
  await freshGame(page);
  const peak = await page.evaluate(async () => {
    const { createSoundEngine, OUTPUT_TRIM } = await import("/js/audio/sound-engine.js");
    const run = async (fn) => {
      const off = new OfflineAudioContext(1, 44100 * 2, 44100);
      const e = createSoundEngine({ contextFactory: () => off });
      e.setVolume(1); fn(e);
      const d = (await off.startRendering()).getChannelData(0);
      let p = 0; for (let i = 0; i < d.length; i++) p = Math.max(p, Math.abs(d[i]));
      return p;
    };
    const worst = {};
    for (const c of ["blue", "yellow", "brown", "green", "red", "gray"]) worst[c] = await run((e) => e.placement(c, 1));
    for (const cue of ["gameOver", "finishBell", "cardComplete", "pouchRefill"]) worst[cue] = await run((e) => e.cue(cue));
    // Worst realistic case: ambience running while a cue and a placement land together.
    worst.stacked = await run((e) => { e.setScene("cabin"); e.placement("gray", 1); e.cue("cardComplete"); });
    return { worst, trim: OUTPUT_TRIM };
  });
  const max = Math.max(...Object.values(peak.worst));
  console.log(`OUTPUT_TRIM=${peak.trim}  worst peak=${max.toFixed(3)} (stacked=${peak.worst.stacked.toFixed(3)})`);
  // Loud enough to be usable on a phone, with real headroom left for overlaps.
  expect(max, `worst peak ${max.toFixed(3)} risks clipping`).toBeLessThan(0.8);
  expect(max, `worst peak ${max.toFixed(3)} is too quiet for a phone speaker`).toBeGreaterThan(0.1);
});

test("board persists across a reload (touch-and-go)", async ({ page }) => {
  await freshGame(page);
  for (let i = 0; i < 3; i++) await placeOneToken(page);
  const filled = await page.locator("#hex-grid-container .hex-cell:not([data-terrain='empty'])").count();
  expect(filled).toBe(3);

  // Reload WITHOUT clearing storage — the auto-saved board must come back.
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#score-total-sidebar")).toBeVisible();
  const filledAfterReload = await page.locator("#hex-grid-container .hex-cell:not([data-terrain='empty'])").count();
  expect(filledAfterReload).toBe(3);
  await expect(page.locator("#game-message")).toContainText("Resumed");
});
