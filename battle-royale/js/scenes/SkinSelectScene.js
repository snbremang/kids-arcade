import { SKINS } from '../constants.js';

export class SkinSelectScene extends Phaser.Scene {
    constructor() {
        super('SkinSelectScene');
    }

    create() {
        const { width, height } = this.scale;
        const progression = this.registry.get('progression');

        this.add.text(width / 2, 40, 'SELECT SKIN', {
            fontSize: '32px',
            fontFamily: 'Arial Black, Arial',
            color: '#3498db',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Grid layout
        const cols = 4;
        const cellW = 160;
        const cellH = 120;
        const startX = (width - cols * cellW) / 2 + cellW / 2;
        const startY = 100;

        SKINS.forEach((skin, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * cellW;
            const y = startY + row * cellH;

            const isUnlocked = progression.data.unlockedSkins.includes(skin.id);
            const isSelected = progression.data.selectedSkin === skin.id;

            // Card background
            const bg = this.add.graphics();
            const borderColor = isSelected ? 0x2ecc71 : (isUnlocked ? 0x3498db : 0x555555);
            bg.fillStyle(isUnlocked ? 0x2c3e50 : 0x1a1a2e, 1);
            bg.fillRoundedRect(x - cellW / 2 + 8, y - 10, cellW - 16, cellH - 10, 6);
            bg.lineStyle(2, borderColor, 1);
            bg.strokeRoundedRect(x - cellW / 2 + 8, y - 10, cellW - 16, cellH - 10, 6);

            // Skin preview (character sprite or lock icon)
            if (isUnlocked) {
                const sprite = this.add.sprite(x, y + 15, `player_${skin.id}`).setScale(1.5);

                if (isSelected) {
                    this.add.text(x, y + 45, 'EQUIPPED', {
                        fontSize: '11px', fontFamily: 'Arial', color: '#2ecc71'
                    }).setOrigin(0.5);
                }

                // Name
                this.add.text(x, y - 2, skin.name, {
                    fontSize: '12px', fontFamily: 'Arial', color: '#ecf0f1'
                }).setOrigin(0.5);

                // Click to select
                if (!isSelected) {
                    const hitArea = this.add.rectangle(x, y + 20, cellW - 20, cellH - 15).setInteractive({ useHandCursor: true });
                    hitArea.setAlpha(0.001);
                    hitArea.on('pointerdown', () => {
                        progression.setSelectedSkin(skin.id);
                        this.scene.restart();
                    });
                }
            } else {
                // Locked
                this.add.text(x, y + 5, '🔒', {
                    fontSize: '24px'
                }).setOrigin(0.5);

                this.add.text(x, y - 5, skin.name, {
                    fontSize: '12px', fontFamily: 'Arial', color: '#666666'
                }).setOrigin(0.5);

                this.add.text(x, y + 40, skin.condition.label, {
                    fontSize: '9px', fontFamily: 'Arial', color: '#888888'
                }).setOrigin(0.5);
            }
        });

        // Back button
        this.createButton(width / 2, height - 50, 'BACK', () => {
            this.scene.start('MainMenuScene');
        });
    }

    createButton(x, y, text, callback) {
        const bg = this.add.graphics();
        bg.fillStyle(0x2c3e50, 1);
        bg.fillRoundedRect(x - 80, y - 20, 160, 40, 8);
        bg.lineStyle(2, 0xe74c3c, 1);
        bg.strokeRoundedRect(x - 80, y - 20, 160, 40, 8);

        const label = this.add.text(x, y, text, {
            fontSize: '18px', fontFamily: 'Arial', color: '#ecf0f1'
        }).setOrigin(0.5);

        const hitArea = this.add.rectangle(x, y, 160, 40).setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', callback);
    }
}
