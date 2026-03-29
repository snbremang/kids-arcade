export class KillFeed {
    constructor(scene) {
        this.scene = scene;
        this.entries = [];
        this.maxEntries = 5;
        this.entryDuration = 4000;

        this.container = scene.add.container(0, 0);
        this.container.setDepth(100);
        this.container.setScrollFactor(0);
    }

    addKill(killerName, victimName) {
        const { width } = this.scene.scale;

        const text = this.scene.add.text(width - 10, 0, `${killerName} eliminated ${victimName}`, {
            fontSize: '13px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#00000088',
            padding: { x: 8, y: 4 }
        }).setOrigin(1, 0);

        const entry = {
            text,
            timer: this.entryDuration
        };

        this.entries.unshift(entry);
        this.container.add(text);

        // Remove excess
        while (this.entries.length > this.maxEntries) {
            const removed = this.entries.pop();
            removed.text.destroy();
        }

        this.repositionEntries();

        // Fade out timer
        this.scene.time.delayedCall(this.entryDuration, () => {
            const idx = this.entries.indexOf(entry);
            if (idx !== -1) {
                this.entries.splice(idx, 1);
                entry.text.destroy();
                this.repositionEntries();
            }
        });
    }

    repositionEntries() {
        const startY = 60;
        this.entries.forEach((entry, i) => {
            entry.text.setY(startY + i * 26);
        });
    }
}
