import { MAP, COLORS } from '../constants.js';

export class Minimap {
    constructor(scene) {
        this.scene = scene;
        this.size = 140;
        this.padding = 10;

        const { width, height } = scene.scale;
        this.x = width - this.size - this.padding;
        this.y = height - this.size - this.padding;

        this.graphics = scene.add.graphics();
        this.graphics.setDepth(100);
        this.graphics.setScrollFactor(0);

        this.lastUpdate = 0;
        this.updateInterval = 200; // ms
    }

    update() {
        const now = this.scene.time.now;
        if (now - this.lastUpdate < this.updateInterval) return;
        this.lastUpdate = now;

        this.graphics.clear();
        const scale = this.size / MAP.WIDTH_PX;

        // Background
        this.graphics.fillStyle(0x000000, 0.6);
        this.graphics.fillRoundedRect(this.x - 2, this.y - 2, this.size + 4, this.size + 4, 4);

        // Map background
        this.graphics.fillStyle(COLORS.GROUND, 0.8);
        this.graphics.fillRect(this.x, this.y, this.size, this.size);

        // Border
        this.graphics.lineStyle(1, 0x555555, 1);
        this.graphics.strokeRect(this.x, this.y, this.size, this.size);

        // Storm zone
        const storm = this.scene.stormSystem;
        if (storm && storm.zone.radius > 0) {
            this.graphics.lineStyle(2, 0xff0000, 0.8);
            this.graphics.strokeCircle(
                this.x + storm.zone.centerX * scale,
                this.y + storm.zone.centerY * scale,
                storm.zone.radius * scale
            );
        }

        // Pickups (white dots)
        this.graphics.fillStyle(0xffffff, 0.5);
        if (this.scene.pickupGroup) {
            this.scene.pickupGroup.getChildren().forEach(p => {
                if (!p.active) return;
                this.graphics.fillRect(
                    this.x + p.x * scale - 1,
                    this.y + p.y * scale - 1,
                    2, 2
                );
            });
        }

        // Bots (red dots)
        this.graphics.fillStyle(0xff4444, 1);
        for (const bot of this.scene.bots) {
            if (!bot.active) continue;
            this.graphics.fillRect(
                this.x + bot.x * scale - 2,
                this.y + bot.y * scale - 2,
                4, 4
            );
        }

        // Player (green dot, larger)
        if (this.scene.player.active) {
            this.graphics.fillStyle(0x2ecc71, 1);
            this.graphics.fillRect(
                this.x + this.scene.player.x * scale - 3,
                this.y + this.scene.player.y * scale - 3,
                6, 6
            );
        }

        // Camera view rectangle
        const cam = this.scene.cameras.main;
        this.graphics.lineStyle(1, 0xffffff, 0.4);
        this.graphics.strokeRect(
            this.x + cam.scrollX * scale,
            this.y + cam.scrollY * scale,
            cam.width * scale,
            cam.height * scale
        );
    }

    destroy() {
        this.graphics.destroy();
    }
}
