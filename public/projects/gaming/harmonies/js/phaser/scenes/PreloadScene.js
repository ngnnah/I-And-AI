/**
 * Harmonies v4.0 - Preload Scene
 *
 * Loads all game assets (sprites, images) and shows loading bar
 */

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    console.log('[PreloadScene] Loading assets...');

    // Create loading bar
    this.createLoadingBar();

    // TODO Phase 2: Load actual sprite assets
    // For now, we'll generate sprites programmatically in create()

    // Simulate loading time
    this.load.image('placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
  }

  createLoadingBar() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Loading text
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading Harmonies...', {
      fontSize: '32px',
      fill: '#2c3e50'
    });
    loadingText.setOrigin(0.5);

    // Progress bar background
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2, 320, 50);

    // Loading percentage text
    const percentText = this.add.text(width / 2, height / 2 + 25, '0%', {
      fontSize: '18px',
      fill: '#ffffff'
    });
    percentText.setOrigin(0.5);

    // Update progress bar
    this.load.on('progress', (value) => {
      percentText.setText(parseInt(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0x27ae60, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 + 10, 300 * value, 30);
    });

    // Clean up when complete
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });
  }

  create() {
    console.log('[PreloadScene] Assets loaded! Transitioning to LobbyScene...');

    // Small delay for visual feedback
    this.time.delayedCall(500, () => {
      this.scene.start('LobbyScene');
    });
  }
}
