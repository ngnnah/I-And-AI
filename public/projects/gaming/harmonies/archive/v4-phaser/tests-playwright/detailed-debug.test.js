/**
 * Detailed debug test to see what's happening
 */

import { test } from '@playwright/test';

test('Detailed debug - check everything', async ({ page }) => {
  const logs = [];
  const errors = [];
  
  // Capture all console messages
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    console.log(`[CONSOLE ${msg.type()}]:`, text);
  });
  
  // Capture all errors
  page.on('pageerror', err => {
    errors.push(err.message);
    console.error('[PAGE ERROR]:', err.message);
  });
  
  // Capture failed requests
  page.on('requestfailed', request => {
    console.error('[REQUEST FAILED]:', request.url(), request.failure().errorText);
  });
  
  console.log('\n=== NAVIGATING TO PAGE ===\n');
  
  try {
    await page.goto('http://localhost:8001/index.html', { 
      waitUntil: 'networkidle',
      timeout: 10000
    });
  } catch (e) {
    console.error('Navigation error:', e.message);
  }
  
  console.log('\n=== WAITING FOR PAGE TO LOAD ===\n');
  await page.waitForTimeout(3000);
  
  // Get HTML content
  const htmlContent = await page.content();
  console.log('\n=== PAGE HTML (first 500 chars) ===');
  console.log(htmlContent.substring(0, 500));
  
  // Check what's in the game container
  const gameContainerHTML = await page.locator('#game-container').innerHTML().catch(() => 'NOT FOUND');
  console.log('\n=== GAME CONTAINER CONTENT ===');
  console.log(gameContainerHTML);
  
  // Check if Phaser exists
  const phaserExists = await page.evaluate(() => typeof Phaser !== 'undefined');
  console.log('\n=== PHASER CHECK ===');
  console.log('Phaser exists:', phaserExists);
  
  // Check canvas
  const canvasCount = await page.locator('canvas').count();
  console.log('Canvas count:', canvasCount);
  
  // Check for visible text
  const bodyText = await page.locator('body').innerText();
  console.log('\n=== VISIBLE TEXT ON PAGE ===');
  console.log(bodyText);
  
  // Check if START GAME button exists anywhere
  const hasStartButton = bodyText.includes('START GAME') || bodyText.includes('Start Game');
  console.log('\nHas START GAME button:', hasStartButton);
  
  console.log('\n=== ALL CONSOLE LOGS ===');
  logs.forEach(log => console.log('  -', log));
  
  console.log('\n=== ALL ERRORS ===');
  if (errors.length === 0) {
    console.log('  No errors!');
  } else {
    errors.forEach(err => console.log('  -', err));
  }
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/detailed-debug.png', fullPage: true });
  console.log('\n=== Screenshot saved to test-results/detailed-debug.png ===\n');
});
