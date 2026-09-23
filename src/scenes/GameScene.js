// مشهد اللعب الأساسي — يربط كل الأنظمة سوا (القسم ١١، خطوات ٢-٩)

import { Army } from '../entities/Army.js';
import { EnemyWave } from '../entities/Enemy.js';
import { GateGroup } from '../entities/Gate.js';
import { Obstacle } from '../entities/Obstacle.js';
import { generateLevel } from '../systems/LevelGenerator.js';
import { resolveEngagement, resolveObstacle } from '../systems/CombatResolver.js';
import { SaveManager } from '../systems/SaveManager.js';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  ROAD_LEFT,
  ROAD_RIGHT,
  ROAD_WIDTH,
  ARMY_SCREEN_Y,
  COLORS,
  MAX_IN_LEVEL_WEAPON,
  MAX_WEAPON,
  ECONOMY,
  SHOP_UPGRADES,
  weaponTier,
} from '../config/GameConfig.js';

const BASE_SCROLL_SPEED = 150; // بكسل/ثانية
const OBSTACLE_WARNING_RANGE = 260;

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.level = data.level || 1;
  }

  create() {
    this.buildBackground();

    this.levelData = generateLevel(this.level);

    const shop = SaveManager.get().shop;
    const startArmyCfg = SHOP_UPGRADES.startingArmy;
    const coinCfg = SHOP_UPGRADES.coinMultiplier;

    this.startingCount = startArmyCfg.baseValue + shop.startingArmy * startArmyCfg.perLevel;
    const startingWeaponLevel = 1 + shop.startingWeapon;
    this.hasShield = shop.startingShield > 0;
    this.coinMult = coinCfg.baseValue + shop.coinMultiplier * coinCfg.perLevel;
    this.laserUnlocked = shop.laserUnlock > 0;

    this.distance = 0;
    this.slowUntilMs = 0;
    this.fireRateMult = 1;
    this.mergeDamageMult = 1;
    this.shieldActive = this.hasShield;
    this.totalGained = 0;
    this.totalLost = 0;
    this.coinsThisRun = 0;
    this.finished = false;
    this.paused = false;

    this.army = new Army(this, CANVAS_WIDTH / 2, ARMY_SCREEN_Y, this.startingCount, startingWeaponLevel);

    this.segmentVisuals = this.levelData.segments.map((seg) => this.createSegmentVisual(seg));
    this.finishContainer = this.buildFinishLine();

    this.buildHud();
    this.buildPauseButton();
    this.bindControls();
  }

  // ---------- بناء المشهد ----------

  buildBackground() {
    this.add.rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS.bg).setOrigin(0);
    this.add.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, ROAD_WIDTH, CANVAS_HEIGHT, COLORS.road).setOrigin(0.5);
    this.add.rectangle(ROAD_LEFT - 3, CANVAS_HEIGHT / 2, 6, CANVAS_HEIGHT, COLORS.roadEdge).setOrigin(0.5);
    this.add.rectangle(ROAD_RIGHT + 3, CANVAS_HEIGHT / 2, 6, CANVAS_HEIGHT, COLORS.roadEdge).setOrigin(0.5);

    this.laneMarkSpacing = 140;
    this.laneMarks = [];
    const count = Math.ceil(CANVAS_HEIGHT / this.laneMarkSpacing) + 2;
    for (let i = 0; i < count; i++) {
      const mark = this.add.rectangle(CANVAS_WIDTH / 2, i * this.laneMarkSpacing, 6, 60, COLORS.roadLine, 0.6);
      this.laneMarks.push(mark);
    }
  }

  createSegmentVisual(seg) {
    if (seg.type === 'gateGroup') return new GateGroup(this, seg.y, seg.gates);
    if (seg.type === 'enemyWave') return new EnemyWave(this, seg.y, seg.count, seg.unitDamage, seg.isBoss);
    return new Obstacle(this, seg.y, seg.threshold);
  }

  buildFinishLine() {
    const container = this.add.container(CANVAS_WIDTH / 2, -3000);
    const banner = this.add.rectangle(0, 0, ROAD_WIDTH - 20, 40, 0xffffff, 1);
    const flags = this.add
      .text(0, 0, '🏁 النهاية 🏁', {
        fontSize: '20px',
        fontFamily: 'Tahoma, Arial',
        color: '#111111',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    container.add([banner, flags]);
    return container;
  }

  buildHud() {
    this.gainedText = this.add.text(16, 16, '+0', {
      fontSize: '20px',
      fontFamily: 'Tahoma, Arial',
      color: COLORS.success,
      fontStyle: 'bold',
    });
    this.lostText = this.add
      .text(CANVAS_WIDTH - 16, 16, '-0', {
        fontSize: '20px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.danger,
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);

    this.add
      .text(CANVAS_WIDTH / 2, 16, `المرحلة ${this.level}`, {
        fontSize: '15px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.text,
        fontStyle: 'bold',
        rtl: true,
      })
      .setOrigin(0.5, 0);

    this.progressBarBg = this.add.rectangle(CANVAS_WIDTH / 2, 46, 260, 8, 0x000000, 0.35);
    this.progressBarFill = this.add
      .rectangle(CANVAS_WIDTH / 2 - 130, 46, 0, 8, COLORS.goldNum, 1)
      .setOrigin(0, 0.5);

    this.weaponIcon = this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 34, '', {
        fontSize: '16px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.text,
        fontStyle: 'bold',
        rtl: true,
      })
      .setOrigin(0.5);

    this.obstacleWarning = this.add
      .text(CANVAS_WIDTH / 2, ARMY_SCREEN_Y - 100, '', {
        fontSize: '14px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.danger,
        fontStyle: 'bold',
        rtl: true,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    if (this.shieldActive) {
      this.shieldIcon = this.add.text(16, 44, '🛡️', { fontSize: '20px' });
    }

    this.updateWeaponIcon();
  }

  updateWeaponIcon() {
    const tier = weaponTier(this.army.weaponLevel);
    this.weaponIcon.setText(`🔫 ${tier.name} (Lv${tier.level})`);
  }

  buildPauseButton() {
    const btn = this.add
      .text(CANVAS_WIDTH - 16, 60, '⏸', { fontSize: '26px', color: COLORS.text })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => this.togglePause());
    this.pauseOverlay = null;
  }

  togglePause() {
    if (this.finished) return;
    this.paused = !this.paused;

    if (this.paused) {
      this.pauseOverlay = this.add.container(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      const bg = this.add.rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0x000000, 0.6);
      const title = this.add
        .text(0, -40, 'إيقاف مؤقت', {
          fontSize: '26px',
          fontFamily: 'Tahoma, Arial',
          color: COLORS.text,
          fontStyle: 'bold',
          rtl: true,
        })
        .setOrigin(0.5);
      const resumeBtn = this.add
        .text(0, 20, 'استمرار', {
          fontSize: '20px',
          fontFamily: 'Tahoma, Arial',
          color: COLORS.success,
          fontStyle: 'bold',
          rtl: true,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      resumeBtn.on('pointerdown', () => this.togglePause());
      const menuBtn = this.add
        .text(0, 70, 'القائمة الرئيسية', {
          fontSize: '16px',
          fontFamily: 'Tahoma, Arial',
          color: COLORS.textDim,
          rtl: true,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));

      this.pauseOverlay.add([bg, title, resumeBtn, menuBtn]);
    } else {
      this.pauseOverlay.destroy();
      this.pauseOverlay = null;
    }
  }

  bindControls() {
    this.dragging = false;
    this.input.on('pointerdown', (p) => {
      if (this.paused || this.finished) return;
      this.dragging = true;
      this.dragStartPointerX = p.x;
      this.dragStartArmyX = this.army.x;
    });
    this.input.on('pointermove', (p) => {
      if (!this.dragging || this.paused || this.finished) return;
      const dx = p.x - this.dragStartPointerX;
      this.army.setX(this.dragStartArmyX + dx);
    });
    this.input.on('pointerup', () => {
      this.dragging = false;
    });
    this.input.on('pointerupoutside', () => {
      this.dragging = false;
    });
  }

  // ---------- الحلقة الرئيسية ----------

  update(time, delta) {
    if (this.paused || this.finished) return;

    const dt = delta / 1000;
    const slowed = time < this.slowUntilMs;
    const speedMult = slowed ? 0.45 : 1;
    const deltaPx = BASE_SCROLL_SPEED * speedMult * dt;
    this.distance += deltaPx;

    this.scrollBackground(deltaPx);

    this.segmentVisuals.forEach((visual, idx) => {
      const seg = this.levelData.segments[idx];
      const screenY = ARMY_SCREEN_Y - (seg.y - this.distance);
      visual.setScreenY(screenY);
    });

    this.finishContainer.y = ARMY_SCREEN_Y - (this.levelData.finishY - this.distance);

    this.checkTriggers();
    this.updateProgressBar();
    this.updateObstacleWarning();
  }

  scrollBackground(deltaPx) {
    const wrap = this.laneMarks.length * this.laneMarkSpacing;
    this.laneMarks.forEach((mark) => {
      mark.y += deltaPx;
      if (mark.y > CANVAS_HEIGHT + 40) mark.y -= wrap;
    });
  }

  updateProgressBar() {
    const pct = Phaser.Math.Clamp(this.distance / this.levelData.finishY, 0, 1);
    this.progressBarFill.width = 260 * pct;
  }

  updateObstacleWarning() {
    const upcoming = this.levelData.segments.find(
      (s) => s.type === 'obstacle' && !s.triggered && s.y - this.distance > 0 && s.y - this.distance < OBSTACLE_WARNING_RANGE
    );
    if (upcoming) {
      const ok = this.army.count >= upcoming.threshold;
      this.obstacleWarning.setText(`⚠️ يحتاج ${upcoming.threshold}+ جندي`);
      this.obstacleWarning.setColor(ok ? COLORS.success : COLORS.danger);
      this.obstacleWarning.setAlpha(1);
    } else {
      this.obstacleWarning.setAlpha(0);
    }
  }

  // ---------- التصادم والأحداث ----------

  checkTriggers() {
    this.levelData.segments.forEach((seg, idx) => {
      if (!seg.triggered && seg.y <= this.distance) {
        seg.triggered = true;
        this.resolveSegment(seg, this.segmentVisuals[idx]);
      }
    });

    if (!this.finished && this.levelData.finishY <= this.distance) {
      this.onLevelComplete();
    }
  }

  resolveSegment(seg, visual) {
    if (this.finished) return;
    if (seg.type === 'gateGroup') this.resolveGate(seg, visual);
    else if (seg.type === 'enemyWave') this.resolveEnemy(seg, visual);
    else this.resolveObstacleSeg(seg, visual);
  }

  resolveGate(seg, visual) {
    const gate = visual.gateForX(this.army.x);
    visual.playPassEffect(gate);
    this.applyGateEffect(gate);
  }

  applyGateEffect(gate) {
    switch (gate.type) {
      case 'addPercent': {
        const add = Math.round(this.army.count * gate.value);
        this.army.addCount(add);
        this.registerGain(add);
        break;
      }
      case 'multiply': {
        const newCount = Math.round(this.army.count * gate.value);
        this.registerGain(newCount - this.army.count);
        this.army.setCount(newCount);
        break;
      }
      case 'weaponUp': {
        const cap = this.laserUnlocked ? MAX_WEAPON : MAX_IN_LEVEL_WEAPON;
        this.army.setWeaponLevel(Math.min(cap, this.army.weaponLevel + 1));
        this.updateWeaponIcon();
        break;
      }
      case 'powerMerge': {
        const half = Math.max(1, Math.round(this.army.count / 2));
        const lost = this.consumeLossWithShield(this.army.count - half);
        if (lost) {
          this.registerLoss(lost);
        } else {
          this.army.setCount(half);
        }
        this.mergeDamageMult *= 2;
        break;
      }
      case 'fireRate': {
        this.fireRateMult += gate.value;
        break;
      }
      case 'subPercent': {
        const sub = Math.round(this.army.count * gate.value);
        const lost = this.consumeLossWithShield(sub);
        if (lost) this.registerLoss(lost);
        break;
      }
      case 'divide': {
        const target = Math.max(0, Math.round(this.army.count / gate.value));
        const sub = this.army.count - target;
        const lost = this.consumeLossWithShield(sub);
        if (lost) this.registerLoss(lost);
        break;
      }
      case 'weaponDown': {
        this.army.setWeaponLevel(Math.max(1, this.army.weaponLevel - 1));
        this.updateWeaponIcon();
        break;
      }
      case 'slow': {
        this.applySlow(gate.value);
        break;
      }
      case 'trap': {
        const sub = Math.round(this.army.count * gate.value);
        const lost = this.consumeLossWithShield(sub);
        if (lost) this.registerLoss(lost);
        this.applySlow(gate.extra.slowMs);
        break;
      }
    }

    if (gate.color === 'blue') this.awardCoins(ECONOMY.blueGateCoin);
    this.checkGameOver();
  }

  resolveEnemy(seg, visual) {
    const damage = this.army.damage * this.mergeDamageMult;
    const result = resolveEngagement(this.army.count, damage, seg.count, seg.unitDamage);

    if (result.victory) {
      visual.playDefeatEffect();
      const lost = this.consumeLossWithShield(result.soldiersLost);
      if (lost) this.registerLoss(lost);
      if (seg.isBoss) this.awardCoins(ECONOMY.bossBonusCoin(this.level));
      this.checkGameOver();
      return;
    }

    if (this.shieldActive) {
      this.shieldActive = false;
      this.showShieldBreak();
      visual.playDefeatEffect();
      const survivors = Math.max(1, Math.ceil(this.army.count * 0.5));
      this.registerLoss(this.army.count - survivors);
      this.army.setCount(survivors);
      if (this.shieldIcon) this.shieldIcon.destroy();
      return;
    }

    visual.playDefeatEffect();
    this.registerLoss(this.army.count);
    this.army.setCount(0);
    this.triggerGameOver();
  }

  resolveObstacleSeg(seg, visual) {
    const result = resolveObstacle(this.army.count, seg.threshold, ECONOMY.obstacleBonusCoin);
    visual.playResolveEffect(result.broken);

    if (result.broken) {
      this.awardCoins(result.bonusCoins);
      return;
    }

    const lost = this.consumeLossWithShield(result.soldiersLost);
    if (lost) this.registerLoss(lost);
    this.applySlow(900);
    this.checkGameOver();
  }

  consumeLossWithShield(amount) {
    if (amount <= 0) return 0;
    if (this.shieldActive) {
      this.shieldActive = false;
      this.showShieldBreak();
      if (this.shieldIcon) this.shieldIcon.destroy();
      return 0;
    }
    this.army.setCount(this.army.count - amount);
    this.army.flashHit();
    return amount;
  }

  applySlow(ms) {
    this.slowUntilMs = Math.max(this.slowUntilMs, this.time.now + ms);
  }

  registerGain(n) {
    if (n <= 0) return;
    this.totalGained += n;
    this.gainedText.setText(`+${this.totalGained}`);
  }

  registerLoss(n) {
    if (n <= 0) return;
    this.totalLost += n;
    this.lostText.setText(`-${this.totalLost}`);
  }

  awardCoins(n) {
    const amount = Math.round(n * this.coinMult);
    this.coinsThisRun += amount;
    SaveManager.addCoins(amount);
  }

  showShieldBreak() {
    const txt = this.add
      .text(CANVAS_WIDTH / 2, ARMY_SCREEN_Y - 130, '🛡️ الدرع امتص الضربة!', {
        fontSize: '16px',
        fontFamily: 'Tahoma, Arial',
        color: '#4cc9f0',
        fontStyle: 'bold',
        rtl: true,
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: txt,
      y: txt.y - 30,
      alpha: 0,
      duration: 900,
      onComplete: () => txt.destroy(),
    });
  }

  checkGameOver() {
    if (this.army.count <= 0 && !this.finished) {
      this.triggerGameOver();
    }
  }

  triggerGameOver() {
    if (this.finished) return;
    this.finished = true;
    this.cameras.main.shake(200, 0.01);
    this.time.delayedCall(450, () => {
      this.scene.start('GameOverScene', { result: 'lose', level: this.level });
    });
  }

  onLevelComplete() {
    if (this.finished) return;
    this.finished = true;

    const remaining = this.army.count;
    const ratio = remaining / this.startingCount;
    let stars = 1;
    if (ratio >= 0.6) stars = 3;
    else if (ratio >= 0.3) stars = 2;

    const finishCoins = Math.round(ECONOMY.finishBaseCoin(this.level) * this.coinMult);
    const starCoins = Math.round(stars * ECONOMY.starBonusCoin * this.coinMult);
    SaveManager.addCoins(finishCoins + starCoins);
    this.coinsThisRun += finishCoins + starCoins;

    SaveManager.completeLevel(this.level, stars, remaining);

    this.time.delayedCall(300, () => {
      this.scene.start('GameOverScene', {
        result: 'win',
        level: this.level,
        stars,
        coinsEarned: this.coinsThisRun,
        soldiersLeft: remaining,
      });
    });
  }
}
