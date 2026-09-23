// كيان مجموعة البوابات — ٢-٣ بوابات جنب بعض، اللاعب يمر من وحدة والبقية تختفي (القسم ٤)

import { CANVAS_WIDTH, ROAD_LEFT, ROAD_WIDTH, COLORS } from '../config/GameConfig.js';

const ICONS = {
  addPercent: '➕',
  multiply: '✖️',
  weaponUp: '🔫',
  powerMerge: '🔗',
  fireRate: '⚡',
  subPercent: '➖',
  divide: '➗',
  weaponDown: '💢',
  slow: '🐢',
  trap: '💀',
};

export class GateGroup {
  constructor(scene, worldY, gates) {
    this.scene = scene;
    this.worldY = worldY;
    this.gates = gates;
    this.triggered = false;

    this.container = scene.add.container(0, -2000);
    this.slots = [];

    const n = gates.length;
    const slotWidth = ROAD_WIDTH / n;

    gates.forEach((gate, i) => {
      const x0 = ROAD_LEFT + slotWidth * i;
      const x1 = x0 + slotWidth;
      const cx = x0 + slotWidth / 2;
      const color = gate.color === 'blue' ? COLORS.gateBlue : COLORS.gateRed;

      const box = scene.add.graphics();
      box.fillStyle(color, 0.85);
      box.fillRoundedRect(cx - slotWidth / 2 + 6, -72, slotWidth - 12, 144, 12);
      box.lineStyle(3, 0xffffff, 0.55);
      box.strokeRoundedRect(cx - slotWidth / 2 + 6, -72, slotWidth - 12, 144, 12);

      const icon = scene.add
        .text(cx, -30, ICONS[gate.type] || '❓', { fontSize: '28px' })
        .setOrigin(0.5);
      const label = scene.add
        .text(cx, 18, gate.label, {
          fontSize: '15px',
          fontFamily: 'Tahoma, Arial',
          color: '#ffffff',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5);

      this.container.add([box, icon, label]);
      this.slots.push({ x0, x1, box, icon, label, gate });
    });
  }

  setScreenY(y) {
    this.container.y = y;
  }

  gateForX(worldX) {
    for (const s of this.slots) {
      if (worldX >= s.x0 && worldX < s.x1) return s.gate;
    }
    if (worldX < this.slots[0].x0) return this.slots[0].gate;
    return this.slots[this.slots.length - 1].gate;
  }

  playPassEffect(chosenGate) {
    this.slots.forEach((s) => {
      const isChosen = s.gate === chosenGate;
      this.scene.tweens.add({
        targets: [s.box, s.icon, s.label],
        alpha: 0,
        scale: isChosen ? 1.3 : 0.8,
        duration: 220,
      });
    });
    this.scene.time.delayedCall(240, () => this.destroy());
  }

  destroy() {
    this.container.destroy();
  }
}
