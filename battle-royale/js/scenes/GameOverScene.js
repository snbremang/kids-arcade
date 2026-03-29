import { WEAPONS, COLORS } from '../constants.js';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create(data) {
        const { width, height } = this.scale;
        const { won, kills, damageDealt, survivalTime, playersDefeated, killedBy } = data;

        // Record match stats
        const progression = this.registry.get('progression');
        progression.recordMatch({
            won,
            kills,
            damageDealt,
            survivalTimeSec: survivalTime
        });

        // Check for new skin unlocks
        const newUnlocks = progression.checkUnlocks();

        // Background overlay
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);

        // Result text
        const resultText = won ? 'VICTORY ROYALE!' : 'DEFEATED';
        const resultColor = won ? '#f1c40f' : '#e74c3c';
        this.add.text(width / 2, 60, resultText, {
            fontSize: '42px',
            fontFamily: 'Arial Black, Arial',
            color: resultColor,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Killed-by info (only on defeat)
        let killedByOffset = 0;
        if (!won && killedBy) {
            killedByOffset = 50;

            if (killedBy.cause === 'storm') {
                this.add.text(width / 2, 110, 'Eliminated by', {
                    fontSize: '14px', fontFamily: 'Arial', color: '#999999'
                }).setOrigin(0.5);
                this.add.text(width / 2, 132, 'The Storm', {
                    fontSize: '22px', fontFamily: 'Arial Black, Arial',
                    color: '#8b0000', stroke: '#000000', strokeThickness: 2
                }).setOrigin(0.5);
            } else {
                // Get killer colour from BOT_COLORS
                const killerHex = killedBy.killerColorIndex >= 0
                    ? '#' + COLORS.BOT_COLORS[killedBy.killerColorIndex % COLORS.BOT_COLORS.length].toString(16).padStart(6, '0')
                    : '#ecf0f1';

                // Get weapon info
                const weapon = killedBy.weaponKey ? WEAPONS[killedBy.weaponKey] : null;
                const weaponHex = weapon ? '#' + weapon.color.toString(16).padStart(6, '0') : '#ecf0f1';
                const weaponName = weapon ? weapon.name : 'Unknown';

                this.add.text(width / 2, 108, 'Eliminated by', {
                    fontSize: '14px', fontFamily: 'Arial', color: '#999999'
                }).setOrigin(0.5);

                // Killer name in their colour
                this.add.text(width / 2, 132, killedBy.killerName, {
                    fontSize: '24px', fontFamily: 'Arial Black, Arial',
                    color: killerHex, stroke: '#000000', strokeThickness: 2
                }).setOrigin(0.5);

                // Weapon name in weapon colour
                this.add.text(width / 2, 158, `with ${weaponName}`, {
                    fontSize: '16px', fontFamily: 'Arial',
                    color: weaponHex
                }).setOrigin(0.5);
            }
        }

        // Stats
        const statsY = 110 + killedByOffset;
        const mins = Math.floor(survivalTime / 60);
        const secs = survivalTime % 60;
        const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

        const statsLines = [
            `Kills: ${kills}`,
            `Damage Dealt: ${damageDealt}`,
            `Survival Time: ${timeStr}`,
            `Players Defeated: ${playersDefeated}`
        ];

        statsLines.forEach((line, i) => {
            this.add.text(width / 2, statsY + 70 + i * 32, line, {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#ecf0f1'
            }).setOrigin(0.5);
        });

        // New unlocks
        const unlockY = statsY + 210;
        if (newUnlocks.length > 0) {
            this.add.text(width / 2, unlockY, 'NEW SKINS UNLOCKED!', {
                fontSize: '22px',
                fontFamily: 'Arial',
                color: '#2ecc71'
            }).setOrigin(0.5);

            newUnlocks.forEach((skin, i) => {
                this.add.text(width / 2, unlockY + 35 + i * 28, `${skin.name}`, {
                    fontSize: '18px',
                    fontFamily: 'Arial',
                    color: '#f1c40f'
                }).setOrigin(0.5);
            });
        }

        // Buttons
        const btnY = newUnlocks.length > 0 ? unlockY + 80 : statsY + 210;

        this.createButton(width / 2, btnY, 'PLAY AGAIN', () => {
            this.scene.start('GameScene');
        });

        this.createButton(width / 2, btnY + 60, 'MAIN MENU', () => {
            this.scene.start('MainMenuScene');
        });
    }

    createButton(x, y, text, callback) {
        const bg = this.add.graphics();
        bg.fillStyle(0x2c3e50, 1);
        bg.fillRoundedRect(x - 110, y - 22, 220, 44, 8);
        bg.lineStyle(2, 0x3498db, 1);
        bg.strokeRoundedRect(x - 110, y - 22, 220, 44, 8);

        const label = this.add.text(x, y, text, {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ecf0f1'
        }).setOrigin(0.5);

        const hitArea = this.add.rectangle(x, y, 220, 44).setInteractive({ useHandCursor: true });

        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x34495e, 1);
            bg.fillRoundedRect(x - 110, y - 22, 220, 44, 8);
            bg.lineStyle(2, 0x2ecc71, 1);
            bg.strokeRoundedRect(x - 110, y - 22, 220, 44, 8);
            label.setColor('#2ecc71');
        });

        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x2c3e50, 1);
            bg.fillRoundedRect(x - 110, y - 22, 220, 44, 8);
            bg.lineStyle(2, 0x3498db, 1);
            bg.strokeRoundedRect(x - 110, y - 22, 220, 44, 8);
            label.setColor('#ecf0f1');
        });

        hitArea.on('pointerdown', callback);
    }
}
