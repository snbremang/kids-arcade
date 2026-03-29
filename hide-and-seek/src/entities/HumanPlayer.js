import { CIRCLE_X, CIRCLE_Y, CIRCLE_R } from '../map/MapLayout.js';

const BASE_SPEED = 180;

export class HumanPlayer {
  constructor(scene, x, y) {
    this.scene = scene;
    this.isSeeker = false;
    this.lives = 3;
    this.score = 0;
    this.isEliminated = false; // sitting out until next hiding phase
    this.name = 'You';
    this.speed = BASE_SPEED;

    // Sprite: a colored circle with label
    this.sprite = scene.add.circle(x, y, 14, 0x3498db);
    this.sprite.setDepth(10);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setCircle(14);

    this.label = scene.add.text(x, y - 22, 'YOU', {
      fontSize: '10px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    this.cursors = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  setSeeker(val) {
    this.isSeeker = val;
    // Change color: red = seeker, blue = hider
    this.sprite.fillColor = val ? 0xe74c3c : 0x3498db;
  }

  setEliminated(val) {
    this.isEliminated = val;
    this.sprite.setAlpha(val ? 0.3 : 1);
  }

  update() {
    if (this.isEliminated) {
      this.sprite.body.setVelocity(0, 0);
      this.label.setPosition(this.sprite.x, this.sprite.y - 22);
      return;
    }

    const { up, down, left, right } = this.cursors;
    let vx = 0, vy = 0;

    if (left.isDown)  vx -= this.speed;
    if (right.isDown) vx += this.speed;
    if (up.isDown)    vy -= this.speed;
    if (down.isDown)  vy += this.speed;

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    // If seeker, constrain to circle
    if (this.isSeeker) {
      this.sprite.body.setVelocity(vx, vy);
      // Clamp position to circle
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
    } else {
      this.sprite.body.setVelocity(vx, vy);
    }

    this.label.setPosition(this.sprite.x, this.sprite.y - 22);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  setPosition(x, y) {
    this.sprite.setPosition(x, y);
    this.sprite.body.reset(x, y);
    this.label.setPosition(x, y - 22);
  }

  destroy() {
    this.sprite.destroy();
    this.label.destroy();
  }
}
