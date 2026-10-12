import { SKINS, COLORS, WEAPONS, MAP } from '../constants.js';
import { ProgressionManager } from '../data/ProgressionManager.js';
import { SPRITE_SHEET_KEY, SPRITE_FRAMES, frameKey } from '../data/SpriteAtlas.js';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        this.load.image(SPRITE_SHEET_KEY, 'js/assets/battle_royale_game_sprites.PNG');
    }

    create() {
        const progression = new ProgressionManager();
        this.registry.set('progression', progression);

        // Set default difficulty if not already set
        if (!this.registry.get('difficulty')) {
            this.registry.set('difficulty', 'mixed');
        }

        this.generateTextures();
        this.scene.start('MainMenuScene');
    }

    generateTextures() {
        // Skip if textures already exist (e.g. returning from skin select / game over)
        // Note: tileset_combined is generated fresh in MapGenerator every game start
        if (this.textures.exists('crosshair')) {
            return;
        }

        // Register one named frame per skin x weapon from the loaded sprite sheet.
        // Players and bots both draw from these; which skin they use is decided at spawn time.
        const sheet = this.textures.get(SPRITE_SHEET_KEY);
        for (const skin of SKINS) {
            const frames = SPRITE_FRAMES[skin.id];
            for (const weaponKey of Object.keys(frames)) {
                const rect = frames[weaponKey];
                sheet.add(frameKey(skin.id, weaponKey), 0, rect.x, rect.y, rect.w, rect.h);
            }
        }

        // Bullet textures per weapon
        for (const [key, weapon] of Object.entries(WEAPONS)) {
            const bullet = this.add.graphics();
            bullet.fillStyle(weapon.color, 1);
            bullet.fillCircle(weapon.bulletSize, weapon.bulletSize, weapon.bulletSize);
            bullet.generateTexture(`bullet_${key}`, weapon.bulletSize * 2, weapon.bulletSize * 2);
            bullet.destroy();
        }

        // Weapon pickup textures
        for (const [key, weapon] of Object.entries(WEAPONS)) {
            const pickup = this.add.graphics();
            pickup.fillStyle(0x333333, 0.7);
            pickup.fillRoundedRect(0, 0, 24, 24, 4);
            pickup.fillStyle(weapon.color, 1);
            pickup.fillRect(6, 10, 12, 4);
            pickup.fillRect(4, 8, 4, 8);
            pickup.generateTexture(`pickup_${key}`, 24, 24);
            pickup.destroy();
        }

        // Health pickup
        const health = this.add.graphics();
        health.fillStyle(0x333333, 0.7);
        health.fillRoundedRect(0, 0, 24, 24, 4);
        health.fillStyle(COLORS.HEALTH_PICKUP, 1);
        health.fillRect(9, 4, 6, 16);
        health.fillRect(4, 9, 16, 6);
        health.generateTexture('pickup_health', 24, 24);
        health.destroy();

        // Crosshair
        const cross = this.add.graphics();
        cross.lineStyle(2, 0xffffff, 0.8);
        cross.strokeCircle(12, 12, 8);
        cross.lineBetween(12, 0, 12, 6);
        cross.lineBetween(12, 18, 12, 24);
        cross.lineBetween(0, 12, 6, 12);
        cross.lineBetween(18, 12, 24, 12);
        cross.generateTexture('crosshair', 24, 24);
        cross.destroy();
    }
}
