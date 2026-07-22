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
  await page.locator("#hex-grid-container .hex.empty").first().click();
}

test("loads without console errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await freshGame(page);
  expect(errors, `page errors: ${errors.join("; ")}`).toEqual([]);
});

test("End Turn button is docked under the board (inside <main>)", async ({ page }) => {
  await freshGame(page);
  await expect(page.locator("main #end-turn-btn")).toBeVisible();
  // The old full-width bottom bar is gone; the hint mentions the shortcut.
  await expect(page.locator("main")).toContainText("press N");
});

test("N key ends the turn (keyboard shortcut)", async ({ page }) => {
  await freshGame(page);
  for (let i = 0; i < 3; i++) await placeOneToken(page);
  await page.keyboard.press("n");
  await expect(page.locator("#game-message")).toContainText("Turn complete");
  await expect(page).toHaveURL(/index\.html/);
});

test("can place 3 tokens and end a turn", async ({ page }) => {
  await freshGame(page);
  const filledBefore = await page.locator("#hex-grid-container .hex:not(.empty)").count();

  for (let i = 0; i < 3; i++) await placeOneToken(page);

  const filledAfter = await page.locator("#hex-grid-container .hex:not(.empty)").count();
  expect(filledAfter).toBe(filledBefore + 3);

  await page.locator("#end-turn-btn").click();
  // A fresh set of tokens should be available for the next turn.
  await expect(page.locator('.token[data-space="0"] >> visible=true').first()).toBeVisible();
});

test("placing a token auto-selects the next one, arrows switch it", async ({ page }) => {
  await freshGame(page);
  // Place the first token (this commits the active space).
  await page.locator('.token[data-space="0"] >> visible=true').first().click();
  await page.locator("#hex-grid-container .hex.empty").first().click();

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
  expect(await page.locator("#hex-grid-container .hex:not(.empty)").count()).toBe(3);

  page.once("dialog", (d) => d.accept()); // confirm "start a new game?"
  await page.locator("#new-game-btn").click();
  await page.waitForLoadState("networkidle");

  // Board must be empty and NOT show the "Resumed" message.
  expect(await page.locator("#hex-grid-container .hex:not(.empty)").count()).toBe(0);
  await expect(page.locator("#game-message")).not.toContainText("Resumed");
});

test("board persists across a reload (touch-and-go)", async ({ page }) => {
  await freshGame(page);
  for (let i = 0; i < 3; i++) await placeOneToken(page);
  const filled = await page.locator("#hex-grid-container .hex:not(.empty)").count();
  expect(filled).toBe(3);

  // Reload WITHOUT clearing storage — the auto-saved board must come back.
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#score-total-sidebar")).toBeVisible();
  const filledAfterReload = await page.locator("#hex-grid-container .hex:not(.empty)").count();
  expect(filledAfterReload).toBe(3);
  await expect(page.locator("#game-message")).toContainText("Resumed");
});
