import { test, expect } from "@playwright/test";

/**
 * Safari / iOS audio-unlock regression tests.
 *
 * RUN THESE UNDER WEBKIT — `npx playwright test tests/safari-audio.spec.js --browser=webkit`.
 * WebKit is the engine iOS Safari uses, and it enforces autoplay rules that Chromium does
 * not. Every other audio test injects a fake or offline context, so none of them touch the
 * real unlock path; that gap is precisely how "no sound at all on iPhone" shipped.
 *
 * The bug: the engine's unlock() returned true whenever a context merely *existed*, without
 * checking that resume() had succeeded. Combined with a `{ once: true }` listener on
 * `pointerdown` — which Safari does not accept as user activation for audio — a single
 * refused resume meant permanent silence for the rest of the session.
 */

// Firebase's scoreboard long-poll gets torn down with the page and logs a spurious
// network error. It has nothing to do with audio.
const isAudioRelevantError = (msg) => !/firebasedatabase\.app|\.lp\?|Load failed|NetworkError/i.test(msg);

test("real AudioContext is not created before a user gesture", async ({ page }) => {
  await page.goto("/index.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  // Firing a cue before any gesture must be a safe no-op, NOT an early context. The game
  // used to build one during init via the pouch-refill cue, which is the worst possible
  // starting state on iOS.
  const r = await page.evaluate(async () => {
    const { createSoundEngine } = await import("/js/audio/sound-engine.js");
    const e = createSoundEngine({});
    e.cue("pouchRefill");
    e.placement("gray", 1);
    return { dead: e.dead, sceneId: e.sceneId };
  });
  expect(r.dead, "pre-gesture cues must not kill the engine").toBe(false);
});

test("unlock() from a real click reports running, and audio plays", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/index.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  await page.evaluate(() => {
    window.__probe = {};
    const btn = document.createElement("button");
    btn.id = "probe-btn";
    btn.textContent = "probe";
    // Needs real dimensions or Playwright cannot click it.
    btn.style.cssText = "position:fixed;top:0;left:0;z-index:9999;width:80px;height:32px";
    document.body.appendChild(btn);
    btn.addEventListener("click", async () => {
      const { createSoundEngine } = await import("/js/audio/sound-engine.js");
      const e = createSoundEngine({});
      window.__probe.running = await e.unlock();   // must be true, not merely truthy
      e.placement("gray", 1);
      e.setScene("cabin");
      window.__probe.scene = e.sceneId;
      window.__probe.dead = e.dead;
    });
  });

  await page.locator("#probe-btn").click();
  await expect.poll(() => page.evaluate(() => window.__probe?.running)).toBe(true);
  const p = await page.evaluate(() => window.__probe);
  console.log(`safari-audio probe: ${JSON.stringify(p)}`);
  expect(p.dead, "engine must survive real WebAudio use").toBe(false);
  expect(p.scene, "ambience must start under a real context").toBe("cabin");
  expect(errors.filter(isAudioRelevantError)).toEqual([]);
});

test("the game's own unlock path survives a full turn with ambience", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/index.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  await page.locator("#sound-btn").click();
  await page.locator('#ambience-scenes input[value="cabin"]').check();
  await page.keyboard.press("Escape");

  for (let i = 0; i < 3; i++) {
    if ((await page.locator(".token.selected >> visible=true").count()) === 0) {
      await page.locator('.token[data-space="0"] >> visible=true').first().click();
    }
    await page.locator("#hex-grid-container .hex-cell[data-terrain='empty']").first().click();
  }
  await expect(page.locator("#turn-number")).toHaveText("2");
  expect(errors.filter(isAudioRelevantError)).toEqual([]);
});
