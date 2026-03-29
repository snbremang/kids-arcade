import { MAP, PICKUPS, WEAPONS } from '../constants.js';
import { Pickup } from '../entities/Pickup.js';
import { randomFromArray } from '../utils.js';

export class LootSpawner {
    constructor(scene) {
        this.scene = scene;
    }

    spawnAll(openTiles) {
        const group = this.scene.physics.add.staticGroup();
        const usedIndices = new Set();

        const getRandomTile = () => {
            let idx;
            let attempts = 0;
            do {
                idx = Phaser.Math.Between(0, openTiles.length - 1);
                attempts++;
            } while (usedIndices.has(idx) && attempts < 100);
            usedIndices.add(idx);
            return openTiles[idx];
        };

        // Spawn weapon pickups
        const weaponKeys = ['shotgun', 'assault_rifle', 'sniper'];
        for (let i = 0; i < PICKUPS.WEAPON_COUNT; i++) {
            const tile = getRandomTile();
            if (!tile) continue;
            const x = tile.x * MAP.TILE_SIZE + MAP.TILE_SIZE / 2;
            const y = tile.y * MAP.TILE_SIZE + MAP.TILE_SIZE / 2;
            const weaponKey = randomFromArray(weaponKeys);
            const ammo = PICKUPS.AMMO_AMOUNTS[weaponKey];

            const pickup = new Pickup(this.scene, x, y, 'weapon', weaponKey, ammo);
            group.add(pickup);
        }

        // Spawn health pickups
        for (let i = 0; i < PICKUPS.HEALTH_COUNT; i++) {
            const tile = getRandomTile();
            if (!tile) continue;
            const x = tile.x * MAP.TILE_SIZE + MAP.TILE_SIZE / 2;
            const y = tile.y * MAP.TILE_SIZE + MAP.TILE_SIZE / 2;

            const pickup = new Pickup(this.scene, x, y, 'health', null, PICKUPS.HEALTH_AMOUNT);
            group.add(pickup);
        }

        return group;
    }
}
