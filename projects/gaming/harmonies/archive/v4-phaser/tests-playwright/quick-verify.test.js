/**
 * Quick verification test
 */

import { test, expect } from '@playwright/test';

test('Quick verify - v4.0 loads', async ({ page }) => {
  // Capture console logs
  page.on('console', msg => console.log('[BROWSER]:', msg.text()));
  page.on('pageerror', err => console.error('[ERROR]:', err.message));
  
  await page.goto('http://localhost:8001/index.html');
  await page.waitForTimeout(2000);
  
  // Check title
  const title = await page.title();
  console.log('Title:', title);
  expect(title).toContain('v4.0');
  
  // Check if Phaser loaded
  const phaserLoaded = await page.evaluate(() => typeof Phaser !== 'undefined');
  console.log('Phaser loaded:', phaserLoaded);
  expect(phaserLoaded).toBeTruthy();
  
  // Check for canvas
  const canvasCount = await page.locator('canvas').count();
  console.log('Canvas count:', canvasCount);
  expect(canvasCount).toBeGreaterThan(0);
  
  // Wait for game to initialize
  await page.waitForTimeout(2000);
  
  // Check if START GAME button appears (it's drawn on canvas by Phaser)
  // We'll check console logs for LobbyScene
  
  console.log('✅ v4.0 loads successfully!');
});
