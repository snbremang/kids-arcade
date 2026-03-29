import { CIRCLE_X, CIRCLE_Y, CIRCLE_R } from '../map/MapLayout.js';

const FRUITS = ['🍎 Apple', '🍌 Banana', '🍊 Mango', '🍒 Cherry', '🍇 Grape', '🍓 Strawberry'];
const WILDCARDS = ['🔥 Wildfire', '🌀 Hurricane'];
const ALL_OPTIONS = [...FRUITS.slice(0, 4), ...WILDCARDS];

const FRUIT_COUNT = 8;
const COLLECT_RADIUS = 18;
const COUNTDOWN = 10; // seconds

export class FruitSystem {
  constructor(scene) {
    this.scene = scene;
    this._collectibles = [];   // { x, y, sprite }
    this._countdownTimer = 0;
    this._active = false;
    this._panel = null;
    this._timerText = null;
    this._bannerText = null;
    this._lastChoice = null;

    // Callbacks set from GameScene
    this.onFruit = null;      // (choice) => void — called when a fruit is chosen
    this.onComplete = null;   // () => void — called when 10s countdown ends
  }

  // Called to initiate the fruit-call phase (human seeker)
  showPickerForHumanSeeker() {
    this._buildPanel(true);
  }

  // Called when bot is seeker — auto-pick after 2s
  autoPick(delay = 2000) {
    const choice = ALL_OPTIONS[Math.floor(Math.random() * ALL_OPTIONS.length)];
    this.scene.time.delayedCall(delay, () => {
      this._applyChoice(choice);
    });
  }

  _buildPanel(humanPicking) {
    const { width, height } = this.scene.scale;
    const pw = 500, ph = 160;
    const px = (width - pw) / 2, py = (height - ph) / 2 - 60;

    // Background
    this._panel = this.scene.add.graphics().setDepth(50);
    this._panel.fillStyle(0x000000, 0.75);
    this._panel.fillRoundedRect(px, py, pw, ph, 12);

    this._panelObjs = [this._panel];

    const prompt = humanPicking
      ? 'You are IT — call a fruit or wildcard!'
      : 'The seeker is choosing...';

    const promptText = this.scene.add.text(width / 2, py + 22, prompt, {
      fontSize: '14px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(51);
    this._panelObjs.push(promptText);

    if (humanPicking) {
      const btnW = 80, btnH = 40, gap = 10;
      const totalW = ALL_OPTIONS.length * (btnW + gap) - gap;
      let bx = (width - totalW) / 2;
      for (const opt of ALL_OPTIONS) {
        const isWild = opt.includes('Wildfire') || opt.includes('Hurricane');
        const bg = this.scene.add.graphics().setDepth(51);
        bg.fillStyle(isWild ? 0x8B0000 : 0x1a5276, 1);
        bg.fillRoundedRect(bx, py + 50, btnW, btnH, 6);

        const lines = opt.split(' ');
        const btnText = this.scene.add.text(bx + btnW / 2, py + 70, lines[0] + '\n' + lines.slice(1).join(' '), {
          fontSize: '11px', color: '#ffffff', align: 'center'
        }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });

        const choice = opt;
        btnText.on('pointerdown', () => {
          this._applyChoice(choice);
        });
        btnText.on('pointerover', () => bg.clear().fillStyle(isWild ? 0xc0392b : 0x2980b9, 1).fillRoundedRect(bx, py + 50, btnW, btnH, 6));
        btnText.on('pointerout', () => bg.clear().fillStyle(isWild ? 0x8B0000 : 0x1a5276, 1).fillRoundedRect(bx, py + 50, btnW, btnH, 6));

        this._panelObjs.push(bg, btnText);
        bx += btnW + gap;
      }
    }
  }

  _applyChoice(choice) {
    this._lastChoice = choice;
    this._clearPanel();

    const isWildfire = choice.includes('Wildfire');
    const isHurricane = choice.includes('Hurricane');
    const isFruit = !isWildfire && !isHurricane;

    // Show banner to all
    this._showBanner(choice);

    if (isFruit) {
      this._spawnFruitCollectibles();
    }

    // Notify GameScene
    if (this.onFruit) this.onFruit(choice);

    // Start 10s countdown
    this._startCountdown();
  }

  _showBanner(text) {
    const { width } = this.scene.scale;
    if (this._bannerText) this._bannerText.destroy();
    this._bannerText = this.scene.add.text(width / 2, 30, `🗣 "${text}"`, {
      fontSize: '20px', color: '#ffe033', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(60);

    this.scene.time.delayedCall(9000, () => {
      if (this._bannerText) { this._bannerText.destroy(); this._bannerText = null; }
    });
  }

  _spawnFruitCollectibles() {
    this._clearCollectibles();
    for (let i = 0; i < FRUIT_COUNT; i++) {
      const angle = (i / FRUIT_COUNT) * Math.PI * 2 + Math.random() * 0.3;
      const r = Math.random() * (CIRCLE_R - 15) + 5;
      const x = CIRCLE_X + Math.cos(angle) * r;
      const y = CIRCLE_Y + Math.sin(angle) * r;
      const sprite = this.scene.add.text(x, y, '⭐', {
        fontSize: '18px'
      }).setOrigin(0.5).setDepth(15);
      this._collectibles.push({ x, y, sprite, collected: false });
    }
  }

  _clearCollectibles() {
    for (const c of this._collectibles) c.sprite.destroy();
    this._collectibles = [];
  }

  // Call each frame with array of active hider players
  checkCollections(players) {
    for (const c of this._collectibles) {
      if (c.collected) continue;
      for (const p of players) {
        if (p.isSeeker || p.isEliminated) continue;
        const dx = p.x - c.x, dy = p.y - c.y;
        if (Math.sqrt(dx * dx + dy * dy) < COLLECT_RADIUS) {
          c.collected = true;
          c.sprite.destroy();
          p.score += 5; // bonus points for fruit
          // Flash feedback
          this.scene.cameras.main.flash(150, 255, 220, 0);
          break;
        }
      }
    }
    this._collectibles = this._collectibles.filter(c => !c.collected);
  }

  _startCountdown() {
    this._countdownSecs = COUNTDOWN;
    this._active = true;

    if (this._timerText) this._timerText.destroy();
    this._timerText = this.scene.add.text(CIRCLE_X, CIRCLE_Y + CIRCLE_R + 20, `${COUNTDOWN}`, {
      fontSize: '22px', color: '#ff4444', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(60);

    // Tick every second
    this._countdownEvent = this.scene.time.addEvent({
      delay: 1000,
      repeat: COUNTDOWN - 1,
      callback: () => {
        this._countdownSecs--;
        if (this._timerText) this._timerText.setText(`${this._countdownSecs}`);
        if (this._countdownSecs <= 0) {
          this._active = false;
          if (this._timerText) { this._timerText.destroy(); this._timerText = null; }
          this._clearCollectibles();
          if (this.onComplete) this.onComplete();
        }
      }
    });
  }

  _clearPanel() {
    if (this._panelObjs) {
      for (const o of this._panelObjs) o.destroy();
      this._panelObjs = null;
    }
    this._panel = null;
  }

  get isActive() { return this._active; }
  get lastChoice() { return this._lastChoice; }

  destroy() {
    this._clearPanel();
    this._clearCollectibles();
    if (this._timerText) this._timerText.destroy();
    if (this._bannerText) this._bannerText.destroy();
    if (this._countdownEvent) this._countdownEvent.remove();
  }
}
