// المتحكم الرئيسي بمشهد اللعب ثلاثي الأبعاد — يربط كل الأنظمة سوا (القسم ١١)

import * as THREE from 'three';
import { createThreeScene } from './ThreeSetup.js';
import { RoadBuilder } from './RoadBuilder.js';
import { ArmyMesh } from './ArmyMesh.js';
import { EnemyWaveMesh } from './EnemyWaveMesh.js';
import { GateMesh } from './GateMesh.js';
import { ObstacleMesh } from './ObstacleMesh.js';
import { FinishMesh } from './FinishMesh.js';
import { muzzleFlashTracers, impactBurst, sparkleBurst, punchScale, createShaker } from './VFX.js';
import { generateLevel } from '../systems/LevelGenerator.js';
import { resolveEngagement, resolveObstacle } from '../systems/CombatResolver.js';
import { SaveManager } from '../systems/SaveManager.js';
import {
  ROAD_HALF,
  MAX_IN_LEVEL_WEAPON,
  MAX_WEAPON,
  ECONOMY,
  SHOP_UPGRADES,
  weaponTier,
  clamp,
} from '../config/GameConfig.js';

const BASE_SCROLL_SPEED = 3.1; // وحدات عالم/ثانية
const CAMERA_HEIGHT = 3.4;
const CAMERA_BACK_OFFSET = 4.6;
const OBSTACLE_WARNING_RANGE = 5.5;
const DRAG_SENSITIVITY = 0.013;

export class GamePlay {
  constructor(root, level, callbacks) {
    this.root = root;
    this.level = level;
    this.callbacks = callbacks;
    this.build();
  }

  build() {
    this.root.innerHTML = `
      <div class="gp-canvas"></div>
      <div class="gp-hud">
        <div class="gp-counter gp-counter--gain" id="gp-gain">+0</div>
        <div class="gp-counter gp-counter--loss" id="gp-loss">-0</div>
        <div class="gp-top-center">
          <div class="gp-level-label">المرحلة ${this.level}</div>
          <div class="gp-progress"><div class="gp-progress__fill" id="gp-progress-fill"></div></div>
        </div>
        <button class="gp-pause-btn" id="gp-pause-btn" aria-label="إيقاف مؤقت">❚❚</button>
        <div class="gp-obstacle-warning" id="gp-obstacle-warning"></div>
        <div class="gp-weapon-tag" id="gp-weapon-tag"></div>
        <div class="gp-shield" id="gp-shield">🛡️</div>
      </div>
      <div class="gp-pause-overlay hidden" id="gp-pause-overlay">
        <div class="gp-panel">
          <h2>إيقاف مؤقت</h2>
          <button class="gp-btn gp-btn--primary" id="gp-resume-btn">استمرار</button>
          <button class="gp-btn gp-btn--ghost" id="gp-menu-btn">القائمة الرئيسية</button>
        </div>
      </div>
    `;

    this.canvasContainer = this.root.querySelector('.gp-canvas');
    this.el = {
      gain: this.root.querySelector('#gp-gain'),
      loss: this.root.querySelector('#gp-loss'),
      progressFill: this.root.querySelector('#gp-progress-fill'),
      pauseBtn: this.root.querySelector('#gp-pause-btn'),
      obstacleWarning: this.root.querySelector('#gp-obstacle-warning'),
      weaponTag: this.root.querySelector('#gp-weapon-tag'),
      shield: this.root.querySelector('#gp-shield'),
      pauseOverlay: this.root.querySelector('#gp-pause-overlay'),
      resumeBtn: this.root.querySelector('#gp-resume-btn'),
      menuBtn: this.root.querySelector('#gp-menu-btn'),
    };

    const { scene, camera, renderer, resizeObserver } = createThreeScene(this.canvasContainer);
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.resizeObserver = resizeObserver;
    this.shaker = createShaker();

    this.road = new RoadBuilder(scene);

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
    this.mergeDamageMult = 1;
    this.shieldActive = this.hasShield;
    this.totalGained = 0;
    this.totalLost = 0;
    this.coinsThisRun = 0;
    this.finished = false;
    this.paused = false;

    this.army = new ArmyMesh(scene, this.startingCount, startingWeaponLevel);
    this.army.setZ(0);
    this.camX = 0;

    this.segmentVisuals = this.levelData.segments.map((seg) => this.createSegmentVisual(seg));
    this.finishVisual = new FinishMesh(scene);

    this.el.shield.style.display = this.shieldActive ? 'flex' : 'none';
    this.updateWeaponTag();

    this.bindControls();
    this.bindButtons();

    this.clock = new THREE.Clock();
    this._loop = this.loop.bind(this);
    this.rafId = requestAnimationFrame(this._loop);
  }

