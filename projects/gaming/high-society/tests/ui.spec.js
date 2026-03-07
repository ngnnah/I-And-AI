// @ts-check
import { test, expect, chromium } from '@playwright/test';

const BASE_URL = 'https://ngnnah.github.io/I-And-AI/projects/gaming/high-society/';
// Firebase SDK + dynamic module imports cold-start from CDN can take 10–15s
const NAV_TIMEOUT = 20000;

/** Navigate to setup screen with clean state */
async function goToSetup(page) {
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.removeItem('highSocietyPlayer'));
  // waitUntil: 'networkidle' ensures all dynamic imports (player-setup.js, lobby.js,
  // game-room.js) have finished loading before we interact. Without this, the setup
  // screen appears visible (no 'hidden' class in HTML) before the click listener
  // on #setup-continue-btn is registered, causing Continue clicks to do nothing.
  await page.reload({ waitUntil: 'networkidle', timeout: NAV_TIMEOUT });
  await expect(page.locator('#screen-player-setup')).toBeVisible({ timeout: 5000 });
}

/** Navigate to lobby as the given player name */
async function goToLobby(page, name = 'TestPlayer') {
  await goToSetup(page);
  await page.locator('#player-name-input').fill(name);
  await page.locator('#setup-continue-btn').click();
  // navigateTo('lobby') is synchronous — lobby appears within milliseconds of click
  await expect(page.locator('#screen-lobby')).toBeVisible({ timeout: 5000 });
}

/** Create a game room and return the room code */
async function goToGameRoom(page, name = 'Host') {
  await goToLobby(page, name);
  await page.locator('#create-game-btn').click();
  await expect(page.locator('#screen-game-room')).toBeVisible({ timeout: NAV_TIMEOUT }); // Firebase createGame
}

/** Get the room code shown in game room */
async function getRoomCode(page) {
  const code = await page.locator('#game-code-badge').textContent({ timeout: NAV_TIMEOUT });
  return code?.trim() || '';
}

// ────────────────────────────────────────────────────────
// Player Setup Screen
// ────────────────────────────────────────────────────────

