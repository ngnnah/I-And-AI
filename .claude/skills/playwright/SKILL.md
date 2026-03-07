---
name: playwright
description: This skill should be used when the user asks to "run playwright tests", "e2e test", "browser test", "test the UI", "check UI/UX with playwright", or wants to run automated browser tests against a game or web app.
---

# /playwright

Run Playwright end-to-end tests against a game or web app to check UI/UX.

## Instructions

1. Check if `@playwright/test` is installed in the target project. If not, run:

   ```bash
   npm install --save-dev @playwright/test
   npx playwright install chromium
   ```

2. Create `playwright.config.js` in the project root (or locate existing one).

3. Locate or create `tests/ui.spec.js` for E2E tests.

4. **Multi-player games** require multiple browser contexts to simulate real players:
   - Use `browser.newContext()` to create an isolated context per player (separate localStorage)
   - Each context has its own page, player name, and game state
   - Sequence: host creates game → get room code → each other player joins by code → host starts
   - Always clean up with `ctx.close()` in a `finally` block

5. **Critical: wait for JS modules before interacting**
   - Apps using dynamic `import()` (e.g. `initializeApp` → `Promise.all([import(...)])`) may show
     HTML elements before their click listeners are registered
   - Always use `page.reload({ waitUntil: 'networkidle' })` after clearing localStorage
     so all module imports finish before the test clicks any buttons
   - Without this, buttons appear clickable but event handlers aren't attached yet

6. Run the tests:

   ```bash
   npx playwright test tests/ui.spec.js --reporter=list
   ```

7. If tests fail, read the error output:
   - Selector not found → check element IDs match the HTML
   - Element visible but click does nothing → JS modules not loaded yet (use `networkidle`)
   - Timeout in multi-player test → Firebase operation taking time, increase test timeout

8. Report: list passing tests, failing tests with root cause, suggested fixes.

## Example: Multi-Player Flow Setup

```javascript
test("3 players can join and start game", async ({ browser }) => {
  const ctxHost = await browser.newContext();
  const ctxP2 = await browser.newContext();
  const ctxP3 = await browser.newContext();
  const host = await ctxHost.newPage();
  const p2 = await ctxP2.newPage();
  const p3 = await ctxP3.newPage();

  try {
    await goToGameRoom(host, "HostPlayer"); // host creates
    const code = await getRoomCode(host);

    await goToLobby(p2, "Player2");
    await p2.locator("#join-code-input").fill(code);
    await p2.locator("#join-code-btn").click();

    await goToLobby(p3, "Player3");
    await p3.locator("#join-code-input").fill(code);
    await p3.locator("#join-code-btn").click();

    await host.locator("#start-game-btn").click();
    for (const p of [host, p2, p3]) {
      await expect(p.locator("#game-phase-playing")).toBeVisible({
        timeout: 15000,
      });
    }
  } finally {
    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  }
});
```

## Tips

- Use `page.reload({ waitUntil: 'networkidle' })` in setup helpers — not `'load'`
- For Firebase-backed apps, game creation/joining requires real network calls (1–3s)
- Use `test.setTimeout(120000)` for multi-player tests
- Keep `workers: 1` in config so Firebase game state remains predictable
- Test the "fold without bidding" path explicitly — it's a common UX regression point
