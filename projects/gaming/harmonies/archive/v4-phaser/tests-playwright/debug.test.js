/**
 * Simple debug test to check if page loads
 */

import { test, expect } from '@playwright/test';

test('Debug: Check if page loads at all', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));
  
  console.log('Navigating to homepage...');
  const response = await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle' });
  
  console.log('Response status:', response?.status());
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/debug-page-load.png', fullPage: true });
  
  // Check if game container exists
  const gameContainer = await page.locator('#game-container');
  console.log('Game container exists:', await gameContainer.count() > 0);
  
  // Check if Phaser loaded
  await page.waitForTimeout(3000);
  
  const phaserLoaded = await page.evaluate(() => {
    return typeof Phaser !== 'undefined';
  });
  console.log('Phaser loaded:', phaserLoaded);
  
  // Check if canvas exists
  const canvas = await page.locator('canvas');
  console.log('Canvas count:', await canvas.count());
  
  // Get page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Wait a bit to see what happens
  await page.waitForTimeout(5000);
  
  // Take final screenshot
  await page.screenshot({ path: 'test-results/debug-after-wait.png', fullPage: true });
  
  expect(phaserLoaded).toBeTruthy();
});
