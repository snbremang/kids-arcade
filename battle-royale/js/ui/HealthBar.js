export class HealthBar {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.graphics = scene.add.graphics();
        this.graphics.setDepth(100);
        this.graphics.setScrollFactor(0);
    }

    update(current, max) {
        this.graphics.clear();

        const pct = current / max;

        // Background
        this.graphics.fillStyle(0x000000, 0.6);
        this.graphics.fillRoundedRect(this.x, this.y, this.width, this.height, 3);

        // Border
        this.graphics.lineStyle(1, 0x555555, 1);
        this.graphics.strokeRoundedRect(this.x, this.y, this.width, this.height, 3);

        // Fill
        const color = pct > 0.5 ? 0x2ecc71 : (pct > 0.25 ? 0xf1c40f : 0xe74c3c);
        this.graphics.fillStyle(color, 1);
        this.graphics.fillRoundedRect(this.x + 2, this.y + 2, (this.width - 4) * pct, this.height - 4, 2);
    }

    destroy() {
        this.graphics.destroy();
    }
}
