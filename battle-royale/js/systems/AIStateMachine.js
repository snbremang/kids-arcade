import { BOT, MAP } from '../constants.js';
import { distance, randomInt, randomFloat } from '../utils.js';

const STATES = {
    IDLE: 'IDLE',
    WANDER: 'WANDER',
    LOOT: 'LOOT',
    CHASE: 'CHASE',
    ATTACK: 'ATTACK',
    FLEE: 'FLEE',
    AVOID_STORM: 'AVOID_STORM'
};

export class AIStateMachine {
    constructor(bot, scene, difficulty) {
        this.bot = bot;
        this.scene = scene;
        this.difficulty = difficulty;
        this.currentState = STATES.IDLE;
        this.stateTimer = 0;
        this.target = null;
        this.wanderTarget = null;
        this.lastFSMUpdate = 0;
        this.reactionTimer = 0;
        this.strafeDir = 1;
        this.strafeTimer = 0;
        this.wallRedirectTimer = 0;
        this.idleDuration = randomInt(500, 2000);
    }

    update(time, delta) {
        // Throttle FSM decision-making
        if (time - this.lastFSMUpdate < BOT.FSM_UPDATE_INTERVAL) {
            // Still execute current movement behavior
            this.executeBehavior(time, delta);
            return;
        }
        this.lastFSMUpdate = time;
        this.stateTimer += BOT.FSM_UPDATE_INTERVAL;

        // Priority check: storm avoidance
        if (this.isOutsideSafeZone() && this.currentState !== STATES.AVOID_STORM) {
            this.transition(STATES.AVOID_STORM);
        }

        // State transitions
        switch (this.currentState) {
            case STATES.IDLE:
                this.evaluateIdle();
                break;
            case STATES.WANDER:
                this.evaluateWander();
                break;
            case STATES.LOOT:
                this.evaluateLoot();
                break;
            case STATES.CHASE:
                this.evaluateChase();
                break;
            case STATES.ATTACK:
                this.evaluateAttack(time);
                break;
            case STATES.FLEE:
                this.evaluateFlee();
                break;
            case STATES.AVOID_STORM:
                this.evaluateAvoidStorm();
                break;
        }

        this.executeBehavior(time, delta);
    }

    transition(newState) {
        this.currentState = newState;
        this.stateTimer = 0;
        this.reactionTimer = 0;
        if (newState === STATES.IDLE) {
            this.idleDuration = randomInt(500, 2000);
        }
    }

    executeBehavior(time, delta) {
        switch (this.currentState) {
            case STATES.IDLE:
                this.bot.body.setVelocity(0, 0);
                break;
            case STATES.WANDER:
                this.moveToward(this.wanderTarget, BOT.WANDER_SPEED);
                break;
            case STATES.LOOT:
                if (this.target && this.target.active) {
                    this.moveToward({ x: this.target.x, y: this.target.y }, BOT.CHASE_SPEED);
                }
                break;
            case STATES.CHASE:
                if (this.target && this.target.active) {
                    this.moveToward({ x: this.target.x, y: this.target.y }, BOT.CHASE_SPEED);
                }
                break;
            case STATES.ATTACK:
                this.executeAttack(time, delta);
                break;
            case STATES.FLEE:
                this.executeFlee();
                break;
            case STATES.AVOID_STORM:
                this.moveTowardSafeZone();
                break;
        }
    }

    // State evaluations
    evaluateIdle() {
        if (this.stateTimer > this.idleDuration) {
            this.setRandomWanderTarget();
            this.transition(STATES.WANDER);
        }
    }

    evaluateWander() {
        // Check for nearby enemies
        const enemy = this.findNearestEnemy();
        if (enemy) {
            this.target = enemy;
            this.transition(STATES.CHASE);
            return;
        }

        // Check for nearby pickups
        const pickups = this.scene.getNearbyPickups(this.bot.x, this.bot.y, BOT.PICKUP_RANGE);
        if (pickups.length > 0) {
            this.target = pickups[0].pickup;
            this.transition(STATES.LOOT);
            return;
        }

        // Reached wander target or wandered too long
        if (this.wanderTarget) {
            const d = distance(this.bot.x, this.bot.y, this.wanderTarget.x, this.wanderTarget.y);
            if (d < 30 || this.stateTimer > 5000) {
                this.setRandomWanderTarget();
                this.stateTimer = 0;
            }
        } else {
            this.setRandomWanderTarget();
        }
    }

