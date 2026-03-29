export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    create() {
        const { width, height } = this.scale;

        // Title
        this.add.text(width / 2, height / 4 - 10, 'BATTLE ROYALE', {
            fontSize: '48px',
            fontFamily: 'Arial Black, Arial',
            color: '#e74c3c',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, height / 4 + 40, 'Last One Standing', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#bdc3c7'
        }).setOrigin(0.5);

        // Player skin preview
        const progression = this.registry.get('progression');
        const skinId = progression.data.selectedSkin;
        this.add.sprite(width / 2, height / 4 + 95, `player_${skinId}`).setScale(2);

        // Buttons
        const btnStart = height / 2 + 20;
        const btnGap = 55;

        this.createButton(width / 2, btnStart, 'PLAY', () => {
            this.scene.start('GameScene');
        });

        this.createButton(width / 2, btnStart + btnGap, 'SKINS', () => {
            this.scene.start('SkinSelectScene');
        });

        // Difficulty button — shows current setting
        const diff = this.registry.get('difficulty') || 'mixed';
        const diffLabel = diff.charAt(0).toUpperCase() + diff.slice(1);
        this.createButton(width / 2, btnStart + btnGap * 2, `DIFFICULTY: ${diffLabel}`, () => {
            this.showDifficultyPicker();
        });

        this.createButton(width / 2, btnStart + btnGap * 3, 'STATS', () => {
            this.showStats();
        });

        // Overlays (hidden by default)
        this.statsContainer = this.add.container(0, 0).setVisible(false);
        this.diffContainer = this.add.container(0, 0).setVisible(false);
    }

    createButton(x, y, text, callback) {
        const bg = this.add.graphics();
        bg.fillStyle(0x2c3e50, 1);
        bg.fillRoundedRect(x - 100, y - 22, 200, 44, 8);
        bg.lineStyle(2, 0x3498db, 1);
        bg.strokeRoundedRect(x - 100, y - 22, 200, 44, 8);

        const label = this.add.text(x, y, text, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ecf0f1'
        }).setOrigin(0.5);

        const hitArea = this.add.rectangle(x, y, 200, 44).setInteractive({ useHandCursor: true });

        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x34495e, 1);
            bg.fillRoundedRect(x - 100, y - 22, 200, 44, 8);
            bg.lineStyle(2, 0x2ecc71, 1);
            bg.strokeRoundedRect(x - 100, y - 22, 200, 44, 8);
            label.setColor('#2ecc71');
        });

        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x2c3e50, 1);
            bg.fillRoundedRect(x - 100, y - 22, 200, 44, 8);
            bg.lineStyle(2, 0x3498db, 1);
            bg.strokeRoundedRect(x - 100, y - 22, 200, 44, 8);
            label.setColor('#ecf0f1');
        });

        hitArea.on('pointerdown', callback);
    }

    showDifficultyPicker() {
        if (this.diffContainer.visible) {
            this.diffContainer.setVisible(false);
            return;
        }

        this.diffContainer.removeAll(true);
        const { width, height } = this.scale;
        const current = this.registry.get('difficulty') || 'mixed';

        // Background panel
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.9);
        bg.fillRoundedRect(width / 2 - 150, height / 2 - 130, 300, 290, 12);
        bg.lineStyle(2, 0xe67e22, 1);
        bg.strokeRoundedRect(width / 2 - 150, height / 2 - 130, 300, 290, 12);
        this.diffContainer.add(bg);

        const title = this.add.text(width / 2, height / 2 - 105, 'BOT DIFFICULTY', {
            fontSize: '22px', fontFamily: 'Arial Black, Arial', color: '#e67e22'
        }).setOrigin(0.5);
        this.diffContainer.add(title);

        const options = [
            { key: 'easy',   label: 'Easy',   desc: 'Low accuracy, slow reactions', color: '#2ecc71' },
            { key: 'medium', label: 'Medium', desc: 'Balanced aim and reactions',   color: '#f1c40f' },
            { key: 'hard',   label: 'Hard',   desc: 'High accuracy, fast and dodge', color: '#e74c3c' },
            { key: 'mixed',  label: 'Mixed',  desc: '40% Easy, 40% Med, 20% Hard',  color: '#3498db' }
        ];

        options.forEach((opt, i) => {
            const y = height / 2 - 55 + i * 50;
            const isSelected = current === opt.key;

            const optBg = this.add.graphics();
            optBg.fillStyle(isSelected ? 0x34495e : 0x1a1a2e, 1);
            optBg.fillRoundedRect(width / 2 - 120, y - 18, 240, 40, 6);
            optBg.lineStyle(2, isSelected ? Phaser.Display.Color.HexStringToColor(opt.color).color : 0x444444, 1);
            optBg.strokeRoundedRect(width / 2 - 120, y - 18, 240, 40, 6);
            this.diffContainer.add(optBg);

            const labelText = this.add.text(width / 2 - 100, y - 6, opt.label, {
                fontSize: '18px', fontFamily: 'Arial Black, Arial', color: opt.color
            }).setOrigin(0, 0.5);
            this.diffContainer.add(labelText);

            const descText = this.add.text(width / 2 + 110, y - 6, opt.desc, {
                fontSize: '10px', fontFamily: 'Arial', color: '#999999'
            }).setOrigin(1, 0.5);
            this.diffContainer.add(descText);

            if (isSelected) {
                const check = this.add.text(width / 2 - 130, y - 6, '>', {
                    fontSize: '18px', fontFamily: 'Arial', color: opt.color
                }).setOrigin(0, 0.5);
                this.diffContainer.add(check);
            }

            // Click to select
            const hitArea = this.add.rectangle(width / 2, y, 240, 40).setInteractive({ useHandCursor: true });
            hitArea.setAlpha(0.001);
            this.diffContainer.add(hitArea);

            hitArea.on('pointerdown', () => {
                this.registry.set('difficulty', opt.key);
                this.diffContainer.setVisible(false);
                this.scene.restart(); // Refresh menu to update button label
            });
        });

        // Close button
        const closeBtn = this.add.text(width / 2, height / 2 + 140, '[ CLOSE ]', {
            fontSize: '16px', fontFamily: 'Arial', color: '#e74c3c'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.diffContainer.setVisible(false));
        this.diffContainer.add(closeBtn);

        this.diffContainer.setDepth(50);
        this.diffContainer.setVisible(true);
    }

    showStats() {
        if (this.statsContainer.visible) {
            this.statsContainer.setVisible(false);
            return;
        }

        this.statsContainer.removeAll(true);
        const { width, height } = this.scale;
        const progression = this.registry.get('progression');
        const stats = progression.data.stats;

        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.85);
        bg.fillRoundedRect(width / 2 - 160, height / 2 - 120, 320, 280, 12);
        bg.lineStyle(2, 0x3498db, 1);
        bg.strokeRoundedRect(width / 2 - 160, height / 2 - 120, 320, 280, 12);
        this.statsContainer.add(bg);

        const title = this.add.text(width / 2, height / 2 - 95, 'STATS', {
            fontSize: '24px', fontFamily: 'Arial', color: '#3498db'
        }).setOrigin(0.5);
        this.statsContainer.add(title);

        const lines = [
            `Games Played: ${stats.gamesPlayed}`,
            `Wins: ${stats.wins}`,
            `Total Kills: ${stats.totalKills}`,
            `Best Kills (Match): ${stats.bestKillsInMatch}`,
            `Total Damage: ${stats.totalDamageDealt}`,
            `Skins Unlocked: ${progression.data.unlockedSkins.length}`
        ];

        lines.forEach((line, i) => {
            const t = this.add.text(width / 2, height / 2 - 55 + i * 32, line, {
                fontSize: '16px', fontFamily: 'Arial', color: '#ecf0f1'
            }).setOrigin(0.5);
            this.statsContainer.add(t);
        });

        const closeBtn = this.add.text(width / 2, height / 2 + 130, '[ CLOSE ]', {
            fontSize: '16px', fontFamily: 'Arial', color: '#e74c3c'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.statsContainer.setVisible(false));
        this.statsContainer.add(closeBtn);

        this.statsContainer.setDepth(50);
        this.statsContainer.setVisible(true);
    }
}
