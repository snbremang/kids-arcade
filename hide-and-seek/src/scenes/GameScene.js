import { CANVAS_W, CANVAS_H, CIRCLE_X, CIRCLE_Y, CIRCLE_R, STRUCTURES, HIDER_SPAWNS } from '../map/MapLayout.js';
import { HumanPlayer } from '../entities/HumanPlayer.js';
import { BotPlayer } from '../entities/BotPlayer.js';
import { Bullet } from '../entities/Bullet.js';
import { SeekerAI } from '../systems/SeekerAI.js';
import { LifeSystem } from '../systems/LifeSystem.js';
import { FruitSystem } from '../systems/FruitSystem.js';

const GAME_DURATION = 4 * 60; // 4 minutes in seconds
const HIDE_DURATION = 10;     // seconds for hiding phase
const BOT_COUNT = 3;

// Game phases
const PHASE = {
  REVEAL:  'reveal',   // seeker reveal animation
  HIDING:  'hiding',   // hiders scatter
  FRUIT:   'fruit',    // fruit call + countdown
  SEEKING: 'seeking',  // seeker shoots
};

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.scene.launch('UIScene');
    this._phase = PHASE.REVEAL;
    this._gameTime = GAME_DURATION;
    this._scoreTimer = 0;
    this._humanBullets = [];
    this._humanReloadTimer = 0;
    this._fruitCallReady = false; // seeker can call fruit?
    this._seekDuration = 15; // seconds in seek phase before next fruit call
    this._seekerRound = 0;   // increments each time seeking phase starts
    this._compliance = null; // { type:'hurricane'|'wildfire', achieved:bool, startX?, startY? }

    this._buildMap();
    this._spawnPlayers();
    this._setupSystems();
    this._setupHumanShooting();
    this._setupStructureCollisions();
    this._startRevealPhase();
  }

  _buildMap() {
    // Background
    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x2d5a27);

    // Grid lines (subtle)
    const gfx = this.add.graphics();
    gfx.lineStyle(1, 0x3a6b31, 0.3);
    for (let x = 0; x <= CANVAS_W; x += 50) gfx.lineBetween(x, 0, x, CANVAS_H);
    for (let y = 0; y <= CANVAS_H; y += 50) gfx.lineBetween(0, y, CANVAS_W, y);

    // Draw structures — use Zone for invisible physics bodies (no texture needed)
    this._structureBodies = [];
    for (const s of STRUCTURES) {
      const g = this.add.graphics();
      if (s.type === 'rect') {
        g.fillStyle(s.color, 1);
        g.fillRect(s.x, s.y, s.w, s.h);
        g.lineStyle(2, 0x000000, 0.4);
        g.strokeRect(s.x, s.y, s.w, s.h);

        // Zone-based static physics body (no texture required)
        const zone = this.add.zone(s.x + s.w / 2, s.y + s.h / 2, s.w, s.h);
        this.physics.add.existing(zone, true);
        this._structureBodies.push(zone);
      } else {
        g.fillStyle(s.color, 1);
        g.fillCircle(s.x, s.y, s.r);
        g.lineStyle(2, 0x000000, 0.4);
        g.strokeCircle(s.x, s.y, s.r);

        const zone = this.add.zone(s.x, s.y, s.r * 2, s.r * 2);
        this.physics.add.existing(zone, true);
        this._structureBodies.push(zone);
      }
    }

    // Center circle
    const circleGfx = this.add.graphics().setDepth(1);
    circleGfx.lineStyle(3, 0xffd700, 1);
    circleGfx.strokeCircle(CIRCLE_X, CIRCLE_Y, CIRCLE_R);
    circleGfx.fillStyle(0xffd700, 0.08);
    circleGfx.fillCircle(CIRCLE_X, CIRCLE_Y, CIRCLE_R);

    this.add.text(CIRCLE_X, CIRCLE_Y - CIRCLE_R - 12, 'CIRCLE', {
      fontSize: '11px', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2);
  }

  _spawnPlayers() {
    // Shuffle spawn spots
    const spots = Phaser.Utils.Array.Shuffle([...HIDER_SPAWNS]);

    // Human player
    this.human = new HumanPlayer(this, spots[0].x, spots[0].y);

    // Bot players
    this.bots = [];
    for (let i = 0; i < BOT_COUNT; i++) {
      this.bots.push(new BotPlayer(this, spots[i + 1].x, spots[i + 1].y, i));
    }

    this.allPlayers = [this.human, ...this.bots];

    // Randomly pick seeker
    const seekerIdx = Math.floor(Math.random() * this.allPlayers.length);
    this._seeker = this.allPlayers[seekerIdx];
    this._seeker.setSeeker(true);
    // Move seeker to circle center
    this._seeker.setPosition(CIRCLE_X, CIRCLE_Y);
  }

  _setupSystems() {
    this.lifeSystem = new LifeSystem(this.allPlayers);

    this.fruitSystem = new FruitSystem(this);
    this.fruitSystem.onFruit = (choice) => this._handleFruitChoice(choice);
    this.fruitSystem.onComplete = () => this._startSeekingPhase();

    this.seekerAI = new SeekerAI(
      this,
      () => this.allPlayers,
      (hider) => this._handleBulletHit(hider)
    );
    if (this._seeker !== this.human) {
      this.seekerAI.setBot(this._seeker);
    }

    // Score tick
    this._scoreTicker = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this._phase === PHASE.SEEKING || this._phase === PHASE.HIDING) {
          this.lifeSystem.tickScore();
        }
        this._gameTime--;
        if (this._gameTime <= 0) this._endGame();
      }
    });
  }

  _setupHumanShooting() {
    // Human shoots only when they are the seeker
    this.input.on('pointerdown', (pointer) => {
      if (this._phase !== PHASE.SEEKING) return;
      if (this._seeker !== this.human) return;
      if (this._humanReloadTimer > 0) return;

      const angle = Math.atan2(
        pointer.y - this.human.y,
        pointer.x - this.human.x
      );
      const bullet = new Bullet(this, this.human.x, this.human.y, angle);
      this._humanBullets.push(bullet);
      this._humanReloadTimer = 1500;

      // Overlap with hiders
      for (const p of this.allPlayers) {
        if (p === this.human || p.isSeeker || p.isEliminated) continue;
        this.physics.add.overlap(bullet.sprite, p.sprite, () => {
          if (!bullet.active) return;
          bullet.destroy();
          this._handleBulletHit(p);
        });
      }

      // Stop bullet on structure collision
      for (const body of this._structureBodies) {
        this.physics.add.collider(bullet.sprite, body, () => {
          if (!bullet.active) return;
          bullet.destroy();
        });
      }
    });
  }

  _setupStructureCollisions() {
    // Called after players created; add colliders with structure bodies
    this.time.delayedCall(50, () => {
      for (const body of this._structureBodies) {
        for (const p of this.allPlayers) {
          this.physics.add.collider(p.sprite, body);
        }
        // Bullets stop at structures too (overlap to destroy)
      }
    });
  }

  _startRevealPhase() {
    this._phase = PHASE.REVEAL;
    const isHumanSeeker = this._seeker === this.human;

    const msg = isHumanSeeker
      ? '🔴 YOU ARE IT!\nYou must stay in the circle!'
      : `${this._seeker.name} is IT!\n🏃 HIDE NOW!`;

    const overlay = this.add.graphics().setDepth(80);
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const txt = this.add.text(CANVAS_W / 2, CANVAS_H / 2, msg, {
      fontSize: '28px', color: '#ffffff', fontStyle: 'bold', align: 'center',
      stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5).setDepth(81);

    this.time.delayedCall(2500, () => {
      overlay.destroy();
      txt.destroy();
      this._startHidingPhase();
    });
  }

  _startHidingPhase() {
    this._phase = PHASE.HIDING;
    this.lifeSystem.reviveAll();
    this.seekerAI.disable();

    // Seeker closes eyes (overlay on seeker's vision — we dim the whole screen briefly)
    const eyesOverlay = this.add.graphics().setDepth(70);
    eyesOverlay.fillStyle(0x000000, 0.5);
    eyesOverlay.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const eyesTxt = this.add.text(CANVAS_W / 2, CANVAS_H / 2, '👀 Seeker closing eyes...\nHiders, run!', {
      fontSize: '22px', color: '#fff', align: 'center', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(71);

    // Bots go hide
    for (const bot of this.bots) {
      if (!bot.isSeeker) bot.goHide();
    }

    let hideCountdown = HIDE_DURATION;
    const countText = this.add.text(CANVAS_W / 2, CANVAS_H / 2 + 60, `${hideCountdown}`, {
      fontSize: '36px', color: '#ff4444', fontStyle: 'bold', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(72);

    const hideTimer = this.time.addEvent({
      delay: 1000,
      repeat: HIDE_DURATION - 1,
      callback: () => {
        hideCountdown--;
        countText.setText(`${hideCountdown}`);
        if (hideCountdown <= 3) {
          // Lift overlay so seeker can see
          eyesOverlay.setAlpha(Math.max(0, eyesOverlay.alpha - 0.3));
        }
        if (hideCountdown <= 0) {
          eyesOverlay.destroy();
          eyesTxt.destroy();
          countText.destroy();
          this._startFruitCallPhase();
        }
      }
    });
  }

  _startFruitCallPhase() {
    this._phase = PHASE.FRUIT;
    this.seekerAI.disable();

    if (this._seeker === this.human) {
      this.fruitSystem.showPickerForHumanSeeker();
    } else {
      this.fruitSystem.autoPick(2000);
      // Show "seeker is thinking" to human
      const thinkTxt = this.add.text(CANVAS_W / 2, 30, '🤔 Seeker is choosing...', {
        fontSize: '16px', color: '#aaa'
      }).setOrigin(0.5).setDepth(60);
      this.time.delayedCall(2200, () => thinkTxt.destroy());
    }
  }

  _handleFruitChoice(choice) {
    const isWildfire = choice.includes('Wildfire');
    const isHurricane = choice.includes('Hurricane');

    // Notify bots
    for (const bot of this.bots) {
      if (bot.isSeeker) continue;
      if (isWildfire) bot.onWildfire();
      else if (isHurricane) bot.onHurricane();
      else bot.onFruitCall();
    }

    // Track human compliance for wildcards (only when human is a hider)
    if (!this.human.isSeeker) {
      if (isHurricane) {
        this._compliance = { type: 'hurricane', achieved: false };
      } else if (isWildfire) {
        this._compliance = { type: 'wildfire', achieved: false, startX: this.human.x, startY: this.human.y };
      } else {
        this._compliance = null;
      }
    }
  }

  _startSeekingPhase() {
    this._phase = PHASE.SEEKING;
    this._seekerRound++;

    // Penalise human for not complying with hurricane/wildfire
    if (this._compliance && !this._compliance.achieved && !this.human.isSeeker) {
      this.human.score = Math.max(0, this.human.score - 10);
      const verb = this._compliance.type === 'hurricane' ? 'touch the circle!' : 'find a new spot!';
      const pen = this.add.text(CANVAS_W / 2, CANVAS_H / 2 - 40,
        `⚠️ -10 pts! You forgot to ${verb}`, {
          fontSize: '16px', color: '#ff4444', fontStyle: 'bold',
          stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(90);
      this.time.delayedCall(2500, () => pen.destroy());
      this.events.emit('livesChanged');
    }
    this._compliance = null;

    // Reduce hider speed each round — noticeable but not instant (starts round 2)
    const speedPenalty = (this._seekerRound - 1) * 20;
    for (const p of this.allPlayers) {
      if (!p.isSeeker) {
        const base = (p === this.human) ? 180 : 150;
        const newSpeed = Math.max(60, base - speedPenalty);
        const reduction = p.speed - newSpeed;
        p.speed = newSpeed;
        if (reduction > 0) {
          const popX = p === this.human ? p.x : p.sprite.x;
          const popY = p === this.human ? p.y : p.sprite.y;
          const pop = this.add.text(popX, popY - 30, `-${reduction} speed`, {
            fontSize: '13px', color: '#ff9900', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 3
          }).setOrigin(0.5).setDepth(90);
          this.tweens.add({ targets: pop, y: pop.y - 40, alpha: 0, duration: 1200, onComplete: () => pop.destroy() });
        }
      }
    }

    // Tell hider bots to return to hiding spots after fruit phase
    for (const bot of this.bots) {
      if (!bot.isSeeker && !bot.isEliminated) {
        bot.goHide();
      }
    }

    if (this._seeker !== this.human) {
      this.seekerAI.enable();
    }

    // After _seekDuration seconds, trigger fruit call again
    this._seekPhaseTimer = this.time.delayedCall(this._seekDuration * 1000, () => {
      if (this._phase === PHASE.SEEKING) {
        this._startFruitCallPhase();
      }
    });

    // Show seek banner
    const seekBanner = this.add.text(CANVAS_W / 2, 30, '👁 SEEKER IS HUNTING!', {
      fontSize: '16px', color: '#ff4444', fontStyle: 'bold', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(60);
    this.time.delayedCall(3000, () => seekBanner.destroy());
  }

  _handleBulletHit(hider) {
    if (hider.isSeeker || hider.isEliminated) return;

    // Flash red
    this.tweens.add({
      targets: hider.sprite,
      alpha: 0.1,
      duration: 100,
      yoyo: true,
      repeat: 3,
      onComplete: () => hider.sprite.setAlpha(hider.isEliminated ? 0.3 : 1)
    });

    // Seeker earns 5 pts per hit
    this._seeker.score += 5;
    const plusTxt = this.add.text(this._seeker.x, this._seeker.y - 30, '+5', {
      fontSize: '16px', color: '#ffe033', fontStyle: 'bold', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(90);
    this.tweens.add({ targets: plusTxt, y: plusTxt.y - 30, alpha: 0, duration: 900, onComplete: () => plusTxt.destroy() });

    const depleted = this.lifeSystem.hitHider(hider);
    this.events.emit('livesChanged');

    if (depleted) {
      // Role swap!
      this._doRoleSwap(depleted);
    }
  }

  _doRoleSwap(newSeeker) {
    const oldSeeker = this._seeker;
    this.seekerAI.disable();

    this.lifeSystem.swapRoles(newSeeker, oldSeeker);
    this._seeker = newSeeker;

    // Move new seeker to circle
    newSeeker.setPosition(CIRCLE_X, CIRCLE_Y);
    // Move old seeker to a random hider spot
    const spots = Phaser.Utils.Array.Shuffle([...HIDER_SPAWNS]);
    oldSeeker.setPosition(spots[0].x, spots[0].y);

    // Update AI
    if (this._seeker !== this.human) {
      this.seekerAI.setBot(this._seeker);
    } else {
      this.seekerAI.setBot(null);
    }

    // Restart from hiding phase
    const swapTxt = this.add.text(CANVAS_W / 2, CANVAS_H / 2, `🔄 ${newSeeker.name} is now IT!`, {
      fontSize: '26px', color: '#ffe033', fontStyle: 'bold', stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5).setDepth(85);
    this.time.delayedCall(2000, () => {
      swapTxt.destroy();
      this._startHidingPhase();
    });
  }

  _endGame() {
    this._scoreTicker.remove();
    this.seekerAI.disable();
    this.fruitSystem.destroy();
    this._phase = 'over';
    this.scene.start('EndScene', { players: this.allPlayers });
  }

  update(time, delta) {
    // Update players
    this.human.update();
    for (const bot of this.bots) bot.update(delta);

    // Reload timer
    if (this._humanReloadTimer > 0) this._humanReloadTimer -= delta;

    // Bullet updates
    this._humanBullets = this._humanBullets.filter(b => b.active);
    for (const b of this._humanBullets) b.update();

    // SeekerAI
    this.seekerAI.update(delta);

    // Wildcard compliance tracking
    if (this._compliance && !this._compliance.achieved && !this.human.isSeeker) {
      if (this._compliance.type === 'hurricane') {
        const dist = Phaser.Math.Distance.Between(this.human.x, this.human.y, CIRCLE_X, CIRCLE_Y);
        if (dist >= CIRCLE_R - 15) this._compliance.achieved = true;
      } else if (this._compliance.type === 'wildfire') {
        const dist = Phaser.Math.Distance.Between(this.human.x, this.human.y, this._compliance.startX, this._compliance.startY);
        if (dist > 150) this._compliance.achieved = true;
      }
    }

    // Fruit collection check + bot star chasing
    if (this._phase === PHASE.FRUIT) {
      this.fruitSystem.checkCollections(this.allPlayers);

      // Direct each hider bot to the nearest uncollected star
      const stars = this.fruitSystem._collectibles.filter(c => !c.collected);
      if (stars.length > 0) {
        for (const bot of this.bots) {
          if (bot.isSeeker || bot.isEliminated) continue;
          let nearest = null, nearestDist = Infinity;
          for (const c of stars) {
            const d = Phaser.Math.Distance.Between(bot.x, bot.y, c.x, c.y);
            if (d < nearestDist) { nearestDist = d; nearest = c; }
          }
          if (nearest) {
            bot._hurricaneState = null; // clear stale wildcard state
            bot._target = { x: nearest.x, y: nearest.y };
            bot._state = 'moving';
          }
        }
      } else {
        // All stars collected — send bots back to hide if they're still in/near the circle
        for (const bot of this.bots) {
          if (bot.isSeeker || bot.isEliminated) continue;
          const distToCircle = Phaser.Math.Distance.Between(bot.x, bot.y, CIRCLE_X, CIRCLE_Y);
          const targetInCircle = bot._target &&
            Phaser.Math.Distance.Between(bot._target.x, bot._target.y, CIRCLE_X, CIRCLE_Y) < CIRCLE_R + 10;
          if ((distToCircle < CIRCLE_R + 30 || targetInCircle) && (bot._state === 'idle' || targetInCircle)) {
            bot.goHide();
          }
        }
      }
    }

    // Emit update event for UI
    this.events.emit('tick', {
      gameTime: this._gameTime,
      players: this.allPlayers,
      phase: this._phase,
      reloadPct: Math.max(0, 1 - this._humanReloadTimer / 1500),
      isHumanSeeker: this._seeker === this.human,
    });
  }
}
