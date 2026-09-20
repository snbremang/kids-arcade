import { PLAYER } from '../constants.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, skinId) {
        super(scene, x, y, `player_${skinId}`);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDepth(5);
        this.setCollideWorldBounds(true);

        // Circular body
        this.body.setCircle(PLAYER.BODY_RADIUS, PLAYER.SIZE / 2 - PLAYER.BODY_RADIUS, PLAYER.SIZE / 2 - PLAYER.BODY_RADIUS);

        this.health = PLAYER.MAX_HEALTH;
        this.maxHealth = PLAYER.MAX_HEALTH;
        this.weaponSystem = new WeaponSystem(this, scene);

        // Input keys
        this.keys = scene.input.keyboard.addKeys({
            w: 'W', a: 'A', s: 'S', d: 'D',
            one: 'ONE', two: 'TWO', three: 'THREE', four: 'FOUR',
            q: 'Q', e: 'E'
        });

        // Mouse input for shooting
        scene.input.on('pointerdown', (pointer) => {
            if (!this.worldPointerAllowed(pointer)) return;
            if (pointer.leftButtonDown() && this.active) {
                const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
                const angle = Phaser.Math.Angle.Between(this.x, this.y, worldPoint.x, worldPoint.y);
                this.weaponSystem.fire(angle, scene.time.now);
            }
        });

        // Hold to fire
        this.isFiring = false;
        scene.input.on('pointerdown', (pointer) => {
            if (this.worldPointerAllowed(pointer)) this.isFiring = true;
        });
        scene.input.on('pointerup', () => { this.isFiring = false; });

        // Scroll to switch weapons
        scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            this.weaponSystem.switchWeapon(deltaY > 0 ? 1 : -1);
        });
    }

    // With touch controls on, touches and taps on the buttons must not aim/shoot at the tap point.
    worldPointerAllowed(pointer) {
        const tc = this.scene.touchControls;
        if (!tc || !tc.enabled) return true;
        return !pointer.wasTouch && !tc.hitTest(pointer.x, pointer.y);
    }

    update(time, delta) {
        if (!this.active) return;
        if (!this.body) return;

        const tc = this.scene.touchControls;

        // Movement
        let vx = 0, vy = 0;
        if (this.keys.a.isDown) vx -= 1;
        if (this.keys.d.isDown) vx += 1;
        if (this.keys.w.isDown) vy -= 1;
        if (this.keys.s.isDown) vy += 1;
        if (tc) {
            const m = tc.getMove();
            vx = Phaser.Math.Clamp(vx + m.x, -1, 1);
            vy = Phaser.Math.Clamp(vy + m.y, -1, 1);
        }

        // Normalize diagonal movement
        if (vx !== 0 && vy !== 0) {
            const norm = 1 / Math.sqrt(2);
            vx *= norm;
            vy *= norm;
        }

        this.body.setVelocity(vx * PLAYER.SPEED, vy * PLAYER.SPEED);

        // Rotation: face touch aim if in use, otherwise the mouse
        const pointer = this.scene.input.activePointer;
        const touchAim = tc ? tc.getAimAngle() : null;
        let angle;
        if (touchAim !== null) {
            angle = touchAim;
        } else {
            const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
            angle = Phaser.Math.Angle.Between(this.x, this.y, worldPoint.x, worldPoint.y);
        }
        this.setRotation(angle);

        // Weapon switching with number keys
        if (Phaser.Input.Keyboard.JustDown(this.keys.one)) this.weaponSystem.switchToWeapon('pistol');
        if (Phaser.Input.Keyboard.JustDown(this.keys.two)) this.weaponSystem.switchToWeapon('shotgun');
        if (Phaser.Input.Keyboard.JustDown(this.keys.three)) this.weaponSystem.switchToWeapon('assault_rifle');
        if (Phaser.Input.Keyboard.JustDown(this.keys.four)) this.weaponSystem.switchToWeapon('sniper');
        if (Phaser.Input.Keyboard.JustDown(this.keys.q)) this.weaponSystem.switchWeapon(-1);
        if (Phaser.Input.Keyboard.JustDown(this.keys.e)) this.weaponSystem.switchWeapon(1);

        // Auto-fire while holding mouse or the touch FIRE button
        if (tc && tc.firing) {
            this.weaponSystem.fire(angle, time);
        } else if (this.isFiring) {
            const wp = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
            const a = touchAim !== null ? angle : Phaser.Math.Angle.Between(this.x, this.y, wp.x, wp.y);
            this.weaponSystem.fire(a, time);
        }
    }

    takeDamage(amount, source) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }
}