test.describe('Player Setup Screen', () => {
  test('shows setup screen on first visit', async ({ page }) => {
    await goToSetup(page);
    await expect(page.locator('#screen-player-setup')).toBeVisible();
    await expect(page.locator('#player-name-input')).toBeVisible();
    await expect(page.locator('#setup-continue-btn')).toBeVisible();
  });

  test('shows error for empty name', async ({ page }) => {
    await goToSetup(page);
    await page.locator('#setup-continue-btn').click();
    const err = page.locator('#setup-error');
    await expect(err).toBeVisible({ timeout: 3000 });
    const text = await err.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('shows error for single-character name', async ({ page }) => {
    await goToSetup(page);
    await page.locator('#player-name-input').fill('A');
    await page.locator('#setup-continue-btn').click();
    await expect(page.locator('#setup-error')).toBeVisible({ timeout: 3000 });
  });

  test('advances to lobby with valid name', async ({ page }) => {
    await goToSetup(page);
    await page.locator('#player-name-input').fill('Alice');
    await page.locator('#setup-continue-btn').click();
    await expect(page.locator('#screen-lobby')).toBeVisible({ timeout: NAV_TIMEOUT });
    await expect(page.locator('#screen-player-setup')).toHaveClass(/hidden/);
  });

  test('advances to lobby via Enter key', async ({ page }) => {
    await goToSetup(page);
    await page.locator('#player-name-input').fill('Bob');
    await page.locator('#player-name-input').press('Enter');
    await expect(page.locator('#screen-lobby')).toBeVisible({ timeout: NAV_TIMEOUT });
  });
});

// ────────────────────────────────────────────────────────
// Lobby Screen
// ────────────────────────────────────────────────────────

test.describe('Lobby Screen', () => {
  test('shows player name in lobby header', async ({ page }) => {
    await goToLobby(page, 'ShouldAppear');
    await expect(page.locator('#lobby-player-name')).toContainText('ShouldAppear');
  });

  test('shows create game, join code, active games sections', async ({ page }) => {
    await goToLobby(page);
    await expect(page.locator('#create-game-btn')).toBeVisible();
    await expect(page.locator('#join-code-input')).toBeVisible();
    await expect(page.locator('#join-code-btn')).toBeVisible();
    await expect(page.locator('#lobby-games-list')).toBeVisible();
  });

  test('shows error for empty join code', async ({ page }) => {
    await goToLobby(page);
    await page.locator('#join-code-btn').click();
    await expect(page.locator('#join-error')).not.toHaveClass(/hidden/, { timeout: 3000 });
  });

  test('shows error for non-existent room code', async ({ page }) => {
    await goToLobby(page);
    await page.locator('#join-code-input').fill('XXXXXX');
    await page.locator('#join-code-btn').click();
    await expect(page.locator('#join-error')).not.toHaveClass(/hidden/, { timeout: NAV_TIMEOUT });
  });

  test('change name button returns to setup screen', async ({ page }) => {
    await goToLobby(page);
    await page.locator('#lobby-change-name-btn').click();
    await expect(page.locator('#screen-player-setup')).toBeVisible({ timeout: 3000 });
  });

  test('create game button navigates to game room', async ({ page }) => {
    await goToLobby(page);
    await page.locator('#create-game-btn').click();
    await expect(page.locator('#screen-game-room')).toBeVisible({ timeout: NAV_TIMEOUT });
  });
});

// ────────────────────────────────────────────────────────
// Game Room — Lobby Phase
// ────────────────────────────────────────────────────────

test.describe('Game Room — Lobby Phase', () => {
  test.setTimeout(60000);

  test('shows game title and room code badge', async ({ page }) => {
    await goToGameRoom(page);
    await expect(page.locator('.game-title')).toBeVisible();
    await expect(page.locator('#game-code-badge')).toBeVisible();
    const code = await page.locator('#game-code-badge').textContent();
    expect(code?.trim().length).toBeGreaterThanOrEqual(4);
  });

  test('shows waiting room with player list and room code', async ({ page }) => {
    await goToGameRoom(page);
    await expect(page.locator('#game-phase-lobby')).toBeVisible();
    await expect(page.locator('#waiting-code')).toBeVisible();
    await expect(page.locator('#waiting-players')).toBeVisible();
  });

  test('start game button is hidden with only 1 player', async ({ page }) => {
    await goToGameRoom(page);
    const startBtn = page.locator('#start-game-btn');
    const isHidden = await startBtn.evaluate(el => el.classList.contains('hidden'));
    const isDisabled = await startBtn.isDisabled().catch(() => true);
    expect(isHidden || isDisabled).toBe(true);
  });

  test('back button returns to lobby', async ({ page }) => {
    await goToGameRoom(page);
    await page.locator('#game-back-btn').click();
    await expect(page.locator('#screen-lobby')).toBeVisible({ timeout: 5000 });
  });
});

// ────────────────────────────────────────────────────────
// Multi-Player Game Flow (3 browser contexts)
// ────────────────────────────────────────────────────────

test.describe('Multi-Player Game Flow', () => {
  test.setTimeout(120000); // 3 players joining + starting game needs time

  test('3 players can join a room and host can start the game', async ({ browser }) => {
    // Launch 3 isolated browser contexts (separate localStorage each)
    const ctxHost  = await browser.newContext();
    const ctxP2    = await browser.newContext();
    const ctxP3    = await browser.newContext();

    const host = await ctxHost.newPage();
    const p2   = await ctxP2.newPage();
    const p3   = await ctxP3.newPage();

    try {
      // ── Host creates game ──────────────────────────────
      await goToGameRoom(host, 'HostPlayer');
      const roomCode = await getRoomCode(host);
      expect(roomCode.length).toBeGreaterThanOrEqual(4);

      // ── Player 2 joins ────────────────────────────────
      await goToLobby(p2, 'Player2');
      await p2.locator('#join-code-input').fill(roomCode);
      await p2.locator('#join-code-btn').click();
      await expect(p2.locator('#screen-game-room')).toBeVisible({ timeout: NAV_TIMEOUT });

      // ── Player 3 joins ────────────────────────────────
      await goToLobby(p3, 'Player3');
      await p3.locator('#join-code-input').fill(roomCode);
      await p3.locator('#join-code-btn').click();
      await expect(p3.locator('#screen-game-room')).toBeVisible({ timeout: NAV_TIMEOUT });

      // ── Host sees 3 players and Start Game button ─────
      const waitingPlayers = host.locator('#waiting-players');
      await expect(waitingPlayers).toContainText('HostPlayer', { timeout: NAV_TIMEOUT });
      await expect(waitingPlayers).toContainText('Player2',    { timeout: NAV_TIMEOUT });
      await expect(waitingPlayers).toContainText('Player3',    { timeout: NAV_TIMEOUT });

      const startBtn = host.locator('#start-game-btn');
      await expect(startBtn).not.toHaveClass(/hidden/, { timeout: NAV_TIMEOUT });

      // ── Host starts game ──────────────────────────────
      await startBtn.click();

      // ── All players see the bidding phase ─────────────
      for (const p of [host, p2, p3]) {
        await expect(p.locator('#game-phase-playing')).toBeVisible({ timeout: NAV_TIMEOUT });
      }

      // ── Bidding phase UI checks (host) ────────────────
      await expect(host.locator('#current-card')).toBeVisible();
      await expect(host.locator('#my-hand-cards')).toBeVisible();
      await expect(host.locator('#all-bids-panel')).toBeVisible();
      await expect(host.locator('#my-panel')).toBeVisible();

      // ── Active bidder has action buttons visible ───────
      // Find which player is the active bidder
      let activePage = null;
      for (const p of [host, p2, p3]) {
        const actionsVisible = await p.locator('#my-actions').isVisible().catch(() => false);
        if (actionsVisible) { activePage = p; break; }
      }
      expect(activePage, 'One player should have action buttons visible').not.toBeNull();

      if (activePage) {
        // Fold/pass button should be enabled (not disabled)
        const foldBtn = activePage.locator('#fold-pass-btn');
        await expect(foldBtn).toBeVisible();
        await expect(foldBtn).not.toBeDisabled();

        // Confirm bid button exists
        await expect(activePage.locator('#confirm-bid-btn')).toBeVisible();

        // Money cards are visible in hand
        await expect(activePage.locator('#my-hand-cards')).toBeVisible();
      }

    } finally {
      await ctxHost.close();
      await ctxP2.close();
      await ctxP3.close();
    }
  });

  test('active bidder can select money card and confirm bid', async ({ browser }) => {
    const ctxHost = await browser.newContext();
    const ctxP2   = await browser.newContext();
    const ctxP3   = await browser.newContext();

    const host = await ctxHost.newPage();
    const p2   = await ctxP2.newPage();
    const p3   = await ctxP3.newPage();

    try {
      await goToGameRoom(host, 'BidHost');
      const roomCode = await getRoomCode(host);

      await goToLobby(p2, 'BidP2');
      await p2.locator('#join-code-input').fill(roomCode);
      await p2.locator('#join-code-btn').click();
      await expect(p2.locator('#screen-game-room')).toBeVisible({ timeout: NAV_TIMEOUT });

      await goToLobby(p3, 'BidP3');
      await p3.locator('#join-code-input').fill(roomCode);
      await p3.locator('#join-code-btn').click();
      await expect(p3.locator('#screen-game-room')).toBeVisible({ timeout: NAV_TIMEOUT });

      await expect(host.locator('#start-game-btn')).not.toHaveClass(/hidden/, { timeout: NAV_TIMEOUT });
      await host.locator('#start-game-btn').click();

      for (const p of [host, p2, p3]) {
        await expect(p.locator('#game-phase-playing')).toBeVisible({ timeout: NAV_TIMEOUT });
      }

      // Find the active bidder
      let activePage = null;
      for (const p of [host, p2, p3]) {
        const visible = await p.locator('#my-actions').isVisible().catch(() => false);
        if (visible) { activePage = p; break; }
      }

      if (activePage) {
        const moneyCards = activePage.locator('#my-hand-cards .money-card');
        const cardCount = await moneyCards.count();
        expect(cardCount).toBeGreaterThan(0);

        // Click the first money card to stage it
        await moneyCards.first().click();

        // Confirm bid button should now be enabled
        await expect(activePage.locator('#confirm-bid-btn')).not.toBeDisabled({ timeout: 3000 });

        // Submit the bid
        await activePage.locator('#confirm-bid-btn').click();

        // After bidding, next player's turn — our actions should be hidden
        await expect(activePage.locator('#my-actions')).toBeHidden({ timeout: NAV_TIMEOUT });
      }
    } finally {
      await ctxHost.close();
      await ctxP2.close();
      await ctxP3.close();
    }
  });

  test('active bidder can fold without selecting any cards', async ({ browser }) => {
    const ctxHost = await browser.newContext();
    const ctxP2   = await browser.newContext();
    const ctxP3   = await browser.newContext();

    const host = await ctxHost.newPage();
    const p2   = await ctxP2.newPage();
    const p3   = await ctxP3.newPage();

    try {
      await goToGameRoom(host, 'FoldHost');
      const roomCode = await getRoomCode(host);

      await goToLobby(p2, 'FoldP2');
      await p2.locator('#join-code-input').fill(roomCode);
      await p2.locator('#join-code-btn').click();
      await expect(p2.locator('#screen-game-room')).toBeVisible({ timeout: NAV_TIMEOUT });

      await goToLobby(p3, 'FoldP3');
      await p3.locator('#join-code-input').fill(roomCode);
      await p3.locator('#join-code-btn').click();
      await expect(p3.locator('#screen-game-room')).toBeVisible({ timeout: NAV_TIMEOUT });

      await expect(host.locator('#start-game-btn')).not.toHaveClass(/hidden/, { timeout: NAV_TIMEOUT });
      await host.locator('#start-game-btn').click();

      for (const p of [host, p2, p3]) {
        await expect(p.locator('#game-phase-playing')).toBeVisible({ timeout: NAV_TIMEOUT });
      }

      // Find the active bidder
      let activePage = null;
      for (const p of [host, p2, p3]) {
        const visible = await p.locator('#my-actions').isVisible().catch(() => false);
        if (visible) { activePage = p; break; }
      }

      if (activePage) {
        const foldBtn = activePage.locator('#fold-pass-btn');
        await expect(foldBtn).not.toBeDisabled();

        // Fold without selecting any cards (key UX fix verified)
        await foldBtn.click();

        // After folding, our actions disappear and next player gets turn
        await expect(activePage.locator('#my-actions')).toBeHidden({ timeout: NAV_TIMEOUT });
      }
    } finally {
      await ctxHost.close();
      await ctxP2.close();
      await ctxP3.close();
    }
  });
});

// ────────────────────────────────────────────────────────
// UI Elements and Layout
// ────────────────────────────────────────────────────────

test.describe('UI Elements and Layout', () => {
  test('page has correct title', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/High Society/i);
  });

  test('setup screen has crest and 3–5 player hint', async ({ page }) => {
    await goToSetup(page);
    await expect(page.locator('.setup-crest')).toBeVisible();
    await expect(page.locator('.setup-subtitle')).toContainText('3');
  });

  test('lobby has 4 sections', async ({ page }) => {
    await goToLobby(page, 'LayoutTest');
    const sections = page.locator('.lobby-section');
    await expect(sections).toHaveCount(4);
  });

  test('no horizontal scroll on mobile (390px)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14
    await goToSetup(page);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});

// ────────────────────────────────────────────────────────
// Accessibility
// ────────────────────────────────────────────────────────

test.describe('Accessibility', () => {
  test('name input has associated label', async ({ page }) => {
    await goToSetup(page);
    await expect(page.locator('label[for="player-name-input"]')).toBeVisible();
  });

  test('error message shown for invalid name with visible text', async ({ page }) => {
    await goToSetup(page);
    // Ensure input is empty
    await page.locator('#player-name-input').fill('');
    await page.locator('#setup-continue-btn').click();
    const err = page.locator('#setup-error');
    await expect(err).toBeVisible({ timeout: 3000 });
    const text = await err.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('all visible buttons on lobby screen have accessible label', async ({ page }) => {
    await goToLobby(page, 'A11yTest');
    const buttons = await page.locator('button:visible').all();
    const unlabelled = [];
    for (const btn of buttons) {
      const text      = (await btn.textContent())?.trim()          || '';
      const title     = (await btn.getAttribute('title'))?.trim()  || '';
      const ariaLabel = (await btn.getAttribute('aria-label'))?.trim() || '';
      if (!text && !title && !ariaLabel) {
        unlabelled.push(await btn.evaluate(el => el.outerHTML));
      }
    }
    expect(unlabelled, `Buttons missing accessible label:\n${unlabelled.join('\n')}`).toHaveLength(0);
  });

  test('game back button has title attribute', async ({ page }) => {
    test.setTimeout(60000);
    await goToGameRoom(page, 'A11yGame');
    const title = await page.locator('#game-back-btn').getAttribute('title');
    expect(title?.trim().length).toBeGreaterThan(0);
  });
});
