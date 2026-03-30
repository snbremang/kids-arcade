import { CANVAS_W, CANVAS_H } from '../map/MapLayout.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    // Stop UIScene in case we came from EndScene
    if (this.scene.isActive('UIScene')) {
      this.scene.stop('UIScene');
    }

    // Background
    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x1a1a2e);

    // Decorative grid (matches GameScene)
    const gfx = this.add.graphics();
    gfx.lineStyle(1, 0x2d5a27, 0.15);
    for (let x = 0; x <= CANVAS_W; x += 50) gfx.lineBetween(x, 0, x, CANVAS_H);
    for (let y = 0; y <= CANVAS_H; y += 50) gfx.lineBetween(0, y, CANVAS_W, y);

    // Decorative circle (like the golden circle in-game)
    const circleGfx = this.add.graphics();
    circleGfx.lineStyle(3, 0xffd700, 0.3);
    circleGfx.strokeCircle(CANVAS_W / 2, CANVAS_H / 2 - 20, 120);
    circleGfx.fillStyle(0xffd700, 0.04);
    circleGfx.fillCircle(CANVAS_W / 2, CANVAS_H / 2 - 20, 120);

    // Emoji icon
    this.add.text(CANVAS_W / 2, 160, '🔍', {
      fontSize: '64px'
    }).setOrigin(0.5);

    // Title
    this.add.text(CANVAS_W / 2, 240, 'HIDE & SEEK', {
      fontSize: '42px',
      fontFamily: 'Arial Black, Arial',
      color: '#1abc9c',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(CANVAS_W / 2, 290, 'Can you survive?', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#bdc3c7'
    }).setOrigin(0.5);

    // Info text
    this.add.text(CANVAS_W / 2, 340, 'Hide from the seeker  •  Collect fruit  •  Earn points', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#7f8c8d'
    }).setOrigin(0.5);

    // Play button
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x1a5276, 1);
    btnBg.fillRoundedRect(CANVAS_W / 2 - 100, 400, 200, 50, 10);
    btnBg.lineStyle(2, 0x3498db, 1);
    btnBg.strokeRoundedRect(CANVAS_W / 2 - 100, 400, 200, 50, 10);

    const btnLabel = this.add.text(CANVAS_W / 2, 425, '▶  PLAY', {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#ecf0f1',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const btnHit = this.add.rectangle(CANVAS_W / 2, 425, 200, 50)
      .setInteractive({ useHandCursor: true });

    btnHit.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0x2980b9, 1);
      btnBg.fillRoundedRect(CANVAS_W / 2 - 100, 400, 200, 50, 10);
      btnBg.lineStyle(2, 0x1abc9c, 1);
      btnBg.strokeRoundedRect(CANVAS_W / 2 - 100, 400, 200, 50, 10);
      btnLabel.setColor('#1abc9c');
    });

    btnHit.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0x1a5276, 1);
      btnBg.fillRoundedRect(CANVAS_W / 2 - 100, 400, 200, 50, 10);
      btnBg.lineStyle(2, 0x3498db, 1);
      btnBg.strokeRoundedRect(CANVAS_W / 2 - 100, 400, 200, 50, 10);
      btnLabel.setColor('#ecf0f1');
    });

    btnHit.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // Players info
    this.add.text(CANVAS_W / 2, 490, '4 players  •  4 minutes  •  3 lives', {
      fontSize: '13px',
      fontFamily: 'Arial',
      color: '#555'
    }).setOrigin(0.5);
  }
}
