export class Bullet {
  constructor(scene, x, y, angle) {
    this.scene = scene;
    this.active = true;

    this.sprite = scene.add.circle(x, y, 5, 0xffff00);
    this.sprite.setDepth(20);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCircle(5);

    const speed = 400;
    this.sprite.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    // Destroy after 1.5s or when out of bounds
    scene.time.delayedCall(1500, () => this.destroy());
  }

  update() {
    if (!this.active) return;
    const { x, y } = this.sprite;
    if (x < 0 || x > 900 || y < 0 || y > 650) {
      this.destroy();
    }
  }

  destroy() {
    if (!this.active) return;
    this.active = false;
    this.sprite.destroy();
  }
}
