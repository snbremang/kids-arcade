// Map layout: structures and circle definition
// All coordinates for an 900x650 canvas

export const CANVAS_W = 900;
export const CANVAS_H = 650;
export const CIRCLE_X = CANVAS_W / 2;
export const CIRCLE_Y = CANVAS_H / 2;
export const CIRCLE_R = 80;

// Structures: { type: 'rect'|'circle', ...dims, color }
export const STRUCTURES = [
  // Top-left house
  { type: 'rect', x: 80,  y: 80,  w: 100, h: 80,  color: 0x8B4513, label: 'house' },
  // Top-right warehouse
  { type: 'rect', x: 700, y: 60,  w: 130, h: 90,  color: 0x556B2F, label: 'warehouse' },
  // Bottom-left shed
  { type: 'rect', x: 60,  y: 500, w: 80,  h: 80,  color: 0x8B6914, label: 'shed' },
  // Bottom-right barn
  { type: 'rect', x: 730, y: 510, w: 110, h: 80,  color: 0xA0522D, label: 'barn' },
  // Mid-left bush cluster (circle)
  { type: 'circle', x: 150, y: 320, r: 40, color: 0x228B22, label: 'bush' },
  // Mid-right bush cluster (circle)
  { type: 'circle', x: 750, y: 310, r: 45, color: 0x2E8B57, label: 'bush2' },
  // Top-center crates
  { type: 'rect', x: 390, y: 70,  w: 70,  h: 50,  color: 0xCD853F, label: 'crates' },
  // Bottom-center fence
  { type: 'rect', x: 370, y: 550, w: 120, h: 30,  color: 0xD2B48C, label: 'fence' },
];

// Hider spawn zones (away from center circle)
export const HIDER_SPAWNS = [
  { x: 100, y: 100 },
  { x: 750, y: 90  },
  { x: 90,  y: 540 },
  { x: 770, y: 550 },
  { x: 180, y: 320 },
  { x: 720, y: 310 },
  { x: 420, y: 90  },
  { x: 420, y: 570 },
];
