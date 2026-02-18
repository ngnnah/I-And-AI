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

    try {
      // === SETUP PHASE ===
      console.log('\n=== SETUP: Creating Duet game ===');
      
      // P1: Create a Duet game
      await p1Page.goto('/');
      await p1Page.waitForLoadState('networkidle');
      
      await p1Page.click('button:has-text("Host Game")');
      await p1Page.waitForSelector('#game-setup', { state: 'visible' });
      
      // Select Duet mode
      await p1Page.selectOption('select#game-mode', 'duet');
      await p1Page.fill('input#player-name', 'Player 1');
      await p1Page.click('button:has-text("Create Room")');
      
      // Wait for room code
      await p1Page.waitForSelector('#room-code', { state: 'visible', timeout: 10000 });
      roomCode = await p1Page.locator('#room-code').textContent();
      console.log(`Room created: ${roomCode}`);
      
      // P2: Join the game
      await p2Page.goto('/');
      await p2Page.waitForLoadState('networkidle');
      
      await p2Page.click('button:has-text("Join Game")');
      await p2Page.waitForSelector('#join-game-screen', { state: 'visible' });
      
      await p2Page.fill('input[placeholder*="room code"]', roomCode);
      await p2Page.fill('input[placeholder*="name"]', 'Player 2');
      await p2Page.click('button:has-text("Join Room")');
      
      // Wait for both players to see the lobby
      await p1Page.waitForSelector('.player-list', { state: 'visible', timeout: 10000 });
      await p2Page.waitForSelector('.player-list', { state: 'visible', timeout: 10000 });
      
      console.log('Both players joined');
      
      // P1 starts the game
      await p1Page.click('button:has-text("Start Game")');
      
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
    p2Page.on('console', msg => {
      const text = msg.text();
      p2Logs.push(text);
      console.log(`[P2] ${text}`);
    });

    try {
      // Setup: Create and join Duet game (similar to above)
      console.log('\n=== SETUP: Creating Duet game for color map test ===');
      
      await p1Page.goto('/');
      await p1Page.click('button:has-text("Host Game")');
      await p1Page.selectOption('select#game-mode', 'duet');
      await p1Page.fill('input#player-name', 'Player 1');
      await p1Page.click('button:has-text("Create Room")');
      
      roomCode = await p1Page.locator('#room-code').textContent();
      
      await p2Page.goto('/');
      await p2Page.click('button:has-text("Join Game")');
      await p2Page.fill('input[placeholder*="room code"]', roomCode);
      await p2Page.fill('input[placeholder*="name"]', 'Player 2');
      await p2Page.click('button:has-text("Join Room")');
      
      await p1Page.click('button:has-text("Start Game")');
      
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
