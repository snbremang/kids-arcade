import { PLAYER, BOT, SKINS } from '../constants.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { AIStateMachine } from '../systems/AIStateMachine.js';
import { SPRITE_SHEET_KEY, frameKey, applySkinFrame } from '../data/SpriteAtlas.js';
import { randomFromArray } from '../utils.js';

const BOT_NAMES = [
    'Shadow', 'Blaze', 'Frost', 'Viper', 'Storm',
    'Raven', 'Wolf', 'Phoenix', 'Cobra', 'Hawk',
    'Ghost', 'Titan', 'Nova', 'Rex', 'Ace'
];

export class Bot extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, index) {
        // Random skin per bot, never the one the player is wearing
        const playerSkinId = scene.player ? scene.player.skinId : null;
        const pool = SKINS.filter(s => s.id !== playerSkinId);
        const skinId = randomFromArray(pool.length ? pool : SKINS).id;

        super(scene, x, y, SPRITE_SHEET_KEY, frameKey(skinId, 'pistol'));

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDepth(4);
        this.setCollideWorldBounds(true);

        // Texture frame + scale + physics circle, keyed to the chosen skin and held weapon
        applySkinFrame(this, skinId, 'pistol');

        this.health = PLAYER.MAX_HEALTH;
        this.maxHealth = PLAYER.MAX_HEALTH;
        this.botName = BOT_NAMES[index % BOT_NAMES.length];
        this.botIndex = index;

        this.weaponSystem = new WeaponSystem(this, scene);

        // Assign difficulty tier based on selected setting
        const setting = scene.registry.get('difficulty') || 'mixed';
        let difficulty;
        if (setting === 'easy') {
            difficulty = BOT.DIFFICULTIES.EASY;
        } else if (setting === 'medium') {
            difficulty = BOT.DIFFICULTIES.MEDIUM;
        } else if (setting === 'hard') {
            difficulty = BOT.DIFFICULTIES.HARD;
        } else {
            // Mixed: random weighted distribution
            const roll = Math.random();
            if (roll < BOT.DIFFICULTIES.EASY.weight) {
                difficulty = BOT.DIFFICULTIES.EASY;
            } else if (roll < BOT.DIFFICULTIES.EASY.weight + BOT.DIFFICULTIES.MEDIUM.weight) {
                difficulty = BOT.DIFFICULTIES.MEDIUM;
            } else {
                difficulty = BOT.DIFFICULTIES.HARD;
            }
        }

        this.ai = new AIStateMachine(this, scene, difficulty);
    }

    update(time, delta) {
        if (!this.active || !this.body) return;
        this.ai.update(time, delta);

        // Sprite follows whichever weapon is currently equipped
        if (this.weaponSystem.currentWeapon !== this.weaponFrame) {
            applySkinFrame(this, this.skinId, this.weaponSystem.currentWeapon);
        }
    }

    // Health bars are now drawn by a shared Graphics in GameScene
    takeDamage(amount, source) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }
}
