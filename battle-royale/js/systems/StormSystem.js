import { STORM, MAP } from '../constants.js';
import { lerp } from '../utils.js';

export class StormSystem {
    constructor(scene) {
        this.scene = scene;

        this.zone = {
            centerX: MAP.WIDTH_PX / 2,
            centerY: MAP.HEIGHT_PX / 2,
            radius: STORM.PHASES[0].radius
        };

        this.currentPhase = 0;
        this.phaseTime = 0;
        this.shrinking = false;
        this.currentDamage = 0;

        this.targetZone = { ...this.zone };
        this.startZone = { ...this.zone };

        // Simple lightweight graphics - just circle outlines
        this.edgeGraphics = scene.add.graphics();
        this.edgeGraphics.setDepth(49);
    }

    update(time, delta) {
        const phase = STORM.PHASES[this.currentPhase];
        this.phaseTime += delta;

        if (!this.shrinking) {
            if (this.phaseTime >= phase.waitTime) {
                this.startShrink();
            }
        } else {
            const progress = Math.min(this.phaseTime / phase.shrinkDuration, 1);
            this.zone.centerX = lerp(this.startZone.centerX, this.targetZone.centerX, progress);
            this.zone.centerY = lerp(this.startZone.centerY, this.targetZone.centerY, progress);
            this.zone.radius = lerp(this.startZone.radius, this.targetZone.radius, progress);

            if (progress >= 1) {
                this.advancePhase();
            }
        }

        this.currentDamage = phase.damage;
        this.renderStorm();
    }

    startShrink() {
        this.shrinking = true;
        this.phaseTime = 0;

        const nextPhase = STORM.PHASES[Math.min(this.currentPhase + 1, STORM.PHASES.length - 1)];

        const maxDrift = this.zone.radius - nextPhase.radius;
        const angle = Math.random() * Math.PI * 2;
        const drift = Math.random() * Math.max(0, maxDrift * 0.4);

        this.startZone = { ...this.zone };
        this.targetZone = {
            centerX: this.zone.centerX + Math.cos(angle) * drift,
            centerY: this.zone.centerY + Math.sin(angle) * drift,
            radius: nextPhase.radius
        };

        this.targetZone.centerX = Phaser.Math.Clamp(
            this.targetZone.centerX,
            this.targetZone.radius,
            MAP.WIDTH_PX - this.targetZone.radius
        );
        this.targetZone.centerY = Phaser.Math.Clamp(
            this.targetZone.centerY,
            this.targetZone.radius,
            MAP.HEIGHT_PX - this.targetZone.radius
        );
    }

    advancePhase() {
        this.currentPhase = Math.min(this.currentPhase + 1, STORM.PHASES.length - 1);
        this.shrinking = false;
        this.phaseTime = 0;
        this.startZone = { ...this.zone };
    }

    renderStorm() {
        this.edgeGraphics.clear();

        const cx = this.zone.centerX;
        const cy = this.zone.centerY;
        const r = this.zone.radius;

        if (r <= 0) return;

        // Safe zone border - thick white/blue circle
        this.edgeGraphics.lineStyle(4, 0x3498db, 0.7);
        this.edgeGraphics.strokeCircle(cx, cy, r);

        // Danger tint - thin red circle just outside
        this.edgeGraphics.lineStyle(8, 0xff0000, 0.25);
        this.edgeGraphics.strokeCircle(cx, cy, r + 6);

        // Next zone preview if shrinking
        if (this.shrinking) {
            this.edgeGraphics.lineStyle(2, 0xffffff, 0.3);
            this.edgeGraphics.strokeCircle(
                this.targetZone.centerX,
                this.targetZone.centerY,
                this.targetZone.radius
            );
        }
    }

    getTimeUntilShrink() {
        const phase = STORM.PHASES[this.currentPhase];
        if (this.shrinking) return 0;
        return Math.max(0, Math.ceil((phase.waitTime - this.phaseTime) / 1000));
    }

    getShrinkProgress() {
        if (!this.shrinking) return 0;
        const phase = STORM.PHASES[this.currentPhase];
        return Math.min(this.phaseTime / phase.shrinkDuration, 1);
    }
}
