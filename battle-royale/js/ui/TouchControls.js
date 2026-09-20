import { touchControlsEnabled, setTouchControls } from '../systems/Settings.js';

const DEPTH = 150;
const DPAD = { x: 105, y: 490, spacing: 50, btn: 46, hitR: 90, dead: 16 };
const SHOOT = { x: 575, y: 500, r: 48, hitR: 58, drag: 14 };
const WEAPON = { x: 720, y: 405, r: 28, hitR: 34 };
const TOGGLE = { x: 700, y: 56, w: 90, h: 22 };

const DPAD_BUTTONS = [
    { key: 'up', label: 'W', dx: 0, dy: -1 },
    { key: 'left', label: 'A', dx: -1, dy: 0 },
    { key: 'down', label: 'S', dx: 0, dy: 1 },
    { key: 'right', label: 'D', dx: 1, dy: 0 }
];

// On-screen D-pad (WASD), drag-to-aim FIRE button and weapon swap button.
// Tracks pointers by id so move + shoot + swap work together with multi-touch.
export class TouchControls {
    constructor(scene) {
        this.scene = scene;
        this.enabled = touchControlsEnabled();
        this.onChange = null;

        this.dir = { up: false, down: false, left: false, right: false };
        this.firing = false;
        this.aimAngle = 0;
        this.aimDragging = false;
        this.touchMode = false;
        this.knob = { x: 0, y: 0 };
        this.pointers = new Map();
        this.dirty = true;

        scene.input.addPointer(2);

        this.gfx = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH);

