import { test, expect } from '@playwright/test';

test('Visual check - Take screenshots of game', async ({ page }) => {
  console.log('\n🎮 Opening Harmonies game...\n');
  
  // Navigate to the game
  await page.goto('http://localhost:8001/index.html');
  
  // Wait for game to load
  await page.waitForTimeout(2000);
  
  // Take screenshot of lobby
  await page.screenshot({ path: 'test-results/visual-lobby.png', fullPage: true });
  console.log('📸 Screenshot saved: test-results/visual-lobby.png');
  
  // Check if START GAME button exists
  const startButton = page.locator('text=START GAME');
  const buttonExists = await startButton.count() > 0;
  console.log(`START GAME button exists: ${buttonExists}`);
  
  if (buttonExists) {
    // Click the button
    await startButton.click();
    await page.waitForTimeout(2000);
    
    // Take screenshot of game scene
    await page.screenshot({ path: 'test-results/visual-game.png', fullPage: true });
    console.log('📸 Screenshot saved: test-results/visual-game.png');
  } else {
    console.log('⚠️  START GAME button not found - checking canvas...');
    
    // Check if canvas exists
    const canvas = page.locator('canvas');
    const canvasCount = await canvas.count();
    console.log(`Canvas elements found: ${canvasCount}`);
    
    // Get canvas dimensions if exists
    if (canvasCount > 0) {
      const canvasInfo = await canvas.first().evaluate(el => ({
        width: el.width,
        height: el.height,
        visible: el.offsetWidth > 0 && el.offsetHeight > 0
      }));
      console.log('Canvas info:', canvasInfo);
    }
  }
  
  console.log('\n✅ Visual check complete!\n');
});
