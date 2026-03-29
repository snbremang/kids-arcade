import { CIRCLE_X, CIRCLE_Y, CIRCLE_R, STRUCTURES } from '../map/MapLayout.js';

const BASE_SPEED = 150;
const BOT_NAMES = ['Bot A', 'Bot B', 'Bot C'];
const BOT_COLORS = [0x9b59b6, 0xf39c12, 0x1abc9c];

export class BotPlayer {
  constructor(scene, x, y, index) {
    this.scene = scene;
    this.isSeeker = false;
    this.lives = 3;
    this.score = 0;
    this.isEliminated = false;
    this.name = BOT_NAMES[index] || `Bot ${index}`;
    this._baseColor = BOT_COLORS[index] || 0xaaaaaa;
    this._index = index;

    this.sprite = scene.add.circle(x, y, 14, this._baseColor);
    this.sprite.setDepth(10);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setCircle(14);

    this.label = scene.add.text(x, y - 22, this.name.toUpperCase(), {
      fontSize: '9px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    // AI state
    this._target = null;       // {x, y} to move toward
    this._state = 'idle';      // idle | moving | waiting
    this._waitTimer = 0;
    this._hideSpot = null;     // current structure index hiding at
    this._lastHideSpot = null; // for wildfire (can't return to same)
    this.speed = BASE_SPEED;
  }

  setSeeker(val) {
    this.isSeeker = val;
    this.sprite.fillColor = val ? 0xe74c3c : this._baseColor;
  }

  setEliminated(val) {
    this.isEliminated = val;
    this.sprite.setAlpha(val ? 0.3 : 1);
  }

  // Direct bot to hide behind a random structure (on the side away from the circle)
  goHide(excludeIndex = null) {
    const candidates = STRUCTURES
      .map((s, i) => ({ s, i }))
      .filter(({ i }) => i !== excludeIndex);
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    this._lastHideSpot = this._hideSpot;
    this._hideSpot = pick.i;

    const s = pick.s;
    let tx, ty;
    if (s.type === 'rect') {
      // Find side of rect that faces AWAY from the circle center
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
      const dx = CIRCLE_X - cx, dy = CIRCLE_Y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / dist, ny = dy / dist; // unit vector toward circle
      // Ray from center in direction away from circle: scale to reach edge
      const hw = s.w / 2, hh = s.h / 2;
      const scaleX = Math.abs(nx) > 0.001 ? hw / Math.abs(nx) : Infinity;
      const scaleY = Math.abs(ny) > 0.001 ? hh / Math.abs(ny) : Infinity;
      const edgeScale = Math.min(scaleX, scaleY);
      // Edge point on the far side + 22px outside
      tx = cx - nx * edgeScale - nx * 22;
      ty = cy - ny * edgeScale - ny * 22;
    } else {
      // Circle structure: hide directly on the far side from the circle center
      const angle = Math.atan2(s.y - CIRCLE_Y, s.x - CIRCLE_X);
      tx = s.x + Math.cos(angle) * (s.r + 22);
      ty = s.y + Math.sin(angle) * (s.r + 22);
    }
    // Clamp to canvas with margin
    tx = Phaser.Math.Clamp(tx, 20, 880);
    ty = Phaser.Math.Clamp(ty, 20, 630);
    this._target = { x: tx, y: ty };
    this._state = 'moving';
  }

  // Go to circle edge for hurricane
  goToCircleEdge() {
    const angle = Math.random() * Math.PI * 2;
    this._target = {
      x: CIRCLE_X + Math.cos(angle) * (CIRCLE_R - 5),
      y: CIRCLE_Y + Math.sin(angle) * (CIRCLE_R - 5),
    };
    this._state = 'moving';
  }

  // Dash into circle to grab fruit
  goIntoCircle() {
    const angle = Math.random() * Math.PI * 2;
    this._target = {
      x: CIRCLE_X + Math.cos(angle) * (CIRCLE_R * 0.5),
      y: CIRCLE_Y + Math.sin(angle) * (CIRCLE_R * 0.5),
    };
    this._state = 'moving';
  }

  onFruitCall() {
    // Bot hiders rush into circle to collect fruits
    if (!this.isSeeker && !this.isEliminated) {
      this._hurricaneState = null; // clear any stale wildcard state
      this.goIntoCircle();
    }
  }

  onWildfire() {
    if (!this.isSeeker && !this.isEliminated) {
      this.goHide(this._hideSpot); // exclude current spot
    }
  }

  onHurricane() {
    if (!this.isSeeker && !this.isEliminated) {
      this._hurricaneState = 'goEdge';
      this.goToCircleEdge();
    }
  }

  update(delta) {
    this.label.setPosition(this.sprite.x, this.sprite.y - 22);
    if (this.isEliminated) {
      this.sprite.body.setVelocity(0, 0);
      return;
    }

    if (this._state === 'moving' && this._target) {
      const dx = this._target.x - this.sprite.x;
      const dy = this._target.y - this.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 8) {
        this.sprite.body.setVelocity(0, 0);
        // Hurricane: after reaching edge, go back to last hide spot
        if (this._hurricaneState === 'goEdge') {
          this._hurricaneState = null;
          this._waitTimer = 500;
          this._state = 'waiting';
        } else {
          this._state = 'idle';
        }
      } else {
        const spd = Math.min(this.speed, dist * 4);
        this.sprite.body.setVelocity((dx / dist) * spd, (dy / dist) * spd);
      }
    } else if (this._state === 'waiting') {
      this.sprite.body.setVelocity(0, 0);
      this._waitTimer -= delta;
      if (this._waitTimer <= 0) {
        // After hurricane touch, go back to hide
        this.goHide();
        this._state = 'moving';
      }
    } else {
      this.sprite.body.setVelocity(0, 0);
    }

    // Seeker constraint (if this bot is seeker it shouldn't be moving randomly)
    if (this.isSeeker) {
      const dx = this.sprite.x - CIRCLE_X;
      const dy = this.sprite.y - CIRCLE_Y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > CIRCLE_R - 14) {
        const angle = Math.atan2(dy, dx);
        this.sprite.setPosition(
          CIRCLE_X + Math.cos(angle) * (CIRCLE_R - 14),
          CIRCLE_Y + Math.sin(angle) * (CIRCLE_R - 14)
        );
        this.sprite.body.reset(this.sprite.x, this.sprite.y);
      }
    }
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  setPosition(x, y) {
    this.sprite.setPosition(x, y);
    this.sprite.body.reset(x, y);
    this.label.setPosition(x, y - 22);
    this._state = 'idle';
    this._target = null;
  }

  destroy() {
    this.sprite.destroy();
    this.label.destroy();
  }
}
