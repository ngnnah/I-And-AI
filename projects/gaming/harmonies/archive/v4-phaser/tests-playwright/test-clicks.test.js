import { test } from '@playwright/test';

test('Test token space clicking', async ({ page }) => {
  console.log('\n🖱️  Testing central board clicks...\n');
  
  // Navigate and wait for game to load
  await page.goto('http://localhost:8001/index.html');
  await page.waitForTimeout(2000);
  
  console.log('📸 Taking lobby screenshot...');
  await page.screenshot({ path: 'test-results/click-test-1-lobby.png' });
  
  // Click START GAME by clicking on canvas at button coordinates
  // Use force: true to bypass actionability checks
  const canvas = page.locator('canvas');
  await canvas.click({ position: { x: 960, y: 690 }, force: true });
  console.log('✅ Clicked START GAME');
  
  await page.waitForTimeout(2000);
  
  console.log('📸 Taking game scene screenshot...');
  await page.screenshot({ path: 'test-results/click-test-2-game.png' });
  
  // Listen for console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('[CentralBoard]') || text.includes('Space') || text.includes('selected')) {
      console.log('BROWSER:', text);
    }
  });
  
  // Try clicking on space 1 (leftmost space)
  // Central board is at (750, 100), first space at (0, 0) relative to container
  // So absolute position is approximately (750, 100)
  console.log('\n🖱️  Attempting to click Space 1 (leftmost)...');
  await canvas.click({ position: { x: 750, y: 160 }, force: true });
  await page.waitForTimeout(500);
  
  console.log('\n🖱️  Attempting to click Space 2 (middle)...');
  await canvas.click({ position: { x: 890, y: 160 }, force: true });
  await page.waitForTimeout(500);
  
  console.log('\n🖱️  Attempting to click Space 3 (rightmost)...');
  await canvas.click({ position: { x: 1030, y: 160 }, force: true });
  await page.waitForTimeout(500);
  
  console.log('📸 Taking post-click screenshot...');
  await page.screenshot({ path: 'test-results/click-test-3-after-clicks.png' });
  
  console.log('\n✅ Click test complete!');
  console.log('\nCheck console logs above to see if clicks were registered.');
  console.log('Check screenshots in test-results/ directory.');
});
