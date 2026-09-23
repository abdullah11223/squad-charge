// جدول مستويات الأسلحة والإعدادات العامة للعبة (القسم ٣ و١٠ من المواصفات)

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

// عرض الطريق بوحدات العالم ثلاثي الأبعاد (وليس بكسل)
export const ROAD_WIDTH = 6;
export const ROAD_HALF = ROAD_WIDTH / 2;

export const TOTAL_LEVELS = 25;
export const BOSS_LEVEL_INTERVAL = 5;

export const MAX_IN_LEVEL_WEAPON = 6;
export const MAX_WEAPON = 7;

export const WEAPON_TIERS = [
  { level: 1, name: 'مسدس', nameEn: 'Pistol', damage: 1, color: 0xb0b0b0 },
  { level: 2, name: 'رشاش خفيف', nameEn: 'SMG', damage: 2, color: 0x8ecae6 },
  { level: 3, name: 'بندقية صيد', nameEn: 'Shotgun', damage: 4, color: 0xffb703 },
  { level: 4, name: 'بندقية هجومية', nameEn: 'Rifle', damage: 6, color: 0xfb8500 },
  { level: 5, name: 'رشاش ثقيل', nameEn: 'Minigun', damage: 10, color: 0xe76f51 },
  { level: 6, name: 'قاذفة صواريخ', nameEn: 'RPG', damage: 20, color: 0xe63946 },
  { level: 7, name: 'مدفع ليزر', nameEn: 'Laser', damage: 35, color: 0x9d4edd },
];

export function weaponTier(level) {
  const clamped = clamp(level, 1, WEAPON_TIERS.length);
  return WEAPON_TIERS[clamped - 1];
}

export const DIFFICULTY = {
  enemyCount: (L) => 5 + L * 2,
  enemyDamage: (L) => 1 + Math.floor(L / 3),
  obstacleThreshold: (L) => 6 + L * 4,
  gateGroupCount: (L) => 3 + Math.floor(L / 5),
  harshGateChance: (L) => Math.min(0.25, (L / 25) * 0.25),
};

export const ECONOMY = {
  blueGateCoin: 5,
  obstacleBonusCoin: 15,
  bossBonusCoin: (L) => 100 + L * 10,
  finishBaseCoin: (L) => 20 + L * 5,
  starBonusCoin: 10,
};

export const SHOP_UPGRADES = {
  startingArmy: {
    id: 'startingArmy',
    name: 'زيادة الجيش الابتدائي',
    desc: 'يزيد عدد الجنود اللي تبدأ فيها كل مرحلة',
    maxLevel: 5,
    baseValue: 10,
    perLevel: 5,
    basePrice: 50,
    priceMult: 1.5,
  },
  startingWeapon: {
    id: 'startingWeapon',
    name: 'سلاح ابتدائي أقوى',
    desc: 'تبدأ كل مرحلة بمستوى سلاح أعلى من المسدس',
    maxLevel: 2,
    basePrice: 300,
    priceMult: 1.5,
  },
  laserUnlock: {
    id: 'laserUnlock',
    name: 'مدفع الليزر الأسطوري',
    desc: 'يفتح إمكانية الحصول على المستوى ٧ من بوابات ترقية السلاح',
    maxLevel: 1,
    basePrice: 2000,
    priceMult: 1,
  },
  coinMultiplier: {
    id: 'coinMultiplier',
    name: 'مضاعف العملات',
    desc: 'يزيد العملات المكتسبة من كل محاولة',
    maxLevel: 5,
    baseValue: 1,
    perLevel: 0.2,
    basePrice: 100,
    priceMult: 1.5,
  },
  startingShield: {
    id: 'startingShield',
    name: 'درع البداية',
    desc: 'تبدأ كل مرحلة بشحنة درع تمتص أول ضربة سلبية',
    maxLevel: 1,
    basePrice: 500,
    priceMult: 1,
  },
};

export function shopUpgradePrice(upgradeId, currentLevel) {
  const cfg = SHOP_UPGRADES[upgradeId];
  if (currentLevel >= cfg.maxLevel) return null;
  return Math.round(cfg.basePrice * Math.pow(cfg.priceMult, currentLevel));
}

// ألوان المشهد ثلاثي الأبعاد (Three.js hex numbers)
export const COLORS3D = {
  sky: 0x6fb8e0,
  fog: 0x8fc7e6,
  road: 0x555a72,
  roadLine: 0xe8e8f0,
  rail: 0x8d8f9c,
  armyBody: 0xf3f3f3,
  armyPants: 0x2b2d42,
  skin: 0xffd9b0,
  enemyBody: 0xf3e3d6,
  enemyAccent: 0xe63946,
  bossAccent: 0x6a0f13,
  gateBlue: 0x4361ee,
  gateRed: 0xe63946,
  obstacle: 0x8a5a34,
  obstacleBand: 0x3d2410,
  gold: 0xffd60a,
};

export const STORAGE_KEY = 'squadCharge_save_v1';
