export const MAP = {
    TILE_SIZE: 32,
    WIDTH_TILES: 64,
    HEIGHT_TILES: 64,
    get WIDTH_PX() { return this.TILE_SIZE * this.WIDTH_TILES; },
    get HEIGHT_PX() { return this.TILE_SIZE * this.HEIGHT_TILES; },
    NUM_BUILDINGS: 8,
    NUM_TREES: 50,
    NUM_ROCKS: 25,
    BUILDING_MIN: 4,
    BUILDING_MAX: 7
};

export const PLAYER = {
    SPEED: 200,
    MAX_HEALTH: 100,
    SIZE: 32,
    BODY_RADIUS: 12
};

export const BOT = {
    COUNT: 15,
    MIN_SPAWN_DIST: 200,
    DETECTION_RANGE: 300,
    WANDER_SPEED: 120,
    CHASE_SPEED: 180,
    FLEE_SPEED: 200,
    FLEE_HEALTH_THRESHOLD: 30,
    PICKUP_RANGE: 150,
    FSM_UPDATE_INTERVAL: 200,
    DIFFICULTIES: {
        EASY:   { accuracy: 0.4, reactionTime: 800, dodgeChance: 0,    weight: 0.4 },
        MEDIUM: { accuracy: 0.65, reactionTime: 500, dodgeChance: 0.15, weight: 0.4 },
        HARD:   { accuracy: 0.85, reactionTime: 250, dodgeChance: 0.3,  weight: 0.2 }
    }
};

export const WEAPONS = {
    pistol: {
        name: 'Pistol',
        fireRate: 400,
        damage: 15,
        bulletSpeed: 600,
        bulletLifespan: 800,
        spread: 0.05,
        bulletsPerShot: 1,
        ammo: Infinity,
        range: 480,
        color: 0xf1c40f,
        bulletSize: 4
    },
    shotgun: {
        name: 'Shotgun',
        fireRate: 900,
        damage: 12,
        bulletSpeed: 500,
        bulletLifespan: 400,
        spread: 0.35,
        bulletsPerShot: 6,
        ammo: 30,
        range: 200,
        color: 0xe74c3c,
        bulletSize: 3
    },
    assault_rifle: {
        name: 'Assault Rifle',
        fireRate: 150,
        damage: 10,
        bulletSpeed: 700,
        bulletLifespan: 600,
        spread: 0.08,
        bulletsPerShot: 1,
        ammo: 120,
        range: 420,
        color: 0x3498db,
        bulletSize: 4
    },
    sniper: {
        name: 'Sniper Rifle',
        fireRate: 1500,
        damage: 70,
        bulletSpeed: 1200,
        bulletLifespan: 1000,
        spread: 0.01,
        bulletsPerShot: 1,
        ammo: 20,
        range: 1200,
        color: 0x9b59b6,
        bulletSize: 5
    }
};

export const STORM = {
    PHASES: [
        { waitTime: 30000,  shrinkDuration: 0,     radius: 1024, damage: 0  },
        { waitTime: 0,      shrinkDuration: 45000,  radius: 700,  damage: 2  },
        { waitTime: 0,      shrinkDuration: 40000,  radius: 450,  damage: 5  },
        { waitTime: 0,      shrinkDuration: 35000,  radius: 220,  damage: 10 },
        { waitTime: 0,      shrinkDuration: 30000,  radius: 80,   damage: 20 },
        { waitTime: 0,      shrinkDuration: 20000,  radius: 0,    damage: 50 }
    ]
};

export const PICKUPS = {
    WEAPON_COUNT: 30,
    HEALTH_COUNT: 20,
    HEALTH_AMOUNT: 25,
    AMMO_AMOUNTS: {
        shotgun: 15,
        assault_rifle: 60,
        sniper: 10
    }
};

export const SKINS = [
    { id: 'default_blue',  name: 'Rookie Blue',  color: 0x3498db, unlocked: true,  condition: null },
    { id: 'green',         name: 'Forest',        color: 0x2ecc71, unlocked: false, condition: { type: 'games_played', value: 3, label: 'Play 3 matches' } },
    { id: 'red',           name: 'Crimson',        color: 0xe74c3c, unlocked: false, condition: { type: 'kills_total', value: 10, label: 'Get 10 total kills' } },
    { id: 'gold',          name: 'Champion Gold',  color: 0xf1c40f, unlocked: false, condition: { type: 'wins', value: 1, label: 'Win a match' } },
    { id: 'purple',        name: 'Royal',          color: 0x9b59b6, unlocked: false, condition: { type: 'kills_total', value: 30, label: 'Get 30 total kills' } },
    { id: 'white',         name: 'Ghost',          color: 0xecf0f1, unlocked: false, condition: { type: 'games_played', value: 10, label: 'Play 10 matches' } },
    { id: 'orange',        name: 'Blaze',          color: 0xe67e22, unlocked: false, condition: { type: 'kills_single', value: 8, label: 'Get 8 kills in one match' } },
    { id: 'cyan',          name: 'Neon',           color: 0x00bcd4, unlocked: false, condition: { type: 'wins', value: 5, label: 'Win 5 matches' } },
    { id: 'pink',          name: 'Bubblegum',      color: 0xff69b4, unlocked: false, condition: { type: 'games_played', value: 20, label: 'Play 20 matches' } },
    { id: 'black',         name: 'Shadow',         color: 0x2c3e50, unlocked: false, condition: { type: 'wins', value: 10, label: 'Win 10 matches' } },
    { id: 'rainbow',       name: 'Prismatic',      color: 0xff0000, unlocked: false, condition: { type: 'kills_total', value: 100, label: 'Get 100 total kills' } }
];

export const COLORS = {
    GROUND: 0x2d5a27,
    GROUND_ALT: 0x3a6b34,
    TREE: 0x1a8a1a,
    ROCK: 0x808080,
    WALL: 0x8b7355,
    STORM: 0x8b0000,
    HEALTH_PICKUP: 0x2ecc71,
    BOT_COLORS: [0xff6b6b, 0xffa07a, 0xff69b4, 0xdda0dd, 0xb0c4de, 0x87ceeb, 0x98fb98, 0xf0e68c, 0xd2691e, 0xcd853f, 0xbc8f8f, 0x708090, 0x6495ed, 0x66cdaa, 0xf4a460]
};
