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
      expect(peak, `${color} h${height} is too loud (${peak})`).toBeLessThan(0.2);
    }
  }
});

test("every event cue renders an audible signal", async ({ page }) => {
  await freshGame(page);
  const cues = ["tokenSelect", "cubePlace", "cardComplete", "error", "turnEnd", "pouchRefill", "finishBell", "gameOver"];
  for (const name of cues) {
    const peak = await renderPeak(page, { kind: "cue", name }, 2);
    expect(peak, `cue "${name}" was silent`).toBeGreaterThan(0.0005);
    expect(peak, `cue "${name}" is too loud (${peak})`).toBeLessThan(0.2);
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
    expect(peak, `scene "${name}" breaches the ambience cap (${peak})`).toBeLessThan(0.12);
  }
  // Ambience off must render silence.
  expect(await renderPeak(page, { kind: "scene", name: null })).toBe(0);
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
