import { MAP, COLORS } from '../constants.js';
import { randomInt } from '../utils.js';

export class MapGenerator {
    constructor(scene) {
        this.scene = scene;
    }

    ensureTilesetTexture() {
        // Reuse if it already exists — the tileset never changes, and calling
        // textures.remove() corrupts Phaser's WebGL pipeline state
        if (this.scene.textures.exists('tileset_combined')) {
            return;
        }

        const ts = MAP.TILE_SIZE;
        const g = this.scene.add.graphics();

        // Tile 0: Ground
        g.fillStyle(COLORS.GROUND, 1);
        g.fillRect(0, 0, ts, ts);
        g.lineStyle(1, COLORS.GROUND_ALT, 0.3);
        g.strokeRect(0, 0, ts, ts);

        // Tile 1: Tree
        g.fillStyle(COLORS.TREE, 1);
        g.fillCircle(ts + ts / 2, ts / 2, ts / 2 - 2);
        g.fillStyle(0x0d6b0d, 1);
        g.fillCircle(ts + ts / 2 - 3, ts / 2 - 3, 5);

        // Tile 2: Rock
        g.fillStyle(COLORS.ROCK, 1);
        g.fillRect(ts * 2 + 2, 4, ts - 4, ts - 6);
        g.fillStyle(0x999999, 1);
        g.fillRect(ts * 2 + 4, 6, ts - 10, ts - 14);

        // Tile 3: Wall
        g.fillStyle(COLORS.WALL, 1);
        g.fillRect(ts * 3, 0, ts, ts);
        g.lineStyle(1, 0x6b5b3a, 1);
        g.strokeRect(ts * 3 + 1, 1, ts - 2, ts - 2);

        g.generateTexture('tileset_combined', ts * 4, ts);
        g.destroy();
    }

    generate() {
        const w = MAP.WIDTH_TILES;
        const h = MAP.HEIGHT_TILES;

        // 0 = ground, 1 = tree, 2 = rock, 3 = wall
        const data = [];
        for (let y = 0; y < h; y++) {
            data[y] = [];
            for (let x = 0; x < w; x++) {
                data[y][x] = 0;
            }
        }

        // Track occupied tiles
        const occupied = new Set();
        const setTile = (x, y, val) => {
            if (x >= 0 && x < w && y >= 0 && y < h) {
                data[y][x] = val;
                occupied.add(`${x},${y}`);
            }
        };

        // Place buildings (rectangular outlines with doorways)
        const buildings = [];
        for (let i = 0; i < MAP.NUM_BUILDINGS; i++) {
            const bw = randomInt(MAP.BUILDING_MIN, MAP.BUILDING_MAX);
            const bh = randomInt(MAP.BUILDING_MIN, MAP.BUILDING_MAX);
            const bx = randomInt(5, w - bw - 5);
            const by = randomInt(5, h - bh - 5);

            // Check overlap with existing buildings (with padding)
            let overlaps = false;
            for (const b of buildings) {
                if (bx - 3 < b.x + b.w && bx + bw + 3 > b.x &&
                    by - 3 < b.y + b.h && by + bh + 3 > b.y) {
                    overlaps = true;
                    break;
                }
            }
            if (overlaps) continue;

            buildings.push({ x: bx, y: by, w: bw, h: bh });

            // Draw walls
            for (let x = bx; x < bx + bw; x++) {
                setTile(x, by, 3);      // top wall
                setTile(x, by + bh - 1, 3); // bottom wall
            }
            for (let y = by; y < by + bh; y++) {
                setTile(bx, y, 3);      // left wall
                setTile(bx + bw - 1, y, 3); // right wall
            }

            // Add doorways (clear 1-2 tiles on random walls)
            const doorSide = randomInt(0, 3);
            if (doorSide === 0) { // top
                const dx = randomInt(bx + 1, bx + bw - 2);
                data[by][dx] = 0; occupied.delete(`${dx},${by}`);
            } else if (doorSide === 1) { // bottom
                const dx = randomInt(bx + 1, bx + bw - 2);
                data[by + bh - 1][dx] = 0; occupied.delete(`${dx},${by + bh - 1}`);
            } else if (doorSide === 2) { // left
                const dy = randomInt(by + 1, by + bh - 2);
                data[dy][bx] = 0; occupied.delete(`${bx},${dy}`);
            } else { // right
                const dy = randomInt(by + 1, by + bh - 2);
                data[dy][bx + bw - 1] = 0; occupied.delete(`${bx + bw - 1},${dy}`);
            }

            // Second doorway on opposite side
            const doorSide2 = (doorSide + 2) % 4;
            if (doorSide2 === 0) {
                const dx = randomInt(bx + 1, bx + bw - 2);
                data[by][dx] = 0; occupied.delete(`${dx},${by}`);
            } else if (doorSide2 === 1) {
                const dx = randomInt(bx + 1, bx + bw - 2);
                data[by + bh - 1][dx] = 0; occupied.delete(`${dx},${by + bh - 1}`);
            } else if (doorSide2 === 2) {
                const dy = randomInt(by + 1, by + bh - 2);
                data[dy][bx] = 0; occupied.delete(`${bx},${dy}`);
            } else {
                const dy = randomInt(by + 1, by + bh - 2);
                data[dy][bx + bw - 1] = 0; occupied.delete(`${bx + bw - 1},${dy}`);
            }
        }

        // Scatter trees
        let treesPlaced = 0;
        while (treesPlaced < MAP.NUM_TREES) {
            const x = randomInt(2, w - 3);
            const y = randomInt(2, h - 3);
            if (!occupied.has(`${x},${y}`)) {
                setTile(x, y, 1);
                treesPlaced++;
            }
        }

        // Scatter rocks
        let rocksPlaced = 0;
        while (rocksPlaced < MAP.NUM_ROCKS) {
            const x = randomInt(2, w - 3);
            const y = randomInt(2, h - 3);
            if (!occupied.has(`${x},${y}`)) {
                setTile(x, y, 2);
                rocksPlaced++;
            }
        }

        // Collect open tiles for spawning
        const openTiles = [];
        for (let y = 3; y < h - 3; y++) {
            for (let x = 3; x < w - 3; x++) {
                if (data[y][x] === 0) {
                    openTiles.push({ x, y });
                }
            }
        }

        // Ensure tileset texture is fresh (avoids stale canvas after scene restarts)
        this.ensureTilesetTexture();

        // Create tilemap from data using the combined tileset
        const map = this.scene.make.tilemap({
            data,
            tileWidth: MAP.TILE_SIZE,
            tileHeight: MAP.TILE_SIZE
        });

        // Add the combined tileset (4 tiles wide, 1 tile tall)
        const combinedTileset = map.addTilesetImage('tileset_combined', 'tileset_combined', MAP.TILE_SIZE, MAP.TILE_SIZE);

        // Create single layer with all tile types
        const layer = map.createLayer(0, combinedTileset, 0, 0);
        layer.setDepth(0);

        // Set collision on obstacle tiles (1=tree, 2=rock, 3=wall)
        layer.setCollision([1, 2, 3]);

        // Store obstacle data for line-of-sight checks
        this.obstacleData = data;

        return {
            map,
            obstacleLayer: layer,    // Now a tilemap layer, not a static group
            openTiles,
            obstacleData: data
        };
    }
}