        const labelStyle = (size) => ({
            fontSize: `${size}px`, fontFamily: 'Arial Black, Arial', color: '#ffffff'
        });
        const makeLabel = (x, y, text, size) =>
            scene.add.text(x, y, text, labelStyle(size)).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 1);

        this.padLabels = DPAD_BUTTONS.map(b =>
            makeLabel(DPAD.x + b.dx * DPAD.spacing, DPAD.y + b.dy * DPAD.spacing, b.label, 18));
        this.fireLabel = makeLabel(SHOOT.x, SHOOT.y, 'FIRE', 16);
        this.swapLabel = makeLabel(WEAPON.x, WEAPON.y, 'SWAP', 12);
        this.toggleLabel = makeLabel(TOGGLE.x + TOGGLE.w / 2, TOGGLE.y + TOGGLE.h / 2, '', 11);

        this.onDown = this.onDown.bind(this);
        this.onMove = this.onMove.bind(this);
        this.onUp = this.onUp.bind(this);
        scene.input.on('pointerdown', this.onDown);
        scene.input.on('pointermove', this.onMove);
        scene.input.on('pointerup', this.onUp);
        scene.events.once('shutdown', () => this.destroy());

        this.applyVisibility();
    }

    // Which control (if any) sits under a screen point.
    hitTest(x, y) {
        if (x >= TOGGLE.x && x <= TOGGLE.x + TOGGLE.w && y >= TOGGLE.y && y <= TOGGLE.y + TOGGLE.h) return 'toggle';
        if (!this.enabled) return null;
        if (Math.hypot(x - SHOOT.x, y - SHOOT.y) <= SHOOT.hitR) return 'shoot';
        if (Math.hypot(x - WEAPON.x, y - WEAPON.y) <= WEAPON.hitR) return 'weapon';
        if (Math.hypot(x - DPAD.x, y - DPAD.y) <= DPAD.hitR) return 'dpad';
        return null;
    }

    onDown(pointer) {
        this.touchMode = pointer.wasTouch;
        const role = this.hitTest(pointer.x, pointer.y);
        if (!role) return;

        if (role === 'toggle') {
            this.toggle();
            return;
        }
        this.pointers.set(pointer.id, role);
        if (role === 'weapon') {
            const player = this.scene.player;
            if (player && player.active) player.weaponSystem.switchWeapon(1);
            this.dirty = true;
            return;
        }
        if (role === 'shoot') this.firing = true;
        this.track(role, pointer);
    }

    onMove(pointer) {
        if (!pointer.isDown) {
            this.touchMode = pointer.wasTouch;
            return;
        }
        const role = this.pointers.get(pointer.id);
        if (role) this.track(role, pointer);
    }

    onUp(pointer) {
        const role = this.pointers.get(pointer.id);
        if (!role) return;
        this.pointers.delete(pointer.id);
        if (role === 'dpad') {
            this.dir.up = this.dir.down = this.dir.left = this.dir.right = false;
        } else if (role === 'shoot') {
            this.firing = false;
            this.aimDragging = false;
            this.knob.x = this.knob.y = 0;
        }
        this.dirty = true;
    }

    // Update state from a pointer that is held on a control.
    track(role, pointer) {
        if (role === 'dpad') {
            const dx = pointer.x - DPAD.x;
            const dy = pointer.y - DPAD.y;
            const d = this.dir;
            const next = {
                left: dx < -DPAD.dead, right: dx > DPAD.dead,
                up: dy < -DPAD.dead, down: dy > DPAD.dead
            };
            if (next.left !== d.left || next.right !== d.right || next.up !== d.up || next.down !== d.down) {
                Object.assign(d, next);
                this.dirty = true;
            }
        } else if (role === 'shoot') {
            const dx = pointer.x - SHOOT.x;
            const dy = pointer.y - SHOOT.y;
            const dist = Math.hypot(dx, dy);
            if (dist > SHOOT.drag) {
                this.aimAngle = Math.atan2(dy, dx);
                this.aimDragging = true;
                const k = Math.min(dist, SHOOT.r * 0.6) / dist;
                this.knob.x = dx * k;
                this.knob.y = dy * k;
            } else {
                this.knob.x = this.knob.y = 0;
            }
            this.dirty = true;
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        setTouchControls(this.enabled);
        this.pointers.clear();
        this.dir.up = this.dir.down = this.dir.left = this.dir.right = false;
        this.firing = false;
        this.aimDragging = false;
        this.knob.x = this.knob.y = 0;
        this.applyVisibility();
        if (this.onChange) this.onChange(this.enabled);
    }

    applyVisibility() {
        const on = this.enabled;
        this.padLabels.forEach(l => l.setVisible(on));
        this.fireLabel.setVisible(on);
        this.swapLabel.setVisible(on);
        this.toggleLabel.setText(on ? 'TOUCH: ON' : 'TOUCH: OFF');
        this.dirty = true;
    }

    // Movement vector from the D-pad, values in {-1, 0, 1}.
    getMove() {
        if (!this.enabled) return { x: 0, y: 0 };
        return {
            x: (this.dir.right ? 1 : 0) - (this.dir.left ? 1 : 0),
            y: (this.dir.down ? 1 : 0) - (this.dir.up ? 1 : 0)
        };
    }

    // Aim angle in radians when touch aiming is in use, otherwise null (use the mouse).
    getAimAngle() {
        if (!this.enabled) return null;
        if (this.aimDragging || this.touchMode) return this.aimAngle;
        return null;
    }

    update() {
        // Without a manual aim, face the direction of travel.
        if (this.enabled && !this.aimDragging) {
            const m = this.getMove();
            if (m.x !== 0 || m.y !== 0) this.aimAngle = Math.atan2(m.y, m.x);
        }
        if (this.dirty) this.draw();
    }

    draw() {
        this.dirty = false;
        const g = this.gfx;
        g.clear();

        // Toggle button (always visible)
        g.fillStyle(0x000000, 0.55);
        g.fillRoundedRect(TOGGLE.x, TOGGLE.y, TOGGLE.w, TOGGLE.h, 8);
        g.lineStyle(1, this.enabled ? 0x2ecc71 : 0x777777, 1);
        g.strokeRoundedRect(TOGGLE.x, TOGGLE.y, TOGGLE.w, TOGGLE.h, 8);

        if (!this.enabled) return;

        // D-pad
        DPAD_BUTTONS.forEach(b => {
            const pressed = this.dir[b.key];
            const x = DPAD.x + b.dx * DPAD.spacing - DPAD.btn / 2;
            const y = DPAD.y + b.dy * DPAD.spacing - DPAD.btn / 2;
            g.fillStyle(pressed ? 0x2ecc71 : 0x2c3e50, pressed ? 0.85 : 0.5);
            g.fillRoundedRect(x, y, DPAD.btn, DPAD.btn, 10);
            g.lineStyle(2, 0xffffff, 0.5);
            g.strokeRoundedRect(x, y, DPAD.btn, DPAD.btn, 10);
        });

        // Fire button with drag knob
        g.fillStyle(0xe74c3c, this.firing ? 0.55 : 0.35);
        g.fillCircle(SHOOT.x, SHOOT.y, SHOOT.r);
        g.lineStyle(2, 0xffffff, 0.5);
        g.strokeCircle(SHOOT.x, SHOOT.y, SHOOT.r);
        g.fillStyle(0xe74c3c, this.firing ? 0.95 : 0.7);
        g.fillCircle(SHOOT.x + this.knob.x, SHOOT.y + this.knob.y, 24);
        this.fireLabel.setPosition(SHOOT.x + this.knob.x, SHOOT.y + this.knob.y);

        // Weapon swap button
        g.fillStyle(0xf1c40f, 0.35);
        g.fillCircle(WEAPON.x, WEAPON.y, WEAPON.r);
        g.lineStyle(2, 0xffffff, 0.5);
        g.strokeCircle(WEAPON.x, WEAPON.y, WEAPON.r);
    }

    destroy() {
        const input = this.scene.input;
        input.off('pointerdown', this.onDown);
        input.off('pointermove', this.onMove);
        input.off('pointerup', this.onUp);
        this.gfx.destroy();
        this.padLabels.forEach(l => l.destroy());
        this.fireLabel.destroy();
        this.swapLabel.destroy();
        this.toggleLabel.destroy();
    }
}
