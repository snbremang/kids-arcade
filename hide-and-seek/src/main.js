import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { EndScene } from './scenes/EndScene.js';

const config = {
  type: Phaser.AUTO,
  width: 900,
  height: 650,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    }
  },
  scene: [MenuScene, GameScene, UIScene, EndScene],
};

window._game = new Phaser.Game(config);
