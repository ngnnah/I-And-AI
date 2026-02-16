/**
 * Harmonies v4.0 - End Game Scene
 *
 * Shows final scores, score breakdown, and sun count for solo mode
 */

export default class EndGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EndGameScene' });
  }

  init(data) {
    this.finalScore = data.finalScore || 0;
    this.scoreBreakdown = data.scoreBreakdown || {};
    this.isSolo = data.isSolo || false;
  }

  create() {
    console.log('[EndGameScene] End game scene created');

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(0, 0, width, height, 0x2c3e50).setOrigin(0);

    // Title
    this.add.text(width / 2, 80, 'GAME COMPLETE', {
      fontSize: '56px',
      fill: '#f39c12',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Final score (large)
    this.add.text(width / 2, 180, this.finalScore.toString(), {
      fontSize: '96px',
      fill: '#2ecc71',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, 240, 'TOTAL POINTS', {
      fontSize: '24px',
      fill: '#95a5a6'
    }).setOrigin(0.5);

    // Sun count (solo mode)
    if (this.isSolo) {
      const suns = this.calculateSuns(this.finalScore);
      const sunDisplay = '☀️'.repeat(suns);
      
      this.add.text(width / 2, 300, sunDisplay || '(no suns)', {
        fontSize: '48px',
        fill: '#f39c12'
      }).setOrigin(0.5);
      
      this.add.text(width / 2, 360, `${suns} Sun${suns !== 1 ? 's' : ''} Earned!`, {
        fontSize: '20px',
        fill: '#ecf0f1'
      }).setOrigin(0.5);
    }

    // Score breakdown
    const breakdownY = 420;
    this.add.text(width / 2, breakdownY, 'Score Breakdown:', {
      fontSize: '22px',
      fill: '#ecf0f1',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const categories = [
      { label: 'Trees', key: 'trees', color: '#7ED321' },
      { label: 'Mountains', key: 'mountains', color: '#9B9B9B' },
      { label: 'Fields', key: 'fields', color: '#F5A623' },
      { label: 'Buildings', key: 'buildings', color: '#D0021B' },
      { label: 'Water', key: 'water', color: '#4A90E2' },
      { label: 'Animals', key: 'animals', color: '#8e44ad' }
    ];

    categories.forEach((cat, i) => {
      const y = breakdownY + 50 + (i * 30);
      const score = this.scoreBreakdown[cat.key] || 0;
      
      this.add.text(width / 2 - 150, y, cat.label + ':', {
        fontSize: '18px',
        fill: cat.color
      }).setOrigin(0, 0.5);
      
      this.add.text(width / 2 + 150, y, score.toString(), {
        fontSize: '20px',
        fill: '#ecf0f1',
        fontStyle: 'bold'
      }).setOrigin(1, 0.5);
    });

    // Play Again button
    const playAgainButton = this.add.text(width / 2, height - 100, '[ PLAY AGAIN ]', {
      fontSize: '28px',
      fill: '#27ae60',
      fontStyle: 'bold'
    });
    playAgainButton.setOrigin(0.5);
    playAgainButton.setInteractive({ useHandCursor: true });

    playAgainButton.on('pointerover', () => {
      playAgainButton.setStyle({ fill: '#2ecc71' });
    });

    playAgainButton.on('pointerout', () => {
      playAgainButton.setStyle({ fill: '#27ae60' });
    });

    playAgainButton.on('pointerdown', () => {
      console.log('[EndGameScene] Starting new game...');
      this.scene.start('LobbyScene');
    });
  }

  calculateSuns(score) {
    // Solo mode sun thresholds
    const thresholds = [
      { points: 160, suns: 8 },
      { points: 150, suns: 7 },
      { points: 140, suns: 6 },
      { points: 130, suns: 5 },
      { points: 110, suns: 4 },
      { points: 90, suns: 3 },
      { points: 70, suns: 2 },
      { points: 40, suns: 1 }
    ];

    for (const threshold of thresholds) {
      if (score >= threshold.points) {
        return threshold.suns;
      }
    }

    return 0;
  }
}
