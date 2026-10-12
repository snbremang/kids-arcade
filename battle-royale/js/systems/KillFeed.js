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

    // highlightColor (optional): a 0xRRGGBB skin color, tinted into the entry's
    // background so your own kills stand out from everyone else's in the feed.
    addKill(killerName, victimName, highlightColor = null) {
        const { width } = this.scene.scale;

        const style = {
            fontSize: '13px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: highlightColor != null ? this.toRgba(highlightColor, 0.65) : '#00000088',
            padding: { x: 8, y: 4 }
        };
        if (highlightColor != null) {
            style.stroke = '#000000';
            style.strokeThickness = 2;
        }

        const text = this.scene.add.text(width - 10, 0, `${killerName} eliminated ${victimName}`, style).setOrigin(1, 0);

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

    toRgba(hexColor, alpha) {
        const r = (hexColor >> 16) & 0xff;
        const g = (hexColor >> 8) & 0xff;
        const b = hexColor & 0xff;
        return `rgba(${r},${g},${b},${alpha})`;
    }

    repositionEntries() {
        const startY = 85; // below the HUD's Kills/Alive text and the touch-controls toggle button
        this.entries.forEach((entry, i) => {
            entry.text.setY(startY + i * 26);
        });
    }
}