    evaluateLoot() {
        if (!this.target || !this.target.active) {
            this.transition(STATES.WANDER);
            return;
        }

        // Check for nearby enemies (higher priority)
        const enemy = this.findNearestEnemy();
        if (enemy) {
            const enemyDist = distance(this.bot.x, this.bot.y, enemy.x, enemy.y);
            if (enemyDist < 150) {
                this.target = enemy;
                this.transition(STATES.CHASE);
                return;
            }
        }

        // Close enough to pickup (overlap will handle it)
        const d = distance(this.bot.x, this.bot.y, this.target.x, this.target.y);
        if (d < 20 || this.stateTimer > 4000) {
            this.transition(STATES.WANDER);
        }
    }

    evaluateChase() {
        if (!this.target || !this.target.active) {
            this.transition(STATES.WANDER);
            return;
        }

        const d = distance(this.bot.x, this.bot.y, this.target.x, this.target.y);
        const weaponConfig = this.bot.weaponSystem.getCurrentConfig();

        // In weapon range? Attack
        if (d < weaponConfig.range * 0.8) {
            // Check line of sight
            if (this.scene.hasLineOfSight(this.bot.x, this.bot.y, this.target.x, this.target.y)) {
                this.reactionTimer = this.difficulty.reactionTime;
                this.transition(STATES.ATTACK);
                return;
            }
        }

        // Lost target (too far)
        if (d > BOT.DETECTION_RANGE * 1.5) {
            this.transition(STATES.WANDER);
        }

        // Low health? Flee
        if (this.bot.health < BOT.FLEE_HEALTH_THRESHOLD) {
            this.transition(STATES.FLEE);
        }
    }

    evaluateAttack(time) {
        if (!this.target || !this.target.active) {
            this.transition(STATES.WANDER);
            return;
        }

        const d = distance(this.bot.x, this.bot.y, this.target.x, this.target.y);
        const weaponConfig = this.bot.weaponSystem.getCurrentConfig();

        // Target moved out of range
        if (d > weaponConfig.range * 1.2) {
            this.transition(STATES.CHASE);
            return;
        }

        // Lost line of sight
        if (!this.scene.hasLineOfSight(this.bot.x, this.bot.y, this.target.x, this.target.y)) {
            this.transition(STATES.CHASE);
            return;
        }

        // Low health? Flee
        if (this.bot.health < BOT.FLEE_HEALTH_THRESHOLD) {
            this.transition(STATES.FLEE);
        }
    }

    evaluateFlee() {
        // Recovered health? Back to wandering
        if (this.bot.health > BOT.FLEE_HEALTH_THRESHOLD * 1.5) {
            this.transition(STATES.WANDER);
            return;
        }

        // Look for health pickups
        const pickups = this.scene.getNearbyPickups(this.bot.x, this.bot.y, BOT.PICKUP_RANGE * 2);
        const healthPickup = pickups.find(p => p.pickup.pickupType === 'health');
        if (healthPickup) {
            this.target = healthPickup.pickup;
            this.transition(STATES.LOOT);
            return;
        }

        if (this.stateTimer > 5000) {
            this.transition(STATES.WANDER);
        }
    }

    evaluateAvoidStorm() {
        if (!this.isOutsideSafeZone()) {
            this.transition(STATES.WANDER);
        }
    }

