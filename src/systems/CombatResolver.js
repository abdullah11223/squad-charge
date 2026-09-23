// معادلات الاشتباك والعوائق (القسم ٢ و٥ من المواصفات)

export function resolveEngagement(armyCount, weaponDamage, enemyCount, enemyUnitDamage) {
  const armyPower = armyCount * weaponDamage;
  const enemyPower = enemyCount * enemyUnitDamage;

  if (armyPower > enemyPower) {
    const soldiersLost = Math.min(armyCount, Math.ceil(enemyPower / weaponDamage));
    return {
      victory: true,
      soldiersLost,
      armyCountAfter: armyCount - soldiersLost,
    };
  }

  return {
    victory: false,
    soldiersLost: armyCount,
    armyCountAfter: 0,
  };
}

export function resolveObstacle(armyCount, threshold, bonusCoins) {
  if (armyCount >= threshold) {
    return {
      broken: true,
      soldiersLost: 0,
      armyCountAfter: armyCount,
      bonusCoins,
      slowed: false,
    };
  }

  const soldiersLost = Math.max(1, Math.ceil((threshold - armyCount) * 0.5));
  const armyCountAfter = Math.max(0, armyCount - soldiersLost);

  return {
    broken: false,
    soldiersLost,
    armyCountAfter,
    bonusCoins: 0,
    slowed: true,
  };
}
