import { CANVAS_W, CANVAS_H } from '../map/MapLayout.js';

export class EndScene extends Phaser.Scene {
  constructor() { super('EndScene'); }

  init(data) {
    this.players = data.players || [];
  }

  create() {
    // Dark overlay
    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x0a0a1a);

    this.add.text(CANVAS_W / 2, 60, '🏆 GAME OVER', {
      fontSize: '36px', color: '#ffd700', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5);

    const ranked = [...this.players].sort((a, b) => b.score - a.score);
    const humanRank = ranked.findIndex(p => p.name === 'You') + 1;

    const medals = ['🥇', '🥈', '🥉', '4️⃣'];
    const colors = ['#ffd700', '#c0c0c0', '#cd7f32', '#aaaaaa'];

    ranked.forEach((p, i) => {
      const y = 140 + i * 70;
      const isHuman = p.name === 'You';

      // Row bg
      this.add.rectangle(CANVAS_W / 2, y, 420, 56, isHuman ? 0x1a3a5c : 0x1a1a2e)
        .setStrokeStyle(2, isHuman ? 0x3498db : 0x333355);

      this.add.text(CANVAS_W / 2 - 180, y, medals[i], {
        fontSize: '26px'
      }).setOrigin(0, 0.5);

      this.add.text(CANVAS_W / 2 - 140, y, p.name + (isHuman ? ' (You)' : ''), {
        fontSize: '20px', color: colors[i], fontStyle: isHuman ? 'bold' : 'normal'
      }).setOrigin(0, 0.5);

      this.add.text(CANVAS_W / 2 + 130, y, `★ ${p.score} pts`, {
        fontSize: '18px', color: '#ffe033'
      }).setOrigin(0.5, 0.5);
    });

    const resultMsg = humanRank === 1
      ? '🎉 YOU WIN! Best hider!'
      : humanRank === 2
        ? 'So close! You came 2nd.'
        : `You ranked #${humanRank}. Better luck next time!`;

    this.add.text(CANVAS_W / 2, CANVAS_H - 120, resultMsg, {
      fontSize: '22px', color: '#ffffff', fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5);

    // Play again button
    const btn = this.add.text(CANVAS_W / 2, CANVAS_H - 60, '▶  Play Again', {
      fontSize: '20px', color: '#ffffff', backgroundColor: '#1a5276',
      padding: { left: 20, right: 20, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setBackgroundColor('#2980b9'));
    btn.on('pointerout', () => btn.setBackgroundColor('#1a5276'));
    btn.on('pointerdown', () => this.scene.start('GameScene'));
  }
}
