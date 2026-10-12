// Auto-generated from assets/battle_royale_game_sprites.PNG by a one-off analysis script.
// Each entry is a pixel rect {x,y,w,h} into that image for a skin + weapon combo.
// Row order in the sheet (top -> bottom): Rookie Blue, Royal, Ghost, Shadow, Bubblegum,
// Champion Gold, Forest, Crimson, Neon, Rainbow, Blaze. Columns: Assault Rifle, Sniper, Shotgun, Pistol.
import { PLAYER, SPRITE_DISPLAY_HEIGHT } from '../constants.js';

export const SPRITE_SHEET_KEY = 'battle_sprites';

export const SPRITE_FRAMES = {
    default_blue: {
        pistol: { x: 1200, y: 31, w: 147, h: 96 },
        shotgun: { x: 896, y: 31, w: 180, h: 97 },
        assault_rifle: { x: 277, y: 31, w: 190, h: 97 },
        sniper: { x: 565, y: 31, w: 253, h: 98 },
    },
    purple: {
        pistol: { x: 1200, y: 124, w: 148, h: 96 },
        shotgun: { x: 896, y: 124, w: 180, h: 97 },
        assault_rifle: { x: 277, y: 125, w: 191, h: 97 },
        sniper: { x: 565, y: 124, w: 257, h: 98 },
    },
    white: {
        pistol: { x: 1200, y: 219, w: 147, h: 95 },
        shotgun: { x: 896, y: 219, w: 180, h: 98 },
        assault_rifle: { x: 277, y: 219, w: 191, h: 97 },
        sniper: { x: 565, y: 220, w: 257, h: 96 },
    },
    black: {
        pistol: { x: 1200, y: 313, w: 147, h: 97 },
        shotgun: { x: 896, y: 312, w: 180, h: 99 },
        assault_rifle: { x: 277, y: 313, w: 190, h: 98 },
        sniper: { x: 565, y: 313, w: 255, h: 98 },
    },
    pink: {
        pistol: { x: 1200, y: 408, w: 147, h: 97 },
        shotgun: { x: 896, y: 409, w: 180, h: 99 },
        assault_rifle: { x: 277, y: 410, w: 191, h: 98 },
        sniper: { x: 565, y: 409, w: 254, h: 99 },
    },
    gold: {
        pistol: { x: 1200, y: 503, w: 147, h: 98 },
        shotgun: { x: 896, y: 505, w: 180, h: 98 },
        assault_rifle: { x: 277, y: 505, w: 190, h: 97 },
        sniper: { x: 565, y: 505, w: 257, h: 98 },
    },
    green: {
        pistol: { x: 1200, y: 600, w: 148, h: 97 },
        shotgun: { x: 896, y: 600, w: 180, h: 97 },
        assault_rifle: { x: 277, y: 600, w: 190, h: 95 },
        sniper: { x: 565, y: 600, w: 255, h: 98 },
    },
    red: {
        pistol: { x: 1200, y: 693, w: 147, h: 96 },
        shotgun: { x: 896, y: 694, w: 181, h: 96 },
        assault_rifle: { x: 277, y: 693, w: 190, h: 95 },
        sniper: { x: 565, y: 693, w: 256, h: 96 },
    },
    cyan: {
        pistol: { x: 1200, y: 787, w: 148, h: 91 },
        shotgun: { x: 896, y: 787, w: 180, h: 91 },
        assault_rifle: { x: 277, y: 786, w: 191, h: 92 },
        sniper: { x: 565, y: 787, w: 254, h: 91 },
    },
    rainbow: {
        pistol: { x: 1200, y: 872, w: 147, h: 80 },
        shotgun: { x: 896, y: 872, w: 180, h: 80 },
        assault_rifle: { x: 277, y: 872, w: 190, h: 80 },
        sniper: { x: 565, y: 872, w: 256, h: 80 },
    },
    orange: {
        pistol: { x: 1200, y: 946, w: 147, h: 78 },
        shotgun: { x: 896, y: 946, w: 180, h: 78 },
        assault_rifle: { x: 277, y: 946, w: 190, h: 78 },
        sniper: { x: 565, y: 946, w: 256, h: 78 },
    },
};

export function frameKey(skinId, weaponKey) {
    return `${skinId}_${weaponKey}`;
}

// Point a sprite (player or bot) at a skin+weapon frame: scales it to the shared
// display height and re-centers the physics circle on the character's torso
// (near the frame's left edge - the gun is what extends right and varies in length),
// keeping the circle's WORLD size constant at PLAYER.BODY_RADIUS across every frame.
export function applySkinFrame(sprite, skinId, weaponKey) {
    sprite.skinId = skinId;
    sprite.weaponFrame = weaponKey;
    sprite.setFrame(frameKey(skinId, weaponKey));

    const frame = sprite.frame;
    const scale = SPRITE_DISPLAY_HEIGHT / frame.height;
    sprite.setScale(scale);

    if (sprite.body) {
        const srcRadius = PLAYER.BODY_RADIUS / scale;
        const anchorX = Math.min(46, frame.width * 0.35);
        sprite.body.setCircle(srcRadius, anchorX - srcRadius, frame.height / 2 - srcRadius);
    }
}
