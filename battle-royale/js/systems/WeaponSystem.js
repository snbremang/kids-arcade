import { WEAPONS, PICKUPS } from '../constants.js';

export class WeaponSystem {
    constructor(entity, scene) {
        this.entity = entity;
        this.scene = scene;
        this.currentWeapon = 'pistol';
        this.lastFireTime = 0;
        this.inventory = ['pistol'];
        this.ammo = {
            pistol: Infinity,
            shotgun: 0,
            assault_rifle: 0,
            sniper: 0
        };
    }

    canFire(time) {
        const weapon = WEAPONS[this.currentWeapon];
        if (time - this.lastFireTime < weapon.fireRate) return false;
        if (this.ammo[this.currentWeapon] <= 0) return false;
        return true;
    }

    fire(angle, time) {
        if (!this.canFire(time)) return false;

        const weapon = WEAPONS[this.currentWeapon];
        this.lastFireTime = time;

        if (this.ammo[this.currentWeapon] !== Infinity) {
            this.ammo[this.currentWeapon] -= 1;
        }

        // Fire bullets through the scene
        this.scene.fireBullet(
            this.entity.x,
            this.entity.y,
            angle,
            this.currentWeapon,
            this.entity
        );

        return true;
    }

    pickupWeapon(weaponKey, ammoAmount) {
        if (!this.inventory.includes(weaponKey)) {
            this.inventory.push(weaponKey);
            this.ammo[weaponKey] = ammoAmount || PICKUPS.AMMO_AMOUNTS[weaponKey] || 0;
            this.currentWeapon = weaponKey;
        } else {
            // Add ammo
            if (this.ammo[weaponKey] !== Infinity) {
                this.ammo[weaponKey] += ammoAmount || PICKUPS.AMMO_AMOUNTS[weaponKey] || 0;
            }
        }
    }

    switchWeapon(direction) {
        if (this.inventory.length <= 1) return;
        const idx = this.inventory.indexOf(this.currentWeapon);
        const newIdx = (idx + direction + this.inventory.length) % this.inventory.length;
        this.currentWeapon = this.inventory[newIdx];
    }

    switchToWeapon(weaponKey) {
        if (this.inventory.includes(weaponKey)) {
            this.currentWeapon = weaponKey;
        }
    }

    getCurrentConfig() {
        return WEAPONS[this.currentWeapon];
    }

    hasAmmo() {
        return this.ammo[this.currentWeapon] > 0;
    }

    getAmmoDisplay() {
        const ammo = this.ammo[this.currentWeapon];
        return ammo === Infinity ? '∞' : ammo.toString();
    }

    getBestWeapon() {
        // AI helper: pick best weapon with ammo
        const priority = ['sniper', 'assault_rifle', 'shotgun', 'pistol'];
        for (const key of priority) {
            if (this.inventory.includes(key) && this.ammo[key] > 0) {
                return key;
            }
        }
        return 'pistol';
    }
}
