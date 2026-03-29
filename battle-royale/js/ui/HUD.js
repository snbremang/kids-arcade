import { WEAPONS } from '../constants.js';
import { HealthBar } from './HealthBar.js';

export class HUD {
    constructor(scene) {
        this.scene = scene;

        // Health bar
        this.healthBar = new HealthBar(scene, 10, 10, 180, 20);

        // Health text
        this.healthText = scene.add.text(100, 12, '100', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5, 0).setDepth(101).setScrollFactor(0);

        // Weapon display
        this.weaponText = scene.add.text(210, 12, 'Pistol', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#f1c40f'
        }).setDepth(101).setScrollFactor(0);

        // Ammo
        this.ammoText = scene.add.text(210, 30, 'Ammo: ∞', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#bdc3c7'
        }).setDepth(101).setScrollFactor(0);

        // Kills
        this.killsText = scene.add.text(scene.scale.width - 10, 10, 'Kills: 0', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#e74c3c'
        }).setOrigin(1, 0).setDepth(101).setScrollFactor(0);

        // Players remaining
        this.playersText = scene.add.text(scene.scale.width - 10, 32, 'Alive: 16', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#bdc3c7'
        }).setOrigin(1, 0).setDepth(101).setScrollFactor(0);

        // Storm timer
        this.stormText = scene.add.text(scene.scale.width / 2, 10, '', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#e74c3c',
            backgroundColor: '#00000088',
            padding: { x: 10, y: 4 }
        }).setOrigin(0.5, 0).setDepth(101).setScrollFactor(0);

        // Weapon inventory bar
        this.inventoryGraphics = scene.add.graphics();
        this.inventoryGraphics.setDepth(100);
        this.inventoryGraphics.setScrollFactor(0);

        // Controls hint
        this.controlsText = scene.add.text(scene.scale.width / 2, scene.scale.height - 15, 'WASD: Move | Mouse: Aim & Shoot | Scroll/Q/E: Switch Weapon | 1-4: Select Weapon', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#666666'
        }).setOrigin(0.5, 1).setDepth(101).setScrollFactor(0);
    }

    update() {
        const player = this.scene.player;
        if (!player.active) return;

        // Health
        this.healthBar.update(player.health, player.maxHealth);
        this.healthText.setText(Math.ceil(player.health).toString());

        // Weapon
        const ws = player.weaponSystem;
        const weaponConfig = ws.getCurrentConfig();
        this.weaponText.setText(weaponConfig.name);
        this.weaponText.setColor('#' + weaponConfig.color.toString(16).padStart(6, '0'));
        this.ammoText.setText(`Ammo: ${ws.getAmmoDisplay()}`);

        // Kills
        this.killsText.setText(`Kills: ${this.scene.kills}`);

        // Players remaining
        const alive = this.scene.getAliveEntities().length;
        this.playersText.setText(`Alive: ${alive}`);

        // Storm
        const storm = this.scene.stormSystem;
        const timeUntil = storm.getTimeUntilShrink();
        if (storm.shrinking) {
            const progress = Math.floor(storm.getShrinkProgress() * 100);
            this.stormText.setText(`Storm closing... ${progress}%`);
        } else if (timeUntil > 0) {
            this.stormText.setText(`Storm closes in: ${timeUntil}s`);
        } else {
            this.stormText.setText('');
        }

        // Draw weapon inventory
        this.drawInventory(ws);
    }

    drawInventory(ws) {
        this.inventoryGraphics.clear();

        const startX = 10;
        const startY = 40;
        const slotW = 50;
        const slotH = 30;
        const gap = 4;

        const allWeapons = ['pistol', 'shotgun', 'assault_rifle', 'sniper'];

        allWeapons.forEach((key, i) => {
            const x = startX + i * (slotW + gap);
            const y = startY;
            const hasWeapon = ws.inventory.includes(key);
            const isActive = ws.currentWeapon === key;

            // Slot background
            this.inventoryGraphics.fillStyle(hasWeapon ? 0x2c3e50 : 0x1a1a2e, hasWeapon ? 0.8 : 0.4);
            this.inventoryGraphics.fillRoundedRect(x, y, slotW, slotH, 3);

            // Active border
            if (isActive) {
                this.inventoryGraphics.lineStyle(2, 0x2ecc71, 1);
            } else {
                this.inventoryGraphics.lineStyle(1, 0x555555, 0.5);
            }
            this.inventoryGraphics.strokeRoundedRect(x, y, slotW, slotH, 3);

            // Weapon color indicator
            if (hasWeapon) {
                this.inventoryGraphics.fillStyle(WEAPONS[key].color, 1);
                this.inventoryGraphics.fillRect(x + 4, y + slotH - 6, slotW - 8, 3);
            }
        });
    }

    destroy() {
        this.healthBar.destroy();
        this.healthText.destroy();
        this.weaponText.destroy();
        this.ammoText.destroy();
        this.killsText.destroy();
        this.playersText.destroy();
        this.stormText.destroy();
        this.inventoryGraphics.destroy();
        this.controlsText.destroy();
    }
}
