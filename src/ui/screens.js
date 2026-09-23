// كل شاشات الواجهة (منيو، مستويات، متجر، نتيجة) — HTML/CSS عادي، بدون أي محرك رسوم

import { SaveManager } from '../systems/SaveManager.js';
import { SHOP_UPGRADES, shopUpgradePrice, TOTAL_LEVELS, BOSS_LEVEL_INTERVAL } from '../config/GameConfig.js';
import { GamePlay } from '../game/GamePlay.js';

export class Screens {
  constructor(root) {
    this.root = root;
    this.currentGame = null;
  }

  destroyGame() {
    if (this.currentGame) {
      this.currentGame.destroy();
      this.currentGame = null;
    }
  }

  menu() {
    this.destroyGame();
    const save = SaveManager.get();
    this.root.innerHTML = `
      <div class="screen menu-screen">
        <div class="coin-badge">🪙 <span id="coin-val">${save.coins}</span></div>
        <h1 class="menu-title">زحف الفرقة</h1>
        <div class="menu-subtitle">SQUAD CHARGE</div>
        <div class="menu-buttons">
          <button class="gbtn gbtn--primary" id="btn-play">ابدأ اللعب</button>
          <button class="gbtn" id="btn-levels">قائمة المستويات</button>
          <button class="gbtn" id="btn-shop">المتجر</button>
          <button class="gbtn" id="btn-settings">الإعدادات</button>
        </div>
      </div>
    `;
    this.root.querySelector('#btn-play').addEventListener('click', () => {
      this.startLevel(SaveManager.get().unlockedLevel);
    });
    this.root.querySelector('#btn-levels').addEventListener('click', () => this.levelSelect());
    this.root.querySelector('#btn-shop').addEventListener('click', () => this.shop());
    this.root.querySelector('#btn-settings').addEventListener('click', () => this.settings());
  }

  settings() {
    const overlay = document.createElement('div');
    overlay.className = 'gp-pause-overlay';
    overlay.innerHTML = `
      <div class="gp-panel">
        <h2>الإعدادات</h2>
        <button class="gp-btn gp-btn--primary" id="s-sound">🔊 الصوت: ${SaveManager.getSetting('sound') ? 'مفعل' : 'متوقف'}</button>
        <button class="gp-btn gp-btn--primary" id="s-music">🎵 الموسيقى: ${SaveManager.getSetting('music') ? 'مفعلة' : 'متوقفة'}</button>
        <button class="gp-btn gp-btn--ghost" id="s-close">إغلاق</button>
      </div>
    `;
    this.root.appendChild(overlay);
    const soundBtn = overlay.querySelector('#s-sound');
    const musicBtn = overlay.querySelector('#s-music');
    soundBtn.addEventListener('click', () => {
      SaveManager.setSetting('sound', !SaveManager.getSetting('sound'));
      soundBtn.textContent = `🔊 الصوت: ${SaveManager.getSetting('sound') ? 'مفعل' : 'متوقف'}`;
    });
    musicBtn.addEventListener('click', () => {
      SaveManager.setSetting('music', !SaveManager.getSetting('music'));
      musicBtn.textContent = `🎵 الموسيقى: ${SaveManager.getSetting('music') ? 'مفعلة' : 'متوقفة'}`;
    });
    overlay.querySelector('#s-close').addEventListener('click', () => overlay.remove());
  }

