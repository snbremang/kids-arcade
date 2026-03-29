export class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet_pistol');
        this.damage = 0;
        this.owner = null;
        this.lifespan = 0;
    }

    fire(x, y, angle, config, owner, weaponKey) {
        this.setTexture(`bullet_${weaponKey}`);
        this.setActive(true);
        this.setVisible(true);
        this.setPosition(x, y);
        this.setRotation(angle);

        if (this.body) {
            this.body.enable = true;
            this.body.reset(x, y);
            this.body.setVelocity(
                Math.cos(angle) * config.bulletSpeed,
                Math.sin(angle) * config.bulletSpeed
            );
            this.body.setCircle(config.bulletSize);
        }

        this.damage = config.damage;
        this.owner = owner;
        this.weaponKey = weaponKey;
        this.lifespan = config.bulletLifespan;
        this.setDepth(3);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.active) return;

        this.lifespan -= delta;
        if (this.lifespan <= 0) {
            this.deactivate();
        }
    }

    deactivate() {
        this.setActive(false);
        this.setVisible(false);
        if (this.body) {
            this.body.stop();
            this.body.enable = false;
        }
    }
}
