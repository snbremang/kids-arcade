import { BootScene } from './scenes/BootScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { SkinSelectScene } from './scenes/SkinSelectScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

// Global error handler - shows errors on screen
window._gameErrors = [];
window.onerror = function(msg, url, line, col, error) {
    const errorMsg = `ERROR: ${msg} at ${url}:${line}:${col}`;
    console.error(errorMsg, error);
    window._gameErrors.push(errorMsg);
    showErrorOverlay(errorMsg);
    return false;
};
window.addEventListener('unhandledrejection', function(e) {
    const errorMsg = `PROMISE ERROR: ${e.reason}`;
    console.error(errorMsg);
    window._gameErrors.push(errorMsg);
    showErrorOverlay(errorMsg);
});

function showErrorOverlay(msg) {
    let overlay = document.getElementById('error-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'error-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;background:rgba(200,0,0,0.9);color:white;padding:10px;font-family:monospace;font-size:12px;z-index:99999;max-height:200px;overflow:auto;white-space:pre-wrap;';
        document.body.appendChild(overlay);
    }
    overlay.textContent = window._gameErrors.join('\n');
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MainMenuScene, SkinSelectScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);
window.game = game;
