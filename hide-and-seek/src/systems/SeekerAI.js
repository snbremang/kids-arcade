import { CIRCLE_X, CIRCLE_Y, CIRCLE_R } from '../map/MapLayout.js';
import { Bullet } from '../entities/Bullet.js';

const PATROL_SPEED = 80;
const SHOOT_INTERVAL = 2500; // ms between shots

export class SeekerAI {
  constructor(scene, getHiders, onBulletHit) {
    this.scene = scene;
    this.getHiders = getHiders;       // () => array of hider player objects
    this.onBulletHit = onBulletHit;   // (hider) => void
    this._bot = null;                 // the bot seeker (if applicable)
    this._angle = 0;                  // current patrol angle
    this._shootTimer = 0;
    this.bullets = [];
    this.enabled = false;
    this._lastTarget = null;          // hider shot at last time
    this._sameTargetCount = 0;        // consecutive shots at same target
  }

  setBot(botPlayer) {
    this._bot = botPlayer;
  }

  enable() { this.enabled = true; }
  disable() { this.enabled = false; this._bot && (this._bot.sprite.body.setVelocity(0, 0)); }

  shoot(fromX, fromY, toX, toY) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const bullet = new Bullet(this.scene, fromX, fromY, angle);
    this.bullets.push(bullet);

    // Check overlap with each hider
    const hiders = this.getHiders();
    for (const hider of hiders) {
      if (hider.isEliminated || hider.isSeeker) continue;
      this.scene.physics.add.overlap(bullet.sprite, hider.sprite, () => {
        if (!bullet.active) return;
        bullet.destroy();
        this.onBulletHit(hider);
      });
    }

    // Stop bullet on structure collision
    for (const body of this.scene._structureBodies) {
      this.scene.physics.add.collider(bullet.sprite, body, () => {
        if (!bullet.active) return;
        bullet.destroy();
      });
    }
  }

  update(delta) {
    // Clean up dead bullets
    this.bullets = this.bullets.filter(b => b.active);

    if (!this.enabled || !this._bot) return;

    // Patrol: move bot in circle
    this._angle += 0.005 * delta;
    const px = CIRCLE_X + Math.cos(this._angle) * (CIRCLE_R * 0.5);
    const py = CIRCLE_Y + Math.sin(this._angle) * (CIRCLE_R * 0.5);
    const dx = px - this._bot.sprite.x;
    const dy = py - this._bot.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 5) {
      this._bot.sprite.body.setVelocity(
        (dx / dist) * PATROL_SPEED,
        (dy / dist) * PATROL_SPEED
      );
    }

    // Auto-aim at nearest visible hider and shoot
    this._shootTimer -= delta;
    if (this._shootTimer <= 0) {
      this._shootTimer = SHOOT_INTERVAL;
      let hiders = this.getHiders().filter(h => !h.isEliminated && !h.isSeeker);
      if (hiders.length > 0) {
        // After 2 shots at the same target without moving on, switch target
        if (this._lastTarget && this._sameTargetCount >= 2) {
          const alternatives = hiders.filter(h => h !== this._lastTarget);
          if (alternatives.length > 0) {
            hiders = alternatives;
            this._sameTargetCount = 0;
          }
        }

        // Pick nearest from (possibly filtered) hiders
        let nearest = null, nearestDist = Infinity;
        for (const h of hiders) {
          const d = Phaser.Math.Distance.Between(
            this._bot.sprite.x, this._bot.sprite.y, h.x, h.y
          );
          if (d < nearestDist) { nearestDist = d; nearest = h; }
        }
        if (nearest) {
          // Track same-target streak
          if (nearest === this._lastTarget) {
            this._sameTargetCount++;
          } else {
            this._lastTarget = nearest;
            this._sameTargetCount = 1;
          }

          // Add scatter
          const scatter = (Math.random() - 0.5) * 0.4;
          const angle = Math.atan2(
            nearest.y - this._bot.sprite.y,
            nearest.x - this._bot.sprite.x
          ) + scatter;
          this.shoot(
            this._bot.sprite.x, this._bot.sprite.y,
            this._bot.sprite.x + Math.cos(angle) * 10,
            this._bot.sprite.y + Math.sin(angle) * 10
          );
        }
      }
    }
  }
}