  createSegmentVisual(seg) {
    if (seg.type === 'gateGroup') return new GateMesh(this.scene, seg.y, seg.gates);
    if (seg.type === 'enemyWave') return new EnemyWaveMesh(this.scene, seg.y, seg.count, seg.unitDamage, seg.isBoss);
    return new ObstacleMesh(this.scene, seg.y, seg.threshold);
  }

  updateWeaponTag() {
    const tier = weaponTier(this.army.weaponLevel);
    this.el.weaponTag.textContent = `🔫 ${tier.name} (Lv${tier.level})`;
  }

  bindControls() {
    this.dragging = false;
    const el = this.renderer.domElement;
    el.style.touchAction = 'none';

    const down = (x) => {
      if (this.paused || this.finished) return;
      this.dragging = true;
      this.dragStartX = x;
      this.dragStartArmyX = this.army.x;
    };
    const move = (x) => {
      if (!this.dragging || this.paused || this.finished) return;
      const dx = x - this.dragStartX;
      this.army.setX(this.dragStartArmyX + dx * DRAG_SENSITIVITY);
    };
    const up = () => {
      this.dragging = false;
    };

    this.onPointerDown = (e) => down(e.clientX);
    this.onPointerMove = (e) => move(e.clientX);
    this.onPointerUp = () => up();

    el.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  bindButtons() {
    this.el.pauseBtn.addEventListener('click', () => this.togglePause());
    this.el.resumeBtn.addEventListener('click', () => this.togglePause());
    this.el.menuBtn.addEventListener('click', () => this.exitToMenu());
  }

  togglePause() {
    if (this.finished) return;
    this.paused = !this.paused;
    this.el.pauseOverlay.classList.toggle('hidden', !this.paused);
    if (!this.paused) this.clock.getDelta();
  }

  exitToMenu() {
    this.destroy();
    this.callbacks.onExitToMenu();
  }

  // ---------- الحلقة الرئيسية ----------

  loop() {
    if (this.destroyed) return;
    this.rafId = requestAnimationFrame(this._loop);

    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (!this.paused && !this.finished) {
      this.update(dt);
    }
    this.renderer.render(this.scene, this.camera);
  }

  update(dt) {
    const nowMs = performance.now();
    const slowed = nowMs < this.slowUntilMs;
    const speedMult = slowed ? 0.45 : 1;
    const deltaDist = BASE_SCROLL_SPEED * speedMult * dt;
    this.distance += deltaDist;

    this.road.update(this.distance);
    this.army.update(dt);

    this.segmentVisuals.forEach((visual, idx) => {
      const seg = this.levelData.segments[idx];
      visual.setZ(-(seg.y - this.distance));
      if (visual.update) visual.update(dt);
    });
    this.finishVisual.setZ(-(this.levelData.finishY - this.distance));

    this.updateCamera();
    this.checkTriggers();
    this.updateProgressBar();
    this.updateObstacleWarning();
  }

  updateCamera() {
    const targetX = this.army.x;
    this.camX += (targetX - this.camX) * 0.12;
    this.camera.position.x = this.camX + this.shaker.state.x;
    this.camera.position.y = CAMERA_HEIGHT + this.shaker.state.y;
    this.camera.position.z = this.army.z + CAMERA_BACK_OFFSET;
    this.camera.lookAt(this.camX * 0.4, 1.1, this.army.z - 7);
  }

  updateProgressBar() {
    const pct = clamp(this.distance / this.levelData.finishY, 0, 1);
    this.el.progressFill.style.width = `${pct * 100}%`;
  }

  updateObstacleWarning() {
    const upcoming = this.levelData.segments.find(
      (s) => s.type === 'obstacle' && !s.triggered && s.y - this.distance > 0 && s.y - this.distance < OBSTACLE_WARNING_RANGE
    );
    if (upcoming) {
      const ok = this.army.count >= upcoming.threshold;
      this.el.obstacleWarning.textContent = `⚠️ يحتاج ${upcoming.threshold}+ جندي`;
      this.el.obstacleWarning.classList.toggle('ok', ok);
      this.el.obstacleWarning.classList.toggle('danger', !ok);
      this.el.obstacleWarning.style.opacity = '1';
    } else {
      this.el.obstacleWarning.style.opacity = '0';
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
    if (gate.color === 'blue') {
      sparkleBurst(this.scene, new THREE.Vector3(this.army.x, 0.6, this.army.z), 0x66d1ff);
    } else {
      impactBurst(this.scene, new THREE.Vector3(this.army.x, 0.6, this.army.z), 0xe63946);
    }
    this.applyGateEffect(gate);
    punchScale(this.army.group, 1.15, 0.25);
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
        this.updateWeaponTag();
        break;
      }
      case 'powerMerge': {
        const half = Math.max(1, Math.round(this.army.count / 2));
        const lost = this.consumeLossWithShield(this.army.count - half);
        if (!lost) this.army.setCount(half);
        else this.registerLoss(lost);
        this.mergeDamageMult *= 2;
        break;
      }
      case 'fireRate':
        break;
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
        this.updateWeaponTag();
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

    const fromPos = new THREE.Vector3(this.army.x, 0.9, this.army.z);
    const toPos = new THREE.Vector3(this.army.x, 0.9, visual.group.position.z);
    muzzleFlashTracers(this.scene, fromPos, toPos, seg.isBoss ? 14 : 8);

    if (result.victory) {
      setTimeout(() => impactBurst(this.scene, toPos, 0xffcc55), 90);
      visual.playDefeatEffect();
      const lost = this.consumeLossWithShield(result.soldiersLost);
      if (lost) {
        this.registerLoss(lost);
        this.army.flashHit();
      }
      if (seg.isBoss) this.awardCoins(ECONOMY.bossBonusCoin(this.level));
      this.checkGameOver();
      return;
    }

    if (this.shieldActive) {
      this.shieldActive = false;
      this.showShieldBreak();
      this.el.shield.style.display = 'none';
      setTimeout(() => impactBurst(this.scene, toPos, 0xffcc55), 90);
      visual.playDefeatEffect();
      const survivors = Math.max(1, Math.ceil(this.army.count * 0.5));
      this.registerLoss(this.army.count - survivors);
      this.army.setCount(survivors);
      this.army.flashHit();
      return;
    }

    visual.playDefeatEffect();
    this.army.flashHit();
    this.registerLoss(this.army.count);
    this.army.setCount(0);
    this.shaker.trigger(0.25, 0.4);
    this.triggerGameOver();
  }

  resolveObstacleSeg(seg, visual) {
    const result = resolveObstacle(this.army.count, seg.threshold, ECONOMY.obstacleBonusCoin);
    visual.playResolveEffect(result.broken);

    if (result.broken) {
      impactBurst(this.scene, new THREE.Vector3(this.army.x, 0.6, visual.group.position.z), 0x8a5a34);
      this.awardCoins(result.bonusCoins);
      punchScale(this.army.group, 1.1, 0.2);
      return;
    }

    const lost = this.consumeLossWithShield(result.soldiersLost);
    if (lost) {
      this.registerLoss(lost);
      this.army.flashHit();
    }
    this.applySlow(900);
    this.shaker.trigger(0.12, 0.25);
    this.checkGameOver();
  }

  consumeLossWithShield(amount) {
    if (amount <= 0) return 0;
    if (this.shieldActive) {
      this.shieldActive = false;
      this.showShieldBreak();
      this.el.shield.style.display = 'none';
      return 0;
    }
    this.army.setCount(this.army.count - amount);
    return amount;
  }

  applySlow(ms) {
    this.slowUntilMs = Math.max(this.slowUntilMs, performance.now() + ms);
  }

  registerGain(n) {
    if (n <= 0) return;
    this.totalGained += n;
    this.el.gain.textContent = `+${this.totalGained}`;
    this.pulse(this.el.gain);
  }

  registerLoss(n) {
    if (n <= 0) return;
    this.totalLost += n;
    this.el.loss.textContent = `-${this.totalLost}`;
    this.pulse(this.el.loss);
  }

  pulse(el) {
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
  }

  awardCoins(n) {
    const amount = Math.round(n * this.coinMult);
    this.coinsThisRun += amount;
    SaveManager.addCoins(amount);
  }

  showShieldBreak() {
    // نبضة بصرية بسيطة على أيقونة الدرع بالـHUD
    this.el.shield.classList.add('shield-break');
    setTimeout(() => {
      this.el.shield.style.display = 'none';
    }, 260);
  }

  checkGameOver() {
    if (this.army.count <= 0 && !this.finished) {
      this.shaker.trigger(0.2, 0.35);
      this.triggerGameOver();
    }
  }

  triggerGameOver() {
    if (this.finished) return;
    this.finished = true;
    setTimeout(() => {
      this.destroy();
      this.callbacks.onGameOver({ level: this.level });
    }, 500);
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
    sparkleBurst(this.scene, new THREE.Vector3(this.army.x, 1, this.army.z), 0xffd60a, 24);

    setTimeout(() => {
      this.destroy();
      this.callbacks.onLevelComplete({
        level: this.level,
        stars,
        coinsEarned: this.coinsThisRun,
        soldiersLeft: remaining,
      });
    }, 500);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.renderer.dispose();
  }
}
