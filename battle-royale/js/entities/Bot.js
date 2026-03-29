import { PLAYER, BOT, COLORS } from '../constants.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { AIStateMachine } from '../systems/AIStateMachine.js';

const BOT_NAMES = [
    'Shadow', 'Blaze', 'Frost', 'Viper', 'Storm',
    'Raven', 'Wolf', 'Phoenix', 'Cobra', 'Hawk',
    'Ghost', 'Titan', 'Nova', 'Rex', 'Ace'
];

export class Bot extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, index) {
        super(scene, x, y, `bot_${index % COLORS.BOT_COLORS.length}`);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDepth(4);
        this.setCollideWorldBounds(true);

        // Circular body
        this.body.setCircle(PLAYER.BODY_RADIUS, PLAYER.SIZE / 2 - PLAYER.BODY_RADIUS, PLAYER.SIZE / 2 - PLAYER.BODY_RADIUS);

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