  levelSelect() {
    this.destroyGame();
    let cells = '';
    for (let level = 1; level <= TOTAL_LEVELS; level++) {
      const unlocked = SaveManager.isLevelUnlocked(level);
      const stars = SaveManager.getLevelStars(level);
      const isBoss = level % BOSS_LEVEL_INTERVAL === 0;
      const cls = ['level-cell'];
      if (!unlocked) cls.push('locked');
      else if (isBoss) cls.push('boss');
      cells += `
        <button class="${cls.join(' ')}" data-level="${level}" ${unlocked ? '' : 'disabled'}>
          ${unlocked ? `<span class="num">${level}</span><span class="stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>` : '<span class="num">🔒</span>'}
        </button>
      `;
    }
    this.root.innerHTML = `
      <div class="screen">
        <button class="back-btn" id="btn-back">رجوع ›</button>
        <div class="level-select-title">اختر المرحلة</div>
        <div class="level-grid">${cells}</div>
      </div>
    `;
    this.root.querySelector('#btn-back').addEventListener('click', () => this.menu());
    this.root.querySelectorAll('.level-cell:not(.locked)').forEach((btn) => {
      btn.addEventListener('click', () => this.startLevel(Number(btn.dataset.level)));
    });
  }

  shop() {
    this.destroyGame();
    const save = SaveManager.get();
    let rows = '';
    Object.values(SHOP_UPGRADES).forEach((cfg) => {
      const curLevel = SaveManager.getShopLevel(cfg.id);
      const price = shopUpgradePrice(cfg.id, curLevel);
      const afford = price !== null && save.coins >= price;
      rows += `
        <div class="shop-row">
          <div class="shop-row__info">
            <div class="shop-row__title">${cfg.name}</div>
            <div class="shop-row__desc">${cfg.desc}</div>
            <div class="shop-row__level">المستوى: ${curLevel}/${cfg.maxLevel}</div>
          </div>
          <button class="shop-row__buy" data-id="${cfg.id}" ${price === null || !afford ? 'disabled' : ''}>
            ${price === null ? 'مكتمل' : `${price} 🪙`}
          </button>
        </div>
      `;
    });
    this.root.innerHTML = `
      <div class="screen">
        <button class="back-btn" id="btn-back">رجوع ›</button>
        <div class="shop-title">المتجر</div>
        <div class="coin-badge" style="position:static;margin:8px 0 4px;">🪙 ${save.coins}</div>
        <div class="shop-list">${rows}</div>
      </div>
    `;
    this.root.querySelector('#btn-back').addEventListener('click', () => this.menu());
    this.root.querySelectorAll('.shop-row__buy').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const curLevel = SaveManager.getShopLevel(id);
        const price = shopUpgradePrice(id, curLevel);
        if (price === null) return;
        if (SaveManager.spendCoins(price)) {
          SaveManager.setShopLevel(id, curLevel + 1);
          this.shop();
        }
      });
    });
  }

  startLevel(level) {
    this.destroyGame();
    this.root.innerHTML = `<div class="screen game-screen" id="game-root"></div>`;
    const gameRoot = this.root.querySelector('#game-root');
    this.currentGame = new GamePlay(gameRoot, level, {
      onExitToMenu: () => this.menu(),
      onGameOver: ({ level }) => this.result({ result: 'lose', level }),
      onLevelComplete: (data) => this.result({ result: 'win', ...data }),
    });
  }

  result(data) {
    this.destroyGame();
    const isWin = data.result === 'win';
    if (isWin) {
      const isLast = data.level >= TOTAL_LEVELS;
      const starStr = '⭐'.repeat(data.stars) + '☆'.repeat(3 - data.stars);
      this.root.innerHTML = `
        <div class="screen result-screen">
          <div class="result-title win">🎉 المرحلة اكتملت!</div>
          <div class="result-stars">${starStr}</div>
          <div class="result-sub">الجنود المتبقين: ${data.soldiersLeft}</div>
          <div class="result-coins">🪙 العملات المكتسبة: ${data.coinsEarned}</div>
          ${isLast ? '' : '<button class="gbtn gbtn--primary" id="btn-next">التالي ›</button>'}
          <button class="gbtn" id="btn-retry">إعادة المحاولة</button>
          <button class="gbtn gbtn--ghost" id="btn-menu">القائمة الرئيسية</button>
        </div>
      `;
      if (!isLast) {
        this.root.querySelector('#btn-next').addEventListener('click', () => this.startLevel(data.level + 1));
      }
    } else {
      this.root.innerHTML = `
        <div class="screen result-screen">
          <div class="result-title lose">💀 انتهت المحاولة</div>
          <div class="result-sub" style="margin-top:10px;">جيشك انهزم بالكامل</div>
          <button class="gbtn gbtn--primary" id="btn-retry" style="margin-top:26px;">إعادة المحاولة</button>
          <button class="gbtn gbtn--ghost" id="btn-menu">القائمة الرئيسية</button>
        </div>
      `;
    }
    this.root.querySelector('#btn-retry').addEventListener('click', () => this.startLevel(data.level));
    this.root.querySelector('#btn-menu').addEventListener('click', () => this.menu());
  }
}
