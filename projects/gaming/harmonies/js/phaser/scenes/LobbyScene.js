/**
 * Harmonies v4.0 - Lobby Scene
 *
 * Username login, create/join game UI
 * Uses Phaser for rendering but keeps HTML overlay for forms (hybrid approach)
 */

export default class LobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LobbyScene' });
  }

  create() {
    console.log('[LobbyScene] Lobby initialized');

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(0, 0, width, height, 0xf5f5f5).setOrigin(0);

    // Title
    this.add.text(width / 2, 150, 'HARMONIES', {
      fontSize: '64px',
      fill: '#2c3e50',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Version badge
    this.add.text(width / 2, 230, 'v4.0 - Phaser Edition', {
      fontSize: '20px',
      fill: '#7f8c8d',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Instructions
    const instructions = this.add.text(width / 2, height / 2 - 100,
      'Phase 1: Basic Scene Structure\n\n' +
      'Next steps:\n' +
      '• Add username input (HTML overlay)\n' +
      '• Add create/join game buttons\n' +
      '• Connect to Firebase\n' +
      '• Transition to GameScene',
      {
        fontSize: '18px',
        fill: '#555',
        align: 'center',
        lineSpacing: 10
      }
    );
    instructions.setOrigin(0.5);

    // Temporary "Start Game" button for testing
    const startButton = this.add.text(width / 2, height / 2 + 150, '[ START GAME ]', {
      fontSize: '32px',
      fill: '#27ae60',
      fontStyle: 'bold'
    });
    startButton.setOrigin(0.5);
    startButton.setInteractive({ useHandCursor: true });

    startButton.on('pointerover', () => {
      startButton.setStyle({ fill: '#2ecc71' });
    });

    startButton.on('pointerout', () => {
      startButton.setStyle({ fill: '#27ae60' });
    });

    startButton.on('pointerdown', () => {
      console.log('[LobbyScene] Starting game...');
      this.scene.start('GameScene', {
        gameId: 'TEST123',
        username: 'TestPlayer'
      });
    });

    // Phase 1 status
    this.add.text(20, height - 40, 'Phase 1: Phaser Game Structure ✅', {
      fontSize: '16px',
      fill: '#27ae60'
    });
  }
}
