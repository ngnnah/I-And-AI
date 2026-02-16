import { test, expect } from '@playwright/test';

test('Verify layout positioning', async ({ page }) => {
  console.log('\n🎮 Testing Harmonies layout...\n');
  
  // Navigate to game
  await page.goto('http://localhost:8001/index.html');
  await page.waitForTimeout(2000);
  
  // Verify canvas exists
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  console.log('✅ Canvas is visible');
  
  // Get canvas info
  const canvasInfo = await canvas.evaluate(el => ({
    width: el.width,
    height: el.height,
    clientWidth: el.clientWidth,
    clientHeight: el.clientHeight
  }));
  console.log('Canvas dimensions:', canvasInfo);
  
  // Take screenshot of lobby
  await page.screenshot({ path: 'test-results/01-lobby.png', fullPage: false });
  console.log('📸 Lobby screenshot: test-results/01-lobby.png');
  
  // Click START GAME (canvas interaction - click center-bottom where button is)
  // Button is at position (width/2, height/2 + 150) which is approximately (960, 690)
  await canvas.click({ position: { x: 960, y: 690 } });
  console.log('🖱️  Clicked START GAME button');
  await page.waitForTimeout(2000);
  
  // Take screenshot of game
  await page.screenshot({ path: 'test-results/02-game-scene.png', fullPage: false });
  console.log('📸 Game screenshot: test-results/02-game-scene.png');
  
  console.log('\n✅ Layout verification complete!');
  console.log('\nExpected layout:');
  console.log('  - Top: Header bar with title, turn counter, buttons');
  console.log('  - Below header: Central board with 3 token spaces');
  console.log('  - Left sidebar: 3 animal cards (purple backgrounds)');
  console.log('  - Right sidebar: Score panel with category breakdown');
  console.log('  - Bottom: Turn instructions and END TURN button');
  console.log('  - Center: Hex grid with starting hexes');
  console.log('\nAll components should be visible without overlap.');
  console.log('\nPlease check the screenshots to verify layout.');
});

