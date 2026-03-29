import { MAP, PLAYER, BOT, WEAPONS, PICKUPS } from '../constants.js';
import { Player } from '../entities/Player.js';
import { Bot } from '../entities/Bot.js';
import { Bullet } from '../entities/Bullet.js';
import { Pickup } from '../entities/Pickup.js';
import { MapGenerator } from '../systems/MapGenerator.js';
import { LootSpawner } from '../systems/LootSpawner.js';
import { StormSystem } from '../systems/StormSystem.js';
import { HUD } from '../ui/HUD.js';
import { Minimap } from '../ui/Minimap.js';
import { KillFeed } from '../systems/KillFeed.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.gameOver = false;
        this.kills = 0;
        this.damageDealt = 0;
        this.startTime = this.time.now;
        this.aliveEntities = [];

        // Reset references from previous game (scene object is reused by Phaser)
        this._fpsText = null;
        this._errorText = null;
        this._frameCount = 0;
        this._aliveCache = null;
        this._aliveCacheFrame = -1;
        this.playerKilledBy = null;

        // Generate map
        this.mapGen = new MapGenerator(this);
        const { map, obstacleLayer, groundLayer, openTiles, obstacleData } = this.mapGen.generate();
        this.map = map;
        this.obstacleLayer = obstacleLayer;
        this.obstacleData = obstacleData;
        this.openTiles = openTiles;

        // Set world bounds
        this.physics.world.setBounds(0, 0, MAP.WIDTH_PX, MAP.HEIGHT_PX);

        // Bullet group (shared pool)
        this.bulletGroup = this.physics.add.group({
            classType: Bullet,
            maxSize: 100,
            runChildUpdate: true
        });

        // Spawn pickups
        this.lootSpawner = new LootSpawner(this);
        this.pickupGroup = this.lootSpawner.spawnAll(openTiles);

        // Spawn player
        const playerSpawn = this.getSpawnPoint();
        const progression = this.registry.get('progression');
        this.player = new Player(this, playerSpawn.x, playerSpawn.y, progression.data.selectedSkin);
        this.aliveEntities.push(this.player);

        // Bot group for efficient collisions
        this.botGroup = this.physics.add.group();

        // Spawn bots
        this.bots = [];
        for (let i = 0; i < BOT.COUNT; i++) {
            const spawnPt = this.getSpawnPoint();
            const bot = new Bot(this, spawnPt.x, spawnPt.y, i);
            this.bots.push(bot);
            this.aliveEntities.push(bot);
            this.botGroup.add(bot);
        }

        // --- Collisions (use groups, not individual sprites) ---
        // Entities vs obstacles
        this.physics.add.collider(this.player, this.obstacleLayer);
        this.physics.add.collider(this.botGroup, this.obstacleLayer);
        this.physics.add.collider(this.bulletGroup, this.obstacleLayer, (bullet) => {
            bullet.deactivate();
        });

        // Bullets hit entities
        this.physics.add.overlap(this.bulletGroup, this.player, this.onBulletHitEntity, null, this);
        this.physics.add.overlap(this.bulletGroup, this.botGroup, this.onBulletHitEntity, null, this);

        // Pickups
        this.physics.add.overlap(this.player, this.pickupGroup, this.onPickup, null, this);
        this.physics.add.overlap(this.botGroup, this.pickupGroup, this.onPickup, null, this);

        // Storm
        this.stormSystem = new StormSystem(this);

        // Camera
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setBounds(0, 0, MAP.WIDTH_PX, MAP.HEIGHT_PX);

        // HUD
        this.hud = new HUD(this);
        this.minimap = new Minimap(this);
        this.killFeed = new KillFeed(this);

        // Custom crosshair
        this.input.setDefaultCursor('none');
        this.crosshair = this.add.sprite(0, 0, 'crosshair').setDepth(1000);

        // Shared health bar graphics for all bots (1 object instead of 15)
        this.botHealthGfx = this.add.graphics();
        this.botHealthGfx.setDepth(6);

        // Prevent context menu
        this.input.mouse.disableContextMenu();
    }

    update(time, delta) {
        if (this.gameOver) return;

        try {
            // FPS counter
            this._frameCount = (this._frameCount || 0) + 1;
            if (!this._fpsText) {
                this._fpsText = this.add.text(10, 580, '', {
                    fontSize: '11px', fontFamily: 'monospace', color: '#00ff00',
                    backgroundColor: '#00000088', padding: { x: 4, y: 2 }
                }).setDepth(200).setScrollFactor(0);
            }
            if (this._frameCount % 30 === 0) {
                this._fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)} | Bots: ${this.bots.filter(b => b.active).length} | Phase: ${this.stormSystem.currentPhase}`);
            }

            // Update crosshair position
            const pointer = this.input.activePointer;
            this.crosshair.setPosition(
                pointer.x + this.cameras.main.scrollX,
                pointer.y + this.cameras.main.scrollY
            );

            // Update player
            this.player.update(time, delta);

            // Update bots
            for (const bot of this.bots) {
                if (bot.active) {
                    bot.update(time, delta);
                }
            }

            // Draw bot health bars (single shared graphics object)
            this.botHealthGfx.clear();
            for (const bot of this.bots) {
                if (!bot.active || bot.health >= bot.maxHealth) continue;
                const barW = 28, barH = 4;
                const bx = bot.x - barW / 2;
                const by = bot.y - 22;
                const pct = bot.health / bot.maxHealth;
                this.botHealthGfx.fillStyle(0x000000, 0.6);
                this.botHealthGfx.fillRect(bx, by, barW, barH);
                const color = pct > 0.5 ? 0x2ecc71 : (pct > 0.25 ? 0xf1c40f : 0xe74c3c);
                this.botHealthGfx.fillStyle(color, 1);
                this.botHealthGfx.fillRect(bx, by, barW * pct, barH);
            }

            // Update storm
            this.stormSystem.update(time, delta);

            // Apply storm damage
            this.applyStormDamage(delta);

            // Check win/loss
            this.checkGameEnd();

            // Update HUD
            this.hud.update();
            this.minimap.update();
        } catch (err) {
            console.error('GameScene.update error:', err);
            // Display error on screen
            if (!this._errorText) {
                this._errorText = this.add.text(10, 100, '', {
                    fontSize: '12px', fontFamily: 'monospace', color: '#ff0000',
                    backgroundColor: '#000000cc', padding: { x: 8, y: 8 },
                    wordWrap: { width: 780 }
                }).setDepth(999).setScrollFactor(0);
            }
            this._errorText.setText(`CRASH: ${err.message}\n${err.stack}`);
            // Stop updating to prevent error spam
            this.gameOver = true;
        }
    }

    getSpawnPoint() {
        const idx = Phaser.Math.Between(0, this.openTiles.length - 1);
        const tile = this.openTiles[idx];
        this.openTiles.splice(idx, 1);
        return {
            x: tile.x * MAP.TILE_SIZE + MAP.TILE_SIZE / 2,
            y: tile.y * MAP.TILE_SIZE + MAP.TILE_SIZE / 2
        };
    }

    onBulletHitEntity(obj1, obj2) {
        // Phaser can swap argument order — identify bullet vs entity by type
        let bullet, entity;
        if (obj1 instanceof Bullet) {
            bullet = obj1;
            entity = obj2;
        } else if (obj2 instanceof Bullet) {
            bullet = obj2;
            entity = obj1;
        } else {
            return; // Neither is a bullet, skip
        }

        if (!bullet.active || !entity.active) return;
        if (!entity.takeDamage) return; // Safety: not a damageable entity
        if (bullet.owner === entity) return;

        entity.takeDamage(bullet.damage, bullet.owner);
        bullet.deactivate();

        if (bullet.owner === this.player) {
            this.damageDealt += bullet.damage;
        }

        // Flash effect
        entity.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (entity.active) entity.clearTint();
        });

        if (entity.health <= 0) {
            this.onEntityDeath(entity, bullet.owner, bullet.weaponKey);
        }
    }

    onEntityDeath(entity, killer, weaponKey) {
        const killerName = killer === this.player ? 'You' : (killer ? killer.botName || 'Storm' : 'Storm');
        const victimName = entity === this.player ? 'You' : entity.botName || 'Unknown';

        // Track what killed the player for the game over screen
        if (entity === this.player && killer) {
            this.playerKilledBy = {
                killerName: killer.botName || 'Unknown',
                killerColorIndex: killer.botIndex !== undefined ? killer.botIndex : -1,
                weaponKey: weaponKey || 'pistol',
                cause: 'bullet'
            };
        }

        this.killFeed.addKill(killerName, victimName);

        const idx = this.aliveEntities.indexOf(entity);
        if (idx !== -1) this.aliveEntities.splice(idx, 1);

        if (killer === this.player) {
            this.kills++;
        }

        // Death animation
        this.tweens.add({
            targets: entity,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                entity.setActive(false).setVisible(false);
                if (entity.body) entity.body.enable = false;
            }
        });
    }

    onPickup(obj1, obj2) {
        // Phaser can swap argument order — identify pickup vs entity by type
        let entity, pickup;
        if (obj1 instanceof Pickup) {
            pickup = obj1;
            entity = obj2;
        } else if (obj2 instanceof Pickup) {
            pickup = obj2;
            entity = obj1;
        } else {
            return;
        }

        if (!pickup.active || !entity.active) return;
        if (!entity.weaponSystem) return; // Safety: not a real entity

        if (pickup.pickupType === 'health') {
            if (entity.health >= PLAYER.MAX_HEALTH) return;
            entity.heal(pickup.amount);
        } else {
            entity.weaponSystem.pickupWeapon(pickup.weaponKey, pickup.ammoAmount);
        }

        pickup.setActive(false).setVisible(false);
        if (pickup.body) pickup.body.enable = false;
    }

    applyStormDamage(delta) {
        const storm = this.stormSystem;
        if (storm.currentDamage <= 0) return;

        for (let i = this.aliveEntities.length - 1; i >= 0; i--) {
            const entity = this.aliveEntities[i];
            if (!entity.active) continue;
            const dist = Phaser.Math.Distance.Between(
                entity.x, entity.y,
                storm.zone.centerX, storm.zone.centerY
            );
            if (dist > storm.zone.radius) {
                const dmg = storm.currentDamage * (delta / 1000);
                entity.takeDamage(dmg, null);
                if (entity.health <= 0) {
                    this.onStormKill(entity);
                }
            }
        }
    }

    onStormKill(entity) {
        if (entity === this.player) {
            this.playerKilledBy = { killerName: 'The Storm', killerColorIndex: -1, weaponKey: null, cause: 'storm' };
        }
        const victimName = entity === this.player ? 'You' : entity.botName || 'Unknown';
        this.killFeed.addKill('Storm', victimName);

        const idx = this.aliveEntities.indexOf(entity);
        if (idx !== -1) this.aliveEntities.splice(idx, 1);

        this.tweens.add({
            targets: entity,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                entity.setActive(false).setVisible(false);
                if (entity.body) entity.body.enable = false;
            }
        });
    }

    checkGameEnd() {
        const alivePlayers = this.aliveEntities.filter(e => e.active);
        if (alivePlayers.length <= 1 || !this.player.active) {
            this.gameOver = true;
            this.input.setDefaultCursor('default');
            const won = this.player.active && alivePlayers.length === 1;
            const survivalTime = Math.floor((this.time.now - this.startTime) / 1000);

            this.time.delayedCall(1000, () => {
                this.scene.start('GameOverScene', {
                    won,
                    kills: this.kills,
                    damageDealt: Math.floor(this.damageDealt),
                    survivalTime,
                    playersDefeated: BOT.COUNT + 1 - this.aliveEntities.filter(e => e.active).length,
                    killedBy: this.playerKilledBy || null
                });
            });
        }
    }

    fireBullet(x, y, angle, weaponKey, owner) {
        const config = WEAPONS[weaponKey];
        const spread = config.spread;
        for (let i = 0; i < config.bulletsPerShot; i++) {
            const bullet = this.bulletGroup.get();
            if (bullet) {
                const shotAngle = angle + (Math.random() - 0.5) * spread * 2;
                bullet.fire(x, y, shotAngle, config, owner, weaponKey);
            }
        }
    }

    getAliveEntities() {
        // Cache the filtered array per frame to avoid creating garbage
        if (this._aliveCache && this._aliveCacheFrame === this._frameCount) {
            return this._aliveCache;
        }
        this._aliveCache = this.aliveEntities.filter(e => e.active);
        this._aliveCacheFrame = this._frameCount || 0;
        return this._aliveCache;
    }

    getNearbyPickups(x, y, range) {
        const pickups = [];
        this.pickupGroup.getChildren().forEach(p => {
            if (!p.active) return;
            const d = Phaser.Math.Distance.Between(x, y, p.x, p.y);
            if (d < range) pickups.push({ pickup: p, distance: d });
        });
        return pickups.sort((a, b) => a.distance - b.distance);
    }

    hasLineOfSight(x1, y1, x2, y2) {
        const steps = 10;
        const dx = (x2 - x1) / steps;
        const dy = (y2 - y1) / steps;
        for (let i = 1; i < steps; i++) {
            const tx = x1 + dx * i;
            const ty = y1 + dy * i;
            const tileX = Math.floor(tx / MAP.TILE_SIZE);
            const tileY = Math.floor(ty / MAP.TILE_SIZE);
            if (tileX >= 0 && tileX < MAP.WIDTH_TILES && tileY >= 0 && tileY < MAP.HEIGHT_TILES) {
                if (this.obstacleData[tileY][tileX] !== 0) return false;
            }
        }
        return true;
    }
}

