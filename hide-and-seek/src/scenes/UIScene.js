// Overlay HUD: lives, score, timer, reload indicator

export class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene', active: false }); }

  create() {
    const game = this.scene.get('GameScene');

    // --- Timer ---
    this.timerBg = this.add.rectangle(450, 18, 120, 28, 0x000000, 0.6).setDepth(100);
    this.timerText = this.add.text(450, 18, '4:00', {
      fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(101);

    // --- Player HUD rows ---
    this._hudRows = {};
    // Will be built on first tick

    // --- Reload bar (human seeker only) ---
    this.reloadBg = this.add.rectangle(450, 640, 160, 12, 0x333333, 0.8).setDepth(100);
    this.reloadBar = this.add.rectangle(450 - 80, 640, 0, 10, 0xffdd00, 1).setOrigin(0, 0.5).setDepth(101);
    this.reloadBg.setVisible(false);
    this.reloadBar.setVisible(false);

    // Phase label
    this.phaseLabel = this.add.text(450, 635, '', {
      fontSize: '12px', color: '#aaffaa', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(101);

    game.events.on('tick', (data) => this._onTick(data), this);
    game.events.on('livesChanged', () => {
      // force redraw next tick
      this._lastPlayers = null;
    }, this);
  }

  _onTick({ gameTime, players, phase, reloadPct, isHumanSeeker }) {
    // Timer
    const mins = Math.floor(gameTime / 60);
    const secs = gameTime % 60;
    this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
    this.timerText.setColor(gameTime <= 30 ? '#ff4444' : '#ffffff');

    // Phase label
    const phaseLabels = {
      reveal: 'REVEAL', hiding: 'HIDE!', fruit: 'FRUIT CALL', seeking: 'SEEKING', over: 'GAME OVER'
    };
    this.phaseLabel.setText(phaseLabels[phase] || '');

    // Reload bar
    const showReload = isHumanSeeker && phase === 'seeking';
    this.reloadBg.setVisible(showReload);
    this.reloadBar.setVisible(showReload);
    if (showReload) {
      this.reloadBar.setDisplaySize(160 * reloadPct, 10);
      this.reloadBar.setFillStyle(reloadPct >= 1 ? 0x44ff88 : 0xffdd00);
    }

    // Build/update player HUD rows
    this._buildHUD(players);
  }

  _buildHUD(players) {
    const panelX = 8, panelY = 8;
    const rowH = 36;

    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      const y = panelY + i * rowH;
      const key = p.name;

      if (!this._hudRows[key]) {
        // Create row
        const bg = this.add.rectangle(88, y + 14, 168, rowH - 4, 0x000000, 0.55).setDepth(100);
        const nameT = this.add.text(panelX + 4, y + 4, p.name, {
          fontSize: '11px', color: '#ffffff'
        }).setDepth(101);
        const livesT = this.add.text(panelX + 4, y + 18, '', {
          fontSize: '13px'
        }).setDepth(101);
        const scoreT = this.add.text(panelX + 100, y + 10, '', {
          fontSize: '12px', color: '#ffe033'
        }).setDepth(101);
        this._hudRows[key] = { bg, nameT, livesT, scoreT };
      }

      const row = this._hudRows[key];
      // Lives hearts
      let heartsStr = '';
      for (let h = 0; h < 3; h++) {
        heartsStr += h < p.lives ? '❤️' : '🖤';
      }
      row.livesT.setText(heartsStr);

      // Score
      row.scoreT.setText(`★ ${p.score}`);

      // Color name for seeker
      row.nameT.setColor(p.isSeeker ? '#ff4444' : (p.name === 'You' ? '#3498db' : '#ffffff'));

      // Dim if eliminated
      const alpha = p.isEliminated ? 0.4 : 1;
      row.bg.setAlpha(alpha);
      row.nameT.setAlpha(alpha);
      row.livesT.setAlpha(alpha);
    }
  }

  shutdown() {
    const game = this.scene.get('GameScene');
    if (game) game.events.off('tick');
  }
}
