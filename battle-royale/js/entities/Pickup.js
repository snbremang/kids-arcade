export class Pickup extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, pickupType, weaponKey, amount) {
        const texture = pickupType === 'health' ? 'pickup_health' : `pickup_${weaponKey}`;
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // static body

        this.pickupType = pickupType; // 'weapon' or 'health'
        this.weaponKey = weaponKey;   // e.g., 'shotgun', 'assault_rifle'
        this.ammoAmount = amount;
        this.amount = amount;         // for health pickups

        this.setDepth(2);
    }
}
