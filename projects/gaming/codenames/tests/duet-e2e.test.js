import { test, expect } from '@playwright/test';

/**
 * Duet Mode E2E Tests - Multiplayer Flow
 * 
 * Tests the actual multiplayer behavior with 2 browser contexts simulating 2 players.
 * Validates turn switching, card reveal logic, and color map usage.
 */

test.describe('Duet Mode - 2 Player Multiplayer', () => {
  let roomCode;

  test('Complete turn cycle: P1 clue → P2 guess → P2 clue → P1 guess', async ({ browser }) => {
    // Create 2 browser contexts (simulate 2 players)
    const p1Context = await browser.newContext();
    const p2Context = await browser.newContext();
    
    const p1Page = await p1Context.newPage();
    const p2Page = await p2Context.newPage();

    // Enable console logging for debugging
    p1Page.on('console', msg => console.log(`[P1] ${msg.text()}`));
    p2Page.on('console', msg => console.log(`[P2] ${msg.text()}`));
    
    // Debug: Log page errors
    p1Page.on('pageerror', err => console.error(`[P1 ERROR] ${err.message}`));
    p2Page.on('pageerror', err => console.error(`[P2 ERROR] ${err.message}`));
    
    // Debug: Log navigation
    p1Page.on('load', () => console.log(`[P1] Page loaded: ${p1Page.url()}`));
    p2Page.on('load', () => console.log(`[P2] Page loaded: ${p2Page.url()}`));

    try {
      // === SETUP PHASE ===
      console.log('\n=== SETUP: Creating Duet game ===');
      
      // P1: Navigate and wait for page to be ready
      const gameURL = 'https://ngnnah.github.io/I-And-AI/projects/gaming/codenames/';
      console.log(`[P1] Navigating to: ${gameURL}`);
      await p1Page.goto(gameURL, { waitUntil: 'load' });
      console.log(`[P1] Current URL: ${p1Page.url()}`);
      
      // Wait for player name input to be visible
      console.log('[P1] Waiting for player name input...');
      await p1Page.waitForSelector('#player-name-input', { state: 'visible', timeout: 10000 });
      await p1Page.waitForTimeout(500); // Wait for page to fully settle
      console.log('[P1] Player name input found!');
      
      await p1Page.fill('#player-name-input', 'Player 1');
      await p1Page.waitForTimeout(300); // Let input register
      await p1Page.press('#player-name-input', 'Enter'); // Press Enter to submit
      await p1Page.waitForTimeout(500); // Wait for transition
      await p1Page.waitForSelector('#screen-lobby', { state: 'visible', timeout: 10000 });
      console.log('[P1] Lobby screen visible');
      
      // P1: Select Duet mode and create game
      await p1Page.click('input[name="game-mode"][value="duet"]');
      console.log('[P1] Duet mode selected');
      await p1Page.waitForTimeout(300);
      await p1Page.click('#btn-create-game');
      console.log('[P1] Create game clicked');
      await p1Page.waitForTimeout(1000); // Wait for Firebase room creation
      
      // Wait for game room
      await p1Page.waitForSelector('#screen-game-room', { state: 'visible', timeout: 10000 });
      console.log('[P1] Game room visible');
      roomCode = await p1Page.locator('#game-code').textContent();
      console.log(`✅ Room created: ${roomCode}`);
      
      // P2: Enter name and join the game
      console.log('\n[P2] Navigating to homepage...');
      await p2Page.goto(gameURL, { waitUntil: 'load' });
      console.log(`[P2] Current URL: ${p2Page.url()}`);
      
      console.log('[P2] Waiting for player name input...');
      await p2Page.waitForSelector('#player-name-input', { state: 'visible', timeout: 10000 });
      await p2Page.waitForTimeout(500); // Wait for page to fully settle
      console.log('[P2] Player name input found!');
      
      await p2Page.fill('#player-name-input', 'Player 2');
      await p2Page.waitForTimeout(300); // Let input register
      await p2Page.press('#player-name-input', 'Enter'); // Press Enter to submit
      await p2Page.waitForTimeout(500); // Wait for transition
      await p2Page.waitForSelector('#screen-lobby', { state: 'visible', timeout: 10000 });
      console.log('[P2] Lobby screen visible');
      
      await p2Page.fill('#join-code-input', roomCode);
      console.log(`[P2] Entered room code: ${roomCode}`);
      await p2Page.waitForTimeout(300);
      await p2Page.click('#btn-join-code');
      console.log('[P2] Join button clicked');
      await p2Page.waitForTimeout(1000); // Wait for Firebase join
      
      // Wait for P2 to see the game room
      await p2Page.waitForSelector('#screen-game-room', { state: 'visible', timeout: 10000 });
      console.log('[P2] Game room visible');
      
      console.log('\n✅ Both players joined');
      
      // P1 starts the game (host)
      const startButton = p1Page.locator('button:has-text("Start Game")');
      await startButton.waitFor({ state: 'visible', timeout: 5000 });
      console.log('[P1] Start button found');
      await p1Page.waitForTimeout(500);
      await startButton.click();
      console.log('[P1] Start button clicked');
      await p1Page.waitForTimeout(1500); // Wait for game to start and board to generate
      
      // Wait for game board to appear for both players
      await p1Page.waitForSelector('#game-board', { state: 'visible', timeout: 10000 });
      await p2Page.waitForSelector('#game-board', { state: 'visible', timeout: 10000 });
      
      console.log('Game started - board visible');
      
      // === TURN 1: P1 GIVES CLUE ===
      console.log('\n=== TURN 1: P1 gives clue ===');
      
      // P1 should see clue form (P1's turn to give clue)
      await expect(p1Page.locator('#clue-form')).toBeVisible({ timeout: 5000 });
      
      // P2 should NOT see clue form (waiting for P1)
      await expect(p2Page.locator('#clue-form')).not.toBeVisible();
      
      // P1 gives a clue
      await p1Page.fill('input#clue-word', 'ANIMAL');
      await p1Page.fill('input#clue-number', '2');
      await p1Page.click('button#submit-clue');
      
      await p1Page.waitForTimeout(2000); // Wait for Firebase sync
      
      // After P1 gives clue: currentPlayer should switch to P2 (P2 guesses)
      console.log('Checking after P1 clue: P2 should be guessing...');
      
      // === TURN 2: P2 GUESSES ===
      console.log('\n=== TURN 2: P2 guesses ===');
      
      // P2 should see "Start Guessing" button
      await expect(p2Page.locator('button:has-text("Start Guessing")')).toBeVisible({ timeout: 5000 });
      await p2Page.click('button:has-text("Start Guessing")');
      
      // P2 clicks a card (first card for simplicity)
      const cards = p2Page.locator('.card');
      const firstCard = cards.first();
      await firstCard.click();
      
      await p2Page.waitForTimeout(2000); // Wait for Firebase sync
      
      // After P2 guesses: currentPlayer should STAY as P2 (P2 gives next clue)
      // This is the BUG: it was switching to P1 instead
      console.log('Checking after P2 guess: P2 should give next clue (turn should NOT switch to P1)');
      
      // === TURN 3: P2 GIVES CLUE ===
      console.log('\n=== TURN 3: P2 gives clue ===');
      
      // P2 should see clue form (P2's turn to give clue)
      await expect(p2Page.locator('#clue-form')).toBeVisible({ timeout: 5000 });
      
      // P1 should NOT see clue form (waiting for P2)
      await expect(p1Page.locator('#clue-form')).not.toBeVisible();
      
      // P2 gives a clue
      await p2Page.fill('input#clue-word', 'COLOR');
      await p2Page.fill('input#clue-number', '1');
      await p2Page.click('button#submit-clue');
      
      await p2Page.waitForTimeout(2000); // Wait for Firebase sync
      
      // After P2 gives clue: currentPlayer should switch to P1 (P1 guesses)
      console.log('Checking after P2 clue: P1 should be guessing...');
      
      // === TURN 4: P1 GUESSES ===
      console.log('\n=== TURN 4: P1 guesses ===');
      
      // P1 should see "Start Guessing" button
      await expect(p1Page.locator('button:has-text("Start Guessing")')).toBeVisible({ timeout: 5000 });
      await p1Page.click('button:has-text("Start Guessing")');
      
      // P1 clicks a card (second card to avoid clicking same as P2)
      const p1Cards = p1Page.locator('.card');
      await p1Cards.nth(1).click();
      
      await p1Page.waitForTimeout(2000); // Wait for Firebase sync
      
      // After P1 guesses: currentPlayer should STAY as P1 (P1 gives next clue)
      console.log('Checking after P1 guess: P1 should give next clue (turn should NOT switch to P2)');
      
      // === VERIFY FINAL STATE: P1 gives next clue ===
      console.log('\n=== VERIFY: P1 should give next clue (cycle repeats) ===');
      
      // P1 should see clue form again
      await expect(p1Page.locator('#clue-form')).toBeVisible({ timeout: 5000 });
      
      // P2 should NOT see clue form
      await expect(p2Page.locator('#clue-form')).not.toBeVisible();
      
      console.log('✅ Turn cycle validated: P1clue → P2guess → P2clue → P1guess → P1clue');
      
    } finally {
      // Cleanup
      await p1Context.close();
      await p2Context.close();
    }
  });

  test('Card reveals use clue giver\'s color map (not guesser\'s)', async ({ browser }) => {
    // Create 2 browser contexts
    const p1Context = await browser.newContext();
    const p2Context = await browser.newContext();
    
    const p1Page = await p1Context.newPage();
    const p2Page = await p2Context.newPage();

    // Capture console logs to verify color map usage
    const p2Logs = [];
    p1Page.on('console', msg => console.log(`[P1] ${msg.text()}`));
    p2Page.on('console', msg => {
      const text = msg.text();
      p2Logs.push(text);
      console.log(`[P2] ${text}`);
    });
    
    p1Page.on('pageerror', err => console.error(`[P1 ERROR] ${err.message}`));
    p2Page.on('pageerror', err => console.error(`[P2 ERROR] ${err.message}`));

    try {
      // Setup: Create and join Duet game (similar to above)
      console.log('\n=== SETUP: Creating Duet game for color map test ===');
      
      const gameURL = 'https://ngnnah.github.io/I-And-AI/projects/gaming/codenames/';
      console.log(`[P1] Navigating to: ${gameURL}`);
      await p1Page.goto(gameURL, { waitUntil: 'load' });
      console.log(`[P1] Current URL: ${p1Page.url()}`);
      await p1Page.waitForSelector('#player-name-input', { state: 'visible', timeout: 10000 });
      await p1Page.waitForTimeout(500);
      await p1Page.fill('#player-name-input', 'Player 1');
      await p1Page.waitForTimeout(300);
      await p1Page.press('#player-name-input', 'Enter');
      await p1Page.waitForTimeout(500);
      await p1Page.waitForSelector('#screen-lobby', { state: 'visible', timeout: 10000 });
      
      await p1Page.click('input[name="game-mode"][value="duet"]');
      await p1Page.waitForTimeout(300);
      await p1Page.click('#btn-create-game');
      await p1Page.waitForTimeout(1000); // Wait for Firebase room creation
      await p1Page.waitForSelector('#screen-game-room', { state: 'visible', timeout: 10000 });
      
      roomCode = await p1Page.locator('#game-code').textContent();
      console.log(`✅ Room created: ${roomCode}`);
      
      console.log('\n[P2] Navigating to homepage...');
      await p2Page.goto(gameURL, { waitUntil: 'load' });
      console.log(`[P2] Current URL: ${p2Page.url()}`);
      await p2Page.waitForSelector('#player-name-input', { state: 'visible', timeout: 10000 });
      await p2Page.waitForTimeout(500);
      await p2Page.fill('#player-name-input', 'Player 2');
      await p2Page.waitForTimeout(300);
      await p2Page.press('#player-name-input', 'Enter');
      await p2Page.waitForTimeout(500);
      await p2Page.waitForSelector('#screen-lobby', { state: 'visible' });
      
      await p2Page.fill('#join-code-input', roomCode);
      await p2Page.waitForTimeout(300);
      await p2Page.click('#btn-join-code');
      await p2Page.waitForTimeout(1000); // Wait for Firebase join
      await p2Page.waitForSelector('#screen-game-room', { state: 'visible' });
      
      const startButton = p1Page.locator('button:has-text("Start Game")');
      await startButton.waitFor({ state: 'visible' });
      await p1Page.waitForTimeout(500);
      await startButton.click();
      await p1Page.waitForTimeout(1500); // Wait for game to start
      
      await p1Page.waitForSelector('#game-board', { state: 'visible' });
      await p2Page.waitForSelector('#game-board', { state: 'visible' });
      
      // P1 gives clue
      await p1Page.fill('input#clue-word', 'TEST');
      await p1Page.fill('input#clue-number', '1');
      await p1Page.click('button#submit-clue');
      await p1Page.waitForTimeout(2000);
      
      // P2 guesses - check console logs show P1's color map (clue giver)
      await p2Page.click('button:has-text("Start Guessing")');
      const firstCard = p2Page.locator('.card').first();
      await firstCard.click();
      
      await p2Page.waitForTimeout(2000);
      
      // Verify console logs show "Using color map: P1" (clue giver's perspective)
      const colorMapLog = p2Logs.find(log => log.includes('Using color map:'));
      expect(colorMapLog).toBeTruthy();
      expect(colorMapLog).toContain('P1'); // Should use P1's map, not P2's
      
      console.log(`✅ Color map verified: ${colorMapLog}`);
      
    } finally {
      await p1Context.close();
      await p2Context.close();
    }
  });
});
