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
