// حفظ وقراءة تقدم اللاعب من localStorage (القسم ٧)

import { STORAGE_KEY, TOTAL_LEVELS } from '../config/GameConfig.js';

function defaultSave() {
  return {
    coins: 0,
    levels: {}, // { [levelNum]: { stars, bestSoldiers } }
    unlockedLevel: 1,
    shop: {
      startingArmy: 0,
      startingWeapon: 0,
      laserUnlock: 0,
      coinMultiplier: 0,
      startingShield: 0,
    },
    settings: { sound: true, music: true },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    const base = defaultSave();
    return {
      ...base,
      ...parsed,
      shop: { ...base.shop, ...(parsed.shop || {}) },
      settings: { ...base.settings, ...(parsed.settings || {}) },
      levels: { ...(parsed.levels || {}) },
    };
  } catch (e) {
    return defaultSave();
  }
}

let state = load();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // تجاهل أخطاء التخزين (مثلاً وضع التصفح الخاص)
  }
}

export const SaveManager = {
  get() {
    return state;
  },

  addCoins(n) {
    state.coins = Math.max(0, Math.round(state.coins + n));
    persist();
    return state.coins;
  },

  spendCoins(n) {
    if (state.coins < n) return false;
    state.coins -= n;
    persist();
    return true;
  },

  completeLevel(levelNum, stars, soldiersLeft) {
    const existing = state.levels[levelNum];
    if (!existing || stars > existing.stars) {
      state.levels[levelNum] = {
        stars,
        bestSoldiers: Math.max(existing ? existing.bestSoldiers : 0, soldiersLeft),
      };
    }
    if (levelNum + 1 > state.unlockedLevel && levelNum + 1 <= TOTAL_LEVELS) {
      state.unlockedLevel = levelNum + 1;
    }
    persist();
  },

  isLevelUnlocked(levelNum) {
    return levelNum <= state.unlockedLevel;
  },

  getLevelStars(levelNum) {
    return state.levels[levelNum] ? state.levels[levelNum].stars : 0;
  },

  getShopLevel(id) {
    return state.shop[id] || 0;
  },

  setShopLevel(id, level) {
    state.shop[id] = level;
    persist();
  },

  getSetting(key) {
    return state.settings[key];
  },

  setSetting(key, value) {
    state.settings[key] = value;
    persist();
  },

  reset() {
    state = defaultSave();
    persist();
  },
};
