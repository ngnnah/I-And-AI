/**
 * Harmonies v4.0 - End Game Scene
 *
 * Shows final scores, winner, and back to lobby button
 */

export default class EndGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EndGameScene' });
  }

  init(data) {
    this.finalScores = data.scores || [];
    this.winner = data.winner || 'Unknown';
  }

  create() {
    console.log('[EndGameScene] End game scene created');

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(0, 0, width, height, 0xf5f5f5).setOrigin(0);

    // Title
    this.add.text(width / 2, 150, 'GAME OVER', {
      fontSize: '64px',
      fill: '#2c3e50',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Winner
    this.add.text(width / 2, 250, `🏆 Winner: ${this.winner}`, {
      fontSize: '36px',
      fill: '#f39c12'
    }).setOrigin(0.5);

    // Placeholder message
    this.add.text(width / 2, height / 2,
      'Phase 4 will add:\n' +
      '• Final score breakdown\n' +
      '• All players ranked\n' +
      '• Score details by category',
      {
        fontSize: '20px',
        fill: '#555',
        align: 'center',
        lineSpacing: 10
      }
    ).setOrigin(0.5);

    // Back to lobby button
    const backButton = this.add.text(width / 2, height - 150, '[ BACK TO LOBBY ]', {
      fontSize: '28px',
      fill: '#3498db',
      fontStyle: 'bold'
    });
    backButton.setOrigin(0.5);
    backButton.setInteractive({ useHandCursor: true });

    backButton.on('pointerover', () => {
      backButton.setStyle({ fill: '#5dade2' });
    });

    backButton.on('pointerout', () => {
      backButton.setStyle({ fill: '#3498db' });
    });

    backButton.on('pointerdown', () => {
      console.log('[EndGameScene] Returning to lobby...');
      this.scene.start('LobbyScene');
    });
  }
}
