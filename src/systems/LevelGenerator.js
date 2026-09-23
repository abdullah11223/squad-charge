// مولّد المراحل — deterministic بالكامل حسب رقم المرحلة (القسم ٦)

import { DIFFICULTY, MAX_IN_LEVEL_WEAPON, BOSS_LEVEL_INTERVAL } from '../config/GameConfig.js';

// مولّد أرقام عشوائي بسيط لكنه ثابت (deterministic) لنفس البذرة (seed)
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// درجة "الضرر" التقريبية لكل نوع بوابة حمراء — تُستخدم لضمان وجود خيار أخف بكل مجموعة
const HARM_SCORE = {
  subPercent: (v) => v, // 0.15 - 0.35
  divide: () => 0.9,
  weaponDown: () => 0.55,
  slow: () => 0.4,
  trap: () => 1.0,
};
const MILD_THRESHOLD = 0.6;

function makeBlueGate(rng) {
  const roll = rng();
  if (roll < 0.08) {
    const value = rng() < 0.5 ? 1.5 : 2;
    return { color: 'blue', type: 'multiply', value, label: `×${value}` };
  }
  if (roll < 0.33) {
    return { color: 'blue', type: 'weaponUp', value: 1, label: '+1 سلاح' };
  }
  if (roll < 0.5) {
    return { color: 'blue', type: 'powerMerge', value: 1, label: 'دمج القوة' };
  }
  if (roll < 0.65) {
    const pct = 20 + Math.round(rng() * 20); // 20-40%
    return { color: 'blue', type: 'fireRate', value: pct / 100, label: `سرعة +${pct}%` };
  }
  const pct = 10 + Math.round(rng() * 20); // 10-30%
  return { color: 'blue', type: 'addPercent', value: pct / 100, label: `+${pct}%` };
}

function makeRedGate(rng, harshChance) {
  const harsh = rng() < harshChance;
  if (harsh) {
    if (rng() < 0.5) {
      const div = rng() < 0.5 ? 2 : 3;
      return { color: 'red', type: 'divide', value: div, label: `÷${div}` };
    }
    const pct = 25 + Math.round(rng() * 10);
    return {
      color: 'red',
      type: 'trap',
      value: pct / 100,
      label: 'فخ!',
      extra: { slowMs: 1200 },
    };
  }
  const roll = rng();
  if (roll < 0.3) {
    return { color: 'red', type: 'weaponDown', value: 1, label: '-1 سلاح' };
  }
  if (roll < 0.55) {
    return { color: 'red', type: 'slow', value: 1500, label: 'تباطؤ' };
  }
  const pct = 15 + Math.round(rng() * 20); // 15-35%
  return { color: 'red', type: 'subPercent', value: pct / 100, label: `-${pct}%` };
}

function ensureMildOption(gates, rng) {
  const scores = gates.map((g) => (g.color === 'blue' ? -1 : HARM_SCORE[g.type](g.value)));
  const allHarsh = scores.every((s) => s >= MILD_THRESHOLD);
  if (allHarsh) {
    let worstIdx = 0;
    for (let i = 1; i < scores.length; i++) if (scores[i] > scores[worstIdx]) worstIdx = i;
    const pct = 15 + Math.round(rng() * 10);
    gates[worstIdx] = { color: 'red', type: 'subPercent', value: pct / 100, label: `-${pct}%` };
  }
}

function buildGateGroup(rng, harshChance, y) {
  const count = rng() < 0.5 ? 2 : 3;
  const gates = [];
  for (let i = 0; i < count; i++) {
    const isBlue = rng() < 0.55;
    gates.push(isBlue ? makeBlueGate(rng) : makeRedGate(rng, harshChance));
  }
  ensureMildOption(gates, rng);
  return { type: 'gateGroup', y, gates, triggered: false };
}

function buildEnemyWave(count, unitDamage, y, isBoss = false) {
  return { type: 'enemyWave', y, count, unitDamage, isBoss, triggered: false };
}

function buildObstacle(threshold, y) {
  return { type: 'obstacle', y, threshold, triggered: false };
}

export function generateLevel(L) {
  const rng = mulberry32(L * 104729 + 12345);

  const totalEnemies = DIFFICULTY.enemyCount(L);
  const enemyDamage = DIFFICULTY.enemyDamage(L);
  const obstacleThreshold = DIFFICULTY.obstacleThreshold(L);
  const gateGroupCount = DIFFICULTY.gateGroupCount(L);
  const harshChance = DIFFICULTY.harshGateChance(L);
  const isBossLevel = L % BOSS_LEVEL_INTERVAL === 0;

  const enemyWaveCount = Math.min(4, 2 + Math.floor(L / 8));
  const perWave = Math.max(2, Math.round(totalEnemies / enemyWaveCount));
  const obstacleCount = L >= 10 ? 2 : 1;

  const kinds = [];
  for (let i = 0; i < gateGroupCount; i++) kinds.push('gate');
  for (let i = 0; i < enemyWaveCount; i++) kinds.push('enemy');
  for (let i = 0; i < obstacleCount; i++) kinds.push('obstacle');

  shuffle(kinds, rng);
  // نبدأ دايمًا بمجموعة بوابات عشان يقدر اللاعب يستعد قبل أول اشتباك
  const firstGateIdx = kinds.indexOf('gate');
  if (firstGateIdx > 0) {
    kinds.splice(firstGateIdx, 1);
    kinds.unshift('gate');
  }

  // "y" هنا مسافة بوحدات العالم ثلاثي الأبعاد (محور Z) وليست بكسل
  const segments = [];
  let y = 18;

  for (const kind of kinds) {
    y += 9.5 + rng() * 5.5;
    if (kind === 'gate') {
      segments.push(buildGateGroup(rng, harshChance, y));
    } else if (kind === 'enemy') {
      segments.push(buildEnemyWave(perWave, enemyDamage, y));
    } else {
      segments.push(buildObstacle(obstacleThreshold, y));
    }
  }

  if (isBossLevel) {
    y += 14;
    segments.push(buildEnemyWave(totalEnemies * 2, enemyDamage * 3, y, true));
  }

  y += 13;
  const finishY = y;

  return {
    level: L,
    segments,
    finishY,
    meta: {
      totalEnemies,
      enemyDamage,
      obstacleThreshold,
      isBossLevel,
      maxWeaponFromGates: MAX_IN_LEVEL_WEAPON,
    },
  };
}