    // Behavior execution
    executeAttack(time, delta) {
        if (!this.target || !this.target.active) return;

        // Face target
        const angle = Phaser.Math.Angle.Between(this.bot.x, this.bot.y, this.target.x, this.target.y);
        this.bot.setRotation(angle);

        // Reaction delay
        if (this.reactionTimer > 0) {
            this.reactionTimer -= delta;
            return;
        }

        // Apply accuracy offset
        const accuracyOffset = (1 - this.difficulty.accuracy) * 0.5;
        const aimAngle = angle + (Math.random() - 0.5) * accuracyOffset;

        // Switch to best weapon
        const bestWeapon = this.bot.weaponSystem.getBestWeapon();
        this.bot.weaponSystem.switchToWeapon(bestWeapon);

        // Fire
        this.bot.weaponSystem.fire(aimAngle, time);

        // Strafe while attacking
        this.strafeTimer += delta;
        if (this.strafeTimer > 1000) {
            this.strafeDir *= -1;
            this.strafeTimer = 0;
        }

        // Dodge (strafe perpendicular)
        if (Math.random() < this.difficulty.dodgeChance) {
            const perpAngle = angle + (Math.PI / 2) * this.strafeDir;
            this.bot.body.setVelocity(
                Math.cos(perpAngle) * BOT.WANDER_SPEED,
                Math.sin(perpAngle) * BOT.WANDER_SPEED
            );
        } else {
            // Slight movement to avoid being a sitting duck
            const perpAngle = angle + (Math.PI / 2) * this.strafeDir;
            this.bot.body.setVelocity(
                Math.cos(perpAngle) * BOT.WANDER_SPEED * 0.5,
                Math.sin(perpAngle) * BOT.WANDER_SPEED * 0.5
            );
        }
    }

    executeFlee() {
        // Find nearest threat and move away
        const enemy = this.findNearestEnemy();
        if (enemy) {
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.bot.x, this.bot.y);
            this.bot.body.setVelocity(
                Math.cos(angle) * BOT.FLEE_SPEED,
                Math.sin(angle) * BOT.FLEE_SPEED
            );
            this.bot.setRotation(angle);
        } else {
            this.setRandomWanderTarget();
            this.transition(STATES.WANDER);
        }
    }

    moveTowardSafeZone() {
        const storm = this.scene.stormSystem;
        const angle = Phaser.Math.Angle.Between(
            this.bot.x, this.bot.y,
            storm.zone.centerX, storm.zone.centerY
        );
        this.bot.body.setVelocity(
            Math.cos(angle) * BOT.CHASE_SPEED,
            Math.sin(angle) * BOT.CHASE_SPEED
        );
        this.bot.setRotation(angle);
    }

    // Helpers
    moveToward(target, speed) {
        if (!target) return;
        const angle = Phaser.Math.Angle.Between(this.bot.x, this.bot.y, target.x, target.y);
        this.bot.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        this.bot.setRotation(angle);
    }

    setRandomWanderTarget() {
        // Pick a random point within the safe zone (or map if no storm yet)
        const storm = this.scene.stormSystem;
        if (storm && storm.zone.radius > 0) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * storm.zone.radius * 0.8;
            this.wanderTarget = {
                x: storm.zone.centerX + Math.cos(angle) * r,
                y: storm.zone.centerY + Math.sin(angle) * r
            };
        } else {
            this.wanderTarget = {
                x: randomFloat(100, MAP.WIDTH_PX - 100),
                y: randomFloat(100, MAP.HEIGHT_PX - 100)
            };
        }
    }

    findNearestEnemy() {
        const entities = this.scene.getAliveEntities();
        let nearest = null;
        let nearestDist = BOT.DETECTION_RANGE;

        for (const entity of entities) {
            if (entity === this.bot || !entity.active) continue;
            const d = distance(this.bot.x, this.bot.y, entity.x, entity.y);
            if (d < nearestDist) {
                // Check line of sight
                if (this.scene.hasLineOfSight(this.bot.x, this.bot.y, entity.x, entity.y)) {
                    nearest = entity;
                    nearestDist = d;
                }
            }
        }
        return nearest;
    }

    isOutsideSafeZone() {
        const storm = this.scene.stormSystem;
        if (!storm || storm.currentDamage === 0) return false;
        const d = distance(this.bot.x, this.bot.y, storm.zone.centerX, storm.zone.centerY);
        return d > storm.zone.radius;
    }
}
